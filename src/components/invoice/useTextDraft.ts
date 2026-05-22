import { useCallback, useState } from 'react';

export interface UseTextDraftResult {
  value: string;
  setValue: (next: string) => void;
  beginEditing: () => void;
  commit: () => void;
}

export function useTextDraft(sourceValue: string, onCommit: (next: string) => void): UseTextDraftResult {
  const [draftValue, setDraftValue] = useState(sourceValue);
  const [isEditing, setIsEditing] = useState(false);

  const beginEditing = useCallback(() => {
    setDraftValue(sourceValue);
    setIsEditing(true);
  }, [sourceValue]);

  const commit = useCallback(() => {
    setIsEditing(false);
    if (draftValue === sourceValue) return;
    onCommit(draftValue);
  }, [draftValue, onCommit, sourceValue]);

  return {
    value: isEditing ? draftValue : sourceValue,
    setValue: setDraftValue,
    beginEditing,
    commit,
  };
}
