import React from 'react';
import {
  Squares2X2Icon,
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
  Today: () => <Squares2X2Icon className={iconClass} aria-hidden />,
  Loads: () => <MapIcon className={iconClass} aria-hidden />,
  Capture: () => <CameraIcon className={iconClass} aria-hidden />,
  Pay: () => <WalletIcon className={iconClass} aria-hidden />,
  Messages: () => <ChatBubbleLeftRightIcon className={iconClass} aria-hidden />,
  Equipment: () => <TruckIcon className={iconClass} aria-hidden />,
  Safety: () => <ShieldCheckIcon className={iconClass} aria-hidden />,
  More: () => <EllipsisHorizontalIcon className={iconClass} aria-hidden />,
  Search: () => <MagnifyingGlassIcon className={iconClass} aria-hidden />,
  Notifications: () => <BellIcon className={iconClass} aria-hidden />,
  Assistant: () => <SparklesIcon className={iconClass} aria-hidden />,
} as const;
