import React from 'react';

interface StatusBadgeProps {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'critical' | 'info';
}

const TONE: Record<NonNullable<StatusBadgeProps['tone']>, string> = {
  neutral: 'mc-status-badge--neutral',
  success: 'mc-status-badge--success',
  warning: 'mc-status-badge--warning',
  critical: 'mc-status-badge--critical',
  info: 'mc-status-badge--info',
};

/** Compact status pill for operational states. */
const StatusBadge: React.FC<StatusBadgeProps> = ({ children, tone = 'neutral' }) => (
  <span className={`mc-status-badge ${TONE[tone]}`}>{children}</span>
);

export default StatusBadge;
