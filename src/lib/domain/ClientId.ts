import { uuidV7, isUuidV7 } from './_uuid';

declare const ClientIdBrand: unique symbol;

export class ClientId {
  declare private readonly _brand: typeof ClientIdBrand;
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(): ClientId {
    return new ClientId(uuidV7());
  }

  static fromString(value: string): ClientId {
    if (!isUuidV7(value)) {
      throw new Error(`Invalid ClientId: ${value}`);
    }
    return new ClientId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: ClientId): boolean {
    return this.value === other.value;
  }
}
