'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { api, SafeUser } from './api';

const STORAGE_KEY = 'inrt_token';
const USER_KEY = 'inrt_user';

type AuthContextValue = {
  token: string | null;
  user: SafeUser | null;
  loading: boolean;
  setSession: (token: string, newUser: SafeUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStorage(): { token: string | null; user: SafeUser | null } {
  if (typeof window === 'undefined') {
    return { token: null, user: null };
  }
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    const u = localStorage.getItem(USER_KEY);
    if (t && u) {
      return { token: t, user: JSON.parse(u) as SafeUser };
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
  }
  return { token: null, user: null };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  // useLayoutEffect runs before paint so we avoid a stuck "Loading…" flash and
  // don’t depend on passive effect ordering vs child routes (e.g. /dashboard).
  useLayoutEffect(() => {
    try {
      const { token: t, user: u } = readStorage();
      setToken(t);
      setUser(u);
    } finally {
      setLoading(false);
    }
  }, []);

  // Never stay stuck on "Loading…" if something blocks layout (extensions, rare edge cases).
  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 5000);
    return () => window.clearTimeout(id);
  }, []);

  const setSession = useCallback((newToken: string, newUser: SafeUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const { user: u } = await api.me(token);
    setUser(u);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  }, [token]);

  const value = useMemo(
    () => ({ token, user, loading, setSession, logout, refreshUser }),
    [token, user, loading, setSession, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
