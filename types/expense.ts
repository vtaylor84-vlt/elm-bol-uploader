import type { ExpenseCategory } from './submission.ts';

/** UI expense type identifiers (distinct from backend category codes). */
export type ExpenseTypeId =
  | 'fuel'
  | 'hotel'
  | 'lumper'
  | 'maintenance'
  | 'parking'
  | 'repair'
  | 'scales'
  | 'taxi_transport'
  | 'toll'
  | 'warehouse'
  | 'wash'
  | 'other';

export type PaidWithId =
  | 'cash_advance'
  | 'company_card'
  | 'efs'
  | 'fuel_card'
  | 'personal_card'
  | 'personal_cash'
  | 'other';

export const DRIVER_SELECT_MANUAL = '__MANUAL_ENTRY__';
export const DRIVER_SELECT_NOT_LISTED = '__DRIVER_NOT_LISTED__';

export interface ExpenseFormState {
  expenseType: ExpenseTypeId | '';
  expenseTypeOther: string;
  amount: string;
  expenseDate: string;
  truckNumber: string;
  companyCode: string;
  vendor: string;
  paidWith: PaidWithId | '';
  paidWithOther: string;
  reimbursementForDriver: boolean;
  selectedDriverName: string;
  customDriverName: string;
}

export const PAID_WITH_OPTIONS: { value: PaidWithId; label: string }[] = [
  { value: 'cash_advance', label: 'Cash Advance' },
  { value: 'company_card', label: 'Company Card' },
  { value: 'efs', label: 'EFS' },
  { value: 'fuel_card', label: 'Fuel Card' },
  { value: 'personal_card', label: 'Personal Card' },
  { value: 'personal_cash', label: 'Personal Cash' },
  { value: 'other', label: 'Other' },
];

export const EXPENSE_TYPE_OPTIONS: { value: ExpenseTypeId; label: string }[] = [
  { value: 'fuel', label: 'Fuel' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'lumper', label: 'Lumper' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'parking', label: 'Parking' },
  { value: 'repair', label: 'Repair' },
  { value: 'scales', label: 'Scales' },
  { value: 'taxi_transport', label: 'Taxi/Uber/Transportation' },
  { value: 'toll', label: 'Toll' },
  { value: 'warehouse', label: 'Warehouse Charge' },
  { value: 'wash', label: 'Wash' },
  { value: 'other', label: 'Other' },
];

const EXPENSE_TYPE_TO_BACKEND: Record<ExpenseTypeId, ExpenseCategory> = {
  fuel: 'fuel',
  hotel: 'meals',
  lumper: 'lumper',
  maintenance: 'repairs',
  parking: 'parking',
  repair: 'repairs',
  scales: 'other',
  taxi_transport: 'other',
  toll: 'tolls',
  warehouse: 'other',
  wash: 'other',
  other: 'other',
};

export function expenseTypeLabel(id: ExpenseTypeId | ''): string {
  if (!id) return '';
  return EXPENSE_TYPE_OPTIONS.find((o) => o.value === id)?.label || id;
}

export function paidWithLabel(id: PaidWithId | ''): string {
  if (!id) return '';
  return PAID_WITH_OPTIONS.find((o) => o.value === id)?.label || id;
}

export function toBackendCategory(expenseType: ExpenseTypeId | ''): ExpenseCategory {
  if (!expenseType) return 'other';
  return EXPENSE_TYPE_TO_BACKEND[expenseType] || 'other';
}

export function displayExpenseType(form: Pick<ExpenseFormState, 'expenseType' | 'expenseTypeOther'>): string {
  if (form.expenseType === 'other' && form.expenseTypeOther.trim()) {
    return form.expenseTypeOther.trim();
  }
  return expenseTypeLabel(form.expenseType);
}

export function displayPaidWith(form: Pick<ExpenseFormState, 'paidWith' | 'paidWithOther'>): string {
  if (form.paidWith === 'other' && form.paidWithOther.trim()) {
    return form.paidWithOther.trim();
  }
  return paidWithLabel(form.paidWith);
}

export function isCustomDriverSelection(value: string): boolean {
  return value === DRIVER_SELECT_MANUAL || value === DRIVER_SELECT_NOT_LISTED;
}

export function resolveExpenseDriverName(form: ExpenseFormState): string {
  if (isCustomDriverSelection(form.selectedDriverName)) {
    return form.customDriverName.trim().toUpperCase();
  }
  return form.selectedDriverName.trim().toUpperCase();
}

export const defaultExpenseFormState = (): ExpenseFormState => ({
  expenseType: '',
  expenseTypeOther: '',
  amount: '',
  expenseDate: new Date().toISOString().slice(0, 10),
  truckNumber: '',
  companyCode: '',
  vendor: '',
  paidWith: '',
  paidWithOther: '',
  reimbursementForDriver: true,
  selectedDriverName: '',
  customDriverName: '',
});
