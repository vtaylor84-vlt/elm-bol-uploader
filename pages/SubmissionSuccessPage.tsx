import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthenticatedShell from '../components/terminal/AuthenticatedShell.tsx';
import { useSubmissionDraft } from '../context/SubmissionDraftContext.tsx';
import type { SubmissionType } from '../types/submission.ts';

const SubmissionSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearDraft } = useSubmissionDraft();
  const submissionType = (location.state as { submissionType?: SubmissionType } | null)
    ?.submissionType;

  const title =
    submissionType === 'EXPENSE_RECEIPT' ? 'Expense Submitted' : 'Documents Submitted';
  const message =
    submissionType === 'EXPENSE_RECEIPT'
      ? 'Your receipt has been sent for reimbursement review.'
      : 'Your BOL/POD documents have been transmitted successfully.';

  const handleDone = () => {
    clearDraft();
    navigate('/workspace', { replace: true });
  };

  return (
    <AuthenticatedShell title="Submission Complete">
      <div className="max-w-md mx-auto py-12 text-center space-y-8">
        <div className="w-20 h-20 mx-auto rounded-full border-2 border-green-500/40 bg-green-500/10 flex items-center justify-center text-3xl text-green-400">
          ✓
        </div>
        <div className="space-y-2">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-green-400/90">
            Success
          </p>
          <h1 className="text-2xl font-black text-white">{title}</h1>
          <p className="text-sm text-zinc-400 normal-case leading-relaxed">{message}</p>
        </div>
        <button
          type="button"
          onClick={handleDone}
          className="terminal-btn-primary w-full py-4 rounded-xl font-black uppercase tracking-[0.25em] text-sm text-white"
        >
          Back to Workspace ›
        </button>
      </div>
    </AuthenticatedShell>
  );
};

export default SubmissionSuccessPage;
