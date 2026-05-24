import { useContext } from 'react';
import { StorageContext } from '@/providers/storageContext';
import type { Storage } from '@/lib/storage';

export function useStorage(): Storage {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorage must be used within StorageProvider');
  if (!ctx.storage) throw new Error('Storage not ready — user is not authenticated');
  return ctx.storage;
}

export function useStorageOrNull(): Storage | null {
  const ctx = useContext(StorageContext);
  return ctx?.storage ?? null;
}
