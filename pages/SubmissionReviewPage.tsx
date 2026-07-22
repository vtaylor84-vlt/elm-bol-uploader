import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthenticatedShell from '../components/terminal/AuthenticatedShell.tsx';
import ExpenseStepper from '../components/expense/ExpenseStepper.tsx';
import ExpenseSummaryCard from '../components/expense/ExpenseSummaryCard.tsx';
import ReceiptPreviewPanel from '../components/expense/ReceiptPreviewPanel.tsx';
import ElmButton from '../design-system/components/ElmButton.tsx';
import ElmPageHeader from '../design-system/components/ElmPageHeader.tsx';
import GlassCard from '../design-system/components/GlassCard.tsx';
import PageContainer from '../design-system/components/PageContainer.tsx';
import ResponsiveSplit from '../design-system/components/ResponsiveSplit.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useSubmissionDraft } from '../context/SubmissionDraftContext.tsx';
import { companyCodeToUploadValue, resolveExpenseUploadCompany } from '../utils/companyMap.ts';
import { validateExpenseForSubmit } from '../utils/expenseForm.ts';
import {
  buildExpenseUploadPayload,
  filesToBase64Payload,
  savePayloadToVault,
  submitDocumentUpload,
} from '../utils/submissionUpload.ts';

const SubmissionReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { draft, receiptBlob } = useSubmissionDraft();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = Boolean(session?.canSelectAnyDriver || session?.authRole === 'admin');

  useEffect(() => {
    if (!draft || draft.submissionType !== 'EXPENSE_RECEIPT' || !draft.expense) {
      navigate('/capture', { replace: true });
    }
  }, [draft, navigate]);

  if (!draft || draft.submissionType !== 'EXPENSE_RECEIPT' || !draft.expense) {
    return null;
  }

  const { expense } = draft;
  const preview = draft.documents[0]?.previewUrl;
  const companyValidationError = validateExpenseForSubmit(expense, draft.company);
  const canSubmit = !companyValidationError && Boolean(receiptBlob);

  const handleSubmit = async () => {
    if (!receiptBlob) {
      setError('Receipt image missing. Go back and re-upload.');
      return;
    }

    const preCheck = validateExpenseForSubmit(expense, draft.company);
    if (preCheck) {
      setError(preCheck);
      return;
    }

    const uploadCompany =
      resolveExpenseUploadCompany(expense, draft.company) ||
      companyCodeToUploadValue(expense.companyCode || '');

    setIsSubmitting(true);
    setError('');

    try {
      const files = await filesToBase64Payload([
        { category: 'expense_receipt', file: receiptBlob },
      ]);
      const payload = buildExpenseUploadPayload({
        company: uploadCompany,
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
      const raw = e instanceof Error ? e.message : 'Upload failed';
      const message = raw.toLowerCase().includes('invalid company')
        ? 'Company could not be determined from the selected truck. Please select another truck or contact admin.'
        : raw;
      try {
        const files = await filesToBase64Payload([
          { category: 'expense_receipt', file: receiptBlob },
        ]);
        savePayloadToVault(
          buildExpenseUploadPayload({
            company: uploadCompany,
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
      <PageContainer width="wide" className="space-y-6 lg:space-y-8 expense-page-enter">
        <ElmPageHeader
          eyebrow="Review"
          title="Confirm & submit"
          description="Verify everything looks correct before submitting."
        />

        <ExpenseStepper current="Review" />

        <GlassCard glowColor="cyan" padding="lg" className="space-y-6">
          <ResponsiveSplit
            mobileOrder="primary-first"
            primary={
              <ExpenseSummaryCard
                expense={expense}
                driverName={draft.driverName}
                showReimbursementStatus={isAdmin}
                embedReceipt={false}
              />
            }
            secondary={<ReceiptPreviewPanel preview={preview} className="lg:sticky lg:top-24" />}
          />
        </GlassCard>

        {companyValidationError ? (
          <p className="text-[12px] text-red-400 normal-case text-center px-2" role="alert">
            {companyValidationError}
          </p>
        ) : null}

        {error ? (
          <p className="text-[12px] text-red-400 normal-case text-center" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3 pt-2 max-w-2xl mx-auto lg:max-w-none lg:mx-0">
          <ElmButton
            variant="primary"
            fullWidth
            disabled={isSubmitting || !canSubmit}
            onClick={handleSubmit}
            trailing={<span aria-hidden>›</span>}
            className="sm:flex-1"
          >
            {isSubmitting ? 'Submitting…' : 'Submit Expense'}
          </ElmButton>
          <ElmButton
            variant="secondary"
            fullWidth
            disabled={isSubmitting}
            onClick={() => navigate('/submissions/receipt')}
            className="sm:flex-1 sm:max-w-xs"
          >
            Back to edit
          </ElmButton>
        </div>
      </PageContainer>
    </AuthenticatedShell>
  );
};

export default SubmissionReviewPage;
