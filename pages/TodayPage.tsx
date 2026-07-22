import React, { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useSubmissionDraft } from '../context/SubmissionDraftContext.tsx';
import { useDriverExperience } from '../context/DriverExperienceContext.tsx';
import MissionShell from '../components/mission-control/MissionShell.tsx';
import ExceptionBanner from '../components/mission-control/ExceptionBanner.tsx';
import ActiveHaulCard from '../components/mission-control/ActiveHaulCard.tsx';
import PrimaryActionButton from '../components/mission-control/PrimaryActionButton.tsx';
import EarningsCard from '../components/mission-control/EarningsCard.tsx';
import OutstandingTasks from '../components/mission-control/OutstandingTasks.tsx';
import ElmCard from '../design-system/components/ElmCard.tsx';
import CapabilityStateBadge from '../components/mission-control/CapabilityStateBadge.tsx';
import { getCompanyDisplayName } from '../utils/companyMap.ts';
import {
  activateMissionCapture,
  type MissionCaptureTarget,
} from '../utils/missionCapture.ts';

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Driver Home — task-first command surface ordered by urgency:
 * 1) Next step  2) Needs attention  3) Current trip  4) Recent activity  5) Shortcuts
 */
const TodayPage: React.FC = () => {
  const { session } = useAuth();
  const { clearDraft, startDraft } = useSubmissionDraft();
  const navigate = useNavigate();
  const { mode, routePrefix, dataSource, actions } = useDriverExperience();
  const [simMessage, setSimMessage] = useState('');

  const model = useMemo(() => dataSource.getMissionControl(), [dataSource]);
  const companyForUpload = getCompanyDisplayName(session?.companyCode);

  const openCapture = useCallback(
    async (target: MissionCaptureTarget) => {
      if (mode === 'showcase') {
        if (actions.submitPodSimulated && target.submissionType === 'BOL_POD') {
          const result = await actions.submitPodSimulated();
          setSimMessage(`${result.disclosure}: ${result.message}`);
        } else if (actions.submitReceiptSimulated) {
          const result = await actions.submitReceiptSimulated();
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
    },
    [
      mode,
      actions,
      routePrefix,
      session?.driverName,
      companyForUpload,
      clearDraft,
      startDraft,
      navigate,
    ]
  );

  const safety = mode === 'showcase' ? dataSource.getSafetyStatus() : null;
  const pay = mode === 'showcase' ? dataSource.getPaySummary() : null;
  const truck = mode === 'showcase' ? dataSource.getTruckStatus() : null;
  const ackMessage =
    mode === 'showcase'
      ? dataSource.getMessages().find((m) => m.unread && m.ackRequired)
      : null;
  const recentActivity = mode === 'showcase' ? dataSource.getTimeline().slice(0, 3) : [];
  const attentionCount =
    (model.exceptions?.length || 0) +
    (model.tasks?.filter((t) => t.urgency === 'due_now' || t.urgency === 'blocked').length || 0) +
    (ackMessage ? 1 : 0);

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
                {attentionCount > 0 ? ` · ${attentionCount} need${attentionCount === 1 ? 's' : ''} attention` : ''}
              </>
            ) : (
              <>
                {model.driverDisplayName}
                {model.companyLabel ? ` · ${model.companyLabel}` : ''}
              </>
            )}
          </p>
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

        {/* 1. Next step — dominant action */}
        <section className="mc-home-next" aria-labelledby="home-next-heading">
          <div className="mc-home-section-head">
            <h2 id="home-next-heading" className="mc-home-section-title">
              Next step
            </h2>
          </div>
          <PrimaryActionButton
            action={{
              ...model.primaryAction,
              href: mode === 'showcase' ? captureTo : model.primaryAction.href,
              capability: mode === 'showcase' ? 'DEMONSTRATION' : model.primaryAction.capability,
            }}
            onActivate={() =>
              openCapture({
                submissionType: model.primaryAction.submissionType,
                href: mode === 'showcase' ? captureTo : model.primaryAction.href,
              })
            }
          />
        </section>

        {/* 2. Needs attention */}
        <section className="mc-home-attention" aria-labelledby="home-attention-heading">
          <div className="mc-home-section-head">
            <h2 id="home-attention-heading" className="mc-home-section-title">
              Needs attention
            </h2>
            {attentionCount > 0 ? (
              <CapabilityStateBadge state="NEEDS_ATTENTION" count={attentionCount} />
            ) : null}
          </div>
          <ExceptionBanner exceptions={model.exceptions} onActivateAction={openCapture} />
          <OutstandingTasks tasks={model.tasks} onActivateTask={openCapture} />

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
        </section>

        {/* 3. Current trip */}
        <section className="mc-home-trip" aria-labelledby="home-trip-heading">
          <div className="mc-home-section-head">
            <h2 id="home-trip-heading" className="mc-home-section-title">
              Current trip
            </h2>
            <Link to={tripsTo} className="mc-home-section-link">
              All trips
            </Link>
          </div>
          <ActiveHaulCard haul={model.activeHaul} dataCapability={model.dataCapability} />
          {model.activeHaul ? (
            <div className="mc-home-trip-actions">
              <Link to={tripsTo} className="mc-secondary-action no-underline">
                Trip details
              </Link>
              <Link to={captureTo} className="mc-secondary-action no-underline">
                Submit paperwork
              </Link>
              {mode === 'showcase' ? (
                <Link to={messagesTo} className="mc-secondary-action no-underline">
                  Contact dispatch
                </Link>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* Supporting column: pay, HOS, vehicle, activity, shortcuts */}
        <aside className="mc-home-aside" aria-label="Status and shortcuts">
          <EarningsCard earnings={model.earnings} />

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

          {mode === 'showcase' && safety?.hosDriveRemainingLabel ? (
            <ElmCard variant="muted" padding="md" as="section" aria-label="Hours of service">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="mc-kicker mb-0">Hours &amp; compliance</p>
                <CapabilityStateBadge state="DEMO_ONLY" />
              </div>
              <dl className="mc-metric-grid">
                <div className="mc-metric-tile">
                  <dt>Drive remaining</dt>
                  <dd>{safety.hosDriveRemainingLabel}</dd>
                </div>
                <div className="mc-metric-tile">
                  <dt>Shift remaining</dt>
                  <dd>{safety.hosShiftRemainingLabel}</dd>
                </div>
              </dl>
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

          {/* 4. Recent activity */}
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

          {/* 5. Contextual shortcuts */}
          {mode === 'showcase' ? (
            <nav className="mc-home-shortcuts" aria-label="Shortcuts">
              <p className="mc-home-section-title mb-3">Shortcuts</p>
              <div className="mc-home-shortcut-row">
                <Link to={captureTo} className="mc-home-shortcut">
                  Capture
                </Link>
                <Link to={messagesTo} className="mc-home-shortcut">
                  Messages
                </Link>
                <Link to={payTo} className="mc-home-shortcut">
                  Pay
                </Link>
                <Link to={`${routePrefix}/assistant`} className="mc-home-shortcut">
                  ELM AI
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
