import { describe, it, expect } from 'vitest';
import {
  SettingsDtoSchema,
  defaultSettings,
  DEFAULT_DESIGN_PRESET_ID,
  DEFAULT_SERIES_ID,
} from './settings';

describe('SettingsDto schema', () => {
  it('when parsing defaults, then succeeds and produces stable identifiers', () => {
    const defaults = defaultSettings();
    const parsed = SettingsDtoSchema.parse(defaults);
    expect(parsed.company).toBeNull();
    expect(parsed.series).toHaveLength(1);
    expect(parsed.series[0]?.id).toBe(DEFAULT_SERIES_ID);
    expect(parsed.series[0]?.isDefault).toBe(true);
    expect(parsed.designPresets).toHaveLength(1);
    expect(parsed.designPresets[0]?.id).toBe(DEFAULT_DESIGN_PRESET_ID);
    expect(parsed.invoiceLayout.layout.length).toBeGreaterThan(0);
  });

  it('when company filled with valid values, then parsing keeps them', () => {
    const value = {
      ...defaultSettings(),
      company: {
        name: 'UAB Testas',
        code: '300000000',
        vatCode: 'LT100000000000',
        address: 'Vilnius',
        iban: 'LT12 3456 7890 1234 5678',
        bankName: 'Swedbank',
        email: 'info@test.lt',
        phone: '+37060000000',
      },
    };
    const parsed = SettingsDtoSchema.parse(value);
    expect(parsed.company?.name).toBe('UAB Testas');
    expect(parsed.company?.email).toBe('info@test.lt');
  });

  it('when multiple companies exist and active id is set, then company points to active profile', () => {
    const value = {
      ...defaultSettings(),
      companies: [
        {
          id: 'company-1',
          company: {
            name: 'UAB Pirmas',
            code: '111111111',
            address: 'Vilnius',
            iban: 'LT111111111111111111',
            bankName: 'Swedbank',
            email: 'pirmas@example.lt',
            phone: '+37060000001',
          },
        },
        {
          id: 'company-2',
          company: {
            name: 'UAB Antras',
            code: '222222222',
            address: 'Kaunas',
            iban: 'LT222222222222222222',
            bankName: 'SEB',
            email: 'antras@example.lt',
            phone: '+37060000002',
          },
        },
      ],
      activeCompanyId: 'company-2',
    };

    const parsed = SettingsDtoSchema.parse(value);
    expect(parsed.company?.name).toBe('UAB Antras');
    expect(parsed.activeCompanyId).toBe('company-2');
  });

  it('when legacy settings has single company only, then parser seeds company profiles automatically', () => {
    const legacy = {
      ...defaultSettings(),
      company: {
        name: 'UAB Istorinis',
        code: '333333333',
        address: 'Klaipėda',
        iban: 'LT333333333333333333',
        bankName: 'Luminor',
        email: 'istorinis@example.lt',
        phone: '+37060000003',
      },
    };

    const parsed = SettingsDtoSchema.parse(legacy);
    expect(parsed.companies).toHaveLength(1);
    expect(parsed.activeCompanyId).toBe(parsed.companies[0]?.id);
    expect(parsed.company?.name).toBe('UAB Istorinis');
  });

  it('when company email is empty string, then schema accepts it', () => {
    const value = {
      ...defaultSettings(),
      company: {
        name: '',
        code: '',
        address: '',
        iban: '',
        bankName: '',
        email: '',
        phone: '',
      },
    };
    expect(() => SettingsDtoSchema.parse(value)).not.toThrow();
  });

  it('when design preset color is malformed, then parsing fails', () => {
    const value = {
      ...defaultSettings(),
      designPresets: [
        {
          id: 'x',
          name: 'Bad',
          primaryColor: 'red',
          accentColor: '#000000',
          fontFamily: 'Inter',
        },
      ],
    };
    expect(() => SettingsDtoSchema.parse(value)).toThrow();
  });

  it('when legacy file lacks designPresets, then parsing fills empty array via defaults', () => {
    const legacy = { company: null, series: [] };
    const parsed = SettingsDtoSchema.parse(legacy);
    expect(parsed.designPresets).toEqual([]);
    expect(parsed.invoiceLayout.layout.length).toBeGreaterThan(0);
  });

  it('when invoiceLayout row has invalid columns, then parsing fails', () => {
    const value = {
      ...defaultSettings(),
      invoiceLayout: {
        layout: [
          {
            id: 'row-x',
            type: 'row',
            columns: [],
          },
        ],
      },
    };

    expect(() => SettingsDtoSchema.parse(value)).toThrow();
  });
});
