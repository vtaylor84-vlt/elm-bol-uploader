import React from 'react';

export type BottomNavId = 'today' | 'loads' | 'capture' | 'pay' | 'more';

export interface ShellNavItem {
  id: BottomNavId;
  label: string;
  path: string;
  matchSuffixes?: string[];
  icon: React.ReactNode;
}

const IconToday = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
    <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

const IconLoads = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M3 17h13V7H3v10zm13 0h3.5L22 13.5V9h-6v8zM6 19.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const IconCapture = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M4 8h3l2-2h6l2 2h3v11H4V8z"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="13" r="3.25" stroke="currentColor" strokeWidth="1.75" />
  </svg>
);

const IconPay = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
    <path d="M3 10h18M7 14h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

const IconMore = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="6" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="18" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

/** Shared nav model for mobile bottom bar and desktop rail. */
export const SHELL_NAV_ITEMS: ShellNavItem[] = [
  { id: 'today', label: 'Today', path: '/today', icon: <IconToday /> },
  { id: 'loads', label: 'Loads', path: '/loads', icon: <IconLoads /> },
  {
    id: 'capture',
    label: 'Capture',
    path: '/capture',
    icon: <IconCapture />,
    matchSuffixes: ['/capture', '/workspace'],
  },
  { id: 'pay', label: 'Pay', path: '/pay', icon: <IconPay /> },
  { id: 'more', label: 'More', path: '/more', icon: <IconMore /> },
];

export function isShellNavActive(
  pathname: string,
  item: ShellNavItem,
  routePrefix: string,
  active: BottomNavId
): boolean {
  const prefix = routePrefix || '';
  const suffixes = (item.matchSuffixes || [item.path]).map((s) => `${prefix}${s}`);
  const pathActive = suffixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return active === item.id || pathActive;
}
