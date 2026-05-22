import { type Money } from './Money';

export type VatPercent = 0 | 5 | 9 | 21;

const ALLOWED: ReadonlySet<number> = new Set([0, 5, 9, 21]);

export interface VatBreakdown {
  net: Money;
  vat: Money;
  gross: Money;
}

export class VatRate {
  public readonly percent: VatPercent;

  private constructor(percent: VatPercent) {
    this.percent = percent;
  }

  static of(percent: VatPercent): VatRate {
    if (!ALLOWED.has(percent)) {
      throw new Error(`Invalid VAT percent: ${String(percent)}`);
    }
    return new VatRate(percent);
  }

  apply(net: Money): VatBreakdown {
    const vat = net.multiply(this.percent / 100);
    return { net, vat, gross: net.add(vat) };
  }

  equals(other: VatRate): boolean {
    return this.percent === other.percent;
  }
}
