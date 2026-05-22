import { Document, Page, Text, View, Font, Image } from '@react-pdf/renderer';
import { Invoice, Client } from '@/lib/domain';
import type { SettingsDto } from '@/lib/drive/settings';
import { formatDate } from '@/lib/format/date';
import { getPdfStyles } from './InvoicePdfStyles';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4AMP6lQ.ttf', fontWeight: 700 },
  ],
});

export interface InvoicePdfDocumentProps {
  invoice: Invoice;
  client: Client;
  settings: SettingsDto;
}

export function InvoicePdfDocument({ invoice, client, settings }: InvoicePdfDocumentProps) {
  const activePreset = settings.designPresets.find((p) => p.id === invoice.designPresetId) || settings.designPresets[0];
  const primaryColor = activePreset?.primaryColor || '#0f172a';
  const accentColor = activePreset?.accentColor || '#0284c7';

  const totals = invoice.totals();
  const hasVat = invoice.vat.enabled;
  const items = invoice.lineItems.toArray();
  const styles = getPdfStyles(primaryColor, accentColor);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {activePreset?.backgroundImageBase64 && (
          <Image src={activePreset.backgroundImageBase64} style={styles.background} />
        )}

        <View style={styles.header}>
          <View style={styles.sellerCol}>
            {settings.company?.logoBase64 && (
              <Image src={settings.company.logoBase64} style={styles.logo} />
            )}
            <Text style={styles.sectionTitle}>Pardavėjas</Text>
            {settings.company && (
              <View>
                <Text style={styles.companyName}>{settings.company.name}</Text>
                <Text style={styles.infoText}>Įmonės kodas: {settings.company.code}</Text>
                {settings.company.vatCode && (
                  <Text style={styles.infoText}>PVM kodas: {settings.company.vatCode}</Text>
                )}
                <Text style={styles.infoText}>{settings.company.address}</Text>
                <Text style={[styles.infoText, { marginTop: 4, fontWeight: 'bold' }]}>
                  Sąskaita IBAN: {settings.company.iban}
                </Text>
                <Text style={styles.infoText}>Bankas: {settings.company.bankName}</Text>
                <Text style={styles.infoText}>El. paštas: {settings.company.email}</Text>
                <Text style={styles.infoText}>Tel.: {settings.company.phone}</Text>
              </View>
            )}
          </View>

          <View style={styles.invoiceInfoCol}>
            <Text style={styles.invoiceTitle}>
              {hasVat ? 'PVM Sąskaita-Faktūra' : 'Sąskaita-Faktūra'}
            </Text>
            <Text style={styles.invoiceNo}>Nr. {invoice.number.toString()}</Text>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Išrašymo data:</Text>
              <Text style={{ fontWeight: 'bold' }}>{formatDate(invoice.issueDate)}</Text>
            </View>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Apmokėti iki:</Text>
              <Text style={{ fontWeight: 'bold' }}>{formatDate(invoice.dueDate)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.buyerCol}>
          <Text style={styles.sectionTitle}>Pirkėjas</Text>
          <Text style={styles.companyName}>{client.name}</Text>
          {client.code && <Text style={styles.infoText}>Įmonės kodas: {client.code}</Text>}
          {client.vatCode && <Text style={styles.infoText}>PVM kodas: {client.vatCode}</Text>}
          <Text style={styles.infoText}>{client.address}</Text>
          {client.email && <Text style={styles.infoText}>El. paštas: {client.email}</Text>}
          {client.phone && <Text style={styles.infoText}>Tel.: {client.phone}</Text>}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colNr}><Text style={styles.thText}>Nr.</Text></View>
            <View style={styles.colDesc}><Text style={styles.thText}>Aprašymas</Text></View>
            <View style={styles.colQty}><Text style={styles.thText}>Kiekis</Text></View>
            <View style={styles.colUnit}><Text style={styles.thText}>Mato vnt.</Text></View>
            <View style={styles.colPrice}><Text style={[styles.thText, { textAlign: 'right' }]}>Kaina</Text></View>
            <View style={styles.colSum}><Text style={[styles.thText, { textAlign: 'right' }]}>Suma</Text></View>
          </View>

          {items.map((item, index) => (
            <View key={item.id} style={styles.tableRow} wrap={false}>
              <View style={styles.colNr}><Text style={styles.tdText}>{index + 1}</Text></View>
              <View style={styles.colDesc}><Text style={styles.tdText}>{item.description}</Text></View>
              <View style={styles.colQty}><Text style={styles.tdText}>{item.quantity}</Text></View>
              <View style={styles.colUnit}><Text style={styles.tdText}>{item.unit}</Text></View>
              <View style={styles.colPrice}>
                <Text style={[styles.tdText, { textAlign: 'right' }]}>{item.unitPrice.toNumber().toFixed(2)}</Text>
              </View>
              <View style={styles.colSum}>
                <Text style={[styles.tdText, { textAlign: 'right', fontWeight: 'bold' }]}>
                  {item.total().toNumber().toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footerRow} wrap={false}>
          <View style={styles.notesCol}>
            {invoice.notes && (
              <View>
                <Text style={styles.sectionTitle}>Pastabos / Rekvizitai apmokėjimui</Text>
                <Text style={styles.notesText}>{invoice.notes}</Text>
              </View>
            )}
          </View>

          <View style={styles.totalsCol}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <Text style={{ fontSize: 9, color: '#64748b' }}>Tarpinė suma:</Text>
              <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{totals.subtotal.format()}</Text>
            </View>
            {hasVat && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                <Text style={{ fontSize: 9, color: '#64748b' }}>PVM ({invoice.vat.rate.percent}%):</Text>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{totals.vatAmount.format()}</Text>
              </View>
            )}
            <View style={styles.totalLine}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0f172a' }}>Iš viso:</Text>
              <Text style={styles.totalText}>{totals.total.format()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.signatures} wrap={false}>
          <View style={styles.sigCol}>
            <Text style={styles.sigTitle}>Sąskaitą išrašė:</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigSubtext}>pareigos, vardas, pavardė, parašas</Text>
          </View>
          <View style={[styles.sigCol, { alignItems: 'flex-end' }]}>
            <Text style={styles.sigTitle}>Sąskaitą priėmė:</Text>
            <View style={[styles.sigLine, { width: '100%' }]} />
            <Text style={styles.sigSubtext}>pareigos, vardas, pavardė, parašas</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
