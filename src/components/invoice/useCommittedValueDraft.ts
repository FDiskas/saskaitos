import { useCallback, useState } from 'react';

export interface UseCommittedValueDraftResult<T> {
  value: T;
  setValue: (next: T) => void;
  beginEditing: () => void;
  commit: () => void;
}

export function useCommittedValueDraft<T>(
  sourceValue: T,
  onCommit: (next: T) => void,
): UseCommittedValueDraftResult<T> {
  const [draftValue, setDraftValue] = useState(sourceValue);
  const [isEditing, setIsEditing] = useState(false);

  const beginEditing = useCallback(() => {
    setDraftValue(sourceValue);
    setIsEditing(true);
  }, [sourceValue]);

  const commit = useCallback(() => {
    setIsEditing(false);
    if (Object.is(draftValue, sourceValue)) return;
    onCommit(draftValue);
  }, [draftValue, onCommit, sourceValue]);

  return {
    value: isEditing ? draftValue : sourceValue,
    setValue: (next) => {
      if (!isEditing) {
        setIsEditing(true);
      }
      setDraftValue(next);
    },
    beginEditing,
    commit,
  };
}
