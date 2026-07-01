/** Submission and document types for ELM CONNECT Driver Terminal */

export type SubmissionType = 'BOL_POD' | 'EXPENSE_RECEIPT';

export type DocumentType = 'BOL' | 'POD' | 'EXPENSE_RECEIPT';

export type DocumentFileCategory = 'bol' | 'freight' | 'expense_receipt';

export type ExpenseCategory =
  | 'fuel'
  | 'tolls'
  | 'parking'
  | 'lumper'
  | 'repairs'
  | 'meals'
  | 'other';

export interface DocumentRecord {
  id: string;
  documentType: DocumentType;
  fileCategory: DocumentFileCategory;
  fileName?: string;
  previewUrl?: string;
}

export interface ExpenseRecord {
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  loadNum?: string;
  bolNum?: string;
  notes?: string;
}

export interface BolPodSubmissionData {
  eventType: 'PICKUP' | 'DELIVERY';
  bolNum: string;
  loadNum: string;
  loadId?: string;
  puCity: string;
  puState: string;
  delCity: string;
  delState: string;
  bolProtocol: 'PICKUP' | 'DELIVERY';
}

export interface SubmissionRecord {
  submissionId: string;
  submissionType: SubmissionType;
  driverName: string;
  company: string;
  createdAt: string;
  bolPod?: BolPodSubmissionData;
  expense?: ExpenseRecord;
  documents: DocumentRecord[];
}

export interface UploadFilePayload {
  category: DocumentFileCategory;
  base64: string;
}

export interface BolPodUploadPayload {
  submissionType: 'BOL_POD';
  company: string;
  driverName: string;
  loadNum: string;
  loadId?: string;
  bolNum: string;
  bolProtocol: 'PICKUP' | 'DELIVERY';
  puCity: string;
  puState: string;
  delCity: string;
  delState: string;
  origin: string;
  destination: string;
  files: UploadFilePayload[];
}

export interface ExpenseUploadPayload {
  submissionType: 'EXPENSE_RECEIPT';
  company: string;
  driverName: string;
  expense: ExpenseRecord;
  files: UploadFilePayload[];
}

export type SubmissionUploadPayload = BolPodUploadPayload | ExpenseUploadPayload;

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  fuel: 'Fuel',
  tolls: 'Tolls',
  parking: 'Parking',
  lumper: 'Lumper',
  repairs: 'Repairs',
  meals: 'Meals',
  other: 'Other',
};

export function createSubmissionId(): string {
  return `SUB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function documentTypeFromBolProtocol(
  bolProtocol: 'PICKUP' | 'DELIVERY'
): DocumentType {
  return bolProtocol === 'DELIVERY' ? 'POD' : 'BOL';
}
