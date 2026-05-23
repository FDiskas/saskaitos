import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  availableFontFamilies,
  isFontAvailable,
  resolveFontStack,
  GoogleFontNotInCatalogError,
} from './googleFonts';

describe('availableFontFamilies', () => {
  it('when catalog is loaded, includes common latin-ext fonts', () => {
    expect(availableFontFamilies).toContain('Inter');
    expect(availableFontFamilies).toContain('Roboto');
    expect(availableFontFamilies).toContain('DM Sans');
  });

  it('when catalog is loaded, contains 100+ families', () => {
    expect(availableFontFamilies.length).toBeGreaterThan(100);
  });
});

describe('isFontAvailable', () => {
  it('when family is Inter, returns true', () => {
    expect(isFontAvailable('Inter')).toBe(true);
  });

  it('when family is Comic Sans (not in catalog), returns false', () => {
    expect(isFontAvailable('Comic Sans')).toBe(false);
  });
});

describe('resolveFontStack', () => {
  it('when family is Inter, returns [Inter, Helvetica]', () => {
    expect(resolveFontStack('Inter')).toEqual(['Inter', 'Helvetica']);
  });

  it('when family is undefined, falls back to Roboto stack', () => {
    expect(resolveFontStack(undefined)).toEqual(['Roboto', 'Helvetica']);
  });

  it('when family is unknown, falls back to Roboto stack', () => {
    expect(resolveFontStack('Comic Sans')).toEqual(['Roboto', 'Helvetica']);
  });
});

describe('ensureGoogleFontRegistered', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.doUnmock('@react-pdf/renderer');
  });

  it('when family is Inter, registers TTF urls for weights 400 and 700', async () => {
    const register = vi.fn();
    const load = vi.fn(async () => undefined);
    vi.doMock('@react-pdf/renderer', () => ({
      Font: {
        getRegisteredFonts: () => ({}),
        register,
        load,
      },
    }));

    const { ensureGoogleFontRegistered } = await import('./googleFonts');
    const stack = await ensureGoogleFontRegistered('Inter');

    expect(stack).toEqual(['Inter', 'Helvetica']);
    expect(register).toHaveBeenCalledTimes(1);
    const call = register.mock.calls[0]?.[0] as {
      family: string;
      fonts: Array<{ src: string; fontWeight: number }>;
    };
    expect(call.family).toBe('Inter');
    expect(call.fonts[0]?.fontWeight).toBe(400);
    expect(call.fonts[0]?.src).toMatch(/^https:\/\/fonts\.gstatic\.com\/.+\.ttf$/);
    expect(call.fonts[1]?.fontWeight).toBe(700);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('when family is undefined, falls back to Roboto and registers it', async () => {
    const register = vi.fn();
    const load = vi.fn(async () => undefined);
    vi.doMock('@react-pdf/renderer', () => ({
      Font: {
        getRegisteredFonts: () => ({}),
        register,
        load,
      },
    }));

    const { ensureGoogleFontRegistered } = await import('./googleFonts');
    const stack = await ensureGoogleFontRegistered(undefined);

    expect(stack).toEqual(['Roboto', 'Helvetica']);
    const call = register.mock.calls[0]?.[0] as { family: string };
    expect(call.family).toBe('Roboto');
  });
});

describe('GoogleFontNotInCatalogError', () => {
  it('when constructed, exposes family on instance', () => {
    const err = new GoogleFontNotInCatalogError('Made Up');
    expect(err.family).toBe('Made Up');
    expect(err.message).toContain('Made Up');
  });
});
