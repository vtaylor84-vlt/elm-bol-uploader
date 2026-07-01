import React from 'react';
import {
  displayExpenseType,
  displayPaidWith,
  type ExpenseFormState,
} from '../../types/expense.ts';
import { formatCurrencyDisplay, formatExpenseDateDisplay } from '../../utils/expenseForm.ts';
import { companyCodeLabel } from '../../utils/companyMap.ts';
import type { ExpenseRecord } from '../../types/submission.ts';

interface ExpenseSummaryCardProps {
  expense: ExpenseRecord;
  receiptPreview?: string | null;
  driverName?: string;
  showReimbursementStatus?: boolean;
  /** When false, receipt is shown in a sibling panel (desktop review layout). */
  embedReceipt?: boolean;
}

const ExpenseSummaryCard: React.FC<ExpenseSummaryCardProps> = ({
  expense,
  receiptPreview,
  driverName,
  showReimbursementStatus,
  embedReceipt = true,
}) => {
  const typeLabel = expense.expenseType
    ? displayExpenseType({
        expenseType: expense.expenseType as ExpenseFormState['expenseType'],
        expenseTypeOther: expense.expenseTypeOther || '',
      })
    : expense.category;

  const paidLabel = expense.paidWith
    ? displayPaidWith({
        paidWith: expense.paidWith as ExpenseFormState['paidWith'],
        paidWithOther: expense.paidWithOther || '',
      })
    : '—';

  return (
    <div className="terminal-module-panel rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800/80 bg-blue-500/[0.06]">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-400/90">
          Expense Summary
        </p>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {expense.truckNumber ? (
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Truck {expense.truckNumber}
              </p>
            ) : null}
            <p className="text-xl sm:text-2xl font-black text-white mt-1">{typeLabel}</p>
            {expense.vendor ? (
              <p className="text-sm text-zinc-400 normal-case mt-1">{expense.vendor}</p>
            ) : null}
          </div>
          <p className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-400 shrink-0">
            {formatCurrencyDisplay(expense.amount)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2 border-t border-zinc-800/60 text-sm">
          {expense.companyCode ? (
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Company</p>
              <p className="text-zinc-200 font-semibold mt-1">
                {companyCodeLabel(expense.companyCode)}
                <span className="text-zinc-500 font-mono text-[10px] ml-1">({expense.companyCode})</span>
              </p>
            </div>
          ) : null}
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Paid With</p>
            <p className="text-zinc-200 font-semibold mt-1 normal-case">{paidLabel}</p>
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Expense Date</p>
            <p className="text-zinc-200 font-semibold mt-1">
              {formatExpenseDateDisplay(expense.expenseDate)}
            </p>
          </div>
          {driverName ? (
            <div className="col-span-2">
              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Driver</p>
              <p className="text-zinc-200 font-semibold mt-1">{driverName}</p>
            </div>
          ) : null}
          {showReimbursementStatus ? (
            <div className="col-span-2">
              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600">
                Reimbursement
              </p>
              <p className="text-zinc-200 font-semibold mt-1">
                {expense.reimbursementForDriver !== false ? 'Yes' : 'No'}
              </p>
            </div>
          ) : null}
        </div>

        {expense.reimbursementForDriver === false ? (
          <p className="text-[11px] text-amber-400/90 normal-case bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            Recorded for tracking — reimbursement not requested.
          </p>
        ) : null}

        {embedReceipt && receiptPreview ? (
          <div className="pt-2">
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-3">
              Receipt Preview
            </p>
            <div className="rounded-xl border border-zinc-800 overflow-hidden bg-black/30">
              <img
                src={receiptPreview}
                alt="Receipt"
                className="w-full max-h-80 object-contain"
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ExpenseSummaryCard;
