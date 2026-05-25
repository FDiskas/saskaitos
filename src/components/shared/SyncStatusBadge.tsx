import { useSyncExternalStore } from 'react';
import { useTranslate } from '@/hooks';
import type { translate } from '@/lib/translate';
import { syncQueue, type SyncQueue, type SyncStatus } from '@/stores';

const LABEL_KEYS: Record<SyncStatus, keyof typeof translate> = {
  idle: 'sync.status.idle',
  syncing: 'sync.status.syncing',
  synced: 'sync.status.synced',
  error: 'sync.status.error',
};

const TONES: Record<SyncStatus, string> = {
  idle: 'bg-slate-100 text-slate-600 ring-slate-200',
  syncing: 'bg-amber-50 text-amber-700 ring-amber-200',
  synced: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  error: 'bg-red-50 text-red-700 ring-red-200',
};

export interface SyncStatusBadgeProps {
  queue?: SyncQueue;
}

export function SyncStatusBadge({ queue = syncQueue }: SyncStatusBadgeProps) {
  const t = useTranslate();
  const status = useSyncExternalStore(
    (cb) => queue.subscribe(cb),
    () => queue.getStatus(),
    () => 'idle' as SyncStatus,
  );
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${TONES[status]}`}
    >
      <Dot status={status} />
      {t[LABEL_KEYS[status]] as string}
    </span>
  );
}

function Dot({ status }: { status: SyncStatus }) {
  const color =
    status === 'syncing'
      ? 'bg-amber-500'
      : status === 'synced'
        ? 'bg-emerald-500'
        : status === 'error'
          ? 'bg-red-500'
          : 'bg-slate-400';
  const pulse = status === 'syncing' ? 'animate-pulse' : '';
  return <span className={`h-1.5 w-1.5 rounded-full ${color} ${pulse}`} />;
}
