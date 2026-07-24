import React, { createContext, useContext, useMemo } from 'react';
import type { DriverActionPort, DriverDataSource, DriverExperienceMode } from '../services/dataSource/types.ts';

interface DriverExperienceContextValue {
  mode: DriverExperienceMode;
  routePrefix: '' | '/showcase';
  dataSource: DriverDataSource;
  actions: DriverActionPort;
}

const DriverExperienceContext = createContext<DriverExperienceContextValue | null>(null);

export const DriverExperienceProvider: React.FC<{
  mode: DriverExperienceMode;
  routePrefix?: '' | '/showcase';
  dataSource: DriverDataSource;
  actions: DriverActionPort;
  children: React.ReactNode;
}> = ({ mode, routePrefix = mode === 'showcase' ? '/showcase' : '', dataSource, actions, children }) => {
  const value = useMemo(
    () => ({ mode, routePrefix, dataSource, actions }),
    [mode, routePrefix, dataSource, actions]
  );
  return (
    <DriverExperienceContext.Provider value={value}>{children}</DriverExperienceContext.Provider>
  );
};

export function useDriverExperience(): DriverExperienceContextValue {
  const ctx = useContext(DriverExperienceContext);
  if (!ctx) {
    throw new Error('useDriverExperience must be used within DriverExperienceProvider');
  }
  return ctx;
}

/** Optional hook for pages that can render outside the provider during migration. */
export function useDriverExperienceOptional(): DriverExperienceContextValue | null {
  return useContext(DriverExperienceContext);
}
