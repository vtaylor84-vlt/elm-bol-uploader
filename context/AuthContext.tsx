import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  clearDriverSession,
  readDriverSession,
  type DriverSessionProfile,
  writeDriverSession,
} from '../utils/driverSession.ts';

interface AuthContextValue {
  session: DriverSessionProfile | null;
  isAuthenticated: boolean;
  login: (profile: DriverSessionProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<DriverSessionProfile | null>(() => readDriverSession());

  const login = useCallback((profile: DriverSessionProfile) => {
    writeDriverSession(profile);
    setSession(profile);
  }, []);

  const logout = useCallback(() => {
    clearDriverSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      login,
      logout,
    }),
    [session, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
