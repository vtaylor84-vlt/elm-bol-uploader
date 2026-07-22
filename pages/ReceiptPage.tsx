import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthenticatedShell from '../components/terminal/AuthenticatedShell.tsx';
import ExpenseDetailsForm from '../components/expense/ExpenseDetailsForm.tsx';
import ExpenseStepper from '../components/expense/ExpenseStepper.tsx';
import ElmButton from '../design-system/components/ElmButton.tsx';
import ElmPageHeader from '../design-system/components/ElmPageHeader.tsx';
import GlassCard from '../design-system/components/GlassCard.tsx';
import PageContainer from '../design-system/components/PageContainer.tsx';
import ReceiptUploadZone from '../components/expense/ReceiptUploadZone.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useSubmissionDraft } from '../context/SubmissionDraftContext.tsx';
import { fetchDriverRoster, fetchTrucks } from '../services/terminalDataService.ts';
import type { DriverOption, TruckOption } from '../services/terminalDataService.ts';
import {
  defaultExpenseFormState,
  isCustomDriverSelection,
  type ExpenseFormState,
} from '../types/expense.ts';
import type { DocumentRecord } from '../types/submission.ts';
import { companyCodeToUploadValue } from '../utils/companyMap.ts';
import {
  expenseFormToRecord,
  resolveExpenseDriverName as resolveDriver,
  validateExpenseDetails,
} from '../utils/expenseForm.ts';
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
  const { draft, updateExpense, updateDriverName, updateCompany, setDocuments, setReceiptBlob } =
    useSubmissionDraft();

  const isAdmin = Boolean(session?.canSelectAnyDriver || session?.authRole === 'admin');

  const [step, setStep] = useState<WizardStep>('details');
  const [form, setForm] = useState<ExpenseFormState>(() => {
    const base = defaultExpenseFormState();
    if (draft?.expense) {
      return {
        ...base,
        expenseType: (draft.expense.expenseType as ExpenseFormState['expenseType']) || '',
        expenseTypeOther: draft.expense.expenseTypeOther || '',
        amount: draft.expense.amount ? String(draft.expense.amount) : '',
        expenseDate: draft.expense.expenseDate || base.expenseDate,
        truckNumber: draft.expense.truckNumber || '',
        companyCode: draft.expense.companyCode || '',
        vendor: draft.expense.vendor || '',
        paidWith: (draft.expense.paidWith as ExpenseFormState['paidWith']) || '',
        paidWithOther: draft.expense.paidWithOther || '',
        reimbursementForDriver: draft.expense.reimbursementForDriver ?? true,
        selectedDriverName: isAdmin
          ? draft.driverName || session?.driverName?.toUpperCase() || ''
          : session?.driverName?.toUpperCase() || '',
        customDriverName: '',
      };
    }
    return {
      ...base,
      selectedDriverName: session?.driverName?.toUpperCase() || '',
    };
  });

  const [trucks, setTrucks] = useState<TruckOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [trucksLoading, setTrucksLoading] = useState(true);
  const [trucksError, setTrucksError] = useState('');
  const [error, setError] = useState('');
  const [receiptFile, setReceiptFile] = useState<{
    file: Blob;
    preview: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (!draft || draft.submissionType !== 'EXPENSE_RECEIPT') {
      navigate('/capture', { replace: true });
    }
  }, [draft, navigate]);

  useEffect(() => {
    let active = true;
    setTrucksLoading(true);
    setTrucksError('');
    fetchTrucks().then(({ trucks: list, error: loadError }) => {
      if (!active) return;
      setTrucks(list);
      setTrucksLoading(false);
      if (loadError) {
        setTrucksError(loadError);
      } else if (!list.length) {
        setTrucksError('No trucks found in Truck_Master. Contact admin if this persists.');
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

  const handleTruckSelect = (truckNumber: string) => {
    const match = trucks.find((t) => t.truckNumber === truckNumber);
    patchForm({
      truckNumber,
      companyCode: match?.companyCode || '',
    });
    if (match?.companyCode) {
      updateCompany(companyCodeToUploadValue(match.companyCode));
    }
  };

  const driverDisplayName = isCustomDriverSelection(form.selectedDriverName)
    ? form.customDriverName || 'Enter driver name'
    : drivers.find((d) => d.value === form.selectedDriverName)?.label ||
      session?.driverName ||
      draft.driverName;

  const persistDriver = () => {
    const name = resolveDriver(form);
    if (name) updateDriverName(name);
  };

  const handleDetailsContinue = () => {
    setError('');
    const validationError = validateExpenseDetails(form, isAdmin);
    if (validationError) {
      setError(validationError);
      return;
    }
    persistDriver();
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
    persistDriver();
    if (record.companyCode) {
      updateCompany(companyCodeToUploadValue(record.companyCode));
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
      onBack={() => (step === 'upload' ? setStep('details') : navigate('/capture'))}
    >
      <PageContainer width="wide" className="space-y-6 lg:space-y-8 expense-page-enter">
        <ElmPageHeader
          eyebrow="Expense Submission"
          title={step === 'details' ? 'Expense details' : 'Attach receipt'}
          description={
            step === 'details'
              ? 'Tell us about the expense — we’ll guide you step by step.'
              : 'Add a clear photo of your receipt to complete this submission.'
          }
        />

        <ExpenseStepper current={stepperCurrent as 'Details' | 'Upload'} />

        <GlassCard glowColor="cyan" padding="lg" className="space-y-2">
          {step === 'details' ? (
            <ExpenseDetailsForm
              form={form}
              trucks={trucks}
              drivers={drivers}
              isAdmin={isAdmin}
              currentDriverLabel={driverDisplayName}
              trucksLoading={trucksLoading}
              trucksError={trucksError}
              onChange={patchForm}
              onTruckSelect={handleTruckSelect}
            />
          ) : (
            <div className="max-w-xl mx-auto lg:max-w-2xl space-y-4">
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

          <ElmButton
            variant="primary"
            fullWidth
            onClick={step === 'details' ? handleDetailsContinue : handleUploadContinue}
            trailing={<span aria-hidden>›</span>}
            className="mt-6 lg:mt-8 max-w-md mx-auto lg:max-w-lg block"
          >
            Continue
          </ElmButton>
        </GlassCard>
      </PageContainer>
    </AuthenticatedShell>
  );
};

export default ReceiptPage;
