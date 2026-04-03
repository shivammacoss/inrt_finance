'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, SafeUser } from './api';

type AuthContextValue = {
  user: SafeUser | null;
  loading: boolean;
  /** @deprecated use setUserFromLogin */
  setSession: (_unused: string | null, newUser: SafeUser) => void;
  setUserFromLogin: (newUser: SafeUser) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    try {
      const { user: u } = await api.me();
      setUser(u);
    } catch {
      try {
        await api.refresh();
        const { user: u } = await api.me();
        setUser(u);
      } catch {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 8000);
    return () => window.clearTimeout(id);
  }, []);

  const setUserFromLogin = useCallback((newUser: SafeUser) => {
    setUser(newUser);
  }, []);

  const setSession = useCallback((_unused: string | null, newUser: SafeUser) => {
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* still clear client */
    }
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { user: u } = await api.me();
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      setSession,
      setUserFromLogin,
      logout,
      refreshUser,
    }),
    [user, loading, setSession, setUserFromLogin, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
