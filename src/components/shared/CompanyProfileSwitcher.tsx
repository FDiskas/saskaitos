import { useMemo } from 'react';
import { useSettings, useTranslate } from '@/hooks';
import { withParams } from '@/lib/translate';

export function CompanyProfileSwitcher() {
  const { settings, update } = useSettings();
  const t = useTranslate();

  const activeCompanyId = useMemo(() => {
    if (!settings) return null;
    return settings.activeCompanyId ?? settings.companies?.[0]?.id ?? null;
  }, [settings]);

  if (!settings) return null;

  const profiles = settings.companies ?? [];
  if (profiles.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="active-company-header" className="text-xs font-medium text-slate-500">
        {t['company.switcher.label']}
      </label>
      <select
        id="active-company-header"
        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"
        value={activeCompanyId ?? ''}
        onChange={(event) => {
          const nextId = event.target.value;
          if (!nextId) return;

          update((current) => {
            const profile = (current.companies ?? []).find((candidate) => candidate.id === nextId);
            if (!profile) return current;
            return {
              ...current,
              activeCompanyId: nextId,
              company: profile.company,
            };
          });
        }}
      >
        {profiles.map((profile, index) => (
          <option key={profile.id} value={profile.id}>
            {profile.company.name.trim() ||
              withParams(t['company.switcher.fallbackName'], { index: index + 1 })}
          </option>
        ))}
      </select>
    </div>
  );
}
