import type { NavigateFunction } from 'react-router-dom';
import type { SubmissionType } from '../types/submission.ts';

export interface MissionCaptureTarget {
  submissionType: SubmissionType;
  href: string;
}

interface ActivateMissionCaptureParams extends MissionCaptureTarget {
  driverName: string;
  company: string;
  clearDraft: () => void;
  startDraft: (params: {
    submissionType: SubmissionType;
    driverName: string;
    company: string;
  }) => unknown;
  navigate: NavigateFunction;
}

/**
 * Seeds the submission draft required by capture routes, then navigates.
 * All Mission Control capture CTAs must use this (or an equivalent) so
 * draft-gated pages like /submissions/receipt do not bounce to /workspace.
 */
export function activateMissionCapture({
  submissionType,
  href,
  driverName,
  company,
  clearDraft,
  startDraft,
  navigate,
}: ActivateMissionCaptureParams): void {
  clearDraft();
  startDraft({
    submissionType,
    driverName,
    company,
  });
  navigate(href);
}
