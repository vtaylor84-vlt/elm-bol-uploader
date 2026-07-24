import { expect, test } from '@playwright/test';
import { driverSession, gotoAuthed, gotoShowcase } from './helpers/session';

test.describe('Showcase experience workflows', () => {
  test('Home shows demo chrome and current trip', async ({ page }) => {
    await gotoShowcase(page, '/showcase/home', 'GLX');
    await expect(page.getByText(/DEMO — SHOWCASE/i).first()).toBeVisible();
    await expect(page.getByText('GLX-7721').first()).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Primary' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /What do you need to do/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Upload BOL \/ POD/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Submit Trip Form/i }).first()).toBeVisible();
  });

  test('legacy /showcase/today redirects to Home', async ({ page }) => {
    await gotoShowcase(page, '/showcase/today', 'GLX');
    await expect(page).toHaveURL(/\/showcase\/home/);
  });

  test('Trips filters and detail work', async ({ page }) => {
    await gotoShowcase(page, '/showcase/trips', 'GLX');
    await expect(page.getByRole('heading', { name: /Your trips/i })).toBeVisible();
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

  test('Capture presents Upload BOL / POD and Add receipt', async ({ page }) => {
    await gotoShowcase(page, '/showcase/capture', 'BST');
    await expect(page.getByRole('heading', { name: /What are you submitting/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: /Upload BOL \/ POD/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Add receipt/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Submit Trip Form/i }).first()).toBeVisible();
    await expect(page.getByText(/Trip paperwork/i)).toHaveCount(0);
  });

  test('Pay demonstration shows settlement lines without production claims', async ({ page }) => {
    await gotoShowcase(page, '/showcase/pay', 'GLX');
    await expect(page.getByRole('heading', { name: 'Your pay', exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Demonstration settlement|Demo settlement|not a live payroll/i)).toBeVisible();
    await expect(page.getByText(/\$4,820/).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Ask about pay/i })).toBeVisible();
  });

  test('Messages vehicle safety screens render under More', async ({ page }) => {
    await gotoShowcase(page, '/showcase/messages', 'GLX');
    await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible();

    await gotoShowcase(page, '/showcase/equipment', 'GLX');
    await expect(page.getByRole('heading', { name: /Assigned truck/i })).toBeVisible();

    await gotoShowcase(page, '/showcase/safety', 'GLX');
    await expect(page.getByRole('heading', { name: /Hours, credentials/i })).toBeVisible();
  });

  test('Notifications search and ELM AI render', async ({ page }) => {
    await gotoShowcase(page, '/showcase/notifications', 'GLX');
    await expect(page.getByRole('heading', { name: 'Alert center' })).toBeVisible();

    await gotoShowcase(page, '/showcase/search', 'GLX');
    await expect(page.getByRole('heading', { name: 'Find anything' })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Search' })).toBeVisible();

    await gotoShowcase(page, '/showcase/assistant', 'GLX');
    await expect(page.getByRole('heading', { name: /Ask ELM AI/i })).toBeVisible();
  });

  test('desktop rail keeps five destinations only', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoShowcase(page, '/showcase/home', 'GLX');
    const nav = page.getByRole('navigation', { name: 'Primary' }).first();
    await expect(nav.getByText('Home')).toBeVisible();
    await expect(nav.getByText('Trips')).toBeVisible();
    await expect(nav.getByText('Capture')).toBeVisible();
    await expect(nav.getByText('Pay')).toBeVisible();
    await expect(nav.getByText('More')).toBeVisible();
    await expect(nav.getByText('Messages')).toHaveCount(0);
    await expect(nav.getByText('Equipment')).toHaveCount(0);
    await expect(nav.getByText('Safety')).toHaveCount(0);
  });

  test('mobile bottom nav stays five primary destinations', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoShowcase(page, '/showcase/home', 'GLX');
    const bottom = page.locator('.mc-bottom-nav');
    await expect(bottom.getByText('Home')).toBeVisible();
    await expect(bottom.getByText('Trips')).toBeVisible();
    await expect(bottom.getByText('More')).toBeVisible();
    await expect(bottom.getByText('Messages')).toHaveCount(0);
  });

  test('Demo controls open and exit Showcase', async ({ page }) => {
    await gotoShowcase(page, '/showcase/home', 'GLX');
    const demoBtn = page.getByRole('button', { name: 'Demo controls' }).first();
    await demoBtn.scrollIntoViewIfNeeded();
    await demoBtn.click();
    await expect(page.getByRole('dialog', { name: 'Demo controls' })).toBeVisible();
    await expect(page.getByLabel('Scenario')).toBeVisible();
    await page.getByRole('button', { name: 'Exit Showcase' }).first().click();
    await expect(page).toHaveURL(/\/home/);
  });

  test('driver cannot open Showcase', async ({ page }) => {
    await gotoAuthed(page, '/showcase/home', driverSession('GLX'));
    await expect(page.getByText(/Access denied|Showcase Mode unavailable/i).first()).toBeVisible();
    await expect(page.getByText('GLX-7721')).toHaveCount(0);
  });

  test('production pay stays disconnected', async ({ page }) => {
    await gotoAuthed(page, '/pay', driverSession('BST'));
    await expect(page.getByRole('button', { name: /Submit Trip Form/i }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Earnings' })).toBeVisible();
    await expect(page.getByText('Not available yet').first()).toBeVisible();
    await expect(page.getByText(/Submit trip for payroll/i)).toHaveCount(0);
  });

  test('Submit Trip Form entry is present on Capture after Upload BOL / POD', async ({ page }) => {
    await gotoAuthed(page, '/capture', driverSession('GLX'));
    const bol = page.getByRole('button', { name: /Upload BOL \/ POD/i }).first();
    const form = page.getByRole('button', { name: /Submit Trip Form/i }).first();
    await expect(bol).toBeVisible();
    await expect(form).toBeVisible();
    const bolBox = await bol.boundingBox();
    const formBox = await form.boundingBox();
    expect(bolBox && formBox && bolBox.y < formBox.y).toBeTruthy();
    const popupPromise = page.waitForEvent('popup');
    await form.click();
    const popup = await popupPromise;
    await expect
      .poll(() => popup.url(), { timeout: 15_000 })
      .toMatch(/payroll\.elmconnect\.net|docs\.google\.com\/forms|accounts\.google\.com/);
    await popup.close();
  });

  test('login uses clean ELM mark and non-overlapping email icon', async ({ page }) => {
    await page.goto('/login');
    const mark = page.getByRole('img', { name: 'ELM CONNECT' }).first();
    await expect(mark).toBeVisible();
    await expect(mark).toHaveAttribute('src', /elm-connect-mark\.png/);
    await expect(page.locator('img[src*="elm-connect-login-brand"]')).toHaveCount(0);
    await expect(page.locator('img[src*="elm-connect-mark.svg"]')).toHaveCount(0);
    const wide = (page.viewportSize()?.width || 0) >= 1024;
    const input = page.locator(wide ? '#driver-email-desktop' : '#driver-email-mobile');
    const icon = input.locator('xpath=preceding-sibling::*[contains(@class,"login-input-icon")][1]');
    await input.fill('verylong.driver.email.address+test@greenleafxpress.example.com');
    const padLeft = await input.evaluate((el) => getComputedStyle(el).paddingLeft);
    expect(parseFloat(padLeft)).toBeGreaterThanOrEqual(40);
    await expect(icon).toBeVisible();
  });
});
