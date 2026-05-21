import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  AuthInterceptor,
  BackoffRetry,
  FetchFunctionFetcher,
  GoogleDriveClient,
  TokenRefreshRetry,
  type TokenSource,
} from '@/lib/drive';
import { DriveStorage } from './DriveStorage';
import { InMemoryStorage } from './InMemoryStorage';
import type { Storage } from './Storage';

interface StorageContextValue {
  storage: Storage | null;
  isReady: boolean;
}

const StorageContext = createContext<StorageContextValue | null>(null);

const sharedInMemoryStorage = new InMemoryStorage();

export interface StorageProviderProps {
  children: ReactNode;
  useInMemory: boolean;
  tokenSource: TokenSource;
  hasToken: boolean;
}

export function StorageProvider({
  children,
  useInMemory,
  tokenSource,
  hasToken,
}: StorageProviderProps) {
  const value = useMemo<StorageContextValue>(() => {
    if (useInMemory) {
      return { storage: sharedInMemoryStorage, isReady: true };
    }
    if (!hasToken) {
      return { storage: null, isReady: false };
    }
    const fetcher = new BackoffRetry(
      new TokenRefreshRetry(new AuthInterceptor(new FetchFunctionFetcher(fetch.bind(window)), tokenSource), tokenSource),
    );
    const driveClient = new GoogleDriveClient(fetcher);
    return { storage: new DriveStorage(driveClient), isReady: true };
  }, [useInMemory, hasToken, tokenSource]);

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}

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
