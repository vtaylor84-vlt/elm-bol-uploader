import React from 'react';

interface AttentionCardProps {
  title: string;
  detail: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'critical' | 'warning' | 'info';
}

/** Attention-first alert used on Today and module headers. */
const AttentionCard: React.FC<AttentionCardProps> = ({
  title,
  detail,
  actionLabel,
  onAction,
  tone = 'warning',
}) => (
  <section className={`mc-attention-card mc-attention-card--${tone}`} aria-label={title}>
    <div className="min-w-0 flex-1">
      <h2 className="mc-attention-title">{title}</h2>
      <p className="mc-attention-detail">{detail}</p>
    </div>
    {actionLabel && onAction ? (
      <button type="button" className="mc-exception-action shrink-0" onClick={onAction}>
        {actionLabel}
      </button>
    ) : null}
  </section>
);

export default AttentionCard;
