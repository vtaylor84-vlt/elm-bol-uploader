/**
 * Capture Showcase Mode production-build screenshots at key viewports.
 * Run after `npm run build`. Starts vite preview, seeds admin + mock grant.
 */
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'docs', 'evidence', 'showcase-prod-build');
const PORT = 4177;
const BASE = `http://127.0.0.1:${PORT}`;

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'wide', width: 1920, height: 1080 },
];

const ROUTES = [
  { id: 'home', path: '/showcase/home' },
  { id: 'trips', path: '/showcase/trips' },
  { id: 'capture', path: '/showcase/capture' },
  { id: 'pay', path: '/showcase/pay' },
  { id: 'messages', path: '/showcase/messages' },
  { id: 'equipment', path: '/showcase/equipment' },
  { id: 'safety', path: '/showcase/safety' },
  { id: 'more', path: '/showcase/more' },
  { id: 'notifications', path: '/showcase/notifications' },
  { id: 'search', path: '/showcase/search' },
  { id: 'assistant', path: '/showcase/assistant' },
];

async function waitForServer(url, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Preview server not ready at ${url}`);
}

async function seedShowcase(page) {
  await page.goto(`${BASE}/login`);
  await page.evaluate(() => {
    sessionStorage.setItem(
      'elm_driver_session',
      JSON.stringify({
        authRole: 'admin',
        driverId: 'GLX-A-SHOT',
        driverName: 'GLX Demo Admin',
        companyCode: 'GLX',
        maskedEmail: 'g***@example.com',
        uploaderAllowed: true,
        active: true,
        canSelectAnyDriver: true,
      })
    );
    sessionStorage.setItem('elm_showcase_grant', 'shot.valid.grant');
    sessionStorage.setItem('elm_showcase_grant_exp', String(Date.now() + 3_600_000));
  });
  await page.route('**/showcase-access', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ allowed: true, expiresAt: Date.now() + 3_600_000 }),
    });
  });
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const preview = spawn(
    process.execPath,
    ['./node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(PORT)],
    { cwd: path.join(__dirname, '..'), stdio: 'pipe', shell: false }
  );

  try {
    await waitForServer(BASE);
    const browser = await chromium.launch();
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();
      await seedShowcase(page);
      for (const route of ROUTES) {
        await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);
        const file = path.join(outDir, `${vp.name}-${route.id}.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log('wrote', file);
      }
      // production pay disconnected
      await page.evaluate(() => {
        sessionStorage.setItem(
          'elm_driver_session',
          JSON.stringify({
            authRole: 'driver',
            driverId: 'GLX-D-SHOT',
            driverName: 'GLX Demo Driver',
            companyCode: 'GLX',
            maskedEmail: 'd***@example.com',
            uploaderAllowed: true,
            active: true,
            canSelectAnyDriver: false,
          })
        );
        sessionStorage.removeItem('elm_showcase_grant');
      });
      await page.goto(`${BASE}/pay`, { waitUntil: 'networkidle' });
      await page.screenshot({
        path: path.join(outDir, `${vp.name}-production-pay.png`),
        fullPage: true,
      });
      await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
      await page.screenshot({
        path: path.join(outDir, `${vp.name}-login.png`),
        fullPage: true,
      });
      await context.close();
    }
    await browser.close();
  } finally {
    preview.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
