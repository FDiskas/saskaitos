import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import type { Storage } from './Storage';
import { StoragePath } from './StoragePath';

export interface ContractFactory {
  name: string;
  create: () => Promise<Storage> | Storage;
}

const FooSchema = z.object({ foo: z.string(), n: z.number() });

export function runStorageContract(factory: ContractFactory): void {
  describe(`${factory.name} contract`, () => {
    let storage: Storage;
    const path = StoragePath.of('Saskaitos_App', 'clients.json');

    beforeEach(async () => {
      storage = await factory.create();
    });

    it('when reading missing file, then returns null', async () => {
      expect(await storage.read(path, FooSchema)).toBeNull();
    });

    it('when written then read, then roundtrips through schema', async () => {
      await storage.write(path, { foo: 'bar', n: 42 });
      expect(await storage.read(path, FooSchema)).toEqual({ foo: 'bar', n: 42 });
    });

    it('when overwritten, then read returns latest value', async () => {
      await storage.write(path, { foo: 'a', n: 1 });
      await storage.write(path, { foo: 'b', n: 2 });
      expect(await storage.read(path, FooSchema)).toEqual({ foo: 'b', n: 2 });
    });

    it('when stored payload fails schema, then read throws', async () => {
      await storage.write(path, { foo: 123, n: 'x' });
      await expect(storage.read(path, FooSchema)).rejects.toThrow();
    });

    it('when binary uploaded, then list reports entry under folder', async () => {
      const bin = StoragePath.of('Saskaitos_App/Clients/Foo/2026', '2026-01-02_SF-0001.pdf');
      await storage.uploadBinary(bin, new Blob(['hello']), 'application/pdf');
      const entries = await storage.list('Saskaitos_App/Clients/Foo/2026');
      expect(entries.some((e) => e.name === '2026-01-02_SF-0001.pdf')).toBe(true);
    });

    it('when listing missing folder, then returns empty list', async () => {
      expect(await storage.list('does/not/exist')).toEqual([]);
    });

    it('when delete then read, then read returns null', async () => {
      await storage.write(path, { foo: 'x', n: 0 });
      await storage.delete(path);
      expect(await storage.read(path, FooSchema)).toBeNull();
    });

    it('when listing folder with json filter, then only json entries returned', async () => {
      const folder = 'Saskaitos_App/Clients/Bar';
      await storage.write(StoragePath.of(folder, 'profile.json'), { foo: 'y', n: 9 });
      await storage.uploadBinary(StoragePath.of(folder, 'logo.png'), new Blob(['x']), 'image/png');
      const json = await storage.list(folder, { mimeType: 'application/json' });
      expect(json.map((e) => e.name).sort()).toEqual(['profile.json']);
    });
  });
}
