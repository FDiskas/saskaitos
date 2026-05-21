import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGoogleAuth } from '@/hooks';

export function LoginPage() {
  const { login, isAuthenticated, isLoading, error } = useGoogleAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      void navigate({ to: '/dashboard' });
    }
  }, [isAuthenticated, navigate]);

  return (
    <main className="flex h-full min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md ring-1 ring-slate-200">
        <h1 className="text-2xl font-semibold text-slate-900">Sąskaitos</h1>
        <p className="mt-2 text-sm text-slate-500">
          Pradėkite — prisijunkite su Google paskyra. Duomenys saugomi jūsų Google Drive.
        </p>
        <button
          type="button"
          onClick={login}
          disabled={isLoading}
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
