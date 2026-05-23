import { CurrencyMismatchError, Money } from './Money';

export type DiscountKind = 'none' | 'percent' | 'fixed';

interface NoneProps {
  kind: 'none';
}

interface PercentProps {
  kind: 'percent';
  percent: number;
}

interface FixedProps {
  kind: 'fixed';
  amount: Money;
}

type DiscountProps = NoneProps | PercentProps | FixedProps;

export class Discount {
  private readonly props: DiscountProps;

  private constructor(props: DiscountProps) {
    this.props = props;
  }

  static none(): Discount {
    return new Discount({ kind: 'none' });
  }

  static percent(percent: number): Discount {
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      throw new Error(`Invalid discount percent: ${String(percent)}`);
    }
    if (percent === 0) return Discount.none();
    return new Discount({ kind: 'percent', percent });
  }

  static fixed(amount: Money): Discount {
    if (amount.isNegative()) {
      throw new Error('Discount amount must be non-negative');
    }
    if (amount.isZero()) return Discount.none();
    return new Discount({ kind: 'fixed', amount });
  }

  get kind(): DiscountKind {
    return this.props.kind;
  }

  get percent(): number {
    if (this.props.kind !== 'percent') {
      throw new Error('Discount is not percent kind');
    }
    return this.props.percent;
  }

  get amount(): Money {
    if (this.props.kind !== 'fixed') {
      throw new Error('Discount is not fixed kind');
    }
    return this.props.amount;
  }

  isZero(): boolean {
    return this.props.kind === 'none';
  }

  applyTo(net: Money): Money {
    if (this.props.kind === 'none') return Money.zero(net.currency);
    if (this.props.kind === 'percent') {
      return net.multiply(this.props.percent / 100);
    }
    const requested = this.props.amount;
    if (requested.currency !== net.currency) {
      throw new CurrencyMismatchError(requested.currency, net.currency);
    }
    return requested.toCents() > net.toCents()
      ? Money.fromCents(net.toCents(), net.currency)
      : requested;
  }

  equals(other: Discount): boolean {
    if (this.props.kind !== other.props.kind) return false;
    if (this.props.kind === 'none') return true;
    if (this.props.kind === 'percent' && other.props.kind === 'percent') {
      return this.props.percent === other.props.percent;
    }
    if (this.props.kind === 'fixed' && other.props.kind === 'fixed') {
      return this.props.amount.equals(other.props.amount);
    }
    return false;
  }
}
