import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { type Invoice, type Client } from '@/lib/domain';
import type { SettingsDto } from '@/lib/drive/settings';
import {
  Button,
  Dialog,
  DialogCloseButton,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from '@/components/ui';
import { sendInvoiceEmail } from '@/lib/resend/sendInvoiceEmail';
import { generateInvoicePdfBlob } from '@/lib/pdf';
import { formatDate } from '@/lib/format/date';
import { useTranslate } from '@/hooks';

export interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  client: Client;
  settings: SettingsDto;
}

function resolveTemplate(template: string, invoice: Invoice, client: Client, settings: SettingsDto): string {
  const companyName = settings.company?.name || '';
  return template
    .replace(/\{\{client\.name\}\}/g, client.name)
    .replace(/\{\{invoice\.number\}\}/g, invoice.number.toString())
    .replace(/\{\{invoice\.total\}\}/g, invoice.totals().total.format())
    .replace(/\{\{invoice\.dueDate\}\}/g, formatDate(invoice.dueDate))
    .replace(/\{\{company\.name\}\}/g, companyName);
}

export function EmailDialog({ open, onOpenChange, invoice, client, settings }: EmailDialogProps) {
  const t = useTranslate();
  const [to, setTo] = useState(client.email || '');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState(
    resolveTemplate(settings.defaultEmailSubject || (t['email.defaultSubject'] as string), invoice, client, settings),
  );
  const [body, setBody] = useState(
    resolveTemplate(settings.defaultEmailBody || (t['email.defaultBody'] as string), invoice, client, settings),
  );
  const [attachPdf, setAttachPdf] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const hasApiKey = !!settings.resendApiKey;
  const fromEmail = settings.company?.email || '';

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to) return setError(t['email.dialog.errorToRequired']);

    setIsSending(true);
    setError(null);

    try {
      const pdfBlob = attachPdf
        ? await generateInvoicePdfBlob(invoice, client, settings)
        : undefined;

      await sendInvoiceEmail({
        to,
        cc: cc || undefined,
        subject,
        body,
        pdfBlob,
        pdfFilename: attachPdf ? `${formatDate(invoice.issueDate)}_${invoice.number.toString()}.pdf` : undefined,
        apiKey: settings.resendApiKey || '',
        fromEmail,
        fromName: settings.company?.name || undefined,
      });

      setSentMessage(t['email.dialog.sent']);
      setTimeout(() => onOpenChange(false), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : (t['email.dialog.errorSendFailed'] as string));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-slate-500" />
          {t['email.dialog.title']}
        </DialogTitle>
        <DialogDescription>
          {t['email.dialog.description']}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSend} className="space-y-4">
        <DialogCloseButton onClick={() => onOpenChange(false)} />

        {!hasApiKey && (
          <div className="rounded-md bg-amber-50 border border-amber-200 p-3 flex gap-2 text-amber-800 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">{t['email.dialog.warnNoKeyTitle']}</p>
              <p className="mt-0.5">{t['email.dialog.warnNoKeyBody']}</p>
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-md bg-red-50 border border-red-200 p-3 flex gap-2 text-red-800 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {sentMessage && (
          <div role="status" className="rounded-md bg-emerald-50 border border-emerald-200 p-3 flex gap-2 text-emerald-800 text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <p className="font-medium">{sentMessage}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email-to">{t['email.dialog.toLabel']}</Label>
            <Input
              id="email-to"
              type="text"
              placeholder={t['email.dialog.toPlaceholder']}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={isSending || !hasApiKey}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email-cc">{t['email.dialog.ccLabel']}</Label>
            <Input
              id="email-cc"
              type="text"
              placeholder={t['email.dialog.ccPlaceholder']}
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              disabled={isSending || !hasApiKey}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email-subject">{t['email.dialog.subjectLabel']}</Label>
          <Input
            id="email-subject"
            type="text"
            placeholder={t['email.dialog.subjectPlaceholder']}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isSending || !hasApiKey}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email-body">{t['email.dialog.bodyLabel']}</Label>
          <Textarea
            id="email-body"
            placeholder={t['email.dialog.bodyPlaceholder']}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={isSending || !hasApiKey}
            rows={5}
            required
          />
        </div>

        <div className="flex items-center gap-2 py-1.5">
          <input
            id="email-attach"
            type="checkbox"
            checked={attachPdf}
            onChange={(e) => setAttachPdf(e.target.checked)}
            disabled={isSending || !hasApiKey}
            className="rounded border-slate-350 text-slate-900 focus:ring-slate-900 cursor-pointer"
          />
          <Label htmlFor="email-attach" className="cursor-pointer font-medium text-slate-700">
            {t['email.dialog.attachLabel']}
          </Label>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
            className="cursor-pointer"
          >
            {t['email.dialog.cancel']}
          </Button>
          <Button
            type="submit"
            disabled={isSending || !hasApiKey}
            className="cursor-pointer shadow-sm"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                {t['email.dialog.sending']}
              </>
            ) : (
              t['email.dialog.send']
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
