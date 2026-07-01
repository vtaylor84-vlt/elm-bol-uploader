/**
 * ELM CONNECT Design System — canonical tokens.
 * One platform identity; layout adapts by breakpoint, never by separate apps.
 */

export const BREAKPOINTS = {
  mobile: { min: 320, max: 767 },
  tablet: { min: 768, max: 1023 },
  desktop: { min: 1024, max: 1439 },
  largeDesktop: { min: 1440 },
} as const;

/** Tailwind-aligned: base = mobile, md = tablet, lg = desktop, xl = large desktop */
export const ELM_COLORS = {
  bg: '#030308',
  bgElevated: '#0a0f18',
  surface: 'rgba(12, 12, 18, 0.88)',
  border: 'rgba(59, 130, 246, 0.15)',
  borderStrong: 'rgba(59, 130, 246, 0.28)',
  primary: '#3b82f6',
  primaryLight: '#5eb8e8',
  primaryGlow: 'rgba(59, 130, 246, 0.45)',
  success: '#22c55e',
  successGlow: 'rgba(34, 197, 94, 0.35)',
  text: '#f4f4f5',
  textMuted: '#a1a1aa',
  textSubtle: '#71717a',
} as const;

export const ELM_SPACING = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const;

export const ELM_RADIUS = {
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
} as const;

export const ELM_TOUCH = {
  minHeight: '52px',
  minWidth: '52px',
} as const;

export const ELM_VERSION = 'v2.0.0';
