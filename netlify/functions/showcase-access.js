/**
 * Validates a Showcase grant issued at admin login.
 * Does not expose UPLOAD_TOKEN or SHOWCASE_GRANT_SECRET to the client.
 */
import {
  isOriginAllowed,
  parseAllowedOrigins,
  resolveCorsOrigin,
} from './_shared/allowedOrigins.js';
import { verifyShowcaseGrant } from './_shared/showcaseGrant.js';

function getAllowedOrigins() {
  return parseAllowedOrigins(process.env.ALLOWED_ORIGINS);
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

export const handler = async (event) => {
  const allowedOrigins = getAllowedOrigins();
  const requestOrigin = getHeader(event, 'origin');
  const corsOrigin = resolveCorsOrigin(requestOrigin, allowedOrigins);

  if (event.httpMethod === 'OPTIONS') {
    return respond(204, '', corsOrigin);
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { allowed: false, error: 'Method not allowed' }, corsOrigin);
  }

  if (!corsOrigin || !isOriginAllowed(requestOrigin, allowedOrigins)) {
    return jsonResponse(403, { allowed: false, error: 'Forbidden origin' }, null);
  }

  if (!String(process.env.SHOWCASE_GRANT_SECRET || '').trim()) {
    return jsonResponse(
      500,
      { allowed: false, error: 'Showcase access is not configured' },
      corsOrigin
    );
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { allowed: false, error: 'Invalid JSON body' }, corsOrigin);
  }

  const grant = String(body.showcaseGrant || body.grant || '').trim();
  const verified = verifyShowcaseGrant(grant);
  if (!verified.ok) {
    return jsonResponse(
      403,
      { allowed: false, error: verified.error || 'Access denied', code: 'SHOWCASE_GRANT_INVALID' },
      corsOrigin
    );
  }

  return jsonResponse(
    200,
    {
      allowed: true,
      expiresAt: Number(verified.payload.exp) * 1000,
    },
    corsOrigin
  );
};

export default handler;
