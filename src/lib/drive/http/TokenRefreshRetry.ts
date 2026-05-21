import type { Fetcher, TokenSource } from './Fetcher';

export class TokenRefreshRetry implements Fetcher {
  private readonly inner: Fetcher;
  private readonly tokens: TokenSource;

  constructor(inner: Fetcher, tokens: TokenSource) {
    this.inner = inner;
    this.tokens = tokens;
  }

  async fetch(req: Request): Promise<Response> {
    const first = await this.inner.fetch(req.clone());
    if (first.status !== 401) return first;
    const refreshed = await this.tokens.refreshAccessToken();
    if (!refreshed) return first;
    return this.inner.fetch(req);
  }
}
