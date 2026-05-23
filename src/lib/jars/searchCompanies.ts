import { z } from 'zod';

const JARS_ENDPOINT = 'https://corsproxy.io/?https://api.jars.lt/api/v1/companies/search';

const RawCompanySchema = z
  .object({
    code: z.string(),
    name: z.string(),
    address: z.string().optional().default(''),
    pvmCode: z.string().optional(),
    status: z.string().optional(),
  })
  .passthrough();

const RawResponseSchema = z.object({
  companies: z.array(RawCompanySchema),
});

export interface JarsCompany {
  code: string;
  name: string;
  address: string;
  vatCode?: string;
  status?: string;
}

export interface SearchCompaniesParams {
  apiKey: string;
  query: string;
}

export class JarsKeyError extends Error {
  constructor(message = 'Patikrinkite Jars API raktą Nustatymuose.') {
    super(message);
    this.name = 'JarsKeyError';
  }
}

export class JarsApiError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'JarsApiError';
    this.status = status;
  }
}

function toJarsCompany(raw: z.infer<typeof RawCompanySchema>): JarsCompany {
  return {
    code: raw.code,
    name: raw.name,
    address: raw.address,
    vatCode: raw.pvmCode,
    status: raw.status,
  };
}

async function readErrorMessage(response: Response): Promise<string | undefined> {
  const data = await response.json().catch(() => null);
  if (!data || typeof data !== 'object') return undefined;
  const message = (data as { message?: unknown }).message;
  return typeof message === 'string' ? message : undefined;
}

async function failFromResponse(response: Response): Promise<never> {
  if (response.status === 401 || response.status === 403) throw new JarsKeyError();
  if (response.status === 429) {
    throw new JarsApiError('Jars API: viršyta užklausų kvota. Bandykite vėliau.', 429);
  }
  const message = await readErrorMessage(response);
  throw new JarsApiError(
    message ?? `Jars API klaida: ${response.status} ${response.statusText}`,
    response.status,
  );
}

export async function searchCompanies(params: SearchCompaniesParams): Promise<JarsCompany[]> {
  const apiKey = params.apiKey.trim();
  if (apiKey.length === 0) throw new JarsKeyError('Jars API raktas nenustatytas.');

  const query = params.query.trim();
  if (query.length === 0) {
    throw new JarsApiError('Įveskite paieškos užklausą.');
  }

  const url = `${JARS_ENDPOINT}?q=${encodeURIComponent(query).replace(/%20/g, '+')}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'x-api-key': apiKey },
  });

  if (!response.ok) await failFromResponse(response);

  const json = await response.json().catch(() => null);
  const parsed = RawResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new JarsApiError('Jars API grąžino netinkamą atsakymą.');
  }
  return parsed.data.companies.map(toJarsCompany);
}
