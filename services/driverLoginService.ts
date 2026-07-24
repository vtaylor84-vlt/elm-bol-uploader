import type { DriverSessionProfile } from '../utils/driverSession.ts';
import { clearShowcaseGrant, writeShowcaseGrant } from '../utils/showcaseGrantStorage.ts';

export interface DriverLoginResult {
  success: boolean;
  profile?: DriverSessionProfile;
  error?: string;
  showcaseGrant?: string;
  showcaseGrantExpiresAt?: number;
}

export async function verifyDriverEmail(email: string): Promise<DriverLoginResult> {
  const response = await fetch('/.netlify/functions/driver-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });

  let data: {
    success?: boolean;
    profile?: DriverSessionProfile;
    error?: string;
    showcaseGrant?: string;
    showcaseGrantExpiresAt?: number;
  } = {};
  try {
    data = await response.json();
  } catch {
    return { success: false, error: 'Connection failed. Try again.' };
  }

  if (!response.ok || !data.success || !data.profile) {
    clearShowcaseGrant();
    return {
      success: false,
      error: data.error || 'Access denied. Use an approved driver or admin email.',
    };
  }

  if (
    data.profile.authRole === 'admin' &&
    data.profile.canSelectAnyDriver &&
    data.showcaseGrant &&
    data.showcaseGrantExpiresAt
  ) {
    writeShowcaseGrant(data.showcaseGrant, data.showcaseGrantExpiresAt);
  } else {
    clearShowcaseGrant();
  }

  return {
    success: true,
    profile: data.profile,
    showcaseGrant: data.showcaseGrant,
    showcaseGrantExpiresAt: data.showcaseGrantExpiresAt,
  };
}

export async function validateShowcaseAccess(grant: string): Promise<{
  allowed: boolean;
  error?: string;
  expiresAt?: number;
}> {
  const response = await fetch('/.netlify/functions/showcase-access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ showcaseGrant: grant }),
  });
  let data: { allowed?: boolean; error?: string; expiresAt?: number } = {};
  try {
    data = await response.json();
  } catch {
    return { allowed: false, error: 'Showcase access check failed.' };
  }
  if (!response.ok || !data.allowed) {
    return { allowed: false, error: data.error || 'Access denied' };
  }
  return { allowed: true, expiresAt: data.expiresAt };
}
