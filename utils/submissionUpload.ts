import type {
  BolPodUploadPayload,
  ExpenseUploadPayload,
  SubmissionUploadPayload,
  UploadFilePayload,
} from '../types/submission.ts';
import type { ExpenseRecord } from '../types/submission.ts';

/** Set while Showcase Mode is active — production upload clients must refuse. */
let showcaseWriteBlock = false;

export function setShowcaseProductionWriteBlock(active: boolean): void {
  showcaseWriteBlock = active;
}

export function isShowcaseProductionWriteBlocked(): boolean {
  return showcaseWriteBlock;
}

function assertProductionWritesAllowed(operation: string): void {
  if (showcaseWriteBlock) {
    throw new Error(
      `Production ${operation} blocked while Showcase Mode is active. NOT CONNECTED TO PRODUCTION.`
    );
  }
}

export async function filesToBase64Payload(
  files: { category: UploadFilePayload['category']; file: File | Blob }[]
): Promise<UploadFilePayload[]> {
  return Promise.all(
    files.map(
      (f) =>
        new Promise<UploadFilePayload>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error('read_failed'));
          reader.onload = () =>
            resolve({
              category: f.category,
              base64: String(reader.result || ''),
            });
          reader.readAsDataURL(f.file);
        })
    )
  );
}

export function buildBolPodUploadPayload(params: {
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
  files: UploadFilePayload[];
}): BolPodUploadPayload {
  return {
    submissionType: 'BOL_POD',
    company: params.company,
    driverName: params.driverName,
    loadNum: params.loadNum,
    loadId: params.loadId,
    bolNum: params.bolNum.trim(),
    bolProtocol: params.bolProtocol,
    puCity: params.puCity,
    puState: params.puState,
    delCity: params.delCity,
    delState: params.delState,
    origin: `${params.puCity} ${params.puState}`.trim(),
    destination: `${params.delCity} ${params.delState}`.trim(),
    files: params.files,
  };
}

export function buildExpenseUploadPayload(params: {
  company: string;
  driverName: string;
  expense: ExpenseRecord;
  files: UploadFilePayload[];
}): ExpenseUploadPayload {
  return {
    submissionType: 'EXPENSE_RECEIPT',
    company: params.company,
    driverName: params.driverName,
    expense: params.expense,
    files: params.files,
  };
}

export async function submitDocumentUpload(
  payload: SubmissionUploadPayload
): Promise<{ success: boolean; url?: string | null; error?: string }> {
  assertProductionWritesAllowed('upload');

  const response = await fetch('/.netlify/functions/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let result: { success?: boolean; url?: string | null; error?: string } = {};
  try {
    result = await response.json();
  } catch {
    throw new Error('Upload failed: invalid server response');
  }

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Upload failed');
  }

  return { success: true, url: result.url };
}

export function savePayloadToVault(payload: SubmissionUploadPayload): void {
  assertProductionWritesAllowed('vault save');
  const currentVault = JSON.parse(localStorage.getItem('multi_vault') || '[]');
  localStorage.setItem(
    'multi_vault',
    JSON.stringify([
      ...currentVault,
      {
        id: Math.random().toString(),
        timestamp: Date.now(),
        payload,
      },
    ])
  );
}
