import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthenticatedShell from '../components/terminal/AuthenticatedShell.tsx';
import { useSubmissionDraft } from '../context/SubmissionDraftContext.tsx';
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
  type DocumentRecord,
} from '../types/submission.ts';
import { compressImage } from '../utils/imageCompress.ts';
import {
  getFileRejectionReason,
  isHeicFile,
  HEIC_BLOCK_MESSAGE,
  UPLOAD_FORMAT_HINT,
} from '../utils/uploadFileRules.ts';

const STEPS = ['Details', 'Upload', 'Review', 'Submit'] as const;

const inp =
  'w-full px-4 py-3.5 rounded-xl bg-black/60 border border-zinc-800/90 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15';

const ReceiptPage: React.FC = () => {
  const navigate = useNavigate();
  const { draft, updateExpense, setDocuments, setReceiptBlob } = useSubmissionDraft();
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<ExpenseCategory>(
    draft?.expense?.category || 'fuel'
  );
  const [amount, setAmount] = useState(
    draft?.expense?.amount ? String(draft.expense.amount) : ''
  );
  const [expenseDate, setExpenseDate] = useState(
    draft?.expense?.expenseDate || new Date().toISOString().slice(0, 10)
  );
  const [loadNum, setLoadNum] = useState(draft?.expense?.loadNum || '');
  const [bolNum, setBolNum] = useState(draft?.expense?.bolNum || '');
  const [notes, setNotes] = useState(draft?.expense?.notes || '');
  const [receiptFile, setReceiptFile] = useState<{
    file: Blob;
    preview: string;
    name: string;
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!draft || draft.submissionType !== 'EXPENSE_RECEIPT') {
      navigate('/workspace', { replace: true });
    }
  }, [draft, navigate]);

  if (!draft || draft.submissionType !== 'EXPENSE_RECEIPT') {
    return null;
  }

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

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
      const preview = URL.createObjectURL(compressed);
      setReceiptFile({ file: compressed, preview, name: file.name });
      setError('');
    } catch {
      setError('Could not process image. Try another photo.');
    }
  };

  const handleContinue = () => {
    setError('');
    const parsedAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Enter a valid expense amount.');
      return;
    }
    if (!expenseDate) {
      setError('Expense date is required.');
      return;
    }
    if (!receiptFile) {
      setError('Receipt image is required.');
      return;
    }

    updateExpense({
      category,
      amount: parsedAmount,
      expenseDate,
      loadNum: loadNum.trim() || undefined,
      bolNum: bolNum.trim() || undefined,
      notes: notes.trim() || undefined,
    });

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

  return (
    <AuthenticatedShell title="Receipt Upload" showBack onBack={() => navigate('/workspace')}>
      <div className="max-w-lg mx-auto py-4 space-y-6">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 text-center">
              <div
                className={`mx-auto w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border ${
                  i === 0
                    ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                    : 'border-zinc-700 text-zinc-600'
                }`}
              >
                {i + 1}
              </div>
              <p
                className={`mt-1 text-[7px] font-black uppercase tracking-widest ${
                  i === 0 ? 'text-blue-400' : 'text-zinc-600'
                }`}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        <section className="terminal-glass-panel rounded-2xl border border-blue-500/20 p-5 sm:p-6 space-y-5">
          <div>
            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-blue-400/90 mb-2">
              Expense Type <span className="text-red-400">*</span>
            </label>
            <select
              className={inp}
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            >
              {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map((key) => (
                <option key={key} value={key}>
                  {EXPENSE_CATEGORY_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-blue-400/90 mb-2">
                Amount <span className="text-red-400">*</span>
              </label>
              <input
                className={inp}
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-blue-400/90 mb-2">
                Expense Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                className={inp}
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">
              Load # (Optional)
            </label>
            <input
              className={inp}
              value={loadNum}
              onChange={(e) => setLoadNum(e.target.value)}
              placeholder="Assigned load number"
            />
          </div>

          <div>
            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">
              BOL # (Optional)
            </label>
            <input
              className={inp}
              value={bolNum}
              onChange={(e) => setBolNum(e.target.value)}
              placeholder="BOL reference"
            />
          </div>

          <div>
            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">
              Notes (Optional)
            </label>
            <textarea
              className={`${inp} min-h-[80px] resize-none`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
            />
          </div>

          <div>
            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-blue-400/90 mb-2">
              Receipt Image <span className="text-red-400">*</span>
            </label>
            <button
              type="button"
              onClick={() => camRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-blue-500/35 bg-blue-500/5 py-8 px-4 text-center hover:border-blue-500/60 transition-colors"
            >
              <p className="text-2xl mb-2" aria-hidden>
                📷
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">
                Tap to take photo or choose from gallery
              </p>
              <p className="text-[9px] text-zinc-500 normal-case mt-2">{UPLOAD_FORMAT_HINT}</p>
            </button>
            {receiptFile ? (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3">
                <img
                  src={receiptFile.preview}
                  alt="Receipt preview"
                  className="w-14 h-14 rounded-lg object-cover border border-zinc-700"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white truncate">{receiptFile.name}</p>
                  <p className="text-[9px] text-zinc-500">
                    {(receiptFile.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReceiptFile(null)}
                  className="text-zinc-500 hover:text-red-400 text-lg"
                  aria-label="Remove receipt"
                >
                  ×
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-2 text-[8px] font-black uppercase tracking-widest text-blue-400"
            >
              Choose from gallery
            </button>
          </div>

          {error ? (
            <p className="text-[11px] text-red-400 normal-case" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleContinue}
            className="terminal-btn-primary w-full py-4 rounded-xl font-black uppercase tracking-[0.25em] text-sm text-white"
          >
            Continue ›
          </button>
        </section>
      </div>

      <input
        ref={camRef}
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        className="hidden"
        onChange={onPickFile}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={onPickFile}
      />
    </AuthenticatedShell>
  );
};

export default ReceiptPage;
