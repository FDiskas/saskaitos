import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { z } from 'zod';
import type { TokenSource } from '@/lib/drive/http';
import {
  clearSession,
  isSessionValid,
  loadStoredSession,
  saveSession,
  sessionFromTokenResponse,
} from '@/lib/auth/sessionStore';

const DRIVE_SCOPE = 'openid email profile https://www.googleapis.com/auth/drive.file';
const REFRESH_INTERVAL_MS = 55 * 60 * 1000;

const UserInfoSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  picture: z.string().url().optional(),
});

export type GoogleUser = z.infer<typeof UserInfoSchema>;

export interface GoogleAuthValue {
  user: GoogleUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRestoring: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
  tokenSource: TokenSource;
}

const GoogleAuthContext = createContext<GoogleAuthValue | null>(null);

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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const refreshResolverRef = useRef<((token: string | null) => void) | null>(null);

  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const finalizeLogin = useCallback(
    async (token: string, expiresInSeconds: number): Promise<void> => {
      const session = sessionFromTokenResponse(token, expiresInSeconds);
      saveSession(session);
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

  const login = useCallback((): void => {
    setIsLoading(true);
    setError(null);
    triggerLogin();
  }, [triggerLogin]);

  const refreshAccessToken = useCallback(
    (): Promise<string | null> =>
      new Promise<string | null>((resolve) => {
        refreshResolverRef.current = resolve;
        triggerLogin({ prompt: '' });
      }),
    [triggerLogin],
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
    const stored = loadStoredSession();
    if (!stored) {
      setIsRestoring(false);
      return;
    }
    if (!isSessionValid(stored)) {
      clearSession();
      setIsRestoring(false);
      return;
    }
    setAccessToken(stored.accessToken);
    setExpiresAt(stored.expiresAt);
    fetchUserInfo(stored.accessToken)
      .then((fetched) => setUser(fetched))
      .catch(() => {
        clearSession();
        setAccessToken(null);
        setUser(null);
        setExpiresAt(null);
      })
      .finally(() => setIsRestoring(false));
  }, []);

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
      logout();
      return;
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

const detachedTokenSource: TokenSource = {
  getAccessToken: () => null,
  refreshAccessToken: async () => null,
};

const detachedAuth: GoogleAuthValue = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isRestoring: false,
  error: null,
  login: () => undefined,
  logout: () => undefined,
  tokenSource: detachedTokenSource,
};

export function useGoogleAuth(): GoogleAuthValue {
  return useContext(GoogleAuthContext) ?? detachedAuth;
}

async function fetchUserInfo(token: string): Promise<GoogleUser> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`userinfo ${res.status}`);
  const data: unknown = await res.json();
  return UserInfoSchema.parse(data);
}
