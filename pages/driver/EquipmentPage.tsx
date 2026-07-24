import React, { useState } from 'react';
import MissionShell from '../../components/mission-control/MissionShell.tsx';
import ElmCard from '../../design-system/components/ElmCard.tsx';
import EmptyState from '../../design-system/components/EmptyState.tsx';
import { useDriverExperience } from '../../context/DriverExperienceContext.tsx';
import type { EquipmentDefect } from '../../services/dataSource/types.ts';

const severityTone: Record<EquipmentDefect['severity'], 'ok' | 'warning' | 'critical'> = {
  minor: 'ok',
  major: 'warning',
  critical: 'critical',
};

/**
 * Equipment — truck/trailer summary, DVIR, defects, maintenance, roadside.
 * Also mounted at /showcase/truck as an alias.
 */
const EquipmentPage: React.FC = () => {
  const { mode, dataSource, actions } = useDriverExperience();
  const truck = dataSource.getTruckStatus();
  const [status, setStatus] = useState('');
  const hasData = mode === 'showcase' && truck.truckNumber !== '—';

  const reportIssue = async () => {
    if (!actions.requestMaintenance) return;
    const result = await actions.requestMaintenance();
    setStatus(`${result.disclosure}: ${result.message}`);
  };

  return (
    <MissionShell title="My vehicle" activeNav="more">
      <div className="space-y-6">
        <header>
          <p className="mc-kicker">My vehicle</p>
          <h1 className="mc-page-title">Assigned truck &amp; trailer</h1>
          <p className="mc-section-copy">
            {hasData
              ? 'Demonstration data only — Showcase equipment preview.'
              : 'Truck, trailer, and inspection status will appear here when connected.'}
          </p>
        </header>

        {!hasData ? (
          <EmptyState
            kicker="My vehicle"
            title="Vehicle details aren't available yet"
            description="Truck number, trailer, DVIR status, and maintenance history will show here once connected."
          />
        ) : (
          <>
            <ElmCard variant="default" padding="md" as="section" aria-label="Vehicle summary">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="mc-kicker mb-0">{truck.makeModelLabel || 'Assigned truck & trailer'}</p>
                  <h2 className="mc-section-title">
                    {truck.truckNumber} · {truck.trailerNumber}
                  </h2>
                </div>
                <span className="mc-capability-chip">{truck.disclosure}</span>
              </div>
              <dl className="mc-metric-grid">
                <div className="mc-metric-tile">
                  <dt>Status</dt>
                  <dd>{truck.statusLabel}</dd>
                </div>
                <div className="mc-metric-tile">
                  <dt>Odometer</dt>
                  <dd>{truck.odometerLabel || '—'}</dd>
                </div>
                <div className="mc-metric-tile">
                  <dt>Fuel level</dt>
                  <dd>{truck.fuelLevelLabel || '—'}</dd>
                </div>
                <div className="mc-metric-tile">
                  <dt>Next service</dt>
                  <dd>{truck.nextServiceLabel}</dd>
                </div>
              </dl>
            </ElmCard>

            <ElmCard variant="muted" padding="md" as="section" aria-label="DVIR and maintenance">
              <p className="mc-kicker mb-3">Inspection & maintenance</p>
              <dl className="mc-meta-grid">
                <div>
                  <dt>DVIR status</dt>
                  <dd>{truck.dvirStatusLabel || '—'}</dd>
                </div>
                <div>
                  <dt>Maintenance due</dt>
                  <dd>{truck.maintenanceDueLabel || '—'}</dd>
                </div>
                <div>
                  <dt>Roadside</dt>
                  <dd>{truck.roadsideLabel || 'No roadside events open'}</dd>
                </div>
                {truck.documentLabels?.length ? (
                  <div>
                    <dt>Documents on file</dt>
                    <dd className="normal-case">{truck.documentLabels.join(', ')}</dd>
                  </div>
                ) : null}
              </dl>
            </ElmCard>

            {truck.defects?.length ? (
              <ElmCard variant="default" padding="md" as="section" aria-label="Defects">
                <p className="mc-kicker mb-3">Logged defects</p>
                <ul className="mc-task-list">
                  {truck.defects.map((d) => (
                    <li key={d.id} className="mc-task-row">
                      <div className="min-w-0 flex-1">
                        <p className="mc-task-title">{d.label}</p>
                        <p className="mc-task-detail">{d.statusLabel}</p>
                      </div>
                      <span className={`mc-status-badge mc-status-badge--${severityTone[d.severity]}`}>
                        {d.severity}
                      </span>
                    </li>
                  ))}
                </ul>
              </ElmCard>
            ) : null}

            <ElmCard variant="muted" padding="md" as="section" aria-label="Report an issue">
              <p className="mc-kicker mb-2">Report an issue</p>
              <p className="mc-section-copy">
                Simulated action — records a demo maintenance request. No real work order is
                created.
              </p>
              {status ? (
                <p className="text-xs text-amber-300 normal-case mt-3" role="status">
                  {status}
                </p>
              ) : null}
              <button type="button" className="mc-exception-action mt-4" onClick={reportIssue}>
                Simulate maintenance request
              </button>
            </ElmCard>
          </>
        )}
      </div>
    </MissionShell>
  );
};

export default EquipmentPage;
