import React from 'react';
import ElmCard from '../../design-system/components/ElmCard.tsx';
import type { EarningsSummary } from '../../types/missionControl.ts';

interface EarningsCardProps {
  earnings: EarningsSummary;
}

const EarningsCard: React.FC<EarningsCardProps> = ({ earnings }) => (
  <ElmCard variant="muted" padding="md" as="section" className="mc-section" aria-label="Earnings">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <p className="mc-kicker">Earnings</p>
        <h2 className="mc-section-title">{earnings.periodLabel}</h2>
      </div>
      {earnings.capability === 'DEMONSTRATION' ? (
        <span className="mc-capability-chip">Not live pay data</span>
      ) : null}
    </div>
    <p className="mc-earnings-value" aria-label="Projected settlement">
      {earnings.projectedLabel}
    </p>
    <p className="mc-section-copy mt-2">{earnings.note}</p>
  </ElmCard>
);

export default EarningsCard;
