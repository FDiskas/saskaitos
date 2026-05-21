import { describe, it, expect } from 'vitest';
import { StoragePath } from './StoragePath';

describe('StoragePath', () => {
  it('when constructed with folder and name, then exposes them', () => {
    const p = StoragePath.of('Saskaitos_App', 'clients.json');
    expect(p.folder).toBe('Saskaitos_App');
    expect(p.name).toBe('clients.json');
  });

  it('when toString called, then returns folder/name', () => {
    expect(StoragePath.of('A/B', 'c.json').toString()).toBe('A/B/c.json');
  });

  it('when root file (empty folder), then toString omits leading slash', () => {
    expect(StoragePath.of('', 'top.json').toString()).toBe('top.json');
  });

  it('when same folder + name, then equals returns true', () => {
    expect(StoragePath.of('X', 'y').equals(StoragePath.of('X', 'y'))).toBe(true);
  });

  it('when different name, then equals returns false', () => {
    expect(StoragePath.of('X', 'y').equals(StoragePath.of('X', 'z'))).toBe(false);
  });

  it('when name is empty, then throws', () => {
    expect(() => StoragePath.of('A', '')).toThrow();
  });

  it('when folder has leading or trailing slash, then it is trimmed', () => {
    expect(StoragePath.of('/A/B/', 'c.json').folder).toBe('A/B');
  });

  it('when withinFolder, then returns child path', () => {
    const folder = StoragePath.folder('A/B');
    const child = folder.file('c.json');
    expect(child.toString()).toBe('A/B/c.json');
  });
});
