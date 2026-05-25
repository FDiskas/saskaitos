import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Label, Textarea } from '@/components/ui';
import { JarsCompanySearchButton } from '@/components/shared';
import { useTranslate } from '@/hooks';
import { withParams } from '@/lib/translate';
import { fileToBase64 } from '@/lib/files';
import { CompanyDtoSchema, type CompanyDto } from '@/lib/drive/settings';
import type { JarsCompany } from '@/lib/jars';

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
  jarsApiKey?: string;
}

export function CompanyTab({ value, onChange, jarsApiKey }: CompanyTabProps) {
  const defaults = useMemo(() => value ?? EMPTY, [value]);
  const form = useForm<CompanyDto>({
    defaultValues: defaults,
    resolver: zodResolver(CompanyDtoSchema),
    mode: 'onChange',
  });
  const { register, watch, setValue, formState, reset } = form;
  const lastSnapshotRef = useRef<string>(JSON.stringify(defaults));
  const t = useTranslate();
  const [jarsError, setJarsError] = useState<string | null>(null);

  function applyJarsResult(company: JarsCompany): void {
    setValue('name', company.name, { shouldDirty: true, shouldValidate: true });
    setValue('code', company.code, { shouldDirty: true, shouldValidate: true });
    if (company.vatCode) {
      setValue('vatCode', company.vatCode, { shouldDirty: true, shouldValidate: true });
    }
    if (company.address) {
      setValue('address', company.address, { shouldDirty: true, shouldValidate: true });
    }
    const status = company.status;
    if (status && status !== 'ACTIVE') {
      setJarsError(withParams(t['clients.form.jarsStatusWarning'], { status }));
      return;
    }
    setJarsError(null);
  }

  const nameQuery = watch('name') ?? '';

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
      <Field label={t['settings.company.field.name']} error={jarsError ?? undefined}>
        <div className="flex items-center gap-2">
          <Input {...register('name')} placeholder={t['settings.company.placeholder.name']} />
          <JarsCompanySearchButton
            apiKey={jarsApiKey}
            query={nameQuery}
            onResult={applyJarsResult}
            onError={setJarsError}
          />
        </div>
      </Field>
      <Field label={t['settings.company.field.code']}>
        <Input {...register('code')} placeholder={t['settings.company.placeholder.code']} />
      </Field>
      <Field label={t['settings.company.field.vatCode']}>
        <Input {...register('vatCode')} placeholder={t['settings.company.placeholder.vatCode']} />
      </Field>
      <Field label={t['settings.company.field.email']} error={typeof emailError === 'string' ? emailError : undefined}>
        <Input type="email" {...register('email')} placeholder={t['settings.company.placeholder.email']} />
      </Field>
      <Field label={t['settings.company.field.phone']}>
        <Input {...register('phone')} placeholder={t['settings.company.placeholder.phone']} />
      </Field>
      <Field label={t['settings.company.field.address']}>
        <Textarea rows={2} {...register('address')} placeholder={t['settings.company.placeholder.address']} />
      </Field>
      <Field label={t['settings.company.field.bank']}>
        <Input {...register('bankName')} placeholder={t['settings.company.placeholder.bank']} />
      </Field>
      <Field label={t['settings.company.field.iban']}>
        <Input {...register('iban')} placeholder={t['settings.company.placeholder.iban']} />
      </Field>
      <div className="lg:col-span-2">
        <Label>{t['settings.company.field.logo']}</Label>
        <div className="mt-1.5 flex items-center gap-3">
          {logoBase64 ? (
            <img
              src={logoBase64}
              alt={t['settings.company.logo.altText']}
              className="h-14 w-14 rounded border border-slate-200 object-contain p-1"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded border border-dashed border-slate-300 text-xs text-slate-400">
              {t['settings.company.logo.empty']}
            </div>
          )}
          <label className="inline-flex cursor-pointer items-center rounded-md bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
            {t['settings.company.logo.uploadLabel']}
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
              {t['settings.company.logo.removeLabel']}
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
