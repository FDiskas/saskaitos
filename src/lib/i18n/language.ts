import { z } from 'zod';
import type { LanguageCode } from '@/lib/translate';

export const LANGUAGE_STORAGE_KEY = 'saskaitos.ui.language';
export const DEFAULT_UI_LANGUAGE: LanguageCode = 'lt';

export const LanguageCodeSchema: z.ZodType<LanguageCode> = z.enum(['lt', 'en']);

export function loadStoredLanguage(): LanguageCode | null {
  const raw = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (!raw) return null;
  const parsed = LanguageCodeSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function saveStoredLanguage(language: LanguageCode): void {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export function clearStoredLanguage(): void {
  localStorage.removeItem(LANGUAGE_STORAGE_KEY);
}
