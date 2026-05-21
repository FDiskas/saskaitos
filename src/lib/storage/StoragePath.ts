export class StoragePath {
  readonly folder: string;
  readonly name: string;

  private constructor(folder: string, name: string) {
    this.folder = folder;
    this.name = name;
  }

  static of(folder: string, name: string): StoragePath {
    if (name.length === 0) throw new Error('StoragePath name cannot be empty');
    return new StoragePath(StoragePath.normalize(folder), name);
  }

  static folder(folder: string): { file: (name: string) => StoragePath } {
    const normalized = StoragePath.normalize(folder);
    return { file: (name: string) => StoragePath.of(normalized, name) };
  }

  toString(): string {
    return this.folder.length === 0 ? this.name : `${this.folder}/${this.name}`;
  }

  equals(other: StoragePath): boolean {
    return this.folder === other.folder && this.name === other.name;
  }

  private static normalize(folder: string): string {
    return folder.replace(/^\/+|\/+$/g, '');
  }
}
