/**
 * ELM CONNECT Design System — canonical tokens.
 * One platform identity; layout adapts by breakpoint, never by separate apps.
 * Visual baseline: main@9c0be25 — deep navy, restrained blue, outdoor-readable.
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
  bgNavy: '#070b14',
  bgElevated: '#0a0f18',
  surface: 'rgba(12, 12, 18, 0.88)',
  surfaceRaised: 'rgba(16, 20, 32, 0.92)',
  border: 'rgba(59, 130, 246, 0.15)',
  borderStrong: 'rgba(59, 130, 246, 0.28)',
  borderSubtle: 'rgba(63, 63, 70, 0.7)',
  primary: '#3b82f6',
  primaryLight: '#5eb8e8',
  primaryMuted: 'rgba(59, 130, 246, 0.12)',
  primaryGlow: 'rgba(59, 130, 246, 0.45)',
  indigo: '#6366f1',
  cyan: '#22d3ee',
  success: '#22c55e',
  successGlow: 'rgba(34, 197, 94, 0.35)',
  warning: '#f59e0b',
  warningMuted: 'rgba(245, 158, 11, 0.16)',
  danger: '#ef4444',
  dangerMuted: 'rgba(239, 68, 68, 0.16)',
  info: '#38bdf8',
  infoMuted: 'rgba(56, 189, 248, 0.14)',
  text: '#f4f4f5',
  textMuted: '#a1a1aa',
  textSubtle: '#71717a',
  focusRing: '#93c5fd',
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
  pill: '999px',
} as const;

export const ELM_SHADOW = {
  sm: '0 2px 8px rgba(0, 0, 0, 0.35)',
  md: '0 8px 28px rgba(0, 0, 0, 0.45)',
  lg: '0 16px 48px rgba(0, 0, 0, 0.55)',
  glowPrimary: '0 6px 28px rgba(37, 99, 235, 0.4)',
} as const;

export const ELM_TOUCH = {
  minHeight: '52px',
  minWidth: '52px',
  minTap: '44px',
} as const;

export const ELM_MOTION = {
  fast: '150ms',
  normal: '220ms',
  slow: '360ms',
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

export const ELM_VERSION = 'v2.0.0';
