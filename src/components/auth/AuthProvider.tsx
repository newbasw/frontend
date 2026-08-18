'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clientApi } from '@/lib/api';
import type { AuthUser } from '@shared/types';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({
  initialUser = null,
  children,
}: {
  initialUser?: AuthUser | null;
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [loading, setLoading] = useState(initialUser === null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // 200 with `user: null` when signed out — see the API's /me handler.
      const { user: fetched } = await clientApi<{ user: AuthUser | null }>('/api/auth/me');
      setUser(fetched);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await clientApi('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  }, []);

  // Confirms the session on mount so a cookie set in another tab is picked up.
  useEffect(() => {
    if (initialUser) {
      setLoading(false);
      return;
    }
    void refresh();
  }, [initialUser, refresh]);

  const value = useMemo(
    () => ({ user, loading, refresh, logout, setUser }),
    [user, loading, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
