import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext.tsx';
import {
  brandThemeLabel,
  resolveAuthoritativeCarrier,
  resolveBrandTheme,
  type BrandThemeId,
} from '../utils/carrierBrand.ts';
import type { CarrierId } from '../types/showcase.ts';

interface CarrierThemeContextValue {
  theme: BrandThemeId;
  carrierId: CarrierId | null;
  label: string;
}

const CarrierThemeContext = createContext<CarrierThemeContextValue>({
  theme: 'elm',
  carrierId: null,
  label: 'ELM CONNECT',
});

export const CarrierThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isAuthenticated } = useAuth();

  const value = useMemo(() => {
    if (!isAuthenticated) {
      return { theme: 'elm' as const, carrierId: null, label: 'ELM CONNECT' };
    }
    const theme = resolveBrandTheme(session);
    const carrierId = resolveAuthoritativeCarrier(session);
    return { theme, carrierId, label: brandThemeLabel(theme) };
  }, [isAuthenticated, session]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-carrier-theme', value.theme);
    return () => {
      root.removeAttribute('data-carrier-theme');
    };
  }, [value.theme]);

  return (
    <CarrierThemeContext.Provider value={value}>{children}</CarrierThemeContext.Provider>
  );
};

export function useCarrierTheme(): CarrierThemeContextValue {
  return useContext(CarrierThemeContext);
}
