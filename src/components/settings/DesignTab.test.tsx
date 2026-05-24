import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DesignTab } from './DesignTab';
import type { DesignPresetDto } from '@/lib/drive/settings';

function makePreset(): DesignPresetDto {
  return {
    id: 'preset-1',
    name: 'Numatytasis',
    primaryColor: '#0f172a',
    accentColor: '#2563eb',
    textColor: '#0f172a',
    mutedColor: '#64748b',
    borderColor: '#cbd5e1',
    headingColor: '#94a3b8',
    fontFamily: 'Inter',
  };
}

describe('DesignTab', () => {
  it('when rendering preset card, then all supported color controls are visible', () => {
    render(<DesignTab presets={[makePreset()]} onChange={vi.fn()} />);

    expect(screen.getByLabelText('Pirminė spalva')).toBeInTheDocument();
    expect(screen.getByLabelText('Akcentinė spalva')).toBeInTheDocument();
    expect(screen.getByLabelText('Teksto spalva')).toBeInTheDocument();
    expect(screen.getByLabelText('Pilkų detalių spalva')).toBeInTheDocument();
    expect(screen.getByLabelText('Linijų spalva')).toBeInTheDocument();
    expect(screen.getByLabelText('Antraščių spalva')).toBeInTheDocument();
  });

  it('when additional color is changed, then onChange receives updated preset', () => {
    const onChange = vi.fn();
    render(<DesignTab presets={[makePreset()]} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Teksto spalva'), {
      target: { value: '#111111' },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    const nextPresets = (onChange.mock.calls[0]?.[0] ?? []) as DesignPresetDto[];
    expect(nextPresets[0]?.textColor).toBe('#111111');
  });
});
