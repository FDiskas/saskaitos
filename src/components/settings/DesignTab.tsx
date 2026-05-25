import { useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Combobox, Input, Label, type ComboboxItem } from '@/components/ui';
import { useTranslate } from '@/hooks';
import type { translate } from '@/lib/translate';
import { fileToBase64 } from '@/lib/files';
import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_BORDER_COLOR,
  DEFAULT_HEADING_COLOR,
  DEFAULT_MUTED_COLOR,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_TEXT_COLOR,
  type DesignPresetDto,
} from '@/lib/drive/settings';
import { availableFontFamilies } from '@/lib/pdf/googleFonts';

export interface DesignTabProps {
  presets: DesignPresetDto[];
  onChange: (next: DesignPresetDto[]) => void;
}


interface ColorFieldConfig {
  key: keyof Pick<
    DesignPresetDto,
    'primaryColor' | 'accentColor' | 'textColor' | 'mutedColor' | 'borderColor' | 'headingColor'
  >;
  labelKey: keyof typeof translate;
}

const COLOR_FIELDS: readonly ColorFieldConfig[] = [
  { key: 'primaryColor', labelKey: 'settings.design.color.primary' },
  { key: 'accentColor', labelKey: 'settings.design.color.accent' },
  { key: 'textColor', labelKey: 'settings.design.color.text' },
  { key: 'mutedColor', labelKey: 'settings.design.color.muted' },
  { key: 'borderColor', labelKey: 'settings.design.color.border' },
  { key: 'headingColor', labelKey: 'settings.design.color.heading' },
];

export function DesignTab({ presets, onChange }: DesignTabProps) {
  const t = useTranslate();
  function updatePreset(id: string, patch: Partial<DesignPresetDto>): void {
    onChange(presets.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function removePreset(id: string): void {
    if (presets.length <= 1) return;
    onChange(presets.filter((p) => p.id !== id));
  }

  function addPreset(): void {
    const next: DesignPresetDto = {
      id: crypto.randomUUID(),
      name: t['settings.design.preset.newName'] as string,
      primaryColor: DEFAULT_PRIMARY_COLOR,
      accentColor: DEFAULT_ACCENT_COLOR,
      textColor: DEFAULT_TEXT_COLOR,
      mutedColor: DEFAULT_MUTED_COLOR,
      borderColor: DEFAULT_BORDER_COLOR,
      headingColor: DEFAULT_HEADING_COLOR,
      fontFamily: 'Inter',
    };
    onChange([...presets, next]);
  }

  async function handleBackground(id: string, file: File): Promise<void> {
    const dataUrl = await fileToBase64(file);
    updatePreset(id, { backgroundImageBase64: dataUrl });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{t['settings.design.intro']}</p>
        <Button onClick={addPreset}>
          <Plus className="h-4 w-4" /> {t['settings.design.addPreset']}
        </Button>
      </div>
      <ul className="grid gap-4 lg:grid-cols-2">
        {presets.map((preset) => (
          <li key={preset.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <DesignCard
              preset={preset}
              canDelete={presets.length > 1}
              onUpdate={(patch) => updatePreset(preset.id, patch)}
              onRemove={() => removePreset(preset.id)}
              onBackground={(file) => handleBackground(preset.id, file)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

interface DesignCardProps {
  preset: DesignPresetDto;
  canDelete: boolean;
  onUpdate: (patch: Partial<DesignPresetDto>) => void;
  onRemove: () => void;
  onBackground: (file: File) => Promise<void>;
}

function DesignCard({ preset, canDelete, onUpdate, onRemove, onBackground }: DesignCardProps) {
  const t = useTranslate();
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Input
          value={preset.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="font-medium"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={!canDelete}
          title={canDelete ? t['settings.design.deleteTitle'] : t['settings.design.deleteDisabledTitle']}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {COLOR_FIELDS.map((colorField) => (
          <ColorField
            key={colorField.key}
            label={t[colorField.labelKey] as string}
            value={preset[colorField.key]}
            onChange={(value) => onUpdate({ [colorField.key]: value })}
          />
        ))}
      </div>
      <FontPicker
        value={preset.fontFamily}
        onChange={(next) => onUpdate({ fontFamily: next })}
      />
      <div className="flex items-center gap-3">
        {preset.backgroundImageBase64 ? (
          <img
            src={preset.backgroundImageBase64}
            alt={t['settings.design.background.altText']}
            className="h-12 w-20 rounded border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex h-12 w-20 items-center justify-center rounded border border-dashed border-slate-300 text-xs text-slate-400">
            {t['settings.design.background.empty']}
          </div>
        )}
        <label className="inline-flex cursor-pointer items-center rounded-md bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
          {t['settings.design.background.upload']}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onBackground(file);
              e.target.value = '';
            }}
          />
        </label>
        {preset.backgroundImageBase64 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUpdate({ backgroundImageBase64: undefined })}
          >
            {t['settings.design.background.remove']}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-slate-200"
          aria-label={label}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" />
      </div>
    </div>
  );
}

function FontPicker({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const t = useTranslate();
  const items = useMemo<ComboboxItem[]>(
    () => availableFontFamilies.map((f) => ({ value: f, label: f })),
    [],
  );
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{t['settings.design.font']}</Label>
      <Combobox
        value={value}
        onChange={(next) => onChange(next ?? 'Inter')}
        items={items}
        placeholder={t['settings.design.font.placeholder']}
        searchPlaceholder={t['settings.design.font.searchPlaceholder']}
        emptyText={t['settings.design.font.empty']}
        allowClear={false}
      />
    </div>
  );
}
