/**
 * Local screenshot helper for Mission Control draft PR evidence.
 * Not part of CI. Requires a production build in dist/.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as chromeLauncher from 'chrome-launcher';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const outDir = path.join(root, 'docs', 'evidence');
const profileDir = path.join(root, '.tmp-lh', 'shot-profile');

const DEMO_SESSION = {
  authRole: 'driver',
  driverId: 'DEMO-DRIVER',
  driverName: 'Jordan Rivers',
  companyCode: 'BST',
  maskedEmail: 'j***@example.com',
  uploaderAllowed: true,
  active: true,
  canSelectAnyDriver: false,
};

function startStaticServer() {
  const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
  };
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let filePath = path.join(distDir, urlPath === '/' ? 'index.html' : urlPath);
    if (!filePath.startsWith(distDir)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, port: address.port });
    });
  });
}

async function main() {
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    throw new Error('Run npm run build first');
  }
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(profileDir, { recursive: true });

  const { server, port } = await startStaticServer();
  const chrome = await chromeLauncher.launch({
    chromePath: process.env.CHROME_PATH || undefined,
    userDataDir: profileDir,
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--window-size=390,844'],
  });

  try {
    const browser = await puppeteer.connect({
      browserURL: `http://127.0.0.1:${chrome.port}`,
      defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2 },
    });
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/login`, { waitUntil: 'networkidle0' });
    await page.evaluate((session) => {
      sessionStorage.setItem('elm_driver_session', JSON.stringify(session));
    }, DEMO_SESSION);
    await page.goto(`http://127.0.0.1:${port}/today`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.mc-today', { timeout: 15000 });
    const mobilePath = path.join(outDir, 'mission-control-today-mobile.png');
    await page.screenshot({ path: mobilePath, fullPage: true });
    console.log('wrote', mobilePath);

    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.mc-today', { timeout: 15000 });
    const desktopPath = path.join(outDir, 'mission-control-today-desktop.png');
    await page.screenshot({ path: desktopPath, fullPage: true });
    console.log('wrote', desktopPath);

    await browser.disconnect();
  } finally {
    try {
      await chrome.kill();
    } catch {
      /* ignore Windows cleanup */
    }
    await new Promise((resolve) => server.close(() => resolve()));
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
