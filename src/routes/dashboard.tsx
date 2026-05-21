import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useBootstrap, useGoogleAuth } from '@/hooks';
import { env } from '@/env';

export function DashboardPage() {
  const { user, isAuthenticated, logout } = useGoogleAuth();
  const navigate = useNavigate();
  const { isReady, isPending, error } = useBootstrap();

  useEffect(() => {
    if (!env.useInMemory && !isAuthenticated) {
      void navigate({ to: '/login' });
    }
  }, [isAuthenticated, navigate]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Sąskaitos — Dashboard</h1>
          <p className="text-sm text-slate-500">
            {env.useInMemory ? 'In-memory dev rėžimas' : user?.email ?? 'Sąskaitos sistema'}
          </p>
        </div>
        {!env.useInMemory ? (
          <button
            type="button"
            onClick={logout}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
          >
            Atsijungti
          </button>
        ) : null}
      </header>
      <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Drive bootstrap
        </h2>
        <p className="mt-1 text-base text-slate-900">
          {error
            ? `Klaida: ${stringify(error)}`
            : isReady
              ? 'Saskaitos_App parengtas.'
              : isPending
                ? 'Tikrinama struktūra…'
                : 'Laukiame prisijungimo.'}
        </p>
      </section>
      <p className="mt-6 text-xs text-slate-400">
        Etapas 1 baigtas. Kiti etapai pridės nustatymus, klientus ir sąskaitas.
      </p>
    </main>
  );
}

function stringify(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
