import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { FakeDriveClient } from '@/lib/drive/_fakeDriveClient';
import { DriveStorage } from './DriveStorage';
import { StoragePath } from './StoragePath';
import { runStorageContract } from './_storageContract';

runStorageContract({
  name: 'DriveStorage',
  create: () => new DriveStorage(new FakeDriveClient()),
});

describe('DriveStorage specifics', () => {
  it('when writing nested folder, then creates each intermediate folder once', async () => {
    const client = new FakeDriveClient();
    const created: string[] = [];
    const wrapped = wrapWithSpy(client, created);
    const sut = new DriveStorage(wrapped);
    await sut.write(StoragePath.of('Saskaitos_App/Clients/Foo/2026', 'a.json'), { x: 1 });
    await sut.write(StoragePath.of('Saskaitos_App/Clients/Foo/2026', 'b.json'), { x: 2 });
    expect(created.filter((c) => c.startsWith('createFolder'))).toEqual([
      'createFolder:Saskaitos_App@root',
      'createFolder:Clients@fake-1',
      'createFolder:Foo@fake-2',
      'createFolder:2026@fake-3',
    ]);
  });

  it('when deleting a file, then trashes (soft delete), and read returns null afterwards', async () => {
    const client = new FakeDriveClient();
    const sut = new DriveStorage(client);
    const path = StoragePath.of('Saskaitos_App', 'clients.json');
    await sut.write(path, { x: 1 });
    await sut.delete(path);
    const schema = z.object({ x: z.number() });
    expect(await sut.read(path, schema)).toBeNull();
  });

  it('when deleting in missing folder, then is a no-op', async () => {
    const client = new FakeDriveClient();
    const sut = new DriveStorage(client);
    await expect(sut.delete(StoragePath.of('Saskaitos_App/Nope', 'x.json'))).resolves.toBeUndefined();
  });
});

function wrapWithSpy(client: FakeDriveClient, log: string[]): FakeDriveClient {
  const proxied = new Proxy(client, {
    get(target, prop) {
      const value = Reflect.get(target, prop) as unknown;
      if (typeof value !== 'function') return value;
      if (prop === 'createFolder') {
        return async (name: string, parentId: string) => {
          log.push(`createFolder:${name}@${parentId}`);
          return target.createFolder(name, parentId);
        };
      }
      return (value as (...args: unknown[]) => unknown).bind(target);
    },
  });
  return proxied;
}
