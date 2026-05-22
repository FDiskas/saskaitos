import { describe, it, expect } from 'vitest';
import { LineItems } from './LineItems';
import { LineItem } from './LineItem';
import { Money } from './Money';
import { VatRate } from './VatRate';

function item(id: string, qty: number, price: number): LineItem {
  return LineItem.of({
    id,
    description: id,
    quantity: qty,
    unit: 'vnt.',
    unitPrice: new Money(price),
    vatRate: VatRate.of(21),
  });
}

describe('LineItems', () => {
  it('when empty, then count 0 and isEmpty true', () => {
    const items = LineItems.empty();
    expect(items.count()).toBe(0);
    expect(items.isEmpty()).toBe(true);
    expect(items.subtotal().isZero()).toBe(true);
  });

  it('when add item, then count increments and original unchanged', () => {
    const items = LineItems.empty();
    const added = items.add(item('a', 1, 10));
    expect(items.count()).toBe(0);
    expect(added.count()).toBe(1);
  });

  it('when subtotal across 2 items, then sums', () => {
    const items = LineItems.empty().add(item('a', 2, 10)).add(item('b', 1, 5));
    expect(items.subtotal().toCents()).toBe(2500);
  });

  it('when remove existing id, then count decrements', () => {
    const items = LineItems.empty().add(item('a', 1, 10)).add(item('b', 1, 10));
    const r = items.remove('a');
    expect(r.count()).toBe(1);
    expect(items.count()).toBe(2);
  });

  it('when remove unknown id, then no change', () => {
    const items = LineItems.empty().add(item('a', 1, 10));
    expect(items.remove('zzz').count()).toBe(1);
  });

  it('when update existing item, then patched and original unchanged', () => {
    const items = LineItems.empty().add(item('a', 1, 10));
    const r = items.update('a', { quantity: 5 });
    expect(r.subtotal().toCents()).toBe(5000);
    expect(items.subtotal().toCents()).toBe(1000);
  });

  it('when reorder from 0 to 2, then order changes', () => {
    const items = LineItems.empty()
      .add(item('a', 1, 1))
      .add(item('b', 1, 1))
      .add(item('c', 1, 1));
    const r = items.reorder(0, 2);
    expect([...r].map((i) => i.id)).toEqual(['b', 'c', 'a']);
  });

  it('when iterate, then yields all items in order', () => {
    const items = LineItems.empty().add(item('a', 1, 1)).add(item('b', 1, 1));
    expect([...items].map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('when add item with duplicate id, then throws', () => {
    const items = LineItems.empty().add(item('a', 1, 1));
    expect(() => items.add(item('a', 1, 1))).toThrow();
  });

  it('when get existing id, then returns item', () => {
    const items = LineItems.empty().add(item('a', 2, 5));
    expect(items.get('a')?.total().toCents()).toBe(1000);
  });

  it('when get unknown id, then returns undefined', () => {
    const items = LineItems.empty();
    expect(items.get('x')).toBeUndefined();
  });
});
