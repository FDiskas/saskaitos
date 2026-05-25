import { useEffect, useRef } from 'react';
import { useSettings } from './useSettings';
import { useLanguage } from './useLanguage';

export function useLanguageSync(): void {
  const { settings, update } = useSettings();
  const { language, setLanguage } = useLanguage();
  // Tracks whether we've done the first sync from Drive → UI.
  // Before that: Drive settings is authoritative (restore saved language).
  // After that:  UI is authoritative (user's choice propagates to Drive).
  const didInitialSync = useRef(false);

  useEffect(() => {
    if (!settings) return;

    if (!didInitialSync.current) {
      didInitialSync.current = true;
      if (settings.language && settings.language !== language) {
        // First load: restore language from Drive settings.
        setLanguage(settings.language);
      } else if (!settings.language) {
        // Drive settings has no language yet — persist the current UI language.
        update((s) => ({ ...s, language }));
      }
      return;
    }

    // After the initial sync the user changed the language in the UI — save to Drive.
    if (settings.language !== language) {
      update((s) => ({ ...s, language }));
    }
  }, [settings, language, setLanguage, update]);
}
