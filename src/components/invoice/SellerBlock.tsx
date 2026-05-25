import { AlertCircle } from 'lucide-react';
import type { SettingsDto } from '@/lib/drive/settings';
import { useTranslate } from '@/hooks';
import { withParams } from '@/lib/translate';

export interface SellerBlockProps {
  settings: SettingsDto;
}

export function SellerBlock({ settings }: SellerBlockProps) {
  const t = useTranslate();
  const company = settings.company;

  if (!company) {
    return (
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t['invoice.seller.title']}</h2>
        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 flex gap-2 text-amber-800 text-xs no-print">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">{t['invoice.seller.missingTitle']}</p>
            <p className="mt-0.5">{t['invoice.seller.missingBody']}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t['invoice.seller.title']}</h2>
      <div className="text-xs text-slate-700 leading-relaxed">
        <p className="font-bold text-slate-900 text-sm">{company.name}</p>
        <p>{withParams(t['invoice.seller.companyCode'], { code: company.code })}</p>
        {company.vatCode && <p>{withParams(t['invoice.seller.vatCode'], { code: company.vatCode })}</p>}
        <p>{company.address}</p>
        <p className="mt-1 font-medium">{withParams(t['invoice.seller.iban'], { iban: company.iban })}</p>
        <p>{withParams(t['invoice.seller.bank'], { bank: company.bankName })}</p>
        <p>{withParams(t['invoice.seller.email'], { email: company.email })}</p>
        <p>{withParams(t['invoice.seller.phone'], { phone: company.phone })}</p>
      </div>
    </div>
  );
}
