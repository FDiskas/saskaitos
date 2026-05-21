import { z } from 'zod';
import { SeriesDtoSchema, type SeriesDto } from './schemas';

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

export const DesignPresetDtoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  primaryColor: HexColorSchema,
  accentColor: HexColorSchema,
  fontFamily: z.string().min(1),
  backgroundImageBase64: z.string().optional(),
});
export type DesignPresetDto = z.infer<typeof DesignPresetDtoSchema>;

export interface SettingsDto {
  company: CompanyDto | null;
  series: SeriesDto[];
  resendApiKey?: string;
  defaultEmailSubject?: string;
  defaultEmailBody?: string;
  designPresets: DesignPresetDto[];
}

const RawSettingsSchema = z.object({
  company: CompanyDtoSchema.nullable().default(null),
  series: z.array(SeriesDtoSchema).default([]),
  resendApiKey: z.string().optional(),
  defaultEmailSubject: z.string().optional(),
  defaultEmailBody: z.string().optional(),
  designPresets: z.array(DesignPresetDtoSchema).default([]),
});

export const SettingsDtoSchema: z.ZodType<SettingsDto> = RawSettingsSchema as unknown as z.ZodType<SettingsDto>;

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
    primaryColor: '#0f172a',
    accentColor: '#2563eb',
    fontFamily: 'Inter',
  };
  return {
    company: null,
    series: [initialSeries],
    designPresets: [initialPreset],
  };
}
