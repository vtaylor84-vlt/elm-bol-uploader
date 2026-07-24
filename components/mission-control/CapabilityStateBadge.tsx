import React from 'react';

/**
 * Driver-facing capability states (governing architecture).
 * Status is never conveyed by color alone — always include a text label.
 */
export type CapabilityState =
  | 'AVAILABLE'
  | 'NEEDS_ATTENTION'
  | 'COMING_SOON'
  | 'NOT_CONNECTED'
  | 'RESTRICTED'
  | 'DEMO_ONLY'
  | 'ADMIN_TEST';

const LABELS: Record<CapabilityState, string> = {
  AVAILABLE: '',
  NEEDS_ATTENTION: 'Action required',
  COMING_SOON: 'Coming soon',
  NOT_CONNECTED: 'Not available yet',
  RESTRICTED: 'Restricted',
  DEMO_ONLY: 'Demo only',
  ADMIN_TEST: 'Admin test',
};

export function disclosureToCapabilityState(
  disclosure?: string | null
): CapabilityState | null {
  if (!disclosure) return null;
  const d = disclosure.toUpperCase();
  if (d.includes('NOT CONNECTED') || d.includes('NOT AVAILABLE')) return 'NOT_CONNECTED';
  if (d.includes('FUTURE') || d.includes('COMING SOON')) return 'COMING_SOON';
  if (d.includes('SIMULATED') || d.includes('DEMONSTRATION') || d.includes('DEMO'))
    return 'DEMO_ONLY';
  if (d.includes('ADMIN')) return 'ADMIN_TEST';
  if (d.includes('RESTRICTED')) return 'RESTRICTED';
  return null;
}

interface CapabilityStateBadgeProps {
  state: CapabilityState;
  /** Optional count for action-required state — omit when not meaningful. */
  count?: number;
  className?: string;
  /** When true, hide AVAILABLE (no decorative badge). */
  hideAvailable?: boolean;
}

const CapabilityStateBadge: React.FC<CapabilityStateBadgeProps> = ({
  state,
  count,
  className = '',
  hideAvailable = true,
}) => {
  if (state === 'AVAILABLE' && hideAvailable) return null;
  const label = LABELS[state];
  if (!label) return null;
  const text =
    state === 'NEEDS_ATTENTION' && typeof count === 'number' && count > 0
      ? `${label} · ${count}`
      : label;

  return (
    <span
      className={`mc-capability-state mc-capability-state--${state.toLowerCase().replace(/_/g, '-')} ${className}`.trim()}
      data-capability-state={state}
    >
      {text}
    </span>
  );
};

export default CapabilityStateBadge;
