import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/query-keys';
import { APP_ROOT, CLIENTS_FILE, StoragePath, type Storage } from '@/lib/storage';
import { useStorage } from './useStorage';
import type { Client } from '@/lib/domain';
import { ClientsFileSchema, clientToDto, clientFromDto } from '@/lib/drive/schemas';
import { getClientFolder, getClientFolderPath, getClientIndexPath } from '@/lib/storage/clientPaths';
import { syncQueue } from '@/stores';

const CLIENTS_PATH = StoragePath.of(APP_ROOT, CLIENTS_FILE);

async function readClients(storage: Storage): Promise<Client[]> {
  const raw = await storage.read(CLIENTS_PATH, ClientsFileSchema);
  if (!raw) return [];
  return raw.clients.map(clientFromDto);
}

async function writeClients(storage: Storage, clients: Client[]): Promise<void> {
  await storage.write(CLIENTS_PATH, { clients: clients.map(clientToDto) });
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
      await syncQueue.enqueue(async () => {
        const latestClients = await readClients(storage);
        await writeClients(storage, [...latestClients, newClient]);
      });

      const clientFolder = getClientFolder(newClient);

      await syncQueue.enqueue(async () => {
        await storage.write(StoragePath.of(clientFolder, 'profile.json'), clientToDto(newClient));
        await storage.write(getClientIndexPath(newClient), []);
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
      await syncQueue.enqueue(async () => {
        const latestClients = await readClients(storage);
        const updatedList = latestClients.map((c) =>
          c.id.equals(updatedClient.id) ? updatedClient : c,
        );
        await writeClients(storage, updatedList);
      });

      const clientFolder = getClientFolder(updatedClient);

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
      await syncQueue.enqueue(async () => {
        const latestClients = await readClients(storage);
        const updatedList = latestClients.filter((c) => !c.id.equals(clientToDelete.id));
        await writeClients(storage, updatedList);
      });

      const folderPath = getClientFolderPath(clientToDelete);

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
