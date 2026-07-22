import { buildShowcasePack } from '../../fixtures/showcase/scenarioPacks.ts';
import type { CarrierId, ScenarioId, ShowcasePersonaRole } from '../../types/showcase.ts';
import { personaFor } from '../../fixtures/showcase/personas.ts';
import type { DriverDataSource } from './types.ts';

export function createShowcaseDriverDataSource(opts: {
  carrierId: CarrierId;
  personaRole: ShowcasePersonaRole;
  scenarioId: ScenarioId;
}): DriverDataSource {
  const persona = personaFor(opts.carrierId, opts.personaRole);
  const pack = buildShowcasePack(opts.carrierId, opts.scenarioId, persona.displayName);

  return {
    mode: 'showcase',
    getMissionControl: () => pack.mission,
    getLoads: () => pack.loads,
    getPaySummary: () => pack.pay,
    getCaptureModules: () => [
      {
        id: 'bol-pod-sim',
        title: 'BOL / POD (simulated)',
        description: 'SIMULATED ACTION — does not call production upload.',
        href: '/showcase/capture',
        capability: 'SIMULATED ACTION',
      },
      {
        id: 'expense-sim',
        title: 'Expenses (simulated)',
        description: 'SIMULATED ACTION — Showcase only.',
        href: '/showcase/capture',
        capability: 'SIMULATED ACTION',
      },
    ],
    getMessages: () => pack.messages,
    getTruckStatus: () => pack.truck,
    getSafetyStatus: () => pack.safety,
    getHomeTime: () => pack.homeTime,
    getBenefits: () => pack.benefits,
    getDocuments: () => pack.documents,
    getPerformance: () => pack.performance,
    getTimeline: () => pack.timeline,
    getAssistantThread: () => pack.assistant,
  };
}
