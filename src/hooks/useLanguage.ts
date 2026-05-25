import { useContext } from 'react';
import { LanguageContext, type LanguageContextValue } from '@/providers/languageContext';
import { DEFAULT_UI_LANGUAGE } from '@/lib/i18n/language';

const detachedLanguage: LanguageContextValue = {
  language: DEFAULT_UI_LANGUAGE,
  setLanguage: () => {},
};

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext) ?? detachedLanguage;
}
