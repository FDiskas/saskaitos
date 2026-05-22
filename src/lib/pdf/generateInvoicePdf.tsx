import type { Invoice, Client } from '@/lib/domain';
import type { SettingsDto } from '@/lib/drive/settings';

export async function generateInvoicePdfBlob(
  invoice: Invoice,
  client: Client,
  settings: SettingsDto,
): Promise<Blob> {
  const [{ pdf }, { InvoicePdfDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./InvoicePdfDocument'),
  ]);
  return pdf(
    <InvoicePdfDocument invoice={invoice} client={client} settings={settings} />,
  ).toBlob();
}
