import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useSubmissionDraft } from '../context/SubmissionDraftContext.tsx';
import { useDriverExperience } from '../context/DriverExperienceContext.tsx';
import MissionShell from '../components/mission-control/MissionShell.tsx';
import ExceptionBanner from '../components/mission-control/ExceptionBanner.tsx';
import ActiveHaulCard from '../components/mission-control/ActiveHaulCard.tsx';
import PrimaryActionButton from '../components/mission-control/PrimaryActionButton.tsx';
import EarningsCard from '../components/mission-control/EarningsCard.tsx';
import OutstandingTasks from '../components/mission-control/OutstandingTasks.tsx';
import { getCompanyDisplayName } from '../utils/companyMap.ts';
import {
  activateMissionCapture,
  type MissionCaptureTarget,
} from '../utils/missionCapture.ts';

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
            {model.driverDisplayName}
            {model.companyLabel ? ` · ${model.companyLabel}` : ''}
            {mode === 'showcase' ? ' · DEMONSTRATION DATA' : ''}
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
        </aside>
      </div>
    </MissionShell>
  );
};

export default TodayPage;
