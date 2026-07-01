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

export const handler = async (event) => {
  const requestOrigin = getHeader(event, 'origin');
  const allowedOrigins = getAllowedOrigins();
  const corsOrigin = resolveCorsOrigin(requestOrigin, allowedOrigins);

  if (event.httpMethod === 'OPTIONS') {
    return respond(204, '', corsOrigin);
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { success: false, error: 'Method not allowed' }, corsOrigin);
  }

  if (!corsOrigin || !isOriginAllowed(requestOrigin, allowedOrigins)) {
    return jsonResponse(403, { success: false, error: 'Forbidden origin' }, null);
  }

  const configError = validateServerConfig();
  if (configError) {
    console.error(configError);
    return jsonResponse(500, { success: false, error: 'Server configuration error' }, corsOrigin);
  }

  try {
    const data = parseJsonBody(event);
    const validation = validateSubmission(data);
    if (!validation.ok) {
      return jsonResponse(validation.statusCode, { success: false, error: validation.error }, corsOrigin);
    }

    const gasPayload = buildAppsScriptPayload(validation.data);
    const gasResult = await forwardToAppsScript(gasPayload);

    if (gasResult.status === 'success') {
      return jsonResponse(200, { success: true, url: gasResult.url || null }, corsOrigin);
    }

    const statusCode = gasResult.message === 'Unauthorized' ? 401 : 400;
    return jsonResponse(statusCode, { success: false, error: gasResult.message || 'Upload failed' }, corsOrigin);
  } catch (err) {
    console.error('Upload handler error:', err);
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
  return (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
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

function resolveCorsOrigin(requestOrigin, allowedOrigins) {
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  return null;
}

function isOriginAllowed(requestOrigin, allowedOrigins) {
  return Boolean(requestOrigin && allowedOrigins.includes(requestOrigin));
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

  const bolNum = String(data.bolNum || data.loadNum || '').trim();
  if (!bolNum) {
    return { ok: false, statusCode: 400, error: 'BOL number is required' };
  }
  if (bolNum.length > MAX_FIELD_LENGTH) {
    return { ok: false, statusCode: 400, error: 'BOL number is too long' };
  }

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
      company: companyCode,
      driverName,
      loadNum: bolNum,
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

function getDataUrlMime(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);/i);
  return match ? match[1].toLowerCase() : '';
}

function buildAppsScriptPayload(data) {
  return {
    uploadToken: process.env.UPLOAD_TOKEN,
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
    return JSON.parse(raw);
  } catch {
    console.error('Apps Script returned non-JSON response:', raw.slice(0, 500));
    return { status: 'error', message: 'Invalid Apps Script response' };
  }
}
