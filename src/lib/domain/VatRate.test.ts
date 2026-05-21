import { describe, it, expect } from 'vitest';
import { VatRate } from './VatRate';
import { Money } from './Money';

describe('VatRate', () => {
  it('when VatRate.of(21), then percent is 21', () => {
    expect(VatRate.of(21).percent).toBe(21);
  });

  it('when invalid percent passed, then throws', () => {
    // @ts-expect-error testing runtime validation on bad input
    expect(() => VatRate.of(13)).toThrow();
  });

  it('when apply 21% to 100 EUR, then net 100, vat 21, gross 121', () => {
    const r = VatRate.of(21).apply(new Money(100));
    expect(r.net.toCents()).toBe(10000);
    expect(r.vat.toCents()).toBe(2100);
    expect(r.gross.toCents()).toBe(12100);
  });

  it('when apply 0% to 100 EUR, then vat is zero, gross equals net', () => {
    const r = VatRate.of(0).apply(new Money(100));
    expect(r.vat.isZero()).toBe(true);
    expect(r.gross.equals(r.net)).toBe(true);
  });

  it('when apply 9% to 123.45, then vat = 11.11 (bankers round)', () => {
    const r = VatRate.of(9).apply(new Money(123.45));
    expect(r.vat.toCents()).toBe(1111);
    expect(r.gross.toCents()).toBe(13456);
  });

  it('when equals same percent, then true', () => {
    expect(VatRate.of(21).equals(VatRate.of(21))).toBe(true);
  });
});
