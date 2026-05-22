import { AlertCircle } from 'lucide-react';
import type { SettingsDto } from '@/lib/drive/settings';

export interface SellerBlockProps {
  settings: SettingsDto;
}

export function SellerBlock({ settings }: SellerBlockProps) {
  const company = settings.company;

  if (!company) {
    return (
      <div className="flex flex-col gap-2 max-w-[50%]">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pardavėjas</h2>
        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 flex gap-2 text-amber-800 text-xs no-print">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">Nenustatyti įmonės rekvizitai</p>
            <p className="mt-0.5">Užpildykite pardavėjo duomenis nustatymų puslapyje.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 max-w-[50%]">
      {company.logoBase64 && (
        <img
          src={company.logoBase64}
          alt="Logo"
          className="max-h-16 max-w-[200px] object-contain mb-2 print:max-h-16"
        />
      )}
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pardavėjas</h2>
      <div className="text-xs text-slate-700 leading-relaxed">
        <p className="font-bold text-slate-900 text-sm">{company.name}</p>
        <p>Įmonės kodas: {company.code}</p>
        {company.vatCode && <p>PVM kodas: {company.vatCode}</p>}
        <p>{company.address}</p>
        <p className="mt-1 font-medium">Sąskaita IBAN: {company.iban}</p>
        <p>Bankas: {company.bankName}</p>
        <p>El. paštas: {company.email}</p>
        <p>Tel.: {company.phone}</p>
      </div>
    </div>
  );
}
