import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';

import {
  useBootstrap,
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useGoogleAuth,
} from '@/hooks';
import { env } from '@/env';
import { useStorageOrNull } from '@/lib/storage';
import { Client, ClientId } from '@/lib/domain';
import { CompanyProfileSwitcher, SyncStatusBadge } from '@/components/shared';
import { Card, CardBody } from '@/components/ui';
import {
  ClientDeleteDialog,
  ClientFormDialog,
  ClientTable,
  type ClientFormValues,
} from '@/components/clients';

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

  if (!storage || !isReady) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Klientų Valdymas</h1>
            <p className="text-sm text-slate-500">Sąskaitos sistema</p>
          </div>
        </header>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">
              Laukiame sistemos pasirengimo, kad galėtume krauti klientus...
            </p>
          </CardBody>
        </Card>
      </main>
    );
  }

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
          <CompanyProfileSwitcher />
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

      <ClientsContent />
    </main>
  );
}

function ClientsContent() {
  const { clients, isLoading } = useClients();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const handleCreateOpen = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const handleEditOpen = (client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleSave = (values: ClientFormValues) => {
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
      updateMutation.mutate(updated);
      setIsFormOpen(false);
      return;
    }

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
    createMutation.mutate(created);
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (clientToDelete) {
      deleteMutation.mutate(clientToDelete);
      setClientToDelete(null);
    }
  };

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
    <>
      <ClientTable
        clients={clients}
        onEdit={handleEditOpen}
        onDelete={setClientToDelete}
        onCreateOpen={handleCreateOpen}
      />

      <ClientFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingClient={editingClient}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      <ClientDeleteDialog
        client={clientToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setClientToDelete(null)}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
}
