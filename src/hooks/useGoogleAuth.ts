import { useContext } from 'react';
import {
  GoogleAuthContext,
  detachedAuth,
  type GoogleAuthValue,
} from '@/providers/googleAuthContext';

export function useGoogleAuth(): GoogleAuthValue {
  return useContext(GoogleAuthContext) ?? detachedAuth;
}
