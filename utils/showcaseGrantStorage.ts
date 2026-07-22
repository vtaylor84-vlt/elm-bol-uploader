const GRANT_KEY = 'elm_showcase_grant';
const EXP_KEY = 'elm_showcase_grant_exp';

export function readShowcaseGrant(): string | null {
  try {
    return sessionStorage.getItem(GRANT_KEY);
  } catch {
    return null;
  }
}

export function readShowcaseGrantExpiresAt(): number | null {
  try {
    const raw = sessionStorage.getItem(EXP_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function writeShowcaseGrant(grant: string, expiresAt: number): void {
  sessionStorage.setItem(GRANT_KEY, grant);
  sessionStorage.setItem(EXP_KEY, String(expiresAt));
}

export function clearShowcaseGrant(): void {
  try {
    sessionStorage.removeItem(GRANT_KEY);
    sessionStorage.removeItem(EXP_KEY);
  } catch {
    /* ignore */
  }
}

export function isShowcaseGrantPresentAndUnexpired(): boolean {
  const grant = readShowcaseGrant();
  const exp = readShowcaseGrantExpiresAt();
  if (!grant || !exp) return false;
  return Date.now() < exp - 5_000;
}
