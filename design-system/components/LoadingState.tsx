import React from 'react';

interface LoadingStateProps {
  label?: string;
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Loading…',
  className = '',
}) => (
  <div
    className={`mc-state-panel mc-state-loading ${className}`.trim()}
    role="status"
    aria-live="polite"
  >
    <span className="mc-state-spinner" aria-hidden />
    <p className="mc-section-copy mb-0">{label}</p>
  </div>
);

export default LoadingState;
