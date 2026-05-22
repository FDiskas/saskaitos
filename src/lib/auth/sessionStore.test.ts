import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadStoredSession,
  saveSession,
  clearSession,
  isSessionValid,
  sessionFromTokenResponse,
  SESSION_STORAGE_KEY,
} from './sessionStore';

describe('sessionStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadStoredSession', () => {
    it('when no entry, then returns null', () => {
      expect(loadStoredSession()).toBeNull();
    });

    it('when entry is malformed JSON, then returns null', () => {
      localStorage.setItem(SESSION_STORAGE_KEY, '{not json');
      expect(loadStoredSession()).toBeNull();
    });

    it('when entry is missing required fields, then returns null', () => {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ accessToken: 'x' }));
      expect(loadStoredSession()).toBeNull();
    });

    it('when entry has empty token, then returns null', () => {
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ accessToken: '', expiresAt: Date.now() + 60_000 }),
      );
      expect(loadStoredSession()).toBeNull();
    });

    it('when entry is valid, then returns parsed session', () => {
      const expiresAt = Date.now() + 60_000;
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ accessToken: 'tok', expiresAt }),
      );
      expect(loadStoredSession()).toEqual({ accessToken: 'tok', expiresAt });
    });

    it('when entry is expired, still returns it (caller decides via isSessionValid)', () => {
      const expiresAt = Date.now() - 1000;
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ accessToken: 'tok', expiresAt }),
      );
      expect(loadStoredSession()).toEqual({ accessToken: 'tok', expiresAt });
    });
  });

  describe('isSessionValid', () => {
    it('when expiresAt is in the future, then true', () => {
      expect(isSessionValid({ accessToken: 't', expiresAt: 2000 }, 1000)).toBe(true);
    });

    it('when expiresAt equals now, then false', () => {
      expect(isSessionValid({ accessToken: 't', expiresAt: 1000 }, 1000)).toBe(false);
    });

    it('when expiresAt is in the past, then false', () => {
      expect(isSessionValid({ accessToken: 't', expiresAt: 500 }, 1000)).toBe(false);
    });
  });

  describe('saveSession and clearSession', () => {
    it('when saving then loading, then round-trips', () => {
      const session = { accessToken: 'abc', expiresAt: Date.now() + 60_000 };
      saveSession(session);
      expect(loadStoredSession()).toEqual(session);
    });

    it('when clearing, then load returns null', () => {
      saveSession({ accessToken: 'abc', expiresAt: Date.now() + 60_000 });
      clearSession();
      expect(loadStoredSession()).toBeNull();
    });
  });

  describe('sessionFromTokenResponse', () => {
    it('when given token and expires_in 3600s, then expiresAt = now + (3600 - 60)*1000', () => {
      const now = 1_000_000;
      const session = sessionFromTokenResponse('tok', 3600, now);
      expect(session).toEqual({ accessToken: 'tok', expiresAt: now + 3540 * 1000 });
    });

    it('when expires_in is smaller than safety buffer, then expiresAt = now', () => {
      const now = 1_000_000;
      const session = sessionFromTokenResponse('tok', 30, now);
      expect(session.expiresAt).toBeLessThanOrEqual(now);
    });
  });
});
