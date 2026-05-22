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

const FALLBACK_FAMILY: GoogleFontFamily = 'Roboto';
const FONT_WEIGHTS = [400, 700] as const;
const registered = new Set<string>();
const inflight = new Map<string, Promise<string>>();

interface FontFace {
  src: string;
  fontWeight: number;
}

function isSupported(family: string): family is GoogleFontFamily {
  return (POPULAR_GOOGLE_FONTS as readonly string[]).includes(family);
}

export function resolveFontFamily(family: string | undefined): GoogleFontFamily {
  if (family && isSupported(family)) return family;
  return FALLBACK_FAMILY;
}

function buildCssUrl(family: GoogleFontFamily): string {
  const familyParam = family.replace(/ /g, '+');
  const weights = FONT_WEIGHTS.join(',');
  return `https://fonts.googleapis.com/css?family=${familyParam}:${weights}&subset=latin,latin-ext`;
}

function parseFontFaces(css: string): FontFace[] {
  const faces: FontFace[] = [];
  const blocks = css.split('@font-face').slice(1);
  for (const block of blocks) {
    const weightMatch = block.match(/font-weight:\s*(\d+)/);
    const urlMatch = block.match(/url\(([^)]+)\)/);
    if (!weightMatch || !urlMatch) continue;
    const weight = Number(weightMatch[1]);
    const src = urlMatch[1]?.replace(/['"]/g, '').trim();
    if (!src) continue;
    if (!FONT_WEIGHTS.includes(weight as (typeof FONT_WEIGHTS)[number])) continue;
    faces.push({ src, fontWeight: weight });
  }
  return faces;
}

async function fetchFontFaces(family: GoogleFontFamily): Promise<FontFace[]> {
  const response = await fetch(buildCssUrl(family));
  if (!response.ok) {
    throw new Error(`Google Fonts CSS fetch failed: ${response.status}`);
  }
  const css = await response.text();
  const faces = parseFontFaces(css);
  if (faces.length === 0) {
    throw new Error(`No usable @font-face entries for ${family}`);
  }
  return faces;
}

export async function ensureGoogleFontRegistered(family: string | undefined): Promise<GoogleFontFamily> {
  const resolved = resolveFontFamily(family);
  if (registered.has(resolved)) return resolved;
  const existing = inflight.get(resolved);
  if (existing) return existing as Promise<GoogleFontFamily>;

  const task = (async (): Promise<GoogleFontFamily> => {
    const [{ Font }, faces] = await Promise.all([
      import('@react-pdf/renderer'),
      fetchFontFaces(resolved),
    ]);
    Font.register({ family: resolved, fonts: faces });
    registered.add(resolved);
    return resolved;
  })();

  inflight.set(resolved, task);
  try {
    return await task;
  } finally {
    inflight.delete(resolved);
  }
}
