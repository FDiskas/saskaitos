import { useTranslate } from '@/hooks';

export function InvoiceSignatures() {
  const t = useTranslate();
  return (
    <div className="mt-8 flex w-full justify-between text-xs text-slate-500 pt-6 border-t border-slate-100">
      <div>
        <p className="font-medium">{t['invoice.signatures.issuedBy']}</p>
        <div className="mt-12 w-48 border-b border-slate-300"></div>
        <p className="mt-1 text-[10px] text-slate-400">{t['invoice.signatures.subtext']}</p>
      </div>
      <div>
        <p className="font-medium">{t['invoice.signatures.acceptedBy']}</p>
        <div className="mt-12 w-48 border-b border-slate-300 ml-auto"></div>
        <p className="mt-1 text-[10px] text-slate-400">{t['invoice.signatures.subtext']}</p>
      </div>
    </div>
  );
}
