import { type ClientId } from './ClientId';
import { type InvoiceId } from './InvoiceId';
import { type InvoiceStatus } from './Invoice';
import { type Money } from './Money';

export interface InvoiceSummaryProps {
  id: InvoiceId;
  number: string;
  clientId: ClientId;
  clientName: string;
  issueDate: Date;
  dueDate: Date;
  amount: Money;
  status: InvoiceStatus;
}

export class InvoiceSummary {
  private readonly props: InvoiceSummaryProps;

  private constructor(props: InvoiceSummaryProps) {
    this.props = props;
  }

  static of(props: InvoiceSummaryProps): InvoiceSummary {
    return new InvoiceSummary(props);
  }

  get id(): InvoiceId {
    return this.props.id;
  }

  get number(): string {
    return this.props.number;
  }

  get clientId(): ClientId {
    return this.props.clientId;
  }

  get clientName(): string {
    return this.props.clientName;
  }

  get issueDate(): Date {
    return this.props.issueDate;
  }

  get dueDate(): Date {
    return this.props.dueDate;
  }

  get amount(): Money {
    return this.props.amount;
  }

  get status(): InvoiceStatus {
    return this.props.status;
  }

  effectiveStatus(today: Date): InvoiceStatus {
    if (this.props.status !== 'sent') return this.props.status;
    return today.getTime() > this.props.dueDate.getTime() ? 'overdue' : 'sent';
  }

  issuedInMonth(year: number, monthIndex: number): boolean {
    return (
      this.props.issueDate.getFullYear() === year &&
      this.props.issueDate.getMonth() === monthIndex
    );
  }

  issuedInYear(year: number): boolean {
    return this.props.issueDate.getFullYear() === year;
  }
}
