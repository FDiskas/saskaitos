import { GripVertical, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LineItem, Money } from '@/lib/domain';
import { InlineEditField } from './InlineEditField';

export interface LineItemRowProps {
  item: LineItem;
  index: number;
  currency: string;
  onUpdate: (id: string, patch: Parameters<typeof LineItem.prototype.withPatch>[0]) => void;
  onRemove: (id: string) => void;
  isPreview?: boolean;
}

export function LineItemRow({
  item,
  index,
  currency,
  onUpdate,
  onRemove,
  isPreview = false,
}: LineItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: isPreview,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-slate-100 hover:bg-slate-50/55 transition-colors group bg-white"
    >
      {!isPreview && (
        <td className="py-3 pl-1 pr-2 text-center no-print">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing rounded p-1 text-slate-300 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            title="Tempkite, kad pertvarkytumėte"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </td>
      )}
      <td className="py-3 pl-1 pr-4 text-center font-medium text-slate-400">{index + 1}</td>
      <td className="py-3 px-4 font-medium text-slate-900">
        <InlineEditField
          value={item.description}
          onChange={(val) => onUpdate(item.id, { description: val })}
          readOnly={isPreview}
          placeholder="Įveskite aprašymą..."
          className="w-full block"
          inputClassName="w-full"
        />
      </td>
      <td className="py-3 px-4 text-center">
        <InlineEditField<number>
          value={item.quantity}
          onChange={(val) => onUpdate(item.id, { quantity: val })}
          type="number"
          readOnly={isPreview}
          format={(val) => String(val)}
          parse={(val) => {
            const num = parseFloat(val);
            return Number.isFinite(num) && num >= 0 ? num : item.quantity;
          }}
          placeholder="1"
          className="w-full text-center"
          inputClassName="text-center"
        />
      </td>
      <td className="py-3 px-4 text-center">
        <InlineEditField
          value={item.unit}
          onChange={(val) => onUpdate(item.id, { unit: val })}
          readOnly={isPreview}
          placeholder="vnt."
          className="w-full text-center"
          inputClassName="text-center"
        />
      </td>
      <td className="py-3 px-4 text-right font-mono">
        <InlineEditField<Money>
          value={item.unitPrice}
          onChange={(val) => onUpdate(item.id, { unitPrice: val })}
          readOnly={isPreview}
          format={(val) => val.toNumber().toFixed(2)}
          parse={(val) => {
            const num = parseFloat(val);
            return Number.isFinite(num) && num >= 0 ? new Money(num, currency) : item.unitPrice;
          }}
          placeholder="0.00"
          className="w-full text-right"
          inputClassName="text-right font-mono"
        />
      </td>
      <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">{item.total().format()}</td>
      {!isPreview && (
        <td className="py-3 pl-2 pr-1 text-center no-print">
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            title="Pašalinti prekę"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </td>
      )}
    </tr>
  );
}
