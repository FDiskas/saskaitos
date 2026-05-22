import { useMemo } from 'react';
import { Invoice, InvoiceNumber, type VatPercent, VatRate, ClientId } from '@/lib/domain';
import type { SettingsDto } from '@/lib/drive/settings';
import { useClients } from '@/hooks';
import { ClientCombobox } from '@/components/shared';
import { InlineEditField } from './InlineEditField';
import { LineItemsTable } from './LineItemsTable';
import { formatDate } from '@/lib/format/date';
import { AlertCircle } from 'lucide-react';

export interface InvoiceCanvasProps {
  invoice: Invoice;
  onChange: (updatedInvoice: Invoice) => void;
  settings: SettingsDto;
}

function parseInvoiceNumber(value: string, defaultPrefix: string): InvoiceNumber {
  const match = value.match(/^(.*?)(\d+)$/);
  if (match) {
    const prefix = match[1] ?? '';
    const seq = parseInt(match[2] ?? '1', 10);
    return InvoiceNumber.of(prefix, seq);
  }
  return InvoiceNumber.of(defaultPrefix, 1);
}

export function InvoiceCanvas({ invoice, onChange, settings }: InvoiceCanvasProps) {
  const { clients } = useClients();
  const selectedPresetId = invoice.designPresetId;
  const activePreset = settings.designPresets.find((p) => p.id === selectedPresetId) || settings.designPresets[0];

  const client = useMemo(() => {
    return clients.find((c) => c.id.equals(invoice.clientId)) || null;
  }, [invoice.clientId, clients]);

  const totals = invoice.totals();
  const hasVat = invoice.vat.enabled;

  const handleVatToggle = (enabled: boolean) => {
    if (enabled) {
      onChange(invoice.withVat(VatRate.of(21)));
    } else {
      onChange(invoice.withVatDisabled());
    }
  };

  const handleVatRateChange = (percent: VatPercent) => {
    onChange(invoice.withVat(VatRate.of(percent)));
  };

  return (
    <div
      id="invoice-page-canvas"
      className="relative aspect-[1/1.414] w-[794px] min-h-[1123px] bg-white shadow-xl border border-slate-100 p-12 flex flex-col justify-between select-text print:shadow-none print:border-none print:p-0 print:w-full print:aspect-auto"
      style={{
        fontFamily: activePreset?.fontFamily || 'Inter',
        backgroundImage: activePreset?.backgroundImageBase64 ? `url(${activePreset.backgroundImageBase64})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex flex-col gap-8 flex-grow">
        {/* Pardavėjas & Logotipas */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-2 max-w-[50%]">
            {settings.company?.logoBase64 && (
              <img
                src={settings.company.logoBase64}
                alt="Logo"
                className="max-h-16 max-w-[200px] object-contain mb-2 print:max-h-16"
              />
            )}
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pardavėjas</h2>
            {settings.company ? (
              <div className="text-xs text-slate-700 leading-relaxed">
                <p className="font-bold text-slate-900 text-sm">{settings.company.name}</p>
                <p>Įmonės kodas: {settings.company.code}</p>
                {settings.company.vatCode && <p>PVM kodas: {settings.company.vatCode}</p>}
                <p>{settings.company.address}</p>
                <p className="mt-1 font-medium">Sąskaita IBAN: {settings.company.iban}</p>
                <p>Bankas: {settings.company.bankName}</p>
                <p>El. paštas: {settings.company.email}</p>
                <p>Tel.: {settings.company.phone}</p>
              </div>
            ) : (
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3 flex gap-2 text-amber-800 text-xs no-print">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="font-semibold">Nenustatyti įmonės rekvizitai</p>
                  <p className="mt-0.5">Užpildykite pardavėjo duomenis nustatymų puslapyje.</p>
                </div>
              </div>
            )}
          </div>

          {/* Sąskaitos info */}
          <div className="text-right flex flex-col gap-2">
            <h1
              className="text-xl font-bold uppercase tracking-wide"
              style={{ color: activePreset?.primaryColor }}
            >
              {hasVat ? 'PVM Sąskaita-Faktūra' : 'Sąskaita-Faktūra'}
            </h1>
            <div className="flex items-center justify-end gap-1.5 text-lg font-bold">
              <span className="text-slate-500">Nr.</span>
              <InlineEditField
                value={invoice.number.toString()}
                onChange={(val) => onChange(invoice.withNumber(parseInvoiceNumber(val, invoice.number.prefix)))}
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
        </div>

        <hr className="border-slate-200" />

        {/* Pirkėjas */}
        <div className="flex flex-col gap-2 max-w-[50%]">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pirkėjas</h2>
          {client ? (
            <div className="text-xs text-slate-700 leading-relaxed relative group">
              <div className="no-print absolute -top-1 -right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => onChange(invoice.withClientId(ClientId.fromString('')))}
                  className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                >
                  Pakeisti
                </button>
              </div>
              <p className="font-bold text-slate-900 text-sm">{client.name}</p>
              {client.code && <p>Įmonės kodas: {client.code}</p>}
              {client.vatCode && <p>PVM kodas: {client.vatCode}</p>}
              <p>{client.address}</p>
              {client.email && <p>El. paštas: {client.email}</p>}
              {client.phone && <p>Tel.: {client.phone}</p>}
            </div>
          ) : (
            <div className="w-full max-w-sm mt-1">
              <ClientCombobox
                value={null}
                onChange={(val) => val && onChange(invoice.withClientId(ClientId.fromString(val)))}
                placeholder="Pasirinkite klientą..."
              />
            </div>
          )}
        </div>

        {/* Prekių lentelė */}
        <div className="mt-4">
          <LineItemsTable invoice={invoice} onChange={onChange} />
        </div>
      </div>

      {/* Apačia - Totals & Notes */}
      <div className="mt-8 flex flex-col gap-6">
        <div className="flex justify-between items-start gap-8">
          {/* Pastabos */}
          <div className="flex-grow max-w-[50%] flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pastabos / Rekvizitai apmokėjimui</span>
            <InlineEditField
              value={invoice.notes || ''}
              onChange={(val) => onChange(invoice.withNotes(val || undefined))}
              type="textarea"
              placeholder="Pridėti papildomų pastabų ar apmokėjimo instrukcijų..."
              className="text-xs text-slate-600 w-full min-h-[60px] leading-relaxed border border-dashed border-slate-200 p-2 rounded hover:bg-slate-50"
            />
          </div>

          {/* Sumos ir PVM Valdymas */}
          <div className="flex flex-col items-end gap-3 min-w-[240px]">
            {/* PVM valdymas (tik ekrane) */}
            <div className="flex items-center gap-4 text-xs no-print bg-slate-50 p-2 rounded border border-slate-200">
              <label className="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasVat}
                  onChange={(e) => handleVatToggle(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                />
                PVM skaičiavimas
              </label>

              {hasVat && (
                <select
                  value={invoice.vat.rate.percent}
                  onChange={(e) => handleVatRateChange(parseInt(e.target.value, 10) as VatPercent)}
                  className="rounded border border-slate-200 bg-white px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                >
                  <option value={21}>21%</option>
                  <option value={9}>9%</option>
                  <option value={5}>5%</option>
                  <option value={0}>0%</option>
                </select>
              )}
            </div>

            {/* Sumų dėžutė */}
            <div className="w-full flex flex-col gap-1.5 border-t border-slate-200 pt-3 text-right">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Tarpinė suma:</span>
                <span className="font-mono">{totals.subtotal.format()}</span>
              </div>
              {hasVat && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>PVM ({invoice.vat.rate.percent}%):</span>
                  <span className="font-mono">{totals.vatAmount.format()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold border-t border-double border-slate-300 pt-2 text-slate-900">
                <span>Iš viso:</span>
                <span className="font-mono text-base" style={{ color: activePreset?.accentColor }}>
                  {totals.total.format()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Parašai */}
        <div className="mt-8 flex justify-between text-xs text-slate-500 pt-6 border-t border-slate-100">
          <div>
            <p className="font-medium">Sąskaitą išrašė:</p>
            <div className="mt-12 w-48 border-b border-slate-300"></div>
            <p className="mt-1 text-[10px] text-slate-400">pareigos, vardas, pavardė, parašas</p>
          </div>
          <div className="text-right">
            <p className="font-medium">Sąskaitą priėmė:</p>
            <div className="mt-12 w-48 border-b border-slate-300 ml-auto"></div>
            <p className="mt-1 text-[10px] text-slate-400">pareigos, vardas, pavardė, parašas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
