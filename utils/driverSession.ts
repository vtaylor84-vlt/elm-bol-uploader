export type AuthRole = 'admin' | 'driver';

export interface DriverSessionProfile {
  authRole: AuthRole;
  driverId: string;
  driverName: string;
  companyCode: string;
  maskedEmail: string;
  uploaderAllowed: boolean;
  active: boolean;
  canSelectAnyDriver: boolean;
}

const SESSION_KEY = 'elm_driver_session';

export function readDriverSession(): DriverSessionProfile | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DriverSessionProfile;
    if (!parsed || (parsed.authRole !== 'admin' && parsed.authRole !== 'driver')) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeDriverSession(profile: DriverSessionProfile): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(profile));
}

export function clearDriverSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
