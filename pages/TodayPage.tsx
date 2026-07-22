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
  const ackMessage =
    mode === 'showcase'
      ? dataSource.getMessages().find((m) => m.unread && m.ackRequired)
      : null;
  const recentActivity = mode === 'showcase' ? dataSource.getTimeline().slice(0, 3) : [];

  return (
    <MissionShell
      title="Mission Control"
      activeNav="today"
      connectionLabel={model.connectionLabel}
    >
      <div className="mc-today">
        <header className="mc-today-header">
          <p className="mc-kicker">Today</p>
          <h1 className="mc-page-title">What needs attention</h1>
          <p className="mc-section-copy">
            {mode === 'showcase' ? (
              <>
                {greetingForNow()}, {model.driverDisplayName}
                {model.companyLabel ? ` · ${model.companyLabel}` : ''} · Demonstration data only
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
          <p className="text-xs text-amber-300 normal-case mb-3" role="status">
            {simMessage}
          </p>
        ) : null}

        <div className="mc-today-alert">
          <ExceptionBanner exceptions={model.exceptions} onActivateAction={openCapture} />
        </div>

        <div className="mc-today-primary space-y-6">
          <ActiveHaulCard haul={model.activeHaul} dataCapability={model.dataCapability} />
          <PrimaryActionButton
            action={{
              ...model.primaryAction,
              href:
                mode === 'showcase'
                  ? `${routePrefix}/capture`
                  : model.primaryAction.href,
              capability: mode === 'showcase' ? 'DEMONSTRATION' : model.primaryAction.capability,
            }}
            onActivate={() =>
              openCapture({
                submissionType: model.primaryAction.submissionType,
                href:
                  mode === 'showcase'
                    ? `${routePrefix}/capture`
                    : model.primaryAction.href,
              })
            }
          />
        </div>

        <aside className="mc-today-aside space-y-6" aria-label="Earnings and tasks">
          <EarningsCard earnings={model.earnings} />
          <OutstandingTasks tasks={model.tasks} onActivateTask={openCapture} />

          {mode === 'showcase' && ackMessage ? (
            <div className="mc-attention-card mc-attention-card--critical">
              <div className="min-w-0">
                <p className="mc-kicker mb-1">Acknowledgement requested</p>
                <p className="mc-section-copy">
                  {ackMessage.from} · {ackMessage.subject}
                </p>
              </div>
              <Link to={`${routePrefix}/messages`} className="mc-exception-action no-underline shrink-0">
                Open Messages
              </Link>
            </div>
          ) : null}

          {mode === 'showcase' && safety?.hosDriveRemainingLabel ? (
            <ElmCard variant="muted" padding="md" as="section" aria-label="Hours of service">
              <p className="mc-kicker mb-2">Hours of service</p>
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

          {mode === 'showcase' && (pay?.reimbursementsPendingLabel || pay?.payrollStatusLabel) ? (
            <ElmCard variant="muted" padding="md" as="section" aria-label="Pay status">
              <p className="mc-kicker mb-2">Pay status</p>
              <dl className="mc-meta-grid">
                {pay?.payrollStatusLabel ? (
                  <div>
                    <dt>Settlement</dt>
                    <dd>{pay.payrollStatusLabel}</dd>
                  </div>
                ) : null}
                {pay?.reimbursementsPendingLabel ? (
                  <div>
                    <dt>Reimbursement pending</dt>
                    <dd>{pay.reimbursementsPendingLabel}</dd>
                  </div>
                ) : null}
              </dl>
            </ElmCard>
          ) : null}

          {mode === 'showcase' && recentActivity.length > 0 ? (
            <ElmCard variant="default" padding="md" as="section" aria-label="Recent activity">
              <p className="mc-kicker mb-3">Recent activity</p>
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
          ) : null}

          {mode === 'showcase' ? (
            <div className="flex flex-wrap gap-2">
              <Link to={`${routePrefix}/capture`} className="mc-filter-tab no-underline">
                Capture
              </Link>
              <Link to={`${routePrefix}/messages`} className="mc-filter-tab no-underline">
                Messages
              </Link>
              <Link to={`${routePrefix}/pay`} className="mc-filter-tab no-underline">
                Pay
              </Link>
            </div>
          ) : null}
        </aside>
      </div>
    </MissionShell>
  );
};

export default TodayPage;
