import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthenticatedShell from '../components/terminal/AuthenticatedShell.tsx';
import ElmButton from '../design-system/components/ElmButton.tsx';
import ElmPageHeader from '../design-system/components/ElmPageHeader.tsx';
import PageContainer from '../design-system/components/PageContainer.tsx';
import { useSubmissionDraft } from '../context/SubmissionDraftContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import type { SubmissionType } from '../types/submission.ts';

const SubmissionSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearDraft, startDraft } = useSubmissionDraft();
  const { session, logout } = useAuth();

  const state = location.state as {
    submissionType?: SubmissionType;
    submissionId?: string;
  } | null;

  const submissionType = state?.submissionType;
  const submissionId = state?.submissionId;

  useEffect(() => {
    const t = window.setTimeout(() => {
      document.getElementById('success-check')?.classList.add('success-pop-active');
    }, 80);
    return () => window.clearTimeout(t);
  }, []);

  const isExpense = submissionType === 'EXPENSE_RECEIPT';
  const isAdminUploadMode = session?.authRole === 'admin';

  const getCarrierDisplayName = (code?: string) => {
    const c = String(code || '').trim().toUpperCase();
    if (c === 'BST') return 'BST Expedite Inc';
    if (c === 'GLX') return 'Greenleaf Xpress';
    return code || '';
  };

  const handleWorkspace = () => {
    clearDraft();
    navigate('/workspace', { replace: true });
  };

  const handleAnother = () => {
    const company = getCarrierDisplayName(session?.companyCode);
    clearDraft();
    startDraft({
      submissionType: 'EXPENSE_RECEIPT',
      driverName: session?.driverName || '',
      company,
    });
    navigate('/submissions/receipt', { replace: true });
  };

  const handleLogout = () => {
    clearDraft();
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <AuthenticatedShell title="Submission Complete">
      <PageContainer width="narrow" className="text-center space-y-8">
        <ElmPageHeader
          eyebrow="Success"
          title="Submission Successful"
          description={
            isExpense
              ? 'Your expense has been submitted and is on its way for review.'
              : 'Your documents have been transmitted successfully.'
          }
        />

        <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28">
          <div className="absolute inset-0 rounded-full bg-green-500/20 blur-2xl success-glow-pulse" aria-hidden />
          <div
            id="success-check"
            className="relative w-full h-full rounded-full border-2 border-green-500/50 bg-green-500/10 flex items-center justify-center text-4xl text-green-400 success-pop shadow-[0_0_40px_rgba(34,197,94,0.25)]"
          >
            ✓
          </div>
        </div>

        {submissionId ? (
          <div className="terminal-glass-panel rounded-xl px-5 py-4 inline-block w-full max-w-xs mx-auto">
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
              Submission ID
            </p>
            <p className="text-xs font-mono text-cyan-400/95 mt-1.5 break-all">{submissionId}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 pt-2 max-w-sm mx-auto w-full">
          <ElmButton variant="primary" fullWidth onClick={handleWorkspace} trailing={<span aria-hidden>›</span>}>
            Return to Workspace
          </ElmButton>
          {isExpense ? (
            <ElmButton variant="ghost" fullWidth onClick={handleAnother}>
              Submit Another Expense
            </ElmButton>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 text-[11px] font-semibold normal-case tracking-normal text-slate-500 hover:text-zinc-300 active:text-zinc-200 transition-colors underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 rounded px-2 py-1"
        >
          {isAdminUploadMode ? 'Ready for next driver? Log Out' : 'Finished? Log Out'}
        </button>
      </PageContainer>
    </AuthenticatedShell>
  );
};

export default SubmissionSuccessPage;
