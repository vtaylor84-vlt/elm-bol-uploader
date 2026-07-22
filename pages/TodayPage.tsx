import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useSubmissionDraft } from '../context/SubmissionDraftContext.tsx';
import MissionShell from '../components/mission-control/MissionShell.tsx';
import ExceptionBanner from '../components/mission-control/ExceptionBanner.tsx';
import ActiveHaulCard from '../components/mission-control/ActiveHaulCard.tsx';
import PrimaryActionButton from '../components/mission-control/PrimaryActionButton.tsx';
import EarningsCard from '../components/mission-control/EarningsCard.tsx';
import OutstandingTasks from '../components/mission-control/OutstandingTasks.tsx';
import { getMissionControlViewModel } from '../services/missionControlAdapter.ts';
import { getCompanyDisplayName } from '../utils/companyMap.ts';
import {
  activateMissionCapture,
  type MissionCaptureTarget,
} from '../utils/missionCapture.ts';

const TodayPage: React.FC = () => {
  const { session } = useAuth();
  const { clearDraft, startDraft } = useSubmissionDraft();
  const navigate = useNavigate();

  const model = useMemo(() => getMissionControlViewModel(session), [session]);

  const companyForUpload = getCompanyDisplayName(session?.companyCode);

  const openCapture = useCallback(
    (target: MissionCaptureTarget) => {
      activateMissionCapture({
        ...target,
        driverName: session?.driverName || '',
        company: companyForUpload,
        clearDraft,
        startDraft,
        navigate,
      });
    },
    [session?.driverName, companyForUpload, clearDraft, startDraft, navigate]
  );

  return (
    <MissionShell
      title="Mission Control"
      activeNav="today"
      connectionLabel={model.connectionLabel}
    >
      <div className="mc-today space-y-6 lg:space-y-8">
        <header className="mc-today-header">
          <p className="mc-kicker">Today</p>
          <h1 className="mc-page-title">What needs attention</h1>
          <p className="mc-section-copy">
            {model.driverDisplayName}
            {model.companyLabel ? ` · ${model.companyLabel}` : ''}
          </p>
        </header>

        <ExceptionBanner exceptions={model.exceptions} onActivateAction={openCapture} />
        <ActiveHaulCard haul={model.activeHaul} dataCapability={model.dataCapability} />
        <PrimaryActionButton
          action={model.primaryAction}
          onActivate={() =>
            openCapture({
              submissionType: model.primaryAction.submissionType,
              href: model.primaryAction.href,
            })
          }
        />
        <EarningsCard earnings={model.earnings} />
        <OutstandingTasks tasks={model.tasks} onActivateTask={openCapture} />
      </div>
    </MissionShell>
  );
};

export default TodayPage;
