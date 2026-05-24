import { createContext } from 'react';
import type { Storage } from '@/lib/storage';

export interface StorageContextValue {
  storage: Storage | null;
  isReady: boolean;
}

export const StorageContext = createContext<StorageContextValue | null>(null);
