import { type ClientId } from './ClientId';
import { Discount } from './Discount';
import { type InvoiceId } from './InvoiceId';
import { type InvoiceNumber } from './InvoiceNumber';
import { type LineItem } from './LineItem';
import { type LineItems } from './LineItems';
import { Money } from './Money';
import { type VatRate } from './VatRate';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface InvoiceVat {
  enabled: boolean;
  rate: VatRate;
}

export interface InvoiceTotals {
  subtotal: Money;
  discountAmount: Money;
  taxableAmount: Money;
  vatAmount: Money;
  total: Money;
}

export interface DesignOverride {
  primaryColor?: string;
  accentColor?: string;
  textColor?: string;
  mutedColor?: string;
  borderColor?: string;
  headingColor?: string;
  backgroundImageBase64?: string;
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
  discount?: Discount;
  status?: InvoiceStatus;
  notes?: string;
  designPresetId: string;
  designOverride?: DesignOverride;
  createdAt: Date;
  updatedAt: Date;
  companyId?: string;
}

type FullInvoiceProps = Required<Omit<InvoiceProps, 'notes' | 'designOverride' | 'companyId'>> & {
  notes?: string;
  designOverride?: DesignOverride;
  companyId?: string;
};

export class Invoice {
  private readonly props: FullInvoiceProps;

  private constructor(props: FullInvoiceProps) {
    this.props = props;
  }

  static create(props: InvoiceProps): Invoice {
    return new Invoice({
      ...props,
      discount: props.discount ?? Discount.none(),
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

  get discount(): Discount {
    return this.props.discount;
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

  get designOverride(): DesignOverride | undefined {
    return this.props.designOverride;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get companyId(): string | undefined {
    return this.props.companyId;
  }

  withCompanyId(companyId: string): Invoice {
    return this.touch({ companyId });
  }

  totals(): InvoiceTotals {
    const subtotal = this.props.lineItems.subtotal();
    const discountAmount = this.props.discount.applyTo(subtotal);
    const taxableAmount = subtotal.subtract(discountAmount);
    if (!this.props.vat.enabled) {
      const zero = Money.zero(subtotal.currency);
      return { subtotal, discountAmount, taxableAmount, vatAmount: zero, total: taxableAmount };
    }
    const vatAmount = this.scaledVat(subtotal, taxableAmount);
    return { subtotal, discountAmount, taxableAmount, vatAmount, total: taxableAmount.add(vatAmount) };
  }

  private scaledVat(subtotal: Money, taxableAmount: Money): Money {
    const rawVat = this.props.lineItems.vatAmount(subtotal.currency);
    if (subtotal.isZero() || this.props.discount.isZero()) return rawVat;
    const fraction = taxableAmount.toCents() / subtotal.toCents();
    return rawVat.multiply(fraction);
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
    return this.touch({
      vat: { enabled: true, rate },
      lineItems: this.props.lineItems.withVatRateAll(rate),
    });
  }

  withVatDisabled(): Invoice {
    return this.touch({ vat: { enabled: false, rate: this.props.vat.rate } });
  }

  withDiscount(discount: Discount): Invoice {
    return this.touch({ discount });
  }

  withNotes(notes: string | undefined): Invoice {
    return this.touch({ notes });
  }

  withDesignPreset(designPresetId: string): Invoice {
    return this.touch({ designPresetId });
  }

  withDesignOverride(patch: Partial<DesignOverride>): Invoice {
    const merged: DesignOverride = { ...this.props.designOverride, ...patch };
    const hasAny = Object.values(merged).some((value) => value !== undefined);
    return this.touch({ designOverride: hasAny ? merged : undefined });
  }

  withNumber(number: InvoiceNumber): Invoice {
    return this.touch({ number });
  }

  withIssueDate(issueDate: Date): Invoice {
    return this.touch({ issueDate });
  }

  withDueDate(dueDate: Date): Invoice {
    return this.touch({ dueDate });
  }

  withClientId(clientId: ClientId): Invoice {
    return this.touch({ clientId });
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
