import React from 'react';

export interface StatusBadgeProps {
  label: string;
  tone?: 'online' | 'info' | 'warning' | 'critical' | 'neutral';
  pulse?: boolean;
  className?: string;
  /** Prefer an honest aria description when the badge is visual chrome only. */
  ariaLabel?: string;
}

const toneClass = {
  online: 'elm-status-badge elm-status-badge--online',
  info: 'elm-status-badge elm-status-badge--info',
  warning: 'elm-status-badge elm-status-badge--warning',
  critical: 'elm-status-badge elm-status-badge--critical',
  neutral: 'elm-status-badge elm-status-badge--neutral',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  tone = 'online',
  pulse = true,
  className = '',
  ariaLabel,
}) => (
  <div
    className={`${toneClass[tone]} ${className}`.trim()}
    role="status"
    aria-label={ariaLabel || label}
  >
    <span
      className={`elm-status-dot${pulse && tone === 'online' ? ' elm-status-dot--pulse' : ''}`}
      aria-hidden
    />
    <span aria-hidden={ariaLabel ? true : undefined}>{label}</span>
  </div>
);

export default StatusBadge;
