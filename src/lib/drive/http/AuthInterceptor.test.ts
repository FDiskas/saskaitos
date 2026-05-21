import { describe, it, expect, vi } from 'vitest';
import { AuthInterceptor } from './AuthInterceptor';
import type { Fetcher, TokenSource } from './Fetcher';

function makeSource(token: string | null): TokenSource {
  return {
    getAccessToken: () => token,
    refreshAccessToken: async () => token,
  };
}

function captureFetcher(): { fetcher: Fetcher; captured: Request[] } {
  const captured: Request[] = [];
  const fetcher: Fetcher = {
    fetch: vi.fn(async (req: Request) => {
      captured.push(req);
      return new Response('ok', { status: 200 });
    }),
  };
  return { fetcher, captured };
}

describe('AuthInterceptor', () => {
  it('when token present, then attaches Authorization Bearer header', async () => {
    const { fetcher, captured } = captureFetcher();
    const sut = new AuthInterceptor(fetcher, makeSource('tk-1'));
    await sut.fetch(new Request('https://example.test/x'));
    expect(captured[0]?.headers.get('authorization')).toBe('Bearer tk-1');
  });

  it('when token absent, then forwards request unchanged', async () => {
    const { fetcher, captured } = captureFetcher();
    const sut = new AuthInterceptor(fetcher, makeSource(null));
    await sut.fetch(new Request('https://example.test/x', { headers: { 'x-y': 'z' } }));
    expect(captured[0]?.headers.get('authorization')).toBeNull();
    expect(captured[0]?.headers.get('x-y')).toBe('z');
  });

  it('when request already has authorization header, then overrides it', async () => {
    const { fetcher, captured } = captureFetcher();
    const sut = new AuthInterceptor(fetcher, makeSource('tk-2'));
    await sut.fetch(new Request('https://example.test/x', { headers: { Authorization: 'Bearer old' } }));
    expect(captured[0]?.headers.get('authorization')).toBe('Bearer tk-2');
  });
});
