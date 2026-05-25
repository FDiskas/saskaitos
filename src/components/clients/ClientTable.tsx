import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Edit2,
  FilePlus,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';

import type { Client } from '@/lib/domain';
import { Button, Card, Input } from '@/components/ui';
import { useTranslate } from '@/hooks';

export interface ClientTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onCreateOpen: () => void;
}

export function ClientTable({
  clients,
  onEdit,
  onDelete,
  onCreateOpen,
}: ClientTableProps) {
  const t = useTranslate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t['clients.table.client'] as string,
        cell: (info) => (
          <div>
            <div className="font-semibold text-slate-900">{info.getValue() as string}</div>
            {info.row.original.contactPerson && (
              <div className="text-xs text-slate-500">
                {t['clients.table.contactPrefix']} {info.row.original.contactPerson}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'code',
        header: t['clients.table.codes'] as string,
        cell: (info) => {
          const code = info.getValue() as string | undefined;
          const vatCode = info.row.original.vatCode;
          return (
            <div className="text-xs text-slate-600 space-y-0.5">
              {code && <div>{t['clients.table.companyCodePrefix']} {code}</div>}
              {vatCode && <div>{t['clients.table.vatCodePrefix']} {vatCode}</div>}
              {!code && !vatCode && <span className="text-slate-400">—</span>}
            </div>
          );
        },
      },
      {
        accessorKey: 'address',
        header: t['clients.table.address'] as string,
        cell: (info) => (
          <div className="max-w-[200px] truncate text-slate-600" title={info.getValue() as string}>
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: t['clients.table.contacts'] as string,
        cell: (info) => {
          const email = info.getValue() as string | undefined;
          const phone = info.row.original.phone;
          return (
            <div className="text-xs text-slate-600 space-y-0.5">
              {email && <div className="truncate max-w-[180px]">{email}</div>}
              {phone && <div>{phone}</div>}
              {!email && !phone && <span className="text-slate-400">—</span>}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">{t['clients.table.actions']}</div>,
        cell: (info) => {
          const client = info.row.original;
          return (
            <div className="flex justify-end gap-1.5 items-center">
              <Link
                to="/invoice-editor/$id"
                params={{ id: 'new' }}
                search={{ clientId: client.id.toString() }}
                className="inline-flex items-center justify-center rounded-md bg-white hover:bg-slate-50 text-slate-700 ring-1 ring-slate-200 h-8 px-2.5 text-xs font-semibold cursor-pointer shadow-sm transition-colors"
                title={t['clients.table.actionIssueInvoice']}
              >
                <FilePlus className="mr-1 h-3.5 w-3.5 text-slate-500" />
                {t['clients.table.actionIssueInvoice']}
              </Link>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0 cursor-pointer"
                onClick={() => onEdit(client)}
                title={t['clients.table.actionEdit']}
              >
                <Edit2 className="h-3.5 w-3.5 text-slate-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-red-50 text-red-600 hover:text-red-700 cursor-pointer"
                onClick={() => onDelete(client)}
                title={t['clients.table.actionDelete']}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete, t],
  );

  const table = useReactTable({
    data: clients,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId);
      if (!value) return false;
      return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    },
  });

  if (clients.length === 0) {
    return (
      <Card className="border-dashed border-slate-300">
        <div className="p-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <Users className="h-6 w-6 text-slate-600" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">{t['clients.table.emptyTitle']}</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
            {t['clients.table.emptyBody']}
          </p>
          <div className="mt-6">
            <Button onClick={onCreateOpen} className="gap-2 cursor-pointer shadow-sm">
              <UserPlus className="h-4 w-4" /> {t['clients.table.emptyAction']}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder={t['clients.table.searchPlaceholder']}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <Button onClick={onCreateOpen} className="gap-2 cursor-pointer shadow-sm">
          <Plus className="h-4 w-4" /> {t['clients.table.newButton']}
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {table.getHeaderGroups().length > 0 &&
                    headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider"
                      >
                        {header.isPlaceholder ? null : (
                          <div className="flex items-center">
                            {header.column.getCanSort() ? (
                              <button
                                type="button"
                                onClick={header.column.getToggleSortingHandler()}
                                className="flex items-center gap-1 cursor-pointer hover:text-slate-900 select-none focus:outline-none"
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {{
                                  asc: <ArrowUp className="h-3.5 w-3.5 text-slate-800" />,
                                  desc: <ArrowDown className="h-3.5 w-3.5 text-slate-800" />,
                                }[header.column.getIsSorted() as string] ?? (
                                  <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400 opacity-60" />
                                )}
                              </button>
                            ) : (
                              flexRender(header.column.columnDef.header, header.getContext())
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
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
    </div>
  );
}
