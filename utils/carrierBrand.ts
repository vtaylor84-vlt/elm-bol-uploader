import type { CarrierId } from '../types/showcase.ts';
import { resolveCarrierId } from './companyMap.ts';
import type { DriverSessionProfile } from './driverSession.ts';

export type BrandThemeId = 'elm' | 'bst' | 'glx';

/**
 * Authoritative carrier branding for authenticated chrome.
 * Never guesses. Never uses Showcase fixtures in Production.
 * Session currently carries a single companyCode from roster login.
 */
export function resolveAuthoritativeCarrier(
  session: DriverSessionProfile | null | undefined
): CarrierId | null {
  if (!session) return null;
  return resolveCarrierId(session.companyCode);
}

export function resolveBrandTheme(
  session: DriverSessionProfile | null | undefined
): BrandThemeId {
  const carrier = resolveAuthoritativeCarrier(session);
  if (carrier === 'BST') return 'bst';
  if (carrier === 'GLX') return 'glx';
  return 'elm';
}

export function brandThemeLabel(theme: BrandThemeId): string {
  if (theme === 'bst') return 'BST Expedite';
  if (theme === 'glx') return 'Greenleaf Xpress';
  return 'ELM CONNECT';
}

/** Canonical brand image paths — ELM mark is the clean supplied PNG (not a screenshot crop). */
export const BRAND_MARK_SRC: Record<BrandThemeId, string> = {
  elm: '/assets/elm-connect-mark.png',
  bst: '/assets/bst-logo.svg',
  glx: '/assets/glx-logo.png',
};
