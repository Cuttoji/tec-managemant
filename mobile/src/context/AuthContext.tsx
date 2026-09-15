import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { login as apiLogin } from '@/lib/api';
import { getSessionUser, storeAuthResponse, clearAuth } from '@/lib/storage';
import type { LoginResponse, SessionUser } from '@/types';

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toSessionUser(data: LoginResponse): SessionUser {
  return {
    id: String(data.user.id),
    name: data.user.name,
    email: data.user.email,
    role: data.user.role,
    permissions: data.permissions,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate session from AsyncStorage on boot
  useEffect(() => {
    getSessionUser()
      .then(setUser)
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    await storeAuthResponse(res);
    setUser(toSessionUser(res));
  }, []);

  const signOut = useCallback(async () => {
    await clearAuth();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, signIn, signOut }),
    [user, isLoading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
