import { describe, it, expect } from 'vitest';
import { InvoiceNumber } from './InvoiceNumber';

describe('InvoiceNumber', () => {
  it('when created with prefix and number, then formats with 4-digit padding', () => {
    const n = InvoiceNumber.of('SF2026-', 1);
    expect(n.toString()).toBe('SF2026-0001');
  });

  it('when number is 9999, then no padding overflow', () => {
    expect(InvoiceNumber.of('INV-', 9999).toString()).toBe('INV-9999');
  });

  it('when number exceeds 9999, then keeps natural length', () => {
    expect(InvoiceNumber.of('SF-', 12345).toString()).toBe('SF-12345');
  });

  it('when equals same string, then true', () => {
    expect(InvoiceNumber.of('SF-', 1).equals(InvoiceNumber.of('SF-', 1))).toBe(true);
  });

  it('when number < 1, then throws', () => {
    expect(() => InvoiceNumber.of('SF-', 0)).toThrow();
  });
});
