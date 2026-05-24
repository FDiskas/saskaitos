import { createContext } from 'react';
import { z } from 'zod';
import type { TokenSource } from '@/lib/drive/http';

export const UserInfoSchema = z.object({
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

export const GoogleAuthContext = createContext<GoogleAuthValue | null>(null);

const detachedTokenSource: TokenSource = {
  getAccessToken: () => null,
  refreshAccessToken: async () => null,
};

export const detachedAuth: GoogleAuthValue = {
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
