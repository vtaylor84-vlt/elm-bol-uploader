import React from 'react';
import type { RouteMilestone } from '../../types/missionControl.ts';

interface RouteMilestoneBarProps {
  milestones: RouteMilestone[];
  capabilityNote?: boolean;
}

/** Horizontal pickup → delivery progress. Demo data until live load milestones exist. */
const RouteMilestoneBar: React.FC<RouteMilestoneBarProps> = ({
  milestones,
  capabilityNote = true,
}) => {
  if (!milestones.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="mc-kicker mb-0">Route progress</p>
        {capabilityNote ? (
          <span className="mc-capability-chip">Sample milestones</span>
        ) : null}
      </div>
      <ol className="mc-milestone" aria-label="Route milestones">
        {milestones.map((step) => (
          <li
            key={step.id}
            className={`mc-milestone-step is-${step.state}`}
          >
            <div className="mc-milestone-dot" aria-hidden />
            <p className="mc-milestone-label">{step.label}</p>
            <span className="sr-only">
              {step.state === 'done' ? 'Completed' : step.state === 'active' ? 'In progress' : 'Upcoming'}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default RouteMilestoneBar;
