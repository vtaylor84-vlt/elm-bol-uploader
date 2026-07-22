import React, { useState } from 'react';
import MissionShell from '../../components/mission-control/MissionShell.tsx';
import ElmCard from '../../design-system/components/ElmCard.tsx';
import EmptyState from '../../design-system/components/EmptyState.tsx';
import { useDriverExperience } from '../../context/DriverExperienceContext.tsx';
import type { CredentialItem } from '../../services/dataSource/types.ts';

const urgencyTone: Record<NonNullable<CredentialItem['urgency']>, 'ok' | 'warning' | 'critical'> = {
  ok: 'ok',
  soon: 'warning',
  expired: 'critical',
};

/** Safety — HOS, credentials, training, and inspection history. Careful, non-punitive language. */
const SafetyPage: React.FC = () => {
  const { mode, dataSource, actions } = useDriverExperience();
  const safety = dataSource.getSafetyStatus();
  const [status, setStatus] = useState('');
  const hasData = mode === 'showcase';

  const completeTraining = async () => {
    if (!actions.completeTraining) return;
    const result = await actions.completeTraining();
    setStatus(`${result.disclosure}: ${result.message}`);
  };

  return (
    <MissionShell title="Safety" activeNav="more">
      <div className="space-y-6">
        <header>
          <p className="mc-kicker">Safety</p>
          <h1 className="mc-page-title">Hours, credentials & training</h1>
          <p className="mc-section-copy">
            {hasData
              ? 'Demonstration data only — an illustrative summary, not a live safety record.'
              : 'Hours-of-service, credentials, and training status will appear here when safety service is connected.'}
          </p>
        </header>

        {!hasData ? (
          <EmptyState
            kicker="Safety"
            title="Safety details aren't available yet"
            description="Hours-of-service, credential expirations, and training status will show here once safety service is connected."
          />
        ) : (
          <>
            <ElmCard variant="default" padding="md" as="section" aria-label="Hours of service">
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="mc-kicker mb-0">Hours of service</p>
                <span className="mc-capability-chip">{safety.disclosure}</span>
              </div>
              <dl className="mc-metric-grid">
                <div className="mc-metric-tile">
                  <dt>Drive remaining</dt>
                  <dd>{safety.hosDriveRemainingLabel || '—'}</dd>
                </div>
                <div className="mc-metric-tile">
                  <dt>Shift remaining</dt>
                  <dd>{safety.hosShiftRemainingLabel || '—'}</dd>
                </div>
                <div className="mc-metric-tile">
                  <dt>Status</dt>
                  <dd>{safety.scoreLabel}</dd>
                </div>
              </dl>
            </ElmCard>

            {safety.credentials?.length ? (
              <ElmCard variant="muted" padding="md" as="section" aria-label="Credentials">
                <p className="mc-kicker mb-3">Credentials</p>
                <ul className="mc-task-list">
                  {safety.credentials.map((c) => (
                    <li key={c.id} className="mc-task-row">
                      <div className="min-w-0 flex-1">
                        <p className="mc-task-title">{c.title}</p>
                        <p className="mc-task-detail">
                          {c.statusLabel}
                          {c.expiresLabel ? ` · ${c.expiresLabel}` : ''}
                        </p>
                      </div>
                      {c.urgency ? (
                        <span className={`mc-status-badge mc-status-badge--${urgencyTone[c.urgency]}`}>
                          {c.urgency === 'ok' ? 'Valid' : c.urgency === 'soon' ? 'Renew soon' : 'Expired'}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </ElmCard>
            ) : null}

            <ElmCard variant="default" padding="md" as="section" aria-label="Training and inspections">
              <p className="mc-kicker mb-3">Training & inspection history</p>
              <dl className="mc-meta-grid">
                <div>
                  <dt>Training due</dt>
                  <dd>{safety.trainingDueLabel || '—'}</dd>
                </div>
                <div>
                  <dt>Inspection history</dt>
                  <dd>{safety.inspectionHistoryLabel || '—'}</dd>
                </div>
              </dl>
              {safety.trendNote ? <p className="mc-section-copy mt-3">{safety.trendNote}</p> : null}
            </ElmCard>

            <ElmCard variant="muted" padding="md" as="section" aria-label="Open items">
              <p className="mc-kicker mb-3">Open items</p>
              {safety.openItems.length ? (
                <ul className="mc-task-list">
                  {safety.openItems.map((item) => (
                    <li key={item} className="mc-task-row">
                      <div className="min-w-0 flex-1">
                        <p className="mc-task-title">{item}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mc-section-copy">No open demo items — everything is current.</p>
              )}
              {status ? (
                <p className="text-xs text-amber-300 normal-case mt-3" role="status">
                  {status}
                </p>
              ) : null}
              <button type="button" className="mc-exception-action mt-4" onClick={completeTraining}>
                Simulate training complete
              </button>
            </ElmCard>
          </>
        )}
      </div>
    </MissionShell>
  );
};

export default SafetyPage;
