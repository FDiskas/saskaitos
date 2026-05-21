import { describe, it, expect, vi } from 'vitest';
import { SyncQueue } from './syncQueue';

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('SyncQueue', () => {
  it('when created, then status is idle', () => {
    const q = new SyncQueue();
    expect(q.getStatus()).toBe('idle');
  });

  it('when enqueueing, then status transitions to syncing', async () => {
    const q = new SyncQueue();
    let release!: () => void;
    const job = new Promise<void>((res) => {
      release = res;
    });
    const p = q.enqueue(() => job);
    await flush();
    expect(q.getStatus()).toBe('syncing');
    release();
    await p;
  });

  it('when all jobs succeed, then status ends as synced', async () => {
    const q = new SyncQueue();
    await q.enqueue(async () => 1);
    await q.enqueue(async () => 2);
    expect(q.getStatus()).toBe('synced');
  });

  it('when jobs enqueued, then they run sequentially in order', async () => {
    const q = new SyncQueue();
    const order: number[] = [];
    const p1 = q.enqueue(async () => {
      await new Promise((r) => setTimeout(r, 5));
      order.push(1);
    });
    const p2 = q.enqueue(async () => {
      order.push(2);
    });
    await Promise.all([p1, p2]);
    expect(order).toEqual([1, 2]);
  });

  it('when a job fails, then status becomes error and rejection propagates', async () => {
    const q = new SyncQueue();
    await expect(q.enqueue(async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    expect(q.getStatus()).toBe('error');
  });

  it('when one job fails but later job succeeds, then status stays at synced for new run', async () => {
    const q = new SyncQueue();
    await q.enqueue(async () => Promise.reject(new Error('x'))).catch(() => undefined);
    expect(q.getStatus()).toBe('error');
    await q.enqueue(async () => 1);
    expect(q.getStatus()).toBe('synced');
  });

  it('when subscriber registered, then it receives status updates', async () => {
    const q = new SyncQueue();
    const seen: string[] = [];
    q.subscribe((s) => seen.push(s));
    await q.enqueue(async () => 1);
    expect(seen).toEqual(['syncing', 'synced']);
  });

  it('when subscriber unsubscribed, then it stops receiving updates', async () => {
    const q = new SyncQueue();
    const fn = vi.fn();
    const unsub = q.subscribe(fn);
    unsub();
    await q.enqueue(async () => 1);
    expect(fn).not.toHaveBeenCalled();
  });
});
