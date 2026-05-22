import { useState } from 'react';
import { Download, FileDown, Loader2, Mail } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { Invoice, Client } from '@/lib/domain';
import type { SettingsDto } from '@/lib/drive/settings';
import { useStorage, getInvoicePdfPath } from '@/hooks';
import { exportInvoiceToXlsx } from '@/lib/excel/invoiceToXlsx';
import { InvoicePdfDocument } from '@/lib/pdf/InvoicePdfDocument';
import { formatDate } from '@/lib/format/date';
import { EmailDialog } from './EmailDialog';

export interface InvoiceActionsProps {
  invoice: Invoice;
  client: Client;
  settings: SettingsDto;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function InvoiceActions({ invoice, client, settings }: InvoiceActionsProps) {
  const storage = useStorage();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const doc = <InvoicePdfDocument invoice={invoice} client={client} settings={settings} />;
      const blob = await pdf(doc).toBlob();
      const filename = `${formatDate(invoice.issueDate)}_${invoice.number.toString()}.pdf`;
      
      downloadBlob(blob, filename);

      // Upload to Drive in the background
      const pdfPath = getInvoicePdfPath(client, invoice.number, invoice.issueDate);
      void storage.uploadBinary(pdfPath, blob, 'application/pdf')
        .catch(err => console.error('Failed to upload PDF copy to Drive', err));
    } catch (error) {
      console.error('Failed to generate PDF', error);
      alert('Nepavyko sugeneruoti PDF failo.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => exportInvoiceToXlsx(invoice, client, settings)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-1.7 rounded-md shadow-sm transition cursor-pointer"
      >
        <FileDown className="h-3.5 w-3.5 text-slate-500" />
        Eksportuoti Excel
      </button>

      <button
        type="button"
        onClick={() => setIsEmailOpen(true)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-1.7 rounded-md shadow-sm transition cursor-pointer"
      >
        <Mail className="h-3.5 w-3.5 text-slate-500" />
        Siųsti el. paštu
      </button>

      <button
        type="button"
        disabled={isGeneratingPdf}
        onClick={handleDownloadPdf}
        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-950 hover:bg-slate-900 px-3.5 py-1.7 rounded-md shadow-sm transition cursor-pointer disabled:opacity-50"
      >
        {isGeneratingPdf ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        Atsisiųsti PDF
      </button>

      <EmailDialog
        open={isEmailOpen}
        onOpenChange={setIsEmailOpen}
        invoice={invoice}
        client={client}
        settings={settings}
      />
    </div>
  );
}
