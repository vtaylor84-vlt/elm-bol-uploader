import React from 'react';
import { useNavigate } from 'react-router-dom';
import MissionShell from '../components/mission-control/MissionShell.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useSubmissionDraft } from '../context/SubmissionDraftContext.tsx';
import ElmModuleCard from '../design-system/components/ElmModuleCard.tsx';
import ElmPageHeader from '../design-system/components/ElmPageHeader.tsx';
import PageContainer from '../design-system/components/PageContainer.tsx';
import { getCompanyDisplayName } from '../utils/companyMap.ts';

const WorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { startDraft, clearDraft } = useSubmissionDraft();

  const company = getCompanyDisplayName(session?.companyCode);
  const driverName = session?.driverName || 'Driver';

  const openBolPod = () => {
    clearDraft();
    startDraft({
      submissionType: 'BOL_POD',
      driverName: session?.driverName || '',
      company,
    });
    navigate('/submissions/bol-pod');
  };

  const openReceipt = () => {
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
          title="Document modules"
          description={`${driverName} — select a live upload module.`}
        />

        <section aria-label="Active modules">
          <p className="elm-section-label mb-4 lg:mb-5">Live modules</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
            <ElmModuleCard
              title="BOL / POD"
              description="Upload delivery documents for your assigned load."
              icon="📄"
              accent="blue"
              onClick={openBolPod}
            />
            <ElmModuleCard
              title="Expenses & Repairs"
              description="Submit receipts for fuel, tolls, travel expenses, or truck/trailer repairs."
              icon={
                <span className="relative inline-flex items-center justify-center w-full h-full">
                  <span className="text-xl lg:text-2xl" aria-hidden>
                    🧾
                  </span>
                  <span
                    className="absolute -bottom-0.5 -right-1 text-[11px] lg:text-xs leading-none drop-shadow-sm"
                    aria-hidden
                  >
                    🔧
                  </span>
                </span>
              }
              accent="cyan"
              onClick={openReceipt}
            />
          </div>
        </section>
      </PageContainer>
    </MissionShell>
  );
};

export default WorkspacePage;
