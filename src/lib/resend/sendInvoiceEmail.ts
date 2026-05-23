export interface SendEmailParams {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  pdfBlob?: Blob;
  pdfFilename?: string;
  apiKey: string;
  fromEmail: string;
  fromName?: string;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const base64 = base64data.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function buildAttachments(pdfBlob?: Blob, pdfFilename?: string) {
  if (!pdfBlob || !pdfFilename) return undefined;
  const content = await blobToBase64(pdfBlob);
  return [{ filename: pdfFilename, content }];
}

const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => HTML_ESCAPE[ch] ?? ch);
}

function toHtmlBody(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br />');
}

function parseList(value: string): string[] {
  return value.split(',').map((e) => e.trim()).filter(Boolean);
}

function buildFrom(fromEmail: string, fromName?: string): string {
  if (!fromName) return fromEmail;
  return `${fromName} <${fromEmail}>`;
}

const RESEND_ENDPOINT = 'https://corsproxy.io/?https://api.resend.com/emails';

const INVALID_API_KEY_MSG = 'Patikrinkite Resend API raktą Nustatymuose.';

async function errorFromResponse(response: Response): Promise<Error> {
  const data = await response.json().catch(() => ({}));
  const message = (data as { message?: string }).message;
  if (response.status === 401 || response.status === 403) {
    return new Error(message || INVALID_API_KEY_MSG);
  }
  return new Error(message || `Resend API klaida: ${response.status} ${response.statusText}`);
}

export async function sendInvoiceEmail(params: SendEmailParams): Promise<void> {
  if (!params.apiKey) {
    throw new Error('Resend API raktas nenustatytas.');
  }

  const attachments = await buildAttachments(params.pdfBlob, params.pdfFilename);

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: buildFrom(params.fromEmail, params.fromName),
      to: parseList(params.to),
      cc: params.cc ? parseList(params.cc) : undefined,
      subject: params.subject,
      html: toHtmlBody(params.body),
      attachments,
    }),
  });

  if (!response.ok) throw await errorFromResponse(response);
}
