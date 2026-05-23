import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchCompanies, JarsApiError, JarsKeyError } from './searchCompanies';

const SAMPLE = {
  code: '305725297',
  address: 'Šiauliai, Vytauto g. 147-18, LT-76341',
  beneficiaries: [],
  formationDate: '2026-01-16T00:00:00.000Z',
  legalForm: 'Mažoji bendrija',
  legalFormCode: '960',
  name: 'MB ELYSIUM REFINED LIVING',
  registrationDate: '2021-03-30T00:00:00.000Z',
  status: 'ACTIVE',
  updatedAt: '2026-05-20T06:20:15.099Z',
  pvmCode: 'LT100013958013',
  pvmRegistered: true,
  pvmRegistrationDate: '2021-04-22T00:00:00.000Z',
  evrkId: '3dccf818-6218-45df-a12c-bb335ad0997f',
  evrkName: 'Naujų pastatų statyba',
  evrkSection: 'F',
  pvmDataHash: 'd1d3847fa828174d2a5ca030c2374439',
};

describe('searchCompanies', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('when api key empty, then throws JarsKeyError without network call', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(searchCompanies({ apiKey: '', query: 'maxima' })).rejects.toBeInstanceOf(JarsKeyError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('when query empty after trim, then throws and does not fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(searchCompanies({ apiKey: 'jars_x', query: '   ' })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('when valid response, then returns parsed companies with required fields', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ companies: [SAMPLE] }),
    }));

    const result = await searchCompanies({ apiKey: 'jars_key', query: 'elysium' });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      code: '305725297',
      name: 'MB ELYSIUM REFINED LIVING',
      address: 'Šiauliai, Vytauto g. 147-18, LT-76341',
      vatCode: 'LT100013958013',
    });
  });

  it('when company status present, then forwards status field', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ companies: [{ ...SAMPLE, status: 'BANKRUPT' }] }),
    }));

    const result = await searchCompanies({ apiKey: 'jars_key', query: 'x' });
    expect(result[0]?.status).toBe('BANKRUPT');
  });

  it('when response without pvmCode, then vatCode is undefined', async () => {
    const { pvmCode: _omit, ...rest } = SAMPLE;
    void _omit;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ companies: [rest] }),
    }));

    const result = await searchCompanies({ apiKey: 'jars_key', query: 'x' });
    expect(result[0]?.vatCode).toBeUndefined();
  });

  it('when sending request, then proxies via corsproxy.io with x-api-key header and url-encoded q', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ companies: [] }) });
    vi.stubGlobal('fetch', fetchMock);

    await searchCompanies({ apiKey: 'jars_abc', query: 'UAB Pavyzdys' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://corsproxy.io/?https://api.jars.lt/api/v1/companies/search?q=UAB+Pavyzdys');
    expect(init).toMatchObject({
      method: 'GET',
      headers: { 'x-api-key': 'jars_abc' },
    });
  });

  it('when api returns 401, then throws JarsKeyError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 401, statusText: 'Unauthorized', json: async () => ({}),
    }));

    await expect(searchCompanies({ apiKey: 'bad', query: 'x' })).rejects.toBeInstanceOf(JarsKeyError);
  });

  it('when api returns 403, then throws JarsKeyError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 403, statusText: 'Forbidden', json: async () => ({}),
    }));

    await expect(searchCompanies({ apiKey: 'bad', query: 'x' })).rejects.toBeInstanceOf(JarsKeyError);
  });

  it('when api returns 429, then throws JarsApiError with quota message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 429, statusText: 'Too Many Requests', json: async () => ({}),
    }));

    await expect(searchCompanies({ apiKey: 'jars_x', query: 'x' })).rejects.toThrow(JarsApiError);
  });

  it('when api returns 500, then throws JarsApiError with status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 500, statusText: 'Server Error', json: async () => ({ message: 'boom' }),
    }));

    await expect(searchCompanies({ apiKey: 'jars_x', query: 'x' })).rejects.toThrow('boom');
  });

  it('when response shape invalid, then throws JarsApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ unexpected: true }),
    }));

    await expect(searchCompanies({ apiKey: 'jars_x', query: 'x' })).rejects.toBeInstanceOf(JarsApiError);
  });
});
