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
}

interface ShowcaseContextValue {
  state: ShowcaseState;
  enterShowcase: () => Promise<'ok' | 'denied'>;
  exitShowcase: () => void;
  setCarrier: (id: CarrierId) => void;
  setPersonaRole: (role: ShowcasePersonaRole) => void;
  setScenario: (id: ScenarioId) => void;
  isShowcaseActive: boolean;
}

const ShowcaseContext = createContext<ShowcaseContextValue | null>(null);

const initialState = (): ShowcaseState => {
  const persona = personaFor('GLX', 'driver');
  return {
    active: false,
    grantValid: false,
    carrierId: 'GLX',
    personaRole: 'driver',
    personaId: persona.id,
    scenarioId: 'normal',
  };
};

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
    setState((s) => ({ ...s, active: true, grantValid: true }));
    return 'ok';
  }, [session]);

  const exitShowcase = useCallback(() => {
    setState((s) => ({ ...s, active: false }));
  }, []);

  const setCarrier = useCallback((carrierId: CarrierId) => {
    setState((s) => {
      const persona = personaFor(carrierId, s.personaRole);
      return { ...s, carrierId, personaId: persona.id };
    });
  }, []);

  const setPersonaRole = useCallback((personaRole: ShowcasePersonaRole) => {
    setState((s) => {
      const persona = personaFor(s.carrierId, personaRole);
      return { ...s, personaRole, personaId: persona.id };
    });
  }, []);

  const setScenario = useCallback((scenarioId: ScenarioId) => {
    setState((s) => ({ ...s, scenarioId }));
  }, []);

  const value = useMemo(
    () => ({
      state,
      enterShowcase,
      exitShowcase,
      setCarrier,
      setPersonaRole,
      setScenario,
      isShowcaseActive: state.active && state.grantValid,
    }),
    [state, enterShowcase, exitShowcase, setCarrier, setPersonaRole, setScenario]
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
