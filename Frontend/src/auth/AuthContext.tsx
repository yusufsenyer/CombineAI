import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { authApi, meApi } from '../api';
import { AuthResponse, User } from '../api/types';
import { tokenStorage } from './tokenStorage';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  signIn: (response: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
  bootstrap: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const signIn = useCallback(async (response: AuthResponse) => {
    await tokenStorage.setTokens(response.access_token, response.refresh_token);
    setUserState(response.user);
    setStatus('signedIn');
  }, []);

  const signOut = useCallback(async () => {
    const refresh = await tokenStorage.getRefreshToken();
    if (refresh) {
      try {
        await authApi.logout(refresh);
      } catch {
        // best effort; local tokens are cleared regardless
      }
    }
    await tokenStorage.clear();
    setUserState(null);
    setStatus('signedOut');
  }, []);

  const bootstrap = useCallback(async () => {
    setStatus('loading');
    const access = await tokenStorage.getAccessToken();
    if (!access) {
      setUserState(null);
      setStatus('signedOut');
      return;
    }

    try {
      const me = await meApi.get();
      setUserState(me);
      setStatus('signedIn');
    } catch {
      await tokenStorage.clear();
      setUserState(null);
      setStatus('signedOut');
    }
  }, []);

  const setUser = useCallback((next: User) => {
    setUserState(next);
  }, []);

  const value = useMemo(
    () => ({ user, status, signIn, signOut, bootstrap, setUser }),
    [user, status, signIn, signOut, bootstrap, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
