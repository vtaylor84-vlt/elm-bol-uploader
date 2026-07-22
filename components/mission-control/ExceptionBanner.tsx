import React from 'react';
import type { MissionException } from '../../types/missionControl.ts';
import type { SubmissionType } from '../../types/submission.ts';

const severityClass: Record<MissionException['severity'], string> = {
  critical: 'mc-exception mc-exception-critical',
  warning: 'mc-exception mc-exception-warning',
  info: 'mc-exception mc-exception-info',
};

interface ExceptionBannerProps {
  exceptions: MissionException[];
  onActivateAction?: (target: {
    submissionType: SubmissionType;
    href: string;
  }) => void;
}

const ExceptionBanner: React.FC<ExceptionBannerProps> = ({
  exceptions,
  onActivateAction,
}) => {
  if (!exceptions.length) return null;

  return (
    <section aria-label="Exceptions requiring attention" className="space-y-3">
      {exceptions.map((item) => {
        const { actionHref, actionLabel, submissionType } = item;
        const canActivate =
          Boolean(actionHref && actionLabel && submissionType && onActivateAction);

        return (
          <div key={item.id} className={severityClass[item.severity]} role="alert">
            <div className="min-w-0 flex-1">
              <p className="mc-kicker">
                {item.severity === 'critical' ? 'Action required' : 'Attention'}
              </p>
              <h2 className="mc-exception-title">{item.title}</h2>
              <p className="mc-exception-detail">{item.detail}</p>
            </div>
            {canActivate && actionHref && actionLabel && submissionType && onActivateAction ? (
              <button
                type="button"
                className="mc-exception-action"
                onClick={() =>
                  onActivateAction({
                    submissionType,
                    href: actionHref,
                  })
                }
              >
                {actionLabel}
              </button>
            ) : null}
          </div>
        );
      })}
    </section>
  );
};

export default ExceptionBanner;
