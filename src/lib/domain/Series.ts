import { InvoiceNumber } from './InvoiceNumber';

export interface SeriesProps {
  id: string;
  prefix: string;
  nextNumber: number;
  isDefault: boolean;
}

export interface NextResult {
  number: InvoiceNumber;
  updatedSeries: Series;
}

export class Series {
  private readonly props: SeriesProps;

  private constructor(props: SeriesProps) {
    this.props = props;
  }

  static of(props: SeriesProps): Series {
    return new Series({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get prefix(): string {
    return this.props.prefix;
  }

  get nextNumber(): number {
    return this.props.nextNumber;
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  next(): NextResult {
    return {
      number: InvoiceNumber.of(this.props.prefix, this.props.nextNumber),
      updatedSeries: Series.of({ ...this.props, nextNumber: this.props.nextNumber + 1 }),
    };
  }

  withDefault(isDefault: boolean): Series {
    return Series.of({ ...this.props, isDefault });
  }
}
