import { useState, type ReactNode } from 'react';
import { Navigate, useLocation } from '@tanstack/react-router';
import { useGoogleAuth } from '@/hooks';
import { env } from '@/env';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isRestoring } = useGoogleAuth();
  const location = useLocation();
  const [originalHref] = useState(() => location.href);

  if (env.useInMemory) return <>{children}</>;
  if (isRestoring) return null;
  if (isAuthenticated) return <>{children}</>;
  if (location.pathname.startsWith('/login')) return null;
  const search = originalHref.startsWith('/login') ? {} : { from: originalHref };
  return <Navigate to="/login" search={search} replace />;
}
