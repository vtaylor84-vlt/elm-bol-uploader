import React from 'react';
import ElmCard from '../../design-system/components/ElmCard.tsx';
import type { ActiveHaul, CapabilityClass } from '../../types/missionControl.ts';

interface ActiveHaulCardProps {
  haul: ActiveHaul | null;
  dataCapability: CapabilityClass;
}

const ActiveHaulCard: React.FC<ActiveHaulCardProps> = ({ haul, dataCapability }) => {
  if (!haul) {
    return (
      <ElmCard variant="muted" padding="md" as="section" className="mc-section">
        <p className="mc-kicker">Active haul</p>
        <h2 className="mc-section-title">No active load</h2>
        <p className="mc-section-copy">When a load is assigned, it will appear here with the next milestone.</p>
      </ElmCard>
    );
  }

  return (
    <ElmCard variant="default" padding="md" as="section" className="mc-section" aria-label="Active haul">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="mc-kicker">Active haul</p>
          <h2 className="mc-section-title">Load {haul.loadNum}</h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="mc-status-pill">{haul.statusLabel}</span>
          {dataCapability === 'DEMONSTRATION' ? (
            <span className="mc-capability-chip">Sample data</span>
          ) : null}
        </div>
      </div>

      <p className="mc-haul-route" aria-label="Route">
        <span>{haul.origin}</span>
        <span className="mc-haul-arrow" aria-hidden>
          →
        </span>
        <span>{haul.destination}</span>
      </p>

      <dl className="mc-meta-grid mt-5">
        <div>
          <dt>Next milestone</dt>
          <dd>{haul.nextMilestone}</dd>
        </div>
        <div>
          <dt>Appointment</dt>
          <dd>{haul.appointmentLabel}</dd>
        </div>
        <div>
          <dt>Countdown</dt>
          <dd className="text-amber-300">{haul.countdownLabel}</dd>
        </div>
        {haul.truckNumber ? (
          <div>
            <dt>Equipment</dt>
            <dd>
              {haul.truckNumber}
              {haul.trailerNumber ? ` · ${haul.trailerNumber}` : ''}
            </dd>
          </div>
        ) : null}
      </dl>

      {haul.missingDocuments.length > 0 ? (
        <div className="mt-5 pt-4 border-t border-blue-500/15">
          <p className="mc-kicker mb-2">Missing documents</p>
          <ul className="flex flex-wrap gap-2">
            {haul.missingDocuments.map((doc) => (
              <li key={doc} className="mc-doc-chip">
                {doc}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </ElmCard>
  );
};

export default ActiveHaulCard;
