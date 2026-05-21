import { describe, it, expect } from 'vitest';
import { Money, CurrencyMismatchError } from './Money';

describe('Money', () => {
  describe('construction', () => {
    it('when created from 12.34 EUR, then stores 1234 cents', () => {
      const m = new Money(12.34, 'EUR');
      expect(m.toCents()).toBe(1234);
      expect(m.currency).toBe('EUR');
    });

    it('when created without currency, then defaults to EUR', () => {
      expect(new Money(1).currency).toBe('EUR');
    });

    it('when created from cents 1234, then represents 12.34', () => {
      const m = Money.fromCents(1234, 'EUR');
      expect(m.toNumber()).toBe(12.34);
    });

    it('when Money.zero(), then is zero EUR', () => {
      const z = Money.zero();
      expect(z.isZero()).toBe(true);
      expect(z.currency).toBe('EUR');
    });

    it('when rounding 2.125 with bankers rounding, then 2.12', () => {
      expect(new Money(2.125).toCents()).toBe(212);
    });

    it('when rounding 2.135 with bankers rounding, then 2.14', () => {
      expect(new Money(2.135).toCents()).toBe(214);
    });
  });

  describe('arithmetic', () => {
    it('when 0.1 + 0.2, then exactly 0.3 (no float drift)', () => {
      const result = new Money(0.1).add(new Money(0.2));
      expect(result.toCents()).toBe(30);
      expect(result.toNumber()).toBe(0.3);
    });

    it('when subtract, then computes difference', () => {
      const result = new Money(5).subtract(new Money(1.5));
      expect(result.toCents()).toBe(350);
    });

    it('when multiply by 3, then triples amount', () => {
      const result = new Money(10).multiply(3);
      expect(result.toCents()).toBe(3000);
    });

    it('when multiply by 0.21 (vat), then rounds correctly', () => {
      const result = new Money(100).multiply(0.21);
      expect(result.toCents()).toBe(2100);
    });

    it('when multiply produces fractional cent, then bankers rounds', () => {
      // 1.235 * 1 → 1.24 (round half to even, 4 is even)
      const result = new Money(1.235).multiply(1);
      expect(result.toCents()).toBe(124);
    });

    it('when add different currency, then throws CurrencyMismatchError', () => {
      const eur = new Money(10, 'EUR');
      const usd = new Money(10, 'USD');
      expect(() => eur.add(usd)).toThrow(CurrencyMismatchError);
    });

    it('when subtract different currency, then throws CurrencyMismatchError', () => {
      const eur = new Money(10, 'EUR');
      const usd = new Money(10, 'USD');
      expect(() => eur.subtract(usd)).toThrow(CurrencyMismatchError);
    });
  });

  describe('immutability', () => {
    it('when add called, then original unchanged', () => {
      const original = new Money(10);
      const added = original.add(new Money(5));
      expect(original.toCents()).toBe(1000);
      expect(added).not.toBe(original);
    });
  });

  describe('predicates', () => {
    it('when equals same value+currency, then true', () => {
      expect(new Money(10).equals(new Money(10))).toBe(true);
    });

    it('when equals different currency, then false', () => {
      expect(new Money(10, 'EUR').equals(new Money(10, 'USD'))).toBe(false);
    });

    it('when isZero on zero, then true', () => {
      expect(Money.zero().isZero()).toBe(true);
    });

    it('when isNegative on -5, then true', () => {
      expect(new Money(-5).isNegative()).toBe(true);
    });

    it('when isNegative on 5, then false', () => {
      expect(new Money(5).isNegative()).toBe(false);
    });
  });

  describe('format', () => {
    it('when format 1234.56 lt-LT, then 1 234,56 €', () => {
      const formatted = new Money(1234.56).format('lt-LT');
      expect(formatted).toMatch(/1\s?234,56\s?€/);
    });

    it('when format 0, then 0,00 €', () => {
      expect(Money.zero().format('lt-LT')).toMatch(/0,00\s?€/);
    });
  });
});
