import { type CSSProperties, type ReactNode } from 'react';
import { type Palette } from '@/lib/design';
import { type Invoice } from '@/lib/domain';
import { type SettingsDto } from '@/lib/drive/settings';
import { type BlockKind, type BlockInstance } from '@/lib/invoice-template/layout';
import { useTranslate } from '@/hooks';
import { AmountInWordsBlock } from './AmountInWordsBlock';
import { BuyerBlock } from './BuyerBlock';
import { InvoiceMetaBlock } from './InvoiceMetaBlock';
import { InvoiceSignatures } from './InvoiceSignatures';
import { LineItemsTable } from './LineItemsTable';
import { LogoBlock } from './LogoBlock';
import { NotesBlock } from './NotesBlock';
import { SellerBlock } from './SellerBlock';
import { TotalsBox } from './TotalsBox';
import { useTextDraft } from './useTextDraft';

export interface InstanceRenderContext {
  invoice: Invoice;
  onChange: (updatedInvoice: Invoice) => void;
  settings: SettingsDto;
  palette: Palette;
  isPreview: boolean;
  onInstancePatch: ((instanceId: string, patch: Partial<BlockInstance>) => void) | undefined;
}

export type InstanceRenderer = (instance: BlockInstance, context: InstanceRenderContext) => ReactNode;

export const INSTANCE_RENDERERS: Record<BlockKind, InstanceRenderer> = {
  logo: (_instance, context) => <LogoBlock settings={context.settings} />,
  'seller-info': (_instance, context) => <SellerBlock settings={context.settings} />,
  'invoice-meta': (_instance, context) => (
    <InvoiceMetaBlock
      invoice={context.invoice}
      onChange={context.onChange}
      hasVat={context.invoice.vat.enabled}
      primaryColor={context.palette.primaryColor}
      isPreview={context.isPreview}
    />
  ),
  'buyer-info': (_instance, context) => (
    <BuyerBlock invoice={context.invoice} />
  ),
  'line-items': (_instance, context) => (
    <LineItemsTable invoice={context.invoice} onChange={context.onChange} isPreview={context.isPreview} />
  ),
  notes: (_instance, context) => (
    <NotesBlock invoice={context.invoice} onChange={context.onChange} isPreview={context.isPreview} />
  ),
  totals: (instance, context) => {
    if (instance.kind !== 'totals') return null;
    const totalsAlignClass =
      instance.align === 'center' ? 'items-center' : instance.align === 'left' ? 'items-start' : 'items-end';
    return (
      <div className={`flex w-full min-w-0 flex-col gap-3 ${totalsAlignClass}`}>
        <TotalsBox invoice={context.invoice} accentColor={context.palette.accentColor} />
      </div>
    );
  },
  'amount-in-words': (instance, context) => {
    if (instance.kind !== 'amount-in-words') return null;
    return (
      <AmountInWordsBlock
        invoice={context.invoice}
        align={instance.align}
        textColor={context.palette.mutedColor}
      />
    );
  },
  signature: () => <InvoiceSignatures />,
  divider: (instance, context) => {
    if (instance.kind !== 'divider') return null;
    return renderDivider(instance.dividerStyle, instance.dividerThickness, instance.dividerColor ?? context.palette.borderColor);
  },
  'custom-image': (instance) => {
    if (instance.kind !== 'custom-image') return null;
    return renderCustomImage(instance.imageBase64, instance.imageMaxWidthPct);
  },
  text: (instance, context) => {
    if (instance.kind !== 'text') return null;
    return (
      <TextBlockView
        instanceId={instance.id}
        text={instance.text}
        fontSize={instance.fontSize}
        fontWeight={instance.fontWeight}
        color={instance.textColor ?? context.palette.textColor}
        align={instance.align}
        isPreview={context.isPreview}
        onPatch={context.onInstancePatch}
      />
    );
  },
};

export function renderBlockInstanceContent(instance: BlockInstance, context: InstanceRenderContext): ReactNode {
  const renderer = INSTANCE_RENDERERS[instance.kind];
  return renderer(instance, context);
}

interface TextBlockViewProps {
  instanceId: string;
  text: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  color: string;
  align: 'left' | 'center' | 'right';
  isPreview: boolean;
  onPatch: ((instanceId: string, patch: Partial<BlockInstance>) => void) | undefined;
}

function TextBlockView({ instanceId, text, fontSize, fontWeight, color, align, isPreview, onPatch }: TextBlockViewProps) {
  const t = useTranslate();
  const textDraft = useTextDraft(text, (nextText) => {
    if (!onPatch) return;
    onPatch(instanceId, { kind: 'text', text: nextText });
  });

  const style: CSSProperties = {
    fontSize: `${fontSize}px`,
    fontWeight,
    color,
    textAlign: align,
    whiteSpace: 'pre-wrap',
    width: '100%',
  };

  if (isPreview || !onPatch) {
    return (
      <div style={style}>
        {text || (isPreview ? '' : t['invoice.text.empty'])}
      </div>
    );
  }

  return (
    <textarea
      onChange={(event) => textDraft.setValue(event.target.value)}
      onFocus={textDraft.beginEditing}
      onBlur={textDraft.commit}
      onClick={(event) => event.stopPropagation()}
      placeholder={t['invoice.text.placeholder']}
      value={textDraft.value}
      rows={Math.max(1, textDraft.value.split('\n').length)}
      className="w-full resize-y rounded border border-dashed border-slate-200 bg-transparent p-1 focus:border-slate-400 focus:outline-none"
      style={style}
    />
  );
}

function renderDivider(style: 'solid' | 'dashed' | 'spacer', thickness: number, color: string): ReactNode {
  if (style === 'spacer') {
    return <div style={{ height: `${thickness * 8}px`, width: '100%' }} />;
  }
  return (
    <div
      style={{
        width: '100%',
        borderBottomWidth: `${thickness}px`,
        borderBottomColor: color,
        borderBottomStyle: style,
      }}
    />
  );
}

function renderCustomImage(base64: string | undefined, maxWidthPct: number): ReactNode {
  if (!base64) {
    return <CustomImageEmpty />;
  }
  return <img src={base64} alt="" style={{ maxWidth: `${maxWidthPct}%`, height: 'auto', objectFit: 'contain' }} />;
}

function CustomImageEmpty() {
  const t = useTranslate();
  return (
    <div className="flex h-20 w-full items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
      {t['invoice.customImage.empty']}
    </div>
  );
}