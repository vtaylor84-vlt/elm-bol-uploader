import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthenticatedShell from '../components/terminal/AuthenticatedShell.tsx';
import { useSubmissionDraft } from '../context/SubmissionDraftContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import type { SubmissionType } from '../types/submission.ts';

const SubmissionSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearDraft, startDraft } = useSubmissionDraft();
  const { session } = useAuth();

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

  return (
    <AuthenticatedShell title="Submission Complete">
      <div className="max-w-md mx-auto py-10 sm:py-14 text-center space-y-8 expense-page-enter px-2">
        <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28">
          <div className="absolute inset-0 rounded-full bg-green-500/20 blur-2xl success-glow-pulse" aria-hidden />
          <div
            id="success-check"
            className="relative w-full h-full rounded-full border-2 border-green-500/50 bg-green-500/10 flex items-center justify-center text-4xl text-green-400 success-pop shadow-[0_0_40px_rgba(34,197,94,0.25)]"
          >
            ✓
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[9px] font-black uppercase tracking-[0.45em] text-green-400/90">
            Success
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Submission Successful
          </h1>
          <p className="text-sm text-zinc-400 normal-case leading-relaxed max-w-sm mx-auto">
            {isExpense
              ? 'Your expense has been submitted and is on its way for review.'
              : 'Your documents have been transmitted successfully.'}
          </p>
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
          <button
            type="button"
            onClick={handleWorkspace}
            className="terminal-btn-primary w-full min-h-[52px] py-4 rounded-xl font-black uppercase tracking-[0.26em] text-sm text-white"
          >
            Return to Workspace ›
          </button>
          {isExpense ? (
            <button
              type="button"
              onClick={handleAnother}
              className="w-full min-h-[48px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
            >
              Submit Another Expense
            </button>
          ) : null}
        </div>
      </div>
    </AuthenticatedShell>
  );
};

export default SubmissionSuccessPage;
