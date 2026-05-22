import type { CompanyProfileDto } from '@/lib/drive/settings';

export interface CompanyProfilesListProps {
  profiles: CompanyProfileDto[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function CompanyProfilesList({
  profiles,
  activeId,
  onSelect,
  onDelete,
  onAdd,
}: CompanyProfilesListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Juridiniai vienetai</h3>
        <button
          type="button"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          onClick={onAdd}
        >
          Pridėti juridinį vienetą
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
          Juridinių vienetų dar nėra. Sukurkite pirmąjį įrašą.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          {profiles.map((profile, index) => {
            const displayName = profile.company.name.trim() || `Juridinis vienetas ${index + 1}`;
            const isActive = profile.id === activeId;

            return (
              <div
                key={profile.id}
                className={`flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0 ${
                  isActive ? 'bg-sky-50' : 'bg-white'
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{displayName}</p>
                  <p className="text-xs text-slate-500">
                    {profile.company.code || 'Kodas nenurodytas'}
                    {profile.company.email ? ` · ${profile.company.email}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => onSelect(profile.id)}
                  >
                    Redaguoti
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                    onClick={() => onDelete(profile.id)}
                  >
                    Trinti
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
