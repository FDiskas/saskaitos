import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveFontStack } from './googleFonts';

describe('resolveFontStack', () => {
  it('when family is supported, returns [family, Helvetica] stack', () => {
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

  it('when family is Nunito, registers local 400 and 700 font files', async () => {
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
    const stack = await ensureGoogleFontRegistered('Nunito');

    expect(stack).toEqual(['Nunito', 'Helvetica']);
    expect(register).toHaveBeenCalledTimes(1);
    const call = register.mock.calls[0]?.[0] as { family: string; fonts: Array<{ src: string; fontWeight: number }> };
    expect(call.family).toBe('Nunito');
    expect(call.fonts).toEqual([
      {
        src: 'http://localhost:3000/fonts/nunito-400.ttf',
        fontWeight: 400,
      },
      {
        src: 'http://localhost:3000/fonts/nunito-700.ttf',
        fontWeight: 700,
      },
    ]);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('when window exists, converts local paths to absolute urls', async () => {
    const originalWindow = globalThis.window;
    const fakeWindow = { location: { origin: 'https://app.test' } } as Window;
    Object.defineProperty(globalThis, 'window', {
      value: fakeWindow,
      configurable: true,
    });

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
    await ensureGoogleFontRegistered('Inter');
    const call = register.mock.calls[0]?.[0] as { family: string; fonts: Array<{ src: string; fontWeight: number }> };

    expect(call.fonts[0]?.src).toBe('https://app.test/fonts/inter-400.ttf');
    expect(call.fonts[1]?.src).toBe('https://app.test/fonts/inter-700.ttf');

    if (originalWindow) {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        configurable: true,
      });
      return;
    }
    Reflect.deleteProperty(globalThis, 'window');
  });
});
