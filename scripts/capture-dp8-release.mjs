/**
 * Live Deploy Preview verification screenshots for release evidence.
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.DP_URL || 'https://deploy-preview-8--elmconnect.netlify.app';
const outDir = path.join(__dirname, '..', 'docs', 'evidence', 'showcase-dp8-release');

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'wide', width: 1920, height: 1080 },
];

const ROUTES = [
  { id: 'login', path: '/login', auth: false },
  { id: 'home', path: '/home', auth: true },
  { id: 'trips', path: '/trips', auth: true },
  { id: 'capture', path: '/capture', auth: true },
  { id: 'pay', path: '/pay', auth: true },
  { id: 'more', path: '/more', auth: true },
];

async function seedDriver(page) {
  await page.addInitScript(() => {
    sessionStorage.setItem(
      'elm_driver_session',
      JSON.stringify({
        authRole: 'driver',
        driverId: 'GLX-DP-VERIFY',
        driverName: 'DP Verify Driver',
        companyCode: 'GLX',
        maskedEmail: 'd***@example.com',
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
  const notes = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    await seedDriver(page);

    for (const route of ROUTES) {
      const url = `${BASE}${route.path}`;
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
      // Settle sticky chrome
      await page.waitForTimeout(800);
      const file = `${vp.name}-${route.id}.png`;
      await page.screenshot({ path: path.join(outDir, file), fullPage: true });
      notes.push(`${file} ok`);
    }

    // Production isolation: Demo controls must not appear for ordinary driver
    await page.goto(`${BASE}/home`, { waitUntil: 'networkidle' });
    const demo = await page.getByRole('button', { name: /Demo controls/i }).count();
    notes.push(`${vp.name}-demo-controls-count=${demo}`);

    // Payroll CTA on Capture
    await page.goto(`${BASE}/capture`, { waitUntil: 'networkidle' });
    const payroll = await page.getByRole('heading', { name: /Submit trip for payroll/i }).count();
    notes.push(`${vp.name}-payroll-cta=${payroll}`);

    await context.close();
  }

  await browser.close();
  await mkdir(outDir, { recursive: true });
  const { writeFile } = await import('node:fs/promises');
  await writeFile(path.join(outDir, 'NOTES.txt'), notes.join('\n') + '\n', 'utf8');
  console.log(notes.join('\n'));
  console.log(`Wrote screenshots to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
