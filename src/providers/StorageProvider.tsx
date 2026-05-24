import { useMemo, type ReactNode } from 'react';
import {
  AuthInterceptor,
  BackoffRetry,
  FetchFunctionFetcher,
  GoogleDriveClient,
  TokenRefreshRetry,
  type TokenSource,
} from '@/lib/drive';
import { DriveStorage, InMemoryStorage } from '@/lib/storage';
import { StorageContext, type StorageContextValue } from './storageContext';

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
      new TokenRefreshRetry(
        new AuthInterceptor(new FetchFunctionFetcher(fetch.bind(window)), tokenSource),
        tokenSource,
      ),
    );
    const driveClient = new GoogleDriveClient(fetcher);
    return { storage: new DriveStorage(driveClient), isReady: true };
  }, [useInMemory, hasToken, tokenSource]);

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}
