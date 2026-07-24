import React from 'react';
import DesignPrimaryActionButton from '../../design-system/components/PrimaryActionButton.tsx';
import type { PrimaryAction } from '../../types/missionControl.ts';

interface PrimaryActionButtonProps {
  action: PrimaryAction;
  onActivate: () => void;
}

const CameraIcon = () => (
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

/** Mission Control primary dock action — maps to design-system CTA. */
const PrimaryActionButton: React.FC<PrimaryActionButtonProps> = ({ action, onActivate }) => (
  <section aria-label="Primary recommended action" className="mc-primary-action">
    <DesignPrimaryActionButton
      label={action.label}
      sublabel={action.helperText}
      icon={<CameraIcon />}
      onClick={onActivate}
      variant={action.variant === 'urgent' ? 'urgent' : 'primary'}
      fullWidth
      trailing={<span aria-hidden>→</span>}
    />
    {action.capability === 'LIVE' ? (
      <p className="mc-primary-helper">
        <span className="mc-capability-inline">Live upload path</span>
      </p>
    ) : (
      <p className="mc-primary-helper">{action.helperText}</p>
    )}
  </section>
);

export default PrimaryActionButton;
