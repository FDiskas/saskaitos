import type { Fetcher } from './Fetcher';

export interface BackoffOptions {
  delays?: ReadonlyArray<number>;
  sleep?: (ms: number) => Promise<void>;
}

const DEFAULT_DELAYS = [250, 500, 1000] as const;

export class BackoffRetry implements Fetcher {
  private readonly inner: Fetcher;
  private readonly delays: ReadonlyArray<number>;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(inner: Fetcher, options: BackoffOptions = {}) {
    this.inner = inner;
    this.delays = options.delays ?? DEFAULT_DELAYS;
    this.sleep = options.sleep ?? defaultSleep;
  }

  async fetch(req: Request): Promise<Response> {
    let attempt = 0;
    let last = await this.inner.fetch(req.clone());
    while (shouldRetry(last.status) && attempt < this.delays.length) {
      const delayMs = this.delays[attempt] ?? 0;
      await this.sleep(delayMs);
      attempt += 1;
      last = await this.inner.fetch(req.clone());
    }
    return last;
  }
}

function shouldRetry(status: number): boolean {
  if (status === 429) return true;
  return status >= 500 && status <= 599;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
