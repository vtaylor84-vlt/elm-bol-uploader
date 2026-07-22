import React from 'react';

interface SectionHeadingProps {
  kicker?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({
  kicker,
  title,
  description,
  action,
  className = '',
}) => (
  <div className={`mc-section-heading ${className}`.trim()}>
    <div className="min-w-0 flex-1">
      {kicker ? <p className="mc-kicker">{kicker}</p> : null}
      <h2 className="mc-section-title">{title}</h2>
      {description ? <p className="mc-section-copy">{description}</p> : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

export default SectionHeading;
