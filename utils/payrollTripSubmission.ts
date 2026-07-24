/** External trip-form destination (separate product surface). */
export const PAYROLL_TRIP_SUBMISSION_URL = 'https://payroll.elmconnect.net';

/** Driver-facing label for the live trip-form action. */
export const PAYROLL_TRIP_SUBMISSION_LABEL = 'Submit Trip Form';

export const PAYROLL_TRIP_SUBMISSION_HELPER =
  'Send your completed trip details for payroll review.';

/**
 * Opens the trip-form destination without inventing query params.
 * New tab preserves Driver Workspace session and back-stack on mobile/desktop.
 * Does not imply approval, payment, or status sync back to this workspace.
 */
export function openPayrollTripSubmission(): void {
  if (typeof window === 'undefined') return;
  window.open(PAYROLL_TRIP_SUBMISSION_URL, '_blank', 'noopener,noreferrer');
}
