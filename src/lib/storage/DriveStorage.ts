import type { ZodType } from 'zod';
import type { DriveClient } from '@/lib/drive/DriveClient';
import type { ListQuery, Storage, StorageEntry } from './Storage';
import type { StoragePath } from './StoragePath';

const ROOT = 'root';

export class DriveStorage implements Storage {
  private readonly folderIds = new Map<string, string>();
  private readonly client: DriveClient;

  constructor(client: DriveClient) {
    this.client = client;
  }

  async read<T>(path: StoragePath, schema: ZodType<T>): Promise<T | null> {
    const parentId = await this.resolveFolder(path.folder, { create: false });
    if (!parentId) return null;
    const file = await this.client.findFile(path.name, parentId);
    if (!file) return null;
    const text = await this.client.getMediaText(file.id);
    return schema.parse(JSON.parse(text));
  }

  async write<T>(path: StoragePath, data: T): Promise<void> {
    const parentId = await this.resolveFolder(path.folder, { create: true });
    if (!parentId) throw new Error('Failed to resolve folder');
    const existing = await this.client.findFile(path.name, parentId);
    await this.client.uploadJson({
      name: path.name,
      parentId,
      body: data,
      fileId: existing?.id,
    });
  }

  async uploadBinary(path: StoragePath, blob: Blob, mimeType: string): Promise<void> {
    const parentId = await this.resolveFolder(path.folder, { create: true });
    if (!parentId) throw new Error('Failed to resolve folder');
    const existing = await this.client.findFile(path.name, parentId);
    await this.client.uploadBinary({
      name: path.name,
      parentId,
      blob,
      mimeType,
      fileId: existing?.id,
    });
  }

  async list(folder: string, query?: ListQuery): Promise<StorageEntry[]> {
    const parentId = await this.resolveFolder(folder, { create: false });
    if (!parentId) return [];
    const files = await this.client.listFiles(parentId, {
      mimeType: query?.mimeType,
      trashed: query?.trashed ?? false,
    });
    return files.map((f) => ({
      name: f.name,
      mimeType: f.mimeType,
      modifiedTime: f.modifiedTime,
      size: f.size,
    }));
  }

  async delete(path: StoragePath): Promise<void> {
    const parentId = await this.resolveFolder(path.folder, { create: false });
    if (!parentId) return;
    const file = await this.client.findFile(path.name, parentId);
    if (!file) return;
    await this.client.trash(file.id);
  }

  private async resolveFolder(folder: string, opts: { create: boolean }): Promise<string | null> {
    const normalized = folder.replace(/^\/+|\/+$/g, '');
    if (normalized.length === 0) return ROOT;
    const cached = this.folderIds.get(normalized);
    if (cached) return cached;
    const segments = normalized.split('/');
    let parentId = ROOT;
    let accumulated = '';
    for (const segment of segments) {
      accumulated = accumulated.length === 0 ? segment : `${accumulated}/${segment}`;
      const memo = this.folderIds.get(accumulated);
      if (memo) {
        parentId = memo;
        continue;
      }
      const existing = await this.client.findFolder(segment, parentId);
      if (existing) {
        this.folderIds.set(accumulated, existing);
        parentId = existing;
        continue;
      }
      if (!opts.create) return null;
      const created = await this.client.createFolder(segment, parentId);
      this.folderIds.set(accumulated, created);
      parentId = created;
    }
    return parentId;
  }
}
