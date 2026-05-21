import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BackoffRetry } from './BackoffRetry';
import type { Fetcher } from './Fetcher';

function fetcherFromResponses(responses: Response[]): Fetcher {
  const queue = [...responses];
  return {
    fetch: vi.fn(async () => {
      const next = queue.shift();
      if (!next) throw new Error('no more responses');
      return next;
    }),
  };
}

describe('BackoffRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('when 200 first try, then no retry', async () => {
    const fetcher = fetcherFromResponses([new Response('ok', { status: 200 })]);
    const sut = new BackoffRetry(fetcher, { delays: [10, 20, 40] });
    const res = await sut.fetch(new Request('https://drive.test/'));
    expect(res.status).toBe(200);
    expect(fetcher.fetch).toHaveBeenCalledTimes(1);
  });

  it('when 429 then 200, then retries once after first delay', async () => {
    const fetcher = fetcherFromResponses([
      new Response(null, { status: 429 }),
      new Response('ok', { status: 200 }),
    ]);
    const sut = new BackoffRetry(fetcher, { delays: [10, 20, 40] });
    const promise = sut.fetch(new Request('https://drive.test/'));
    await vi.advanceTimersByTimeAsync(10);
    const res = await promise;
    expect(res.status).toBe(200);
    expect(fetcher.fetch).toHaveBeenCalledTimes(2);
  });

  it('when 500s persist, then exhausts retries and returns last response', async () => {
    const fetcher = fetcherFromResponses([
      new Response(null, { status: 500 }),
      new Response(null, { status: 502 }),
      new Response(null, { status: 503 }),
      new Response(null, { status: 504 }),
    ]);
    const sut = new BackoffRetry(fetcher, { delays: [10, 20, 40] });
    const promise = sut.fetch(new Request('https://drive.test/'));
    await vi.advanceTimersByTimeAsync(10 + 20 + 40);
    const res = await promise;
    expect(res.status).toBe(504);
    expect(fetcher.fetch).toHaveBeenCalledTimes(4);
  });

  it('when 4xx other than 429, then no retry', async () => {
    const fetcher = fetcherFromResponses([new Response(null, { status: 404 })]);
    const sut = new BackoffRetry(fetcher, { delays: [10] });
    const res = await sut.fetch(new Request('https://drive.test/'));
    expect(res.status).toBe(404);
    expect(fetcher.fetch).toHaveBeenCalledTimes(1);
  });
});
