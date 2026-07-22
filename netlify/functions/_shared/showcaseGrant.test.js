import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import {
  mintShowcaseGrant,
  verifyShowcaseGrant,
  getShowcasePayloadRejection,
  adminKeyFromEmail,
} from './showcaseGrant.js';

describe('showcaseGrant', () => {
  const prev = process.env.SHOWCASE_GRANT_SECRET;

  before(() => {
    process.env.SHOWCASE_GRANT_SECRET = 'test-showcase-secret-do-not-use-in-prod';
  });

  after(() => {
    if (prev === undefined) delete process.env.SHOWCASE_GRANT_SECRET;
    else process.env.SHOWCASE_GRANT_SECRET = prev;
  });

  it('mints and verifies an admin grant', () => {
    const minted = mintShowcaseGrant({
      adminKey: adminKeyFromEmail('admin@example.com'),
      authRole: 'admin',
      canSelectAnyDriver: true,
    });
    assert.ok(minted);
    assert.ok(minted.grant.includes('.'));
    const verified = verifyShowcaseGrant(minted.grant);
    assert.equal(verified.ok, true);
  });

  it('refuses driver claims', () => {
    const minted = mintShowcaseGrant({
      adminKey: adminKeyFromEmail('driver@example.com'),
      authRole: 'driver',
      canSelectAnyDriver: false,
    });
    assert.equal(minted, null);
  });

  it('rejects tampered grants', () => {
    const minted = mintShowcaseGrant({
      adminKey: 'abc',
      authRole: 'admin',
      canSelectAnyDriver: true,
    });
    assert.ok(minted);
    const verified = verifyShowcaseGrant(minted.grant + 'x');
    assert.equal(verified.ok, false);
  });

  it('rejects showcase-marked upload payloads', () => {
    assert.ok(getShowcasePayloadRejection({ showcase: true }));
    assert.ok(getShowcasePayloadRejection({ demo: true }));
    assert.ok(getShowcasePayloadRejection({ mode: 'SHOWCASE' }));
    assert.equal(getShowcasePayloadRejection({ company: 'BST' }), null);
  });
});
