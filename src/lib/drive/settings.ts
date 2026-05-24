import { z } from 'zod';
import { SeriesDtoSchema, type SeriesDto } from './schemas';
import {
  InvoiceTemplateLayoutSchema,
  defaultInvoiceTemplateLayout,
  type InvoiceTemplateLayoutDto,
} from '@/lib/invoice-template/layout';
import { migrateLegacyLayoutInput } from '@/lib/invoice-template/legacy';

export const DEFAULT_SERIES_ID = 'default';
export const DEFAULT_DESIGN_PRESET_ID = 'default';

const HexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const EmailOrEmptySchema = z.union([z.literal(''), z.string().email()]);

export const CompanyDtoSchema = z.object({
  name: z.string(),
  code: z.string(),
  vatCode: z.string().optional(),
  address: z.string(),
  iban: z.string(),
  bankName: z.string(),
  email: EmailOrEmptySchema,
  phone: z.string(),
  logoBase64: z.string().optional(),
});
export type CompanyDto = z.infer<typeof CompanyDtoSchema>;

export const CompanyProfileDtoSchema = z.object({
  id: z.string().min(1),
  company: CompanyDtoSchema,
});
export type CompanyProfileDto = z.infer<typeof CompanyProfileDtoSchema>;

export const DEFAULT_TEXT_COLOR = '#0f172a';
export const DEFAULT_MUTED_COLOR = '#64748b';
export const DEFAULT_BORDER_COLOR = '#cbd5e1';
export const DEFAULT_HEADING_COLOR = '#94a3b8';
export const DEFAULT_PRIMARY_COLOR = '#0f172a';
export const DEFAULT_ACCENT_COLOR = '#2563eb';

export const DesignPresetDtoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  primaryColor: HexColorSchema,
  accentColor: HexColorSchema,
  textColor: HexColorSchema.default(DEFAULT_TEXT_COLOR),
  mutedColor: HexColorSchema.default(DEFAULT_MUTED_COLOR),
  borderColor: HexColorSchema.default(DEFAULT_BORDER_COLOR),
  headingColor: HexColorSchema.default(DEFAULT_HEADING_COLOR),
  fontFamily: z.string().min(1),
  backgroundImageBase64: z.string().optional(),
});
export type DesignPresetDto = z.infer<typeof DesignPresetDtoSchema>;

export interface SettingsDto {
  company: CompanyDto | null;
  companies: CompanyProfileDto[];
  activeCompanyId: string | null;
  series: SeriesDto[];
  resendApiKey?: string;
  defaultEmailSubject?: string;
  defaultEmailBody?: string;
  jarsApiKey?: string;
  designPresets: DesignPresetDto[];
  invoiceLayout: InvoiceTemplateLayoutDto;
}

const MigratedInvoiceLayoutSchema = z.preprocess(migrateLegacyLayoutInput, InvoiceTemplateLayoutSchema);

const RawSettingsSchema = z.object({
  company: CompanyDtoSchema.nullable().default(null),
  companies: z.array(CompanyProfileDtoSchema).default([]),
  activeCompanyId: z.string().nullable().default(null),
  series: z.array(SeriesDtoSchema).default([]),
  resendApiKey: z.string().optional(),
  defaultEmailSubject: z.string().optional(),
  defaultEmailBody: z.string().optional(),
  jarsApiKey: z.string().optional(),
  designPresets: z.array(DesignPresetDtoSchema).default([]),
  invoiceLayout: MigratedInvoiceLayoutSchema.default(defaultInvoiceTemplateLayout()),
});

function normalizeCompanySelection(raw: z.infer<typeof RawSettingsSchema>): SettingsDto {
  const fallbackId = 'default-company';
  const companies = raw.companies.length > 0
    ? raw.companies
    : raw.company
      ? [{ id: fallbackId, company: raw.company }]
      : [];
  const activeCompanyId = raw.activeCompanyId ?? companies[0]?.id ?? null;
  const activeCompany = companies.find((profile) => profile.id === activeCompanyId)?.company ?? null;

  return {
    company: activeCompany,
    companies,
    activeCompanyId,
    series: raw.series,
    resendApiKey: raw.resendApiKey,
    defaultEmailSubject: raw.defaultEmailSubject,
    defaultEmailBody: raw.defaultEmailBody,
    jarsApiKey: raw.jarsApiKey,
    designPresets: raw.designPresets,
    invoiceLayout: raw.invoiceLayout,
  };
}

export const SettingsDtoSchema: z.ZodType<SettingsDto, z.ZodTypeDef, unknown> =
  RawSettingsSchema.transform(normalizeCompanySelection);

export function defaultSettings(): SettingsDto {
  const initialSeries: SeriesDto = {
    id: DEFAULT_SERIES_ID,
    prefix: 'SF2026-',
    nextNumber: 1,
    isDefault: true,
  };
  const initialPreset: DesignPresetDto = {
    id: DEFAULT_DESIGN_PRESET_ID,
    name: 'Numatytasis',
    primaryColor: DEFAULT_PRIMARY_COLOR,
    accentColor: DEFAULT_ACCENT_COLOR,
    textColor: DEFAULT_TEXT_COLOR,
    mutedColor: DEFAULT_MUTED_COLOR,
    borderColor: DEFAULT_BORDER_COLOR,
    headingColor: DEFAULT_HEADING_COLOR,
    fontFamily: 'Inter',
  };
  return {
    company: null,
    companies: [],
    activeCompanyId: null,
    series: [initialSeries],
    designPresets: [initialPreset],
    invoiceLayout: defaultInvoiceTemplateLayout(),
  };
}
