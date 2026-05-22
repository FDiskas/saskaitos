import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Label, Textarea } from '@/components/ui';
import { fileToBase64 } from '@/lib/files';
import { CompanyDtoSchema, type CompanyDto } from '@/lib/drive/settings';

const EMPTY: CompanyDto = {
  name: '',
  code: '',
  vatCode: '',
  address: '',
  iban: '',
  bankName: '',
  email: '',
  phone: '',
};

const DEBOUNCE_MS = 500;

export interface CompanyTabProps {
  value: CompanyDto | null;
  onChange: (next: CompanyDto) => void;
}

export function CompanyTab({ value, onChange }: CompanyTabProps) {
  const defaults = useMemo(() => value ?? EMPTY, [value]);
  const form = useForm<CompanyDto>({
    defaultValues: defaults,
    resolver: zodResolver(CompanyDtoSchema),
    mode: 'onChange',
  });
  const { register, watch, setValue, formState, reset } = form;
  const lastSnapshotRef = useRef<string>(JSON.stringify(defaults));

  useEffect(() => {
    reset(defaults);
    lastSnapshotRef.current = JSON.stringify(defaults);
  }, [defaults, reset]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sub = watch((next) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const parsed = CompanyDtoSchema.safeParse(next);
        if (!parsed.success) return;
        const snapshot = JSON.stringify(parsed.data);
        if (snapshot === lastSnapshotRef.current) return;
        lastSnapshotRef.current = snapshot;
        onChange(parsed.data);
      }, DEBOUNCE_MS);
    });
    return () => {
      sub.unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [watch, onChange]);

  async function handleLogoUpload(file: File): Promise<void> {
    const dataUrl = await fileToBase64(file);
    setValue('logoBase64', dataUrl, { shouldDirty: true, shouldValidate: true });
  }

  const logoBase64 = watch('logoBase64');
  const emailError = formState.errors.email?.message;

  return (
    <form className="grid gap-5 lg:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
      <Field label="Pavadinimas">
        <Input {...register('name')} placeholder="UAB Pavyzdys" />
      </Field>
      <Field label="Įmonės kodas">
        <Input {...register('code')} placeholder="300000000" />
      </Field>
      <Field label="PVM kodas">
        <Input {...register('vatCode')} placeholder="LT100000000000" />
      </Field>
      <Field label="El. paštas" error={typeof emailError === 'string' ? emailError : undefined}>
        <Input type="email" {...register('email')} placeholder="info@pavyzdys.lt" />
      </Field>
      <Field label="Telefonas">
        <Input {...register('phone')} placeholder="+370 600 00000" />
      </Field>
      <Field label="Adresas">
        <Textarea rows={2} {...register('address')} placeholder="Gatvė, miestas" />
      </Field>
      <Field label="Bankas">
        <Input {...register('bankName')} placeholder="Swedbank" />
      </Field>
      <Field label="IBAN">
        <Input {...register('iban')} placeholder="LT00 0000 0000 0000 0000" />
      </Field>
      <div className="lg:col-span-2">
        <Label>Logotipas</Label>
        <div className="mt-1.5 flex items-center gap-3">
          {logoBase64 ? (
            <img
              src={logoBase64}
              alt="Logotipas"
              className="h-14 w-14 rounded border border-slate-200 object-contain p-1"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded border border-dashed border-slate-300 text-xs text-slate-400">
              Nėra
            </div>
          )}
          <label className="inline-flex cursor-pointer items-center rounded-md bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
            Įkelti
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleLogoUpload(file);
                e.target.value = '';
              }}
            />
          </label>
          {logoBase64 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setValue('logoBase64', undefined, { shouldDirty: true })}
            >
              Pašalinti
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
