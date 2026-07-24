import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveBrandTheme, resolveAuthoritativeCarrier } from '../utils/carrierBrand.ts';
import {
  formatLastLogin,
  readPreviousLoginIso,
  recordSuccessfulLogin,
} from '../utils/lastLogin.ts';
import type { DriverSessionProfile } from '../utils/driverSession.ts';

function session(
  partial: Partial<DriverSessionProfile> & Pick<DriverSessionProfile, 'companyCode'>
): DriverSessionProfile {
  return {
    authRole: 'driver',
    driverId: 'D-1',
    driverName: 'Test Driver',
    maskedEmail: 't***@example.com',
    uploaderAllowed: true,
    active: true,
    canSelectAnyDriver: false,
    ...partial,
  };
}

describe('carrier brand resolution', () => {
  it('maps single BST assignment to bst theme', () => {
    assert.equal(resolveBrandTheme(session({ companyCode: 'BST' })), 'bst');
    assert.equal(resolveAuthoritativeCarrier(session({ companyCode: 'BST' })), 'BST');
  });

  it('maps single GLX assignment to glx theme', () => {
    assert.equal(resolveBrandTheme(session({ companyCode: 'GLX' })), 'glx');
    assert.equal(resolveAuthoritativeCarrier(session({ companyCode: 'GLX' })), 'GLX');
  });

  it('falls back to elm when carrier is missing or unknown', () => {
    assert.equal(resolveBrandTheme(session({ companyCode: '' })), 'elm');
    assert.equal(resolveBrandTheme(session({ companyCode: 'UNKNOWN' })), 'elm');
    assert.equal(resolveBrandTheme(null), 'elm');
  });
});

describe('last login helpers', () => {
  it('formats timestamps and records previous values', () => {
    const formatted = formatLastLogin('2026-07-23T22:24:03.000Z', 'UTC');
    assert.match(formatted, /7\/23\/2026/);
    assert.match(formatted, /10:24:03/);

    // jsdom-less: simulate storage with a memory stub when localStorage missing
    const mem = new Map<string, string>();
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => mem.get(k) ?? null,
        setItem: (k: string, v: string) => mem.set(k, v),
        removeItem: (k: string) => mem.delete(k),
      },
    });

    try {
      const first = recordSuccessfulLogin('driver-a', new Date('2026-07-22T12:00:00.000Z'));
      assert.equal(first, null);
      assert.ok(readPreviousLoginIso('driver-a'));
      const second = recordSuccessfulLogin('driver-a', new Date('2026-07-23T22:24:03.000Z'));
      assert.equal(second, '2026-07-22T12:00:00.000Z');
    } finally {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: original,
      });
    }
  });
});
