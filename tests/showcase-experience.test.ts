import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createShowcaseDriverDataSource } from '../services/dataSource/ShowcaseDriverDataSource.ts';
import { createShowcaseDriverActionPort } from '../services/dataSource/ShowcaseDriverActionPort.ts';
import { createProductionDriverDataSource } from '../services/dataSource/ProductionDriverDataSource.ts';
import { SHOWCASE_NOW_ISO } from '../fixtures/showcase/clock.ts';
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

describe('showcase fixture coherence', () => {
  it('keeps GLX load, truck, and pay identifiers consistent', () => {
    const ds = createShowcaseDriverDataSource({
      carrierId: 'GLX',
      personaRole: 'driver',
      scenarioId: 'urgent_pod',
    });
    const haul = ds.getMissionControl().activeHaul;
    const loads = ds.getLoads();
    const truck = ds.getTruckStatus();
    const pay = ds.getPaySummary();

    assert.equal(haul?.loadNum, 'GLX-7721');
    assert.ok(loads.some((l) => l.loadNum === 'GLX-7721' && l.bucket === 'current'));
    assert.ok(loads.some((l) => l.bucket === 'upcoming'));
    assert.ok(loads.some((l) => l.bucket === 'completed'));
    assert.equal(truck.truckNumber.startsWith('GLX'), true);
    assert.equal(truck.carrierId, 'GLX');
    assert.ok(pay.lineItems && pay.lineItems.length > 0);
    assert.ok(pay.timelineSteps && pay.timelineSteps.length > 0);
    assert.equal(JSON.stringify(loads).includes('BST-48291'), false);
  });

  it('keeps BST fixtures isolated from GLX', () => {
    const ds = createShowcaseDriverDataSource({
      carrierId: 'BST',
      personaRole: 'driver',
      scenarioId: 'normal',
    });
    const blob = JSON.stringify({
      loads: ds.getLoads(),
      truck: ds.getTruckStatus(),
      messages: ds.getMessages(),
      notifications: ds.getNotifications?.(),
    });
    assert.ok(blob.includes('BST-48291'));
    assert.equal(blob.includes('GLX-7721'), false);
    assert.equal(blob.includes('Columbus'), false);
  });

  it('provides notifications, search index, and more menu in showcase', () => {
    const ds = createShowcaseDriverDataSource({
      carrierId: 'GLX',
      personaRole: 'driver',
      scenarioId: 'normal',
    });
    assert.ok((ds.getNotifications?.() || []).length > 0);
    assert.ok((ds.getSearchIndex?.() || []).length > 0);
    assert.ok((ds.getMoreMenu?.() || []).length > 0);
    const moreBlob = JSON.stringify(ds.getMoreMenu?.());
    assert.equal(/enter showcase|showcase mode/i.test(moreBlob), false);
  });

  it('expands capture modules beyond BOL and receipts', () => {
    const ds = createShowcaseDriverDataSource({
      carrierId: 'GLX',
      personaRole: 'driver',
      scenarioId: 'urgent_pod',
    });
    const mods = ds.getCaptureModules();
    assert.ok(mods.length >= 6);
    assert.ok(mods.some((m) => /BOL|POD/i.test(m.title)));
    assert.ok(mods.some((m) => /Freight|photo/i.test(m.title)));
    assert.ok(mods.some((m) => /Inspection/i.test(m.title)));
  });

  it('uses deterministic showcase clock', () => {
    assert.equal(SHOWCASE_NOW_ISO.startsWith('2026-07-22'), true);
  });
});

describe('showcase write isolation', () => {
  it('simulated actions never claim production writes', async () => {
    const actions = createShowcaseDriverActionPort();
    const results = await Promise.all([
      actions.submitPodSimulated!(),
      actions.submitReceiptSimulated!(),
      actions.reportPayQuestion!(),
      actions.markNotificationRead!('n1'),
      actions.askAssistant!('What do I need to do next?'),
    ]);
    for (const r of results) {
      assert.ok(r.disclosure);
      assert.equal(/production upload|sheets|drive folder/i.test(r.message), false);
      assert.match(r.message, /demo|simulated|showcase|demonstration/i);
    }
  });

  it('production data source stays empty for new surfaces', () => {
    const prod = createProductionDriverDataSource(session({ companyCode: 'GLX' }));
    assert.equal(prod.getNotifications?.().length, 0);
    assert.equal(prod.getSearchIndex?.().length, 0);
    assert.equal(prod.getMoreMenu?.().length, 0);
    assert.equal(prod.getPaySummary().disclosure, 'NOT CONNECTED TO PRODUCTION');
  });
});
