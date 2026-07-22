import React from 'react';
import ElmButton from '../../design-system/components/ElmButton.tsx';
import type { PrimaryAction } from '../../types/missionControl.ts';

interface PrimaryActionButtonProps {
  action: PrimaryAction;
  onActivate: () => void;
}

const PrimaryActionButton: React.FC<PrimaryActionButtonProps> = ({ action, onActivate }) => (
  <section aria-label="Primary recommended action" className="mc-primary-action">
    <ElmButton
      fullWidth
      size="lg"
      onClick={onActivate}
      trailing={
        <span aria-hidden className="text-lg leading-none">
          →
        </span>
      }
    >
      {action.label}
    </ElmButton>
    <p className="mc-primary-helper">
      {action.helperText}
      {action.capability === 'LIVE' ? (
        <span className="mc-capability-inline"> · Live upload</span>
      ) : null}
    </p>
  </section>
);

export default PrimaryActionButton;
