import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthenticatedShell from '../components/terminal/AuthenticatedShell.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useSubmissionDraft } from '../context/SubmissionDraftContext.tsx';
import ElmModuleCard from '../design-system/components/ElmModuleCard.tsx';
import ElmPageHeader from '../design-system/components/ElmPageHeader.tsx';
import PageContainer from '../design-system/components/PageContainer.tsx';

const getCarrierDisplayName = (code?: string) => {
  const c = String(code || '').trim().toUpperCase();
  if (c === 'BST') return 'BST Expedite Inc';
  if (c === 'GLX') return 'Greenleaf Xpress';
  return code || '';
};

const FUTURE_MODULES = [
  {
    title: 'Messages',
    description: 'Dispatcher updates and load communications.',
    icon: '💬',
    accent: 'violet' as const,
  },
  {
    title: 'Safety',
    description: 'Incident reports, inspections, and compliance.',
    icon: '🛡️',
    accent: 'emerald' as const,
  },
  {
    title: 'Payroll',
    description: 'Settlement summaries and pay documents.',
    icon: '💰',
    accent: 'amber' as const,
  },
  {
    title: 'Announcements',
    description: 'Company news and operational bulletins.',
    icon: '📢',
    accent: 'rose' as const,
  },
];

const WorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { startDraft, clearDraft } = useSubmissionDraft();

  const company = getCarrierDisplayName(session?.companyCode);
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
    <AuthenticatedShell title="Driver Workspace">
      <PageContainer width="full" className="space-y-8 lg:space-y-10">
        <ElmPageHeader
          eyebrow="Driver Workspace"
          title={`Welcome, ${driverName}`}
          description="What would you like to do? Select a module to continue."
        />

        <section aria-label="Active modules">
          <p className="elm-section-label mb-4 lg:mb-5">Active Modules</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
            <ElmModuleCard
              title="BOL / POD"
              description="Upload delivery documents for your assigned load."
              icon="📄"
              accent="blue"
              onClick={openBolPod}
            />
            <ElmModuleCard
              title="Expense Submission"
              description="Submit an expense with receipt for reimbursement or tracking."
              icon="🧾"
              accent="cyan"
              onClick={openReceipt}
            />
          </div>
        </section>

        <section aria-label="Coming soon">
          <p className="elm-section-label mb-4 lg:mb-5">Platform Modules · Coming Soon</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
            {FUTURE_MODULES.map((mod) => (
              <ElmModuleCard
                key={mod.title}
                title={mod.title}
                description={mod.description}
                icon={mod.icon}
                accent={mod.accent}
                disabled
                badge="Soon"
              />
            ))}
          </div>
        </section>

        <p className="text-center text-[8px] font-mono uppercase tracking-widest text-zinc-600 pt-2">
          Secure session · {session?.maskedEmail || 'Connected'}
        </p>
      </PageContainer>
    </AuthenticatedShell>
  );
};

export default WorkspacePage;
