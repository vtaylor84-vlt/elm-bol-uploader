/**
 * Capture key routes from live Deploy Preview #7 (production Netlify output).
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../docs/evidence/rc1-screenshots-dp7-after');
const BASE = process.env.DP_BASE || 'https://deploy-preview-7--elmconnect.netlify.app';

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

async function seed(page, profile) {
  await page.goto(`${BASE}/login`);
  await page.evaluate((session) => {
    sessionStorage.setItem('elm_driver_session', JSON.stringify(session));
  }, profile);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const vp of [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'desktop', width: 1440, height: 900 },
  ]) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('response', (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });

    await seed(page, driverSession('BST'));
    for (const route of ['today', 'capture', 'pay', 'submissions/bol-pod']) {
      await page.goto(`${BASE}/${route}`);
      await page.waitForTimeout(800);
      await page.screenshot({
        path: path.join(OUT, `${vp.name}-${route.replace(/\//g, '-')}.png`),
        fullPage: true,
      });
    }
    fs.writeFileSync(path.join(OUT, `${vp.name}-console.txt`), errors.join('\n') || 'clean');
    await context.close();
  }
  await browser.close();
  console.log(`Wrote ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
