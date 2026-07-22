import React from 'react';
import ElmCard from './ElmCard.tsx';

interface EmptyStateProps {
  kicker?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  chip?: string;
  className?: string;
}

/** Shared empty-state surface for production and Showcase pages. */
const EmptyState: React.FC<EmptyStateProps> = ({
  kicker = 'Status',
  title,
  description,
  action,
  chip,
  className = '',
}) => (
  <ElmCard
    variant="default"
    padding="md"
    as="section"
    className={className}
    aria-label={title}
  >
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <p className="mc-kicker">{kicker}</p>
        <h2 className="mc-section-title">{title}</h2>
      </div>
      {chip ? <span className="mc-capability-chip">{chip}</span> : null}
    </div>
    <p className="mc-section-copy">{description}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </ElmCard>
);

export default EmptyState;
