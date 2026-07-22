import React from 'react';

type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'demo';

interface StatusPillProps {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
}

const toneClass: Record<StatusTone, string> = {
  neutral: 'mc-status-pill',
  info: 'mc-status-pill mc-status-pill--info',
  success: 'mc-status-pill mc-status-pill--success',
  warning: 'mc-status-pill mc-status-pill--warning',
  danger: 'mc-status-pill mc-status-pill--danger',
  demo: 'mc-capability-chip',
};

const StatusPill: React.FC<StatusPillProps> = ({
  children,
  tone = 'neutral',
  className = '',
}) => <span className={`${toneClass[tone]} ${className}`.trim()}>{children}</span>;

export default StatusPill;
