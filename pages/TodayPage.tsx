import React, { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useSubmissionDraft } from '../context/SubmissionDraftContext.tsx';
import { useDriverExperience } from '../context/DriverExperienceContext.tsx';
import MissionShell from '../components/mission-control/MissionShell.tsx';
import ActiveHaulCard from '../components/mission-control/ActiveHaulCard.tsx';
import EarningsCard from '../components/mission-control/EarningsCard.tsx';
import OutstandingTasks from '../components/mission-control/OutstandingTasks.tsx';
import ElmCard from '../design-system/components/ElmCard.tsx';
import CapabilityStateBadge from '../components/mission-control/CapabilityStateBadge.tsx';
import { getCompanyDisplayName } from '../utils/companyMap.ts';
import {
  activateMissionCapture,
  type MissionCaptureTarget,
} from '../utils/missionCapture.ts';
import {
  openPayrollTripSubmission,
  PAYROLL_TRIP_SUBMISSION_HELPER,
  PAYROLL_TRIP_SUBMISSION_LABEL,
} from '../utils/payrollTripSubmission.ts';
import { formatLastLogin } from '../utils/lastLogin.ts';

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Driver Home — identity, then the two live actions, then future/unavailable sections.
 */
const TodayPage: React.FC = () => {
  const { session, previousLoginAt, hasRecordedLogin } = useAuth();
  const { clearDraft, startDraft } = useSubmissionDraft();
  const navigate = useNavigate();
  const { mode, routePrefix, dataSource, actions } = useDriverExperience();
  const [simMessage, setSimMessage] = useState('');

  const model = useMemo(() => dataSource.getMissionControl(), [dataSource]);
  const companyForUpload = getCompanyDisplayName(session?.companyCode);
  const tasksLive = mode === 'showcase';
  const lastLoginLabel = previousLoginAt
    ? formatLastLogin(previousLoginAt)
    : hasRecordedLogin
      ? 'First recorded login'
      : 'Not available yet';

  const openBolPod = useCallback(async () => {
    const target: MissionCaptureTarget = {
      submissionType: 'BOL_POD',
      href: mode === 'showcase' ? `${routePrefix}/capture` : '/submissions/bol-pod',
    };
    if (mode === 'showcase') {
      if (actions.submitPodSimulated) {
        const result = await actions.submitPodSimulated();
        setSimMessage(`${result.disclosure}: ${result.message}`);
      }
      navigate(`${routePrefix}/capture`);
      return;
    }
    activateMissionCapture({
      ...target,
      driverName: session?.driverName || '',
      company: companyForUpload,
      clearDraft,
      startDraft,
      navigate,
    });
  }, [
    mode,
    actions,
    routePrefix,
    session?.driverName,
    companyForUpload,
    clearDraft,
    startDraft,
    navigate,
  ]);

  const safety = mode === 'showcase' ? dataSource.getSafetyStatus() : null;
  const pay = mode === 'showcase' ? dataSource.getPaySummary() : null;
  const truck = mode === 'showcase' ? dataSource.getTruckStatus() : null;
  const ackMessage =
    mode === 'showcase'
      ? dataSource.getMessages().find((m) => m.unread && m.ackRequired)
      : null;
  const recentActivity = mode === 'showcase' ? dataSource.getTimeline().slice(0, 3) : [];

  const tripsTo = `${routePrefix}/trips`;
  const captureTo = `${routePrefix}/capture`;
  const payTo = `${routePrefix}/pay`;
  const messagesTo = `${routePrefix}/messages`;

  return (
    <MissionShell title="Home" activeNav="home" connectionLabel={model.connectionLabel}>
      <div className="mc-home">
        <header className="mc-home-header">
          <p className="mc-kicker">Home</p>
          <h1 className="mc-page-title">
            {mode === 'showcase' ? `${greetingForNow()}, ${model.driverDisplayName}` : 'Your work'}
          </h1>
          <p className="mc-section-copy">
            {mode === 'showcase' ? (
              <>
                {model.companyLabel ? `${model.companyLabel} · ` : ''}
                Demonstration data only
              </>
            ) : (
              <>
                {model.driverDisplayName}
                {model.companyLabel ? ` · ${model.companyLabel}` : ''}
              </>
            )}
          </p>
          {mode === 'production' ? (
            <p className="mc-last-login" aria-label={`Last login ${lastLoginLabel}`}>
              <span className="mc-last-login-kicker">Last login</span>
              <span className="mc-last-login-value">{lastLoginLabel}</span>
            </p>
          ) : null}
        </header>

        {simMessage ? (
          <p className="mc-sim-status" role="status">
            {simMessage}
          </p>
        ) : null}

        {mode === 'production' &&
        session?.authRole === 'admin' &&
        session?.canSelectAnyDriver ? (
          <ElmCard
            variant="default"
            padding="md"
            as="section"
            aria-label="Admin Showcase entry"
            className="mb-6"
          >
            <p className="mc-kicker mb-2">Admin</p>
            <h2 className="mc-section-title">Enter Showcase</h2>
            <p className="mc-section-copy">
              You are on the Production path. Open More to enter Showcase with demonstration data.
            </p>
            <Link to="/more#showcase-entry" className="mc-exception-action mt-4 inline-flex no-underline">
              Go to More → Showcase
            </Link>
          </ElmCard>
        ) : null}

        {/* Live primary actions — equal prominence */}
        <section className="mc-home-live-actions" aria-label="Live actions">
          <h2 className="mc-home-section-title">What do you need to do?</h2>
          <div className="mc-live-action-grid">
            <button
              type="button"
              className="mc-live-action"
              onClick={() => openBolPod()}
              aria-label="Upload BOL / POD"
            >
              <span className="mc-live-action-kicker">Documents</span>
              <span className="mc-live-action-title">Upload BOL / POD</span>
              <span className="mc-live-action-copy">
                Camera-first upload for bills of lading and proofs of delivery. Use only when safely
                stopped.
              </span>
            </button>
            <button
              type="button"
              className="mc-live-action"
              onClick={() => openPayrollTripSubmission()}
              aria-label={PAYROLL_TRIP_SUBMISSION_LABEL}
            >
              <span className="mc-live-action-kicker">Trip form</span>
              <span className="mc-live-action-title">{PAYROLL_TRIP_SUBMISSION_LABEL}</span>
              <span className="mc-live-action-copy">{PAYROLL_TRIP_SUBMISSION_HELPER}</span>
            </button>
          </div>
        </section>

        {/* Future / unavailable — restrained */}
        <section className="mc-home-future" aria-labelledby="home-assigned-trips-heading">
          <div className="mc-home-section-head">
            <h2 id="home-assigned-trips-heading" className="mc-home-section-title">
              Assigned trips
            </h2>
            {mode === 'production' ? <CapabilityStateBadge state="NOT_CONNECTED" /> : null}
            {mode === 'showcase' ? (
              <Link to={tripsTo} className="mc-home-section-link">
                All trips
              </Link>
            ) : null}
          </div>
          {mode === 'production' ? (
            <ElmCard variant="muted" padding="md" as="div">
              <p className="mc-section-copy">
                Assigned trip details will appear here when dispatch integration is available.
              </p>
            </ElmCard>
          ) : (
            <>
              <ActiveHaulCard haul={model.activeHaul} dataCapability={model.dataCapability} />
              {model.activeHaul ? (
                <div className="mc-home-trip-actions">
                  <Link to={tripsTo} className="mc-secondary-action no-underline">
                    View trip
                  </Link>
                  <button type="button" className="mc-secondary-action" onClick={() => openBolPod()}>
                    Upload BOL / POD
                  </button>
                  <button
                    type="button"
                    className="mc-secondary-action"
                    onClick={() => openPayrollTripSubmission()}
                  >
                    {PAYROLL_TRIP_SUBMISSION_LABEL}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>

        <aside className="mc-home-aside" aria-label="Status and future capabilities">
          <ElmCard variant="muted" padding="md" as="section" aria-label="Receipt submission">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="mc-kicker mb-0">Receipts</p>
                <h2 className="mc-section-title">Receipt submission</h2>
              </div>
              <CapabilityStateBadge state="COMING_SOON" />
            </div>
            <p className="mc-section-copy">
              Receipt submission is being connected and is not available yet.
            </p>
          </ElmCard>

          <EarningsCard earnings={model.earnings} />

          <OutstandingTasks
            tasks={tasksLive ? model.tasks : []}
            onActivateTask={
              tasksLive
                ? (target) =>
                    activateMissionCapture({
                      ...target,
                      driverName: session?.driverName || '',
                      company: companyForUpload,
                      clearDraft,
                      startDraft,
                      navigate,
                    })
                : undefined
            }
            live={tasksLive}
          />

          {mode === 'showcase' && ackMessage ? (
            <div className="mc-attention-card mc-attention-card--critical">
              <div className="min-w-0">
                <p className="mc-kicker mb-1">Read dispatch message</p>
                <p className="mc-section-copy">
                  {ackMessage.from} · {ackMessage.subject}
                </p>
              </div>
              <Link to={messagesTo} className="mc-exception-action no-underline shrink-0">
                Open message
              </Link>
            </div>
          ) : null}

          {mode === 'showcase' &&
          safety?.credentials?.some((c) => (c.statusLabel || '').toLowerCase().includes('expir')) ? (
            <div className="mc-attention-card mc-attention-card--warning">
              <div className="min-w-0">
                <p className="mc-kicker mb-1">Review expiring credential</p>
                <p className="mc-section-copy">
                  {safety.credentials.find((c) =>
                    (c.statusLabel || '').toLowerCase().includes('expir')
                  )?.title || 'Credential review needed'}
                </p>
              </div>
              <Link
                to={`${routePrefix}/safety`}
                className="mc-exception-action no-underline shrink-0"
              >
                Open qualifications
              </Link>
            </div>
          ) : null}

          {mode === 'showcase' && (pay?.reimbursementsPendingLabel || pay?.payrollStatusLabel) ? (
            <ElmCard variant="muted" padding="md" as="section" aria-label="Pay status">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="mc-kicker mb-0">Pay</p>
                <CapabilityStateBadge state="DEMO_ONLY" />
              </div>
              <dl className="mc-meta-grid">
                {pay?.payrollStatusLabel ? (
                  <div>
                    <dt>Settlement</dt>
                    <dd>{pay.payrollStatusLabel}</dd>
                  </div>
                ) : null}
                {pay?.reimbursementsPendingLabel ? (
                  <div>
                    <dt>Reimbursement</dt>
                    <dd>{pay.reimbursementsPendingLabel}</dd>
                  </div>
                ) : null}
              </dl>
              <Link to={payTo} className="mc-home-section-link mt-3 inline-flex">
                Review settlement
              </Link>
            </ElmCard>
          ) : null}

          {mode === 'showcase' && truck ? (
            <ElmCard variant="muted" padding="md" as="section" aria-label="Assigned vehicle">
              <p className="mc-kicker mb-2">Assigned truck &amp; trailer</p>
              <p className="mc-task-title">
                {truck.truckNumber} / {truck.trailerNumber}
              </p>
              <p className="mc-task-detail">{truck.statusLabel}</p>
              <Link
                to={`${routePrefix}/equipment`}
                className="mc-home-section-link mt-3 inline-flex"
              >
                My vehicle
              </Link>
            </ElmCard>
          ) : null}

          {mode === 'showcase' && recentActivity.length > 0 ? (
            <section aria-labelledby="home-activity-heading">
              <h2 id="home-activity-heading" className="mc-home-section-title mb-3">
                Recent activity
              </h2>
              <ElmCard variant="default" padding="md" as="div">
                <ul className="mc-task-list">
                  {recentActivity.map((e) => (
                    <li key={e.id} className="mc-task-row">
                      <div className="min-w-0 flex-1">
                        <p className="mc-task-title">{e.title}</p>
                        <p className="mc-task-detail">
                          {e.whenLabel} · {e.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </ElmCard>
            </section>
          ) : null}

          {mode === 'showcase' ? (
            <nav className="mc-home-shortcuts" aria-label="Shortcuts">
              <p className="mc-home-section-title mb-3">Shortcuts</p>
              <div className="mc-home-shortcut-row">
                <Link to={captureTo} className="mc-home-shortcut">
                  Upload BOL / POD
                </Link>
                <Link to={messagesTo} className="mc-home-shortcut">
                  Messages
                </Link>
                <Link to={payTo} className="mc-home-shortcut">
                  Pay
                </Link>
              </div>
              <p className="mc-safe-driving-note">
                Complete actions only when safely stopped. Do not interact while driving.
              </p>
            </nav>
          ) : null}
        </aside>
      </div>
    </MissionShell>
  );
};

export default TodayPage;
