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

export async function sendInvoiceEmail(params: SendEmailParams): Promise<void> {
  if (!params.apiKey) {
    throw new Error('Resend API raktas nenustatytas.');
  }

  const attachments = await buildAttachments(params.pdfBlob, params.pdfFilename);
  const from = params.fromName 
    ? `${params.fromName} <${params.fromEmail}>` 
    : params.fromEmail;

  // Simple HTML formatting for text body
  const htmlContent = params.body.replace(/\n/g, '<br />');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: params.to.split(',').map(e => e.trim()),
      cc: params.cc ? params.cc.split(',').map(e => e.trim()) : undefined,
      subject: params.subject,
      html: htmlContent,
      attachments,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Resend API klaida: ${response.status} ${response.statusText}`);
  }
}
