const VALID_COMPANY_CODES = new Set(['BST', 'GLX']);

const DISPLAY_TO_CODE: Record<string, string> = {
  'bst expedite inc': 'BST',
  'bst expedite': 'BST',
  'greenleaf xpress': 'GLX',
  bst: 'BST',
  glx: 'GLX',
};

export const EXPENSE_COMPANY_ERROR =
  'Company could not be determined from the selected truck. Please select another truck or contact admin.';

export function normalizeCompanyCode(raw?: string): string {
  return String(raw || '').trim().toUpperCase();
}

export function companyCodeToUploadValue(code: string): string {
  const normalized = normalizeCompanyCode(code);
  if (normalized === 'BST') return 'BST';
  if (normalized === 'GLX') return 'GLX';
  return normalized;
}

export function resolveExpenseUploadCompany(
  expense: { companyCode?: string },
  draftCompany: string
): string | null {
  const fromTruck = normalizeCompanyCode(expense.companyCode);
  if (VALID_COMPANY_CODES.has(fromTruck)) return fromTruck;

  const fromDraft = DISPLAY_TO_CODE[String(draftCompany || '').trim().toLowerCase()];
  if (fromDraft && VALID_COMPANY_CODES.has(fromDraft)) return fromDraft;

  const draftUpper = normalizeCompanyCode(draftCompany);
  if (VALID_COMPANY_CODES.has(draftUpper)) return draftUpper;

  return null;
}

export function companyCodeLabel(code?: string): string {
  const c = normalizeCompanyCode(code);
  if (c === 'BST') return 'BST Expedite Inc';
  if (c === 'GLX') return 'Greenleaf Xpress';
  return c || '—';
}
