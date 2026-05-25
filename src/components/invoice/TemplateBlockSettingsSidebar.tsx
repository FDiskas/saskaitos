import { useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui';
import { ClientCombobox } from '@/components/shared';
import { Client, type Invoice, ClientId } from '@/lib/domain';
import { fileToBase64 } from '@/lib/files';
import { useCreateClient, useTranslate } from '@/hooks';
import { withParams } from '@/lib/translate';
import { ClientFormDialog, type ClientFormValues } from '@/components/clients';
import { blockLabel } from '@/lib/invoice-template/blocks';
import { rowTotalSpan } from '@/lib/invoice-template/layout';
import type {
  BlockInstance,
  DividerBlockInstance,
  CustomImageBlockInstance,
  InvoiceTemplateLayoutDto,
  InvoiceTemplateRowDto,
  TextBlockInstance,
} from '@/lib/invoice-template/layout';
import { DiscountToggle } from './DiscountToggle';
import { VatToggle } from './VatToggle';
import { useTextDraft } from './useTextDraft';
import { useCommittedValueDraft } from './useCommittedValueDraft';

export interface TemplateBlockSettingsSidebarProps {
  invoice: Invoice;
  onInvoiceChange: (updated: Invoice) => void;
  logoBase64?: string;
  onLogoBase64Change?: (logoBase64: string | undefined) => void;
  selectedInstance: BlockInstance | null;
  selectedRowId: string | null;
  layout: InvoiceTemplateLayoutDto;
  onInstancePatch: (patch: Partial<BlockInstance>) => void;
  onRemoveInstance: () => void;
  onRowColumnsChange: (columns: number) => void;
  onMergeColumnRight: (columnId: string) => void;
  onSplitColumn: (columnId: string) => void;
  onRemoveRow: () => void;
}

export function TemplateBlockSettingsSidebar({
  invoice,
  onInvoiceChange,
  logoBase64,
  onLogoBase64Change,
  selectedInstance,
  selectedRowId,
  layout,
  onInstancePatch,
  onRemoveInstance,
  onRowColumnsChange,
  onMergeColumnRight,
  onSplitColumn,
  onRemoveRow,
}: TemplateBlockSettingsSidebarProps) {
  const t = useTranslate();
  if (!selectedInstance && !selectedRowId) {
    return (
      <aside className="w-70 shrink-0 border-r border-slate-200 bg-white p-4 h-full no-print">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t['invoice.blockSettings.title']}</h3>
        <p className="text-xs text-slate-500">{t['invoice.blockSettings.intro']}</p>
      </aside>
    );
  }

  if (!selectedInstance && selectedRowId) {
    return (
      <RowSettingsPanel
        rowId={selectedRowId}
        layout={layout}
        onRowColumnsChange={onRowColumnsChange}
        onMergeColumnRight={onMergeColumnRight}
        onSplitColumn={onSplitColumn}
        onRemoveRow={onRemoveRow}
      />
    );
  }

  if (!selectedInstance) return null;

  return (
    <InstanceSettingsPanel
      invoice={invoice}
      onInvoiceChange={onInvoiceChange}
      logoBase64={logoBase64}
      onLogoBase64Change={onLogoBase64Change}
      instance={selectedInstance}
      onInstancePatch={onInstancePatch}
      onRemoveInstance={onRemoveInstance}
    />
  );
}

interface RowSettingsPanelProps {
  rowId: string;
  layout: InvoiceTemplateLayoutDto;
  onRowColumnsChange: (columns: number) => void;
  onMergeColumnRight: (columnId: string) => void;
  onSplitColumn: (columnId: string) => void;
  onRemoveRow: () => void;
}

function RowSettingsPanel({
  rowId,
  layout,
  onRowColumnsChange,
  onMergeColumnRight,
  onSplitColumn,
  onRemoveRow,
}: RowSettingsPanelProps) {
  const t = useTranslate();
  const selectedRow = layout.layout.find((row) => row.id === rowId);
  if (!selectedRow) {
    return (
      <aside className="w-70 shrink-0 border-r border-slate-200 bg-white p-4 h-full no-print">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t['invoice.blockSettings.row.title']}</h3>
        <p className="text-xs text-slate-500">{t['invoice.blockSettings.row.notFound']}</p>
      </aside>
    );
  }

  const totalSpan = rowTotalSpan(selectedRow);

  return (
    <aside className="w-70 shrink-0 border-r border-slate-200 bg-white p-4 h-full no-print overflow-y-auto">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t['invoice.blockSettings.row.title']}</h3>
      <p className="text-sm font-semibold text-slate-900 mb-4">{t['invoice.blockSettings.row.heading']}</p>

      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">{t['invoice.blockSettings.row.structure']}</p>
      <ColumnLayoutPreview row={selectedRow} totalSpan={totalSpan} />

      <div className="flex flex-col gap-2 mb-4">
        {selectedRow.columns.map((column, index) => (
          <ColumnControls
            key={column.id}
            column={column}
            isLast={index === selectedRow.columns.length - 1}
            onMergeRight={() => onMergeColumnRight(column.id)}
            onSplit={() => onSplitColumn(column.id)}
            index={index}
          />
        ))}
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">{t['invoice.blockSettings.row.quickLayout']}</p>
      <div className="grid grid-cols-4 gap-1 mb-4">
        {[1, 2, 3, 4].map((value) => (
          <button
            key={value}
            type="button"
            className={`rounded-md border px-2 py-1.5 text-sm font-medium ${
              selectedRow.columns.length === value && totalSpan === value
                ? 'border-sky-400 bg-sky-50 text-sky-900'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => onRowColumnsChange(value)}
          >
            {value}
          </button>
        ))}
      </div>

      <Button type="button" variant="destructive" className="w-full" onClick={onRemoveRow}>
        {t['invoice.blockSettings.row.remove']}
      </Button>
    </aside>
  );
}

interface ColumnLayoutPreviewProps {
  row: InvoiceTemplateRowDto;
  totalSpan: number;
}

function ColumnLayoutPreview({ row, totalSpan }: ColumnLayoutPreviewProps) {
  return (
    <div
      className="grid gap-0.5 mb-3 rounded border border-slate-200 bg-slate-50 p-1"
      style={{ gridTemplateColumns: `repeat(${totalSpan}, minmax(0, 1fr))` }}
    >
      {row.columns.map((column, index) => (
        <div
          key={column.id}
          className="flex items-center justify-center rounded bg-white border border-slate-200 px-1 py-2 text-[10px] font-medium text-slate-500"
          style={{ gridColumn: `span ${column.span} / span ${column.span}` }}
        >
          {index + 1}
          {column.span > 1 ? `×${column.span}` : ''}
        </div>
      ))}
    </div>
  );
}

interface ColumnControlsProps {
  column: InvoiceTemplateRowDto['columns'][number];
  index: number;
  isLast: boolean;
  onMergeRight: () => void;
  onSplit: () => void;
}

function ColumnControls({ column, index, isLast, onMergeRight, onSplit }: ColumnControlsProps) {
  const t = useTranslate();
  const label = column.span > 1
    ? withParams(t['invoice.blockSettings.row.columnWithWidth'], { index: index + 1, span: column.span })
    : withParams(t['invoice.blockSettings.row.column'], { index: index + 1 });
  return (
    <div className="rounded-md border border-slate-200 bg-white p-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          disabled={isLast}
          onClick={onMergeRight}
          className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          title={t['invoice.blockSettings.row.mergeRightTitle']}
        >
          {t['invoice.blockSettings.row.mergeRight']}
        </button>
        <button
          type="button"
          disabled={column.span <= 1}
          onClick={onSplit}
          className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          title={t['invoice.blockSettings.row.splitTitle']}
        >
          {t['invoice.blockSettings.row.split']}
        </button>
      </div>
    </div>
  );
}

interface InstanceSettingsPanelProps {
  invoice: Invoice;
  onInvoiceChange: (updated: Invoice) => void;
  logoBase64?: string;
  onLogoBase64Change?: (logoBase64: string | undefined) => void;
  instance: BlockInstance;
  onInstancePatch: (patch: Partial<BlockInstance>) => void;
  onRemoveInstance: () => void;
}

function InstanceSettingsPanel({
  invoice,
  onInvoiceChange,
  logoBase64,
  onLogoBase64Change,
  instance,
  onInstancePatch,
  onRemoveInstance,
}: InstanceSettingsPanelProps) {
  const t = useTranslate();
  const marginTopDraft = useCommittedValueDraft(instance.marginTop, (nextMarginTop) => {
    onInstancePatch({ marginTop: nextMarginTop });
  });

  const marginBottomDraft = useCommittedValueDraft(instance.marginBottom, (nextMarginBottom) => {
    onInstancePatch({ marginBottom: nextMarginBottom });
  });

  return (
    <aside className="w-70 shrink-0 border-r border-slate-200 bg-white p-4 h-full no-print overflow-y-auto">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t['invoice.blockSettings.block.title']}</h3>
      <p className="text-sm font-semibold text-slate-900 mb-4">{blockLabel(instance.kind, t)}</p>

      <label className="text-xs font-medium text-slate-600 mb-1 block">{t['invoice.blockSettings.block.alignLabel']}</label>
      <select
        className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm mb-4"
        value={instance.align}
        onChange={(event) => {
          const value = event.target.value;
          if (value === 'left' || value === 'center' || value === 'right') {
            onInstancePatch({ align: value });
          }
        }}
      >
        <option value="left">{t['invoice.blockSettings.block.alignLeft']}</option>
        <option value="center">{t['invoice.blockSettings.block.alignCenter']}</option>
        <option value="right">{t['invoice.blockSettings.block.alignRight']}</option>
      </select>

      <label className="text-xs font-medium text-slate-600 mb-1 block">
        {withParams(t['invoice.blockSettings.block.marginTop'], { value: marginTopDraft.value })}
      </label>
      <input
        type="range"
        min={0}
        max={120}
        value={marginTopDraft.value}
        onFocus={marginTopDraft.beginEditing}
        onChange={(event) => marginTopDraft.setValue(Number(event.target.value))}
        onMouseUp={marginTopDraft.commit}
        onTouchEnd={marginTopDraft.commit}
        onBlur={marginTopDraft.commit}
        className="w-full mb-4"
      />

      <label className="text-xs font-medium text-slate-600 mb-1 block">
        {withParams(t['invoice.blockSettings.block.marginBottom'], { value: marginBottomDraft.value })}
      </label>
      <input
        type="range"
        min={0}
        max={120}
        value={marginBottomDraft.value}
        onFocus={marginBottomDraft.beginEditing}
        onChange={(event) => marginBottomDraft.setValue(Number(event.target.value))}
        onMouseUp={marginBottomDraft.commit}
        onTouchEnd={marginBottomDraft.commit}
        onBlur={marginBottomDraft.commit}
        className="w-full mb-4"
      />

      {instance.kind === 'divider' && <DividerControls instance={instance} onInstancePatch={onInstancePatch} />}
      {instance.kind === 'custom-image' && (
        <CustomImageControls instance={instance} onInstancePatch={onInstancePatch} />
      )}
      {instance.kind === 'logo' && (
        <LogoControls
          logoBase64={logoBase64}
          onLogoBase64Change={onLogoBase64Change}
        />
      )}
      {instance.kind === 'buyer-info' && (
        <BuyerControls invoice={invoice} onInvoiceChange={onInvoiceChange} />
      )}
      {instance.kind === 'totals' && (
        <TotalsControls invoice={invoice} onInvoiceChange={onInvoiceChange} />
      )}
      {instance.kind === 'text' && <TextControls instance={instance} onInstancePatch={onInstancePatch} />}

      <Button type="button" variant="destructive" className="w-full" onClick={onRemoveInstance}>
        {t['invoice.blockSettings.block.remove']}
      </Button>
    </aside>
  );
}

interface LogoControlsProps {
  logoBase64?: string;
  onLogoBase64Change?: (logoBase64: string | undefined) => void;
}

function LogoControls({ logoBase64, onLogoBase64Change }: LogoControlsProps) {
  const t = useTranslate();
  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !onLogoBase64Change) return;

    const dataUrl = await fileToBase64(file);
    onLogoBase64Change(dataUrl);
  };

  return (
    <div className="border-t border-slate-100 pt-3 mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">{t['invoice.blockSettings.logo.title']}</p>

      <div className="flex items-center gap-3 mb-3">
        {logoBase64 ? (
          <img
            src={logoBase64}
            alt={t['invoice.blockSettings.logo.alt']}
            className="h-14 w-14 rounded border border-slate-200 object-contain p-1"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded border border-dashed border-slate-300 text-xs text-slate-400">
            {t['invoice.blockSettings.logo.empty']}
          </div>
        )}

        <label className="inline-flex cursor-pointer items-center rounded-md bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
          {t['invoice.blockSettings.logo.upload']}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            aria-label={t['invoice.blockSettings.logo.uploadAria']}
            onChange={handleLogoUpload}
          />
        </label>
      </div>

      {logoBase64 ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => onLogoBase64Change?.(undefined)}
        >
          {t['invoice.blockSettings.logo.remove']}
        </Button>
      ) : null}
    </div>
  );
}

interface BuyerControlsProps {
  invoice: Invoice;
  onInvoiceChange: (updated: Invoice) => void;
}

function BuyerControls({ invoice, onInvoiceChange }: BuyerControlsProps) {
  const t = useTranslate();
  const createClientMutation = useCreateClient();
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);

  const handleCreateClient = (values: ClientFormValues) => {
    const created = Client.of({
      id: ClientId.create(),
      name: values.name,
      code: values.code || undefined,
      vatCode: values.vatCode || undefined,
      address: values.address,
      email: values.email || undefined,
      phone: values.phone || undefined,
      contactPerson: values.contactPerson || undefined,
      notes: values.notes || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    createClientMutation.mutate(created, {
      onSuccess: () => {
        onInvoiceChange(invoice.withClientId(created.id));
        setIsCreateClientOpen(false);
      },
    });
  };

  return (
    <>
      <div className="border-t border-slate-100 pt-3 mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">{t['invoice.blockSettings.buyer.title']}</p>
        <label className="text-xs font-medium text-slate-600 mb-1 block">{t['invoice.blockSettings.buyer.clientLabel']}</label>
        <ClientCombobox
          value={invoice.clientId.toString()}
          onChange={(value) => {
            if (!value) {
              return;
            }
            onInvoiceChange(invoice.withClientId(ClientId.fromString(value)));
          }}
          placeholder={t['combobox.client.placeholder']}
        />
        <Button
          type="button"
          variant="secondary"
          className="mt-2 w-full"
          onClick={() => setIsCreateClientOpen(true)}
        >
          {t['invoice.blockSettings.buyer.addClient']}
        </Button>
      </div>

      <ClientFormDialog
        open={isCreateClientOpen}
        onOpenChange={setIsCreateClientOpen}
        editingClient={null}
        onSave={handleCreateClient}
        isSaving={createClientMutation.isPending}
      />
    </>
  );
}

interface TotalsControlsProps {
  invoice: Invoice;
  onInvoiceChange: (updated: Invoice) => void;
}

function TotalsControls({ invoice, onInvoiceChange }: TotalsControlsProps) {
  const t = useTranslate();
  return (
    <div className="border-t border-slate-100 pt-3 mb-4 flex flex-col gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t['invoice.blockSettings.totals.title']}</p>
      <VatToggle invoice={invoice} onChange={onInvoiceChange} />
      <DiscountToggle invoice={invoice} onChange={onInvoiceChange} />
    </div>
  );
}

interface DividerControlsProps {
  instance: DividerBlockInstance;
  onInstancePatch: (patch: Partial<BlockInstance>) => void;
}

function DividerControls({ instance, onInstancePatch }: DividerControlsProps) {
  const t = useTranslate();
  const dividerThicknessDraft = useCommittedValueDraft(instance.dividerThickness, (nextThickness) => {
    onInstancePatch({ kind: 'divider', dividerThickness: nextThickness });
  });

  return (
    <div className="border-t border-slate-100 pt-3 mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">{t['invoice.blockSettings.divider.title']}</p>

      <label className="text-xs font-medium text-slate-600 mb-1 block">{t['invoice.blockSettings.divider.typeLabel']}</label>
      <select
        className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm mb-3"
        value={instance.dividerStyle}
        onChange={(event) => {
          const value = event.target.value;
          if (value === 'solid' || value === 'dashed' || value === 'spacer') {
            onInstancePatch({ kind: 'divider', dividerStyle: value });
          }
        }}
      >
        <option value="solid">{t['invoice.blockSettings.divider.solid']}</option>
        <option value="dashed">{t['invoice.blockSettings.divider.dashed']}</option>
        <option value="spacer">{t['invoice.blockSettings.divider.spacer']}</option>
      </select>

      <label className="text-xs font-medium text-slate-600 mb-1 block">
        {withParams(t['invoice.blockSettings.divider.thickness'], { value: dividerThicknessDraft.value })}
      </label>
      <input
        type="range"
        min={1}
        max={10}
        value={dividerThicknessDraft.value}
        onFocus={dividerThicknessDraft.beginEditing}
        onChange={(event) => dividerThicknessDraft.setValue(Number(event.target.value))}
        onMouseUp={dividerThicknessDraft.commit}
        onTouchEnd={dividerThicknessDraft.commit}
        onBlur={dividerThicknessDraft.commit}
        className="w-full mb-3"
      />

      {instance.dividerStyle !== 'spacer' && (
        <div className="flex flex-col gap-1.5 mb-3">
          <label className="text-xs font-medium text-slate-600">{t['invoice.blockSettings.divider.color']}</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={instance.dividerColor ?? '#cbd5e1'}
              onChange={(event) => onInstancePatch({ kind: 'divider', dividerColor: event.target.value })}
              className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
            />
            <button
              type="button"
              className="text-[10px] font-medium text-slate-500 hover:text-slate-900"
              onClick={() => onInstancePatch({ kind: 'divider', dividerColor: undefined })}
            >
              {t['invoice.blockSettings.divider.fromTemplate']}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface TextControlsProps {
  instance: TextBlockInstance;
  onInstancePatch: (patch: Partial<BlockInstance>) => void;
}

function TextControls({ instance, onInstancePatch }: TextControlsProps) {
  const t = useTranslate();
  const textDraft = useTextDraft(instance.text, (nextText) => {
    onInstancePatch({ kind: 'text', text: nextText });
  });

  const fontSizeDraft = useCommittedValueDraft(instance.fontSize, (nextFontSize) => {
    onInstancePatch({ kind: 'text', fontSize: nextFontSize });
  });

  return (
    <div className="border-t border-slate-100 pt-3 mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">{t['invoice.blockSettings.text.title']}</p>

      <label className="text-xs font-medium text-slate-600 mb-1 block">{t['invoice.blockSettings.text.textLabel']}</label>
      <textarea
        value={textDraft.value}
        onChange={(event) => textDraft.setValue(event.target.value)}
        onFocus={textDraft.beginEditing}
        onBlur={textDraft.commit}
        rows={3}
        placeholder={t['invoice.text.placeholder']}
        className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm mb-3 resize-y"
      />

      <label className="text-xs font-medium text-slate-600 mb-1 block">
        {withParams(t['invoice.blockSettings.text.fontSize'], { value: fontSizeDraft.value })}
      </label>
      <input
        type="range"
        min={8}
        max={48}
        value={fontSizeDraft.value}
        onFocus={fontSizeDraft.beginEditing}
        onChange={(event) => fontSizeDraft.setValue(Number(event.target.value))}
        onMouseUp={fontSizeDraft.commit}
        onTouchEnd={fontSizeDraft.commit}
        onBlur={fontSizeDraft.commit}
        className="w-full mb-3"
      />

      <label className="text-xs font-medium text-slate-600 mb-1 block">{t['invoice.blockSettings.text.weight']}</label>
      <div className="flex gap-1 mb-3">
        {(['normal', 'bold'] as const).map((weight) => (
          <button
            key={weight}
            type="button"
            onClick={() => onInstancePatch({ kind: 'text', fontWeight: weight })}
            className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium ${
              instance.fontWeight === weight
                ? 'border-sky-400 bg-sky-50 text-sky-900'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {weight === 'normal' ? t['invoice.blockSettings.text.weightNormal'] : t['invoice.blockSettings.text.weightBold']}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5 mb-3">
        <label className="text-xs font-medium text-slate-600">{t['invoice.blockSettings.text.color']}</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={instance.textColor ?? '#0f172a'}
            onChange={(event) => onInstancePatch({ kind: 'text', textColor: event.target.value })}
            className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
          />
          <button
            type="button"
            className="text-[10px] font-medium text-slate-500 hover:text-slate-900"
            onClick={() => onInstancePatch({ kind: 'text', textColor: undefined })}
          >
            {t['invoice.blockSettings.text.fromTemplate']}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CustomImageControlsProps {
  instance: CustomImageBlockInstance;
  onInstancePatch: (patch: Partial<BlockInstance>) => void;
}

function CustomImageControls({ instance, onInstancePatch }: CustomImageControlsProps) {
  const t = useTranslate();
  const imageWidthDraft = useCommittedValueDraft(instance.imageMaxWidthPct, (nextWidth) => {
    onInstancePatch({ kind: 'custom-image', imageMaxWidthPct: nextWidth });
  });

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        onInstancePatch({ kind: 'custom-image', imageBase64: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="border-t border-slate-100 pt-3 mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">{t['invoice.blockSettings.image.title']}</p>

      {instance.imageBase64 ? (
        <div className="flex flex-col gap-2 mb-3">
          <img
            src={instance.imageBase64}
            alt=""
            className="h-20 w-full object-contain rounded border border-slate-200 bg-slate-50"
          />
          <button
            type="button"
            className="text-[11px] font-medium text-red-600 hover:text-red-700"
            onClick={() => onInstancePatch({ kind: 'custom-image', imageBase64: undefined })}
          >
            {t['invoice.blockSettings.image.remove']}
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center border border-dashed border-slate-300 hover:border-slate-400 rounded-md p-3 bg-slate-50 cursor-pointer text-center mb-3">
          <span className="text-xs font-medium text-slate-600">{t['invoice.blockSettings.image.upload']}</span>
          <span className="text-[10px] text-slate-400 mt-0.5">PNG / JPG</span>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>
      )}

      <label className="text-xs font-medium text-slate-600 mb-1 block">
        {withParams(t['invoice.blockSettings.image.widthLabel'], { value: imageWidthDraft.value })}
      </label>
      <input
        type="range"
        min={10}
        max={100}
        value={imageWidthDraft.value}
        onFocus={imageWidthDraft.beginEditing}
        onChange={(event) => imageWidthDraft.setValue(Number(event.target.value))}
        onMouseUp={imageWidthDraft.commit}
        onTouchEnd={imageWidthDraft.commit}
        onBlur={imageWidthDraft.commit}
        className="w-full mb-3"
      />
    </div>
  );
}
