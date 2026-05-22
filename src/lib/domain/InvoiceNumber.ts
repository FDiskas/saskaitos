const MIN_PAD = 4;

export class InvoiceNumber {
  public readonly prefix: string;
  public readonly sequence: number;

  private constructor(prefix: string, sequence: number) {
    this.prefix = prefix;
    this.sequence = sequence;
  }

  static of(prefix: string, sequence: number): InvoiceNumber {
    if (sequence < 1 || !Number.isInteger(sequence)) {
      throw new Error(`Invalid sequence: ${sequence}`);
    }
    return new InvoiceNumber(prefix, sequence);
  }

  static parse(value: string, defaultPrefix: string): InvoiceNumber {
    const match = value.match(/^(.*?)(\d+)$/);
    if (!match) return InvoiceNumber.of(defaultPrefix, 1);
    const prefix = match[1] ?? '';
    const sequence = parseInt(match[2] ?? '1', 10);
    if (sequence < 1) return InvoiceNumber.of(defaultPrefix, 1);
    return InvoiceNumber.of(prefix, sequence);
  }

  toString(): string {
    return `${this.prefix}${String(this.sequence).padStart(MIN_PAD, '0')}`;
  }

  equals(other: InvoiceNumber): boolean {
    return this.toString() === other.toString();
  }
}
