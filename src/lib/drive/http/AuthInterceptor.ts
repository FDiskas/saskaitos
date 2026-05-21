import type { Fetcher, TokenSource } from './Fetcher';

export class AuthInterceptor implements Fetcher {
  private readonly inner: Fetcher;
  private readonly tokens: TokenSource;

  constructor(inner: Fetcher, tokens: TokenSource) {
    this.inner = inner;
    this.tokens = tokens;
  }

  fetch(req: Request): Promise<Response> {
    const token = this.tokens.getAccessToken();
    if (!token) return this.inner.fetch(req);
    return this.inner.fetch(withAuthorization(req, token));
  }
}

function withAuthorization(req: Request, token: string): Request {
  const headers = new Headers(req.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return new Request(req, { headers });
}
