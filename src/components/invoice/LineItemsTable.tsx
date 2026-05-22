import { Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Invoice, LineItem, Money } from '@/lib/domain';
import { LineItemRow } from './LineItemRow';

export interface LineItemsTableProps {
  invoice: Invoice;
  onChange: (updatedInvoice: Invoice) => void;
}

export function LineItemsTable({ invoice, onChange }: LineItemsTableProps) {
  const items = invoice.lineItems.toArray();
  const currency = invoice.totals().subtotal.currency;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleAddItem = () => {
    const newItem = LineItem.create({
      description: '',
      quantity: 1,
      unit: 'vnt.',
      unitPrice: Money.zero(currency),
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

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm text-slate-700">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <th className="py-3 pl-1 pr-2 w-8 no-print"></th>
            <th className="py-3 pl-1 pr-4 text-center w-10">Nr.</th>
            <th className="py-3 px-4 min-w-[200px]">Paslaugos / prekės aprašymas</th>
            <th className="py-3 px-4 text-center w-24">Kiekis</th>
            <th className="py-3 px-4 text-center w-24">Mato vnt.</th>
            <th className="py-3 px-4 text-right w-32">Kaina (vnt.)</th>
            <th className="py-3 px-4 text-right w-32">Suma</th>
            <th className="py-3 pl-2 pr-1 w-12 no-print"></th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                Nėra pridėtų prekių ar paslaugų. Spustelkite mygtuką žemiau, kad pridėtumėte.
              </td>
            </tr>
          ) : (
            <DndContextRows
              items={items}
              currency={currency}
              sensors={sensors}
              onDragEnd={handleDragEnd}
              onUpdate={handleUpdateItem}
              onRemove={handleRemoveItem}
            />
          )}
        </tbody>
      </table>

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
    </div>
  );
}

interface DndContextRowsProps {
  items: readonly LineItem[];
  currency: string;
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (event: DragEndEvent) => void;
  onUpdate: (id: string, patch: Parameters<typeof LineItem.prototype.withPatch>[0]) => void;
  onRemove: (id: string) => void;
}

function DndContextRows({ items, currency, sensors, onDragEnd, onUpdate, onRemove }: DndContextRowsProps) {
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {items.map((item, index) => (
          <LineItemRow
            key={item.id}
            item={item}
            index={index}
            currency={currency}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
