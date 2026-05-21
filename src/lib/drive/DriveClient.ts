import type { Fetcher } from './http/Fetcher';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: number;
}

export interface ListOptions {
  mimeType?: string;
  trashed?: boolean;
}

export const FOLDER_MIME = 'application/vnd.google-apps.folder';

export interface DriveClient {
  findFolder(name: string, parentId: string): Promise<string | null>;
  createFolder(name: string, parentId: string): Promise<string>;
  findFile(name: string, parentId: string): Promise<DriveFile | null>;
  listFiles(parentId: string, opts?: ListOptions): Promise<DriveFile[]>;
  getMediaText(fileId: string): Promise<string>;
  uploadJson(args: { name: string; parentId: string; body: unknown; fileId?: string }): Promise<DriveFile>;
  uploadBinary(args: {
    name: string;
    parentId: string;
    blob: Blob;
    mimeType: string;
    fileId?: string;
  }): Promise<DriveFile>;
  trash(fileId: string): Promise<void>;
}

const API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

export class GoogleDriveClient implements DriveClient {
  private readonly fetcher: Fetcher;

  constructor(fetcher: Fetcher) {
    this.fetcher = fetcher;
  }

  async findFolder(name: string, parentId: string): Promise<string | null> {
    const file = await this.findByQuery(
      `name='${escapeQuery(name)}' and mimeType='${FOLDER_MIME}' and '${parentId}' in parents and trashed=false`,
    );
    return file?.id ?? null;
  }

  async createFolder(name: string, parentId: string): Promise<string> {
    const res = await this.json('POST', `${API_BASE}/files?fields=id,name,mimeType`, {
      name,
      mimeType: FOLDER_MIME,
      parents: [parentId],
    });
    return parseDriveFile(res).id;
  }

  async findFile(name: string, parentId: string): Promise<DriveFile | null> {
    return this.findByQuery(
      `name='${escapeQuery(name)}' and '${parentId}' in parents and trashed=false`,
    );
  }

  async listFiles(parentId: string, opts: ListOptions = {}): Promise<DriveFile[]> {
    const clauses = [`'${parentId}' in parents`, `trashed=${opts.trashed ?? false}`];
    if (opts.mimeType) clauses.push(`mimeType='${opts.mimeType}'`);
    const url = `${API_BASE}/files?q=${encodeURIComponent(clauses.join(' and '))}&fields=files(id,name,mimeType,modifiedTime,size)&pageSize=1000`;
    const res = await this.fetchOk(new Request(url, { method: 'GET' }));
    const data = (await res.json()) as { files?: unknown[] };
    return (data.files ?? []).map(parseDriveFile);
  }

  async getMediaText(fileId: string): Promise<string> {
    const res = await this.fetchOk(
      new Request(`${API_BASE}/files/${encodeURIComponent(fileId)}?alt=media`, { method: 'GET' }),
    );
    return res.text();
  }

  async uploadJson(args: {
    name: string;
    parentId: string;
    body: unknown;
    fileId?: string;
  }): Promise<DriveFile> {
    return this.uploadMultipart({
      name: args.name,
      parentId: args.parentId,
      mimeType: 'application/json',
      body: new Blob([JSON.stringify(args.body)], { type: 'application/json' }),
      fileId: args.fileId,
    });
  }

  async uploadBinary(args: {
    name: string;
    parentId: string;
    blob: Blob;
    mimeType: string;
    fileId?: string;
  }): Promise<DriveFile> {
    return this.uploadMultipart({
      name: args.name,
      parentId: args.parentId,
      mimeType: args.mimeType,
      body: args.blob,
      fileId: args.fileId,
    });
  }

  async trash(fileId: string): Promise<void> {
    await this.json('PATCH', `${API_BASE}/files/${encodeURIComponent(fileId)}`, { trashed: true });
  }

  private async findByQuery(q: string): Promise<DriveFile | null> {
    const url = `${API_BASE}/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,modifiedTime,size)&pageSize=1`;
    const res = await this.fetchOk(new Request(url, { method: 'GET' }));
    const data = (await res.json()) as { files?: unknown[] };
    const first = data.files?.[0];
    return first ? parseDriveFile(first) : null;
  }

  private async uploadMultipart(args: {
    name: string;
    parentId: string;
    mimeType: string;
    body: Blob;
    fileId?: string;
  }): Promise<DriveFile> {
    const boundary = `bnd_${Math.random().toString(36).slice(2)}`;
    const metadata = args.fileId
      ? { name: args.name, mimeType: args.mimeType }
      : { name: args.name, mimeType: args.mimeType, parents: [args.parentId] };
    const head = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${args.mimeType}\r\n\r\n`;
    const tail = `\r\n--${boundary}--`;
    const body = new Blob([head, args.body, tail], { type: `multipart/related; boundary=${boundary}` });
    const url = args.fileId
      ? `${UPLOAD_BASE}/files/${encodeURIComponent(args.fileId)}?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size`
      : `${UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size`;
    const res = await this.fetchOk(
      new Request(url, {
        method: args.fileId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body,
      }),
    );
    return parseDriveFile(await res.json());
  }

  private async json(method: 'POST' | 'PATCH' | 'PUT', url: string, body: unknown): Promise<unknown> {
    const res = await this.fetchOk(
      new Request(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    );
    return res.json();
  }

  private async fetchOk(req: Request): Promise<Response> {
    const res = await this.fetcher.fetch(req);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new DriveApiError(res.status, text || res.statusText);
    }
    return res;
  }
}

export class DriveApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(`Drive API ${status}: ${message}`);
    this.name = 'DriveApiError';
    this.status = status;
  }
}

function escapeQuery(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function parseDriveFile(raw: unknown): DriveFile {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid Drive file payload');
  const obj = raw as Record<string, unknown>;
  const id = obj.id;
  const name = obj.name;
  const mimeType = obj.mimeType;
  if (typeof id !== 'string' || typeof name !== 'string' || typeof mimeType !== 'string') {
    throw new Error('Invalid Drive file payload');
  }
  const modifiedTime = typeof obj.modifiedTime === 'string' ? obj.modifiedTime : undefined;
  const sizeRaw = obj.size;
  const size = typeof sizeRaw === 'string' ? Number(sizeRaw) : typeof sizeRaw === 'number' ? sizeRaw : undefined;
  return { id, name, mimeType, modifiedTime, size };
}
