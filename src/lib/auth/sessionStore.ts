import { z } from 'zod';

export const SESSION_STORAGE_KEY = 'saskaitos.auth.session';

const SAFETY_BUFFER_SECONDS = 60;

const StoredSessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresAt: z.number().int().positive(),
});

export type StoredSession = z.infer<typeof StoredSessionSchema>;

export function loadStoredSession(): StoredSession | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  const json = safeJsonParse(raw);
  if (json === null) return null;
  const parsed = StoredSessionSchema.safeParse(json);
  if (!parsed.success) return null;
  return parsed.data;
}

export function saveSession(session: StoredSession): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function isSessionValid(session: StoredSession, now: number = Date.now()): boolean {
  return session.expiresAt > now;
}

export function sessionFromTokenResponse(
  accessToken: string,
  expiresInSeconds: number,
  now: number = Date.now(),
): StoredSession {
  const effectiveSeconds = Math.max(0, expiresInSeconds - SAFETY_BUFFER_SECONDS);
  return { accessToken, expiresAt: now + effectiveSeconds * 1000 };
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
