import { describe, it, expect, vi } from 'vitest';
import { InMemoryStorage } from './InMemoryStorage';
import { APP_ROOT, ensureAppStructure } from './bootstrap';

describe('ensureAppStructure', () => {
  it('when first run, then creates clients.json and settings.json with empty defaults', async () => {
    const storage = new InMemoryStorage();
    await ensureAppStructure(storage);
    const entries = await storage.list(APP_ROOT);
    const names = entries.map((e) => e.name).sort();
    expect(names).toEqual(['clients.json', 'settings.json']);
  });

  it('when called again, then does not overwrite existing files', async () => {
    const storage = new InMemoryStorage();
    await ensureAppStructure(storage);
    const spy = vi.spyOn(storage, 'write');
    await ensureAppStructure(storage);
    expect(spy).not.toHaveBeenCalled();
  });
});
