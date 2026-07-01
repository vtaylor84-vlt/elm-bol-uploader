import {
  displayExpenseType,
  displayPaidWith,
  toBackendCategory,
  type ExpenseFormState,
} from '../types/expense.ts';
import type { ExpenseRecord } from '../types/submission.ts';

export function buildExpenseNotes(form: ExpenseFormState): string {
  const parts = [
    form.truckNumber.trim() && `Truck: ${form.truckNumber.trim()}`,
    form.vendor.trim() && `Vendor: ${form.vendor.trim()}`,
    `Paid: ${displayPaidWith(form)}`,
    `Type: ${displayExpenseType(form)}`,
    form.reimbursementForDriver === false && 'Reimbursement: No',
  ].filter(Boolean);
  return parts.join(' | ').slice(0, 100);
}

export function expenseFormToRecord(form: ExpenseFormState): ExpenseRecord {
  const amount = parseFloat(form.amount.replace(/[^0-9.]/g, ''));
  return {
    category: toBackendCategory(form.expenseType),
    expenseType: form.expenseType,
    expenseTypeOther: form.expenseTypeOther.trim() || undefined,
    amount,
    expenseDate: form.expenseDate,
    truckNumber: form.truckNumber.trim(),
    vendor: form.vendor.trim(),
    paidWith: form.paidWith,
    paidWithOther: form.paidWithOther.trim() || undefined,
    reimbursementForDriver: form.reimbursementForDriver,
    notes: buildExpenseNotes(form),
  };
}

export function validateExpenseDetails(form: ExpenseFormState, isAdmin: boolean): string | null {
  if (isAdmin && !form.selectedDriverName.trim()) {
    return 'Select the driver this expense belongs to.';
  }
  if (!form.truckNumber.trim()) return 'Truck number is required.';
  if (!form.expenseDate) return 'Expense date is required.';
  const amount = parseFloat(form.amount.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return 'Enter a valid reimbursement amount.';
  if (!form.paidWith) return 'Select how this expense was paid.';
  if (form.paidWith === 'other' && !form.paidWithOther.trim()) {
    return 'Please specify how this expense was paid.';
  }
  if (!form.vendor.trim()) return 'Vendor / payee is required.';
  if (!form.expenseType) return 'Select an expense type.';
  if (form.expenseType === 'other' && !form.expenseTypeOther.trim()) {
    return 'Please specify the expense type.';
  }
  return null;
}

export function formatCurrencyInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join('').slice(0, 2)}`;
}

export function formatCurrencyDisplay(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}
