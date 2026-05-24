import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { useGoogleAuth } from '@/hooks';
import { GoogleAuthProvider, StorageProvider } from '@/providers';
import { env } from '@/env';
import { router } from '@/router';
import type { TokenSource } from '@/lib/drive';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

const noopTokenSource: TokenSource = {
  getAccessToken: () => null,
  refreshAccessToken: async () => null,
};

export function App() {
  if (env.useInMemory) {
    return (
      <QueryClientProvider client={queryClient}>
        <StorageProvider useInMemory hasToken={false} tokenSource={noopTokenSource}>
          <RouterProvider router={router} />
        </StorageProvider>
      </QueryClientProvider>
    );
  }
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleAuthProvider clientId={env.googleClientId}>
        <StorageWiring>
          <RouterProvider router={router} />
        </StorageWiring>
      </GoogleAuthProvider>
    </QueryClientProvider>
  );
}

function StorageWiring({ children }: { children: ReactNode }) {
  const { accessToken, tokenSource } = useGoogleAuth();
  return (
    <StorageProvider useInMemory={false} hasToken={accessToken !== null} tokenSource={tokenSource}>
      {children}
    </StorageProvider>
  );
}
