import { buildShowcasePack } from '../../fixtures/showcase/scenarioPacks.ts';
import type { CarrierId, ScenarioId, ShowcasePersonaRole } from '../../types/showcase.ts';
import { personaFor } from '../../fixtures/showcase/personas.ts';
import type { CaptureModuleInfo, DriverDataSource } from './types.ts';

export function createShowcaseDriverDataSource(opts: {
  carrierId: CarrierId;
  personaRole: ShowcasePersonaRole;
  scenarioId: ScenarioId;
}): DriverDataSource {
  const persona = personaFor(opts.carrierId, opts.personaRole);
  const pack = buildShowcasePack(opts.carrierId, opts.scenarioId, persona.displayName);
  const activeLoadNum = pack.mission.activeHaul?.loadNum;

  const captureModules: CaptureModuleInfo[] = [
    {
      id: 'bol-pod-sim',
      title: 'BOL / POD (simulated)',
      description: 'Simulated action — does not call production upload.',
      href: '/showcase/capture',
      capability: 'SIMULATED ACTION',
      priority: 'required',
      contextLabel: activeLoadNum ? `${activeLoadNum} · current haul` : 'Current haul',
      recentStatusLabel: pack.mission.activeHaul?.missingDocuments?.length
        ? `Missing: ${pack.mission.activeHaul.missingDocuments.join(', ')} (demo)`
        : 'No missing documents on file (demo)',
      guidanceLabel: 'Capture all four corners of the signed document in good light.',
    },
    {
      id: 'receipts-sim',
      title: 'Receipts (simulated)',
      description: 'Simulated action — Showcase only.',
      href: '/showcase/capture',
      capability: 'SIMULATED ACTION',
      priority: 'optional',
      contextLabel: 'Fuel, tolls, lumper, and repair receipts',
      recentStatusLabel: 'Demo reimbursement pending review',
      guidanceLabel: 'Submit receipts the same day to keep the demo settlement timeline accurate.',
    },
    {
      id: 'freight-photos-sim',
      title: 'Freight photos (simulated)',
      description: 'Simulated action — records condition-at-pickup demo photos.',
      href: '/showcase/capture',
      capability: 'SIMULATED ACTION',
      priority: 'optional',
      contextLabel: activeLoadNum ? `${activeLoadNum} · load condition` : 'Load condition',
      recentStatusLabel: 'No demo freight photos on file yet',
      guidanceLabel: 'Photograph seals, load bars, and any visible damage before departure.',
    },
    {
      id: 'inspection-evidence-sim',
      title: 'Inspection evidence (simulated)',
      description: 'Simulated action — pre-trip / post-trip DVIR evidence.',
      href: '/showcase/capture',
      capability: 'SIMULATED ACTION',
      priority: 'available',
      contextLabel: 'Pre-trip and post-trip DVIR support',
      recentStatusLabel: 'Demo DVIR clean · no defects logged',
      guidanceLabel: 'Attach photos for any defect noted on the DVIR.',
    },
    {
      id: 'incident-evidence-sim',
      title: 'Incident evidence (simulated)',
      description: 'Simulated action — records demo incident documentation.',
      href: '/showcase/capture',
      capability: 'SIMULATED ACTION',
      priority: 'available',
      contextLabel: 'Accidents, cargo claims, or roadside events',
      recentStatusLabel: 'No demo incidents on file',
      guidanceLabel: 'Capture wide shots first, then close-ups of any damage or paperwork.',
    },
    {
      id: 'maintenance-evidence-sim',
      title: 'Maintenance evidence (simulated)',
      description: 'Simulated action — records demo shop and roadside repair documentation.',
      href: '/showcase/capture',
      capability: 'SIMULATED ACTION',
      priority: 'available',
      contextLabel: `${pack.truck.truckNumber} / ${pack.truck.trailerNumber}`,
      recentStatusLabel: pack.truck.statusLabel,
      guidanceLabel: 'Include the invoice or work order alongside repair photos.',
    },
  ];

  return {
    mode: 'showcase',
    getMissionControl: () => pack.mission,
    getLoads: () => pack.loads,
    getPaySummary: () => pack.pay,
    getCaptureModules: () => captureModules,
    getMessages: () => pack.messages,
    getTruckStatus: () => pack.truck,
    getSafetyStatus: () => pack.safety,
    getHomeTime: () => pack.homeTime,
    getBenefits: () => pack.benefits,
    getDocuments: () => pack.documents,
    getPerformance: () => pack.performance,
    getTimeline: () => pack.timeline,
    getAssistantThread: () => pack.assistant,
    getNotifications: () => pack.notifications,
    getSearchIndex: () => pack.searchIndex,
    getMoreMenu: () => pack.moreMenu,
  };
}
