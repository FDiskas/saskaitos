import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { request as httpsRequest } from 'node:https';
import { z } from 'zod';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const METADATA_URL = 'https://fonts.google.com/metadata/fonts';
const CSS_URL = 'https://fonts.googleapis.com/css2';
const REQUIRED_SUBSET = 'latin-ext';
const REQUIRED_WEIGHTS = [400, 700] as const;
const CONCURRENCY = 12;
const OUTPUT = resolve(SCRIPT_DIR, '../src/lib/pdf/google-fonts-catalog.json');

const MetadataFamily = z.object({
  family: z.string(),
  subsets: z.array(z.string()),
  fonts: z.record(z.unknown()),
});
const Metadata = z.object({
  familyMetadataList: z.array(MetadataFamily),
});

interface CatalogEntry {
  family: string;
  subsets: string[];
  files: { 400: string; 700: string };
}

function httpsGet(url: string, headers: Record<string, string> = {}): Promise<string> {
  return new Promise((resolvePromise, rejectPromise) => {
    const u = new URL(url);
    const req = httpsRequest(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'GET',
        headers: { accept: '*/*', ...headers },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const location = res.headers.location;
        if (status >= 300 && status < 400 && location) {
          httpsGet(new URL(location, url).toString(), headers).then(resolvePromise, rejectPromise);
          return;
        }
        if (status !== 200) {
          rejectPromise(new Error(`HTTP ${status} for ${url}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolvePromise(Buffer.concat(chunks).toString('utf8')));
        res.on('error', rejectPromise);
      },
    );
    req.on('error', rejectPromise);
    req.end();
  });
}

function hasRequiredWeights(fontsRecord: Record<string, unknown>): boolean {
  return REQUIRED_WEIGHTS.every((w) => Object.hasOwn(fontsRecord, String(w)));
}

function familyToParam(family: string): string {
  return family.replace(/\s+/g, '+');
}

function parseTtfFromCss(css: string): Map<number, string> {
  const result = new Map<number, string>();
  const blockPattern = /font-weight:\s*(\d+);[^}]*?src:\s*url\(([^)]+\.ttf)\)/g;
  for (const match of css.matchAll(blockPattern)) {
    const weight = Number(match[1]);
    const url = match[2];
    if (!url) continue;
    result.set(weight, url);
  }
  return result;
}

async function loadEntry(family: string, subsets: string[]): Promise<CatalogEntry | null> {
  try {
    const url = `${CSS_URL}?family=${familyToParam(family)}:wght@400;700&subset=${REQUIRED_SUBSET}&display=swap`;
    const css = await httpsGet(url, { 'user-agent': '' });
    const ttfs = parseTtfFromCss(css);
    const r400 = ttfs.get(400);
    const r700 = ttfs.get(700);
    if (!r400 || !r700) return null;
    return { family, subsets, files: { 400: r400, 700: r700 } };
  } catch (e) {
    process.stderr.write(`skip ${family}: ${e instanceof Error ? e.message : String(e)}\n`);
    return null;
  }
}

async function runPool<T, R>(
  items: ReadonlyArray<T>,
  worker: (item: T, index: number) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      const item = items[i];
      if (item === undefined) return;
      out[i] = await worker(item, i);
    }
  });
  await Promise.all(workers);
  return out;
}

async function fetchMetadata(): Promise<z.infer<typeof Metadata>> {
  const text = await httpsGet(METADATA_URL);
  return Metadata.parse(JSON.parse(text));
}

async function main(): Promise<void> {
  process.stdout.write(`Fetching ${METADATA_URL}…\n`);
  const meta = await fetchMetadata();
  const candidates = meta.familyMetadataList
    .filter((f) => f.subsets.includes(REQUIRED_SUBSET))
    .filter((f) => hasRequiredWeights(f.fonts));
  process.stdout.write(`Eligible families: ${candidates.length} (latin-ext + 400 + 700)\n`);

  let progress = 0;
  const results = await runPool(
    candidates,
    async (f) => {
      const entry = await loadEntry(f.family, f.subsets);
      progress += 1;
      if (progress % 50 === 0) {
        process.stdout.write(`  ${progress}/${candidates.length}…\n`);
      }
      return entry;
    },
    CONCURRENCY,
  );

  const fonts = results.filter((e): e is CatalogEntry => e !== null);
  fonts.sort((a, b) => a.family.localeCompare(b.family));

  const catalog = {
    generatedAt: new Date().toISOString(),
    source: 'fonts.google.com/metadata/fonts + fonts.googleapis.com/css2 (empty UA)',
    fonts,
  };

  writeFileSync(OUTPUT, JSON.stringify(catalog, null, 2) + '\n');
  process.stdout.write(`Wrote ${fonts.length} fonts to ${OUTPUT}\n`);
}

await main();
