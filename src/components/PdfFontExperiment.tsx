import { Suspense, lazy, useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import {
  availableFontFamilies,
  ensureGoogleFontRegistered,
} from '@/lib/pdf/googleFonts';

const LazyPreview = lazy(() => import('./PdfFontExperimentPreview'));

type LoadResult =
  | { kind: 'ready'; family: string; ms: number }
  | { kind: 'error'; family: string; message: string };

type LoadState = { kind: 'loading' } | LoadResult;

function describeError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

function StatusLine({ state }: { state: LoadState }) {
  if (state.kind === 'loading') return <span className="text-slate-500">Kraunama…</span>;
  if (state.kind === 'ready')
    return (
      <span className="text-emerald-600">
        ✓ {state.family} užregistruotas per {state.ms.toFixed(0)} ms
      </span>
    );
  return <span className="text-red-600">Klaida: {state.message}</span>;
}

export function PdfFontExperiment() {
  const [family, setFamily] = useState<string>(availableFontFamilies[0] ?? 'DM Sans');
  const [result, setResult] = useState<LoadResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t0 = performance.now();
    ensureGoogleFontRegistered(family)
      .then(() => {
        if (cancelled) return;
        setResult({ kind: 'ready', family, ms: performance.now() - t0 });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setResult({ kind: 'error', family, message: describeError(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [family]);

  const state: LoadState =
    result === null || result.family !== family ? { kind: 'loading' } : result;

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>PDF font runtime experiment</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <label className="block text-sm font-medium text-slate-700" htmlFor="family-select">
            Šriftas (tik su latin-ext / LT raidėmis):
          </label>
          <select
            id="family-select"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={family}
            onChange={(e) => setFamily(e.target.value)}
          >
            {availableFontFamilies.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <div className="text-sm">
            <StatusLine state={state} />
          </div>
        </CardBody>
      </Card>

      {state.kind === 'ready' && (
        <Card>
          <CardBody>
            <Suspense fallback={<div className="text-slate-500">Kraunamas PDF preview…</div>}>
              <LazyPreview family={state.family} />
            </Suspense>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
