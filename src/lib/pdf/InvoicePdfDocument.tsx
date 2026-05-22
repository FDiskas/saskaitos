import { Document, Image, Page, Text, View } from '@react-pdf/renderer';
import type { Client, Invoice } from '@/lib/domain';
import type { SettingsDto } from '@/lib/drive/settings';
import type { TemplateBlockId } from '@/lib/invoice-template/layout';
import { readTemplateBlockSettings } from '@/lib/invoice-template/layout';
import { formatDate } from '@/lib/format/date';
import { getPdfStyles } from './InvoicePdfStyles';
import { resolveFontStack } from './googleFonts';

const PX_TO_PT = 0.75;
const PREVIEW_PAGE_CONTENT_HEIGHT = 1027;
const DEFAULT_ROW_HEIGHT = 96;
const BLOCK_HEIGHT_ESTIMATE = 84;

function pxToPt(px: number): number {
  return Math.round(px * PX_TO_PT);
}

export interface InvoicePdfDocumentProps {
  invoice: Invoice;
  client: Client;
  settings: SettingsDto;
}

export function InvoicePdfDocument({ invoice, client, settings }: InvoicePdfDocumentProps) {
  const activePreset =
    settings.designPresets.find((preset) => preset.id === invoice.designPresetId) || settings.designPresets[0];
  const primaryColor = activePreset?.primaryColor || '#0f172a';
  const accentColor = activePreset?.accentColor || '#0284c7';
  const fontStack = resolveFontStack(activePreset?.fontFamily);

  const totals = invoice.totals();
  const hasVat = invoice.vat.enabled;
  const items = invoice.lineItems.toArray();
  const styles = getPdfStyles(primaryColor, accentColor, fontStack);

  const paginatedRows = (() => {
    const pages: typeof settings.invoiceLayout.layout[] = [];
    let currentPage: typeof settings.invoiceLayout.layout = [];
    let currentHeight = 0;

    for (const row of settings.invoiceLayout.layout) {
      const maxMargins = row.columns.reduce((maxValue, column) => {
        const margins = column.content.reduce((sum, blockId) => {
          const blockSettings = readTemplateBlockSettings(settings.invoiceLayout, blockId);
          return sum + blockSettings.marginTop + blockSettings.marginBottom;
        }, 0);
        return Math.max(maxValue, margins);
      }, 0);

      const densestColumnBlocks = row.columns.reduce((maxValue, column) => {
        return Math.max(maxValue, column.content.length);
      }, 0);

      const estimatedContentHeight = Math.max(
        DEFAULT_ROW_HEIGHT,
        densestColumnBlocks * BLOCK_HEIGHT_ESTIMATE,
      );

      const estimatedRowHeight = estimatedContentHeight + maxMargins + 16;

      if (currentPage.length > 0 && currentHeight + estimatedRowHeight > PREVIEW_PAGE_CONTENT_HEIGHT) {
        pages.push(currentPage);
        currentPage = [row];
        currentHeight = estimatedRowHeight;
        continue;
      }

      currentPage.push(row);
      currentHeight += estimatedRowHeight;
    }

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    return pages.length > 0 ? pages : [[]];
  })();

  const renderBlock = (blockId: TemplateBlockId) => {
    if (blockId === 'logo') {
      if (!settings.company?.logoBase64) return null;
      return <Image src={settings.company.logoBase64} style={styles.logo} />;
    }

    if (blockId === 'seller-info') {
      return (
        <View>
          <Text style={styles.sectionTitle}>Pardavėjas</Text>
          {settings.company && (
            <View>
              <Text style={styles.companyName}>{settings.company.name}</Text>
              <Text style={styles.infoText}>Įmonės kodas: {settings.company.code}</Text>
              {settings.company.vatCode && <Text style={styles.infoText}>PVM kodas: {settings.company.vatCode}</Text>}
              <Text style={styles.infoText}>{settings.company.address}</Text>
              <Text style={[styles.infoText, { marginTop: 4, fontWeight: 'bold' }]}>Sąskaita IBAN: {settings.company.iban}</Text>
              <Text style={styles.infoText}>Bankas: {settings.company.bankName}</Text>
              <Text style={styles.infoText}>El. paštas: {settings.company.email}</Text>
              <Text style={styles.infoText}>Tel.: {settings.company.phone}</Text>
            </View>
          )}
        </View>
      );
    }

    if (blockId === 'invoice-meta') {
      return (
        <View style={styles.invoiceInfoCol}>
          <Text style={styles.invoiceTitle}>{hasVat ? 'PVM Sąskaita-Faktūra' : 'Sąskaita-Faktūra'}</Text>
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
      );
    }

    if (blockId === 'buyer-info') {
      return (
        <View style={styles.buyerCol}>
          <Text style={styles.sectionTitle}>Pirkėjas</Text>
          <Text style={styles.companyName}>{client.name}</Text>
          {client.code && <Text style={styles.infoText}>Įmonės kodas: {client.code}</Text>}
          {client.vatCode && <Text style={styles.infoText}>PVM kodas: {client.vatCode}</Text>}
          <Text style={styles.infoText}>{client.address}</Text>
          {client.email && <Text style={styles.infoText}>El. paštas: {client.email}</Text>}
          {client.phone && <Text style={styles.infoText}>Tel.: {client.phone}</Text>}
        </View>
      );
    }

    if (blockId === 'line-items') {
      return (
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
      );
    }

    if (blockId === 'notes') {
      if (!invoice.notes) return null;
      return (
        <View>
          <Text style={styles.sectionTitle}>Papildoma informacija / Pastabos</Text>
          <Text style={styles.notesText}>{invoice.notes}</Text>
        </View>
      );
    }

    if (blockId === 'totals') {
      return (
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
      );
    }

    if (blockId === 'signature') {
      return (
        <View style={[styles.signatures, { marginTop: 0 }]} wrap={false}>
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
      );
    }

    return null;
  };

  return (
    <Document>
      {paginatedRows.map((rows, pageIndex) => (
        <Page key={`page-${pageIndex}`} size="A4" style={styles.page}>
          {activePreset?.backgroundImageBase64 && <Image src={activePreset.backgroundImageBase64} style={styles.background} />}

          {rows.map((row) => (
            <View
              key={row.id}
              style={{
                flexDirection: 'row',
                marginBottom: pxToPt(10),
              }}
            >
              {row.columns.map((column, index) => (
                <View
                  key={column.id}
                  style={{
                    width: `${100 / row.columns.length}%`,
                    paddingRight: index === row.columns.length - 1 ? 0 : 8,
                  }}
                >
                  {column.content.map((blockId, blockIndex) => (
                    <View
                      key={`${column.id}-${blockId}-${blockIndex}`}
                      style={{
                        marginTop: pxToPt(readTemplateBlockSettings(settings.invoiceLayout, blockId).marginTop),
                        marginBottom: pxToPt(readTemplateBlockSettings(settings.invoiceLayout, blockId).marginBottom + 8),
                        alignItems:
                          readTemplateBlockSettings(settings.invoiceLayout, blockId).align === 'center'
                            ? 'center'
                            : readTemplateBlockSettings(settings.invoiceLayout, blockId).align === 'right'
                              ? 'flex-end'
                              : 'flex-start',
                      }}
                    >
                      {renderBlock(blockId)}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ))}
        </Page>
      ))}
    </Document>
  );
}
