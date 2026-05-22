import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TemplateBlockSettingsSidebar } from './TemplateBlockSettingsSidebar';
import type { TextBlockInstance } from '@/lib/invoice-template/layout';

function createTextInstance(text: string): TextBlockInstance {
  return {
    id: 'inst-text',
    kind: 'text',
    text,
    fontSize: 14,
    fontWeight: 'normal',
    align: 'left',
    marginTop: 0,
    marginBottom: 0,
    textColor: '#111111',
  };
}

describe('TemplateBlockSettingsSidebar', () => {
  it('when editing text control, then commits text change on blur only', () => {
    const onInstancePatch = vi.fn();

    render(
      <TemplateBlockSettingsSidebar
        selectedInstance={createTextInstance('Labavakar')}
        selectedRowId={null}
        layout={{ layout: [] }}
        onInstancePatch={onInstancePatch}
        onRemoveInstance={vi.fn()}
        onRowColumnsChange={vi.fn()}
        onMergeColumnRight={vi.fn()}
        onSplitColumn={vi.fn()}
        onRemoveRow={vi.fn()}
      />,
    );

    const textArea = screen.getByPlaceholderText('Įveskite tekstą');

    fireEvent.focus(textArea);
    fireEvent.change(textArea, { target: { value: 'Laba vakara' } });

    expect(onInstancePatch).not.toHaveBeenCalledWith({ kind: 'text', text: 'Laba vakara' });

    fireEvent.blur(textArea);

    expect(onInstancePatch).toHaveBeenCalledWith({ kind: 'text', text: 'Laba vakara' });
  });

  it('when dragging top margin slider, then commits patch on mouse up only', () => {
    const onInstancePatch = vi.fn();

    render(
      <TemplateBlockSettingsSidebar
        selectedInstance={{
          id: 'inst-notes',
          kind: 'notes',
          align: 'left',
          marginTop: 0,
          marginBottom: 0,
        }}
        selectedRowId={null}
        layout={{ layout: [] }}
        onInstancePatch={onInstancePatch}
        onRemoveInstance={vi.fn()}
        onRowColumnsChange={vi.fn()}
        onMergeColumnRight={vi.fn()}
        onSplitColumn={vi.fn()}
        onRemoveRow={vi.fn()}
      />,
    );

    const sliders = screen.getAllByRole('slider');
    const topMarginSlider = sliders[0] as HTMLInputElement;

    fireEvent.focus(topMarginSlider);
    fireEvent.change(topMarginSlider, { target: { value: '25' } });

    expect(onInstancePatch).not.toHaveBeenCalledWith({ marginTop: 25 });

    fireEvent.mouseUp(topMarginSlider);

    expect(onInstancePatch).toHaveBeenCalledWith({ marginTop: 25 });
  });
});
