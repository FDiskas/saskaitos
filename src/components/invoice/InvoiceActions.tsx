import { useState } from 'react';
import { Download, FileDown, Loader2, Mail } from 'lucide-react';
import { type Invoice, type Client } from '@/lib/domain';
import type { SettingsDto } from '@/lib/drive/settings';
import { useStorage, useTranslate, getInvoicePdfPath } from '@/hooks';
import { exportInvoiceToXlsx } from '@/lib/excel/invoiceToXlsx';
import { generateInvoicePdfBlob } from '@/lib/pdf';
import { formatDate } from '@/lib/format/date';
import { Button } from '@/components/ui';
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

function pdfFilename(invoice: Invoice): string {
  return `${formatDate(invoice.issueDate)}_${invoice.number.toString()}.pdf`;
}

export function InvoiceActions({ invoice, client, settings }: InvoiceActionsProps) {
  const storage = useStorage();
  const t = useTranslate();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setError(null);
    try {
      const blob = await generateInvoicePdfBlob(invoice, client, settings);
      downloadBlob(blob, pdfFilename(invoice));
      void storage
        .uploadBinary(getInvoicePdfPath(client, invoice.number, invoice.issueDate), blob, 'application/pdf')
        .catch((err) => console.error('Failed to upload PDF copy to Drive', err));
    } catch (err) {
      console.error('Failed to generate PDF', err);
      setError(t['invoice.actions.errorPdf']);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportXlsx = async () => {
    setIsExportingXlsx(true);
    setError(null);
    try {
      await exportInvoiceToXlsx(invoice, client, settings);
    } catch (err) {
      console.error('Failed to export Excel', err);
      setError(t['invoice.actions.errorXlsx']);
    } finally {
      setIsExportingXlsx(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {error && (
        <p role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={isExportingXlsx}
          onClick={handleExportXlsx}
        >
          {isExportingXlsx ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileDown className="h-3.5 w-3.5 text-slate-500" />
          )}
          {t['invoice.actions.exportXlsx']}
        </Button>

        <Button variant="secondary" size="sm" onClick={() => setIsEmailOpen(true)}>
          <Mail className="h-3.5 w-3.5 text-slate-500" />
          {t['invoice.actions.sendEmail']}
        </Button>

        <Button
          variant="primary"
          size="sm"
          disabled={isGeneratingPdf}
          onClick={handleDownloadPdf}
        >
          {isGeneratingPdf ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          {t['invoice.actions.downloadPdf']}
        </Button>
      </div>

      {isEmailOpen && (
        <EmailDialog
          open={isEmailOpen}
          onOpenChange={setIsEmailOpen}
          invoice={invoice}
          client={client}
          settings={settings}
        />
      )}
    </div>
  );
}
