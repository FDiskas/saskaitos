import { describe, it, expect, vi } from 'vitest';
import { TokenRefreshRetry } from './TokenRefreshRetry';
import type { Fetcher, TokenSource } from './Fetcher';

function makeFetcher(responses: Response[]): Fetcher {
  const queue = [...responses];
  return {
    fetch: vi.fn(async () => {
      const next = queue.shift();
      if (!next) throw new Error('no more responses');
      return next;
    }),
  };
}

describe('TokenRefreshRetry', () => {
  it('when 401 received, then refresh token and retry once', async () => {
    const fetcher = makeFetcher([
      new Response(null, { status: 401 }),
      new Response('ok', { status: 200 }),
    ]);
    const refresh = vi.fn(async () => 'tk-new');
    const tokens: TokenSource = { getAccessToken: () => 'tk-old', refreshAccessToken: refresh };
    const sut = new TokenRefreshRetry(fetcher, tokens);

    const res = await sut.fetch(new Request('https://drive.test/'));

    expect(res.status).toBe(200);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetcher.fetch).toHaveBeenCalledTimes(2);
  });

  it('when retry also returns 401, then returns that response without further refresh', async () => {
    const fetcher = makeFetcher([
      new Response(null, { status: 401 }),
      new Response(null, { status: 401 }),
    ]);
    const refresh = vi.fn(async () => 'tk-new');
    const tokens: TokenSource = { getAccessToken: () => 'tk-old', refreshAccessToken: refresh };
    const sut = new TokenRefreshRetry(fetcher, tokens);

    const res = await sut.fetch(new Request('https://drive.test/'));

    expect(res.status).toBe(401);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('when refresh returns null, then returns original 401 without retry', async () => {
    const fetcher = makeFetcher([new Response(null, { status: 401 })]);
    const tokens: TokenSource = { getAccessToken: () => 'tk', refreshAccessToken: async () => null };
    const sut = new TokenRefreshRetry(fetcher, tokens);

    const res = await sut.fetch(new Request('https://drive.test/'));
    expect(res.status).toBe(401);
    expect(fetcher.fetch).toHaveBeenCalledTimes(1);
  });

  it('when response is 200, then no refresh attempted', async () => {
    const fetcher = makeFetcher([new Response('ok', { status: 200 })]);
    const refresh = vi.fn(async () => 'tk-new');
    const tokens: TokenSource = { getAccessToken: () => 'tk', refreshAccessToken: refresh };
    const sut = new TokenRefreshRetry(fetcher, tokens);

    const res = await sut.fetch(new Request('https://drive.test/'));
    expect(res.status).toBe(200);
    expect(refresh).not.toHaveBeenCalled();
  });
});
