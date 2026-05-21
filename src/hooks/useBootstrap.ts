import { useQuery } from '@tanstack/react-query';
import { ensureAppStructure, useStorageOrNull } from '@/lib/storage';

export function useBootstrap(): { isReady: boolean; isPending: boolean; error: unknown } {
  const storage = useStorageOrNull();
  const query = useQuery({
    queryKey: ['bootstrap', storage],
    enabled: storage !== null,
    staleTime: Infinity,
    queryFn: async () => {
      if (!storage) return 'idle' as const;
      await ensureAppStructure(storage);
      return 'ready' as const;
    },
  });
  return {
    isReady: query.data === 'ready',
    isPending: query.isLoading || query.isFetching,
    error: query.error,
  };
}
