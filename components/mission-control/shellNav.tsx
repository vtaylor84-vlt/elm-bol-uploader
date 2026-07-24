import React from 'react';
import { ShellIcons } from './ShellIcons.tsx';

/**
 * Authoritative Driver Workspace mobile destinations (exactly five).
 * Nested destinations (messages, equipment, safety) live under More — not peer tabs.
 */
export type PrimaryNavId = 'home' | 'trips' | 'capture' | 'pay' | 'more';

/** Mobile bottom bar keeps five primary destinations. */
export type BottomNavId = PrimaryNavId;

export interface ShellNavItem {
  id: PrimaryNavId;
  label: string;
  path: string;
  matchSuffixes?: string[];
  icon: React.ReactNode;
  /** When true, included in mobile bottom nav. */
  mobilePrimary?: boolean;
  badgeKey?: 'messages' | 'notifications';
}

/** Same five destinations on mobile and desktop — no competing peer tabs. */
export const SHELL_NAV_ITEMS: ShellNavItem[] = [
  {
    id: 'home',
    label: 'Home',
    path: '/home',
    icon: <ShellIcons.Home />,
    matchSuffixes: ['/home', '/today'],
    mobilePrimary: true,
  },
  {
    id: 'trips',
    label: 'Trips',
    path: '/trips',
    icon: <ShellIcons.Trips />,
    matchSuffixes: ['/trips', '/loads'],
    mobilePrimary: true,
  },
  {
    id: 'capture',
    label: 'Capture',
    path: '/capture',
    icon: <ShellIcons.Capture />,
    matchSuffixes: ['/capture', '/workspace'],
    mobilePrimary: true,
  },
  {
    id: 'pay',
    label: 'Pay',
    path: '/pay',
    icon: <ShellIcons.Pay />,
    mobilePrimary: true,
  },
  {
    id: 'more',
    label: 'More',
    path: '/more',
    icon: <ShellIcons.More />,
    matchSuffixes: [
      '/more',
      '/messages',
      '/equipment',
      '/truck',
      '/safety',
      '/notifications',
      '/search',
      '/assistant',
      '/home-time',
      '/benefits',
      '/documents',
      '/performance',
      '/timeline',
      '/help',
      '/preferences',
      '/rewards',
    ],
    mobilePrimary: true,
  },
];

export const MOBILE_NAV_ITEMS = SHELL_NAV_ITEMS.filter((i) => i.mobilePrimary);

export function desktopNavItems(_mode: 'production' | 'showcase'): ShellNavItem[] {
  return SHELL_NAV_ITEMS;
}

export function isShellNavActive(
  pathname: string,
  item: ShellNavItem,
  routePrefix: string,
  active: PrimaryNavId | BottomNavId
): boolean {
  const prefix = routePrefix || '';
  const suffixes = (item.matchSuffixes || [item.path]).map((s) => `${prefix}${s}`);
  const pathActive = suffixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return active === item.id || pathActive;
}

/** Map legacy nav ids used by older page props into the five-destination model. */
export function normalizeActiveNav(
  active: string | PrimaryNavId | BottomNavId
): BottomNavId {
  if (active === 'today') return 'home';
  if (active === 'loads') return 'trips';
  if (active === 'messages' || active === 'equipment' || active === 'safety') return 'more';
  if (
    active === 'home' ||
    active === 'trips' ||
    active === 'capture' ||
    active === 'pay' ||
    active === 'more'
  ) {
    return active;
  }
  return 'more';
}
