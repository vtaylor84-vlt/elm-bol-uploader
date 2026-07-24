import type { MissionControlViewModel } from '../../types/missionControl.ts';
import type { CarrierId, ScenarioId } from '../../types/showcase.ts';
import { CARRIER_DEMO_CONFIG } from './personas.ts';
import { showcaseCountdown } from './clock.ts';
import type {
  AssistantTurn,
  BenefitItem,
  CredentialItem,
  DocumentItem,
  EquipmentDefect,
  HomeTimeRequestView,
  LoadListItem,
  LoadStopView,
  MessageItem,
  MoreMenuGroup,
  NotificationItem,
  PayLineItem,
  PaySummaryView,
  PerformanceView,
  SafetyStatusView,
  SearchResultItem,
  SettlementHistoryItem,
  TimelineEvent,
  TruckStatusView,
} from '../../services/dataSource/types.ts';

/**
 * Showcase scenario pack — pure demonstration data.
 * Extends the original pack shape with notifications, searchIndex, and moreMenu
 * while keeping every existing ScenarioId case coherent and carrier-isolated.
 */
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
  notifications: NotificationItem[];
  searchIndex: SearchResultItem[];
  moreMenu: MoreMenuGroup[];
}

type SeedLoad = {
  loadNum: string;
  origin: string;
  destination: string;
  miles: number;
};

type Seed = {
  loadNum: string;
  origin: string;
  destination: string;
  truck: string;
  trailer: string;
  trailerType: string;
  makeModelLabel: string;
  dispatcherName: string;
  dispatcherPhone: string;
  currentMiles: number;
  currentApptIso: string;
  upcoming: SeedLoad & { apptIso: string };
  completed: SeedLoad[];
};

const SEEDS: Record<CarrierId, Seed> = {
  GLX: {
    loadNum: 'GLX-7721',
    origin: 'Columbus, OH',
    destination: 'Charlotte, NC',
    truck: 'GLX-441',
    trailer: 'GLX-T19',
    trailerType: 'Dry van · 53 ft',
    makeModelLabel: 'Freightliner Cascadia · 2023',
    dispatcherName: 'Dana Whitfield',
    dispatcherPhone: '800-555-0142 ext. 21',
    currentMiles: 448,
    currentApptIso: '2026-07-22T19:00:00.000Z',
    upcoming: {
      loadNum: 'GLX-7810',
      origin: 'Charlotte, NC',
      destination: 'Richmond, VA',
      miles: 214,
      apptIso: '2026-07-23T15:00:00.000Z',
    },
    completed: [
      { loadNum: 'GLX-7602', origin: 'Indianapolis, IN', destination: 'Nashville, TN', miles: 288 },
      { loadNum: 'GLX-7588', origin: 'Louisville, KY', destination: 'Columbus, OH', miles: 195 },
    ],
  },
  BST: {
    loadNum: 'BST-48291',
    origin: 'Dallas, TX',
    destination: 'Atlanta, GA',
    truck: 'T-204',
    trailer: 'TR-881',
    trailerType: 'Reefer · 53 ft',
    makeModelLabel: 'Kenworth T680 · 2022',
    dispatcherName: 'Priya Nathan',
    dispatcherPhone: '800-555-0199 ext. 14',
    currentMiles: 781,
    currentApptIso: '2026-07-22T21:30:00.000Z',
    upcoming: {
      loadNum: 'BST-48355',
      origin: 'Atlanta, GA',
      destination: 'Charlotte, NC',
      miles: 245,
      apptIso: '2026-07-23T17:00:00.000Z',
    },
    completed: [
      { loadNum: 'BST-47110', origin: 'Houston, TX', destination: 'Memphis, TN', miles: 561 },
      { loadNum: 'BST-47098', origin: 'Shreveport, LA', destination: 'Dallas, TX', miles: 189 },
    ],
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
      appointmentLabel: 'Receiver window · today',
      countdownLabel: showcaseCountdown(seed.currentApptIso),
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
      label: 'Upload BOL / POD',
      href: '/showcase/capture',
      helperText: 'Simulated action · not a production upload',
      capability: 'DEMONSTRATION',
      submissionType: 'BOL_POD',
      variant: 'primary',
    },
    earnings: {
      capability: 'DEMONSTRATION',
      periodLabel: 'This settlement period',
      projectedLabel: carrierId === 'GLX' ? '$4,820.00' : '$5,140.00',
      note: 'Demonstration data only — not live pay.',
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
          countdownLabel: 'Arrived — POD needed now',
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
          helperText: 'Simulated action · Showcase only',
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
            detail: `${cfg.displayName} demo settlement is marked payroll-ready (demonstration data only).`,
          },
        ],
        earnings: {
          capability: 'DEMONSTRATION',
          periodLabel: 'Ready for payroll',
          projectedLabel: carrierId === 'GLX' ? '$6,105.00' : '$6,440.00',
          note: 'Demonstration data only — Showcase payroll preview.',
        },
        primaryAction: {
          label: 'Review pay demo',
          href: '/showcase/pay',
          helperText: 'Future capability layout preview',
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
            actionHref: '/showcase/equipment',
          },
        ],
        tasks: [
          {
            id: `${carrierId}-task-maint`,
            title: 'Log maintenance request',
            detail: 'Simulated action',
            urgency: 'due_now',
            href: '/showcase/equipment',
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
            detail: 'Demonstration data only',
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
          projectedLabel: carrierId === 'GLX' ? '$7,250.00' : '$7,680.00',
          note: 'Demonstration data only — aspirational showcase week.',
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
            detail: 'Complete orientation checklist (future capability preview).',
            actionLabel: 'Open assistant',
            actionHref: '/showcase/assistant',
          },
        ],
        tasks: [
          {
            id: `${carrierId}-task-train`,
            title: 'Finish training module',
            detail: 'Simulated action',
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

function buildLoads(
  carrierId: CarrierId,
  scenarioId: ScenarioId,
  seed: Seed,
  mission: MissionControlViewModel
): LoadListItem[] {
  const currentStatus = mission.activeHaul?.statusLabel || 'En route';
  const missingDocs = mission.activeHaul?.missingDocuments ?? [];

  const currentStops: LoadStopView[] = [
    {
      id: `${carrierId}-cur-stop-1`,
      sequence: 1,
      kind: 'pickup',
      locationLabel: seed.origin,
      appointmentLabel: 'Picked up · this morning',
      statusLabel: 'Complete',
      state: 'done',
    },
    {
      id: `${carrierId}-cur-stop-2`,
      sequence: 2,
      kind: 'delivery',
      locationLabel: seed.destination,
      appointmentLabel: `Delivery appt ${showcaseCountdown(seed.currentApptIso)}`,
      statusLabel: scenarioId === 'urgent_pod' ? 'Arrived — awaiting POD' : 'Scheduled',
      state: scenarioId === 'urgent_pod' ? 'active' : 'upcoming',
    },
  ];

  const current: LoadListItem = {
    id: `${carrierId}-load-current`,
    carrierId,
    loadNum: seed.loadNum,
    origin: seed.origin,
    destination: seed.destination,
    statusLabel: currentStatus,
    disclosure: 'DEMONSTRATION DATA',
    bucket: 'current',
    milesLabel: `${seed.currentMiles} mi`,
    stopCount: currentStops.length,
    appointmentLabel: `Delivery ${showcaseCountdown(seed.currentApptIso)}`,
    documentsLabel: missingDocs.length
      ? `Missing: ${missingDocs.join(', ')} (demo)`
      : 'BOL on file · POD pending (demo)',
    earningsEstimateLabel: mission.activeHaul?.demoGrossLabel || (carrierId === 'GLX' ? '$2,410.00' : '$2,850.00'),
    dispatcherLabel: `${seed.dispatcherName} · ${seed.dispatcherPhone}`,
    instructions:
      scenarioId === 'missing_paperwork'
        ? 'Demo note: recheck BOL photo for legibility before pushing to the next stop.'
        : 'Demo note: call receiver 30 minutes out; use dock door per facility signage.',
    stops: currentStops,
    documentRequirements: ['BOL', 'POD'],
  };

  const upcoming: LoadListItem = {
    id: `${carrierId}-load-upcoming`,
    carrierId,
    loadNum: seed.upcoming.loadNum,
    origin: seed.upcoming.origin,
    destination: seed.upcoming.destination,
    statusLabel: 'Dispatched — not started',
    disclosure: 'DEMONSTRATION DATA',
    bucket: 'upcoming',
    milesLabel: `${seed.upcoming.miles} mi`,
    stopCount: 2,
    appointmentLabel: `Pickup ${showcaseCountdown(seed.upcoming.apptIso)}`,
    documentsLabel: 'Rate confirmation on file (demo)',
    earningsEstimateLabel: carrierId === 'GLX' ? '$1,180.00 (est.)' : '$1,340.00 (est.)',
    dispatcherLabel: `${seed.dispatcherName} · ${seed.dispatcherPhone}`,
    instructions: 'Demo note: pre-trip inspection required before departure.',
    stops: [
      {
        id: `${carrierId}-up-stop-1`,
        sequence: 1,
        kind: 'pickup',
        locationLabel: seed.upcoming.origin,
        appointmentLabel: `Pickup ${showcaseCountdown(seed.upcoming.apptIso)}`,
        statusLabel: 'Scheduled',
        state: 'upcoming',
      },
      {
        id: `${carrierId}-up-stop-2`,
        sequence: 2,
        kind: 'delivery',
        locationLabel: seed.upcoming.destination,
        appointmentLabel: 'Delivery window to be confirmed',
        statusLabel: 'Scheduled',
        state: 'upcoming',
      },
    ],
    documentRequirements: ['Rate confirmation', 'BOL'],
  };

  const completed: LoadListItem[] = seed.completed.map((c, idx) => ({
    id: `${carrierId}-load-completed-${idx + 1}`,
    carrierId,
    loadNum: c.loadNum,
    origin: c.origin,
    destination: c.destination,
    statusLabel: 'Delivered',
    disclosure: 'DEMONSTRATION DATA',
    bucket: 'completed' as const,
    milesLabel: `${c.miles} mi`,
    stopCount: 2,
    appointmentLabel: idx === 0 ? 'Delivered · yesterday afternoon' : 'Delivered · last week',
    documentsLabel: 'BOL + POD on file (demo)',
    earningsEstimateLabel:
      idx === 0
        ? carrierId === 'GLX'
          ? '$1,860.00'
          : '$2,040.00'
        : carrierId === 'GLX'
          ? '$1,120.00'
          : '$1,275.00',
    dispatcherLabel: `${seed.dispatcherName} · ${seed.dispatcherPhone}`,
    instructions: 'Demo note: settled load — no action required.',
    stops: [
      {
        id: `${carrierId}-comp${idx + 1}-stop-1`,
        sequence: 1,
        kind: 'pickup' as const,
        locationLabel: c.origin,
        appointmentLabel: 'Picked up',
        statusLabel: 'Complete',
        state: 'done' as const,
      },
      {
        id: `${carrierId}-comp${idx + 1}-stop-2`,
        sequence: 2,
        kind: 'delivery' as const,
        locationLabel: c.destination,
        appointmentLabel: 'Delivered',
        statusLabel: 'Complete',
        state: 'done' as const,
      },
    ],
    documentRequirements: ['BOL', 'POD'],
  }));

  return [current, upcoming, ...completed];
}

function buildPay(
  carrierId: CarrierId,
  scenarioId: ScenarioId,
  seed: Seed,
  mission: MissionControlViewModel
): PaySummaryView {
  const isReady = scenarioId === 'payroll_ready';
  const gross = mission.earnings.projectedLabel;
  const deductions = carrierId === 'GLX' ? '$410.00' : '$520.00';
  const net = carrierId === 'GLX' ? '$4,410.00' : '$4,620.00';

  const lineItems: PayLineItem[] = [
    {
      id: `${carrierId}-pay-li-1`,
      category: 'trip',
      label: `Line haul · ${seed.loadNum}`,
      amountLabel: mission.activeHaul?.demoGrossLabel || gross,
      statusLabel: scenarioId === 'urgent_pod' ? 'Pending POD' : 'Pending delivery',
      relatedLoadNum: seed.loadNum,
    },
    {
      id: `${carrierId}-pay-li-2`,
      category: 'trip',
      label: `Line haul · ${seed.completed[0].loadNum}`,
      amountLabel: carrierId === 'GLX' ? '$1,860.00' : '$2,040.00',
      statusLabel: 'Settled',
      relatedLoadNum: seed.completed[0].loadNum,
    },
    {
      id: `${carrierId}-pay-li-3`,
      category: 'reimbursement',
      label: 'Fuel receipt reimbursement',
      amountLabel: carrierId === 'GLX' ? '$186.40' : '$212.10',
      statusLabel: 'Awaiting review',
    },
    {
      id: `${carrierId}-pay-li-4`,
      category: 'deduction',
      label: 'Cargo insurance',
      amountLabel: carrierId === 'GLX' ? '-$65.00' : '-$72.00',
      statusLabel: 'Recurring',
    },
    {
      id: `${carrierId}-pay-li-5`,
      category: 'escrow',
      label: 'Escrow contribution',
      amountLabel: carrierId === 'GLX' ? '$75.00' : '$90.00',
      statusLabel: 'Held',
    },
    {
      id: `${carrierId}-pay-li-6`,
      category: 'savings',
      label: 'Savings auto-transfer',
      amountLabel: carrierId === 'GLX' ? '$50.00' : '$60.00',
      statusLabel: 'Scheduled',
    },
    {
      id: `${carrierId}-pay-li-7`,
      category: 'bonus',
      label: scenarioId === 'perfect_week' ? 'Safety bonus (demo)' : 'Fuel efficiency bonus (demo)',
      amountLabel:
        scenarioId === 'perfect_week'
          ? carrierId === 'GLX'
            ? '$150.00'
            : '$175.00'
          : carrierId === 'GLX'
            ? '$40.00'
            : '$45.00',
      statusLabel: 'Pending qualification',
    },
  ];

  const timelineSteps = [
    { id: `${carrierId}-step-delivered`, label: 'Load delivered', state: (scenarioId === 'urgent_pod' ? 'active' : 'done') as 'done' | 'active' | 'upcoming' },
    { id: `${carrierId}-step-pod`, label: 'POD submitted', state: (scenarioId === 'urgent_pod' ? 'upcoming' : 'done') as 'done' | 'active' | 'upcoming' },
    { id: `${carrierId}-step-calc`, label: 'Settlement calculated', state: (isReady ? 'done' : 'active') as 'done' | 'active' | 'upcoming' },
    { id: `${carrierId}-step-payroll`, label: 'Payroll processed', state: (isReady ? 'active' : 'upcoming') as 'done' | 'active' | 'upcoming' },
    { id: `${carrierId}-step-deposit`, label: 'Direct deposit', state: 'upcoming' as 'done' | 'active' | 'upcoming' },
  ];

  const history: SettlementHistoryItem[] = [
    {
      id: `${carrierId}-settle-1`,
      periodLabel: 'Last settlement',
      netLabel: carrierId === 'GLX' ? '$4,180.00' : '$4,390.00',
      statusLabel: 'paid',
    },
    {
      id: `${carrierId}-settle-2`,
      periodLabel: 'Two periods ago',
      netLabel: carrierId === 'GLX' ? '$3,960.00' : '$4,510.00',
      statusLabel: 'paid',
    },
    {
      id: `${carrierId}-settle-3`,
      periodLabel: 'This period (in progress)',
      netLabel: net,
      statusLabel: isReady ? 'approved' : 'estimated',
    },
  ];

  return {
    disclosure: 'DEMONSTRATION DATA',
    periodLabel: mission.earnings.periodLabel,
    grossLabel: gross,
    deductionsLabel: deductions,
    netLabel: net,
    note: 'Demonstration data only — settlement figures are illustrative, not live payroll.',
    estimatedEarningsLabel: gross,
    reimbursementsPendingLabel: carrierId === 'GLX' ? '$186.40' : '$212.10',
    escrowBalanceLabel: carrierId === 'GLX' ? '$1,275.00' : '$1,410.00',
    savingsBalanceLabel: carrierId === 'GLX' ? '$860.00' : '$945.00',
    ytdLabel: carrierId === 'GLX' ? '$148,220.00' : '$156,410.00',
    payrollStatusLabel: isReady ? 'Ready for payroll (demo)' : 'In progress (demo)',
    timelineSteps,
    lineItems,
    history,
  };
}

function buildMessages(
  carrierId: CarrierId,
  scenarioId: ScenarioId,
  seed: Seed,
  cfg: (typeof CARRIER_DEMO_CONFIG)[CarrierId]
): MessageItem[] {
  const dispatchSubject =
    scenarioId === 'storm_delay'
      ? 'Weather advisory — route watch'
      : scenarioId === 'road_breakdown'
        ? 'Roadside assistance dispatched'
        : 'Dispatch note';
  const dispatchPreview =
    scenarioId === 'urgent_pod'
      ? `POD needed for ${seed.loadNum} — please upload once signed.`
      : scenarioId === 'road_breakdown'
        ? 'Roadside vendor is en route to your location (demo).'
        : 'Demo dispatch note — check load details before departure.';

  return [
    {
      id: `${carrierId}-msg-dispatch`,
      carrierId,
      from: `${cfg.displayName} Dispatch`,
      subject: dispatchSubject,
      preview: dispatchPreview,
      body: `${dispatchPreview} This message is demonstration data only — it never reaches a real dispatch inbox.`,
      unread: scenarioId !== 'perfect_week',
      disclosure: 'DEMONSTRATION DATA',
      category: 'dispatch',
      priority: scenarioId === 'urgent_pod' || scenarioId === 'road_breakdown' ? 'urgent' : 'normal',
      ackRequired: scenarioId === 'urgent_pod',
      relatedLoadNum: seed.loadNum,
    },
    {
      id: `${carrierId}-msg-payroll`,
      carrierId,
      from: `${cfg.displayName} Payroll`,
      subject: scenarioId === 'payroll_ready' ? 'Settlement ready for review' : 'Upcoming settlement preview',
      preview:
        scenarioId === 'payroll_ready'
          ? 'Your demo settlement packet is marked payroll-ready.'
          : 'Demo settlement preview available in Pay.',
      body: 'Demonstration data only — no real settlement was calculated or transmitted.',
      unread: scenarioId === 'payroll_ready',
      disclosure: 'DEMONSTRATION DATA',
      category: 'payroll',
      priority: 'normal',
      ackRequired: false,
      relatedLoadNum: seed.completed[0].loadNum,
    },
    {
      id: `${carrierId}-msg-safety`,
      carrierId,
      from: `${cfg.displayName} Safety`,
      subject: scenarioId === 'safety_review' ? 'Safety review required' : 'Monthly safety bulletin',
      preview:
        scenarioId === 'safety_review'
          ? 'Acknowledge the open safety bulletin before your next dispatch.'
          : 'Demo reminder: review hours-of-service basics.',
      body: 'Demonstration data only — acknowledging this message does not update any real safety record.',
      unread: scenarioId === 'safety_review',
      disclosure: 'DEMONSTRATION DATA',
      category: 'safety',
      priority: scenarioId === 'safety_review' ? 'high' : 'normal',
      ackRequired: scenarioId === 'safety_review',
    },
    {
      id: `${carrierId}-msg-maintenance`,
      carrierId,
      from: `${cfg.displayName} Maintenance`,
      subject: scenarioId === 'maintenance' ? 'Maintenance follow-up needed' : 'Service reminder',
      preview:
        scenarioId === 'maintenance'
          ? carrierId === 'GLX'
            ? 'DEF sensor warning on GLX-441 needs a shop visit (demo).'
            : 'Trailer light circuit fault on TR-881 needs attention (demo).'
          : `${seed.truck} is due for scheduled service soon (demo).`,
      body: 'Demonstration data only — no work order was created.',
      unread: scenarioId === 'maintenance',
      disclosure: 'DEMONSTRATION DATA',
      category: 'maintenance',
      priority: scenarioId === 'maintenance' ? 'high' : 'normal',
      ackRequired: false,
      relatedEquipment: seed.truck,
      hasAttachment: scenarioId === 'maintenance',
    },
    {
      id: `${carrierId}-msg-announcement`,
      carrierId,
      from: 'ELM CONNECT',
      subject: 'How Showcase Mode works',
      preview: 'This inbox is demonstration data only — nothing here is a live message.',
      body: 'Showcase Mode presents demonstration data only. Nothing in this inbox is a live dispatch, payroll, or safety message.',
      unread: false,
      disclosure: 'DEMONSTRATION DATA',
      category: 'announcement',
      priority: 'normal',
      ackRequired: false,
    },
  ];
}

function buildTruck(carrierId: CarrierId, scenarioId: ScenarioId, seed: Seed): TruckStatusView {
  const attention = scenarioId === 'maintenance' || scenarioId === 'road_breakdown';

  const defects: EquipmentDefect[] = attention
    ? [
        {
          id: `${carrierId}-defect-1`,
          label: carrierId === 'GLX' ? 'DEF sensor warning' : 'Trailer light circuit fault',
          severity: scenarioId === 'road_breakdown' ? 'critical' : 'major',
          statusLabel:
            scenarioId === 'road_breakdown' ? 'Roadside vendor dispatched (demo)' : 'Shop visit scheduled (demo)',
        },
      ]
    : [
        {
          id: `${carrierId}-defect-minor`,
          label: 'Cab air filter due',
          severity: 'minor',
          statusLabel: 'Monitor at next PM (demo)',
        },
      ];

  return {
    carrierId,
    truckNumber: seed.truck,
    trailerNumber: seed.trailer,
    statusLabel: attention ? 'Attention required' : 'In service',
    nextServiceLabel: carrierId === 'GLX' ? 'Oil change · 2,400 mi remaining' : 'PM service · 1,800 mi remaining',
    disclosure: 'DEMONSTRATION DATA',
    odometerLabel: carrierId === 'GLX' ? '412,880 mi (demo)' : '298,410 mi (demo)',
    fuelLevelLabel: scenarioId === 'road_breakdown' ? '½ tank (stopped)' : '¾ tank',
    dvirStatusLabel: attention ? 'Defect logged — needs review' : 'Pre-trip clean · no defects',
    makeModelLabel: seed.makeModelLabel,
    defects,
    maintenanceDueLabel:
      carrierId === 'GLX' ? 'Annual DOT inspection · 34 days (demo)' : 'Annual DOT inspection · 51 days (demo)',
    roadsideLabel:
      scenarioId === 'road_breakdown'
        ? carrierId === 'GLX'
          ? 'Roadside vendor en route — I-77 mile 42 (demo)'
          : 'Roadside vendor en route — I-20 eastbound (demo)'
        : 'No roadside events open',
    documentLabels: ['Annual inspection cert.', 'Registration', 'IFTA sticker'],
  };
}

function buildSafety(carrierId: CarrierId, scenarioId: ScenarioId): SafetyStatusView {
  const reviewOpen = scenarioId === 'safety_review';

  const credentials: CredentialItem[] = [
    {
      id: `${carrierId}-cred-cdl`,
      title: 'CDL',
      statusLabel: 'Valid (demo)',
      expiresLabel: carrierId === 'GLX' ? 'Expires 2028-03-14' : 'Expires 2027-11-02',
      urgency: 'ok',
    },
    {
      id: `${carrierId}-cred-medcard`,
      title: 'Medical certificate',
      statusLabel: 'Approaching expiration (demo)',
      expiresLabel: 'Expires in 19 days',
      urgency: 'soon',
    },
    {
      id: `${carrierId}-cred-hazmat`,
      title: 'Hazmat endorsement',
      statusLabel: carrierId === 'GLX' ? 'Not applicable' : 'Valid (demo)',
      expiresLabel: carrierId === 'GLX' ? '—' : 'Expires 2027-06-30',
      urgency: 'ok',
    },
  ];

  return {
    carrierId,
    scoreLabel: reviewOpen ? 'Review open (demo)' : 'Clear (demo)',
    openItems: reviewOpen ? ['Bulletin acknowledgement', 'DVIR sign-off'] : [],
    disclosure: 'FUTURE CAPABILITY',
    hosDriveRemainingLabel: '6h 15m drive remaining (demo)',
    hosShiftRemainingLabel: '9h 40m shift remaining (demo)',
    credentials,
    trainingDueLabel: reviewOpen ? 'Defensive driving refresher due (demo)' : 'No training currently due (demo)',
    inspectionHistoryLabel: '3 roadside inspections in past 12 months · 0 violations (demo)',
    trendNote:
      'Demo compliance snapshot — an illustrative summary, not a real safety score or performance judgment.',
  };
}

function buildBenefits(carrierId: CarrierId): BenefitItem[] {
  return [
    {
      id: `${carrierId}-ben-health`,
      carrierId,
      title: carrierId === 'GLX' ? 'GLX health contribution' : 'BST health contribution',
      detail: 'Future capability preview — not a live benefits feed.',
      disclosure: 'FUTURE CAPABILITY',
    },
    {
      id: `${carrierId}-ben-retirement`,
      carrierId,
      title: '401(k) matching (preview)',
      detail: 'Future capability preview — illustrative plan summary only.',
      disclosure: 'FUTURE CAPABILITY',
    },
  ];
}

function buildDocuments(carrierId: CarrierId, scenarioId: ScenarioId, seed: Seed): DocumentItem[] {
  return [
    {
      id: `${carrierId}-doc-current-bol`,
      carrierId,
      title: `${seed.loadNum} · BOL`,
      statusLabel: scenarioId === 'missing_paperwork' ? 'Incomplete — photo unclear (demo)' : 'On file (demo)',
      disclosure: 'DEMONSTRATION DATA',
    },
    {
      id: `${carrierId}-doc-current-pod`,
      carrierId,
      title: `${seed.loadNum} · POD`,
      statusLabel:
        scenarioId === 'urgent_pod' || scenarioId === 'missing_paperwork' ? 'Missing (demo)' : 'On file (demo)',
      disclosure: 'DEMONSTRATION DATA',
    },
    {
      id: `${carrierId}-doc-rate-conf`,
      carrierId,
      title: `${seed.upcoming.loadNum} · Rate confirmation`,
      statusLabel: 'On file (demo)',
      disclosure: 'DEMONSTRATION DATA',
    },
    {
      id: `${carrierId}-doc-completed`,
      carrierId,
      title: `${seed.completed[0].loadNum} · BOL + POD packet`,
      statusLabel: 'Settled (demo)',
      disclosure: 'DEMONSTRATION DATA',
    },
  ];
}

function buildPerformance(carrierId: CarrierId, scenarioId: ScenarioId): PerformanceView {
  return {
    carrierId,
    onTimeLabel: scenarioId === 'perfect_week' ? '100% (demo)' : '94% (demo)',
    safetyLabel: scenarioId === 'safety_review' ? 'Review (demo)' : 'Good (demo)',
    note: 'Demonstration data only — Showcase scorecard, not a live scorecard.',
    disclosure: 'DEMONSTRATION DATA',
  };
}

function buildTimeline(carrierId: CarrierId, scenarioId: ScenarioId, seed: Seed): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      id: `${carrierId}-tl-1`,
      carrierId,
      whenLabel: 'Today · early morning',
      title: 'Pre-trip inspection completed',
      detail: `${seed.truck} · no defects logged`,
      disclosure: 'DEMONSTRATION DATA',
    },
    {
      id: `${carrierId}-tl-2`,
      carrierId,
      whenLabel: 'Today · morning',
      title: 'Departed pickup',
      detail: seed.origin,
      disclosure: 'DEMONSTRATION DATA',
    },
    {
      id: `${carrierId}-tl-3`,
      carrierId,
      whenLabel: 'Today · midday',
      title: scenarioId === 'road_breakdown' ? 'Breakdown logged' : 'Scale check complete',
      detail: seed.loadNum,
      disclosure: 'DEMONSTRATION DATA',
    },
  ];

  const scenarioEvent: TimelineEvent | null = (() => {
    switch (scenarioId) {
      case 'urgent_pod':
        return {
          id: `${carrierId}-tl-scenario`,
          carrierId,
          whenLabel: 'Today · afternoon',
          title: 'Arrived at delivery facility',
          detail: `${seed.loadNum} · POD upload requested`,
          disclosure: 'DEMONSTRATION DATA',
        };
      case 'storm_delay':
        return {
          id: `${carrierId}-tl-scenario`,
          carrierId,
          whenLabel: 'Today · afternoon',
          title: 'Weather advisory issued',
          detail: 'Route watch active — appointment may slip (demo)',
          disclosure: 'DEMONSTRATION DATA',
        };
      case 'missing_paperwork':
        return {
          id: `${carrierId}-tl-scenario`,
          carrierId,
          whenLabel: 'Today · afternoon',
          title: 'Document flagged for review',
          detail: `${seed.loadNum} · BOL photo unclear`,
          disclosure: 'DEMONSTRATION DATA',
        };
      case 'maintenance':
        return {
          id: `${carrierId}-tl-scenario`,
          carrierId,
          whenLabel: 'Today · afternoon',
          title: 'Maintenance defect logged',
          detail: seed.truck,
          disclosure: 'DEMONSTRATION DATA',
        };
      case 'safety_review':
        return {
          id: `${carrierId}-tl-scenario`,
          carrierId,
          whenLabel: 'Today · afternoon',
          title: 'Safety bulletin issued',
          detail: 'Acknowledgement pending (demo)',
          disclosure: 'DEMONSTRATION DATA',
        };
      case 'payroll_ready':
        return {
          id: `${carrierId}-tl-scenario`,
          carrierId,
          whenLabel: 'Today · afternoon',
          title: 'Settlement marked ready',
          detail: `${seed.completed[0].loadNum} settled`,
          disclosure: 'DEMONSTRATION DATA',
        };
      case 'perfect_week':
        return {
          id: `${carrierId}-tl-scenario`,
          carrierId,
          whenLabel: 'Today · afternoon',
          title: 'Home time approved',
          detail: 'Demo approval — no live scheduling system involved',
          disclosure: 'DEMONSTRATION DATA',
        };
      case 'new_driver':
        return {
          id: `${carrierId}-tl-scenario`,
          carrierId,
          whenLabel: 'Today · afternoon',
          title: 'Onboarding module opened',
          detail: 'Assistant walkthrough started (demo)',
          disclosure: 'DEMONSTRATION DATA',
        };
      case 'road_breakdown':
        return {
          id: `${carrierId}-tl-scenario`,
          carrierId,
          whenLabel: 'Today · afternoon',
          title: 'Roadside vendor requested',
          detail: seed.trailer,
          disclosure: 'DEMONSTRATION DATA',
        };
      default:
        return null;
    }
  })();

  if (scenarioEvent) events.push(scenarioEvent);

  events.push({
    id: `${carrierId}-tl-hist`,
    carrierId,
    whenLabel: 'Yesterday · afternoon',
    title: `Delivered ${seed.completed[0].loadNum}`,
    detail: seed.completed[0].destination,
    disclosure: 'DEMONSTRATION DATA',
  });
  events.push({
    id: `${carrierId}-tl-hist-2`,
    carrierId,
    whenLabel: 'Last week',
    title: `Delivered ${seed.completed[1].loadNum}`,
    detail: seed.completed[1].destination,
    disclosure: 'DEMONSTRATION DATA',
  });

  return events;
}

function buildAssistant(
  carrierId: CarrierId,
  scenarioId: ScenarioId,
  seed: Seed,
  cfg: (typeof CARRIER_DEMO_CONFIG)[CarrierId]
): AssistantTurn[] {
  const turns: AssistantTurn[] = [];
  let n = 0;
  const push = (role: 'driver' | 'assistant', text: string) => {
    n += 1;
    turns.push({ id: `${carrierId}-ai-${n}`, role, text, disclosure: 'SIMULATED ACTION' });
  };

  push(
    'assistant',
    `Showcase assistant for ${cfg.displayName}. This conversation is demonstration data only — nothing here reaches dispatch, payroll, or support.`
  );
  push('driver', 'What do I need to do next?');
  push(
    'assistant',
    scenarioId === 'urgent_pod'
      ? `Demo answer: upload the signed POD for ${seed.loadNum} — that's the only thing blocking your settlement right now.`
      : `Demo answer: keep heading to ${seed.destination}; no action is due until you arrive.`
  );
  push('driver', 'When is my delivery appointment?');
  push(
    'assistant',
    `Demo answer: your appointment for ${seed.loadNum} is ${showcaseCountdown(seed.currentApptIso)}. This is a simulated schedule, not a live ETA feed.`
  );
  push('driver', 'My BOL photo might have come out blurry — what happens if paperwork is missing?');
  push(
    'assistant',
    'Demo answer: in this simulation, missing paperwork would flag the load for review and pause settlement until a clear photo is submitted.'
  );
  push('driver', 'Can you check my settlement?');
  push(
    'assistant',
    `Demo answer: your simulated settlement shows ${carrierId === 'GLX' ? '$4,410.00' : '$4,620.00'} net for this period — pay figures here are illustrative only.`
  );
  push('driver', 'Who do I contact if I need help?');
  push(
    'assistant',
    `Demo answer: for this simulation, your dispatcher contact is ${seed.dispatcherName} at ${seed.dispatcherPhone}. In production this connects to a real contact card.`
  );
  push('driver', 'How do I submit a reimbursement?');
  push(
    'assistant',
    'Demo answer: open Capture and choose Receipts — this simulated flow records a demo receipt without submitting anything to production.'
  );

  return turns;
}

function buildNotifications(carrierId: CarrierId, scenarioId: ScenarioId, seed: Seed): NotificationItem[] {
  return [
    {
      id: `${carrierId}-notif-appt`,
      title: `Delivery appointment ${showcaseCountdown(seed.currentApptIso)}`,
      detail: `${seed.loadNum} · ${seed.destination}`,
      unread: true,
      priority: scenarioId === 'urgent_pod' ? 'critical' : 'info',
      category: 'appointments',
      href: '/showcase/trips',
      whenLabel: 'Today',
      disclosure: 'DEMONSTRATION DATA',
    },
    {
      id: `${carrierId}-notif-doc`,
      title:
        scenarioId === 'urgent_pod' || scenarioId === 'missing_paperwork'
          ? 'POD needed to close out load'
          : 'Documents on file',
      detail: `${seed.loadNum} document packet`,
      unread: scenarioId === 'urgent_pod' || scenarioId === 'missing_paperwork',
      priority: scenarioId === 'urgent_pod' || scenarioId === 'missing_paperwork' ? 'critical' : 'info',
      category: 'documents',
      href: '/showcase/documents',
      whenLabel: 'Today',
      disclosure: 'DEMONSTRATION DATA',
    },
    {
      id: `${carrierId}-notif-dispatch`,
      title: 'New dispatch note',
      detail: `${seed.upcoming.loadNum} assigned — pickup ${showcaseCountdown(seed.upcoming.apptIso)}`,
      unread: true,
      priority: 'action',
      category: 'dispatch',
      href: '/showcase/trips',
      whenLabel: 'Today',
      disclosure: 'DEMONSTRATION DATA',
    },
    {
      id: `${carrierId}-notif-payroll`,
      title: scenarioId === 'payroll_ready' ? 'Settlement ready for review' : 'Settlement preview updated',
      detail: `${seed.completed[0].loadNum} line haul added to demo settlement`,
      unread: scenarioId === 'payroll_ready',
      priority: scenarioId === 'payroll_ready' ? 'action' : 'info',
      category: 'payroll',
      href: '/showcase/pay',
      whenLabel: 'Yesterday',
      disclosure: 'DEMONSTRATION DATA',
    },
    {
      id: `${carrierId}-notif-maintenance`,
      title: scenarioId === 'maintenance' ? 'Maintenance attention required' : 'Service reminder',
      detail:
        scenarioId === 'maintenance'
          ? carrierId === 'GLX'
            ? 'DEF sensor warning on GLX-441'
            : 'Trailer light fault on TR-881'
          : `${seed.truck} scheduled service approaching`,
      unread: scenarioId === 'maintenance',
      priority: scenarioId === 'maintenance' ? 'critical' : 'info',
      category: 'maintenance',
      href: '/showcase/equipment',
      whenLabel: 'Today',
      disclosure: 'DEMONSTRATION DATA',
    },
    {
      id: `${carrierId}-notif-credential`,
      title: 'Medical certificate approaching expiration',
      detail: 'Renew within 19 days (demo)',
      unread: true,
      priority: 'action',
      category: 'credentials',
      href: '/showcase/safety',
      whenLabel: 'This week',
      disclosure: 'DEMONSTRATION DATA',
    },
  ];
}

function buildSearchIndex(
  carrierId: CarrierId,
  seed: Seed,
  loads: LoadListItem[],
  documents: DocumentItem[],
  messages: MessageItem[]
): SearchResultItem[] {
  const items: SearchResultItem[] = [];

  loads.forEach((l) => {
    items.push({
      id: `${carrierId}-search-load-${l.loadNum}`,
      kind: 'load',
      title: l.loadNum,
      subtitle: `${l.origin} → ${l.destination}`,
      href: '/showcase/trips',
      disclosure: 'DEMONSTRATION DATA',
    });
  });

  documents.forEach((d) => {
    items.push({
      id: `${carrierId}-search-doc-${d.id}`,
      kind: 'document',
      title: d.title,
      subtitle: d.statusLabel,
      href: '/showcase/documents',
      disclosure: 'DEMONSTRATION DATA',
    });
  });

  messages.forEach((m) => {
    items.push({
      id: `${carrierId}-search-msg-${m.id}`,
      kind: 'message',
      title: m.subject,
      subtitle: m.from,
      href: '/showcase/messages',
      disclosure: 'DEMONSTRATION DATA',
    });
  });

  items.push({
    id: `${carrierId}-search-pay`,
    kind: 'pay',
    title: 'Settlement summary',
    subtitle: 'Demo pay period overview',
    href: '/showcase/pay',
    disclosure: 'DEMONSTRATION DATA',
  });
  items.push({
    id: `${carrierId}-search-resource-handbook`,
    kind: 'resource',
    title: 'Driver handbook',
    subtitle: 'Demo policy reference',
    href: '/showcase/resources',
    disclosure: 'FUTURE CAPABILITY',
  });
  items.push({
    id: `${carrierId}-search-resource-support`,
    kind: 'resource',
    title: 'Support contact',
    subtitle: seed.dispatcherPhone,
    href: '/showcase/resources',
    disclosure: 'DEMONSTRATION DATA',
  });

  return items;
}

function buildMoreMenu(
  carrierId: CarrierId,
  cfg: (typeof CARRIER_DEMO_CONFIG)[CarrierId]
): MoreMenuGroup[] {
  return [
    {
      id: `${carrierId}-menu-hometime`,
      title: 'Home time',
      items: [
        { id: 'request', label: 'Request home time', detail: 'Simulated request only', href: '/showcase/home-time' },
      ],
    },
    {
      id: `${carrierId}-menu-benefits`,
      title: 'Benefits',
      items: [
        { id: 'health', label: 'Health contribution', detail: 'Future capability preview', href: '/showcase/benefits' },
        { id: 'retirement', label: '401(k) matching', detail: 'Future capability preview', href: '/showcase/benefits' },
      ],
    },
    {
      id: `${carrierId}-menu-documents`,
      title: 'Documents',
      items: [
        { id: 'packet', label: 'Document packet', detail: 'Demo document center', href: '/showcase/documents' },
      ],
    },
    {
      id: `${carrierId}-menu-performance`,
      title: 'Performance',
      items: [
        { id: 'scorecard', label: 'Scorecard', detail: 'Demo scorecard, not a live score', href: '/showcase/performance' },
      ],
    },
    {
      id: `${carrierId}-menu-rewards`,
      title: 'Rewards',
      items: [
        { id: 'points', label: 'Rewards balance', detail: 'Future capability preview', href: '/showcase/rewards' },
      ],
    },
    {
      id: `${carrierId}-menu-help`,
      title: 'Help',
      items: [
        { id: 'support', label: 'Contact support', detail: cfg.supportPhone || '—', href: '/showcase/help' },
        { id: 'faq', label: 'How Showcase works', detail: 'Demonstration data explainer', href: '/showcase/help' },
      ],
    },
    {
      id: `${carrierId}-menu-preferences`,
      title: 'Preferences',
      items: [
        { id: 'notifications', label: 'Notification settings', detail: 'Choose which demo alerts you see', href: '/showcase/preferences' },
        { id: 'comm', label: 'Communication preferences', detail: 'Email / SMS demo opt-in', href: '/showcase/preferences' },
      ],
    },
  ];
}

export function buildShowcasePack(
  carrierId: CarrierId,
  scenarioId: ScenarioId,
  displayName: string
): ShowcaseScenarioPack {
  const seed = SEEDS[carrierId];
  const cfg = CARRIER_DEMO_CONFIG[carrierId];
  const mission = applyScenario(carrierId, scenarioId, displayName);

  const loads = buildLoads(carrierId, scenarioId, seed, mission);
  const documents = buildDocuments(carrierId, scenarioId, seed);
  const messages = buildMessages(carrierId, scenarioId, seed, cfg);

  return {
    carrierId,
    scenarioId,
    mission,
    loads,
    pay: buildPay(carrierId, scenarioId, seed, mission),
    messages,
    truck: buildTruck(carrierId, scenarioId, seed),
    safety: buildSafety(carrierId, scenarioId),
    homeTime: {
      carrierId,
      statusLabel: scenarioId === 'perfect_week' ? 'Approved (demo)' : 'None pending',
      requestedWindow: carrierId === 'GLX' ? 'Fri 18:00 – Sun 12:00' : 'Sat – Mon',
      disclosure: 'FUTURE CAPABILITY',
    },
    benefits: buildBenefits(carrierId),
    documents,
    performance: buildPerformance(carrierId, scenarioId),
    timeline: buildTimeline(carrierId, scenarioId, seed),
    assistant: buildAssistant(carrierId, scenarioId, seed, cfg),
    notifications: buildNotifications(carrierId, scenarioId, seed),
    searchIndex: buildSearchIndex(carrierId, seed, loads, documents, messages),
    moreMenu: buildMoreMenu(carrierId, cfg),
  };
}
