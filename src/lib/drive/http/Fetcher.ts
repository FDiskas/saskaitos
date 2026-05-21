export interface Fetcher {
  fetch(req: Request): Promise<Response>;
}

export interface TokenSource {
  getAccessToken(): string | null;
  refreshAccessToken(): Promise<string | null>;
}

export class FetchFunctionFetcher implements Fetcher {
  private readonly fn: typeof fetch;

  constructor(fn: typeof fetch) {
    this.fn = fn;
  }

  fetch(req: Request): Promise<Response> {
    return this.fn(req);
  }
}

export class StaticTokenSource implements TokenSource {
  private readonly token: string | null;

  constructor(token: string | null) {
    this.token = token;
  }

  getAccessToken(): string | null {
    return this.token;
  }

  async refreshAccessToken(): Promise<string | null> {
    return this.token;
  }
}
