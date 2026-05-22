import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGoogleAuth } from '@/hooks';
import { env } from '@/env';

export function LoginPage() {
  const { login, isAuthenticated, isLoading, error } = useGoogleAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated || env.useInMemory) {
      void navigate({ to: '/dashboard' });
    }
  }, [isAuthenticated, navigate]);

  const isInvalidClientId =
    !env.useInMemory &&
    (!env.googleClientId || !env.googleClientId.endsWith('.apps.googleusercontent.com'));

  return (
    <main className="flex h-full min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md ring-1 ring-slate-200">
        <h1 className="text-2xl font-semibold text-slate-900">Sąskaitos</h1>
        <p className="mt-2 text-sm text-slate-500">
          Pradėkite — prisijunkite su Google paskyra. Duomenys saugomi jūsų Google Drive.
        </p>

        {isInvalidClientId && (
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-200">
            <span className="font-semibold text-amber-900">Konfigūracijos įspėjimas:</span>
            <p className="mt-1">
              Atrodo, kad <code className="bg-amber-100 px-1 py-0.5 rounded">VITE_GOOGLE_CLIENT_ID</code> faile <code className="bg-amber-100 px-1 py-0.5 rounded">.env</code> yra neteisingas. Google Client ID turi baigtis <code className="bg-amber-100 px-1 py-0.5 rounded">.apps.googleusercontent.com</code>, bet dabartinė reikšmė prasideda client secret formatu (<code className="bg-amber-100 px-1 py-0.5 rounded">GOCSPX-...</code>).
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={login}
          disabled={isLoading || isInvalidClientId}
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {isLoading ? 'Jungiamasi…' : 'Prisijungti su Google'}
        </button>
        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
