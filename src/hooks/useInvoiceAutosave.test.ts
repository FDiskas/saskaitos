import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInvoiceAutosave } from './useInvoiceAutosave';
import {
  Invoice,
  InvoiceId,
  InvoiceNumber,
  LineItems,
  VatRate,
  ClientId,
} from '@/lib/domain';

function makeInvoice(updatedAt: Date): Invoice {
  return Invoice.create({
    id: InvoiceId.fromString('018fc3db-b27b-7b3f-b3f8-8a892b3c4a2a'),
    number: InvoiceNumber.of('SF2026-', 1),
    seriesId: 'default',
    clientId: ClientId.fromString('018fc3db-c5be-7f52-8789-982367dca12a'),
    issueDate: new Date('2026-05-22'),
    dueDate: new Date('2026-06-05'),
    lineItems: LineItems.empty(),
    vat: { enabled: false, rate: VatRate.of(21) },
    status: 'draft',
    designPresetId: 'default',
    createdAt: new Date('2026-05-22'),
    updatedAt,
  });
}

describe('useInvoiceAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('when local newer than server and debounce elapses, then calls onSave once with latest pair', () => {
    const server = makeInvoice(new Date(1000));
    const local = makeInvoice(new Date(2000));
    const onSave = vi.fn();

    renderHook(() =>
      useInvoiceAutosave({ local, server, enabled: true, onSave }),
    );

    vi.advanceTimersByTime(600);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ updated: local, previous: server });
  });

  it('when local equals server, then never calls onSave', () => {
    const server = makeInvoice(new Date(1000));
    const local = makeInvoice(new Date(1000));
    const onSave = vi.fn();

    renderHook(() =>
      useInvoiceAutosave({ local, server, enabled: true, onSave }),
    );

    vi.advanceTimersByTime(5000);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('when disabled, then never calls onSave even with local newer than server', () => {
    const server = makeInvoice(new Date(1000));
    const local = makeInvoice(new Date(2000));
    const onSave = vi.fn();

    renderHook(() =>
      useInvoiceAutosave({ local, server, enabled: false, onSave }),
    );

    vi.advanceTimersByTime(5000);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('when onSave identity changes mid-debounce, then timer is NOT reset and fires with latest onSave', () => {
    const server = makeInvoice(new Date(1000));
    const local = makeInvoice(new Date(2000));
    const firstOnSave = vi.fn();
    const secondOnSave = vi.fn();

    const { rerender } = renderHook(
      ({ onSave }) =>
        useInvoiceAutosave({ local, server, enabled: true, onSave }),
      { initialProps: { onSave: firstOnSave } },
    );

    vi.advanceTimersByTime(300);
    rerender({ onSave: secondOnSave });
    vi.advanceTimersByTime(250);

    expect(firstOnSave).not.toHaveBeenCalled();
    expect(secondOnSave).toHaveBeenCalledTimes(1);
  });

  it('when local changes mid-debounce, then timer resets and fires with latest local', () => {
    const server = makeInvoice(new Date(1000));
    const localA = makeInvoice(new Date(2000));
    const localB = makeInvoice(new Date(3000));
    const onSave = vi.fn();

    const { rerender } = renderHook(
      ({ local }) =>
        useInvoiceAutosave({ local, server, enabled: true, onSave }),
      { initialProps: { local: localA } },
    );

    vi.advanceTimersByTime(300);
    rerender({ local: localB });
    vi.advanceTimersByTime(250);
    expect(onSave).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ updated: localB, previous: server });
  });

  it('when unmounted before debounce fires, then never calls onSave', () => {
    const server = makeInvoice(new Date(1000));
    const local = makeInvoice(new Date(2000));
    const onSave = vi.fn();

    const { unmount } = renderHook(() =>
      useInvoiceAutosave({ local, server, enabled: true, onSave }),
    );

    vi.advanceTimersByTime(300);
    unmount();
    vi.advanceTimersByTime(500);

    expect(onSave).not.toHaveBeenCalled();
  });
});
