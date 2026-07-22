import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import {
  clearDriverSession,
  readDriverSession,
  writeDriverSession,
  type DriverSessionProfile,
} from '../utils/driverSession.ts';
import {
  clearShowcaseGrant,
  readShowcaseGrant,
  writeShowcaseGrant,
  isShowcaseGrantPresentAndUnexpired,
} from '../utils/showcaseGrantStorage.ts';

const memory = new Map<string, string>();

function installStorage() {
  const store = {
    getItem: (k: string) => (memory.has(k) ? memory.get(k)! : null),
    setItem: (k: string, v: string) => {
      memory.set(k, String(v));
    },
    removeItem: (k: string) => {
      memory.delete(k);
    },
    clear: () => memory.clear(),
  };
  // @ts-expect-error test shim
  globalThis.sessionStorage = store;
  // @ts-expect-error test shim
  globalThis.localStorage = store;
}

describe('auth and showcase grant cleanup', () => {
  beforeEach(() => {
    memory.clear();
    installStorage();
  });

  afterEach(() => {
    memory.clear();
  });

  it('clears driver session on logout helper path', () => {
    const profile: DriverSessionProfile = {
      authRole: 'driver',
      driverId: 'D-9',
      driverName: 'Logout Test',
      companyCode: 'GLX',
      maskedEmail: 'l***@example.com',
      uploaderAllowed: true,
      active: true,
      canSelectAnyDriver: false,
    };
    writeDriverSession(profile);
    assert.ok(readDriverSession());
    clearDriverSession();
    assert.equal(readDriverSession(), null);
  });

  it('clears showcase grant on logout helper path', () => {
    writeShowcaseGrant('test-grant-token', Date.now() + 60_000);
    assert.equal(isShowcaseGrantPresentAndUnexpired(), true);
    assert.ok(readShowcaseGrant());
    clearShowcaseGrant();
    assert.equal(readShowcaseGrant(), null);
    assert.equal(isShowcaseGrantPresentAndUnexpired(), false);
  });
});
