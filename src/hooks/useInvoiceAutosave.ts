import { useEffect, useRef } from 'react';
import { type Invoice } from '@/lib/domain';

const DEBOUNCE_MS = 500;

export interface AutosaveOptions {
  local: Invoice | null;
  server: Invoice | null;
  enabled: boolean;
  onSave: (payload: { updated: Invoice; previous: Invoice }) => void;
}

export function useInvoiceAutosave({ local, server, enabled, onSave }: AutosaveOptions): boolean {
  const isPendingSave =
    enabled &&
    local !== null &&
    server !== null &&
    local.updatedAt.getTime() > server.updatedAt.getTime();

  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  });

  useEffect(() => {
    if (!isPendingSave || !local || !server) return;
    const timer = setTimeout(() => {
      onSaveRef.current({ updated: local, previous: server });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [isPendingSave, local, server]);

  return isPendingSave;
}
