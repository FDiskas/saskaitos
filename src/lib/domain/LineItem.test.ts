import { describe, it, expect } from 'vitest';
import { LineItem } from './LineItem';
import { Money } from './Money';

describe('LineItem', () => {
  it('when created, then exposes fields', () => {
    const item = LineItem.of({
      id: 'l1',
      description: 'Konsultacijos',
      quantity: 2,
      unit: 'val.',
      unitPrice: new Money(50),
    });
    expect(item.id).toBe('l1');
    expect(item.description).toBe('Konsultacijos');
    expect(item.quantity).toBe(2);
    expect(item.unit).toBe('val.');
    expect(item.unitPrice.equals(new Money(50))).toBe(true);
  });

  it('when total computed, then unitPrice * quantity', () => {
    const item = LineItem.of({
      id: 'l1',
      description: 'X',
      quantity: 3,
      unit: 'vnt.',
      unitPrice: new Money(12.34),
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
    });
    expect(item.total().isZero()).toBe(true);
  });

  it('when withPatch applied, then returns new instance', () => {
    const item = LineItem.of({
      id: 'l1',
      description: 'X',
      quantity: 1,
      unit: 'vnt.',
      unitPrice: new Money(10),
    });
    const patched = item.withPatch({ quantity: 5 });
    expect(item.quantity).toBe(1);
    expect(patched.quantity).toBe(5);
    expect(patched).not.toBe(item);
  });
});
