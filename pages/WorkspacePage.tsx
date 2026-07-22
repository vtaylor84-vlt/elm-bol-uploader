import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MissionShell from '../components/mission-control/MissionShell.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useSubmissionDraft } from '../context/SubmissionDraftContext.tsx';
import { useDriverExperience } from '../context/DriverExperienceContext.tsx';
import ElmModuleCard from '../design-system/components/ElmModuleCard.tsx';
import ElmPageHeader from '../design-system/components/ElmPageHeader.tsx';
import PageContainer from '../design-system/components/PageContainer.tsx';
import { getCompanyDisplayName } from '../utils/companyMap.ts';

const WorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { startDraft, clearDraft } = useSubmissionDraft();
  const { mode, dataSource, actions } = useDriverExperience();
  const [simMessage, setSimMessage] = useState('');

  const company = getCompanyDisplayName(session?.companyCode);
  const driverName = session?.driverName || 'Driver';
  const modules = dataSource.getCaptureModules();

  const openBolPod = async () => {
    if (mode === 'showcase') {
      const result = await actions.submitPodSimulated?.();
      if (result) setSimMessage(`${result.disclosure}: ${result.message}`);
      return;
    }
    clearDraft();
    startDraft({
      submissionType: 'BOL_POD',
      driverName: session?.driverName || '',
      company,
    });
    navigate('/submissions/bol-pod');
  };

  const openReceipt = async () => {
    if (mode === 'showcase') {
      const result = await actions.submitReceiptSimulated?.();
      if (result) setSimMessage(`${result.disclosure}: ${result.message}`);
      return;
    }
    clearDraft();
    startDraft({
      submissionType: 'EXPENSE_RECEIPT',
      driverName: session?.driverName || '',
      company,
    });
    navigate('/submissions/receipt');
  };

  return (
    <MissionShell title="Capture" activeNav="capture">
      <PageContainer width="full" className="space-y-8 lg:space-y-10">
        <ElmPageHeader
          eyebrow="Capture"
          title="Document capture"
          align="left"
          description={
            mode === 'showcase'
              ? `${driverName} — SIMULATED ACTION modules. NOT CONNECTED TO PRODUCTION.`
              : `${driverName} — choose a live upload module. Camera-first, verified path.`
          }
        />

        {simMessage ? (
          <p className="text-xs text-amber-300 normal-case" role="status">
            {simMessage}
          </p>
        ) : null}

        <section aria-label={mode === 'showcase' ? 'Simulated capture modules' : 'Live capture modules'}>
          <p className="elm-section-label mb-4 lg:mb-5">
            {mode === 'showcase' ? 'Simulated modules' : 'Live modules'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
            {modules.map((mod) => (
              <ElmModuleCard
                key={mod.id}
                title={mod.title}
                description={mod.description}
                icon={mod.id.includes('expense') ? '🧾' : '📄'}
                accent={mod.id.includes('expense') ? 'cyan' : 'blue'}
                badge={mode === 'showcase' ? 'SIMULATED ACTION' : undefined}
                onClick={() => {
                  if (mod.id.includes('expense')) openReceipt();
                  else openBolPod();
                }}
              />
            ))}
          </div>
        </section>
      </PageContainer>
    </MissionShell>
  );
};

export default WorkspacePage;
