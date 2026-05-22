import { Invoice } from '@/lib/domain';
import { InlineEditField } from './InlineEditField';

export interface NotesBlockProps {
  invoice: Invoice;
  onChange: (updated: Invoice) => void;
}

export function NotesBlock({ invoice, onChange }: NotesBlockProps) {
  return (
    <div className="flex-grow max-w-[50%] flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Pastabos / Rekvizitai apmokėjimui
      </span>
      <InlineEditField
        value={invoice.notes || ''}
        onChange={(val) => onChange(invoice.withNotes(val || undefined))}
        type="textarea"
        placeholder="Pridėti papildomų pastabų ar apmokėjimo instrukcijų..."
        className="text-xs text-slate-600 w-full min-h-[60px] leading-relaxed border border-dashed border-slate-200 p-2 rounded hover:bg-slate-50"
      />
    </div>
  );
}
