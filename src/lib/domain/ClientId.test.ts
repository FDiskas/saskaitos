import { describe, it, expect } from 'vitest';
import { ClientId } from './ClientId';

describe('ClientId', () => {
  it('when create, then returns valid uuid v7', () => {
    const id = ClientId.create();
    expect(id.toString()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('when fromString with invalid uuid, then throws', () => {
    expect(() => ClientId.fromString('xxx')).toThrow();
  });

  it('when equals same value, then true', () => {
    const raw = '01890000-0000-7000-8000-000000000000';
    expect(ClientId.fromString(raw).equals(ClientId.fromString(raw))).toBe(true);
  });
});
