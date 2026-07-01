import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthenticatedShell from '../components/terminal/AuthenticatedShell.tsx';
import ExpenseStepper from '../components/expense/ExpenseStepper.tsx';
import ExpenseSummaryCard from '../components/expense/ExpenseSummaryCard.tsx';
import { useSubmissionDraft } from '../context/SubmissionDraftContext.tsx';
import {
  buildExpenseUploadPayload,
  filesToBase64Payload,
  savePayloadToVault,
  submitDocumentUpload,
} from '../utils/submissionUpload.ts';

const SubmissionReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { draft, receiptBlob } = useSubmissionDraft();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!draft || draft.submissionType !== 'EXPENSE_RECEIPT' || !draft.expense) {
      navigate('/workspace', { replace: true });
    }
  }, [draft, navigate]);

  if (!draft || draft.submissionType !== 'EXPENSE_RECEIPT' || !draft.expense) {
    return null;
  }

  const { expense } = draft;
  const preview = draft.documents[0]?.previewUrl;

  const handleSubmit = async () => {
    if (!receiptBlob) {
      setError('Receipt image missing. Go back and re-upload.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const files = await filesToBase64Payload([
        { category: 'expense_receipt', file: receiptBlob },
      ]);
      const payload = buildExpenseUploadPayload({
        company: draft.company,
        driverName: draft.driverName,
        expense,
        files,
      });
      await submitDocumentUpload(payload);
      navigate('/submissions/success', {
        replace: true,
        state: {
          submissionType: 'EXPENSE_RECEIPT',
          submissionId: draft.submissionId,
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Upload failed';
      try {
        const files = await filesToBase64Payload([
          { category: 'expense_receipt', file: receiptBlob },
        ]);
        savePayloadToVault(
          buildExpenseUploadPayload({
            company: draft.company,
            driverName: draft.driverName,
            expense,
            files,
          })
        );
      } catch {
        /* vault save best-effort */
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthenticatedShell
      title="Expense Submission"
      showBack
      onBack={() => navigate('/submissions/receipt')}
    >
      <div className="max-w-lg mx-auto py-4 sm:py-6 space-y-6 expense-page-enter">
        <header className="text-center space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.42em] text-blue-400/85">
            Review
          </p>
          <h1 className="text-xl sm:text-2xl font-black text-white">Confirm & submit</h1>
          <p className="text-sm text-zinc-500 normal-case">
            Verify everything looks correct before transmitting.
          </p>
        </header>

        <ExpenseStepper current="Review" />

        <ExpenseSummaryCard
          expense={expense}
          receiptPreview={preview}
          driverName={draft.driverName}
        />

        {error ? (
          <p className="text-[12px] text-red-400 normal-case text-center" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="terminal-btn-primary w-full min-h-[52px] py-4 rounded-xl font-black uppercase tracking-[0.28em] text-sm text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Expense ›'}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => navigate('/submissions/receipt')}
            className="w-full min-h-[48px] py-3 rounded-xl border border-zinc-700/80 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors"
          >
            Back to edit
          </button>
        </div>
      </div>
    </AuthenticatedShell>
  );
};

export default SubmissionReviewPage;
