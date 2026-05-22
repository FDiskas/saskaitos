import { ImageOff } from 'lucide-react';
import type { SettingsDto } from '@/lib/drive/settings';

export interface LogoBlockProps {
  settings: SettingsDto;
}

export function LogoBlock({ settings }: LogoBlockProps) {
  const logoBase64 = settings.company?.logoBase64;

  if (!logoBase64) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 no-print">
        <ImageOff className="h-4 w-4 shrink-0" />
        <span>Logotipas nenustatytas</span>
      </div>
    );
  }

  return <img src={logoBase64} alt="Logotipas" className="max-h-16 max-w-50 object-contain print:max-h-16" />;
}
