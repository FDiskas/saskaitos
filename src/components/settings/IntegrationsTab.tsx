import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, Label } from '@/components/ui';

const DEBOUNCE_MS = 500;

export interface IntegrationsTabProps {
  jarsApiKey?: string;
  onChange: (next: { jarsApiKey?: string }) => void;
}

export function IntegrationsTab({ jarsApiKey, onChange }: IntegrationsTabProps) {
  const [reveal, setReveal] = useState(false);
  const [key, setKey] = useState(jarsApiKey ?? '');
  const lastSnapshotRef = useRef<string>(jarsApiKey ?? '');

  useEffect(() => {
    if (key === lastSnapshotRef.current) return;
    const handle = setTimeout(() => {
      lastSnapshotRef.current = key;
      onChange({ jarsApiKey: key.length === 0 ? undefined : key });
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [key, onChange]);

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="jars-key">Jars.lt API raktas</Label>
        <div className="relative">
          <Input
            id="jars-key"
            type={reveal ? 'text' : 'password'}
            placeholder="jars_xxx…"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? 'Slėpti raktą' : 'Rodyti raktą'}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100"
          >
            {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Įvedus raktą šalia pavadinimo laukelio atsiras paieškos mygtukas, kuris užpildo įmonės duomenis iš
          Registrų centro. Nemokamai galima atlikti iki 100 užklausų per mėnesį — naudokite tik tikslinei paieškai.
          {' '}Gauti raktą:{' '}
          <a
            href="https://jars.lt"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            jars.lt
          </a>
        </p>
      </div>
    </div>
  );
}
