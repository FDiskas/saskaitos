import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/query-keys';
import { APP_ROOT, CLIENTS_FILE, StoragePath, type Storage } from '@/lib/storage';
import { useStorage } from './useStorage';
import type { Client } from '@/lib/domain';
import { ClientsFileSchema, clientToDto, clientFromDto } from '@/lib/drive/schemas';
import { syncQueue } from '@/stores';

const CLIENTS_PATH = StoragePath.of(APP_ROOT, CLIENTS_FILE);

async function readClients(storage: Storage): Promise<Client[]> {
  const raw = await storage.read(CLIENTS_PATH, ClientsFileSchema);
  if (!raw) return [];
  return raw.clients.map(clientFromDto);
}

export function useClients() {
  const storage = useStorage();

  // eslint-disable-next-line @tanstack/query/exhaustive-deps -- storage is provided via a stable context
  const query = useQuery({
    queryKey: queryKeys.clients,
    queryFn: () => readClients(storage),
    staleTime: 30_000,
  });

  return {
    clients: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useCreateClient() {
  const storage = useStorage();
  const qc = useQueryClient();

  return useMutation<void, Error, Client, { prev: Client[] | undefined }>({
    mutationFn: async (newClient) => {
      // 1. Write the new clients list to clients.json
      await syncQueue.enqueue(async () => {
        const latest = await storage.read(CLIENTS_PATH, ClientsFileSchema);
        const latestClients = latest ? latest.clients.map(clientFromDto) : [];
        const updatedClients = [...latestClients, newClient];
        
        await storage.write(CLIENTS_PATH, {
          clients: updatedClients.map(clientToDto),
        });
      });

      // 2. Create the client directory structure by writing profile.json and invoices_index.json
      const folderName = `Client_${newClient.slug()}_${newClient.id.toString().slice(0, 6)}`;
      const clientFolder = `Saskaitos_App/Clients/${folderName}`;
      
      await syncQueue.enqueue(async () => {
        await storage.write(StoragePath.of(clientFolder, 'profile.json'), clientToDto(newClient));
        await storage.write(StoragePath.of(clientFolder, 'invoices_index.json'), []);
      });
    },
    onMutate: async (newClient) => {
      await qc.cancelQueries({ queryKey: queryKeys.clients });
      const prev = qc.getQueryData<Client[]>(queryKeys.clients);
      qc.setQueryData<Client[]>(queryKeys.clients, (current) => [...(current || []), newClient]);
      return { prev };
    },
    onError: (_err, _newClient, ctx) => {
      if (ctx?.prev !== undefined) {
        qc.setQueryData(queryKeys.clients, ctx.prev);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.clients });
    },
  });
}

export function useUpdateClient() {
  const storage = useStorage();
  const qc = useQueryClient();

  return useMutation<void, Error, Client, { prev: Client[] | undefined }>({
    mutationFn: async (updatedClient) => {
      // 1. Update the client in clients.json
      await syncQueue.enqueue(async () => {
        const latest = await storage.read(CLIENTS_PATH, ClientsFileSchema);
        const latestClients = latest ? latest.clients.map(clientFromDto) : [];
        const updatedList = latestClients.map((c) =>
          c.id.equals(updatedClient.id) ? updatedClient : c,
        );
        
        await storage.write(CLIENTS_PATH, {
          clients: updatedList.map(clientToDto),
        });
      });

      // 2. Write the updated profile.json to client folder
      const folderName = `Client_${updatedClient.slug()}_${updatedClient.id.toString().slice(0, 6)}`;
      const clientFolder = `Saskaitos_App/Clients/${folderName}`;
      
      await syncQueue.enqueue(async () => {
        await storage.write(StoragePath.of(clientFolder, 'profile.json'), clientToDto(updatedClient));
      });
    },
    onMutate: async (updatedClient) => {
      await qc.cancelQueries({ queryKey: queryKeys.clients });
      const prev = qc.getQueryData<Client[]>(queryKeys.clients);
      qc.setQueryData<Client[]>(queryKeys.clients, (current) =>
        (current || []).map((c) => (c.id.equals(updatedClient.id) ? updatedClient : c)),
      );
      return { prev };
    },
    onError: (_err, _updatedClient, ctx) => {
      if (ctx?.prev !== undefined) {
        qc.setQueryData(queryKeys.clients, ctx.prev);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.clients });
    },
  });
}

export function useDeleteClient() {
  const storage = useStorage();
  const qc = useQueryClient();

  return useMutation<void, Error, Client, { prev: Client[] | undefined }>({
    mutationFn: async (clientToDelete) => {
      // 1. Remove the client from clients.json
      await syncQueue.enqueue(async () => {
        const latest = await storage.read(CLIENTS_PATH, ClientsFileSchema);
        const latestClients = latest ? latest.clients.map(clientFromDto) : [];
        const updatedList = latestClients.filter((c) => !c.id.equals(clientToDelete.id));
        
        await storage.write(CLIENTS_PATH, {
          clients: updatedList.map(clientToDto),
        });
      });

      // 2. Trash the client folder
      const folderName = `Client_${clientToDelete.slug()}_${clientToDelete.id.toString().slice(0, 6)}`;
      const folderPath = StoragePath.of('Saskaitos_App/Clients', folderName);
      
      await syncQueue.enqueue(async () => {
        await storage.delete(folderPath);
      });
    },
    onMutate: async (clientToDelete) => {
      await qc.cancelQueries({ queryKey: queryKeys.clients });
      const prev = qc.getQueryData<Client[]>(queryKeys.clients);
      qc.setQueryData<Client[]>(queryKeys.clients, (current) =>
        (current || []).filter((c) => !c.id.equals(clientToDelete.id)),
      );
      return { prev };
    },
    onError: (_err, _clientToDelete, ctx) => {
      if (ctx?.prev !== undefined) {
        qc.setQueryData(queryKeys.clients, ctx.prev);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.clients });
    },
  });
}
