import React from 'react';
import GlassCard from '../../design-system/components/GlassCard.tsx';
import type { MissionException } from '../../types/missionControl.ts';
import type { SubmissionType } from '../../types/submission.ts';

const severityGlow = {
  critical: 'rose' as const,
  warning: 'amber' as const,
  info: 'cyan' as const,
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
          <GlassCard
            key={item.id}
            glowColor={severityGlow[item.severity]}
            padding="md"
            as="div"
            className={
              item.severity === 'critical'
                ? 'mc-exception mc-exception-critical border-0'
                : item.severity === 'warning'
                  ? 'mc-exception mc-exception-warning border-0'
                  : 'mc-exception mc-exception-info border-0'
            }
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
              <div className="min-w-0 flex-1 flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 shrink-0"
                  aria-hidden
                >
                  !
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="mc-kicker mb-0">
                      {item.severity === 'critical' ? 'Action required' : 'Attention'}
                    </p>
                    {item.loadNum ? (
                      <span className="text-[10px] font-mono text-zinc-400">Load #{item.loadNum}</span>
                    ) : null}
                  </div>
                  <h2 className="mc-exception-title">{item.title}</h2>
                  <p className="mc-exception-detail">{item.detail}</p>
                </div>
              </div>
              {canActivate && actionHref && actionLabel && submissionType && onActivateAction ? (
                <button
                  type="button"
                  className="mc-exception-action shrink-0 bg-gradient-to-r from-rose-600 to-red-600 border-rose-400/50 hover:brightness-110"
                  onClick={() =>
                    onActivateAction({
                      submissionType,
                      href: actionHref,
                    })
                  }
                >
                  {actionLabel} →
                </button>
              ) : null}
            </div>
          </GlassCard>
        );
      })}
    </section>
  );
};

export default ExceptionBanner;
