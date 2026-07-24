/**
 * Short-lived HMAC Showcase grants for verified bridge/platform admins.
 * Secret: SHOWCASE_GRANT_SECRET (never UPLOAD_TOKEN; never sent to client as raw secret).
 */
import crypto from 'node:crypto';

export const SHOWCASE_GRANT_TTL_SEC = 60 * 60; // 1 hour
export const SHOWCASE_GRANT_VERSION = 1;

function getSecret() {
  return String(process.env.SHOWCASE_GRANT_SECRET || '').trim();
}

function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function b64urlJson(obj) {
  return b64url(JSON.stringify(obj));
}

function fromB64url(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64').toString('utf8');
}

function sign(payloadB64) {
  const secret = getSecret();
  if (!secret) return null;
  return crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

/**
 * @param {{ adminKey: string, authRole: string, canSelectAnyDriver: boolean }} claims
 * @returns {{ grant: string, expiresAt: number } | null}
 */
export function mintShowcaseGrant(claims) {
  const secret = getSecret();
  if (!secret) return null;
  if (claims.authRole !== 'admin' || !claims.canSelectAnyDriver) return null;
  if (!claims.adminKey) return null;

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    v: SHOWCASE_GRANT_VERSION,
    sub: String(claims.adminKey),
    role: 'admin',
    csa: true,
    iat: now,
    exp: now + SHOWCASE_GRANT_TTL_SEC,
  };
  const payloadB64 = b64urlJson(payload);
  const sig = sign(payloadB64);
  if (!sig) return null;
  return { grant: `${payloadB64}.${sig}`, expiresAt: payload.exp * 1000 };
}

/**
 * @param {string | undefined | null} grant
 * @returns {{ ok: true, payload: object } | { ok: false, error: string }}
 */
export function verifyShowcaseGrant(grant) {
  const secret = getSecret();
  if (!secret) {
    return { ok: false, error: 'Showcase grant secret not configured' };
  }
  const raw = String(grant || '').trim();
  const parts = raw.split('.');
  if (parts.length !== 2) {
    return { ok: false, error: 'Malformed grant' };
  }
  const [payloadB64, sig] = parts;
  const expected = sign(payloadB64);
  if (!expected || sig !== expected) {
    return { ok: false, error: 'Invalid grant signature' };
  }
  let payload;
  try {
    payload = JSON.parse(fromB64url(payloadB64));
  } catch {
    return { ok: false, error: 'Invalid grant payload' };
  }
  if (payload.v !== SHOWCASE_GRANT_VERSION) {
    return { ok: false, error: 'Unsupported grant version' };
  }
  if (payload.role !== 'admin' || payload.csa !== true) {
    return { ok: false, error: 'Grant not authorized for Showcase' };
  }
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || now >= Number(payload.exp)) {
    return { ok: false, error: 'Grant expired' };
  }
  if (!payload.sub) {
    return { ok: false, error: 'Grant missing subject' };
  }
  return { ok: true, payload };
}

/**
 * Reject production uploads that are explicitly marked as demo/showcase.
 * @param {unknown} body
 * @returns {string | null} error message if rejected
 */
export function getShowcasePayloadRejection(body) {
  if (!body || typeof body !== 'object') return null;
  const data = /** @type {Record<string, unknown>} */ (body);
  const mode = String(data.mode || data.experienceMode || '').trim().toUpperCase();
  if (mode === 'SHOWCASE' || mode === 'DEMO') {
    return 'Showcase and demo payloads are not accepted by the production upload gateway.';
  }
  if (data.showcase === true || data.demo === true || data.isShowcase === true) {
    return 'Showcase and demo payloads are not accepted by the production upload gateway.';
  }
  const source = String(data.source || data.clientSource || '').trim().toLowerCase();
  if (source === 'showcase' || source === 'demo') {
    return 'Showcase and demo payloads are not accepted by the production upload gateway.';
  }
  return null;
}

/**
 * Stable non-PII admin key for grant subject (hash of normalized email).
 * @param {string} email
 */
export function adminKeyFromEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 32);
}
