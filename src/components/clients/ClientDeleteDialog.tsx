import type { Client } from '@/lib/domain';
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@/components/ui';

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
  return (
    <AlertDialog open={client !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogHeader>
        <AlertDialogTitle>Ar tikrai norite ištrinti klientą?</AlertDialogTitle>
        <AlertDialogDescription>
          Šis veiksmas pašalins klientą <strong className="text-slate-900">{client?.name}</strong> iš pagrindinio sąrašo.
          Kliento aplankas Drive saugykloje bus perkeltas į šiukšlinę (pažymėtas kaip trashed), jo duomenys nebus visiškai ištrinti.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <Button variant="secondary" onClick={onCancel} className="cursor-pointer">
          Atšaukti
        </Button>
        <Button
          variant="destructive"
          onClick={onConfirm}
          disabled={isDeleting}
          className="cursor-pointer shadow-sm"
        >
          Ištrinti
        </Button>
      </AlertDialogFooter>
    </AlertDialog>
  );
}
