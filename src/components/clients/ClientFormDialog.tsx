import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Client } from '@/lib/domain';
import {
  Button,
  Dialog,
  DialogCloseButton,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from '@/components/ui';
import { JarsCompanySearchButton } from '@/components/shared';
import { useLanguage, useSettings, useTranslate } from '@/hooks';
import { translate, withParams } from '@/lib/translate';
import type { JarsCompany } from '@/lib/jars';

function buildClientFormSchema(t: typeof translate) {
  return z.object({
    name: z.string().min(1, t['clients.form.errorNameRequired'] as string),
    code: z.string().optional(),
    vatCode: z.string().optional(),
    address: z.string().min(1, t['clients.form.errorAddressRequired'] as string),
    email: z
      .union([
        z.string().email(t['clients.form.errorEmailInvalid'] as string),
        z.string().length(0),
      ])
      .optional(),
    phone: z.string().optional(),
    contactPerson: z.string().optional(),
    notes: z.string().optional(),
  });
}

export type ClientFormValues = z.infer<ReturnType<typeof buildClientFormSchema>>;

export interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingClient: Client | null;
  onSave: (values: ClientFormValues) => void;
  isSaving: boolean;
}

export function ClientFormDialog({
  open,
  onOpenChange,
  editingClient,
  onSave,
  isSaving,
}: ClientFormDialogProps) {
  const { language } = useLanguage();
  // language drives translate mutation; rebuild schema when it changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const clientFormSchema = useMemo(() => buildClientFormSchema(translate), [language]);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: '',
      code: '',
      vatCode: '',
      address: '',
      email: '',
      phone: '',
      contactPerson: '',
      notes: '',
    },
  });

  const { settings } = useSettings();
  const t = useTranslate();
  const [jarsError, setJarsError] = useState<string | null>(null);
  const nameQuery = watch('name') ?? '';

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

  useEffect(() => {
    if (open) {
      reset({
        name: editingClient?.name ?? '',
        code: editingClient?.code ?? '',
        vatCode: editingClient?.vatCode ?? '',
        address: editingClient?.address ?? '',
        email: editingClient?.email ?? '',
        phone: editingClient?.phone ?? '',
        contactPerson: editingClient?.contactPerson ?? '',
        notes: editingClient?.notes ?? '',
      });
    }
  }, [open, editingClient, reset]);

  const handleFormSubmit = (values: ClientFormValues) => {
    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>{editingClient ? t['clients.form.titleEdit'] : t['clients.form.titleCreate']}</DialogTitle>
        <DialogDescription>
          {editingClient
            ? t['clients.form.descriptionEdit']
            : t['clients.form.descriptionCreate']}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <DialogCloseButton onClick={() => onOpenChange(false)} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client-name">{t['clients.form.fieldName']}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="client-name"
                placeholder={t['clients.form.placeholderName']}
                {...register('name')}
                className={errors.name ? 'border-red-500 focus:ring-red-200' : ''}
              />
              <JarsCompanySearchButton
                apiKey={settings?.jarsApiKey}
                query={nameQuery}
                onResult={applyJarsResult}
                onError={setJarsError}
              />
            </div>
            {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
            {jarsError && <span className="text-xs text-amber-600">{jarsError}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client-address">{t['clients.form.fieldAddress']}</Label>
            <Input
              id="client-address"
              placeholder={t['clients.form.placeholderAddress']}
              {...register('address')}
              className={errors.address ? 'border-red-500 focus:ring-red-200' : ''}
            />
            {errors.address && (
              <span className="text-xs text-red-500">{errors.address.message}</span>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client-code">{t['clients.form.fieldCompanyCode']}</Label>
            <Input id="client-code" placeholder={t['clients.form.placeholderCompanyCode']} {...register('code')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client-vatCode">{t['clients.form.fieldVatCode']}</Label>
            <Input id="client-vatCode" placeholder={t['clients.form.placeholderVatCode']} {...register('vatCode')} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client-email">{t['clients.form.fieldEmail']}</Label>
            <Input
              id="client-email"
              placeholder={t['clients.form.placeholderEmail']}
              {...register('email')}
              className={errors.email ? 'border-red-500 focus:ring-red-200' : ''}
            />
            {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client-phone">{t['clients.form.fieldPhone']}</Label>
            <Input id="client-phone" placeholder={t['clients.form.placeholderPhone']} {...register('phone')} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="client-contactPerson">{t['clients.form.fieldContactPerson']}</Label>
          <Input
            id="client-contactPerson"
            placeholder={t['clients.form.placeholderContactPerson']}
            {...register('contactPerson')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="client-notes">{t['clients.form.fieldNotes']}</Label>
          <Textarea
            id="client-notes"
            placeholder={t['clients.form.placeholderNotes']}
            {...register('notes')}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} className="cursor-pointer">
            {t['clients.form.actionCancel']}
          </Button>
          <Button type="submit" disabled={isSaving} className="cursor-pointer shadow-sm">
            {editingClient ? t['clients.form.actionSave'] : t['clients.form.actionCreate']}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
