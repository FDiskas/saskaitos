import { translate } from '@/lib/translate';
import { useLanguage } from './useLanguage';

export function useTranslate(): typeof translate {
  // `translate` is a mutable singleton — its keys are patched in-place when the
  // language changes (see setTranslateLanguage).  useLanguage() subscribes this
  // component to the LanguageContext so React re-renders it after each language
  // switch, making the updated `translate` values visible.  Without this call the
  // component would keep rendering stale strings even though the singleton mutated.
  useLanguage();
  return translate;
}
