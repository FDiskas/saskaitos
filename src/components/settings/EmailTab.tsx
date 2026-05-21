import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, Label, Textarea } from '@/components/ui';

const DEBOUNCE_MS = 500;

export interface EmailTabProps {
  resendApiKey?: string;
  defaultSubject?: string;
  defaultBody?: string;
  onChange: (next: { resendApiKey?: string; defaultSubject?: string; defaultBody?: string }) => void;
}

export function EmailTab({ resendApiKey, defaultSubject, defaultBody, onChange }: EmailTabProps) {
  const [reveal, setReveal] = useState(false);
  const [key, setKey] = useState(resendApiKey ?? '');
  const [subject, setSubject] = useState(defaultSubject ?? '');
  const [body, setBody] = useState(defaultBody ?? '');
  const lastSnapshotRef = useRef<string>(JSON.stringify({ key, subject, body }));

  useEffect(() => {
    const snapshot = JSON.stringify({ key, subject, body });
    if (snapshot === lastSnapshotRef.current) return;
    const handle = setTimeout(() => {
      lastSnapshotRef.current = snapshot;
      onChange({
        resendApiKey: key.length === 0 ? undefined : key,
        defaultSubject: subject.length === 0 ? undefined : subject,
        defaultBody: body.length === 0 ? undefined : body,
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [key, subject, body, onChange]);

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="resend-key">Resend API raktas</Label>
        <div className="relative">
          <Input
            id="resend-key"
            type={reveal ? 'text' : 'password'}
            placeholder="re_xxx…"
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
          Raktas saugomas tavo Drive paskyroje, ne mūsų serveryje. Gauti raktą:{' '}
          <a
            href="https://resend.com/api-keys"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            resend.com/api-keys
          </a>
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email-subject">Numatytoji tema</Label>
        <Input
          id="email-subject"
          placeholder="Sąskaita {{invoice.number}}"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email-body">Numatytas laiško tekstas</Label>
        <Textarea
          id="email-body"
          rows={6}
          placeholder="Sveiki, {{client.name}}!\n\nSiunčiu sąskaitą {{invoice.number}}.\n\nPagarbiai."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <p className="text-xs text-slate-500">
          Galima naudoti vietas: <code>{'{{client.name}}'}</code>, <code>{'{{invoice.number}}'}</code>.
        </p>
      </div>
    </div>
  );
}
