import { Invoice } from '@/lib/domain';
import type { SettingsDto, DesignPresetDto } from '@/lib/drive/settings';
import { Paintbrush, Image as ImageIcon, Upload } from 'lucide-react';

export interface DesignSidebarProps {
  invoice: Invoice;
  onChange: (updated: Invoice) => void;
  settings: SettingsDto;
  onUpdateSettings: (updater: (current: SettingsDto) => SettingsDto) => void;
}

export function DesignSidebar({
  invoice,
  onChange,
  settings,
  onUpdateSettings,
}: DesignSidebarProps) {
  const presets = settings.designPresets || [];
  const selectedPresetId = invoice.designPresetId;
  const activePreset = presets.find((p) => p.id === selectedPresetId) || presets[0];

  const handleSelectPreset = (presetId: string) => {
    onChange(invoice.withDesignPreset(presetId));
  };

  const handleUpdatePreset = (patch: Partial<Omit<DesignPresetDto, 'id'>>) => {
    if (!activePreset) return;
    onUpdateSettings((current) => ({
      ...current,
      designPresets: current.designPresets.map((p) =>
        p.id === activePreset.id ? { ...p, ...patch } : p,
      ),
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        handleUpdatePreset({ backgroundImageBase64: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    handleUpdatePreset({ backgroundImageBase64: undefined });
  };

  return (
    <aside className="w-[240px] shrink-0 border-r border-slate-200 bg-white p-4 h-full flex flex-col gap-6 no-print">
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Paintbrush className="h-3.5 w-3.5" />
          Dizaino šablonas
        </h3>
        <select
          value={selectedPresetId}
          onChange={(e) => handleSelectPreset(e.target.value)}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
        >
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </div>

      {activePreset && (
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Spalvų derinimas
          </h4>

          {/* Primary Color */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-600 font-medium">Pagrindinė spalva</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={activePreset.primaryColor}
                onChange={(e) => handleUpdatePreset({ primaryColor: e.target.value })}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
              />
              <span className="text-xs font-mono uppercase text-slate-500">
                {activePreset.primaryColor}
              </span>
            </div>
          </div>

          {/* Accent Color */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-600 font-medium">Akcento spalva</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={activePreset.accentColor}
                onChange={(e) => handleUpdatePreset({ accentColor: e.target.value })}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
              />
              <span className="text-xs font-mono uppercase text-slate-500">
                {activePreset.accentColor}
              </span>
            </div>
          </div>

          <hr className="border-slate-100 my-2" />

          {/* Background Image Upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
              Foninis paveikslėlis
            </label>
            {activePreset.backgroundImageBase64 ? (
              <div className="relative rounded-md border border-slate-200 p-2 bg-slate-50 flex flex-col gap-2">
                <img
                  src={activePreset.backgroundImageBase64}
                  alt="Foninis"
                  className="h-20 w-full object-cover rounded border border-slate-150"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="w-full text-center py-1 text-[11px] font-medium text-red-600 hover:text-red-700 bg-white rounded border border-red-200 hover:bg-red-50 cursor-pointer"
                >
                  Pašalinti foną
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border border-dashed border-slate-300 hover:border-slate-400 rounded-md p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer text-center group">
                <Upload className="h-5 w-5 text-slate-400 group-hover:text-slate-600 mb-1.5" />
                <span className="text-xs font-medium text-slate-600 group-hover:text-slate-800">
                  Įkelti foną
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">PNG / JPG</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
