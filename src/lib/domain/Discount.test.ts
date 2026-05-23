import { describe, it, expect } from 'vitest';
import { Discount } from './Discount';
import { Money, CurrencyMismatchError } from './Money';

describe('Discount', () => {
  describe('construction', () => {
    it('when none, then isZero and applies zero discount', () => {
      const d = Discount.none();
      expect(d.isZero()).toBe(true);
      expect(d.applyTo(new Money(100)).isZero()).toBe(true);
    });

    it('when percent 10, then exposes kind and percent', () => {
      const d = Discount.percent(10);
      expect(d.kind).toBe('percent');
      expect(d.percent).toBe(10);
      expect(d.isZero()).toBe(false);
    });

    it('when percent 0, then isZero', () => {
      expect(Discount.percent(0).isZero()).toBe(true);
    });

    it('when fixed 5 EUR, then exposes kind and amount', () => {
      const d = Discount.fixed(new Money(5));
      expect(d.kind).toBe('fixed');
      expect(d.amount.toCents()).toBe(500);
      expect(d.isZero()).toBe(false);
    });

    it('when fixed zero money, then isZero', () => {
      expect(Discount.fixed(Money.zero()).isZero()).toBe(true);
    });

    it('when percent negative, then throws', () => {
      expect(() => Discount.percent(-1)).toThrow();
    });

    it('when percent > 100, then throws', () => {
      expect(() => Discount.percent(101)).toThrow();
    });

    it('when fixed negative money, then throws', () => {
      expect(() => Discount.fixed(new Money(-1))).toThrow();
    });
  });

  describe('applyTo', () => {
    it('when percent 10 on 100 EUR, then 10 EUR discount', () => {
      const result = Discount.percent(10).applyTo(new Money(100));
      expect(result.toCents()).toBe(1000);
    });

    it('when percent 21 on 223.45 EUR, then 46.92 EUR (bankers rounding)', () => {
      const result = Discount.percent(21).applyTo(new Money(223.45));
      expect(result.toCents()).toBe(4692);
    });

    it('when fixed 5 EUR on 100 EUR, then 5 EUR discount', () => {
      const result = Discount.fixed(new Money(5)).applyTo(new Money(100));
      expect(result.toCents()).toBe(500);
    });

    it('when fixed amount exceeds net, then capped at net', () => {
      const result = Discount.fixed(new Money(150)).applyTo(new Money(100));
      expect(result.toCents()).toBe(10000);
    });

    it('when applied to zero, then zero', () => {
      expect(Discount.percent(50).applyTo(Money.zero()).isZero()).toBe(true);
    });

    it('when fixed currency mismatches net, then throws CurrencyMismatchError', () => {
      const d = Discount.fixed(new Money(5, 'EUR'));
      expect(() => d.applyTo(new Money(100, 'USD'))).toThrow(CurrencyMismatchError);
    });

    it('when none applied, then result currency matches net currency', () => {
      const result = Discount.none().applyTo(new Money(100, 'USD'));
      expect(result.currency).toBe('USD');
      expect(result.isZero()).toBe(true);
    });
  });

  describe('equality', () => {
    it('when two percent discounts of same value, then equal', () => {
      expect(Discount.percent(10).equals(Discount.percent(10))).toBe(true);
    });

    it('when different percent values, then not equal', () => {
      expect(Discount.percent(10).equals(Discount.percent(20))).toBe(false);
    });

    it('when two fixed of same money, then equal', () => {
      expect(Discount.fixed(new Money(5)).equals(Discount.fixed(new Money(5)))).toBe(true);
    });

    it('when percent vs fixed, then not equal', () => {
      expect(Discount.percent(10).equals(Discount.fixed(new Money(10)))).toBe(false);
    });

    it('when two none, then equal', () => {
      expect(Discount.none().equals(Discount.none())).toBe(true);
    });
  });
});
