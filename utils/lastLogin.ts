/**
 * Device-local previous successful login timestamps.
 * Updated only from the authenticated login flow (AuthContext.login).
 * Not a server-side audit trail — honest "this device" history only.
 */

const STORAGE_PREFIX = 'elm_prev_login_v1:';

export function formatLastLogin(iso: string, timeZone?: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timeZone || undefined,
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function storageKey(driverId: string): string {
  return `${STORAGE_PREFIX}${String(driverId || '').trim()}`;
}

/** Read the previously stored successful login ISO for this driver on this device. */
export function readPreviousLoginIso(driverId: string): string | null {
  if (!driverId || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey(driverId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at?: string };
    if (!parsed?.at || Number.isNaN(Date.parse(parsed.at))) return null;
    return parsed.at;
  } catch {
    return null;
  }
}

/**
 * On successful auth: return the prior timestamp (if any), then store "now" as the
 * latest successful login for the next session.
 */
export function recordSuccessfulLogin(driverId: string, at: Date = new Date()): string | null {
  if (!driverId || typeof localStorage === 'undefined') return null;
  const previous = readPreviousLoginIso(driverId);
  try {
    localStorage.setItem(storageKey(driverId), JSON.stringify({ at: at.toISOString() }));
  } catch {
    /* ignore quota / private mode */
  }
  return previous;
}
