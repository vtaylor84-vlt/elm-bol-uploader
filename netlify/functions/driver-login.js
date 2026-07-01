const MAX_EMAIL_LENGTH = 254;

function getAllowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
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

function respond(statusCode, body, corsOrigin) {
  return { statusCode, headers: buildCorsHeaders(corsOrigin), body };
}

function validateServerConfig() {
  if (!process.env.UPLOAD_TOKEN) return 'Missing UPLOAD_TOKEN';
  if (!process.env.APPS_SCRIPT_WEB_APP_URL) return 'Missing APPS_SCRIPT_WEB_APP_URL';
  if (getAllowedOrigins().length === 0) return 'Missing ALLOWED_ORIGINS';
  return null;
}

function parseJsonBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    throw new Error('Invalid JSON body');
  }
}

function normalizeEmail(raw) {
  return String(raw || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function maskEmailForLog(email) {
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const local = parts[0];
  return `${local.charAt(0) || '*'}***@${parts[1]}`;
}

function logLoginDiag(stage, details = {}) {
  console.log('[driver-login-diag]', JSON.stringify({ stage, ...details }));
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
    return {
      httpStatus: response.status,
      result: { status: 'error', message: 'Invalid Apps Script response' },
    };
  }
}

export const handler = async (event) => {
  const allowedOrigins = getAllowedOrigins();
  const requestOrigin = getHeader(event, 'origin');
  const corsOrigin = resolveCorsOrigin(requestOrigin, allowedOrigins);

  logLoginDiag('request_received', {
    httpMethod: event.httpMethod,
    requestOrigin: requestOrigin || null,
  });

  if (event.httpMethod === 'OPTIONS') {
    return respond(204, '', corsOrigin);
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { success: false, error: 'Method not allowed' }, corsOrigin);
  }

  if (!corsOrigin || !isOriginAllowed(requestOrigin, allowedOrigins)) {
    logLoginDiag('origin_rejected');
    return jsonResponse(403, { success: false, error: 'Forbidden origin' }, null);
  }

  const configError = validateServerConfig();
  if (configError) {
    logLoginDiag('config_rejected', { configError });
    return jsonResponse(500, { success: false, error: 'Server configuration error' }, corsOrigin);
  }

  try {
    const body = parseJsonBody(event);
    const email = normalizeEmail(body.email);

    if (!email || !isValidEmail(email) || email.length > MAX_EMAIL_LENGTH) {
      logLoginDiag('validation_rejected', { reason: 'invalid_email' });
      return jsonResponse(400, {
        success: false,
        error: 'Access denied. Use an approved driver or admin email.',
      }, corsOrigin);
    }

    logLoginDiag('forward_apps_script', { emailMasked: maskEmailForLog(email) });

    const gasResponse = await forwardToAppsScript({
      action: 'verifyDriverLogin',
      uploadToken: process.env.UPLOAD_TOKEN,
      email,
    });

    const gasResult = gasResponse.result;

    if (gasResult.status === 'success' && gasResult.profile) {
      logLoginDiag('login_success', {
        authRole: gasResult.profile.authRole,
        canSelectAnyDriver: gasResult.profile.canSelectAnyDriver,
      });
      return jsonResponse(200, {
        success: true,
        profile: gasResult.profile,
      }, corsOrigin);
    }

    logLoginDiag('login_denied', {
      appsScriptHttpStatus: gasResponse.httpStatus,
      message: gasResult.message || null,
    });

    const statusCode = gasResult.message === 'Unauthorized' ? 401 : 403;
    return jsonResponse(statusCode, {
      success: false,
      error: 'Access denied. Use an approved driver or admin email.',
    }, corsOrigin);
  } catch (err) {
    logLoginDiag('handler_exception', {
      errorName: err?.name || 'Error',
      errorMessage: err?.message || 'Unknown error',
    });
    return jsonResponse(500, { success: false, error: 'Internal server error' }, corsOrigin);
  }
};

export default handler;
