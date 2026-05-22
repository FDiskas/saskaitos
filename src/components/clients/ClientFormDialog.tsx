/* eslint-disable react-refresh/only-export-components */
import { useEffect } from 'react';
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

export const clientFormSchema = z.object({
  name: z.string().min(1, 'Pavadinimas yra privalomas'),
  code: z.string().optional(),
  vatCode: z.string().optional(),
  address: z.string().min(1, 'Adresas yra privalomas'),
  email: z.union([z.string().email('Neteisingas el. pašto formatas'), z.string().length(0)]).optional(),
  phone: z.string().optional(),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

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
  const {
    register,
    handleSubmit,
    reset,
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
        <DialogTitle>{editingClient ? 'Redaguoti Klientą' : 'Pridėti Klientą'}</DialogTitle>
        <DialogDescription>
          {editingClient
            ? 'Atnaujinkite kliento profilio informaciją žemiau.'
            : 'Įveskite naujo kliento informaciją profiliui sukurti.'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <DialogCloseButton onClick={() => onOpenChange(false)} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client-name">Pavadinimas *</Label>
            <Input
              id="client-name"
              placeholder="UAB Pavyzdys"
              {...register('name')}
              className={errors.name ? 'border-red-500 focus:ring-red-200' : ''}
            />
            {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client-address">Adresas *</Label>
            <Input
              id="client-address"
              placeholder="Gedimino pr. 1, Vilnius"
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
            <Label htmlFor="client-code">Įmonės kodas</Label>
            <Input id="client-code" placeholder="301234567" {...register('code')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client-vatCode">PVM kodas</Label>
            <Input id="client-vatCode" placeholder="LT100012345617" {...register('vatCode')} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client-email">El. paštas</Label>
            <Input
              id="client-email"
              placeholder="info@pavyzdys.lt"
              {...register('email')}
              className={errors.email ? 'border-red-500 focus:ring-red-200' : ''}
            />
            {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client-phone">Telefonas</Label>
            <Input id="client-phone" placeholder="+37060000000" {...register('phone')} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="client-contactPerson">Kontaktinis asmuo</Label>
          <Input id="client-contactPerson" placeholder="Vardenis Pavardenis" {...register('contactPerson')} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="client-notes">Pastabos</Label>
          <Textarea id="client-notes" placeholder="Papildoma informacija..." {...register('notes')} />
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} className="cursor-pointer">
            Atšaukti
          </Button>
          <Button type="submit" disabled={isSaving} className="cursor-pointer shadow-sm">
            {editingClient ? 'Išsaugoti' : 'Sukurti'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
