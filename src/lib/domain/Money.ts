export class CurrencyMismatchError extends Error {
  constructor(left: string, right: string) {
    super(`Currency mismatch: ${left} vs ${right}`);
    this.name = 'CurrencyMismatchError';
  }
}

const CENTS_PER_UNIT = 100;

function bankersRound(value: number): number {
  const normalized = Number(value.toFixed(8));
  const floor = Math.floor(normalized);
  const diff = normalized - floor;
  if (diff < 0.5) return floor;
  if (diff > 0.5) return floor + 1;
  return floor % 2 === 0 ? floor : floor + 1;
}

export class Money {
  private readonly cents: number;
  public readonly currency: string;

  constructor(amount: number, currency: string = 'EUR') {
    this.cents = bankersRound(amount * CENTS_PER_UNIT);
    this.currency = currency;
  }

  static fromCents(cents: number, currency: string = 'EUR'): Money {
    const m = Object.create(Money.prototype) as Money;
    Object.assign(m, { cents: Math.trunc(cents), currency });
    return m;
  }

  static zero(currency: string = 'EUR'): Money {
    return Money.fromCents(0, currency);
  }

  toCents(): number {
    return this.cents;
  }

  toNumber(): number {
    return this.cents / CENTS_PER_UNIT;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.fromCents(this.cents + other.cents, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.fromCents(this.cents - other.cents, this.currency);
  }

  multiply(scalar: number): Money {
    return Money.fromCents(bankersRound(this.cents * scalar), this.currency);
  }

  equals(other: Money): boolean {
    return this.cents === other.cents && this.currency === other.currency;
  }

  isZero(): boolean {
    return this.cents === 0;
  }

  isNegative(): boolean {
    return this.cents < 0;
  }

  format(locale: string = 'lt-LT'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(this.toNumber());
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }
  }
}
