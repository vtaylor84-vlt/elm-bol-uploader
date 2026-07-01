import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthenticatedShell from '../components/terminal/AuthenticatedShell.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useSubmissionDraft } from '../context/SubmissionDraftContext.tsx';

const WorkspaceCard: React.FC<{
  title: string;
  description: string;
  icon: string;
  accent: string;
  onClick: () => void;
}> = ({ title, description, icon, accent, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group w-full text-left rounded-2xl border ${accent} bg-zinc-950/70 backdrop-blur-sm p-6 sm:p-8 transition-all hover:scale-[1.01] hover:shadow-[0_0_32px_rgba(59,130,246,0.12)] active:scale-[0.99]`}
  >
    <div className="flex items-start gap-4">
      <div className="w-14 h-14 rounded-xl border border-blue-500/30 bg-blue-500/10 flex items-center justify-center text-2xl shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide text-white group-hover:text-blue-300 transition-colors">
          {title}
        </h2>
        <p className="text-sm text-zinc-400 normal-case mt-2 leading-relaxed">{description}</p>
      </div>
      <span className="text-blue-400 text-xl opacity-60 group-hover:opacity-100 shrink-0" aria-hidden>
        ›
      </span>
    </div>
  </button>
);

const getCarrierDisplayName = (code?: string) => {
  const c = String(code || '').trim().toUpperCase();
  if (c === 'BST') return 'BST Expedite Inc';
  if (c === 'GLX') return 'Greenleaf Xpress';
  return code || '';
};

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
      <div className="max-w-lg mx-auto space-y-8 py-6 sm:py-10">
        <section className="text-center space-y-2">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-400/80">
            Driver Workspace
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome, {driverName}
          </h1>
          <p className="text-sm text-zinc-400 normal-case">
            What would you like to do?
          </p>
        </section>

        <div className="space-y-4">
          <WorkspaceCard
            title="BOL / POD"
            description="Upload delivery documents for your assigned load."
            icon="📄"
            accent="border-blue-500/25 hover:border-blue-500/50"
            onClick={openBolPod}
          />
          <WorkspaceCard
            title="Expense Submission"
            description="Submit an expense with receipt for reimbursement or tracking."
            icon="🧾"
            accent="border-cyan-500/25 hover:border-cyan-500/50"
            onClick={openReceipt}
          />
        </div>

        <p className="text-center text-[8px] font-mono uppercase tracking-widest text-zinc-600">
          Secure session · {session?.maskedEmail || 'Connected'}
        </p>
      </div>
    </AuthenticatedShell>
  );
};

export default WorkspacePage;
