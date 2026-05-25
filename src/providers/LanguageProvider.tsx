import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setTranslateLanguage, type LanguageCode } from '@/lib/translate';
import {
  DEFAULT_UI_LANGUAGE,
  loadStoredLanguage,
  saveStoredLanguage,
} from '@/lib/i18n/language';
import { LanguageContext, type LanguageContextValue } from './languageContext';

function resolveInitialLanguage(): LanguageCode {
  return loadStoredLanguage() ?? DEFAULT_UI_LANGUAGE;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const initial = resolveInitialLanguage();
    setTranslateLanguage(initial);
    return initial;
  });

  useEffect(() => {
    setTranslateLanguage(language);
  }, [language]);

  const setLanguage = useCallback((next: LanguageCode) => {
    saveStoredLanguage(next);
    setLanguageState(next);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
