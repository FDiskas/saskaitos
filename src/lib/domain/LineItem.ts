import { type Money } from './Money';

export interface LineItemProps {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: Money;
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

  total(): Money {
    return this.props.unitPrice.multiply(this.props.quantity);
  }

  withPatch(patch: LineItemPatch): LineItem {
    return LineItem.of({ ...this.props, ...patch });
  }
}
