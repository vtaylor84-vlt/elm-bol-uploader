import type { DriverSessionProfile } from '../../utils/driverSession.ts';
import { getMissionControlViewModel } from '../missionControlAdapter.ts';
import type { DriverDataSource } from './types.ts';

/**
 * Production data source — wraps existing adapters.
 * Future modules return honest empty / future placeholders.
 */
export function createProductionDriverDataSource(
  session: DriverSessionProfile | null
): DriverDataSource {
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
    getTruckStatus: () => ({
      carrierId: 'BST',
      truckNumber: '—',
      trailerNumber: '—',
      statusLabel: 'Not connected',
      nextServiceLabel: '—',
      disclosure: 'FUTURE CAPABILITY',
    }),
    getSafetyStatus: () => ({
      carrierId: 'BST',
      scoreLabel: '—',
      openItems: [],
      disclosure: 'FUTURE CAPABILITY',
    }),
    getHomeTime: () => ({
      carrierId: 'BST',
      statusLabel: 'Not available',
      requestedWindow: '—',
      disclosure: 'FUTURE CAPABILITY',
    }),
    getBenefits: () => [],
    getDocuments: () => [],
    getPerformance: () => ({
      carrierId: 'BST',
      onTimeLabel: '—',
      safetyLabel: '—',
      note: 'FUTURE CAPABILITY',
      disclosure: 'FUTURE CAPABILITY',
    }),
    getTimeline: () => [],
    getAssistantThread: () => [],
  };
}
