/**
 * Deterministic Showcase clock — keeps demo screenshots and tests stable.
 * All fixture relative times resolve from this fixed instant.
 */
export const SHOWCASE_NOW_ISO = '2026-07-22T14:30:00.000Z';

export function showcaseNow(): Date {
  return new Date(SHOWCASE_NOW_ISO);
}

/** Format a relative countdown from SHOWCASE_NOW for demo labels. */
export function showcaseCountdown(targetIso: string): string {
  const now = showcaseNow().getTime();
  const target = new Date(targetIso).getTime();
  const diffMs = target - now;
  if (Number.isNaN(diffMs)) return '—';
  const abs = Math.abs(diffMs);
  const hours = Math.floor(abs / 3_600_000);
  const mins = Math.floor((abs % 3_600_000) / 60_000);
  if (diffMs < 0) {
    if (hours > 0) return `${hours}h ${mins}m overdue`;
    return `${mins}m overdue`;
  }
  if (hours > 0) return `in ${hours}h ${mins}m`;
  return `in ${mins}m`;
}
