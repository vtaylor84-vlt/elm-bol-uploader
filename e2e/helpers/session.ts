import type { Page } from '@playwright/test';

export type TestCarrier = 'GLX' | 'BST';

export interface SessionFixture {
  authRole: 'admin' | 'driver';
  driverId: string;
  driverName: string;
  companyCode: TestCarrier;
  maskedEmail: string;
  uploaderAllowed: boolean;
  active: boolean;
  canSelectAnyDriver: boolean;
}

export function driverSession(carrier: TestCarrier): SessionFixture {
  return {
    authRole: 'driver',
    driverId: `${carrier}-D-TEST`,
    driverName: carrier === 'GLX' ? 'GLX Test Driver' : 'BST Test Driver',
    companyCode: carrier,
    maskedEmail: `${carrier.toLowerCase()}***@example.com`,
    uploaderAllowed: true,
    active: true,
    canSelectAnyDriver: false,
  };
}

export function adminSession(carrier: TestCarrier): SessionFixture {
  return {
    ...driverSession(carrier),
    authRole: 'admin',
    driverId: `${carrier}-A-TEST`,
    driverName: carrier === 'GLX' ? 'GLX Test Admin' : 'BST Test Admin',
    canSelectAnyDriver: true,
  };
}

/**
 * Seed roster session once after landing on the app origin.
 * Avoid addInitScript so logout + subsequent navigations are not re-seeded.
 */
export async function seedAuthenticatedSession(page: Page, profile: SessionFixture) {
  await page.goto('/login');
  await page.evaluate((session) => {
    sessionStorage.setItem('elm_driver_session', JSON.stringify(session));
  }, profile);
}

export async function seedExpiredShowcaseGrant(page: Page) {
  await page.evaluate(() => {
    sessionStorage.setItem('elm_showcase_grant', 'invalid.test.grant');
    sessionStorage.setItem('elm_showcase_grant_exp', String(Date.now() - 60_000));
  });
}

/** Seed a non-expired grant token (server validation still mocked separately). */
export async function seedValidShowcaseGrant(page: Page) {
  await page.evaluate(() => {
    sessionStorage.setItem('elm_showcase_grant', 'e2e.valid.showcase.grant');
    sessionStorage.setItem('elm_showcase_grant_exp', String(Date.now() + 60 * 60 * 1000));
  });
}

/** Mock Netlify showcase-access to allow Showcase entry in Playwright. */
export async function mockShowcaseAccessAllowed(page: Page) {
  await page.route('**/showcase-access', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        allowed: true,
        expiresAt: Date.now() + 60 * 60 * 1000,
      }),
    });
  });
}

export async function gotoShowcase(
  page: Page,
  path: string,
  carrier: TestCarrier = 'GLX'
) {
  await seedAuthenticatedSession(page, adminSession(carrier));
  await seedValidShowcaseGrant(page);
  await mockShowcaseAccessAllowed(page);
  await page.goto(path);
}

export async function gotoAuthed(page: Page, path: string, profile: SessionFixture) {
  await seedAuthenticatedSession(page, profile);
  await page.goto(path);
}
