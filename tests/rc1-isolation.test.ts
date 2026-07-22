import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveCarrierId, getCompanyDisplayName } from '../utils/companyMap.ts';
import { getMissionControlViewModel } from '../services/missionControlAdapter.ts';
import { createProductionDriverDataSource } from '../services/dataSource/ProductionDriverDataSource.ts';
import { createShowcaseDriverDataSource } from '../services/dataSource/ShowcaseDriverDataSource.ts';
import { createProductionDriverActionPort } from '../services/dataSource/ProductionDriverActionPort.ts';
import { createShowcaseDriverActionPort } from '../services/dataSource/ShowcaseDriverActionPort.ts';
import { getReleaseIdentity } from '../utils/releaseIdentity.ts';
import type { DriverSessionProfile } from '../utils/driverSession.ts';

function session(partial: Partial<DriverSessionProfile> & Pick<DriverSessionProfile, 'companyCode'>): DriverSessionProfile {
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

describe('resolveCarrierId', () => {
  it('resolves GLX from codes and display names', () => {
    assert.equal(resolveCarrierId('GLX'), 'GLX');
    assert.equal(resolveCarrierId('glx'), 'GLX');
    assert.equal(resolveCarrierId('Greenleaf Xpress'), 'GLX');
  });

  it('resolves BST from codes and display names', () => {
    assert.equal(resolveCarrierId('BST'), 'BST');
    assert.equal(resolveCarrierId('bst'), 'BST');
    assert.equal(resolveCarrierId('BST Expedite Inc'), 'BST');
  });

  it('returns null for unknown or invalid carriers', () => {
    assert.equal(resolveCarrierId(''), null);
    assert.equal(resolveCarrierId(null), null);
    assert.equal(resolveCarrierId('ACME'), null);
    assert.equal(resolveCarrierId('ELM'), null);
  });
});

describe('production mission control empty state', () => {
  it('does not fabricate a production load', () => {
    const model = getMissionControlViewModel(session({ companyCode: 'GLX' }));
    assert.equal(model.activeHaul, null);
    assert.equal(model.exceptions.length, 0);
    assert.equal(model.tasks.length, 0);
    assert.equal(model.dataCapability, 'READY_FOR_INTEGRATION');
    assert.equal(model.primaryAction.capability, 'LIVE');
    const serialized = JSON.stringify(model);
    assert.equal(serialized.includes('48291'), false);
    assert.equal(serialized.includes('Dallas'), false);
    assert.equal(serialized.includes('Atlanta'), false);
  });

  it('keeps company label from active session without inventing haul data', () => {
    const glx = getMissionControlViewModel(session({ companyCode: 'GLX', driverName: 'Avery' }));
    assert.equal(glx.companyLabel, getCompanyDisplayName('GLX'));
    assert.equal(glx.driverDisplayName, 'Avery');
    assert.equal(glx.activeHaul, null);
  });
});

describe('production vs showcase data sources', () => {
  it('production mode never surfaces showcase fixtures', () => {
    const prod = createProductionDriverDataSource(session({ companyCode: 'BST' }));
    assert.equal(prod.mode, 'production');
    assert.equal(prod.getLoads().length, 0);
    assert.equal(prod.getMissionControl().activeHaul, null);
    assert.equal(prod.getPaySummary().disclosure, 'NOT CONNECTED TO PRODUCTION');
    const blob = JSON.stringify({
      mission: prod.getMissionControl(),
      loads: prod.getLoads(),
      truck: prod.getTruckStatus(),
    });
    assert.equal(blob.includes('BST-48291'), false);
    assert.equal(blob.includes('DEMO-LOAD'), false);
    assert.equal(blob.includes('DEMONSTRATION DATA'), false);
  });

  it('showcase mode can use approved fixtures for GLX and BST', () => {
    const glx = createShowcaseDriverDataSource({
      carrierId: 'GLX',
      personaRole: 'driver',
      scenarioId: 'urgent_pod',
    });
    const bst = createShowcaseDriverDataSource({
      carrierId: 'BST',
      personaRole: 'driver',
      scenarioId: 'urgent_pod',
    });
    assert.equal(glx.mode, 'showcase');
    assert.equal(bst.mode, 'showcase');
    assert.ok(glx.getMissionControl().activeHaul);
    assert.ok(bst.getMissionControl().activeHaul);
    assert.equal(glx.getMissionControl().activeHaul?.loadNum.startsWith('GLX'), true);
    assert.equal(bst.getMissionControl().activeHaul?.loadNum.includes('48291'), true);
    assert.equal(glx.getTruckStatus().carrierId, 'GLX');
    assert.equal(bst.getTruckStatus().carrierId, 'BST');
  });
});

describe('production placeholder carrier isolation', () => {
  it('GLX session placeholders never leak BST identity', () => {
    const ds = createProductionDriverDataSource(session({ companyCode: 'GLX' }));
    assert.equal(ds.getTruckStatus().carrierId, 'GLX');
    assert.equal(ds.getSafetyStatus().carrierId, 'GLX');
    assert.equal(ds.getHomeTime().carrierId, 'GLX');
    assert.equal(ds.getPerformance().carrierId, 'GLX');
    assert.notEqual(ds.getTruckStatus().carrierId, 'BST');
  });

  it('BST session placeholders stay BST', () => {
    const ds = createProductionDriverDataSource(session({ companyCode: 'BST' }));
    assert.equal(ds.getTruckStatus().carrierId, 'BST');
    assert.equal(ds.getSafetyStatus().carrierId, 'BST');
  });

  it('unknown company stays carrier-neutral', () => {
    const ds = createProductionDriverDataSource(session({ companyCode: 'UNKNOWN' }));
    assert.equal(ds.getTruckStatus().carrierId, undefined);
    assert.equal(ds.getSafetyStatus().carrierId, undefined);
    assert.equal(ds.getHomeTime().carrierId, undefined);
    assert.equal(ds.getPerformance().carrierId, undefined);
  });
});

describe('action ports and pay isolation', () => {
  it('production action port has no simulated write helpers', () => {
    const port = createProductionDriverActionPort();
    assert.equal(port.mode, 'production');
    assert.equal(port.submitPodSimulated, undefined);
    assert.equal(port.submitReceiptSimulated, undefined);
  });

  it('showcase action port is simulation-only', async () => {
    const port = createShowcaseDriverActionPort();
    assert.equal(port.mode, 'showcase');
    const result = await port.submitPodSimulated!();
    assert.equal(result.disclosure, 'SIMULATED ACTION');
    assert.equal(result.success, true);
  });

  it('production pay remains disconnected', () => {
    const pay = createProductionDriverDataSource(session({ companyCode: 'GLX' })).getPaySummary();
    assert.equal(pay.disclosure, 'NOT CONNECTED TO PRODUCTION');
    assert.equal(pay.grossLabel, '—');
    assert.equal(pay.netLabel, '—');
  });
});

describe('release identity', () => {
  it('uses safe fallbacks when metadata is missing', () => {
    const identity = getReleaseIdentity({});
    assert.equal(identity.shortSha, 'local');
    assert.equal(identity.environment, 'unknown');
    assert.equal(identity.buildTimestamp, 'unknown');
    assert.ok(identity.appVersion);
    assert.ok(identity.displayLabel.includes('local'));
  });

  it('normalizes netlify-style env labels and short SHAs', () => {
    const identity = getReleaseIdentity({
      VITE_RELEASE_SHA: '53691102b1bc32d3104bd7235c93eeccf147fae3',
      VITE_RELEASE_BUILD_TIME: '2026-07-22T07:00:00.000Z',
      VITE_RELEASE_ENV: 'deploy-preview',
      VITE_APP_VERSION: '1.0.0',
    });
    assert.equal(identity.shortSha, '5369110');
    assert.equal(identity.environment, 'deploy-preview');
    assert.equal(identity.buildTimestamp, '2026-07-22T07:00:00.000Z');
    assert.equal(identity.appVersion, '1.0.0');
  });
});
