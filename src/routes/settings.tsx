import { useCallback, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useGoogleAuth, useSettings } from '@/hooks';
import { useStorageOrNull } from '@/lib/storage';
import { env } from '@/env';
import { Card, CardBody, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { SyncStatusBadge } from '@/components/shared';
import { CompanyTab, DesignTab, EmailTab, SeriesTab } from '@/components/settings';
import type { CompanyDto } from '@/lib/drive/settings';
import type { SeriesDto } from '@/lib/drive/schemas';
import type { DesignPresetDto } from '@/lib/drive/settings';

export function SettingsPage() {
  const { isAuthenticated, user, logout } = useGoogleAuth();
  const navigate = useNavigate();
  const storage = useStorageOrNull();

  useEffect(() => {
    if (!env.useInMemory && !isAuthenticated) {
      void navigate({ to: '/login' });
    }
  }, [isAuthenticated, navigate]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Nustatymai</h1>
          <p className="text-sm text-slate-500">
            {env.useInMemory ? 'In-memory dev rėžimas' : user?.email ?? 'Sąskaitos sistema'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SyncStatusBadge />
          <Link
            to="/dashboard"
            className="rounded-md bg-white px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Į pultą
          </Link>
          {!env.useInMemory ? (
            <button
              type="button"
              onClick={logout}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
            >
              Atsijungti
            </button>
          ) : null}
        </div>
      </header>

      {storage ? (
        <SettingsContent />
      ) : (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Laukiame prisijungimo, kad galėtume krauti nustatymus.</p>
          </CardBody>
        </Card>
      )}
    </main>
  );
}

function SettingsContent() {
  const { settings, isLoading, error, update } = useSettings();

  const setCompany = useCallback(
    (company: CompanyDto) => update((s) => ({ ...s, company })),
    [update],
  );
  const setSeries = useCallback(
    (series: SeriesDto[]) => update((s) => ({ ...s, series })),
    [update],
  );
  const setPresets = useCallback(
    (designPresets: DesignPresetDto[]) => update((s) => ({ ...s, designPresets })),
    [update],
  );
  const setEmailDefaults = useCallback(
    (next: { resendApiKey?: string; defaultSubject?: string; defaultBody?: string }) =>
      update((s) => ({
        ...s,
        resendApiKey: next.resendApiKey,
        defaultEmailSubject: next.defaultSubject,
        defaultEmailBody: next.defaultBody,
      })),
    [update],
  );

  if (error) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-red-600">Klaida kraunant nustatymus: {String(error)}</p>
        </CardBody>
      </Card>
    );
  }

  if (isLoading || !settings) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-slate-500">Kraunama…</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Konfigūracija</CardTitle>
      </CardHeader>
      <CardBody>
        <Tabs defaultValue="company" className="space-y-5">
          <TabsList>
            <TabsTrigger value="company">Įmonė</TabsTrigger>
            <TabsTrigger value="series">Serijos</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="design">Dizainas</TabsTrigger>
          </TabsList>
          <TabsContent value="company">
            <CompanyTab value={settings.company} onChange={setCompany} />
          </TabsContent>
          <TabsContent value="series">
            <SeriesTab series={settings.series} onChange={setSeries} />
          </TabsContent>
          <TabsContent value="email">
            <EmailTab
              resendApiKey={settings.resendApiKey}
              defaultSubject={settings.defaultEmailSubject}
              defaultBody={settings.defaultEmailBody}
              onChange={setEmailDefaults}
            />
          </TabsContent>
          <TabsContent value="design">
            <DesignTab presets={settings.designPresets} onChange={setPresets} />
          </TabsContent>
        </Tabs>
      </CardBody>
    </Card>
  );
}
