import type { DriverSessionProfile } from '../utils/driverSession.ts';
import type { MissionControlViewModel } from '../types/missionControl.ts';
import { getCompanyDisplayName } from '../utils/companyMap.ts';

/**
 * Builds the Production Mission Control view model.
 * Does not fabricate operational loads. Live haul connectivity is not yet wired —
 * when no assigned load exists, activeHaul is null and the UI shows a truthful empty state.
 * Primary capture actions remain LIVE (existing BOL/POD upload path).
 */
export function getMissionControlViewModel(
  session: DriverSessionProfile | null
): MissionControlViewModel {
  const driverDisplayName = session?.driverName || 'Driver';
  const company = getCompanyDisplayName(session?.companyCode);
  const online =
    typeof navigator !== 'undefined' ? navigator.onLine : true;

  return {
    driverDisplayName,
    companyLabel: company,
    connectionLabel: online ? 'Device online' : 'Device offline',
    dataCapability: 'READY_FOR_INTEGRATION',
    exceptions: [],
    activeHaul: null,
    primaryAction: {
      label: 'Upload BOL / POD',
      href: '/submissions/bol-pod',
      helperText: 'Camera-first capture · verified upload path',
      capability: 'LIVE',
      submissionType: 'BOL_POD',
      variant: 'primary',
    },
    earnings: {
      capability: 'FUTURE',
      periodLabel: 'This settlement period',
      projectedLabel: '—',
      note: 'Settlement services are not connected in this build. No pay amounts are calculated.',
    },
    tasks: [],
  };
}
