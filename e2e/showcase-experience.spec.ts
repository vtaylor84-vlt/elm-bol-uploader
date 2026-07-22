import { expect, test } from '@playwright/test';
import { driverSession, gotoAuthed, gotoShowcase } from './helpers/session';

test.describe('Showcase experience workflows', () => {
  test('Today shows demonstration banner and current load', async ({ page }) => {
    await gotoShowcase(page, '/showcase/today', 'GLX');
    await expect(
      page.getByText(/Showcase Mode — Demonstration data only/i).first()
    ).toBeVisible();
    await expect(page.getByText('GLX-7721').first()).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Primary' }).first()).toBeVisible();
  });

  test('Loads filters and detail work', async ({ page }) => {
    await gotoShowcase(page, '/showcase/loads', 'GLX');
    await expect(page.getByRole('heading', { name: /Active & history/i })).toBeVisible();
    await expect(page.getByText('GLX-7721').first()).toBeVisible();
    const upcoming = page.getByRole('tab', { name: /Upcoming/i });
    if (await upcoming.count()) {
      await upcoming.first().click();
    }
    const completed = page.getByRole('tab', { name: /Completed/i });
    if (await completed.count()) {
      await completed.first().click();
    }
  });

  test('Capture modules prioritize required work', async ({ page }) => {
    await gotoShowcase(page, '/showcase/capture', 'BST');
    await expect(page.getByRole('heading', { name: /Document capture/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Requires your attention/i)).toBeVisible();
    await expect(page.getByText(/Freight photos|Inspection evidence|Receipts/i).first()).toBeVisible();
  });

  test('Pay demonstration shows settlement lines without production claims', async ({ page }) => {
    await gotoShowcase(page, '/showcase/pay', 'GLX');
    await expect(page.getByRole('heading', { name: 'Settlement', exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Showcase settlement preview/i)).toBeVisible();
    await expect(page.getByText(/\$4,820/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Report a pay question/i })).toBeVisible();
  });

  test('Messages equipment safety screens render', async ({ page }) => {
    await gotoShowcase(page, '/showcase/messages', 'GLX');
    await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible();

    await gotoShowcase(page, '/showcase/equipment', 'GLX');
    await expect(page.getByRole('heading', { name: 'Truck & trailer' })).toBeVisible();

    await gotoShowcase(page, '/showcase/safety', 'GLX');
    await expect(page.getByRole('heading', { name: /Hours, credentials/i })).toBeVisible();
  });

  test('Notifications search and assistant render', async ({ page }) => {
    await gotoShowcase(page, '/showcase/notifications', 'GLX');
    await expect(page.getByRole('heading', { name: 'Alert center' })).toBeVisible();

    await gotoShowcase(page, '/showcase/search', 'GLX');
    await expect(page.getByRole('heading', { name: 'Find anything' })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Search' })).toBeVisible();

    await gotoShowcase(page, '/showcase/assistant', 'GLX');
    await expect(page.getByRole('heading', { name: /ELM AI Assistant/i })).toBeVisible();
  });

  test('desktop rail includes Messages Equipment Safety in Showcase', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoShowcase(page, '/showcase/today', 'GLX');
    const nav = page.getByRole('navigation', { name: 'Primary' }).first();
    await expect(nav.getByText('Messages')).toBeVisible();
    await expect(nav.getByText('Equipment')).toBeVisible();
    await expect(nav.getByText('Safety')).toBeVisible();
  });

  test('mobile bottom nav stays five primary destinations', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoShowcase(page, '/showcase/today', 'GLX');
    const bottom = page.locator('.mc-bottom-nav');
    await expect(bottom.getByText('Today')).toBeVisible();
    await expect(bottom.getByText('More')).toBeVisible();
    await expect(bottom.getByText('Messages')).toHaveCount(0);
  });

  test('driver cannot open Showcase', async ({ page }) => {
    await gotoAuthed(page, '/showcase/today', driverSession('GLX'));
    await expect(page.getByText(/Access denied|Showcase Mode unavailable/i).first()).toBeVisible();
    await expect(page.getByText('GLX-7721')).toHaveCount(0);
  });

  test('production pay stays disconnected', async ({ page }) => {
    await gotoAuthed(page, '/pay', driverSession('BST'));
    await expect(page.getByText('NOT CONNECTED TO PRODUCTION')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Settlement not connected' })).toBeVisible();
  });

  test('direct showcase route refresh keeps access after mock grant', async ({ page }) => {
    await gotoShowcase(page, '/showcase/more', 'GLX');
    await expect(page.getByRole('heading', { name: 'Account & support' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Exit Showcase' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Account & support' })).toBeVisible();
  });
});
