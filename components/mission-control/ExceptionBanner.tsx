import React from 'react';
import { Link } from 'react-router-dom';
import type { MissionException } from '../../types/missionControl.ts';

const severityClass: Record<MissionException['severity'], string> = {
  critical: 'mc-exception mc-exception-critical',
  warning: 'mc-exception mc-exception-warning',
  info: 'mc-exception mc-exception-info',
};

interface ExceptionBannerProps {
  exceptions: MissionException[];
}

const ExceptionBanner: React.FC<ExceptionBannerProps> = ({ exceptions }) => {
  if (!exceptions.length) return null;

  return (
    <section aria-label="Exceptions requiring attention" className="space-y-3">
      {exceptions.map((item) => (
        <div key={item.id} className={severityClass[item.severity]} role="alert">
          <div className="min-w-0 flex-1">
            <p className="mc-kicker">{item.severity === 'critical' ? 'Action required' : 'Attention'}</p>
            <h2 className="mc-exception-title">{item.title}</h2>
            <p className="mc-exception-detail">{item.detail}</p>
          </div>
          {item.actionHref && item.actionLabel ? (
            <Link to={item.actionHref} className="mc-exception-action">
              {item.actionLabel}
            </Link>
          ) : null}
        </div>
      ))}
    </section>
  );
};

export default ExceptionBanner;
