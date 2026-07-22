import type { DriverSessionProfile } from '../utils/driverSession.ts';
import type { MissionControlViewModel } from '../types/missionControl.ts';

function companyLabel(code?: string): string {
  const c = String(code || '').trim().toUpperCase();
  if (c === 'BST') return 'BST Expedite Inc';
  if (c === 'GLX') return 'Greenleaf Xpress';
  if (c === 'ELM') return 'ELM CONNECT';
  return code || 'Carrier';
}

/**
 * Builds the Mission Control view model.
 * Haul / earnings / task rows are DEMONSTRATION until load & pay adapters are LIVE.
 * Primary action routes into the verified BOL/POD upload path (LIVE).
 */
export function getMissionControlViewModel(
  session: DriverSessionProfile | null
): MissionControlViewModel {
  const driverDisplayName = session?.driverName || 'Driver';
  const company = companyLabel(session?.companyCode);

  return {
    driverDisplayName,
    companyLabel: company,
    connectionLabel: navigator.onLine ? 'Online' : 'Offline',
    dataCapability: 'DEMONSTRATION',
    exceptions: [
      {
        id: 'ex-pod',
        severity: 'critical',
        title: 'POD required',
        detail: 'Delivery proof is missing for the active haul. Upload before the appointment window closes.',
        actionLabel: 'Upload POD',
        actionHref: '/submissions/bol-pod',
      },
    ],
    activeHaul: {
      loadNum: '48291',
      loadId: 'DEMO-LOAD-48291',
      statusLabel: 'In transit · Delivery',
      origin: 'Dallas, TX',
      destination: 'Atlanta, GA',
      nextMilestone: 'Delivery appointment',
      appointmentLabel: 'Today · 14:00 local',
      countdownLabel: 'Due in 3h 20m',
      truckNumber: 'T-204',
      trailerNumber: 'TR-881',
      missingDocuments: ['POD'],
    },
    primaryAction: {
      label: 'Upload delivery POD',
      href: '/submissions/bol-pod',
      helperText: 'Camera-first capture · verified upload path',
      capability: 'LIVE',
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
      },
    ],
  };
}
