import React from 'react';

interface ErrorStateProps {
  title?: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  action,
  className = '',
}) => (
  <div
    className={`mc-state-panel mc-state-error ${className}`.trim()}
    role="alert"
  >
    <p className="mc-kicker text-rose-300">Error</p>
    <h2 className="mc-section-title">{title}</h2>
    <p className="mc-section-copy">{message}</p>
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);

export default ErrorState;
