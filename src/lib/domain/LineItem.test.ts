import { describe, it, expect } from 'vitest';
import { LineItem } from './LineItem';
import { Money } from './Money';
import { VatRate } from './VatRate';
import { isUuidV7 } from './_uuid';

describe('LineItem', () => {
  it('when created, then exposes fields', () => {
    const item = LineItem.of({
      id: 'l1',
      description: 'Konsultacijos',
      quantity: 2,
      unit: 'val.',
      unitPrice: new Money(50),
      vatRate: VatRate.of(21),
    });
    expect(item.id).toBe('l1');
    expect(item.description).toBe('Konsultacijos');
    expect(item.quantity).toBe(2);
    expect(item.unit).toBe('val.');
    expect(item.unitPrice.equals(new Money(50))).toBe(true);
    expect(item.vatRate.equals(VatRate.of(21))).toBe(true);
  });

  it('when total computed, then unitPrice * quantity', () => {
    const item = LineItem.of({
      id: 'l1',
      description: 'X',
      quantity: 3,
      unit: 'vnt.',
      unitPrice: new Money(12.34),
      vatRate: VatRate.of(21),
    });
    expect(item.total().toCents()).toBe(3702);
  });

  it('when total of zero qty, then zero money', () => {
    const item = LineItem.of({
      id: 'l1',
      description: 'X',
      quantity: 0,
      unit: 'vnt.',
      unitPrice: new Money(10),
      vatRate: VatRate.of(21),
    });
    expect(item.total().isZero()).toBe(true);
  });

  it('when create with quantity/unit/unitPrice, then generates v7 id', () => {
    const item = LineItem.create({
      description: 'X',
      quantity: 1,
      unit: 'vnt.',
      unitPrice: new Money(10),
      vatRate: VatRate.of(21),
    });
    expect(isUuidV7(item.id)).toBe(true);
  });

  it('when create called twice, then ids differ', () => {
    const a = LineItem.create({ description: '', quantity: 1, unit: 'vnt.', unitPrice: Money.zero(), vatRate: VatRate.of(21) });
    const b = LineItem.create({ description: '', quantity: 1, unit: 'vnt.', unitPrice: Money.zero(), vatRate: VatRate.of(21) });
    expect(a.id).not.toBe(b.id);
  });

  it('when withPatch applied, then returns new instance', () => {
    const item = LineItem.of({
      id: 'l1',
      description: 'X',
      quantity: 1,
      unit: 'vnt.',
      unitPrice: new Money(10),
      vatRate: VatRate.of(21),
    });
    const patched = item.withPatch({ quantity: 5 });
    expect(item.quantity).toBe(1);
    expect(patched.quantity).toBe(5);
    expect(patched).not.toBe(item);
  });

  it('when item has 9% VAT, then vatAmount uses item rate', () => {
    const item = LineItem.of({
      id: 'l1',
      description: 'X',
      quantity: 2,
      unit: 'vnt.',
      unitPrice: new Money(50),
      vatRate: VatRate.of(9),
    });
    expect(item.vatAmount().toCents()).toBe(900);
  });

  it('when withPatch changes vatRate, then vatAmount reflects new rate', () => {
    const item = LineItem.of({
      id: 'l1',
      description: 'X',
      quantity: 1,
      unit: 'vnt.',
      unitPrice: new Money(100),
      vatRate: VatRate.of(21),
    });
    const patched = item.withPatch({ vatRate: VatRate.of(5) });
    expect(patched.vatAmount().toCents()).toBe(500);
  });
});
