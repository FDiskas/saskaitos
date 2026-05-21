import { describe, it, expect } from 'vitest';
import { uuidV7, isUuidV7 } from './_uuid';

describe('uuidV7', () => {
  it('when generated, then matches v7 format', () => {
    const id = uuidV7();
    expect(isUuidV7(id)).toBe(true);
  });

  it('when generated twice quickly, then values differ', () => {
    const a = uuidV7();
    const b = uuidV7();
    expect(a).not.toBe(b);
  });

  it('when isUuidV7 on plain string, then false', () => {
    expect(isUuidV7('not-a-uuid')).toBe(false);
  });

  it('when isUuidV7 on uuid v4, then false', () => {
    expect(isUuidV7('00000000-0000-4000-8000-000000000000')).toBe(false);
  });

  it('when uuidV7(now) earlier < uuidV7(now) later, then lexicographic order', () => {
    const a = uuidV7(1_000_000_000_000);
    const b = uuidV7(2_000_000_000_000);
    expect(a < b).toBe(true);
  });
});
