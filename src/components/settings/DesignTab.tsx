import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Label } from '@/components/ui';
import { fileToBase64 } from '@/lib/files';
import type { DesignPresetDto } from '@/lib/drive/settings';

export interface DesignTabProps {
  presets: DesignPresetDto[];
  onChange: (next: DesignPresetDto[]) => void;
}

const FONT_FAMILIES = ['Inter', 'Roboto', 'Geist', 'JetBrains Mono'];

export function DesignTab({ presets, onChange }: DesignTabProps) {
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
      name: 'Naujas šablonas',
      primaryColor: '#0f172a',
      accentColor: '#2563eb',
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
        <p className="text-sm text-slate-500">Šablonai naudojami kuriant naujas sąskaitas.</p>
        <Button onClick={addPreset}>
          <Plus className="h-4 w-4" /> Naujas šablonas
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
          title={canDelete ? 'Pašalinti' : 'Bent vienas šablonas turi likti'}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ColorField
          label="Pirminė spalva"
          value={preset.primaryColor}
          onChange={(v) => onUpdate({ primaryColor: v })}
        />
        <ColorField
          label="Akcentinė spalva"
          value={preset.accentColor}
          onChange={(v) => onUpdate({ accentColor: v })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Šriftas</Label>
        <select
          value={preset.fontFamily}
          onChange={(e) => onUpdate({ fontFamily: e.target.value })}
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font}>{font}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        {preset.backgroundImageBase64 ? (
          <img
            src={preset.backgroundImageBase64}
            alt="Fonas"
            className="h-12 w-20 rounded border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex h-12 w-20 items-center justify-center rounded border border-dashed border-slate-300 text-xs text-slate-400">
            Nėra
          </div>
        )}
        <label className="inline-flex cursor-pointer items-center rounded-md bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
          Įkelti foną
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
            Pašalinti
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
