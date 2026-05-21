import { ClientId } from './ClientId';
import { InvoiceId } from './InvoiceId';
import { InvoiceNumber } from './InvoiceNumber';
import { LineItem } from './LineItem';
import { LineItems } from './LineItems';
import { Money } from './Money';
import { VatRate } from './VatRate';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface InvoiceVat {
  enabled: boolean;
  rate: VatRate;
}

export interface InvoiceTotals {
  subtotal: Money;
  vatAmount: Money;
  total: Money;
}

export interface InvoiceProps {
  id: InvoiceId;
  number: InvoiceNumber;
  seriesId: string;
  clientId: ClientId;
  issueDate: Date;
  dueDate: Date;
  lineItems: LineItems;
  vat: InvoiceVat;
  status?: InvoiceStatus;
  notes?: string;
  designPresetId: string;
  createdAt: Date;
  updatedAt: Date;
}

type FullInvoiceProps = Required<Omit<InvoiceProps, 'notes'>> & { notes?: string };

export class Invoice {
  private readonly props: FullInvoiceProps;

  private constructor(props: FullInvoiceProps) {
    this.props = props;
  }

  static create(props: InvoiceProps): Invoice {
    return new Invoice({
      ...props,
      status: props.status ?? 'draft',
    });
  }

  get id(): InvoiceId {
    return this.props.id;
  }

  get number(): InvoiceNumber {
    return this.props.number;
  }

  get seriesId(): string {
    return this.props.seriesId;
  }

  get clientId(): ClientId {
    return this.props.clientId;
  }

  get issueDate(): Date {
    return this.props.issueDate;
  }

  get dueDate(): Date {
    return this.props.dueDate;
  }

  get lineItems(): LineItems {
    return this.props.lineItems;
  }

  get vat(): InvoiceVat {
    return this.props.vat;
  }

  get status(): InvoiceStatus {
    return this.props.status;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get designPresetId(): string {
    return this.props.designPresetId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  totals(): InvoiceTotals {
    const subtotal = this.props.lineItems.subtotal();
    if (!this.props.vat.enabled) {
      return { subtotal, vatAmount: Money.zero(), total: subtotal };
    }
    const { vat, gross } = this.props.vat.rate.apply(subtotal);
    return { subtotal, vatAmount: vat, total: gross };
  }

  withLineItem(item: LineItem): Invoice {
    return this.touch({ lineItems: this.props.lineItems.add(item) });
  }

  withoutLineItem(id: string): Invoice {
    return this.touch({ lineItems: this.props.lineItems.remove(id) });
  }

  withLineItems(lineItems: LineItems): Invoice {
    return this.touch({ lineItems });
  }

  withVat(rate: VatRate): Invoice {
    return this.touch({ vat: { enabled: true, rate } });
  }

  withVatDisabled(): Invoice {
    return this.touch({ vat: { enabled: false, rate: this.props.vat.rate } });
  }

  withNotes(notes: string | undefined): Invoice {
    return this.touch({ notes });
  }

  markDraft(): Invoice {
    return this.touch({ status: 'draft' });
  }

  markSent(): Invoice {
    return this.touch({ status: 'sent' });
  }

  markPaid(): Invoice {
    return this.touch({ status: 'paid' });
  }

  markOverdue(): Invoice {
    return this.touch({ status: 'overdue' });
  }

  isOverdue(today: Date): boolean {
    if (this.props.status === 'paid' || this.props.status === 'draft') return false;
    return today.getTime() > this.props.dueDate.getTime();
  }

  private touch(patch: Partial<InvoiceProps>): Invoice {
    return new Invoice({ ...this.props, ...patch, updatedAt: new Date() });
  }
}
