import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import {
  useBootstrap,
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useGoogleAuth,
  useStorageOrNull,
} from '@/hooks';
import { env } from '@/env';
import { Client, ClientId } from '@/lib/domain';
import { AppFooter, AppHeader } from '@/components/shared';
import { Card, CardBody } from '@/components/ui';
import {
  ClientDeleteDialog,
  ClientFormDialog,
  ClientTable,
  type ClientFormValues,
} from '@/components/clients';

export function ClientsPage() {
  const { isAuthenticated } = useGoogleAuth();
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
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
        <AppHeader title="Klientų Valdymas" current="clients" />
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">
              Laukiame sistemos pasirengimo, kad galėtume krauti klientus...
            </p>
          </CardBody>
        </Card>
        <AppFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
      <AppHeader title="Klientų Valdymas" current="clients" />
      <ClientsContent />
      <AppFooter />
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
