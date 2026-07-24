import React from 'react';
import ElmCard from '../../design-system/components/ElmCard.tsx';
import CapabilityStateBadge from './CapabilityStateBadge.tsx';
import type { EarningsSummary } from '../../types/missionControl.ts';

interface EarningsCardProps {
  earnings: EarningsSummary;
}

const EarningsCard: React.FC<EarningsCardProps> = ({ earnings }) => {
  const unavailable =
    earnings.capability === 'FUTURE' || earnings.capability === 'READY_FOR_INTEGRATION';
  const demo = earnings.capability === 'DEMONSTRATION';

  return (
    <ElmCard variant="muted" padding="md" as="section" className="mc-section" aria-label="Earnings">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="mc-kicker">Earnings</p>
          <h2 className="mc-section-title">{earnings.periodLabel}</h2>
        </div>
        {demo ? (
          <CapabilityStateBadge state="DEMO_ONLY" />
        ) : unavailable ? (
          <CapabilityStateBadge state="NOT_CONNECTED" />
        ) : null}
      </div>
      {unavailable ? (
        <>
          <p className="mc-earnings-value" aria-label="Earnings not available">
            —
          </p>
          <p className="mc-section-copy mt-2">
            Not available yet. Finalized settlement earnings are not connected in this build. No pay
            amounts are calculated or estimated.
          </p>
        </>
      ) : (
        <>
          <p className="mc-earnings-value" aria-label="Projected settlement">
            {earnings.projectedLabel}
          </p>
          <p className="mc-section-copy mt-2">{earnings.note}</p>
        </>
      )}
    </ElmCard>
  );
};

export default EarningsCard;
