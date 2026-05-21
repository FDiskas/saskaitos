import { type DriveClient, type DriveFile, type ListOptions, FOLDER_MIME } from './DriveClient';

interface FakeNode {
  id: string;
  name: string;
  mimeType: string;
  parentId: string;
  body?: string | Blob;
  trashed: boolean;
  modifiedTime: string;
  size?: number;
}

export class FakeDriveClient implements DriveClient {
  private nextId = 1;
  private readonly nodes = new Map<string, FakeNode>();

  async findFolder(name: string, parentId: string): Promise<string | null> {
    for (const node of this.nodes.values()) {
      if (node.parentId !== parentId || node.trashed) continue;
      if (node.mimeType !== FOLDER_MIME || node.name !== name) continue;
      return node.id;
    }
    return null;
  }

  async createFolder(name: string, parentId: string): Promise<string> {
    const id = this.allocId();
    this.nodes.set(id, {
      id,
      name,
      mimeType: FOLDER_MIME,
      parentId,
      trashed: false,
      modifiedTime: new Date().toISOString(),
    });
    return id;
  }

  async findFile(name: string, parentId: string): Promise<DriveFile | null> {
    for (const node of this.nodes.values()) {
      if (node.parentId !== parentId || node.trashed) continue;
      if (node.mimeType === FOLDER_MIME) continue;
      if (node.name !== name) continue;
      return toDriveFile(node);
    }
    return null;
  }

  async listFiles(parentId: string, opts: ListOptions = {}): Promise<DriveFile[]> {
    const wantTrashed = opts.trashed ?? false;
    const matches: DriveFile[] = [];
    for (const node of this.nodes.values()) {
      if (node.parentId !== parentId) continue;
      if (node.trashed !== wantTrashed) continue;
      if (node.mimeType === FOLDER_MIME) continue;
      if (opts.mimeType && node.mimeType !== opts.mimeType) continue;
      matches.push(toDriveFile(node));
    }
    return matches;
  }

  async getMediaText(fileId: string): Promise<string> {
    const node = this.nodes.get(fileId);
    if (!node) throw new Error(`Fake: file ${fileId} not found`);
    const body = node.body;
    if (typeof body === 'string') return body;
    if (body instanceof Blob) return body.text();
    return '';
  }

  async uploadJson(args: { name: string; parentId: string; body: unknown; fileId?: string }): Promise<DriveFile> {
    return this.write({
      name: args.name,
      parentId: args.parentId,
      mimeType: 'application/json',
      body: JSON.stringify(args.body),
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
    return this.write({
      name: args.name,
      parentId: args.parentId,
      mimeType: args.mimeType,
      body: args.blob,
      fileId: args.fileId,
      size: args.blob.size,
    });
  }

  async trash(fileId: string): Promise<void> {
    const node = this.nodes.get(fileId);
    if (!node) return;
    node.trashed = true;
  }

  private write(args: {
    name: string;
    parentId: string;
    mimeType: string;
    body: string | Blob;
    fileId?: string;
    size?: number;
  }): DriveFile {
    const id = args.fileId ?? this.allocId();
    const existing = this.nodes.get(id);
    const node: FakeNode = {
      id,
      name: args.name,
      mimeType: args.mimeType,
      parentId: existing?.parentId ?? args.parentId,
      body: args.body,
      trashed: false,
      modifiedTime: new Date().toISOString(),
      size: args.size,
    };
    this.nodes.set(id, node);
    return toDriveFile(node);
  }

  private allocId(): string {
    const id = `fake-${this.nextId}`;
    this.nextId += 1;
    return id;
  }
}

function toDriveFile(node: FakeNode): DriveFile {
  return {
    id: node.id,
    name: node.name,
    mimeType: node.mimeType,
    modifiedTime: node.modifiedTime,
    size: node.size,
  };
}
