import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import type { TokenSource } from '@/lib/drive/http';
import {
  clearSession,
  isSessionValid,
  loadStoredSession,
  saveSession,
  sessionFromTokenResponse,
} from '@/lib/auth/sessionStore';
import {
  GoogleAuthContext,
  UserInfoSchema,
  type GoogleAuthValue,
  type GoogleUser,
} from './googleAuthContext';

const DRIVE_SCOPE = 'openid email profile https://www.googleapis.com/auth/drive.file';
const REFRESH_INTERVAL_MS = 55 * 60 * 1000;

export function GoogleAuthProvider({
  clientId,
  children,
}: {
  clientId: string;
  children: ReactNode;
}) {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <InnerAuthProvider>{children}</InnerAuthProvider>
    </GoogleOAuthProvider>
  );
}

function InnerAuthProvider({ children }: { children: ReactNode }) {
  const [storedSession] = useState(() => loadStoredSession());
  const validStoredSession = storedSession && isSessionValid(storedSession) ? storedSession : null;

  const [accessToken, setAccessToken] = useState<string | null>(validStoredSession?.accessToken ?? null);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(validStoredSession !== null);
  const [expiresAt, setExpiresAt] = useState<number | null>(validStoredSession?.expiresAt ?? null);
  const [error, setError] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(validStoredSession?.accessToken ?? null);
  const refreshResolverRef = useRef<((token: string | null) => void) | null>(null);

  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const finalizeLogin = useCallback(
    async (token: string, expiresInSeconds: number): Promise<void> => {
      const session = sessionFromTokenResponse(token, expiresInSeconds);
      saveSession(session);
      // Set tokenRef synchronously BEFORE state update so that any Drive API
      // calls triggered in the very next render already have the correct token.
      // useEffect-based sync runs too late (after commit phase).
      tokenRef.current = token;
      setAccessToken(token);
      setExpiresAt(session.expiresAt);
      try {
        const fetchedUser = await fetchUserInfo(token);
        setUser(fetchedUser);
      } catch {
        setUser(null);
      }
      setIsLoading(false);
      setError(null);
      refreshResolverRef.current?.(token);
      refreshResolverRef.current = null;
    },
    [],
  );

  const triggerLogin = useGoogleLogin({
    flow: 'implicit',
    scope: DRIVE_SCOPE,
    onSuccess: (res) => {
      void finalizeLogin(res.access_token, res.expires_in);
    },
    onError: (errResp) => {
      setIsLoading(false);
      setError(errResp.error_description ?? errResp.error ?? 'Google authentication failed');
      refreshResolverRef.current?.(null);
      refreshResolverRef.current = null;
    },
  });

  const triggerLoginRef = useRef(triggerLogin);
  useEffect(() => {
    triggerLoginRef.current = triggerLogin;
  });

  const login = useCallback((): void => {
    setIsLoading(true);
    setError(null);
    triggerLoginRef.current();
  }, []);

  const refreshAccessToken = useCallback(
    (): Promise<string | null> =>
      new Promise<string | null>((resolve) => {
        refreshResolverRef.current = resolve;
        triggerLoginRef.current({ prompt: '' });
      }),
    [],
  );

  const logout = useCallback((): void => {
    clearSession();
    setAccessToken(null);
    setUser(null);
    setExpiresAt(null);
    setError(null);
    tokenRef.current = null;
  }, []);

  useEffect(() => {
    if (storedSession && !validStoredSession) {
      clearSession();
    }
  }, [storedSession, validStoredSession]);

  useEffect(() => {
    if (!validStoredSession) {
      return;
    }
    fetchUserInfo(validStoredSession.accessToken)
      .then((fetched) => setUser(fetched))
      .catch(() => {
        clearSession();
        setAccessToken(null);
        setUser(null);
        setExpiresAt(null);
      })
      .finally(() => setIsRestoring(false));
  }, [validStoredSession]);

  useEffect(() => {
    if (!accessToken) return;
    const interval = setInterval(() => {
      void refreshAccessToken();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [accessToken, refreshAccessToken]);

  useEffect(() => {
    if (expiresAt === null) return;
    const delay = expiresAt - Date.now();
    if (delay <= 0) {
      const timer = setTimeout(() => logout(), 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => logout(), delay);
    return () => clearTimeout(timer);
  }, [expiresAt, logout]);

  const tokenSource = useMemo<TokenSource>(
    () => ({
      getAccessToken: () => tokenRef.current,
      refreshAccessToken: () => refreshAccessToken(),
    }),
    [refreshAccessToken],
  );

  const value = useMemo<GoogleAuthValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: accessToken !== null && user !== null,
      isLoading,
      isRestoring,
      error,
      login,
      logout,
      tokenSource,
    }),
    [user, accessToken, isLoading, isRestoring, error, login, logout, tokenSource],
  );

  return <GoogleAuthContext.Provider value={value}>{children}</GoogleAuthContext.Provider>;
}

async function fetchUserInfo(token: string): Promise<GoogleUser> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`userinfo ${res.status}`);
  const data: unknown = await res.json();
  return UserInfoSchema.parse(data);
}
