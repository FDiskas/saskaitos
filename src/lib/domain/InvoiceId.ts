import { uuidV7, isUuidV7 } from './_uuid';

declare const InvoiceIdBrand: unique symbol;

export class InvoiceId {
  declare private readonly _brand: typeof InvoiceIdBrand;
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(): InvoiceId {
    return new InvoiceId(uuidV7());
  }

  static fromString(value: string): InvoiceId {
    if (!isUuidV7(value)) {
      throw new Error(`Invalid InvoiceId: ${value}`);
    }
    return new InvoiceId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: InvoiceId): boolean {
    return this.value === other.value;
  }
}
