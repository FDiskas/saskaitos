const DEFAULT_TARGET = '/dashboard';

export function resolveRedirectTarget(from: string | undefined | null): string {
  if (!from) return DEFAULT_TARGET;
  if (!from.startsWith('/')) return DEFAULT_TARGET;
  if (from.startsWith('//')) return DEFAULT_TARGET;
  if (from === '/login' || from.startsWith('/login?') || from.startsWith('/login/')) {
    return DEFAULT_TARGET;
  }
  return from;
}
