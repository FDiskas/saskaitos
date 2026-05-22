import { Invoice, InvoiceNumber } from '@/lib/domain';
import { InlineEditField } from './InlineEditField';
import { formatDate } from '@/lib/format/date';

export interface InvoiceMetaBlockProps {
  invoice: Invoice;
  onChange: (updated: Invoice) => void;
  hasVat: boolean;
  primaryColor?: string;
}

export function InvoiceMetaBlock({ invoice, onChange, hasVat, primaryColor }: InvoiceMetaBlockProps) {
  return (
    <div className="text-right flex flex-col gap-2">
      <h1 className="text-xl font-bold uppercase tracking-wide" style={{ color: primaryColor }}>
        {hasVat ? 'PVM Sąskaita-Faktūra' : 'Sąskaita-Faktūra'}
      </h1>
      <div className="flex items-center justify-end gap-1.5 text-lg font-bold">
        <span className="text-slate-500">Nr.</span>
        <InlineEditField
          value={invoice.number.toString()}
          onChange={(val) => onChange(invoice.withNumber(InvoiceNumber.parse(val, invoice.number.prefix)))}
          placeholder="Įrašykite numerį..."
          className="font-mono text-slate-900 border-b border-dashed border-slate-300 hover:border-slate-500"
        />
      </div>
      <div className="mt-4 text-xs text-slate-600 flex flex-col gap-1 items-end">
        <div className="flex gap-2">
          <span className="font-medium text-slate-500">Išrašymo data:</span>
          <InlineEditField<Date>
            value={invoice.issueDate}
            onChange={(val) => onChange(invoice.withIssueDate(val))}
            type="date"
            format={(val) => formatDate(val)}
            parse={(val) => new Date(val)}
            className="font-mono border-b border-dashed border-slate-350"
          />
        </div>
        <div className="flex gap-2">
          <span className="font-medium text-slate-500">Apmokėti iki:</span>
          <InlineEditField<Date>
            value={invoice.dueDate}
            onChange={(val) => onChange(invoice.withDueDate(val))}
            type="date"
            format={(val) => formatDate(val)}
            parse={(val) => new Date(val)}
            className="font-mono border-b border-dashed border-slate-350"
          />
        </div>
      </div>
    </div>
  );
}
