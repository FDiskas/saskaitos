import { afterEach, describe, expect, it } from 'vitest';
import {
  LANGUAGE_STORAGE_KEY,
  clearStoredLanguage,
  loadStoredLanguage,
  saveStoredLanguage,
} from './language';

afterEach(() => {
  localStorage.clear();
});

describe('language storage', () => {
  it('when nothing is stored, then returns null', () => {
    expect(loadStoredLanguage()).toBeNull();
  });

  it('when "lt" is saved, then loadStoredLanguage returns "lt"', () => {
    saveStoredLanguage('lt');
    expect(loadStoredLanguage()).toBe('lt');
  });

  it('when "en" is saved, then loadStoredLanguage returns "en"', () => {
    saveStoredLanguage('en');
    expect(loadStoredLanguage()).toBe('en');
  });

  it('when stored value is not a supported language, then returns null', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'de');
    expect(loadStoredLanguage()).toBeNull();
  });

  it('when clearStoredLanguage is called, then localStorage entry is removed', () => {
    saveStoredLanguage('en');
    clearStoredLanguage();
    expect(loadStoredLanguage()).toBeNull();
  });
});
