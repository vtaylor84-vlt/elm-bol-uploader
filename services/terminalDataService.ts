import { GAS_WEB_APP_URL } from '../utils/gasWebAppUrl.ts';

export interface DriverOption {
  value: string;
  label: string;
}

export interface TruckOption {
  truckNumber: string;
  companyCode: string;
}

const toTitleCaseName = (value: string) =>
  value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

function normalizeDriverEntry(entry: unknown): DriverOption | null {
  if (typeof entry === 'string') {
    const trimmed = entry.trim();
    if (!trimmed) return null;
    return { value: trimmed.toUpperCase(), label: toTitleCaseName(trimmed) };
  }
  if (entry && typeof entry === 'object') {
    const raw =
      (entry as Record<string, string>).driverName ||
      (entry as Record<string, string>).name ||
      (entry as Record<string, string>).label ||
      (entry as Record<string, string>).value ||
      '';
    const trimmed = String(raw).trim();
    if (!trimmed) return null;
    return { value: trimmed.toUpperCase(), label: toTitleCaseName(trimmed) };
  }
  return null;
}

function normalizeTruckEntry(entry: unknown): TruckOption | null {
  if (typeof entry === 'string') {
    const truckNumber = entry.trim();
    if (!truckNumber) return null;
    return { truckNumber, companyCode: '' };
  }
  if (entry && typeof entry === 'object') {
    const truckNumber = String(
      (entry as Record<string, string>).truckNumber ||
        (entry as Record<string, string>).trucknumber ||
        ''
    ).trim();
    if (!truckNumber) return null;
    const companyCode = String(
      (entry as Record<string, string>).companyCode ||
        (entry as Record<string, string>).companycode ||
        ''
    )
      .trim()
      .toUpperCase();
    return { truckNumber, companyCode };
  }
  return null;
}

export async function fetchDriverRoster(): Promise<DriverOption[]> {
  try {
    const response = await fetch(`${GAS_WEB_APP_URL}?action=getDrivers`);
    const data = await response.json();
    if (!Array.isArray(data)) return [];
    return data.map(normalizeDriverEntry).filter(Boolean) as DriverOption[];
  } catch {
    return [];
  }
}

export type FetchTrucksResult = {
  trucks: TruckOption[];
  error?: string;
};

export async function fetchTrucks(): Promise<FetchTrucksResult> {
  try {
    const response = await fetch(`${GAS_WEB_APP_URL}?action=getTrucks`);
    const data = await response.json();

    if (Array.isArray(data)) {
      const trucks = data
        .map(normalizeTruckEntry)
        .filter(Boolean)
        .sort((a, b) =>
          a!.truckNumber.localeCompare(b!.truckNumber, undefined, { numeric: true })
        ) as TruckOption[];
      return { trucks };
    }

    if (data && typeof data === 'object' && 'error' in data) {
      return { trucks: [], error: String((data as { error: string }).error) };
    }

    if (data && typeof data === 'object' && 'status' in data) {
      return {
        trucks: [],
        error:
          'Truck list is not available yet. Ask admin to update the backend (Apps Script deploy).',
      };
    }

    return { trucks: [] };
  } catch {
    return { trucks: [], error: 'Could not load trucks. Check your connection and try again.' };
  }
}
