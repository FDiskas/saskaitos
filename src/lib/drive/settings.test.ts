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
