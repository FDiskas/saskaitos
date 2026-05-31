import { type DesignOverride } from '@/lib/domain';
import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_BORDER_COLOR,
  DEFAULT_HEADING_COLOR,
  DEFAULT_MUTED_COLOR,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_TEXT_COLOR,
  type DesignPresetDto,
} from '@/lib/drive/settings';

/**
 * Fully resolved invoice colour palette used by every renderer (on-screen
 * canvas and PDF). Unlike {@link DesignPresetDto} / {@link DesignOverride},
 * every colour here is guaranteed present — overrides and preset values have
 * already been collapsed against the defaults.
 */
export interface Palette {
  primaryColor: string;
  accentColor: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  headingColor: string;
}

/**
 * Collapse the active preset and per-invoice override into a single concrete
 * palette. Override wins over preset, preset over the hard-coded defaults.
 */
export function resolvePalette(
  preset: DesignPresetDto | undefined,
  override: DesignOverride | undefined,
): Palette {
  return {
    primaryColor: override?.primaryColor ?? preset?.primaryColor ?? DEFAULT_PRIMARY_COLOR,
    accentColor: override?.accentColor ?? preset?.accentColor ?? DEFAULT_ACCENT_COLOR,
    textColor: override?.textColor ?? preset?.textColor ?? DEFAULT_TEXT_COLOR,
    mutedColor: override?.mutedColor ?? preset?.mutedColor ?? DEFAULT_MUTED_COLOR,
    borderColor: override?.borderColor ?? preset?.borderColor ?? DEFAULT_BORDER_COLOR,
    headingColor: override?.headingColor ?? preset?.headingColor ?? DEFAULT_HEADING_COLOR,
  };
}
