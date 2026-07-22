import type { DriverSessionProfile } from '../../utils/driverSession.ts';
import { resolveCarrierId } from '../../utils/companyMap.ts';
import { getMissionControlViewModel } from '../missionControlAdapter.ts';
import type { CarrierId, DisclosureKind } from '../../types/showcase.ts';
import type {
  DriverDataSource,
  HomeTimeRequestView,
  PerformanceView,
  SafetyStatusView,
  TruckStatusView,
} from './types.ts';

function futurePlaceholder(
  carrierId: CarrierId | undefined,
  fields: Omit<TruckStatusView, 'carrierId' | 'disclosure'> & {
    disclosure?: DisclosureKind;
  }
): TruckStatusView {
  return {
    ...(carrierId ? { carrierId } : {}),
    ...fields,
    disclosure: fields.disclosure || 'FUTURE CAPABILITY',
  };
}

/**
 * Production data source — wraps existing adapters.
 * Future modules return honest empty / future placeholders scoped to the active carrier only.
 */
export function createProductionDriverDataSource(
  session: DriverSessionProfile | null
): DriverDataSource {
  const carrierId = resolveCarrierId(session?.companyCode) ?? undefined;

  return {
    mode: 'production',
    getMissionControl: () => getMissionControlViewModel(session),
    getLoads: () => [],
    getPaySummary: () => ({
      disclosure: 'NOT CONNECTED TO PRODUCTION',
      periodLabel: 'This settlement period',
      grossLabel: '—',
      deductionsLabel: '—',
      netLabel: '—',
      note: 'Settlement services are not live in this build.',
    }),
    getCaptureModules: () => [
      {
        id: 'bol-pod',
        title: 'BOL / POD',
        description: 'Upload delivery documents for your assigned load.',
        href: '/submissions/bol-pod',
        capability: 'LIVE',
      },
      {
        id: 'expense',
        title: 'Expenses & Repairs',
        description: 'Submit receipts for fuel, tolls, travel, or repairs.',
        href: '/submissions/receipt',
        capability: 'LIVE',
      },
    ],
    getMessages: () => [],
    getTruckStatus: (): TruckStatusView =>
      futurePlaceholder(carrierId, {
        truckNumber: '—',
        trailerNumber: '—',
        statusLabel: 'Not connected',
        nextServiceLabel: '—',
      }),
    getSafetyStatus: (): SafetyStatusView => ({
      ...(carrierId ? { carrierId } : {}),
      scoreLabel: '—',
      openItems: [],
      disclosure: 'FUTURE CAPABILITY',
    }),
    getHomeTime: (): HomeTimeRequestView => ({
      ...(carrierId ? { carrierId } : {}),
      statusLabel: 'Not available',
      requestedWindow: '—',
      disclosure: 'FUTURE CAPABILITY',
    }),
    getBenefits: () => [],
    getDocuments: () => [],
    getPerformance: (): PerformanceView => ({
      ...(carrierId ? { carrierId } : {}),
      onTimeLabel: '—',
      safetyLabel: '—',
      note: 'FUTURE CAPABILITY',
      disclosure: 'FUTURE CAPABILITY',
    }),
    getTimeline: () => [],
    getAssistantThread: () => [],
  };
}
