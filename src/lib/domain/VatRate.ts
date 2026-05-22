import { type Money } from './Money';

export type VatPercent = 0 | 5 | 9 | 21;

export const VAT_PERCENTS: ReadonlyArray<VatPercent> = [21, 9, 5, 0];

const ALLOWED: ReadonlySet<number> = new Set<number>(VAT_PERCENTS);

function isVatPercent(value: number): value is VatPercent {
  return ALLOWED.has(value);
}

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

  static fromInput(value: string | number): VatRate {
    const num = typeof value === 'number' ? value : Number.parseInt(value, 10);
    if (!Number.isFinite(num) || !isVatPercent(num)) {
      throw new Error(`Invalid VAT percent: ${String(value)}`);
    }
    return new VatRate(num);
  }

  apply(net: Money): VatBreakdown {
    const vat = net.multiply(this.percent / 100);
    return { net, vat, gross: net.add(vat) };
  }

  equals(other: VatRate): boolean {
    return this.percent === other.percent;
  }
}
