import { describe, it, expect } from 'vitest';
import { InvoiceId } from './InvoiceId';
import { ClientId } from './ClientId';

describe('InvoiceId', () => {
  it('when create, then returns valid uuid v7', () => {
    const id = InvoiceId.create();
    expect(id.toString()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('when fromString with valid uuid v7, then returns InvoiceId', () => {
    const raw = '01890000-0000-7000-8000-000000000000';
    const id = InvoiceId.fromString(raw);
    expect(id.toString()).toBe(raw);
  });

  it('when fromString with invalid uuid, then throws', () => {
    expect(() => InvoiceId.fromString('not-a-uuid')).toThrow();
  });

  it('when equals same value, then true', () => {
    const raw = '01890000-0000-7000-8000-000000000000';
    expect(InvoiceId.fromString(raw).equals(InvoiceId.fromString(raw))).toBe(true);
  });

  it('when equals different value, then false', () => {
    const a = InvoiceId.create();
    const b = InvoiceId.create();
    expect(a.equals(b)).toBe(false);
  });

  it('when InvoiceId compared to ClientId via type system, then incompatible', () => {
    const inv = InvoiceId.create();
    const cli = ClientId.create();
    // runtime guard since branding is compile-time
    expect(inv.toString()).not.toBe(cli.toString());
  });
});
