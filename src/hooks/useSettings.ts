import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/query-keys';
import { APP_ROOT, SETTINGS_FILE, StoragePath, type Storage } from '@/lib/storage';
import { useStorage } from './useStorage';
import { SettingsDtoSchema, defaultSettings, type SettingsDto } from '@/lib/drive/settings';
import { syncQueue } from '@/stores';

const SETTINGS_PATH = StoragePath.of(APP_ROOT, SETTINGS_FILE);

export interface UseSettingsResult {
  settings: SettingsDto | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: unknown;
  update: (updater: (current: SettingsDto) => SettingsDto) => void;
}

async function readSettings(storage: Storage): Promise<SettingsDto> {
  const raw = await storage.read(SETTINGS_PATH, SettingsDtoSchema);
  return raw ?? defaultSettings();
}

export function useSettings(): UseSettingsResult {
  const storage = useStorage();
  const qc = useQueryClient();

  // eslint-disable-next-line @tanstack/query/exhaustive-deps -- storage is provided via a stable context
  const query = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => readSettings(storage),
    staleTime: 30_000,
  });

  const mutation = useMutation<void, Error, SettingsDto, { prev: SettingsDto | undefined }>({
    mutationFn: (next) => syncQueue.enqueue(() => storage.write(SETTINGS_PATH, next)),
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: queryKeys.settings });
      const prev = qc.getQueryData<SettingsDto>(queryKeys.settings);
      qc.setQueryData(queryKeys.settings, next);
      return { prev };
    },
    onError: (_err, _next, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(queryKeys.settings, ctx.prev);
    },
  });

  return {
    settings: query.data ?? null,
    isLoading: query.isLoading,
    isUpdating: mutation.isPending,
    error: query.error ?? mutation.error,
    update: (updater) => {
      const current = qc.getQueryData<SettingsDto>(queryKeys.settings) ?? defaultSettings();
      mutation.mutate(updater(current));
    },
  };
}
