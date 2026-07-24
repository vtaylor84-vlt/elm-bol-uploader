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
        page
          .locator('.mc-shell-header-context, .mc-section-copy')
          .filter({ hasText: carrier === 'GLX' ? 'Greenleaf Xpress' : 'BST Expedite Inc' })
          .first()
      ).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Assigned trips' })).toBeVisible();
      await expect(page.getByText(/Assigned trip details will appear here/i).first()).toBeVisible();
      await expect(page.getByText('Needs attention')).toHaveCount(0);
      await expect(page.getByText(/Trip paperwork/i)).toHaveCount(0);
      await expect(page.getByText('Open Capture')).toHaveCount(0);
      await expect(page.getByRole('button', { name: /Upload BOL \/ POD/i }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /Submit Trip Form/i }).first()).toBeVisible();
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
    await expect(page.getByRole('link', { name: 'Help and account' })).toHaveCount(0);
    const headerSignOut = page.locator('.mc-shell-header-logout');
    await expect(headerSignOut).toBeVisible();
    await expect(headerSignOut).toHaveAttribute('aria-label', 'Sign out');
    await headerSignOut.click();
    await page.getByRole('dialog').getByRole('button', { name: /Logout|Sign out/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login/);
  });

  test('header Sign out is visible across key widths', async ({ page }) => {
    await gotoAuthed(page, '/home', driverSession('BST'));
    for (const width of [390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      const headerSignOut = page.locator('.mc-shell-header-logout');
      await expect(headerSignOut).toBeVisible();
      await expect(headerSignOut).toHaveAttribute('aria-label', 'Sign out');
      await expect(page.getByRole('link', { name: 'Help and account' })).toHaveCount(0);
      const box = await headerSignOut.boundingBox();
      expect(box && box.height >= 44).toBeTruthy();
    }
  });
});

test.describe('RC1 production routes', () => {
  const routes = [
    { path: '/home', heading: /Your work|Assigned trips|What do you need to do/i },
    { path: '/today', heading: /Your work|Assigned trips|What do you need to do/i },
    { path: '/trips', heading: /Your trips|Assigned trips/i },
    { path: '/loads', heading: /Your trips|Assigned trips/i },
    { path: '/capture', heading: /What do you need to send/i },
    { path: '/workspace', heading: /What do you need to send/i },
    { path: '/pay', heading: /Your pay|Earnings|Submit Trip Form/i },
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
    await expect(page.getByRole('button', { name: /Submit Trip Form/i }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Earnings' })).toBeVisible();
    await expect(page.getByText('Not available yet').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Settlement layout' })).toHaveCount(0);
    await expect(page.locator('dt', { hasText: 'Gross' })).toHaveCount(0);
  });

  test('BOL/POD workflow navigates without submission', async ({ page }) => {
    await gotoAuthed(page, '/capture', driverSession('GLX'));
    await page.getByRole('button', { name: /Upload BOL \/ POD/i }).first().click();
    await expect(page).toHaveURL(/\/submissions\/bol-pod/);
    await expect(page.getByText(/Admin Upload Mode/i)).toHaveCount(0);
  });

  test('expense workflow is Coming soon in Production', async ({ page }) => {
    await gotoAuthed(page, '/capture', driverSession('BST'));
    const receipt = page.locator('[data-submit-future="receipt"]');
    await expect(receipt).toBeVisible();
    await expect(receipt).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByRole('button', { name: /Add receipt/i })).toHaveCount(0);
    await expect(page).toHaveURL(/\/capture/);
    await expect(page.getByText(/Coming soon/i).first()).toBeVisible();
  });

  test('Submit page shows equal live cards and separated coming soon', async ({ page }) => {
    await gotoAuthed(page, '/capture', driverSession('GLX'));
    await expect(page.getByRole('heading', { name: 'Available now' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'More submissions' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /What do you need to send/i })).toBeVisible();
    await expect(page.getByText('Documents', { exact: true })).toHaveCount(0);

    const bol = page.locator('[data-submit-action="bol-pod"]');
    const form = page.locator('[data-submit-action="trip-form"]');
    await expect(bol).toBeVisible();
    await expect(form).toBeVisible();
    await expect(bol).not.toHaveClass(/is-selected|is-active/);
    await expect(form).not.toHaveClass(/is-selected|is-active/);

    const bolBox = await bol.boundingBox();
    const formBox = await form.boundingBox();
    expect(bolBox && formBox).toBeTruthy();
    if (bolBox && formBox) {
      expect(Math.abs(bolBox.height - formBox.height)).toBeLessThan(48);
    }

    await expect(bol.locator('svg').first()).toBeVisible();
    await expect(form.locator('[class*="ArrowTopRight"], svg').first()).toBeVisible();
    // Trip form must not use a camera icon path
    const formHtml = await form.innerHTML();
    expect(formHtml.toLowerCase()).not.toContain('camera');

    await expect(page.locator('[data-submit-future="receipt"]')).toBeVisible();
    await expect(page.locator('[data-submit-future="freight"]')).toBeVisible();
    await expect(page.locator('[data-submit-future="vehicle"]')).toBeVisible();
    await expect(page.locator('[data-submit-future="incident"]')).toBeVisible();
    await expect(page.locator('.mc-capture-choice-cam')).toHaveCount(0);

    const safety = page.getByText('Only upload documents when safely stopped.');
    await expect(safety).toHaveCount(1);

    await expect(page.getByRole('navigation', { name: 'Primary' }).getByText('Submit')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Primary' }).getByText('Capture')).toHaveCount(0);
  });

  test('receipt deep link stays unavailable', async ({ page }) => {
    await gotoAuthed(page, '/submissions/receipt', driverSession('GLX'));
    await expect(
      page.getByRole('heading', { name: 'Receipt', exact: true })
    ).toBeVisible();
    await expect(page.getByText(/Coming soon/i).first()).toBeVisible();
    await expect(
      page.getByText(/Receipt submission is being connected and is not available yet/i).first()
    ).toBeVisible();
  });

  test('Home shows dual live actions without Needs Attention or Trip paperwork', async ({ page }) => {
    await gotoAuthed(page, '/home', driverSession('BST'));
    await expect(page.getByText('Not available yet').first()).toBeVisible();
    await expect(page.getByText(/LAST LOGIN|Last login/i).first()).toBeVisible();
    await expect(page.getByText('Needs attention')).toHaveCount(0);
    await expect(page.getByText(/Trip paperwork/i)).toHaveCount(0);
    await expect(page.getByText(/Submit trip for payroll/i)).toHaveCount(0);
    await expect(page.getByText('Open Capture')).toHaveCount(0);
    const bol = page.getByRole('button', { name: /Upload BOL \/ POD/i }).first();
    const form = page.getByRole('button', { name: /Submit Trip Form/i }).first();
    await expect(bol).toBeVisible();
    await expect(form).toBeVisible();
    const bolBox = await bol.boundingBox();
    const formBox = await form.boundingBox();
    expect(bolBox && formBox).toBeTruthy();
    if (bolBox && formBox) {
      expect(Math.abs(bolBox.height - formBox.height)).toBeLessThan(40);
    }
  });

  test('GLX carrier theme attribute is applied', async ({ page }) => {
    await gotoAuthed(page, '/home', driverSession('GLX'));
    await expect(page.locator('html')).toHaveAttribute('data-carrier-theme', 'glx');
    await expect(page.getByRole('img', { name: /Greenleaf Xpress/i }).first()).toBeVisible();
  });

  test('BST carrier theme attribute is applied', async ({ page }) => {
    await gotoAuthed(page, '/home', driverSession('BST'));
    await expect(page.locator('html')).toHaveAttribute('data-carrier-theme', 'bst');
    await expect(page.getByRole('img', { name: /BST Expedite/i }).first()).toBeVisible();
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
