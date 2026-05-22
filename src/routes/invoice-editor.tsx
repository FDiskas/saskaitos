import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  closestCorners,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useParams, Link, useSearch } from '@tanstack/react-router';
import { ArrowLeft, Loader2, CloudLightning, CheckCircle2 } from 'lucide-react';
import {
  useInvoice,
  useCreateInvoice,
  useUpdateInvoice,
  useSettings,
  useClients,
  useInvoiceAutosave,
} from '@/hooks';
import {
  DesignSidebar,
  InvoiceCanvas,
  InvoiceActions,
  NewInvoicePicker,
  TemplateBlockSettingsSidebar,
} from '@/components/invoice';
import { CompanyProfileSwitcher } from '@/components/shared';
import { type Invoice, ClientId } from '@/lib/domain';
import {
  findBlockInstance,
  mergeColumnWithRight,
  removeBlockInstanceFromTemplate,
  removeTemplateRow,
  resizeTemplateRowColumns,
  splitColumn,
  updateBlockInstance,
  type BlockInstance,
  type InvoiceTemplateLayoutDto,
} from '@/lib/invoice-template/layout';
import {
  resolveDragLabel,
  resolveNextLayoutFromDragEnd,
} from './invoice-editor-dnd';

export function InvoiceEditorPage() {
  const { id } = useParams({ from: '/invoice-editor/$id' });
  const { clientId } = useSearch({ from: '/invoice-editor/$id' });
  const isNew = id === 'new';

  const { invoice, isLoading: isInvoiceLoading, error: invoiceError } = useInvoice(id);
  const { settings, isLoading: isSettingsLoading, update: updateSettings } = useSettings();
  const { clients, isLoading: isClientsLoading } = useClients();

  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();

  const [localInvoice, setLocalInvoice] = useState<Invoice | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [activeLibraryDragLabel, setActiveLibraryDragLabel] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragStart = (event: DragStartEvent) => {
    if (isPreview) return;
    setActiveLibraryDragLabel(resolveDragLabel(String(event.active.id)));
  };

  useEffect(() => {
    if (
      isNew &&
      clientId &&
      !isClientsLoading &&
      !createMutation.isPending &&
      !createMutation.isSuccess &&
      !createMutation.isError
    ) {
      try {
        const parsedId = ClientId.fromString(clientId);
        createMutation.mutate(parsedId);
      } catch (err) {
        console.error('Invalid client ID in query params', err);
      }
    }
  }, [isNew, clientId, isClientsLoading, createMutation]);

  useEffect(() => {
    if (invoice && !updateMutation.isPending) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalInvoice(invoice);
    }
  }, [invoice, updateMutation.isPending]);

  const handleSave = useCallback(
    (payload: { updated: Invoice; previous: Invoice }) => updateMutation.mutate(payload),
    [updateMutation],
  );

  const handleLayoutChange = useCallback(
    (nextLayout: InvoiceTemplateLayoutDto) => {
      updateSettings((current) => ({ ...current, invoiceLayout: nextLayout }));
    },
    [updateSettings],
  );

  const handleCompanyLogoChange = useCallback(
    (nextLogoBase64: string | undefined) => {
      updateSettings((current) => {
        const companies = current.companies ?? [];
        const fallbackActiveId = current.activeCompanyId ?? companies[0]?.id ?? null;

        if (!fallbackActiveId) {
          if (!current.company) return current;
          return {
            ...current,
            company: {
              ...current.company,
              logoBase64: nextLogoBase64,
            },
          };
        }

        const nextCompanies = companies.map((profile) =>
          profile.id === fallbackActiveId
            ? {
                ...profile,
                company: {
                  ...profile.company,
                  logoBase64: nextLogoBase64,
                },
              }
            : profile,
        );

        const activeCompany = nextCompanies.find((profile) => profile.id === fallbackActiveId)?.company;
        if (!activeCompany) return current;

        return {
          ...current,
          companies: nextCompanies,
          company: activeCompany,
        };
      });
    },
    [updateSettings],
  );

  const isPendingSave = useInvoiceAutosave({
    local: localInvoice,
    server: invoice,
    enabled: !isNew,
    onSave: handleSave,
  });

  if (isInvoiceLoading || isSettingsLoading || isClientsLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-800" />
        <p className="text-sm font-medium text-slate-600">Kraunami redaktoriaus duomenys...</p>
      </div>
    );
  }

  if (!isNew && (invoiceError || !invoice)) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-slate-50 p-4 text-center">
        <p className="text-red-600 font-semibold">Nepavyko užkrauti sąskaitos.</p>
        <p className="text-sm text-slate-500 max-w-md">{(invoiceError as Error)?.message || 'Sąskaita nerasta.'}</p>
        <Link to="/dashboard" className="text-sm font-medium text-blue-600 hover:underline">
          Grįžti į pultą
        </Link>
      </div>
    );
  }

  if (isNew) {
    return (
      <NewInvoicePicker
        onClientSelected={(clientId) => createMutation.mutate(clientId)}
        isPending={createMutation.isPending}
      />
    );
  }

  if (!localInvoice || !settings) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    if (isPreview) return;

    setActiveLibraryDragLabel(null);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId) return;

    const activeId = String(event.active.id);
    const nextLayout = resolveNextLayoutFromDragEnd({
      layout: settings.invoiceLayout,
      activeId,
      overId,
    });
    if (!nextLayout) return;

    handleLayoutChange(nextLayout);
  };

  const client = clients.find((c) => c.id.equals(localInvoice.clientId));

  const selectedInstance: BlockInstance | undefined = selectedInstanceId
    ? findBlockInstance(settings.invoiceLayout, selectedInstanceId)
    : undefined;

  const content = (
    <div className="flex flex-row grow h-[calc(100vh-57px)] overflow-hidden print:h-auto print:overflow-visible">
      {!isPreview && (
        <DesignSidebar
          invoice={localInvoice}
          onChange={setLocalInvoice}
          settings={settings}
          layout={settings.invoiceLayout}
        />
      )}

      <main className="grow overflow-y-auto p-8 flex justify-center bg-slate-50/50 print:p-0 print:bg-white print:overflow-visible">
        <InvoiceCanvas
          invoice={localInvoice}
          onChange={setLocalInvoice}
          settings={settings}
          layout={settings.invoiceLayout}
          isPreview={isPreview}
          selectedInstanceId={selectedInstanceId}
          selectedRowId={selectedRowId}
          onSelectInstance={(instanceId) => {
            setSelectedInstanceId(instanceId);
            setSelectedRowId(null);
          }}
          onSelectRow={(rowId) => {
            setSelectedRowId(rowId);
            setSelectedInstanceId(null);
          }}
          onInstancePatch={(instanceId, patch) => {
            handleLayoutChange(updateBlockInstance(settings.invoiceLayout, instanceId, patch));
          }}
        />
      </main>

      {!isPreview && (
        <TemplateBlockSettingsSidebar
          invoice={localInvoice}
          onInvoiceChange={setLocalInvoice}
          logoBase64={settings.company?.logoBase64}
          onLogoBase64Change={handleCompanyLogoChange}
          selectedInstance={selectedInstance ?? null}
          selectedRowId={selectedRowId}
          layout={settings.invoiceLayout}
          onInstancePatch={(patch) => {
            if (!selectedInstanceId) return;
            handleLayoutChange(updateBlockInstance(settings.invoiceLayout, selectedInstanceId, patch));
          }}
          onRemoveInstance={() => {
            if (!selectedInstanceId) return;
            handleLayoutChange(removeBlockInstanceFromTemplate(settings.invoiceLayout, selectedInstanceId));
            setSelectedInstanceId(null);
          }}
          onRowColumnsChange={(columns) => {
            if (!selectedRowId) return;
            handleLayoutChange(resizeTemplateRowColumns(settings.invoiceLayout, selectedRowId, columns));
          }}
          onMergeColumnRight={(columnId) => {
            if (!selectedRowId) return;
            handleLayoutChange(mergeColumnWithRight(settings.invoiceLayout, selectedRowId, columnId));
          }}
          onSplitColumn={(columnId) => {
            if (!selectedRowId) return;
            handleLayoutChange(splitColumn(settings.invoiceLayout, selectedRowId, columnId));
          }}
          onRemoveRow={() => {
            if (!selectedRowId) return;
            handleLayoutChange(removeTemplateRow(settings.invoiceLayout, selectedRowId));
            setSelectedRowId(null);
          }}
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between no-print shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-md transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Pultas
          </Link>
          <div className="h-4 w-px bg-slate-250" />
          <span className="text-sm font-bold text-slate-900 font-mono">
            Redaguojama: {localInvoice.number.toString()}
          </span>
          <CompanyProfileSwitcher />
        </div>

        <SyncStatusPill isSaving={updateMutation.isPending} isPendingSave={isPendingSave} />

        <button
          type="button"
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => setIsPreview((current) => !current)}
        >
          {isPreview ? 'Redagavimo režimas' : 'Preview režimas'}
        </button>

        {client ? (
          <InvoiceActions invoice={localInvoice} client={client} settings={settings} />
        ) : (
          <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-100 font-medium">
            Pasirinkite klientą, kad galėtumėte eksportuoti
          </div>
        )}
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={nestedDroppableCollision}
        onDragStart={handleDragStart}
        onDragCancel={() => setActiveLibraryDragLabel(null)}
        onDragEnd={handleDragEnd}
      >
        {content}
        {!isPreview && activeLibraryDragLabel ? (
          <DragOverlay dropAnimation={null}>
            <div className="rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-900 shadow-xl">
              {activeLibraryDragLabel}
            </div>
          </DragOverlay>
        ) : null}
      </DndContext>
    </div>
  );
}

const nestedDroppableCollision: CollisionDetection = (args) => {
  const activeId = String(args.active.id);

  if (activeId.startsWith('canvas:row:') || activeId.startsWith('library:row:')) {
    const rowContainers = args.droppableContainers.filter((container) =>
      String(container.id).startsWith('canvas:row:'),
    );
    return closestCorners({ ...args, droppableContainers: rowContainers });
  }

  const innermost = pointerWithin(args);
  if (innermost.length > 0) {
    const preferred = innermost.find((collision) => {
      const id = String(collision.id);
      return id.startsWith('canvas:instance:') || id.startsWith('canvas:column:');
    });
    return preferred ? [preferred] : innermost;
  }

  const intersections = rectIntersection(args);
  if (intersections.length > 0) return intersections;

  return closestCorners(args);
};

interface SyncStatusPillProps {
  isSaving: boolean;
  isPendingSave: boolean;
}

function SyncStatusPill({ isSaving, isPendingSave }: SyncStatusPillProps) {
  if (isSaving) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
        <Loader2 className="h-3 w-3 animate-spin" />
        Išsaugoma...
      </span>
    );
  }
  if (isPendingSave) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
        <CloudLightning className="h-3 w-3" />
        Laukiama išsaugojimo...
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
      <CheckCircle2 className="h-3 w-3" />
      Išsaugota Drive
    </span>
  );
}
