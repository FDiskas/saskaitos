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

  it('when parse "SF2026-0042", then prefix "SF2026-" + sequence 42', () => {
    const n = InvoiceNumber.parse('SF2026-0042', 'X-');
    expect(n.prefix).toBe('SF2026-');
    expect(n.sequence).toBe(42);
  });

  it('when parse "INV-123", then preserves prefix and number', () => {
    const n = InvoiceNumber.parse('INV-123', 'X-');
    expect(n.prefix).toBe('INV-');
    expect(n.sequence).toBe(123);
  });

  it('when parse string without trailing digits, then uses default prefix + sequence 1', () => {
    const n = InvoiceNumber.parse('abc', 'FALLBACK-');
    expect(n.prefix).toBe('FALLBACK-');
    expect(n.sequence).toBe(1);
  });

  it('when parse empty string, then uses default prefix + sequence 1', () => {
    const n = InvoiceNumber.parse('', 'FALLBACK-');
    expect(n.prefix).toBe('FALLBACK-');
    expect(n.sequence).toBe(1);
  });

  it('when parse pure digits "0007", then prefix empty + sequence 7', () => {
    const n = InvoiceNumber.parse('0007', 'X-');
    expect(n.prefix).toBe('');
    expect(n.sequence).toBe(7);
  });
});
