import { type Money } from './Money';
import { type VatRate } from './VatRate';
import { uuidV7 } from './_uuid';

export interface LineItemProps {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: Money;
  vatRate: VatRate;
}

export type LineItemPatch = Partial<Omit<LineItemProps, 'id'>>;

export class LineItem {
  private readonly props: LineItemProps;

  private constructor(props: LineItemProps) {
    this.props = props;
  }

  static of(props: LineItemProps): LineItem {
    return new LineItem({ ...props });
  }

  static create(props: Omit<LineItemProps, 'id'>): LineItem {
    return new LineItem({ ...props, id: uuidV7() });
  }

  withVatRate(rate: VatRate): LineItem {
    return new LineItem({ ...this.props, vatRate: rate });
  }

  get id(): string {
    return this.props.id;
  }

  get description(): string {
    return this.props.description;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get unit(): string {
    return this.props.unit;
  }

  get unitPrice(): Money {
    return this.props.unitPrice;
  }

  get vatRate(): VatRate {
    return this.props.vatRate;
  }

  total(): Money {
    return this.props.unitPrice.multiply(this.props.quantity);
  }

  vatAmount(): Money {
    return this.props.vatRate.apply(this.total()).vat;
  }

  withPatch(patch: LineItemPatch): LineItem {
    return LineItem.of({ ...this.props, ...patch });
  }
}
