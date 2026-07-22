import React, { useMemo } from 'react';
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

const TodayPage: React.FC = () => {
  const { session } = useAuth();
  const { clearDraft, startDraft } = useSubmissionDraft();
  const navigate = useNavigate();

  const model = useMemo(() => getMissionControlViewModel(session), [session]);

  const companyForUpload =
    session?.companyCode === 'BST'
      ? 'BST Expedite Inc'
      : session?.companyCode === 'GLX'
        ? 'Greenleaf Xpress'
        : model.companyLabel;

  const openPrimaryCapture = () => {
    clearDraft();
    startDraft({
      submissionType: 'BOL_POD',
      driverName: session?.driverName || '',
      company: companyForUpload,
    });
    navigate(model.primaryAction.href);
  };

  return (
    <MissionShell
      title="Mission Control"
      activeNav="today"
      connectionLabel={model.connectionLabel}
    >
      <div className="mc-today space-y-5 lg:space-y-6 max-w-2xl mx-auto lg:max-w-3xl">
        <header className="mc-today-header">
          <p className="mc-kicker">Today</p>
          <h1 className="mc-page-title">What needs attention</h1>
          <p className="mc-section-copy">
            {model.driverDisplayName}
            {model.companyLabel ? ` · ${model.companyLabel}` : ''}
          </p>
        </header>

        <ExceptionBanner exceptions={model.exceptions} />
        <ActiveHaulCard haul={model.activeHaul} dataCapability={model.dataCapability} />
        <PrimaryActionButton action={model.primaryAction} onActivate={openPrimaryCapture} />
        <EarningsCard earnings={model.earnings} />
        <OutstandingTasks tasks={model.tasks} />
      </div>
    </MissionShell>
  );
};

export default TodayPage;
