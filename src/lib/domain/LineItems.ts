import { type LineItem, type LineItemPatch } from './LineItem';
import { Money } from './Money';
import { type VatRate } from './VatRate';

export class LineItems implements Iterable<LineItem> {
  private readonly items: ReadonlyArray<LineItem>;

  private constructor(items: ReadonlyArray<LineItem>) {
    this.items = items;
  }

  static empty(): LineItems {
    return new LineItems([]);
  }

  static of(items: ReadonlyArray<LineItem>): LineItems {
    const seen = new Set<string>();
    for (const it of items) {
      if (seen.has(it.id)) throw new Error(`Duplicate LineItem id: ${it.id}`);
      seen.add(it.id);
    }
    return new LineItems([...items]);
  }

  add(item: LineItem): LineItems {
    if (this.items.some((i) => i.id === item.id)) {
      throw new Error(`Duplicate LineItem id: ${item.id}`);
    }
    return new LineItems([...this.items, item]);
  }

  remove(id: string): LineItems {
    return new LineItems(this.items.filter((i) => i.id !== id));
  }

  update(id: string, patch: LineItemPatch): LineItems {
    return new LineItems(this.items.map((i) => (i.id === id ? i.withPatch(patch) : i)));
  }

  reorder(from: number, to: number): LineItems {
    const next = [...this.items];
    const [moved] = next.splice(from, 1);
    if (moved === undefined) return this;
    next.splice(to, 0, moved);
    return new LineItems(next);
  }

  get(id: string): LineItem | undefined {
    return this.items.find((i) => i.id === id);
  }

  count(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  subtotal(currency: string = 'EUR'): Money {
    return this.items.reduce(
      (acc, item) => acc.add(item.total()),
      Money.zero(currency),
    );
  }

  vatAmount(currency: string = 'EUR'): Money {
    return this.items.reduce(
      (acc, item) => acc.add(item.vatAmount()),
      Money.zero(currency),
    );
  }

  withVatRateAll(rate: VatRate): LineItems {
    return new LineItems(this.items.map((item) => item.withVatRate(rate)));
  }

  toArray(): ReadonlyArray<LineItem> {
    return this.items;
  }

  [Symbol.iterator](): Iterator<LineItem> {
    return this.items[Symbol.iterator]();
  }
}
