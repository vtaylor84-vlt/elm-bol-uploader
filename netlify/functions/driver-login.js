const MAX_EMAIL_LENGTH = 254;

/** Login-enabled ELM_CONNECT_UPLOADER deployment (@39+). Upload keeps APPS_SCRIPT_WEB_APP_URL. */
const LOGIN_APPS_SCRIPT_WEB_APP_URL =
  process.env.LOGIN_APPS_SCRIPT_WEB_APP_URL ||
  'https://script.google.com/macros/s/AKfycbxT_Zl6T-iP7NemVqxJ3rFILPMtsEofJ-lyX1ghOeKqeuyJecTjAElheGazedvVpkXx/exec';

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

function buildSafeLoginDiag(email, gasDiag, extras = {}) {
  return {
    emailNormalized: email || gasDiag?.emailNormalized || '',
    tokenPresent: Boolean(process.env.UPLOAD_TOKEN),
    routeMatched: gasDiag?.routeMatched ?? extras.routeMatched ?? false,
    isBridgeAdmin: gasDiag?.isBridgeAdmin ?? false,
    driverMatchFound: gasDiag?.driverMatchFound ?? false,
  };
}

async function forwardToLoginAppsScript(payload) {
  const response = await fetch(LOGIN_APPS_SCRIPT_WEB_APP_URL, {
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
      result: {
        status: 'error',
        message: 'Invalid Apps Script response',
        loginDiag: buildSafeLoginDiag(payload.email, null, { routeMatched: false }),
      },
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
    logLoginDiag('origin_rejected', { requestOrigin: requestOrigin || null });
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
      const loginDiag = buildSafeLoginDiag(email, null, { routeMatched: false });
      logLoginDiag('validation_rejected', { reason: 'invalid_email', ...loginDiag });
      return jsonResponse(400, {
        success: false,
        error: 'Access denied. Use an approved driver or admin email.',
        loginDiag,
      }, corsOrigin);
    }

    logLoginDiag('forward_apps_script', {
      emailMasked: maskEmailForLog(email),
      tokenPresent: Boolean(process.env.UPLOAD_TOKEN),
    });

    const gasResponse = await forwardToLoginAppsScript({
      action: 'verifyDriverLogin',
      uploadToken: process.env.UPLOAD_TOKEN,
      email,
    });

    const gasResult = gasResponse.result;
    const loginDiag = buildSafeLoginDiag(email, gasResult.loginDiag, {
      routeMatched: gasResult.loginDiag?.routeMatched ?? Boolean(gasResult.status),
    });

    if (gasResult.status === 'success' && gasResult.profile) {
      logLoginDiag('login_success', {
        authRole: gasResult.profile.authRole,
        canSelectAnyDriver: gasResult.profile.canSelectAnyDriver,
        ...loginDiag,
      });
      return jsonResponse(200, {
        success: true,
        profile: gasResult.profile,
        loginDiag,
      }, corsOrigin);
    }

    logLoginDiag('login_denied', {
      appsScriptHttpStatus: gasResponse.httpStatus,
      message: gasResult.message || null,
      ...loginDiag,
    });

    const statusCode = gasResult.message === 'Unauthorized' ? 401 : 403;
    return jsonResponse(statusCode, {
      success: false,
      error: 'Access denied. Use an approved driver or admin email.',
      loginDiag,
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
