import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { searchCompanies, type JarsCompany } from '@/lib/jars';
import { useTranslate } from '@/hooks';
import type { translate } from '@/lib/translate';

export interface JarsCompanySearchButtonProps {
  apiKey: string | undefined;
  query: string;
  onResult: (company: JarsCompany) => void;
  onError?: (message: string) => void;
}

const MIN_QUERY_LENGTH = 2;

function disabledTitle(
  apiKey: string | undefined,
  query: string,
  t: typeof translate,
): string | undefined {
  if (!apiKey) return t['jars.button.disabledNoKey'] as string;
  if (query.trim().length < MIN_QUERY_LENGTH) return t['jars.button.disabledShortQuery'] as string;
  return undefined;
}

export function JarsCompanySearchButton({
  apiKey,
  query,
  onResult,
  onError,
}: JarsCompanySearchButtonProps) {
  const t = useTranslate();
  const [busy, setBusy] = useState(false);
  const blockedReason = disabledTitle(apiKey, query, t);
  const disabled = busy || blockedReason !== undefined;

  async function handleClick(): Promise<void> {
    if (!apiKey) return;
    setBusy(true);
    try {
      const results = await searchCompanies({ apiKey, query: query.trim() });
      const first = results[0];
      if (!first) {
        onError?.(t['jars.error.noResults'] as string);
        return;
      }
      onResult(first);
    } catch (err) {
      const message = err instanceof Error ? err.message : (t['jars.error.searchFailed'] as string);
      onError?.(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={blockedReason ?? (t['jars.button.title'] as string)}
      aria-label={t['jars.button.ariaLabel']}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
    </button>
  );
}
