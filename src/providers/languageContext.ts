import { createContext } from 'react';
import type { LanguageCode } from '@/lib/translate';

export interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (next: LanguageCode) => void;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);
