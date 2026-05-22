import { useState, useEffect, useRef } from 'react';

export interface InlineEditFieldProps<T> {
  value: T;
  onChange: (value: T) => void;
  format?: (value: T) => string;
  parse?: (value: string) => T;
  type?: 'text' | 'number' | 'textarea' | 'date';
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function InlineEditField<T = string>({
  value,
  onChange,
  format = (val) => String(val),
  parse = (val) => val as unknown as T,
  type = 'text',
  placeholder = 'Spustelkite, kad įvestumėte...',
  className = '',
  inputClassName = '',
}: InlineEditFieldProps<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(format(value));
  }, [value, format]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type !== 'date') {
        // Safe check for select method
        if ('select' in inputRef.current) {
          inputRef.current.select();
        }
      }
    }
  }, [isEditing, type]);

  const handleCommit = () => {
    setIsEditing(false);
    const parsed = parse(localValue);
    if (parsed !== value) {
      onChange(parsed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      handleCommit();
    }
    if (e.key === 'Escape') {
      setLocalValue(format(value));
      setIsEditing(false);
    }
  };

  if (isEditing) {
    if (type === 'textarea') {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={handleKeyDown}
          className={`w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus:border-slate-900 focus:outline-none ${inputClassName}`}
          rows={3}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={type}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
        className={`w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus:border-slate-900 focus:outline-none ${inputClassName}`}
      />
    );
  }

  const displayValue = format(value);

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setIsEditing(true);
        }
      }}
      className={`cursor-pointer rounded px-1 py-0.5 hover:bg-slate-100 focus:bg-slate-100 focus:outline-none inline-block ${
        !displayValue.trim() ? 'italic text-slate-400' : 'text-slate-900'
      } ${className}`}
    >
      {displayValue.trim() ? displayValue : placeholder}
    </span>
  );
}
