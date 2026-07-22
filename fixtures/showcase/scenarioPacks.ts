import type { MissionControlViewModel } from '../../types/missionControl.ts';
import type { CarrierId, ScenarioId } from '../../types/showcase.ts';
import { CARRIER_DEMO_CONFIG } from './personas.ts';
import type {
  AssistantTurn,
  BenefitItem,
  DocumentItem,
  HomeTimeRequestView,
  LoadListItem,
  MessageItem,
  PaySummaryView,
  PerformanceView,
  SafetyStatusView,
  TimelineEvent,
  TruckStatusView,
} from '../../services/dataSource/types.ts';

export interface ShowcaseScenarioPack {
  carrierId: CarrierId;
  scenarioId: ScenarioId;
  mission: MissionControlViewModel;
  loads: LoadListItem[];
  pay: PaySummaryView;
  messages: MessageItem[];
  truck: TruckStatusView;
  safety: SafetyStatusView;
  homeTime: HomeTimeRequestView;
  benefits: BenefitItem[];
  documents: DocumentItem[];
  performance: PerformanceView;
  timeline: TimelineEvent[];
  assistant: AssistantTurn[];
}

type Seed = {
  loadNum: string;
  origin: string;
  destination: string;
  truck: string;
  trailer: string;
};

const SEEDS: Record<CarrierId, Seed> = {
  GLX: {
    loadNum: 'GLX-7721',
    origin: 'Columbus, OH',
    destination: 'Charlotte, NC',
    truck: 'GLX-441',
    trailer: 'GLX-T19',
  },
  BST: {
    loadNum: 'BST-48291',
    origin: 'Dallas, TX',
    destination: 'Atlanta, GA',
    truck: 'T-204',
    trailer: 'TR-881',
  },
};

function baseMission(
  carrierId: CarrierId,
  displayName: string,
  patch: Partial<MissionControlViewModel>
): MissionControlViewModel {
  const cfg = CARRIER_DEMO_CONFIG[carrierId];
  const seed = SEEDS[carrierId];
  return {
    driverDisplayName: displayName,
    companyLabel: cfg.displayName,
    connectionLabel: 'Device online',
    dataCapability: 'DEMONSTRATION',
    exceptions: [],
    activeHaul: {
      loadNum: seed.loadNum,
      loadId: `DEMO-${seed.loadNum}`,
      statusLabel: 'En route',
      origin: seed.origin,
      destination: seed.destination,
      nextMilestone: 'Next stop',
      appointmentLabel: 'Today · afternoon',
      countdownLabel: 'On schedule',
      truckNumber: seed.truck,
      trailerNumber: seed.trailer,
      missingDocuments: [],
      brokerLabel: cfg.displayName,
      demoCommodity: carrierId === 'GLX' ? 'Retail dry van' : 'General freight',
      demoWeightLabel: carrierId === 'GLX' ? '38,400 lbs' : '41,200 lbs',
      demoTempLabel: '—',
      demoGrossLabel: carrierId === 'GLX' ? '$2,410.00' : '$2,850.00',
      milestones: [
        { id: 'pu', label: 'Pickup', state: 'done' },
        { id: 'scale', label: 'Scale check', state: 'done' },
        { id: 'del', label: 'Delivery', state: 'upcoming' },
      ],
    },
    primaryAction: {
      label: 'Open Capture',
      href: '/showcase/capture',
      helperText: 'SIMULATED ACTION · not a production upload',
      capability: 'DEMONSTRATION',
      submissionType: 'BOL_POD',
      variant: 'primary',
    },
    earnings: {
      capability: 'DEMONSTRATION',
      periodLabel: 'This settlement period',
      projectedLabel: carrierId === 'GLX' ? '$4,820' : '$5,140',
      note: 'DEMONSTRATION DATA — not live pay.',
    },
    tasks: [
      {
        id: `${carrierId}-task-check`,
        title: 'Confirm appointment',
        detail: `${seed.loadNum} · receiver window`,
        urgency: 'due_soon',
      },
    ],
    ...patch,
  };
}

function applyScenario(
  carrierId: CarrierId,
  scenarioId: ScenarioId,
  displayName: string
): MissionControlViewModel {
  const seed = SEEDS[carrierId];
  const cfg = CARRIER_DEMO_CONFIG[carrierId];

  switch (scenarioId) {
    case 'urgent_pod':
      return baseMission(carrierId, displayName, {
        exceptions: [
          {
            id: `${carrierId}-ex-pod`,
            severity: 'critical',
            title: 'Delivery POD required immediately',
            detail: `${seed.loadNum} arrived at facility. Upload signed POD (simulated) to keep settlement on track.`,
            actionLabel: 'Simulate POD upload',
            actionHref: '/showcase/capture',
            submissionType: 'BOL_POD',
            loadNum: seed.loadNum,
          },
        ],
        activeHaul: {
          ...baseMission(carrierId, displayName, {}).activeHaul!,
          statusLabel: 'At delivery facility',
          nextMilestone: 'POD upload',
          missingDocuments: ['POD'],
          milestones: [
            { id: 'pu', label: 'Pickup', state: 'done' },
            { id: 'scale', label: 'Scale check', state: 'done' },
            { id: 'del', label: 'Delivery', state: 'active' },
          ],
        },
        primaryAction: {
          label: 'Simulate Delivery POD',
          href: '/showcase/capture',
          helperText: 'SIMULATED ACTION · Showcase only',
          capability: 'DEMONSTRATION',
          submissionType: 'BOL_POD',
          variant: 'urgent',
        },
        tasks: [
          {
            id: `${carrierId}-task-pod`,
            title: 'Upload POD',
            detail: `${seed.loadNum} · delivery proof`,
            urgency: 'due_now',
            href: '/showcase/capture',
            submissionType: 'BOL_POD',
          },
        ],
      });
    case 'payroll_ready':
      return baseMission(carrierId, displayName, {
        exceptions: [
          {
            id: `${carrierId}-ex-pay`,
            severity: 'info',
            title: 'Settlement packet ready for review',
            detail: `${cfg.displayName} demo settlement is marked payroll-ready (DEMONSTRATION DATA).`,
          },
        ],
        earnings: {
          capability: 'DEMONSTRATION',
          periodLabel: 'Ready for payroll',
          projectedLabel: carrierId === 'GLX' ? '$6,105' : '$6,440',
          note: 'DEMONSTRATION DATA — Showcase payroll preview only.',
        },
        primaryAction: {
          label: 'Review pay demo',
          href: '/showcase/pay',
          helperText: 'FUTURE CAPABILITY layout',
          capability: 'DEMONSTRATION',
          submissionType: 'BOL_POD',
        },
        tasks: [
          {
            id: `${carrierId}-task-pay`,
            title: 'Confirm settlement lines',
            detail: 'Demo payroll checklist',
            urgency: 'due_soon',
            href: '/showcase/pay',
          },
        ],
      });
    case 'maintenance':
      return baseMission(carrierId, displayName, {
        exceptions: [
          {
            id: `${carrierId}-ex-maint`,
            severity: 'warning',
            title: 'Maintenance attention required',
            detail:
              carrierId === 'GLX'
                ? 'DEF sensor warning on GLX-441 (demo).'
                : 'Trailer light circuit fault on TR-881 (demo).',
            actionLabel: 'Open truck demo',
            actionHref: '/showcase/truck',
          },
        ],
        tasks: [
          {
            id: `${carrierId}-task-maint`,
            title: 'Log maintenance request',
            detail: 'SIMULATED ACTION',
            urgency: 'due_now',
            href: '/showcase/truck',
          },
        ],
      });
    case 'safety_review':
      return baseMission(carrierId, displayName, {
        exceptions: [
          {
            id: `${carrierId}-ex-safety`,
            severity: 'warning',
            title: 'Safety review pending',
            detail: 'Complete the demo safety acknowledgement before next dispatch.',
            actionLabel: 'Open safety',
            actionHref: '/showcase/safety',
          },
        ],
        tasks: [
          {
            id: `${carrierId}-task-safety`,
            title: 'Acknowledge safety bulletin',
            detail: 'DEMONSTRATION DATA',
            urgency: 'due_now',
            href: '/showcase/safety',
          },
        ],
      });
    case 'road_breakdown':
      return baseMission(carrierId, displayName, {
        exceptions: [
          {
            id: `${carrierId}-ex-break`,
            severity: 'critical',
            title: 'Roadside assistance requested',
            detail:
              carrierId === 'GLX'
                ? 'Demo: tractor derate near I-77 mile 42.'
                : 'Demo: flat on I-20 eastbound.',
          },
        ],
        activeHaul: {
          ...baseMission(carrierId, displayName, {}).activeHaul!,
          statusLabel: 'Breakdown — stopped',
          countdownLabel: 'ETA paused',
        },
      });
    case 'storm_delay':
      return baseMission(carrierId, displayName, {
        exceptions: [
          {
            id: `${carrierId}-ex-storm`,
            severity: 'warning',
            title: 'Weather delay',
            detail: 'Severe weather corridor — appointment may slip (demo).',
          },
        ],
        activeHaul: {
          ...baseMission(carrierId, displayName, {}).activeHaul!,
          statusLabel: 'Delayed — weather',
          countdownLabel: '+2h 15m risk',
        },
      });
    case 'missing_paperwork':
      return baseMission(carrierId, displayName, {
        exceptions: [
          {
            id: `${carrierId}-ex-docs`,
            severity: 'critical',
            title: 'Missing paperwork',
            detail: 'BOL photo incomplete in demo packet.',
            actionLabel: 'Open documents',
            actionHref: '/showcase/documents',
          },
        ],
        activeHaul: {
          ...baseMission(carrierId, displayName, {}).activeHaul!,
          missingDocuments: ['BOL', 'POD'],
        },
      });
    case 'perfect_week':
      return baseMission(carrierId, displayName, {
        exceptions: [],
        earnings: {
          capability: 'DEMONSTRATION',
          periodLabel: 'Perfect week demo',
          projectedLabel: carrierId === 'GLX' ? '$7,250' : '$7,680',
          note: 'DEMONSTRATION DATA — aspirational showcase week.',
        },
        tasks: [
          {
            id: `${carrierId}-task-ok`,
            title: 'No urgent items',
            detail: 'All demo checkpoints clear',
            urgency: 'due_soon',
          },
        ],
      });
    case 'new_driver':
      return baseMission(carrierId, displayName, {
        exceptions: [
          {
            id: `${carrierId}-ex-onboard`,
            severity: 'info',
            title: 'New driver onboarding',
            detail: 'Complete orientation checklist (FUTURE CAPABILITY).',
            actionLabel: 'Open assistant',
            actionHref: '/showcase/assistant',
          },
        ],
        tasks: [
          {
            id: `${carrierId}-task-train`,
            title: 'Finish training module',
            detail: 'SIMULATED ACTION',
            urgency: 'due_now',
            href: '/showcase/assistant',
          },
        ],
      });
    case 'normal':
    default:
      return baseMission(carrierId, displayName, {});
  }
}

export function buildShowcasePack(
  carrierId: CarrierId,
  scenarioId: ScenarioId,
  displayName: string
): ShowcaseScenarioPack {
  const seed = SEEDS[carrierId];
  const cfg = CARRIER_DEMO_CONFIG[carrierId];
  const mission = applyScenario(carrierId, scenarioId, displayName);

  return {
    carrierId,
    scenarioId,
    mission,
    loads: [
      {
        id: `${carrierId}-load-active`,
        carrierId,
        loadNum: seed.loadNum,
        origin: seed.origin,
        destination: seed.destination,
        statusLabel: mission.activeHaul?.statusLabel || 'Active',
        disclosure: 'DEMONSTRATION DATA',
      },
      {
        id: `${carrierId}-load-hist`,
        carrierId,
        loadNum: carrierId === 'GLX' ? 'GLX-7602' : 'BST-47110',
        origin: carrierId === 'GLX' ? 'Indianapolis, IN' : 'Houston, TX',
        destination: carrierId === 'GLX' ? 'Nashville, TN' : 'Memphis, TN',
        statusLabel: 'Delivered',
        disclosure: 'DEMONSTRATION DATA',
      },
    ],
    pay: {
      disclosure: 'DEMONSTRATION DATA',
      periodLabel: mission.earnings.periodLabel,
      grossLabel: mission.earnings.projectedLabel,
      deductionsLabel: carrierId === 'GLX' ? '$410' : '$520',
      netLabel: carrierId === 'GLX' ? '$4,410' : '$4,620',
      note: mission.earnings.note,
    },
    messages: [
      {
        id: `${carrierId}-msg-1`,
        carrierId,
        from: cfg.displayName + ' Dispatch',
        subject:
          scenarioId === 'storm_delay' ? 'Weather advisory' : 'Dispatch note',
        preview:
          scenarioId === 'urgent_pod'
            ? `POD needed for ${seed.loadNum}`
            : 'Demo message — not production SMS/email.',
        unread: scenarioId !== 'perfect_week',
        disclosure: 'DEMONSTRATION DATA',
      },
      {
        id: `${carrierId}-msg-2`,
        carrierId,
        from: 'ELM CONNECT Showcase',
        subject: 'How Showcase Mode works',
        preview: 'NOT CONNECTED TO PRODUCTION',
        unread: false,
        disclosure: 'NOT CONNECTED TO PRODUCTION',
      },
    ],
    truck: {
      carrierId,
      truckNumber: seed.truck,
      trailerNumber: seed.trailer,
      statusLabel:
        scenarioId === 'maintenance' || scenarioId === 'road_breakdown'
          ? 'Attention required'
          : 'In service',
      nextServiceLabel: carrierId === 'GLX' ? 'Oil · 2,400 mi' : 'PM · 1,800 mi',
      disclosure: 'DEMONSTRATION DATA',
    },
    safety: {
      carrierId,
      scoreLabel: scenarioId === 'safety_review' ? 'Review open' : 'Clear',
      openItems:
        scenarioId === 'safety_review'
          ? ['Bulletin acknowledgement', 'DVIR sign-off']
          : [],
      disclosure: 'FUTURE CAPABILITY',
    },
    homeTime: {
      carrierId,
      statusLabel: scenarioId === 'perfect_week' ? 'Approved (demo)' : 'None pending',
      requestedWindow: carrierId === 'GLX' ? 'Fri 18:00 – Sun 12:00' : 'Sat – Mon',
      disclosure: 'FUTURE CAPABILITY',
    },
    benefits: [
      {
        id: `${carrierId}-ben-1`,
        carrierId,
        title: carrierId === 'GLX' ? 'GLX health contribution' : 'BST health contribution',
        detail: 'FUTURE CAPABILITY — not a live benefits feed.',
        disclosure: 'FUTURE CAPABILITY',
      },
    ],
    documents: [
      {
        id: `${carrierId}-doc-1`,
        carrierId,
        title: `${seed.loadNum} packet`,
        statusLabel:
          scenarioId === 'missing_paperwork' ? 'Incomplete' : 'Ready (demo)',
        disclosure: 'DEMONSTRATION DATA',
      },
    ],
    performance: {
      carrierId,
      onTimeLabel: scenarioId === 'perfect_week' ? '100%' : '94%',
      safetyLabel: scenarioId === 'safety_review' ? 'Review' : 'Good',
      note: 'DEMONSTRATION DATA — Showcase scorecard only.',
      disclosure: 'DEMONSTRATION DATA',
    },
    timeline: [
      {
        id: `${carrierId}-tl-1`,
        carrierId,
        whenLabel: 'Today · morning',
        title: 'Departed pickup',
        detail: seed.origin,
        disclosure: 'DEMONSTRATION DATA',
      },
      {
        id: `${carrierId}-tl-2`,
        carrierId,
        whenLabel: 'Today · midday',
        title:
          scenarioId === 'road_breakdown' ? 'Breakdown logged' : 'Scale check complete',
        detail: seed.loadNum,
        disclosure: 'DEMONSTRATION DATA',
      },
    ],
    assistant: [
      {
        id: `${carrierId}-ai-1`,
        role: 'assistant',
        text: `Showcase assistant for ${cfg.displayName}. Responses are SIMULATED ACTION only.`,
        disclosure: 'SIMULATED ACTION',
      },
    ],
  };
}
