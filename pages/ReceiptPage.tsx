import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthenticatedShell from '../components/terminal/AuthenticatedShell.tsx';
import ExpenseDetailsForm from '../components/expense/ExpenseDetailsForm.tsx';
import ExpenseStepper from '../components/expense/ExpenseStepper.tsx';
import ReceiptUploadZone from '../components/expense/ReceiptUploadZone.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useSubmissionDraft } from '../context/SubmissionDraftContext.tsx';
import { fetchDriverRoster, fetchTruckNumbers } from '../services/terminalDataService.ts';
import type { DriverOption } from '../services/terminalDataService.ts';
import { defaultExpenseFormState, type ExpenseFormState } from '../types/expense.ts';
import type { DocumentRecord } from '../types/submission.ts';
import { expenseFormToRecord, validateExpenseDetails } from '../utils/expenseForm.ts';
import { compressImage } from '../utils/imageCompress.ts';
import {
  getFileRejectionReason,
  isHeicFile,
  HEIC_BLOCK_MESSAGE,
} from '../utils/uploadFileRules.ts';

type WizardStep = 'details' | 'upload';

const ReceiptPage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { draft, updateExpense, updateDriverName, setDocuments, setReceiptBlob } =
    useSubmissionDraft();

  const isAdmin = Boolean(session?.canSelectAnyDriver || session?.authRole === 'admin');

  const [step, setStep] = useState<WizardStep>('details');
  const [form, setForm] = useState<ExpenseFormState>(() => {
    const base = defaultExpenseFormState();
    if (draft?.expense) {
      return {
        ...base,
        expenseType: (draft.expense.expenseType as ExpenseFormState['expenseType']) || base.expenseType,
        expenseTypeOther: draft.expense.expenseTypeOther || '',
        amount: draft.expense.amount ? String(draft.expense.amount) : '',
        expenseDate: draft.expense.expenseDate || base.expenseDate,
        truckNumber: draft.expense.truckNumber || '',
        vendor: draft.expense.vendor || '',
        paidWith: (draft.expense.paidWith as ExpenseFormState['paidWith']) || base.paidWith,
        paidWithOther: draft.expense.paidWithOther || '',
        reimbursementForDriver: draft.expense.reimbursementForDriver ?? true,
        selectedDriverName: draft.driverName || session?.driverName?.toUpperCase() || '',
      };
    }
    return {
      ...base,
      selectedDriverName: session?.driverName?.toUpperCase() || '',
    };
  });

  const [trucks, setTrucks] = useState<string[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [trucksLoading, setTrucksLoading] = useState(true);
  const [error, setError] = useState('');
  const [receiptFile, setReceiptFile] = useState<{
    file: Blob;
    preview: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (!draft || draft.submissionType !== 'EXPENSE_RECEIPT') {
      navigate('/workspace', { replace: true });
    }
  }, [draft, navigate]);

  useEffect(() => {
    let active = true;
    setTrucksLoading(true);
    fetchTruckNumbers().then((list) => {
      if (active) {
        setTrucks(list);
        setTrucksLoading(false);
      }
    });
    if (isAdmin) {
      fetchDriverRoster().then((list) => {
        if (active) setDrivers(list);
      });
    }
    return () => {
      active = false;
    };
  }, [isAdmin]);

  if (!draft || draft.submissionType !== 'EXPENSE_RECEIPT') {
    return null;
  }

  const patchForm = (patch: Partial<ExpenseFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const driverDisplayName =
    drivers.find((d) => d.value === form.selectedDriverName)?.label ||
    session?.driverName ||
    draft.driverName;

  const handleDetailsContinue = () => {
    setError('');
    const validationError = validateExpenseDetails(form, isAdmin);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (isAdmin && form.selectedDriverName) {
      updateDriverName(form.selectedDriverName);
    }
    setStep('upload');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePickReceipt = async (file: File) => {
    if (isHeicFile(file)) {
      setError(HEIC_BLOCK_MESSAGE);
      return;
    }
    const rejection = getFileRejectionReason(file);
    if (rejection) {
      setError(rejection);
      return;
    }
    try {
      const compressed = await compressImage(file);
      if (receiptFile?.preview) URL.revokeObjectURL(receiptFile.preview);
      const preview = URL.createObjectURL(compressed);
      setReceiptFile({ file: compressed, preview, name: file.name });
      setError('');
    } catch {
      setError('Could not process image. Try another photo.');
    }
  };

  const handleUploadContinue = () => {
    setError('');
    const validationError = validateExpenseDetails(form, isAdmin);
    if (validationError) {
      setStep('details');
      setError(validationError);
      return;
    }
    if (!receiptFile) {
      setError('Receipt image is required.');
      return;
    }

    const record = expenseFormToRecord(form);
    updateExpense(record);
    if (isAdmin && form.selectedDriverName) {
      updateDriverName(form.selectedDriverName);
    }

    const doc: DocumentRecord = {
      id: Math.random().toString(36).slice(2),
      documentType: 'EXPENSE_RECEIPT',
      fileCategory: 'expense_receipt',
      fileName: receiptFile.name,
      previewUrl: receiptFile.preview,
    };
    setDocuments([doc]);
    setReceiptBlob(receiptFile.file);
    navigate('/submissions/review');
  };

  const stepperCurrent = step === 'details' ? 'Details' : 'Upload';

  return (
    <AuthenticatedShell
      title="Expense Submission"
      showBack
      onBack={() => (step === 'upload' ? setStep('details') : navigate('/workspace'))}
    >
      <div className="max-w-lg mx-auto py-4 sm:py-6 space-y-6 sm:space-y-8 expense-page-enter">
        <header className="text-center space-y-1 px-2">
          <p className="text-[9px] font-black uppercase tracking-[0.42em] text-blue-400/85">
            Expense Submission
          </p>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {step === 'details' ? 'Expense details' : 'Attach receipt'}
          </h1>
          <p className="text-sm text-zinc-500 normal-case">
            {step === 'details'
              ? 'Tell us about the expense — we’ll guide you step by step.'
              : 'Add a clear photo of your receipt to complete this submission.'}
          </p>
        </header>

        <ExpenseStepper current={stepperCurrent as 'Details' | 'Upload'} />

        <section className="terminal-module-panel rounded-2xl p-5 sm:p-7">
          {step === 'details' ? (
            <ExpenseDetailsForm
              form={form}
              trucks={trucks}
              drivers={drivers}
              isAdmin={isAdmin}
              currentDriverLabel={driverDisplayName}
              trucksLoading={trucksLoading}
              onChange={patchForm}
            />
          ) : (
            <div className="space-y-4">
              <ReceiptUploadZone
                preview={receiptFile?.preview}
                fileName={receiptFile?.name}
                fileSizeMb={receiptFile ? receiptFile.file.size / 1024 / 1024 : undefined}
                onPick={handlePickReceipt}
                onRemove={() => {
                  if (receiptFile?.preview) URL.revokeObjectURL(receiptFile.preview);
                  setReceiptFile(null);
                }}
                error={error}
              />
            </div>
          )}

          {step === 'details' && error ? (
            <p className="text-[12px] text-red-400 normal-case text-center mt-5" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={step === 'details' ? handleDetailsContinue : handleUploadContinue}
            className="terminal-btn-primary w-full min-h-[52px] mt-6 py-4 rounded-xl font-black uppercase tracking-[0.28em] text-sm text-white bg-gradient-to-r from-blue-600 to-blue-500 border border-blue-400/35 shadow-[0_0_28px_rgba(59,130,246,0.25)]"
          >
            Continue ›
          </button>
        </section>
      </div>
    </AuthenticatedShell>
  );
};

export default ReceiptPage;
