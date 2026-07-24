/**
 * Origin allowlist for Netlify Functions (login + upload gateways).
 *
 * Rules (strict):
 * 1. Exact match against comma-separated ALLOWED_ORIGINS (production / custom domains).
 * 2. Additionally allow only this Netlify Deploy Preview host pattern for the
 *    approved elmconnect site (HTTPS only, no path/query, no lookalikes):
 *    https://deploy-preview-<digits>--elmconnect.netlify.app
 *
 * Never use a universal wildcard. Never allow arbitrary *.netlify.app hosts.
 */

/** Approved elmconnect Deploy Preview origins only (PR previews for this site). */
const ELMCONNECT_DEPLOY_PREVIEW_ORIGIN =
  /^https:\/\/deploy-preview-\d+--elmconnect\.netlify\.app$/;

/**
 * @param {string | undefined | null} envValue
 * @returns {string[]}
 */
export function parseAllowedOrigins(envValue) {
  return String(envValue || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * True when value is a pure browser-style Origin (scheme://host[:port] only).
 * @param {unknown} requestOrigin
 * @returns {boolean}
 */
function isWellFormedOrigin(requestOrigin) {
  if (typeof requestOrigin !== 'string' || !requestOrigin.trim()) {
    return false;
  }
  if (/\s/.test(requestOrigin)) {
    return false;
  }
  try {
    const url = new URL(requestOrigin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    // Reject path/query/hash/userinfo and trailing-slash variants.
    return requestOrigin === url.origin;
  } catch {
    return false;
  }
}

/**
 * @param {unknown} requestOrigin
 * @param {string[]} allowedOrigins
 * @returns {boolean}
 */
export function isOriginAllowed(requestOrigin, allowedOrigins) {
  if (!isWellFormedOrigin(requestOrigin)) {
    return false;
  }
  const origin = /** @type {string} */ (requestOrigin);

  if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
    return true;
  }

  if (ELMCONNECT_DEPLOY_PREVIEW_ORIGIN.test(origin)) {
    return true;
  }

  return false;
}

/**
 * Echo the request Origin only when allowed (CORS reflect).
 * @param {unknown} requestOrigin
 * @param {string[]} allowedOrigins
 * @returns {string | null}
 */
export function resolveCorsOrigin(requestOrigin, allowedOrigins) {
  if (isOriginAllowed(requestOrigin, allowedOrigins)) {
    return /** @type {string} */ (requestOrigin);
  }
  return null;
}
