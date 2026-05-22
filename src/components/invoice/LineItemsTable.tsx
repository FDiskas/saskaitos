import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Invoice, LineItem, Money } from '@/lib/domain';
import { InlineEditField } from './InlineEditField';

export interface LineItemsTableProps {
  invoice: Invoice;
  onChange: (updatedInvoice: Invoice) => void;
}

export function LineItemsTable({ invoice, onChange }: LineItemsTableProps) {
  const items = invoice.lineItems.toArray();
  const currency = invoice.totals().subtotal.currency;

  const handleAddItem = () => {
    const newItem = LineItem.of({
      id: crypto.randomUUID(),
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
    const updatedItems = invoice.lineItems.update(id, patch);
    onChange(invoice.withLineItems(updatedItems));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const reordered = invoice.lineItems.reorder(index, index - 1);
    onChange(invoice.withLineItems(reordered));
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const reordered = invoice.lineItems.reorder(index, index + 1);
    onChange(invoice.withLineItems(reordered));
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm text-slate-700">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <th className="py-3 pl-2 pr-4 text-center w-12">Nr.</th>
            <th className="py-3 px-4 min-w-[200px]">Paslaugos / prekės aprašymas</th>
            <th className="py-3 px-4 text-center w-24">Kiekis</th>
            <th className="py-3 px-4 text-center w-24">Mato vnt.</th>
            <th className="py-3 px-4 text-right w-32">Kaina (vnt.)</th>
            <th className="py-3 px-4 text-right w-32">Suma</th>
            <th className="py-3 pl-4 pr-2 text-center w-28 no-print">Veiksmai</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                Nėra pridėtų prekių ar paslaugų. Spustelkite mygtuką žemiau, kad pridėtumėte.
              </td>
            </tr>
          ) : (
            items.map((item, index) => {
              const itemTotal = item.total();
              return (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 hover:bg-slate-50/55 transition-colors group"
                >
                  <td className="py-3 pl-2 pr-4 text-center font-medium text-slate-400">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <InlineEditField
                      value={item.description}
                      onChange={(val) => handleUpdateItem(item.id, { description: val })}
                      placeholder="Įveskite aprašymą..."
                      className="w-full block"
                      inputClassName="w-full"
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <InlineEditField<number>
                      value={item.quantity}
                      onChange={(val) => handleUpdateItem(item.id, { quantity: val })}
                      type="number"
                      format={(val) => String(val)}
                      parse={(val) => Math.max(0, parseFloat(val) || 0)}
                      placeholder="1"
                      className="w-full text-center"
                      inputClassName="text-center"
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <InlineEditField
                      value={item.unit}
                      onChange={(val) => handleUpdateItem(item.id, { unit: val })}
                      placeholder="vnt."
                      className="w-full text-center"
                      inputClassName="text-center"
                    />
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    <InlineEditField<Money>
                      value={item.unitPrice}
                      onChange={(val) => handleUpdateItem(item.id, { unitPrice: val })}
                      format={(val) => val.toNumber().toFixed(2)}
                      parse={(val) => new Money(parseFloat(val) || 0, currency)}
                      placeholder="0.00"
                      className="w-full text-right"
                      inputClassName="text-right font-mono"
                    />
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                    {itemTotal.format()}
                  </td>
                  <td className="py-3 pl-4 pr-2 text-center no-print">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveUp(index)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Perkelti aukštyn"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={index === items.length - 1}
                        onClick={() => handleMoveDown(index)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Perkelti žemyn"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
                        title="Pašalinti prekę"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
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
