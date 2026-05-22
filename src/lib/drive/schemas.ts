import { z } from 'zod';
import {
  Client,
  ClientId,
  Invoice,
  InvoiceId,
  InvoiceNumber,
  LineItem,
  LineItems,
  Money,
  Series,
  VatRate,
  type VatPercent,
} from '@/lib/domain';

const isoDate = z.string().datetime();
const uuidV7 = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
);

export const MoneyDtoSchema = z.object({
  cents: z.number().int(),
  currency: z.string().min(3).max(3),
});
export type MoneyDto = z.infer<typeof MoneyDtoSchema>;

export const LineItemDtoSchema = z.object({
  id: z.string().min(1),
  description: z.string(),
  quantity: z.number(),
  unit: z.string(),
  unitPrice: MoneyDtoSchema,
  vatRate: z.union([z.literal(0), z.literal(5), z.literal(9), z.literal(21)]).optional(),
});
export type LineItemDto = z.infer<typeof LineItemDtoSchema>;

const vatPercentSchema = z.union([z.literal(0), z.literal(5), z.literal(9), z.literal(21)]);

export const InvoiceVatDtoSchema = z.object({
  enabled: z.boolean(),
  rate: vatPercentSchema,
});
export type InvoiceVatDto = z.infer<typeof InvoiceVatDtoSchema>;

export const InvoiceNumberDtoSchema = z.object({
  prefix: z.string(),
  sequence: z.number().int().min(1),
});
export type InvoiceNumberDto = z.infer<typeof InvoiceNumberDtoSchema>;

export const InvoiceStatusSchema = z.enum(['draft', 'sent', 'paid', 'overdue']);

export const DesignOverrideDtoSchema = z.object({
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  textColor: z.string().optional(),
  mutedColor: z.string().optional(),
  borderColor: z.string().optional(),
  headingColor: z.string().optional(),
  backgroundImageBase64: z.string().optional(),
});
export type DesignOverrideDto = z.infer<typeof DesignOverrideDtoSchema>;

export const InvoiceDtoSchema = z.object({
  id: uuidV7,
  number: InvoiceNumberDtoSchema,
  seriesId: z.string(),
  clientId: uuidV7,
  issueDate: isoDate,
  dueDate: isoDate,
  lineItems: z.array(LineItemDtoSchema),
  vat: InvoiceVatDtoSchema,
  status: InvoiceStatusSchema,
  notes: z.string().optional(),
  designPresetId: z.string(),
  designOverride: DesignOverrideDtoSchema.optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type InvoiceDto = z.infer<typeof InvoiceDtoSchema>;

export const InvoiceIndexEntrySchema = z.object({
  id: uuidV7,
  number: z.string(),
  date: isoDate,
  dueDate: isoDate.optional(),
  amountCents: z.number().int(),
  currency: z.string().min(3).max(3),
  status: InvoiceStatusSchema,
});
export type InvoiceIndexEntry = z.infer<typeof InvoiceIndexEntrySchema>;

export const InvoicesIndexFileSchema = z.array(InvoiceIndexEntrySchema);
export type InvoicesIndexFileDto = z.infer<typeof InvoicesIndexFileSchema>;


export const ClientDtoSchema = z.object({
  id: uuidV7,
  name: z.string().min(1),
  code: z.string().optional(),
  vatCode: z.string().optional(),
  address: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type ClientDto = z.infer<typeof ClientDtoSchema>;

export const ClientsFileSchema = z.object({
  clients: z.array(ClientDtoSchema),
});
export type ClientsFileDto = z.infer<typeof ClientsFileSchema>;


export const SeriesDtoSchema = z.object({
  id: z.string(),
  prefix: z.string(),
  nextNumber: z.number().int().min(1),
  isDefault: z.boolean(),
});
export type SeriesDto = z.infer<typeof SeriesDtoSchema>;

function moneyToDto(money: Money): MoneyDto {
  return { cents: money.toCents(), currency: money.currency };
}

function moneyFromDto(dto: MoneyDto): Money {
  return Money.fromCents(dto.cents, dto.currency);
}

function lineItemToDto(item: LineItem): LineItemDto {
  return {
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: moneyToDto(item.unitPrice),
    vatRate: item.vatRate.percent,
  };
}

function lineItemFromDto(dto: LineItemDto, fallbackVatRate: VatPercent): LineItem {
  return LineItem.of({
    id: dto.id,
    description: dto.description,
    quantity: dto.quantity,
    unit: dto.unit,
    unitPrice: moneyFromDto(dto.unitPrice),
    vatRate: VatRate.of(dto.vatRate ?? fallbackVatRate),
  });
}

export function invoiceToDto(invoice: Invoice): InvoiceDto {
  return {
    id: invoice.id.toString(),
    number: { prefix: invoice.number.prefix, sequence: invoice.number.sequence },
    seriesId: invoice.seriesId,
    clientId: invoice.clientId.toString(),
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
    lineItems: invoice.lineItems.toArray().map(lineItemToDto),
    vat: { enabled: invoice.vat.enabled, rate: invoice.vat.rate.percent },
    status: invoice.status,
    notes: invoice.notes,
    designPresetId: invoice.designPresetId,
    designOverride: invoice.designOverride,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  };
}

export function invoiceFromDto(dto: InvoiceDto): Invoice {
  const invoiceVatRate = dto.vat.rate;
  return Invoice.create({
    id: InvoiceId.fromString(dto.id),
    number: InvoiceNumber.of(dto.number.prefix, dto.number.sequence),
    seriesId: dto.seriesId,
    clientId: ClientId.fromString(dto.clientId),
    issueDate: new Date(dto.issueDate),
    dueDate: new Date(dto.dueDate),
    lineItems: LineItems.of(dto.lineItems.map((item) => lineItemFromDto(item, invoiceVatRate))),
    vat: { enabled: dto.vat.enabled, rate: VatRate.of(invoiceVatRate) },
    status: dto.status,
    notes: dto.notes,
    designPresetId: dto.designPresetId,
    designOverride: dto.designOverride,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  });
}

export function clientToDto(client: Client): ClientDto {
  return {
    id: client.id.toString(),
    name: client.name,
    code: client.code,
    vatCode: client.vatCode,
    address: client.address,
    email: client.email,
    phone: client.phone,
    contactPerson: client.contactPerson,
    notes: client.notes,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}

export function clientFromDto(dto: ClientDto): Client {
  return Client.of({
    id: ClientId.fromString(dto.id),
    name: dto.name,
    code: dto.code,
    vatCode: dto.vatCode,
    address: dto.address,
    email: dto.email,
    phone: dto.phone,
    contactPerson: dto.contactPerson,
    notes: dto.notes,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  });
}

export function seriesToDto(series: Series): SeriesDto {
  return {
    id: series.id,
    prefix: series.prefix,
    nextNumber: series.nextNumber,
    isDefault: series.isDefault,
  };
}

export function seriesFromDto(dto: SeriesDto): Series {
  return Series.of(dto);
}
