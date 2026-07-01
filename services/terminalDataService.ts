const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxQwhSs6p01gLRgqW0mA-_qtJEFcvEiJebTqSlzNCxgRE8X7Rv_BYm_Th_saL6QQsQj/exec';

export interface DriverOption {
  value: string;
  label: string;
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

export async function fetchDriverRoster(): Promise<DriverOption[]> {
  try {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getDrivers`);
    const data = await response.json();
    if (!Array.isArray(data)) return [];
    return data.map(normalizeDriverEntry).filter(Boolean) as DriverOption[];
  } catch {
    return [];
  }
}

export async function fetchTruckNumbers(): Promise<string[]> {
  try {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getTrucks`);
    const data = await response.json();
    if (!Array.isArray(data)) return [];
    return data
      .map((t) => String(t || '').trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  } catch {
    return [];
  }
}
