import type { DriverSessionProfile } from '../utils/driverSession.ts';
import type { MissionControlViewModel } from '../types/missionControl.ts';
import { getCompanyDisplayName } from '../utils/companyMap.ts';

/**
 * Builds the Mission Control view model.
 * Haul / earnings / telemetry rows are DEMONSTRATION until load & pay adapters are LIVE.
 * Primary action routes into the verified BOL/POD upload path (LIVE).
 */
export function getMissionControlViewModel(
  session: DriverSessionProfile | null
): MissionControlViewModel {
  const driverDisplayName = session?.driverName || 'Driver';
  const company = getCompanyDisplayName(session?.companyCode);

  return {
    driverDisplayName,
    companyLabel: company,
    connectionLabel: navigator.onLine ? 'Device online' : 'Device offline',
    dataCapability: 'DEMONSTRATION',
    exceptions: [
      {
        id: 'ex-pod',
        severity: 'critical',
        title: 'Delivery POD required immediately',
        detail:
          'Active haul is at the delivery facility. Upload the signed POD to keep settlement processing on track.',
        actionLabel: 'Upload Signed POD',
        actionHref: '/submissions/bol-pod',
        submissionType: 'BOL_POD',
        loadNum: '48291',
      },
    ],
    activeHaul: {
      loadNum: '48291',
      loadId: 'DEMO-LOAD-48291',
      statusLabel: 'At delivery facility',
      origin: 'Dallas, TX',
      destination: 'Atlanta, GA',
      nextMilestone: 'Delivery appointment',
      appointmentLabel: 'Today · 14:00 local',
      countdownLabel: 'Due in 3h 20m',
      truckNumber: 'T-204',
      trailerNumber: 'TR-881',
      missingDocuments: ['POD'],
      brokerLabel: company || 'Dispatch',
      demoCommodity: 'General freight',
      demoWeightLabel: '—',
      demoTempLabel: '—',
      demoGrossLabel: '—',
      milestones: [
        { id: 'pu', label: 'Pickup', state: 'done' },
        { id: 'scale', label: 'Scale check', state: 'done' },
        { id: 'del', label: 'Delivery', state: 'active' },
      ],
    },
    primaryAction: {
      label: 'Upload Delivery POD',
      href: '/submissions/bol-pod',
      helperText: 'Camera-first capture · verified upload path',
      capability: 'LIVE',
      submissionType: 'BOL_POD',
      variant: 'urgent',
    },
    earnings: {
      capability: 'DEMONSTRATION',
      periodLabel: 'This settlement period',
      projectedLabel: '—',
      note: 'Sample layout only. No pay amounts are calculated or claimed as live.',
    },
    tasks: [
      {
        id: 'task-pod',
        title: 'Upload POD',
        detail: 'Load 48291 · delivery proof',
        urgency: 'due_now',
        href: '/submissions/bol-pod',
        submissionType: 'BOL_POD',
      },
      {
        id: 'task-ack',
        title: 'Acknowledge dispatch note',
        detail: 'Receiver gate code updated',
        urgency: 'due_soon',
      },
      {
        id: 'task-receipt',
        title: 'Submit lumper receipt',
        detail: 'Optional expense capture',
        urgency: 'due_soon',
        href: '/submissions/receipt',
        submissionType: 'EXPENSE_RECEIPT',
      },
    ],
  };
}
