/** Shared responsive shell — centered, scales on desktop without feeling phone-only */
export const TERMINAL_SHELL =
  'max-w-6xl xl:max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8';

/**
 * Mission Control / driver ops column.
 * Mobile: full width with gutters. Desktop: intentional ops column (not a stretched phone).
 * Wider than a phone mock, narrower than a dispatcher dashboard.
 */
export const MISSION_SHELL =
  'max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8';

export const TERMINAL_HEADER_OFFSET = 'pt-[3.75rem] sm:pt-[4.25rem]';

export const TERMINAL_HEADER_OFFSET_WITH_EDIT =
  'pt-[6.5rem] sm:pt-[7rem]';
