import { expect, test } from '@playwright/test';
import {
  adminSession,
  driverSession,
  gotoAuthed,
  seedAuthenticatedSession,
  seedExpiredShowcaseGrant,
} from './helpers/session';

test.describe('RC1 authenticated shells', () => {
  for (const carrier of ['GLX', 'BST'] as const) {
    test(`${carrier} shell renders Mission Control empty state`, async ({ page }) => {
      await gotoAuthed(page, '/today', driverSession(carrier));
      await expect(page.getByRole('heading', { name: 'What needs attention' })).toBeVisible();
      await expect(
        page.getByText(carrier === 'GLX' ? 'Greenleaf Xpress' : 'BST Expedite Inc').first()
      ).toBeVisible();
      await expect(page.getByRole('heading', { name: 'No current load available' })).toBeVisible();
      await expect(page.getByText('48291')).toHaveCount(0);
      await expect(page.getByText('Dallas')).toHaveCount(0);
      await expect(page.getByRole('navigation', { name: 'Primary' }).first()).toBeVisible();
    });
  }

  test('login page is reachable and routes unauthenticated home to login', async ({ page }) => {
    await page.goto('/today');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('textbox').first()).toBeVisible();
  });

  test('logout clears session and returns to login', async ({ page }) => {
    await gotoAuthed(page, '/today', driverSession('GLX'));
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/today');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('RC1 production routes', () => {
  const routes = [
    { path: '/today', heading: /What needs attention|No current load/i },
    { path: '/loads', heading: /Active & history|No live load list/i },
    { path: '/capture', heading: /Document capture/i },
    { path: '/workspace', heading: /Document capture/i },
    { path: '/pay', heading: /Settlement|NOT CONNECTED TO PRODUCTION/i },
    { path: '/more', heading: /Account & support/i },
  ] as const;

  for (const route of routes) {
    test(`direct refresh works for ${route.path}`, async ({ page }) => {
      await gotoAuthed(page, route.path, driverSession('GLX'));
      await expect(page.getByText(route.heading).first()).toBeVisible();
      await page.reload();
      await expect(page.getByText(route.heading).first()).toBeVisible();
    });
  }

  test('pay isolation shows disconnected disclosure', async ({ page }) => {
    await gotoAuthed(page, '/pay', driverSession('BST'));
    await expect(page.getByText('NOT CONNECTED TO PRODUCTION')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Settlement not connected' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Settlement layout' })).toHaveCount(0);
    await expect(page.locator('dt', { hasText: 'Gross' })).toHaveCount(0);
  });

  test('BOL/POD workflow navigates without submission', async ({ page }) => {
    await gotoAuthed(page, '/capture', driverSession('GLX'));
    await page.getByRole('button', { name: /BOL|POD/i }).first().click();
    await expect(page).toHaveURL(/\/submissions\/bol-pod/);
    await expect(page.getByText(/Admin Upload Mode/i)).toHaveCount(0);
  });

  test('expense workflow navigates without submission', async ({ page }) => {
    await gotoAuthed(page, '/capture', driverSession('BST'));
    await page.getByRole('button', { name: /Expense|Receipt/i }).first().click();
    await expect(page).toHaveURL(/\/submissions\/receipt/);
  });

  test('admin mode shows driver selection chrome on BOL/POD', async ({ page }) => {
    await gotoAuthed(page, '/submissions/bol-pod', adminSession('GLX'));
    await expect(page.getByTitle('Admin upload mode')).toBeVisible();
    await expect(page.getByRole('option', { name: 'Select driver' })).toBeAttached();
  });
});

test.describe('RC1 Showcase isolation', () => {
  test('Showcase denied without authorization', async ({ page }) => {
    await gotoAuthed(page, '/showcase/today', driverSession('GLX'));
    await expect(page.getByText(/Access denied|Showcase Mode unavailable/i).first()).toBeVisible();
    await expect(page.getByText('48291')).toHaveCount(0);
  });

  test('Showcase denied for admin without valid grant', async ({ page }) => {
    await seedAuthenticatedSession(page, adminSession('BST'));
    await seedExpiredShowcaseGrant(page);
    await page.route('**/showcase-access', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          allowed: false,
          error: 'Access denied',
          code: 'SHOWCASE_GRANT_INVALID',
        }),
      });
    });
    await page.goto('/showcase/today');
    await expect(page.getByText(/Access denied|Showcase Mode unavailable/i).first()).toBeVisible();
  });

  test('production today never shows showcase fixtures', async ({ page }) => {
    await gotoAuthed(page, '/today', driverSession('BST'));
    await expect(page.getByText('DEMONSTRATION DATA')).toHaveCount(0);
    await expect(page.getByText('BST-48291')).toHaveCount(0);
    await expect(page.getByText('GLX-7721')).toHaveCount(0);
  });
});
