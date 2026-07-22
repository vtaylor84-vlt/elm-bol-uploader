import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { CarrierId, ScenarioId, ShowcasePersonaRole } from '../types/showcase.ts';
import { personaFor } from '../fixtures/showcase/personas.ts';
import {
  clearShowcaseGrant,
  isShowcaseGrantPresentAndUnexpired,
  readShowcaseGrant,
} from '../utils/showcaseGrantStorage.ts';
import { validateShowcaseAccess } from '../services/driverLoginService.ts';
import { useAuth } from './AuthContext.tsx';

interface ShowcaseState {
  active: boolean;
  grantValid: boolean;
  carrierId: CarrierId;
  personaRole: ShowcasePersonaRole;
  personaId: string;
  scenarioId: ScenarioId;
  /** Admin-only View As preview is active when persona differs from default driver baseline. */
  viewAsActive: boolean;
}

interface ShowcaseContextValue {
  state: ShowcaseState;
  enterShowcase: () => Promise<'ok' | 'denied'>;
  exitShowcase: () => void;
  setCarrier: (id: CarrierId) => void;
  setPersonaRole: (role: ShowcasePersonaRole) => void;
  setScenario: (id: ScenarioId) => void;
  /** Restore carrier/persona/scenario to known fixture baseline without exiting Showcase. */
  resetShowcase: () => void;
  isShowcaseActive: boolean;
}

const ShowcaseContext = createContext<ShowcaseContextValue | null>(null);

const baselineState = (): Omit<ShowcaseState, 'active' | 'grantValid'> => {
  const persona = personaFor('GLX', 'driver');
  return {
    carrierId: 'GLX',
    personaRole: 'driver',
    personaId: persona.id,
    scenarioId: 'normal',
    viewAsActive: false,
  };
};

const initialState = (): ShowcaseState => ({
  active: false,
  grantValid: false,
  ...baselineState(),
});

export const ShowcaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const [state, setState] = useState<ShowcaseState>(initialState);

  const enterShowcase = useCallback(async (): Promise<'ok' | 'denied'> => {
    if (!session || session.authRole !== 'admin' || !session.canSelectAnyDriver) {
      setState((s) => ({ ...s, active: false, grantValid: false }));
      return 'denied';
    }
    if (!isShowcaseGrantPresentAndUnexpired()) {
      setState((s) => ({ ...s, active: false, grantValid: false }));
      return 'denied';
    }
    const grant = readShowcaseGrant();
    if (!grant) return 'denied';
    const result = await validateShowcaseAccess(grant);
    if (!result.allowed) {
      clearShowcaseGrant();
      setState((s) => ({ ...s, active: false, grantValid: false }));
      return 'denied';
    }
    setState((s) => ({
      ...s,
      active: true,
      grantValid: true,
      ...baselineState(),
    }));
    return 'ok';
  }, [session]);

  const exitShowcase = useCallback(() => {
    // Exit clears View As and returns to Production identity context.
    // Grant is intentionally retained so the admin can re-enter without re-login
    // until the grant expires (existing security model).
    setState((s) => ({
      ...s,
      active: false,
      viewAsActive: false,
      personaRole: 'driver',
      personaId: personaFor(s.carrierId, 'driver').id,
    }));
  }, []);

  const setCarrier = useCallback((carrierId: CarrierId) => {
    setState((s) => {
      const persona = personaFor(carrierId, s.personaRole);
      return {
        ...s,
        carrierId,
        personaId: persona.id,
        viewAsActive: s.personaRole !== 'driver',
      };
    });
  }, []);

  const setPersonaRole = useCallback((personaRole: ShowcasePersonaRole) => {
    setState((s) => {
      // Prevent nested View As — selecting a role replaces the current preview subject.
      const persona = personaFor(s.carrierId, personaRole);
      return {
        ...s,
        personaRole,
        personaId: persona.id,
        viewAsActive: personaRole !== 'driver',
      };
    });
  }, []);

  const setScenario = useCallback((scenarioId: ScenarioId) => {
    setState((s) => ({ ...s, scenarioId }));
  }, []);

  const resetShowcase = useCallback(() => {
    setState((s) => ({
      ...s,
      ...baselineState(),
      active: s.active,
      grantValid: s.grantValid,
    }));
  }, []);

  const value = useMemo(
    () => ({
      state,
      enterShowcase,
      exitShowcase,
      setCarrier,
      setPersonaRole,
      setScenario,
      resetShowcase,
      isShowcaseActive: state.active && state.grantValid,
    }),
    [
      state,
      enterShowcase,
      exitShowcase,
      setCarrier,
      setPersonaRole,
      setScenario,
      resetShowcase,
    ]
  );

  return <ShowcaseContext.Provider value={value}>{children}</ShowcaseContext.Provider>;
};

export function useShowcase(): ShowcaseContextValue {
  const ctx = useContext(ShowcaseContext);
  if (!ctx) throw new Error('useShowcase must be used within ShowcaseProvider');
  return ctx;
}

export function useShowcaseOptional(): ShowcaseContextValue | null {
  return useContext(ShowcaseContext);
}
