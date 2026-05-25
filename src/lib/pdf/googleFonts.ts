import { z } from 'zod';
import rawCatalog from './google-fonts-catalog.json';

const WeightFiles = z.object({
  400: z.string().url(),
  700: z.string().url(),
});

const CatalogFont = z.object({
  family: z.string().min(1),
  files: WeightFiles,
});

const Catalog = z.object({
  generatedAt: z.string(),
  fonts: z.array(CatalogFont).nonempty(),
});

type CatalogFontT = z.infer<typeof CatalogFont>;

export type FontStack = readonly [string, string];

const FONT_WEIGHTS = [400, 700] as const;
const FALLBACK_FAMILY = 'Roboto';
const BUILTIN_FALLBACK = 'Helvetica';

const done = new Map<string, FontStack>();
const inflight = new Map<string, Promise<FontStack>>();
const catalog = Catalog.parse(rawCatalog);

export class GoogleFontNotInCatalogError extends Error {
  readonly family: string;
  constructor(family: string) {
    super(`Font '${family}' is not in the runtime catalog (run pnpm sync-fonts to refresh)`);
    this.family = family;
  }
}

function findEntry(family: string): CatalogFontT | undefined {
  return catalog.fonts.find((f) => f.family === family);
}

function resolveBaseFamily(family: string | undefined): string {
  if (family && findEntry(family)) return family;
  return FALLBACK_FAMILY;
}

export function resolveFontStack(family: string | undefined): FontStack {
  return [resolveBaseFamily(family), BUILTIN_FALLBACK];
}

export const availableFontFamilies: ReadonlyArray<string> = catalog.fonts.map((f) => f.family);

export function isFontAvailable(family: string): boolean {
  return findEntry(family) !== undefined;
}

function buildFontSources(entry: CatalogFontT): Array<{ src: string; fontWeight: number }> {
  return FONT_WEIGHTS.map((w) => ({ src: entry.files[w], fontWeight: w }));
}

async function registerAndLoad(entry: CatalogFontT): Promise<void> {
  const { Font } = await import('@react-pdf/renderer');
  Font.register({ family: entry.family, fonts: buildFontSources(entry) });
  await Promise.all(
    FONT_WEIGHTS.map((w) => Font.load({ fontFamily: entry.family, fontWeight: w })),
  );
}

export async function ensureGoogleFontRegistered(
  family: string | undefined,
): Promise<FontStack> {
  const base = resolveBaseFamily(family);
  const stack = resolveFontStack(family);

  // Return immediately if already fully loaded
  const cached = done.get(base);
  if (cached) return cached;

  // Deduplicate concurrent callers — return the same in-flight promise
  const existing = inflight.get(base);
  if (existing) return existing;

  const entry = findEntry(base);
  if (!entry) throw new GoogleFontNotInCatalogError(base);

  const task = registerAndLoad(entry).then(() => {
    done.set(base, stack); // Persist permanently — never re-register or clear
    inflight.delete(base);
    return stack;
  });
  inflight.set(base, task);
  return task;
}
