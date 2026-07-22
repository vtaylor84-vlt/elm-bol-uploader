/**
 * Mission Control DTOs — UI consumes these shapes, not raw sheet rows.
 * Capability labels follow DEC-0011.
 */

import type { SubmissionType } from './submission.ts';

export type CapabilityClass =
  | 'LIVE'
  | 'READY_FOR_INTEGRATION'
  | 'DEMONSTRATION'
  | 'FUTURE';

export type ExceptionSeverity = 'critical' | 'warning' | 'info';

export interface MissionException {
  id: string;
  severity: ExceptionSeverity;
  title: string;
  detail: string;
  actionLabel?: string;
  actionHref?: string;
  /** When set with actionHref, seeds draft before navigation */
  submissionType?: SubmissionType;
}

export interface ActiveHaul {
  loadNum: string;
  loadId?: string;
  statusLabel: string;
  origin: string;
  destination: string;
  nextMilestone: string;
  appointmentLabel: string;
  countdownLabel: string;
  truckNumber?: string;
  trailerNumber?: string;
  missingDocuments: string[];
}

export interface PrimaryAction {
  label: string;
  href: string;
  helperText: string;
  /** LIVE actions hit existing upload/workspace routes */
  capability: CapabilityClass;
  submissionType: SubmissionType;
}

export interface EarningsSummary {
  capability: CapabilityClass;
  periodLabel: string;
  projectedLabel: string;
  note: string;
}

export type TaskUrgency = 'due_now' | 'due_soon' | 'blocked';

export interface OutstandingTask {
  id: string;
  title: string;
  detail: string;
  urgency: TaskUrgency;
  href?: string;
  /** When set with href, seeds draft before navigation */
  submissionType?: SubmissionType;
}

export interface MissionControlViewModel {
  driverDisplayName: string;
  companyLabel: string;
  connectionLabel: string;
  exceptions: MissionException[];
  activeHaul: ActiveHaul | null;
  primaryAction: PrimaryAction;
  earnings: EarningsSummary;
  tasks: OutstandingTask[];
  /** Honest classification for haul / earnings / task sample data */
  dataCapability: CapabilityClass;
}
