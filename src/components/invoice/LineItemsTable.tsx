import { Plus } from 'lucide-react';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { type Invoice, LineItem, Money } from '@/lib/domain';
import { LineItemRow } from './LineItemRow';

export interface LineItemsTableProps {
  invoice: Invoice;
  onChange: (updatedInvoice: Invoice) => void;
  isPreview?: boolean;
}

export function LineItemsTable({ invoice, onChange, isPreview = false }: LineItemsTableProps) {
  const items = invoice.lineItems.toArray();
  const currency = invoice.totals().subtotal.currency;
  const hasVat = invoice.vat.enabled;
  const showActions = !isPreview;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const columnCount = countColumns({ showActions, hasVat });

  const handleAddItem = () => {
    const newItem = LineItem.create({
      description: '',
      quantity: 1,
      unit: 'vnt.',
      unitPrice: Money.zero(currency),
      vatRate: invoice.vat.rate,
    });
    onChange(invoice.withLineItem(newItem));
  };

  const handleRemoveItem = (id: string) => {
    onChange(invoice.withoutLineItem(id));
  };

  const handleUpdateItem = (id: string, patch: Parameters<typeof LineItem.prototype.withPatch>[0]) => {
    onChange(invoice.withLineItems(invoice.lineItems.update(id, patch)));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from < 0 || to < 0) return;
    onChange(invoice.withLineItems(invoice.lineItems.reorder(from, to)));
  };

  const table = (
    <table className="w-full border-collapse text-left text-sm text-slate-700">
      <thead>
        <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {showActions && <th className="py-3 pl-1 pr-2 w-8 no-print"></th>}
          <th className="py-3 pl-1 text-center w-1">Nr.</th>
          <th className="py-3 pl-4 min-w-auto">Paslaugos / prekės aprašymas</th>
          <th className="py-3 pl-4 text-center w-1">Kiekis</th>
          <th className="py-3 pl-4 text-center w-1">Mato&nbsp;vnt.</th>
          <th className="py-3 pl-4 text-right w-1">Kaina</th>
          {hasVat && <th className="py-3 px-4 text-center w-1">PVM&nbsp;%</th>}
          <th className="py-3 pl-4 text-right w-1">Suma</th>
          {showActions && <th className="py-3 pl-2 pr-1 w-12 no-print"></th>}
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr>
            <td colSpan={columnCount} className="py-8 text-center text-slate-400 italic">
              Nėra pridėtų prekių ar paslaugų. Spustelkite mygtuką žemiau, kad pridėtumėte.
            </td>
          </tr>
        ) : showActions ? (
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item, index) => (
              <LineItemRow
                key={item.id}
                item={item}
                index={index}
                currency={currency}
                hasVat={hasVat}
                onUpdate={handleUpdateItem}
                onRemove={handleRemoveItem}
              />
            ))}
          </SortableContext>
        ) : (
          items.map((item, index) => (
            <LineItemRow
              key={item.id}
              item={item}
              index={index}
              currency={currency}
              hasVat={hasVat}
              onUpdate={handleUpdateItem}
              onRemove={handleRemoveItem}
              isPreview
            />
          ))
        )}
      </tbody>
    </table>
  );

  return (
    <div className="w-full overflow-x-auto">
      {showActions && items.length > 0 ? (
        <DndContext
          sensors={sensors}
          modifiers={[restrictToVerticalAxis]}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          {table}
        </DndContext>
      ) : (
        table
      )}

      {showActions && (
        <div className="mt-4 flex justify-start no-print">
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 hover:border-slate-400 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Pridėti eilutę
          </button>
        </div>
      )}
    </div>
  );
}

const BASE_COLUMNS = 6;

function countColumns({ showActions, hasVat }: { showActions: boolean; hasVat: boolean }): number {
  return BASE_COLUMNS + (hasVat ? 1 : 0) + (showActions ? 2 : 0);
}
