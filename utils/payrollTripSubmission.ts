/** External payroll trip-submission workspace (separate product surface). */
export const PAYROLL_TRIP_SUBMISSION_URL = 'https://payroll.elmconnect.net';

export const PAYROLL_TRIP_SUBMISSION_LABEL = 'Submit trip for payroll';

/**
 * Opens the payroll trip-submission workflow without inventing query params.
 * New tab preserves Driver Workspace session and back-stack on mobile/desktop.
 */
export function openPayrollTripSubmission(): void {
  if (typeof window === 'undefined') return;
  window.open(PAYROLL_TRIP_SUBMISSION_URL, '_blank', 'noopener,noreferrer');
}
