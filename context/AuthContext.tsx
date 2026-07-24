import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  clearDriverSession,
  readDriverSession,
  type DriverSessionProfile,
  writeDriverSession,
} from '../utils/driverSession.ts';
import { clearShowcaseGrant } from '../utils/showcaseGrantStorage.ts';
import { readPreviousLoginIso, recordSuccessfulLogin } from '../utils/lastLogin.ts';

interface AuthContextValue {
  session: DriverSessionProfile | null;
  isAuthenticated: boolean;
  /** ISO timestamp of the previous successful login on this device, if any. */
  previousLoginAt: string | null;
  /** True after at least one successful login was recorded on this device for the active driver. */
  hasRecordedLogin: boolean;
  login: (profile: DriverSessionProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<DriverSessionProfile | null>(() => readDriverSession());
  const [previousLoginAt, setPreviousLoginAt] = useState<string | null>(() => {
    const existing = readDriverSession();
    if (!existing) return null;
    return readPreviousLoginIso(existing.driverId);
  });
  const [hasRecordedLogin, setHasRecordedLogin] = useState(() => {
    const existing = readDriverSession();
    if (!existing) return false;
    return Boolean(readPreviousLoginIso(existing.driverId));
  });

  const login = useCallback((profile: DriverSessionProfile) => {
    const previous = recordSuccessfulLogin(profile.driverId);
    setPreviousLoginAt(previous);
    setHasRecordedLogin(true);
    writeDriverSession(profile);
    setSession(profile);
  }, []);

  const logout = useCallback(() => {
    clearDriverSession();
    clearShowcaseGrant();
    setSession(null);
    setPreviousLoginAt(null);
    setHasRecordedLogin(false);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      previousLoginAt,
      hasRecordedLogin,
      login,
      logout,
    }),
    [session, previousLoginAt, hasRecordedLogin, login, logout]
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
