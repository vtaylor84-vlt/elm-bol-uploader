import {
  displayExpenseType,
  displayPaidWith,
  isCustomDriverSelection,
  resolveExpenseDriverName,
  toBackendCategory,
  type ExpenseFormState,
} from '../types/expense.ts';
import type { ExpenseRecord } from '../types/submission.ts';
import { EXPENSE_COMPANY_ERROR, normalizeCompanyCode, resolveExpenseUploadCompany } from './companyMap.ts';

export function buildExpenseNotes(form: ExpenseFormState): string {
  const parts = [
    form.truckNumber.trim() && `Truck: ${form.truckNumber.trim()}`,
    form.companyCode.trim() && `Co: ${form.companyCode.trim()}`,
    form.vendor.trim() && `Vendor: ${form.vendor.trim()}`,
    `Paid: ${displayPaidWith(form)}`,
    `Type: ${displayExpenseType(form)}`,
    form.reimbursementForDriver === false && 'Reimbursement: No',
    isCustomDriverSelection(form.selectedDriverName) && 'Driver: manual entry',
  ].filter(Boolean);
  return parts.join(' | ').slice(0, 100);
}

export function expenseFormToRecord(form: ExpenseFormState): ExpenseRecord {
  const amount = parseFloat(form.amount.replace(/[^0-9.]/g, ''));
  return {
    category: toBackendCategory(form.expenseType),
    expenseType: form.expenseType || undefined,
    expenseTypeOther: form.expenseTypeOther.trim() || undefined,
    amount,
    expenseDate: form.expenseDate,
    truckNumber: form.truckNumber.trim(),
    companyCode: normalizeCompanyCode(form.companyCode),
    vendor: form.vendor.trim(),
    paidWith: form.paidWith || undefined,
    paidWithOther: form.paidWithOther.trim() || undefined,
    reimbursementForDriver: form.reimbursementForDriver,
    notes: buildExpenseNotes(form),
  };
}

export function validateExpenseDetails(form: ExpenseFormState, isAdmin: boolean): string | null {
  if (isAdmin) {
    if (!form.selectedDriverName.trim()) {
      return 'Select the driver this expense belongs to.';
    }
    if (isCustomDriverSelection(form.selectedDriverName) && !form.customDriverName.trim()) {
      return 'Enter the driver name.';
    }
  }

  if (!form.truckNumber.trim()) return 'Select a truck number.';
  if (!normalizeCompanyCode(form.companyCode)) {
    return EXPENSE_COMPANY_ERROR;
  }
  if (!form.expenseDate) return 'Expense date is required.';

  const amount = parseFloat(form.amount.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return 'Enter a valid reimbursement amount.';

  if (!form.paidWith) return 'Select a payment method.';
  if (form.paidWith === 'other' && !form.paidWithOther.trim()) {
    return 'Please specify payment method.';
  }

  if (!form.vendor.trim()) return 'Vendor / payee is required.';
  if (!form.expenseType) return 'Select an expense type.';
  if (form.expenseType === 'other' && !form.expenseTypeOther.trim()) {
    return 'Please specify expense type.';
  }

  return null;
}

export function validateExpenseForSubmit(
  expense: ExpenseRecord,
  draftCompany: string
): string | null {
  if (!resolveExpenseUploadCompany(expense, draftCompany)) {
    return EXPENSE_COMPANY_ERROR;
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

export function formatExpenseDateDisplay(isoDate: string): string {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${m}/${d}/${y}`;
}

export { resolveExpenseDriverName };
