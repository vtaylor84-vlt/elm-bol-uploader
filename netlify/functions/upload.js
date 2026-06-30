import busboy from 'busboy';

const MAX_FILES = 20;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;
const MAX_DRIVER_NAME_LENGTH = 100;
const MAX_LOAD_FIELD_LENGTH = 64;

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png']);

const BLOCKED_HEIC_MIME_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

const HEIC_BLOCK_MESSAGE =
  'HEIC/HEIF photos are not supported. On iPhone: Settings → Camera → Formats → Most Compatible. Or upload JPG/PNG.';

const PDF_BLOCK_MESSAGE =
  'PDF files are not supported. Please upload JPG or PNG photos only.';

const WEBP_BLOCK_MESSAGE =
  'WEBP files are not supported. Please upload JPG or PNG photos only.';

const VIDEO_BLOCK_MESSAGE =
  'Video files are not supported. Please upload JPG or PNG photos only.';

const COMPANY_MAP = {
  'Greenleaf Xpress': 'GLX',
  'BST Expedite': 'BST',
  GLX: 'GLX',
  BST: 'BST',
};

const BOL_PROTOCOL_MAP = {
  Pickup: 'PICKUP',
  Delivery: 'DELIVERY',
  PICKUP: 'PICKUP',
  DELIVERY: 'DELIVERY',
};

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

  if (!corsOrigin) {
    return jsonResponse(403, { success: false, error: 'Forbidden origin' }, null);
  }

  if (!isOriginAllowed(requestOrigin, allowedOrigins)) {
    return jsonResponse(403, { success: false, error: 'Forbidden origin' }, null);
  }

  const configError = validateServerConfig();
  if (configError) {
    console.error(configError);
    return jsonResponse(500, { success: false, error: 'Server configuration error' }, corsOrigin);
  }

  try {
    const { fields, files } = await parseMultipart(event);
    const validation = validateSubmission(fields, files);
    if (!validation.ok) {
      return jsonResponse(validation.statusCode, { success: false, error: validation.error }, corsOrigin);
    }

    const gasPayload = buildAppsScriptPayload(validation.data, files);
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
  return headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()] || '';
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
  if (!corsOrigin) {
    return {};
  }

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function respond(statusCode, body, corsOrigin) {
  return {
    statusCode,
    headers: buildCorsHeaders(corsOrigin),
    body,
  };
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

function parseMultipart(event) {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: normalizeHeaders(event.headers) });
    const fields = {};
    const files = [];

    bb.on('file', (_name, fileStream, info) => {
      const chunks = [];
      fileStream.on('data', (chunk) => chunks.push(chunk));
      fileStream.on('end', () => {
        files.push({
          fieldName: _name,
          filename: info.filename,
          mimeType: info.mimeType,
          data: Buffer.concat(chunks),
        });
      });
    });

    bb.on('field', (name, value) => {
      fields[name] = value;
    });

    bb.on('close', () => resolve({ fields, files }));
    bb.on('error', reject);

    const body = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64')
      : Buffer.from(event.body || '', 'utf8');

    bb.write(body);
    bb.end();
  });
}

function normalizeHeaders(headers = {}) {
  const normalized = {};
  for (const [key, value] of Object.entries(headers)) {
    normalized[key.toLowerCase()] = value;
  }
  return normalized;
}

function validateSubmission(fields, files) {
  const companyCode = COMPANY_MAP[String(fields.company || '').trim()];
  if (!companyCode) {
    return { ok: false, statusCode: 400, error: 'Invalid company' };
  }

  const driverName = String(fields.driverName || '').trim();
  if (!driverName) {
    return { ok: false, statusCode: 400, error: 'Driver name is required' };
  }
  if (driverName.length > MAX_DRIVER_NAME_LENGTH) {
    return { ok: false, statusCode: 400, error: 'Driver name is too long' };
  }

  const bolNumber = String(fields.bolNumber || '').trim();
  if (!bolNumber) {
    return { ok: false, statusCode: 400, error: 'BOL number is required' };
  }
  if (bolNumber.length > MAX_LOAD_FIELD_LENGTH) {
    return { ok: false, statusCode: 400, error: 'BOL number is too long' };
  }

  const loadNumber = String(fields.loadNumber || '').trim();
  if (loadNumber.length > MAX_LOAD_FIELD_LENGTH) {
    return { ok: false, statusCode: 400, error: 'Load number is too long' };
  }

  const bolProtocol = BOL_PROTOCOL_MAP[String(fields.bolDocType || '').trim()];
  if (!bolProtocol) {
    return { ok: false, statusCode: 400, error: 'Invalid BOL type' };
  }

  if (!files.length) {
    return { ok: false, statusCode: 400, error: 'At least one file is required' };
  }
  if (files.length > MAX_FILES) {
    return { ok: false, statusCode: 400, error: `No more than ${MAX_FILES} files allowed` };
  }

  let categories = [];
  try {
    categories = JSON.parse(fields.fileCategories || '[]');
  } catch {
    return { ok: false, statusCode: 400, error: 'Invalid file category metadata' };
  }

  if (!Array.isArray(categories) || categories.length !== files.length) {
    return { ok: false, statusCode: 400, error: 'File category metadata does not match uploaded files' };
  }

  let totalBytes = 0;
  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const category = String(categories[i] || '').trim().toLowerCase();
    if (category !== 'bol' && category !== 'freight') {
      return { ok: false, statusCode: 400, error: 'Invalid file category' };
    }

    const mimeType = normalizeMimeType(file.mimeType);
    const filename = String(file.filename || '');

    if (isBlockedHeicFile(mimeType, filename)) {
      return { ok: false, statusCode: 400, error: HEIC_BLOCK_MESSAGE };
    }
    if (isPdfFile(mimeType, filename)) {
      return { ok: false, statusCode: 400, error: PDF_BLOCK_MESSAGE };
    }
    if (isWebpFile(mimeType, filename)) {
      return { ok: false, statusCode: 400, error: WEBP_BLOCK_MESSAGE };
    }
    if (isVideoFile(mimeType, filename)) {
      return { ok: false, statusCode: 400, error: VIDEO_BLOCK_MESSAGE };
    }
    if (!isAllowedJpegOrPng(mimeType, filename)) {
      return { ok: false, statusCode: 400, error: 'Only JPG and PNG photos are supported.' };
    }

    const size = file.data.length;
    if (size === 0) {
      return { ok: false, statusCode: 400, error: 'Empty files are not allowed' };
    }
    if (size > MAX_FILE_BYTES) {
      return { ok: false, statusCode: 400, error: 'File exceeds maximum size' };
    }

    totalBytes += size;
    file.category = category;
    file.mimeType = mimeType;
  }

  if (totalBytes > MAX_TOTAL_BYTES) {
    return { ok: false, statusCode: 400, error: 'Total upload size exceeds limit' };
  }

  return {
    ok: true,
    data: {
      company: companyCode,
      driverName,
      loadNum: loadNumber,
      bolNum: bolNumber,
      bolProtocol,
      puCity: String(fields.puCity || '').trim(),
      puState: String(fields.puState || '').trim(),
      delCity: String(fields.delCity || '').trim(),
      delState: String(fields.delState || '').trim(),
    },
  };
}

function normalizeMimeType(mimeType) {
  const value = String(mimeType || '').trim().toLowerCase();
  return value === 'image/jpg' ? 'image/jpeg' : value;
}

function isBlockedHeicFile(mimeType, filename) {
  if (BLOCKED_HEIC_MIME_TYPES.has(mimeType)) return true;
  return /\.(heic|heif)$/i.test(String(filename || ''));
}

function isPdfFile(mimeType, filename) {
  if (String(mimeType || '').toLowerCase() === 'application/pdf') return true;
  return /\.pdf$/i.test(filename);
}

function isWebpFile(mimeType, filename) {
  if (String(mimeType || '').toLowerCase() === 'image/webp') return true;
  return /\.webp$/i.test(filename);
}

function isVideoFile(mimeType, filename) {
  if (String(mimeType || '').toLowerCase().startsWith('video/')) return true;
  return /\.(mp4|mov|webm|avi|mkv|m4v|3gp)$/i.test(filename);
}

function isAllowedJpegOrPng(mimeType, filename) {
  if (ALLOWED_MIME_TYPES.has(mimeType)) return true;
  return /\.(jpe?g|png)$/i.test(filename);
}

function buildAppsScriptPayload(data, files) {
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
    files: files.map((file) => ({
      base64: `data:${file.mimeType};base64,${file.data.toString('base64')}`,
      category: file.category,
    })),
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
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error('Apps Script returned non-JSON response:', raw.slice(0, 500));
    return { status: 'error', message: 'Invalid Apps Script response' };
  }

  return parsed;
}
