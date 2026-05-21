import type { ZodType } from 'zod';
import type { StoragePath } from './StoragePath';

export interface StorageEntry {
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: number;
}

export interface ListQuery {
  mimeType?: string;
  trashed?: boolean;
}

export interface Storage {
  read<T>(path: StoragePath, schema: ZodType<T>): Promise<T | null>;
  write<T>(path: StoragePath, data: T): Promise<void>;
  uploadBinary(path: StoragePath, blob: Blob, mimeType: string): Promise<void>;
  list(folder: string, query?: ListQuery): Promise<StorageEntry[]>;
  delete(path: StoragePath): Promise<void>;
}
