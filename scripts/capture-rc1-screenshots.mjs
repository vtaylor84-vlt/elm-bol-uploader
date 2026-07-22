/**
 * Capture review screenshots for Driver Experience RC1 desktop shell.
 * Test-only. Uses session fixtures — no real credentials.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../docs/evidence/rc1-screenshots-prod-fix');
const BASE = process.env.PREVIEW_BASE || 'http://127.0.0.1:4173';

/**
 * IMPORTANT: Serve the Vite *production* preview (npm run build && npm run preview),
 * never `npm run dev`. Evidence must reflect the Netlify publish output.
 */

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'wide', width: 1920, height: 1080 },
];

function driverSession(carrier) {
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

function adminSession(carrier) {
  return {
    ...driverSession(carrier),
    authRole: 'admin',
    driverId: `${carrier}-A-TEST`,
    driverName: carrier === 'GLX' ? 'GLX Test Admin' : 'BST Test Admin',
    canSelectAnyDriver: true,
  };
}

async function seed(page, profile) {
  await page.goto(`${BASE}/login`);
  await page.evaluate((session) => {
    sessionStorage.setItem('elm_driver_session', JSON.stringify(session));
  }, profile);
}

async function shot(page, file) {
  await page.screenshot({ path: path.join(OUT, file), fullPage: true });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();

    await page.goto(`${BASE}/login`);
    await shot(page, `${vp.name}-login.png`);

    await seed(page, driverSession('GLX'));
    await page.goto(`${BASE}/today`);
    await shot(page, `${vp.name}-today-glx-empty.png`);

    await seed(page, driverSession('BST'));
    await page.goto(`${BASE}/today`);
    await shot(page, `${vp.name}-today-bst-empty.png`);

    for (const route of ['loads', 'capture', 'workspace', 'pay', 'more']) {
      await page.goto(`${BASE}/${route}`);
      await shot(page, `${vp.name}-${route}.png`);
    }

    await page.goto(`${BASE}/capture`);
    await page.getByRole('button', { name: /BOL|POD/i }).first().click();
    await page.waitForURL(/\/submissions\/bol-pod/);
    await shot(page, `${vp.name}-bol-pod.png`);

    await page.goto(`${BASE}/capture`);
    await page.getByRole('button', { name: /Expense|Receipt/i }).first().click();
    await page.waitForURL(/\/submissions\/receipt/);
    await shot(page, `${vp.name}-expense.png`);

    await seed(page, adminSession('GLX'));
    await page.goto(`${BASE}/submissions/bol-pod`);
    await shot(page, `${vp.name}-admin-bol-pod.png`);

    await context.close();
  }

  await browser.close();
  console.log(`Screenshots written to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
