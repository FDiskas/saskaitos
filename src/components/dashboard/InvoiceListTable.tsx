import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, FileText } from 'lucide-react';
import { Card } from '@/components/ui';
import { useTranslate } from '@/hooks';
import type { InvoiceStatus, InvoiceSummary } from '@/lib/domain';
import { formatDateLT } from '@/lib/format/date';
import { StatusPicker } from './StatusPicker';

export interface InvoiceListTableProps {
  summaries: InvoiceSummary[];
  today: Date;
  onRowOpen: (summary: InvoiceSummary) => void;
  onStatusChange: (summary: InvoiceSummary, status: InvoiceStatus) => void;
}

export function InvoiceListTable({
  summaries,
  today,
  onRowOpen,
  onStatusChange,
}: InvoiceListTableProps) {
  const t = useTranslate();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);

  const columns = useMemo<ColumnDef<InvoiceSummary>[]>(
    () => [
      {
        id: 'date',
        header: t['dashboard.table.date'] as string,
        accessorFn: (s) => s.issueDate.getTime(),
        cell: (info) => (
          <span className="text-slate-700">{formatDateLT(info.row.original.issueDate)}</span>
        ),
      },
      {
        id: 'number',
        header: t['dashboard.table.number'] as string,
        accessorFn: (s) => s.number,
        cell: (info) => (
          <span className="font-medium text-slate-900">{info.row.original.number}</span>
        ),
      },
      {
        id: 'client',
        header: t['dashboard.table.client'] as string,
        accessorFn: (s) => s.clientName,
        cell: (info) => <span className="text-slate-700">{info.row.original.clientName}</span>,
      },
      {
        id: 'amount',
        header: () => <div className="text-right">{t['dashboard.table.amount']}</div>,
        accessorFn: (s) => s.amount.toCents(),
        cell: (info) => (
          <div className="text-right font-medium text-slate-900">
            {info.row.original.amount.format()}
          </div>
        ),
      },
      {
        id: 'status',
        header: t['dashboard.table.status'] as string,
        cell: (info) => {
          const s = info.row.original;
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <StatusPicker
                value={s.effectiveStatus(today)}
                onChange={(next) => onStatusChange(s, next)}
              />
            </div>
          );
        },
      },
    ],
    [today, onStatusChange, t],
  );

  const table = useReactTable({
    data: summaries,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (summaries.length === 0) {
    return (
      <Card className="border-dashed border-slate-300">
        <div className="p-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <FileText className="h-6 w-6 text-slate-600" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">{t['dashboard.table.emptyTitle']}</h3>
          <p className="mt-2 text-sm text-slate-500 mb-6">
            {t['dashboard.table.emptyBody']}
          </p>
          <div className="flex justify-center">
            <Link
              to="/invoice-editor/$id"
              params={{ id: 'new' }}
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 shadow-sm cursor-pointer"
            >
              {t['dashboard.table.emptyAction']}
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-slate-600">
          <thead className="border-b border-slate-100 bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1 hover:text-slate-900"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <ArrowUp className="h-3.5 w-3.5 text-slate-800" />,
                          desc: <ArrowDown className="h-3.5 w-3.5 text-slate-800" />,
                        }[header.column.getIsSorted() as string] ?? (
                          <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400 opacity-60" />
                        )}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer transition-colors hover:bg-slate-50/70"
                onClick={() => onRowOpen(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
