/**
 * Production domain verification screenshots for bol.elmconnect.net release.
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.PROD_URL || 'https://bol.elmconnect.net';
const outDir = path.join(__dirname, '..', 'docs', 'evidence', 'production-release-2026-07-23');

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'wide', width: 1920, height: 1080 },
];

const AUTH_ROUTES = [
  { id: 'home', path: '/home' },
  { id: 'trips', path: '/trips' },
  { id: 'capture', path: '/capture' },
  { id: 'pay', path: '/pay' },
  { id: 'more', path: '/more' },
];

async function seedDriver(page) {
  await page.addInitScript(() => {
    sessionStorage.setItem(
      'elm_driver_session',
      JSON.stringify({
        authRole: 'driver',
        driverId: 'GLX-PROD-VERIFY',
        driverName: 'Prod Verify Driver',
        companyCode: 'GLX',
        maskedEmail: 'p***@example.com',
        uploaderAllowed: true,
        active: true,
        canSelectAnyDriver: false,
      })
    );
  });
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const notes = [`base=${BASE}`, `capturedAt=${new Date().toISOString()}`];

  // Unauthenticated login
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(outDir, `${vp.name}-login.png`), fullPage: true });
    const headline = await page.getByText(/Your work, trips, paperwork, and pay/i).count();
    notes.push(`${vp.name}-login-headline=${headline}`);
    notes.push(`${vp.name}-login-pageerrors=${consoleErrors.length}`);
    await context.close();
  }

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    await seedDriver(page);
    const consoleErrors = [];
    page.on('pageerror', (e) => consoleErrors.push(String(e)));

    for (const route of AUTH_ROUTES) {
      await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle', timeout: 60_000 });
      await page.waitForTimeout(700);
      await page.screenshot({
        path: path.join(outDir, `${vp.name}-${route.id}.png`),
        fullPage: true,
      });
    }

    // Deep-link refresh
    await page.goto(`${BASE}/capture`, { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' });
    notes.push(`${vp.name}-capture-refresh-url=${page.url()}`);

    // Legacy redirect
    await page.goto(`${BASE}/today`, { waitUntil: 'networkidle' });
    notes.push(`${vp.name}-today-redirect=${page.url()}`);

    // Ordinary driver: no Demo controls
    await page.goto(`${BASE}/home`, { waitUntil: 'networkidle' });
    const demo = await page.getByRole('button', { name: /Demo controls/i }).count();
    const showcase = await page.getByText(/DEMO — SHOWCASE|DEMO - SHOWCASE/i).count();
    notes.push(`${vp.name}-demo-controls=${demo}`);
    notes.push(`${vp.name}-showcase-banner=${showcase}`);

    // Payroll CTA
    await page.goto(`${BASE}/capture`, { waitUntil: 'networkidle' });
    const payroll = await page.getByRole('heading', { name: /Submit trip for payroll/i }).count();
    notes.push(`${vp.name}-payroll-cta=${payroll}`);

    // Showcase denied for ordinary driver
    await page.goto(`${BASE}/showcase/home`, { waitUntil: 'networkidle' });
    notes.push(`${vp.name}-showcase-url=${page.url()}`);

    // Nav labels
    const navHome = await page.getByRole('link', { name: /^Home$/i }).count();
    const navTrips = await page.getByRole('link', { name: /^Trips$/i }).count();
    notes.push(`${vp.name}-nav-home=${navHome} trips=${navTrips} pageerrors=${consoleErrors.length}`);

    await context.close();
  }

  await browser.close();
  await writeFile(path.join(outDir, 'NOTES.txt'), notes.join('\n') + '\n', 'utf8');
  console.log(notes.join('\n'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
