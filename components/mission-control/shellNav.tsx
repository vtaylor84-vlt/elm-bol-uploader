import React from 'react';
import { ShellIcons } from './ShellIcons.tsx';

export type PrimaryNavId =
  | 'today'
  | 'loads'
  | 'capture'
  | 'pay'
  | 'messages'
  | 'equipment'
  | 'safety'
  | 'more';

/** Mobile bottom bar keeps five primary destinations. */
export type BottomNavId = 'today' | 'loads' | 'capture' | 'pay' | 'more';

export interface ShellNavItem {
  id: PrimaryNavId;
  label: string;
  path: string;
  matchSuffixes?: string[];
  icon: React.ReactNode;
  /** When true, only shown on Showcase desktop rail (not production). */
  showcaseOnly?: boolean;
  /** When true, included in mobile bottom nav. */
  mobilePrimary?: boolean;
  badgeKey?: 'messages' | 'notifications';
}

/** Full desktop IA — Showcase shows all; production rail filters showcaseOnly. */
export const SHELL_NAV_ITEMS: ShellNavItem[] = [
  {
    id: 'today',
    label: 'Today',
    path: '/today',
    icon: <ShellIcons.Today />,
    mobilePrimary: true,
  },
  {
    id: 'loads',
    label: 'Loads',
    path: '/loads',
    icon: <ShellIcons.Loads />,
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
    id: 'messages',
    label: 'Messages',
    path: '/messages',
    icon: <ShellIcons.Messages />,
    showcaseOnly: true,
    badgeKey: 'messages',
  },
  {
    id: 'equipment',
    label: 'Equipment',
    path: '/equipment',
    icon: <ShellIcons.Equipment />,
    showcaseOnly: true,
    matchSuffixes: ['/equipment', '/truck'],
  },
  {
    id: 'safety',
    label: 'Safety',
    path: '/safety',
    icon: <ShellIcons.Safety />,
    showcaseOnly: true,
  },
  {
    id: 'more',
    label: 'More',
    path: '/more',
    icon: <ShellIcons.More />,
    mobilePrimary: true,
  },
];

export const MOBILE_NAV_ITEMS = SHELL_NAV_ITEMS.filter((i) => i.mobilePrimary);

export function desktopNavItems(mode: 'production' | 'showcase'): ShellNavItem[] {
  if (mode === 'showcase') return SHELL_NAV_ITEMS;
  return SHELL_NAV_ITEMS.filter((i) => !i.showcaseOnly);
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
