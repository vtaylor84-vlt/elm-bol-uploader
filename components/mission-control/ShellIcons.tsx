import React from 'react';
import {
  HomeIcon,
  MapIcon,
  CameraIcon,
  WalletIcon,
  ChatBubbleLeftRightIcon,
  TruckIcon,
  ShieldCheckIcon,
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
  BellIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const iconClass = 'mc-shell-icon';

/** Consistent 20px outline icons for shell navigation and utilities. */
export const ShellIcons = {
  Home: () => <HomeIcon className={iconClass} aria-hidden />,
  /** @deprecated Use Home — kept for transitional imports */
  Today: () => <HomeIcon className={iconClass} aria-hidden />,
  Trips: () => <MapIcon className={iconClass} aria-hidden />,
  /** @deprecated Use Trips */
  Loads: () => <MapIcon className={iconClass} aria-hidden />,
  Capture: () => <CameraIcon className={iconClass} aria-hidden />,
  Pay: () => <WalletIcon className={iconClass} aria-hidden />,
  Messages: () => <ChatBubbleLeftRightIcon className={iconClass} aria-hidden />,
  Equipment: () => <TruckIcon className={iconClass} aria-hidden />,
  Safety: () => <ShieldCheckIcon className={iconClass} aria-hidden />,
  More: () => <EllipsisHorizontalIcon className={iconClass} aria-hidden />,
  Search: () => <MagnifyingGlassIcon className={iconClass} aria-hidden />,
  Notifications: () => <BellIcon className={iconClass} aria-hidden />,
  ElmAi: () => <SparklesIcon className={iconClass} aria-hidden />,
  /** @deprecated Use ElmAi */
  Assistant: () => <SparklesIcon className={iconClass} aria-hidden />,
} as const;
