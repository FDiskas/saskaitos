import { useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { Menu, X } from 'lucide-react';
import { useGoogleAuth, useTranslate } from '@/hooks';
import type { translate } from '@/lib/translate';
import { env } from '@/env';
import { CompanyProfileSwitcher } from './CompanyProfileSwitcher';
import { SyncStatusBadge } from './SyncStatusBadge';

export type AppHeaderPage = 'dashboard' | 'clients' | 'settings';

interface NavLinkDef {
  to: '/dashboard' | '/clients' | '/settings';
  labelKey: keyof typeof translate;
}

const NAV_LINKS: Record<AppHeaderPage, NavLinkDef> = {
  dashboard: { to: '/dashboard', labelKey: 'app.nav.dashboard' },
  clients: { to: '/clients', labelKey: 'app.nav.clients' },
  settings: { to: '/settings', labelKey: 'app.nav.settings' },
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
  const t = useTranslate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const subtitle = env.useInMemory
    ? t['app.subtitle.devMode']
    : user?.email ?? t['app.subtitle.fallback'];

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
                {t[NAV_LINKS[page].labelKey] as string}
              </Link>
            ))}
            {!env.useInMemory ? (
              <button type="button" onClick={logout} className={LOGOUT_CLASS}>
                {t['app.nav.logout']}
              </button>
            ) : null}
          </nav>

          <button
            type="button"
            aria-label={isMenuOpen ? t['app.nav.closeMenu'] : t['app.nav.openMenu']}
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
              {t[NAV_LINKS[page].labelKey] as string}
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
              {t['app.nav.logout']}
            </button>
          ) : null}
        </nav>
      ) : null}
    </header>
  );
}
