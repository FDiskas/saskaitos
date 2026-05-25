import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { setTranslateLanguage } from '@/lib/translate';
import { DEFAULT_UI_LANGUAGE } from '@/lib/i18n/language';

setTranslateLanguage(DEFAULT_UI_LANGUAGE);

afterEach(() => {
  cleanup();
});
