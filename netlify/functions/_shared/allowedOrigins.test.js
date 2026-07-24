import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isOriginAllowed,
  parseAllowedOrigins,
  resolveCorsOrigin,
} from './allowedOrigins.js';

const PRODUCTION_ORIGINS = parseAllowedOrigins(
  'https://elmconnect.netlify.app,https://app.example.com'
);

describe('parseAllowedOrigins', () => {
  it('splits and trims comma-separated origins', () => {
    assert.deepEqual(parseAllowedOrigins(' https://a.com ,https://b.com '), [
      'https://a.com',
      'https://b.com',
    ]);
  });

  it('returns empty list for missing env', () => {
    assert.deepEqual(parseAllowedOrigins(undefined), []);
    assert.deepEqual(parseAllowedOrigins(''), []);
  });
});

describe('isOriginAllowed', () => {
  it('allows approved production origin', () => {
    assert.equal(
      isOriginAllowed('https://elmconnect.netlify.app', PRODUCTION_ORIGINS),
      true
    );
    assert.equal(
      isOriginAllowed('https://app.example.com', PRODUCTION_ORIGINS),
      true
    );
  });

  it('allows approved elmconnect deploy-preview origin', () => {
    assert.equal(
      isOriginAllowed(
        'https://deploy-preview-4--elmconnect.netlify.app',
        PRODUCTION_ORIGINS
      ),
      true
    );
    assert.equal(
      isOriginAllowed(
        'https://deploy-preview-99--elmconnect.netlify.app',
        []
      ),
      true
    );
  });

  it('rejects malicious lookalike origins', () => {
    const lookalikes = [
      'https://deploy-preview-4--elmconnect.netlify.app.evil.com',
      'https://deploy-preview-4--elmconnect.evil.netlify.app',
      'https://evil-deploy-preview-4--elmconnect.netlify.app',
      'https://deploy-preview-4--elmconnect.netlify.app.attacker.io',
      'https://deploy-preview-4--elmconnectx.netlify.app',
      'http://deploy-preview-4--elmconnect.netlify.app',
      'https://deploy-preview-4--elmconnect.netlify.app/',
      'https://user@deploy-preview-4--elmconnect.netlify.app',
    ];
    for (const origin of lookalikes) {
      assert.equal(
        isOriginAllowed(origin, PRODUCTION_ORIGINS),
        false,
        `should reject ${origin}`
      );
    }
  });

  it('rejects unrelated Netlify site deploy previews', () => {
    assert.equal(
      isOriginAllowed(
        'https://deploy-preview-4--other-site.netlify.app',
        PRODUCTION_ORIGINS
      ),
      false
    );
    assert.equal(
      isOriginAllowed(
        'https://deploy-preview-4--elm-connect.netlify.app',
        PRODUCTION_ORIGINS
      ),
      false
    );
  });

  it('rejects missing or malformed origin', () => {
    const bad = [
      null,
      undefined,
      '',
      '   ',
      'elmconnect.netlify.app',
      'ftp://deploy-preview-4--elmconnect.netlify.app',
      'https://',
      'not a url',
      'https://elmconnect.netlify.app/path',
      'https://elmconnect.netlify.app?x=1',
    ];
    for (const origin of bad) {
      assert.equal(
        isOriginAllowed(origin, PRODUCTION_ORIGINS),
        false,
        `should reject ${String(origin)}`
      );
    }
  });
});

describe('resolveCorsOrigin', () => {
  it('reflects allowed origins and returns null otherwise', () => {
    assert.equal(
      resolveCorsOrigin('https://elmconnect.netlify.app', PRODUCTION_ORIGINS),
      'https://elmconnect.netlify.app'
    );
    assert.equal(
      resolveCorsOrigin(
        'https://deploy-preview-4--elmconnect.netlify.app',
        PRODUCTION_ORIGINS
      ),
      'https://deploy-preview-4--elmconnect.netlify.app'
    );
    assert.equal(
      resolveCorsOrigin('https://evil.example', PRODUCTION_ORIGINS),
      null
    );
  });
});
