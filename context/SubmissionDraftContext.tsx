import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  createSubmissionId,
  type DocumentRecord,
  type ExpenseRecord,
  type SubmissionRecord,
  type SubmissionType,
} from '../types/submission.ts';

interface SubmissionDraftContextValue {
  draft: SubmissionRecord | null;
  receiptBlob: Blob | null;
  startDraft: (params: {
    submissionType: SubmissionType;
    driverName: string;
    company: string;
  }) => SubmissionRecord;
  updateExpense: (expense: Partial<ExpenseRecord>) => void;
  updateDriverName: (driverName: string) => void;
  setDocuments: (documents: DocumentRecord[]) => void;
  setReceiptBlob: (blob: Blob | null) => void;
  clearDraft: () => void;
}

const SubmissionDraftContext = createContext<SubmissionDraftContextValue | null>(null);

export const SubmissionDraftProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [draft, setDraft] = useState<SubmissionRecord | null>(null);
  const [receiptBlob, setReceiptBlob] = useState<Blob | null>(null);

  const startDraft = useCallback(
    (params: { submissionType: SubmissionType; driverName: string; company: string }) => {
      const next: SubmissionRecord = {
        submissionId: createSubmissionId(),
        submissionType: params.submissionType,
        driverName: params.driverName,
        company: params.company,
        createdAt: new Date().toISOString(),
        documents: [],
      };
      setDraft(next);
      return next;
    },
    []
  );

  const updateExpense = useCallback((expense: Partial<ExpenseRecord>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        expense: { ...(prev.expense || ({} as ExpenseRecord)), ...expense },
      };
    });
  }, []);

  const updateDriverName = useCallback((driverName: string) => {
    setDraft((prev) => (prev ? { ...prev, driverName } : prev));
  }, []);

  const setDocuments = useCallback((documents: DocumentRecord[]) => {
    setDraft((prev) => (prev ? { ...prev, documents } : prev));
  }, []);

  const clearDraft = useCallback(() => {
    setDraft(null);
    setReceiptBlob(null);
  }, []);

  const value = useMemo(
    () => ({
      draft,
      receiptBlob,
      startDraft,
      updateExpense,
      updateDriverName,
      setDocuments,
      setReceiptBlob,
      clearDraft,
    }),
    [draft, receiptBlob, startDraft, updateExpense, updateDriverName, setDocuments, clearDraft]
  );

  return (
    <SubmissionDraftContext.Provider value={value}>{children}</SubmissionDraftContext.Provider>
  );
};

export function useSubmissionDraft(): SubmissionDraftContextValue {
  const ctx = useContext(SubmissionDraftContext);
  if (!ctx) {
    throw new Error('useSubmissionDraft must be used within SubmissionDraftProvider');
  }
  return ctx;
}
