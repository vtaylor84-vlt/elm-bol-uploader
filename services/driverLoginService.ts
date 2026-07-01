import type { DriverSessionProfile } from '../utils/driverSession.ts';

export interface DriverLoginResult {
  success: boolean;
  profile?: DriverSessionProfile;
  error?: string;
}

export async function verifyDriverEmail(email: string): Promise<DriverLoginResult> {
  const response = await fetch('/.netlify/functions/driver-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });

  let data: { success?: boolean; profile?: DriverSessionProfile; error?: string } = {};
  try {
    data = await response.json();
  } catch {
    return { success: false, error: 'Connection failed. Try again.' };
  }

  if (!response.ok || !data.success || !data.profile) {
    return {
      success: false,
      error: data.error || 'Access denied. Use an approved driver or admin email.',
    };
  }

  return { success: true, profile: data.profile };
}
