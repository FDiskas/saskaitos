import type { Client } from '@/lib/domain';
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@/components/ui';
import { useTranslate } from '@/hooks';

export interface ClientDeleteDialogProps {
  client: Client | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export function ClientDeleteDialog({
  client,
  onConfirm,
  onCancel,
  isDeleting,
}: ClientDeleteDialogProps) {
  const t = useTranslate();
  return (
    <AlertDialog open={client !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogHeader>
        <AlertDialogTitle>{t['clients.delete.title']}</AlertDialogTitle>
        <AlertDialogDescription>
          {t['clients.delete.descriptionPrefix']}
          <strong className="text-slate-900">{client?.name}</strong>
          {t['clients.delete.descriptionSuffix']}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <Button variant="secondary" onClick={onCancel} className="cursor-pointer">
          {t['clients.delete.cancel']}
        </Button>
        <Button
          variant="destructive"
          onClick={onConfirm}
          disabled={isDeleting}
          className="cursor-pointer shadow-sm"
        >
          {t['clients.delete.confirm']}
        </Button>
      </AlertDialogFooter>
    </AlertDialog>
  );
}
