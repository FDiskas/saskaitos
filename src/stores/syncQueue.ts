export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export type SyncListener = (status: SyncStatus) => void;

export class SyncQueue {
  private chain: Promise<unknown> = Promise.resolve();
  private inflight = 0;
  private hadError = false;
  private status: SyncStatus = 'idle';
  private readonly listeners = new Set<SyncListener>();

  getStatus(): SyncStatus {
    return this.status;
  }

  subscribe(fn: SyncListener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  enqueue<T>(task: () => Promise<T>): Promise<T> {
    if (this.inflight === 0) this.hadError = false;
    this.inflight += 1;
    this.setStatus('syncing');
    const next = this.chain.then(() => this.runTask(task));
    this.chain = next.catch(() => undefined);
    return next;
  }

  private async runTask<T>(task: () => Promise<T>): Promise<T> {
    try {
      return await task();
    } catch (err) {
      this.hadError = true;
      throw err;
    } finally {
      this.inflight -= 1;
      if (this.inflight === 0) {
        this.setStatus(this.hadError ? 'error' : 'synced');
      }
    }
  }

  private setStatus(next: SyncStatus): void {
    if (this.status === next) return;
    this.status = next;
    for (const fn of this.listeners) fn(next);
  }
}

export const syncQueue = new SyncQueue();
