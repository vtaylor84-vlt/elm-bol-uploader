/**
 * ELM CONNECT Design System — canonical tokens (v2.0 board-aligned).
 * Visual baseline: feature/driver-experience-cursor + Product Design Board Review.
 * Deep navy canvas, restrained cyan/blue accents, outdoor-readable contrast.
 */

export const BREAKPOINTS = {
  mobile: { min: 320, max: 767 },
  tablet: { min: 768, max: 1023 },
  desktop: { min: 1024, max: 1439 },
  largeDesktop: { min: 1440 },
} as const;

export const ELM_COLORS = {
  bg: '#050811',
  bgNavy: '#080d1a',
  bgElevated: '#0a0f18',
  surface: 'rgba(13, 19, 34, 0.9)',
  surfaceRaised: 'rgba(17, 24, 39, 0.85)',
  border: 'rgba(255, 255, 255, 0.12)',
  borderStrong: 'rgba(34, 211, 238, 0.28)',
  borderSubtle: 'rgba(63, 63, 70, 0.7)',
  primary: '#2563eb',
  primaryLight: '#22d3ee',
  primaryMuted: 'rgba(34, 211, 238, 0.12)',
  primaryGlow: 'rgba(6, 182, 212, 0.35)',
  indigo: '#6366f1',
  cyan: '#22d3ee',
  success: '#10b981',
  successGlow: 'rgba(16, 185, 129, 0.35)',
  warning: '#f59e0b',
  warningMuted: 'rgba(245, 158, 11, 0.16)',
  danger: '#f43f5e',
  dangerMuted: 'rgba(244, 63, 94, 0.16)',
  info: '#38bdf8',
  infoMuted: 'rgba(56, 189, 248, 0.14)',
  text: '#f4f4f5',
  textMuted: '#a1a1aa',
  textSubtle: '#71717a',
  focusRing: '#67e8f9',
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
  glowPrimary: '0 0 25px rgba(6, 182, 212, 0.4)',
  glowUrgent: '0 0 30px rgba(244, 63, 94, 0.35)',
} as const;

export const ELM_TOUCH = {
  minHeight: '52px',
  minWidth: '52px',
  minTap: '48px',
} as const;

export const ELM_MOTION = {
  fast: '150ms',
  normal: '200ms',
  slow: '360ms',
  easing: 'cubic-bezier(0, 0, 0.2, 1)',
} as const;

export const ELM_VERSION = 'v2.0.0';

export type GlassGlowColor =
  | 'blue'
  | 'indigo'
  | 'cyan'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'none';
