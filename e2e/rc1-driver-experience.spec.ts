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
    test(`${carrier} shell renders Home empty state`, async ({ page }) => {
      await gotoAuthed(page, '/home', driverSession(carrier));
      await expect(page.getByRole('heading', { name: 'Your work' })).toBeVisible();
      await expect(
        page.getByText(carrier === 'GLX' ? 'Greenleaf Xpress' : 'BST Expedite Inc').first()
      ).toBeVisible();
      await expect(page.getByRole('heading', { name: 'No current trip available' })).toBeVisible();
      await expect(page.getByText('48291')).toHaveCount(0);
      await expect(page.getByText('Dallas')).toHaveCount(0);
      await expect(page.getByRole('navigation', { name: 'Primary' }).first()).toBeVisible();
    });
  }

  test('login page is reachable and routes unauthenticated home to login', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('textbox').first()).toBeVisible();
  });

  test('logout clears session and returns to login', async ({ page }) => {
    await gotoAuthed(page, '/home', driverSession('GLX'));
    await page.getByRole('button', { name: /Sign out|Logout/i }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: /Logout|Sign out/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('RC1 production routes', () => {
  const routes = [
    { path: '/home', heading: /Your work|No current trip|Next step/i },
    { path: '/today', heading: /Your work|No current trip|Next step/i },
    { path: '/trips', heading: /Your trips|No live trip list/i },
    { path: '/loads', heading: /Your trips|No live trip list/i },
    { path: '/capture', heading: /What are you submitting/i },
    { path: '/workspace', heading: /What are you submitting/i },
    { path: '/pay', heading: /Your pay|Settlement not connected|NOT CONNECTED TO PRODUCTION/i },
    { path: '/more', heading: /Account & tools/i },
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
    await expect(page.getByText('NOT CONNECTED TO PRODUCTION').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Settlement not connected' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Settlement layout' })).toHaveCount(0);
    await expect(page.locator('dt', { hasText: 'Gross' })).toHaveCount(0);
  });

  test('BOL/POD workflow navigates without submission', async ({ page }) => {
    await gotoAuthed(page, '/capture', driverSession('GLX'));
    await page.getByRole('button', { name: /Trip paperwork|Upload BOL/i }).first().click();
    await expect(page).toHaveURL(/\/submissions\/bol-pod/);
    await expect(page.getByText(/Admin Upload Mode/i)).toHaveCount(0);
  });

  test('expense workflow navigates without submission', async ({ page }) => {
    await gotoAuthed(page, '/capture', driverSession('BST'));
    await page.getByRole('button', { name: /Receipt|Add receipt/i }).first().click();
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
    await gotoAuthed(page, '/showcase/home', driverSession('GLX'));
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
    await page.goto('/showcase/home');
    await expect(page.getByText(/Access denied|Showcase Mode unavailable/i).first()).toBeVisible();
  });

  test('production home never shows showcase fixtures', async ({ page }) => {
    await gotoAuthed(page, '/home', driverSession('BST'));
    await expect(page.getByText('DEMONSTRATION DATA')).toHaveCount(0);
    await expect(page.getByText('BST-48291')).toHaveCount(0);
    await expect(page.getByText('GLX-7721')).toHaveCount(0);
  });
});
