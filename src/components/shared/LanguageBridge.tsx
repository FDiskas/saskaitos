import { useLanguageSync, useStorageOrNull } from '@/hooks';

export function LanguageBridge() {
  const storage = useStorageOrNull();
  if (!storage) return null;
  return <LanguageBridgeInner />;
}

function LanguageBridgeInner() {
  useLanguageSync();
  return null;
}
