import type { ZodType } from 'zod';
import type { ListQuery, Storage, StorageEntry } from './Storage';
import type { StoragePath } from './StoragePath';

interface Record {
  mimeType: string;
  modifiedTime: string;
  body: string | Blob;
}

export class InMemoryStorage implements Storage {
  private readonly files = new Map<string, Record>();

  async read<T>(path: StoragePath, schema: ZodType<T>): Promise<T | null> {
    const record = this.files.get(path.toString());
    if (!record) return null;
    if (typeof record.body !== 'string') return null;
    return schema.parse(JSON.parse(record.body));
  }

  async write<T>(path: StoragePath, data: T): Promise<void> {
    this.files.set(path.toString(), {
      mimeType: 'application/json',
      modifiedTime: new Date().toISOString(),
      body: JSON.stringify(data),
    });
  }

  async uploadBinary(path: StoragePath, blob: Blob, mimeType: string): Promise<void> {
    this.files.set(path.toString(), {
      mimeType,
      modifiedTime: new Date().toISOString(),
      body: blob,
    });
  }

  async list(folder: string, query?: ListQuery): Promise<StorageEntry[]> {
    const normalized = folder.replace(/^\/+|\/+$/g, '');
    const prefix = normalized.length === 0 ? '' : `${normalized}/`;
    const entries: StorageEntry[] = [];
    for (const [key, record] of this.files) {
      if (!key.startsWith(prefix)) continue;
      const rest = key.slice(prefix.length);
      if (rest.includes('/')) continue;
      if (query?.mimeType && record.mimeType !== query.mimeType) continue;
      entries.push({ name: rest, mimeType: record.mimeType, modifiedTime: record.modifiedTime });
    }
    return entries;
  }

  async delete(path: StoragePath): Promise<void> {
    const key = path.toString();
    this.files.delete(key);
    const prefix = `${key}/`;
    for (const fileKey of this.files.keys()) {
      if (fileKey.startsWith(prefix)) {
        this.files.delete(fileKey);
      }
    }
  }

  clear(): void {
    this.files.clear();
  }
}
