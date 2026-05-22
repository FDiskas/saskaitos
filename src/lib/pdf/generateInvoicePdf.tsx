import type { Invoice, Client } from '@/lib/domain';
import type { SettingsDto } from '@/lib/drive/settings';

export async function generateInvoicePdfBlob(
  invoice: Invoice,
  client: Client,
  settings: SettingsDto,
): Promise<Blob> {
  const activePreset =
    settings.designPresets.find((p) => p.id === invoice.designPresetId) || settings.designPresets[0];
  const [{ pdf }, { InvoicePdfDocument }, { ensureGoogleFontRegistered }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./InvoicePdfDocument'),
    import('./googleFonts'),
  ]);
  await ensureGoogleFontRegistered(activePreset?.fontFamily);
  return pdf(
    <InvoicePdfDocument invoice={invoice} client={client} settings={settings} />,
  ).toBlob();
}
