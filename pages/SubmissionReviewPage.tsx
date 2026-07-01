import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthenticatedShell from '../components/terminal/AuthenticatedShell.tsx';
import { useSubmissionDraft } from '../context/SubmissionDraftContext.tsx';
import { EXPENSE_CATEGORY_LABELS } from '../types/submission.ts';
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
        state: { submissionType: 'EXPENSE_RECEIPT' },
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
    <AuthenticatedShell title="Review Submission" showBack onBack={() => navigate('/submissions/receipt')}>
      <div className="max-w-lg mx-auto py-4 space-y-6">
        <section className="text-center space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-400/80">
            Review
          </p>
          <h1 className="text-xl font-black text-white">Confirm your expense</h1>
        </section>

        <section className="terminal-glass-panel rounded-2xl border border-blue-500/20 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Type</p>
              <p className="text-white font-semibold mt-1">
                {EXPENSE_CATEGORY_LABELS[expense.category]}
              </p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Amount</p>
              <p className="text-white font-semibold mt-1">${expense.amount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Date</p>
              <p className="text-white font-semibold mt-1">{expense.expenseDate}</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Driver</p>
              <p className="text-white font-semibold mt-1 truncate">{draft.driverName}</p>
            </div>
            {expense.loadNum ? (
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Load #</p>
                <p className="text-white font-semibold mt-1">{expense.loadNum}</p>
              </div>
            ) : null}
            {expense.bolNum ? (
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">BOL #</p>
                <p className="text-white font-semibold mt-1">{expense.bolNum}</p>
              </div>
            ) : null}
          </div>

          {expense.notes ? (
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Notes</p>
              <p className="text-sm text-zinc-300 normal-case mt-1">{expense.notes}</p>
            </div>
          ) : null}

          {preview ? (
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                Receipt
              </p>
              <img
                src={preview}
                alt="Receipt"
                className="w-full max-h-64 object-contain rounded-xl border border-zinc-800"
              />
            </div>
          ) : null}

          {error ? (
            <p className="text-[11px] text-red-400 normal-case" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="terminal-btn-primary w-full py-4 rounded-xl font-black uppercase tracking-[0.25em] text-sm text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Expense ›'}
          </button>
        </section>
      </div>
    </AuthenticatedShell>
  );
};

export default SubmissionReviewPage;
