import { useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { Menu, X } from 'lucide-react';
import { useGoogleAuth } from '@/hooks';
import { env } from '@/env';
import { CompanyProfileSwitcher } from './CompanyProfileSwitcher';
import { SyncStatusBadge } from './SyncStatusBadge';

export type AppHeaderPage = 'dashboard' | 'clients' | 'settings';

interface NavLinkDef {
  to: '/dashboard' | '/clients' | '/settings';
  label: string;
}

const NAV_LINKS: Record<AppHeaderPage, NavLinkDef> = {
  dashboard: { to: '/dashboard', label: 'Į pultą' },
  clients: { to: '/clients', label: 'Klientai' },
  settings: { to: '/settings', label: 'Nustatymai' },
};

const LINK_CLASS =
  'inline-flex items-center justify-center rounded-md bg-white px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50';

const LOGOUT_CLASS =
  'inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800';

export interface AppHeaderProps {
  title: string;
  current: AppHeaderPage;
  actions?: ReactNode;
}

export function AppHeader({ title, current, actions }: AppHeaderProps) {
  const { user, logout } = useGoogleAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const subtitle = env.useInMemory
    ? 'In-memory dev rėžimas'
    : user?.email ?? 'Sąskaitos sistema';

  const otherPages = (Object.keys(NAV_LINKS) as AppHeaderPage[]).filter(
    (page) => page !== current,
  );

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold text-slate-900">{title}</h1>
          <p className="truncate text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <CompanyProfileSwitcher />
          <SyncStatusBadge />
          {actions}

          <nav className="hidden items-center gap-2 md:flex">
            {otherPages.map((page) => (
              <Link key={page} to={NAV_LINKS[page].to} className={LINK_CLASS}>
                {NAV_LINKS[page].label}
              </Link>
            ))}
            {!env.useInMemory ? (
              <button type="button" onClick={logout} className={LOGOUT_CLASS}>
                Atsijungti
              </button>
            ) : null}
          </nav>

          <button
            type="button"
            aria-label={isMenuOpen ? 'Uždaryti meniu' : 'Atidaryti meniu'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 md:hidden"
          >
            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <nav className="mt-3 flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-3 shadow-sm md:hidden">
          {otherPages.map((page) => (
            <Link
              key={page}
              to={NAV_LINKS[page].to}
              className={LINK_CLASS}
              onClick={closeMenu}
            >
              {NAV_LINKS[page].label}
            </Link>
          ))}
          {!env.useInMemory ? (
            <button
              type="button"
              onClick={() => {
                logout();
                closeMenu();
              }}
              className={LOGOUT_CLASS}
            >
              Atsijungti
            </button>
          ) : null}
        </nav>
      ) : null}
    </header>
  );
}
