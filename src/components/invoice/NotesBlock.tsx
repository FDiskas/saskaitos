import { type Invoice } from '@/lib/domain';
import { useTranslate } from '@/hooks';
import { InlineEditField } from './InlineEditField';

export interface NotesBlockProps {
  invoice: Invoice;
  onChange: (updated: Invoice) => void;
  isPreview?: boolean;
}

export function NotesBlock({ invoice, onChange, isPreview = false }: NotesBlockProps) {
  const t = useTranslate();
  return (
    <div className="flex w-full flex-col gap-1">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {t['invoice.notes.title']}
      </span>
      <InlineEditField
        value={invoice.notes || ''}
        onChange={(val) => onChange(invoice.withNotes(val || undefined))}
        type="textarea"
        readOnly={isPreview}
        placeholder={t['invoice.notes.placeholder']}
        className="text-xs text-slate-600 w-full min-h-15 leading-relaxed border border-dashed border-slate-200 p-2 rounded hover:bg-slate-50"
      />
    </div>
  );
}
