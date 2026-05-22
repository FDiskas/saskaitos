import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Edit2,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';

import { useBootstrap, useClients, useGoogleAuth } from '@/hooks';
import { env } from '@/env';
import { useStorageOrNull } from '@/lib/storage';
import { Client, ClientId } from '@/lib/domain';
import { SyncStatusBadge } from '@/components/shared';
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  CardBody,
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

// Form validation schema
const clientFormSchema = z.object({
  name: z.string().min(1, 'Pavadinimas yra privalomas'),
  code: z.string().optional(),
  vatCode: z.string().optional(),
  address: z.string().min(1, 'Adresas yra privalomas'),
  email: z.union([z.string().email('Neteisingas el. pašto formatas'), z.string().length(0)]).optional(),
  phone: z.string().optional(),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export function ClientsPage() {
  const { isAuthenticated, user, logout } = useGoogleAuth();
  const navigate = useNavigate();
  const storage = useStorageOrNull();
  const { isReady } = useBootstrap();

  useEffect(() => {
    if (!env.useInMemory && !isAuthenticated) {
      void navigate({ to: '/login' });
    }
  }, [isAuthenticated, navigate]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Klientų Valdymas</h1>
          <p className="text-sm text-slate-500">
            {env.useInMemory ? 'In-memory dev rėžimas' : user?.email ?? 'Sąskaitos sistema'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SyncStatusBadge />
          <Link
            to="/dashboard"
            className="rounded-md bg-white px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Į pultą
          </Link>
          <Link
            to="/settings"
            className="rounded-md bg-white px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Nustatymai
          </Link>
          {!env.useInMemory ? (
            <button
              type="button"
              onClick={logout}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800 cursor-pointer"
            >
              Atsijungti
            </button>
          ) : null}
        </div>
      </header>

      {storage && isReady ? (
        <ClientsContent />
      ) : (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">
              Laukiame sistemos pasirengimo, kad galėtume krauti klientus...
            </p>
          </CardBody>
        </Card>
      )}
    </main>
  );
}

function ClientsContent() {
  const {
    clients,
    isLoading,
    createClient,
    updateClient,
    deleteClient,
    isCreating,
    isUpdating,
    isDeleting,
  } = useClients();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  
  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

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

  // Open form dialog for creating
  const handleCreateOpen = () => {
    setEditingClient(null);
    reset({
      name: '',
      code: '',
      vatCode: '',
      address: '',
      email: '',
      phone: '',
      contactPerson: '',
      notes: '',
    });
    setIsFormOpen(true);
  };

  // Open form dialog for editing
  const handleEditOpen = (client: Client) => {
    setEditingClient(client);
    reset({
      name: client.name,
      code: client.code || '',
      vatCode: client.vatCode || '',
      address: client.address,
      email: client.email || '',
      phone: client.phone || '',
      contactPerson: client.contactPerson || '',
      notes: client.notes || '',
    });
    setIsFormOpen(true);
  };

  // Save client (create or update)
  const onSubmit = (values: ClientFormValues) => {
    if (editingClient) {
      const updated = editingClient.withPatch({
        name: values.name,
        code: values.code || undefined,
        vatCode: values.vatCode || undefined,
        address: values.address,
        email: values.email || undefined,
        phone: values.phone || undefined,
        contactPerson: values.contactPerson || undefined,
        notes: values.notes || undefined,
      });
      updateClient(updated);
    } else {
      const created = Client.of({
        id: ClientId.create(),
        name: values.name,
        code: values.code || undefined,
        vatCode: values.vatCode || undefined,
        address: values.address,
        email: values.email || undefined,
        phone: values.phone || undefined,
        contactPerson: values.contactPerson || undefined,
        notes: values.notes || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      createClient(created);
    }
    setIsFormOpen(false);
  };

  // Confirm delete
  const handleDeleteConfirm = () => {
    if (clientToDelete) {
      deleteClient(clientToDelete);
      setClientToDelete(null);
    }
  };

  // Table columns definition
  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Klientas',
        cell: (info) => (
          <div>
            <div className="font-semibold text-slate-900">{info.getValue() as string}</div>
            {info.row.original.contactPerson && (
              <div className="text-xs text-slate-500">Kontaktas: {info.row.original.contactPerson}</div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'code',
        header: 'Kodai',
        cell: (info) => {
          const code = info.getValue() as string | undefined;
          const vatCode = info.row.original.vatCode;
          return (
            <div className="text-xs text-slate-600 space-y-0.5">
              {code && <div>Įm: {code}</div>}
              {vatCode && <div>PVM: {vatCode}</div>}
              {!code && !vatCode && <span className="text-slate-400">—</span>}
            </div>
          );
        },
      },
      {
        accessorKey: 'address',
        header: 'Adresas',
        cell: (info) => (
          <div className="max-w-[200px] truncate text-slate-600" title={info.getValue() as string}>
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Kontaktai',
        cell: (info) => {
          const email = info.getValue() as string | undefined;
          const phone = info.row.original.phone;
          return (
            <div className="text-xs text-slate-600 space-y-0.5">
              {email && <div className="truncate max-w-[180px]">{email}</div>}
              {phone && <div>{phone}</div>}
              {!email && !phone && <span className="text-slate-400">—</span>}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Veiksmai</div>,
        cell: (info) => {
          const client = info.row.original;
          return (
            <div className="flex justify-end gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0 cursor-pointer"
                onClick={() => handleEditOpen(client)}
                title="Redaguoti"
              >
                <Edit2 className="h-3.5 w-3.5 text-slate-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-red-50 text-red-600 hover:text-red-700 cursor-pointer"
                onClick={() => setClientToDelete(client)}
                title="Ištrinti"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: clients,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId);
      if (!value) return false;
      return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardBody className="py-12 flex flex-col items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
          <p className="mt-4 text-sm text-slate-500 font-medium">Kraunamas klientų sąrašas...</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and CTA Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Ieškoti klientų pagal pavadinimą, kodą..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <Button onClick={handleCreateOpen} className="gap-2 cursor-pointer shadow-sm">
          <Plus className="h-4 w-4" /> Naujas klientas
        </Button>
      </div>

      {/* Main Content Area */}
      {clients.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardBody className="py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Users className="h-6 w-6 text-slate-600" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">Klientų dar nėra</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
              Šiuo metu nesukurtas nei vienas klientas. Pridėkite naują klientą, kad galėtumėte išrašyti sąskaitas.
            </p>
            <div className="mt-6">
              <Button onClick={handleCreateOpen} className="gap-2 cursor-pointer shadow-sm">
                <UserPlus className="h-4 w-4" /> Sukurti pirmąjį klientą
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider"
                      >
                        {header.isPlaceholder ? null : (
                          <div className="flex items-center">
                            {header.column.getCanSort() ? (
                              <button
                                type="button"
                                onClick={header.column.getToggleSortingHandler()}
                                className="flex items-center gap-1 cursor-pointer hover:text-slate-900 select-none focus:outline-none"
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {{
                                  asc: <ArrowUp className="h-3.5 w-3.5 text-slate-800" />,
                                  desc: <ArrowDown className="h-3.5 w-3.5 text-slate-800" />,
                                }[header.column.getIsSorted() as string] ?? (
                                  <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400 opacity-60" />
                                )}
                              </button>
                            ) : (
                              flexRender(header.column.columnDef.header, header.getContext())
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Form Dialog for Create/Edit */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogHeader>
          <DialogTitle>{editingClient ? 'Redaguoti Klientą' : 'Pridėti Klientą'}</DialogTitle>
          <DialogDescription>
            {editingClient
              ? 'Atnaujinkite kliento profilio informaciją žemiau.'
              : 'Įveskite naujo kliento informaciją profiliui sukurti.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogCloseButton onClick={() => setIsFormOpen(false)} />

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
            <Button variant="secondary" onClick={() => setIsFormOpen(false)} className="cursor-pointer">
              Atšaukti
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating} className="cursor-pointer shadow-sm">
              {editingClient ? 'Išsaugoti' : 'Sukurti'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={clientToDelete !== null} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogHeader>
          <AlertDialogTitle>Ar tikrai norite ištrinti klientą?</AlertDialogTitle>
          <AlertDialogDescription>
            Šis veiksmas pašalins klientą <strong className="text-slate-900">{clientToDelete?.name}</strong> iš pagrindinio sąrašo.
            Kliento aplankas Drive saugykloje bus perkeltas į šiukšlinę (pažymėtas kaip trashed), jo duomenys nebus visiškai ištrinti.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="secondary" onClick={() => setClientToDelete(null)} className="cursor-pointer">
            Atšaukti
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            className="cursor-pointer shadow-sm"
          >
            Ištrinti
          </Button>
        </AlertDialogFooter>
      </AlertDialog>
    </div>
  );
}
