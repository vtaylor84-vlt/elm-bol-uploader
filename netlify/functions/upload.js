import {
  isOriginAllowed,
  parseAllowedOrigins,
  resolveCorsOrigin,
} from './_shared/allowedOrigins.js';

const MAX_FILES = 20;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;
const MAX_FIELD_LENGTH = 100;

const ALLOWED_DATA_URL_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png']);

const BLOCKED_HEIC_MIMES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

const COMPANY_MAP = {
  'BST Expedite Inc': 'BST',
  'BST Expedite': 'BST',
  'Greenleaf Xpress': 'GLX',
  BST: 'BST',
  GLX: 'GLX',
};

const HEIC_BLOCK_MESSAGE =
  'This photo format is not supported. On iPhone: Settings → Camera → Formats → Most Compatible. Or upload JPG/PNG.';

const PDF_BLOCK_MESSAGE =
  'PDF files are not supported. Please upload JPG or PNG photos only.';

const WEBP_BLOCK_MESSAGE =
  'WEBP files are not supported. Please upload JPG or PNG photos only.';

const VIDEO_BLOCK_MESSAGE =
  'Video files are not supported. Please upload JPG or PNG photos only.';

function getEnvDiagnostics() {
  const allowedOrigins = getAllowedOrigins();
  return {
    hasUploadToken: Boolean(process.env.UPLOAD_TOKEN),
    hasAppsScriptUrl: Boolean(process.env.APPS_SCRIPT_WEB_APP_URL),
    hasAllowedOrigins: allowedOrigins.length > 0,
    allowedOrigins,
  };
}

function logUploadDiag(validationStage, details = {}) {
  console.log(
    '[upload-diag]',
    JSON.stringify({
      validationStage,
      ...details,
    })
  );
}

export const handler = async (event) => {
  const envDiag = getEnvDiagnostics();
  const requestOrigin = getHeader(event, 'origin');
  const allowedOrigins = envDiag.allowedOrigins;
  const corsOrigin = resolveCorsOrigin(requestOrigin, allowedOrigins);

  logUploadDiag('request_received', {
    httpMethod: event.httpMethod,
    requestOrigin: requestOrigin || null,
    allowedOrigins,
    hasUploadToken: envDiag.hasUploadToken,
    hasAppsScriptUrl: envDiag.hasAppsScriptUrl,
    hasAllowedOrigins: envDiag.hasAllowedOrigins,
  });

  if (event.httpMethod === 'OPTIONS') {
    logUploadDiag('options_preflight');
    return respond(204, '', corsOrigin);
  }

  if (event.httpMethod !== 'POST') {
    logUploadDiag('method_rejected', { httpMethod: event.httpMethod });
    return jsonResponse(405, { success: false, error: 'Method not allowed' }, corsOrigin);
  }

  logUploadDiag('origin_check', {
    requestOrigin: requestOrigin || null,
    originAllowed: isOriginAllowed(requestOrigin, allowedOrigins),
  });

  if (!corsOrigin || !isOriginAllowed(requestOrigin, allowedOrigins)) {
    logUploadDiag('origin_rejected');
    return jsonResponse(403, { success: false, error: 'Forbidden origin' }, null);
  }

  logUploadDiag('config_check');
  const configError = validateServerConfig();
  if (configError) {
    logUploadDiag('config_rejected', {
      configError,
      hasUploadToken: envDiag.hasUploadToken,
      hasAppsScriptUrl: envDiag.hasAppsScriptUrl,
      hasAllowedOrigins: envDiag.hasAllowedOrigins,
    });
    return jsonResponse(500, { success: false, error: 'Server configuration error' }, corsOrigin);
  }

  try {
    logUploadDiag('parse_body');
    const data = parseJsonBody(event);

    logUploadDiag('validate_submission');
    const validation = validateSubmission(data);
    if (!validation.ok) {
      logUploadDiag('validation_rejected', {
        statusCode: validation.statusCode,
        error: validation.error,
      });
      return jsonResponse(validation.statusCode, { success: false, error: validation.error }, corsOrigin);
    }

    logUploadDiag('validation_passed', {
      fileCount: validation.data.files.length,
      company: validation.data.company,
      bolProtocol: validation.data.bolProtocol,
    });

    const gasPayload = buildAppsScriptPayload(validation.data);
    logUploadDiag('forward_apps_script');

    const gasResponse = await forwardToAppsScript(gasPayload);
    const gasResult = gasResponse.result;

    logUploadDiag('apps_script_response', {
      appsScriptHttpStatus: gasResponse.httpStatus,
      appsScriptJsonStatus: gasResult.status || null,
      appsScriptJsonMessage: gasResult.message || null,
    });

    if (gasResult.status === 'success') {
      logUploadDiag('response_success', { httpStatus: 200 });
      return jsonResponse(200, { success: true, url: gasResult.url || null }, corsOrigin);
    }

    const statusCode = gasResult.message === 'Unauthorized' ? 401 : 400;

    if (statusCode === 401) {
      logUploadDiag('response_401', {
        unauthorizedSource: envDiag.hasUploadToken
          ? 'apps_script_unauthorized'
          : 'netlify_missing_upload_token',
        netlifyConfigComplete:
          envDiag.hasUploadToken &&
          envDiag.hasAppsScriptUrl &&
          envDiag.hasAllowedOrigins,
        appsScriptHttpStatus: gasResponse.httpStatus,
        appsScriptJsonStatus: gasResult.status || null,
        appsScriptJsonMessage: gasResult.message || null,
      });
    } else {
      logUploadDiag('response_error', {
        httpStatus: statusCode,
        appsScriptHttpStatus: gasResponse.httpStatus,
        appsScriptJsonStatus: gasResult.status || null,
        appsScriptJsonMessage: gasResult.message || null,
      });
    }

    return jsonResponse(statusCode, { success: false, error: gasResult.message || 'Upload failed' }, corsOrigin);
  } catch (err) {
    logUploadDiag('handler_exception', {
      errorName: err?.name || 'Error',
      errorMessage: err?.message || 'Unknown error',
    });
    return jsonResponse(500, { success: false, error: 'Internal server error' }, corsOrigin);
  }
};

export default handler;

function parseJsonBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    throw new Error('Invalid JSON body');
  }
}

function getAllowedOrigins() {
  return parseAllowedOrigins(process.env.ALLOWED_ORIGINS);
}

function validateServerConfig() {
  if (!process.env.UPLOAD_TOKEN) return 'Missing UPLOAD_TOKEN';
  if (!process.env.APPS_SCRIPT_WEB_APP_URL) return 'Missing APPS_SCRIPT_WEB_APP_URL';
  if (getAllowedOrigins().length === 0) return 'Missing ALLOWED_ORIGINS';
  return null;
}

function getHeader(event, name) {
  const headers = event.headers || {};
  return headers[name] || headers[name.toLowerCase()] || '';
}

function buildCorsHeaders(corsOrigin) {
  if (!corsOrigin) return {};
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function respond(statusCode, body, corsOrigin) {
  return { statusCode, headers: buildCorsHeaders(corsOrigin), body };
}

function jsonResponse(statusCode, payload, corsOrigin) {
  return {
    statusCode,
    headers: {
      ...buildCorsHeaders(corsOrigin),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  };
}

function mapCompanyCode(company) {
  const raw = String(company || '').trim();
  return COMPANY_MAP[raw] || COMPANY_MAP[raw.toUpperCase()] || null;
}

function validateSubmission(data) {
  const submissionType = String(data.submissionType || 'BOL_POD').trim().toUpperCase();

  if (submissionType === 'EXPENSE_RECEIPT') {
    return validateExpenseSubmission(data);
  }

  return validateBolPodSubmission(data);
}

function validateBolPodSubmission(data) {
  const companyCode = mapCompanyCode(data.company);
  if (!companyCode) {
    return { ok: false, statusCode: 400, error: 'Invalid company' };
  }

  const driverName = String(data.driverName || '').trim();
  if (!driverName) {
    return { ok: false, statusCode: 400, error: 'Driver name is required' };
  }
  if (driverName.length > MAX_FIELD_LENGTH) {
    return { ok: false, statusCode: 400, error: 'Driver name is too long' };
  }

  const bolNum = String(data.bolNum || '').trim();
  if (!bolNum) {
    return { ok: false, statusCode: 400, error: 'BOL number is required' };
  }
  if (bolNum.length > MAX_FIELD_LENGTH) {
    return { ok: false, statusCode: 400, error: 'BOL number is too long' };
  }

  const loadNum = String(data.loadNum || '').trim() || 'NA';

  const bolProtocol = String(data.bolProtocol || '').trim().toUpperCase();
  if (bolProtocol !== 'PICKUP' && bolProtocol !== 'DELIVERY') {
    return { ok: false, statusCode: 400, error: 'Invalid BOL type' };
  }

  const files = Array.isArray(data.files) ? data.files : [];
  if (!files.length) {
    return { ok: false, statusCode: 400, error: 'At least one file is required' };
  }
  if (files.length > MAX_FILES) {
    return { ok: false, statusCode: 400, error: `No more than ${MAX_FILES} files allowed` };
  }

  let totalBytes = 0;
  const sanitizedFiles = [];

  for (const file of files) {
    const category = String(file.category || '').trim().toLowerCase();
    if (category !== 'bol' && category !== 'freight') {
      return { ok: false, statusCode: 400, error: 'Invalid file category' };
    }

    const base64 = String(file.base64 || '');
    const mimeType = getDataUrlMime(base64);

    if (BLOCKED_HEIC_MIMES.has(mimeType) || /\.(heic|heif)(\?|$)/i.test(base64)) {
      return { ok: false, statusCode: 400, error: HEIC_BLOCK_MESSAGE };
    }
    if (mimeType === 'application/pdf' || /\.pdf(\?|$)/i.test(base64)) {
      return { ok: false, statusCode: 400, error: PDF_BLOCK_MESSAGE };
    }
    if (mimeType === 'image/webp' || /\.webp(\?|$)/i.test(base64)) {
      return { ok: false, statusCode: 400, error: WEBP_BLOCK_MESSAGE };
    }
    if (mimeType.startsWith('video/')) {
      return { ok: false, statusCode: 400, error: VIDEO_BLOCK_MESSAGE };
    }
    if (!ALLOWED_DATA_URL_MIMES.has(mimeType)) {
      return { ok: false, statusCode: 400, error: 'Only JPG and PNG photos are supported.' };
    }

    const encoded = base64.split(',')[1] || '';
    const size = Buffer.from(encoded, 'base64').length;
    if (size === 0) {
      return { ok: false, statusCode: 400, error: 'Empty files are not allowed' };
    }
    if (size > MAX_FILE_BYTES) {
      return { ok: false, statusCode: 400, error: 'File exceeds maximum size' };
    }

    totalBytes += size;
    sanitizedFiles.push({ category, base64 });
  }

  if (totalBytes > MAX_TOTAL_BYTES) {
    return { ok: false, statusCode: 400, error: 'Total upload size exceeds limit' };
  }

  return {
    ok: true,
    data: {
      submissionType: 'BOL_POD',
      company: companyCode,
      driverName,
      loadNum,
      bolNum,
      bolProtocol,
      puCity: String(data.puCity || '').trim(),
      puState: String(data.puState || '').trim(),
      delCity: String(data.delCity || '').trim(),
      delState: String(data.delState || '').trim(),
      origin: String(data.origin || '').trim(),
      destination: String(data.destination || '').trim(),
      files: sanitizedFiles,
    },
  };
}

function validateExpenseSubmission(data) {
  const companyCode = mapCompanyCode(data.company);
  if (!companyCode) {
    return { ok: false, statusCode: 400, error: 'Invalid company' };
  }

  const driverName = String(data.driverName || '').trim();
  if (!driverName) {
    return { ok: false, statusCode: 400, error: 'Driver name is required' };
  }
  if (driverName.length > MAX_FIELD_LENGTH) {
    return { ok: false, statusCode: 400, error: 'Driver name is too long' };
  }

  const expense = data.expense || {};
  const category = String(expense.category || '').trim().toLowerCase();
  const allowedCategories = new Set([
    'fuel', 'tolls', 'parking', 'lumper', 'repairs', 'meals', 'other',
  ]);
  if (!allowedCategories.has(category)) {
    return { ok: false, statusCode: 400, error: 'Invalid expense category' };
  }

  const amount = Number(expense.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, statusCode: 400, error: 'Invalid expense amount' };
  }

  const expenseDate = String(expense.expenseDate || '').trim();
  if (!expenseDate) {
    return { ok: false, statusCode: 400, error: 'Expense date is required' };
  }

  const files = Array.isArray(data.files) ? data.files : [];
  if (!files.length) {
    return { ok: false, statusCode: 400, error: 'At least one receipt image is required' };
  }
  if (files.length > MAX_FILES) {
    return { ok: false, statusCode: 400, error: `No more than ${MAX_FILES} files allowed` };
  }

  let totalBytes = 0;
  const sanitizedFiles = [];

  for (const file of files) {
    const categoryFile = String(file.category || '').trim().toLowerCase();
    if (categoryFile !== 'expense_receipt') {
      return { ok: false, statusCode: 400, error: 'Invalid file category' };
    }

    const base64 = String(file.base64 || '');
    const mimeType = getDataUrlMime(base64);

    if (BLOCKED_HEIC_MIMES.has(mimeType) || /\.(heic|heif)(\?|$)/i.test(base64)) {
      return { ok: false, statusCode: 400, error: HEIC_BLOCK_MESSAGE };
    }
    if (mimeType === 'application/pdf' || /\.pdf(\?|$)/i.test(base64)) {
      return { ok: false, statusCode: 400, error: PDF_BLOCK_MESSAGE };
    }
    if (mimeType === 'image/webp' || /\.webp(\?|$)/i.test(base64)) {
      return { ok: false, statusCode: 400, error: WEBP_BLOCK_MESSAGE };
    }
    if (mimeType.startsWith('video/')) {
      return { ok: false, statusCode: 400, error: VIDEO_BLOCK_MESSAGE };
    }
    if (!ALLOWED_DATA_URL_MIMES.has(mimeType)) {
      return { ok: false, statusCode: 400, error: 'Only JPG and PNG photos are supported.' };
    }

    const encoded = base64.split(',')[1] || '';
    const size = Buffer.from(encoded, 'base64').length;
    if (size === 0) {
      return { ok: false, statusCode: 400, error: 'Empty files are not allowed' };
    }
    if (size > MAX_FILE_BYTES) {
      return { ok: false, statusCode: 400, error: 'File exceeds maximum size' };
    }

    totalBytes += size;
    sanitizedFiles.push({ category: categoryFile, base64 });
  }

  if (totalBytes > MAX_TOTAL_BYTES) {
    return { ok: false, statusCode: 400, error: 'Total upload size exceeds limit' };
  }

  return {
    ok: true,
    data: {
      submissionType: 'EXPENSE_RECEIPT',
      company: companyCode,
      driverName,
      expense: {
        category,
        amount,
        expenseDate,
        truckNumber: String(expense.truckNumber || '').trim(),
        companyCode: String(expense.companyCode || '').trim().toUpperCase(),
        vendor: String(expense.vendor || '').trim(),
        paidWith: String(expense.paidWith || '').trim(),
        paidWithOther: String(expense.paidWithOther || '').trim(),
        expenseType: String(expense.expenseType || '').trim(),
        expenseTypeOther: String(expense.expenseTypeOther || '').trim(),
        reimbursementForDriver: expense.reimbursementForDriver !== false,
        notes: String(expense.notes || '').trim().slice(0, MAX_FIELD_LENGTH),
      },
      files: sanitizedFiles,
    },
  };
}

function getDataUrlMime(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);/i);
  return match ? match[1].toLowerCase() : '';
}

function buildAppsScriptPayload(data) {
  if (data.submissionType === 'EXPENSE_RECEIPT') {
    return {
      uploadToken: process.env.UPLOAD_TOKEN,
      submissionType: 'EXPENSE_RECEIPT',
      company: data.company,
      driverName: data.driverName,
      expense: data.expense,
      files: data.files,
    };
  }

  return {
    uploadToken: process.env.UPLOAD_TOKEN,
    submissionType: 'BOL_POD',
    company: data.company,
    driverName: data.driverName,
    loadNum: data.loadNum,
    bolNum: data.bolNum,
    bolProtocol: data.bolProtocol,
    puCity: data.puCity,
    puState: data.puState,
    delCity: data.delCity,
    delState: data.delState,
    origin: data.origin,
    destination: data.destination,
    files: data.files,
  };
}

async function forwardToAppsScript(payload) {
  const response = await fetch(process.env.APPS_SCRIPT_WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });

  const raw = await response.text();
  try {
    return {
      httpStatus: response.status,
      result: JSON.parse(raw),
    };
  } catch {
    logUploadDiag('apps_script_non_json_response', {
      appsScriptHttpStatus: response.status,
      responsePreviewLength: raw.length,
    });
    return {
      httpStatus: response.status,
      result: { status: 'error', message: 'Invalid Apps Script response' },
    };
  }
}
