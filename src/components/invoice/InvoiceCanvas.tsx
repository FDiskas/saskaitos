import { Invoice } from '@/lib/domain';
import type { SettingsDto } from '@/lib/drive/settings';
import { SellerBlock } from './SellerBlock';
import { InvoiceMetaBlock } from './InvoiceMetaBlock';
import { BuyerBlock } from './BuyerBlock';
import { LineItemsTable } from './LineItemsTable';
import { NotesBlock } from './NotesBlock';
import { VatToggle } from './VatToggle';
import { TotalsBox } from './TotalsBox';
import { InvoiceSignatures } from './InvoiceSignatures';

export interface InvoiceCanvasProps {
  invoice: Invoice;
  onChange: (updatedInvoice: Invoice) => void;
  settings: SettingsDto;
}

export function InvoiceCanvas({ invoice, onChange, settings }: InvoiceCanvasProps) {
  const activePreset =
    settings.designPresets.find((p) => p.id === invoice.designPresetId) || settings.designPresets[0];
  const override = invoice.designOverride;
  const effectivePrimary = override?.primaryColor ?? activePreset?.primaryColor;
  const effectiveAccent = override?.accentColor ?? activePreset?.accentColor;
  const effectiveBg = override?.backgroundImageBase64 ?? activePreset?.backgroundImageBase64;

  return (
    <div
      id="invoice-page-canvas"
      className="relative aspect-[1/1.414] w-[794px] min-h-[1123px] bg-white shadow-xl border border-slate-100 p-12 flex flex-col justify-between select-text print:shadow-none print:border-none print:p-0 print:w-full print:aspect-auto"
      style={{
        fontFamily: activePreset?.fontFamily || 'Inter',
        backgroundImage: effectiveBg ? `url(${effectiveBg})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex flex-col gap-8 flex-grow">
        <div className="flex justify-between items-start">
          <SellerBlock settings={settings} />
          <InvoiceMetaBlock
            invoice={invoice}
            onChange={onChange}
            hasVat={invoice.vat.enabled}
            primaryColor={effectivePrimary}
          />
        </div>

        <hr className="border-slate-200" />

        <BuyerBlock invoice={invoice} onChange={onChange} />

        <div className="mt-4">
          <LineItemsTable invoice={invoice} onChange={onChange} />
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-6">
        <div className="flex justify-between items-start gap-8">
          <NotesBlock invoice={invoice} onChange={onChange} />
          <div className="flex flex-col items-end gap-3 min-w-[240px]">
            <VatToggle invoice={invoice} onChange={onChange} />
            <TotalsBox invoice={invoice} accentColor={effectiveAccent} />
          </div>
        </div>
        <InvoiceSignatures />
      </div>
    </div>
  );
}
