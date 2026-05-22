import { useEffect, useState } from 'react';
import { Invoice } from '@/lib/domain';

const DEBOUNCE_MS = 500;

export interface AutosaveOptions {
  local: Invoice | null;
  server: Invoice | null;
  enabled: boolean;
  onSave: (payload: { updated: Invoice; previous: Invoice }) => void;
}

export function useInvoiceAutosave({ local, server, enabled, onSave }: AutosaveOptions): boolean {
  const [isPendingSave, setIsPendingSave] = useState(false);

  useEffect(() => {
    if (!enabled || !local || !server) {
      setIsPendingSave(false);
      return;
    }
    if (local.updatedAt.getTime() <= server.updatedAt.getTime()) {
      setIsPendingSave(false);
      return;
    }

    setIsPendingSave(true);
    const timer = setTimeout(() => {
      onSave({ updated: local, previous: server });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [local, server, enabled, onSave]);

  return isPendingSave;
}
