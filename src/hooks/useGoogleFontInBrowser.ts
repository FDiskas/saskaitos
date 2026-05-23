import { useEffect } from 'react';
import { isFontAvailable } from '@/lib/pdf/googleFonts';

const LINK_ID_PREFIX = 'google-font-';

function familyToParam(family: string): string {
  return family.replace(/\s+/g, '+');
}

function buildLinkHref(family: string): string {
  return `https://fonts.googleapis.com/css2?family=${familyToParam(family)}:wght@400;700&subset=latin-ext&display=swap`;
}

function linkId(family: string): string {
  return LINK_ID_PREFIX + family.toLowerCase().replace(/\s+/g, '-');
}

function ensureLink(family: string): void {
  const id = linkId(family);
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = buildLinkHref(family);
  document.head.appendChild(link);
}

export function useGoogleFontInBrowser(family: string | undefined): void {
  useEffect(() => {
    if (!family || !isFontAvailable(family)) return;
    ensureLink(family);
  }, [family]);
}
