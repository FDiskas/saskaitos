export const POPULAR_GOOGLE_FONTS = [
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Inter',
  'Poppins',
  'Source Sans 3',
  'Noto Sans',
  'Raleway',
  'Nunito',
] as const;

export type GoogleFontFamily = (typeof POPULAR_GOOGLE_FONTS)[number];
export type FontStack = readonly [string, string];
type FontWeight = 400 | 700;
type FontFileMap = Record<FontWeight, string>;

const FALLBACK_FAMILY: GoogleFontFamily = 'Roboto';
const BUILTIN_FALLBACK = 'Helvetica';
const FONT_WEIGHTS = [400, 700] as const;
const inflight = new Map<string, Promise<FontStack>>();

const LOCAL_FONT_FILES: Record<GoogleFontFamily, FontFileMap> = {
  Roboto: {
    400: '/fonts/roboto-400.ttf',
    700: '/fonts/roboto-700.ttf',
  },
  'Open Sans': {
    400: '/fonts/open-sans-400.ttf',
    700: '/fonts/open-sans-700.ttf',
  },
  Lato: {
    400: '/fonts/lato-400.ttf',
    700: '/fonts/lato-700.ttf',
  },
  Montserrat: {
    400: '/fonts/montserrat-400.ttf',
    700: '/fonts/montserrat-700.ttf',
  },
  Inter: {
    400: '/fonts/inter-400.ttf',
    700: '/fonts/inter-700.ttf',
  },
  Poppins: {
    400: '/fonts/poppins-400.ttf',
    700: '/fonts/poppins-700.ttf',
  },
  'Source Sans 3': {
    400: '/fonts/source-sans-3-400.ttf',
    700: '/fonts/source-sans-3-700.ttf',
  },
  'Noto Sans': {
    400: '/fonts/noto-sans-400.ttf',
    700: '/fonts/noto-sans-700.ttf',
  },
  Raleway: {
    400: '/fonts/raleway-400.ttf',
    700: '/fonts/raleway-700.ttf',
  },
  Nunito: {
    400: '/fonts/nunito-400.ttf',
    700: '/fonts/nunito-700.ttf',
  },
};

interface RegisteredSource {
  fontWeight: number;
  data: unknown;
}
interface RegisteredFamily {
  sources: RegisteredSource[];
}

interface FontFaceEntry {
  fontWeight: number;
  src: string;
}

function isSupported(family: string): family is GoogleFontFamily {
  return (POPULAR_GOOGLE_FONTS as readonly string[]).includes(family);
}

function resolveBaseFamily(family: string | undefined): GoogleFontFamily {
  if (family && isSupported(family)) return family;
  return FALLBACK_FAMILY;
}

export function resolveFontStack(family: string | undefined): FontStack {
  const base = resolveBaseFamily(family);
  return [base, BUILTIN_FALLBACK];
}

function toAbsoluteFontUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  if (typeof window === 'undefined') return path;
  return new URL(path, window.location.origin).toString();
}

function loadAllFaces(family: GoogleFontFamily): FontFaceEntry[] {
  const files = LOCAL_FONT_FILES[family];
  return FONT_WEIGHTS.map((weight) => ({
    fontWeight: weight,
    src: toAbsoluteFontUrl(files[weight]),
  }));
}

function isFamilyLoaded(store: Record<string, RegisteredFamily>, family: string): boolean {
  const fam = store[family];
  if (!fam) return false;
  for (const weight of FONT_WEIGHTS) {
    const hit = fam.sources.find((s) => s.fontWeight === weight && s.data !== null);
    if (!hit) return false;
  }
  return true;
}

function stackIsLoaded(store: Record<string, RegisteredFamily>, stack: FontStack): boolean {
  return isFamilyLoaded(store, stack[0]);
}

export async function ensureGoogleFontRegistered(family: string | undefined): Promise<FontStack> {
  const base = resolveBaseFamily(family);
  const stack = resolveFontStack(family);
  const cacheKey = base;
  const existing = inflight.get(cacheKey);
  if (existing) return existing;

  const task = (async (): Promise<FontStack> => {
    const { Font } = await import('@react-pdf/renderer');
    const store = Font.getRegisteredFonts() as Record<string, RegisteredFamily>;
    if (stackIsLoaded(store, stack)) return stack;

    // Drop any stale, partially-loaded sources from a previous HMR cycle.
    // FontFamily.register pushes to .sources without deduplication, so leftover
    // null-data sources accumulate across reloads and starve later renders.
    const familyName = stack[0];
    if (store[familyName]) {
      delete store[familyName];
    }

    const faces = loadAllFaces(base);

    Font.register({
      family: familyName,
      fonts: faces.map((f) => ({ src: f.src, fontWeight: f.fontWeight })),
    });
    await Promise.all(
      faces.map((f) => Font.load({ fontFamily: familyName, fontWeight: f.fontWeight })),
    );

    return stack;
  })();

  inflight.set(cacheKey, task);
  try {
    return await task;
  } finally {
    inflight.delete(cacheKey);
  }
}
