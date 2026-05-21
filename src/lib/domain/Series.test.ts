import { describe, it, expect } from 'vitest';
import { Series } from './Series';

describe('Series', () => {
  it('when created, then exposes id, prefix, nextNumber, isDefault', () => {
    const s = Series.of({ id: 'a', prefix: 'SF2026-', nextNumber: 1, isDefault: true });
    expect(s.id).toBe('a');
    expect(s.prefix).toBe('SF2026-');
    expect(s.nextNumber).toBe(1);
    expect(s.isDefault).toBe(true);
  });

  it('when next() called, then returns formatted number and updated series', () => {
    const s = Series.of({ id: 'a', prefix: 'SF2026-', nextNumber: 1, isDefault: true });
    const { number, updatedSeries } = s.next();
    expect(number.toString()).toBe('SF2026-0001');
    expect(updatedSeries.nextNumber).toBe(2);
  });

  it('when next() called, then original is unchanged (immutable)', () => {
    const s = Series.of({ id: 'a', prefix: 'SF2026-', nextNumber: 5, isDefault: false });
    s.next();
    expect(s.nextNumber).toBe(5);
  });

  it('when next() called repeatedly via returned series, then sequence increments', () => {
    let s = Series.of({ id: 'a', prefix: 'INV-', nextNumber: 1, isDefault: true });
    const numbers: string[] = [];
    for (let i = 0; i < 3; i++) {
      const r = s.next();
      numbers.push(r.number.toString());
      s = r.updatedSeries;
    }
    expect(numbers).toEqual(['INV-0001', 'INV-0002', 'INV-0003']);
  });

  it('when withDefault toggled, then returns new instance', () => {
    const s = Series.of({ id: 'a', prefix: 'X-', nextNumber: 1, isDefault: false });
    const promoted = s.withDefault(true);
    expect(s.isDefault).toBe(false);
    expect(promoted.isDefault).toBe(true);
  });
});
