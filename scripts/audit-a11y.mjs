/**
 * Accessibility audit for the production build.
 * Uses a persistent Chrome user-data dir to avoid Windows/OneDrive
 * EPERM failures during chrome-launcher temp cleanup.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const outDir = path.join(root, '.lighthouseci');
const profileDir = path.join(root, '.tmp-lh', 'chrome-profile');
const minA11y = 0.9;

function assertDistExists() {
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    throw new Error('dist/index.html missing. Run npm run build first.');
  }
}

function startStaticServer() {
  const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.json': 'application/json',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };

  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let filePath = path.join(distDir, urlPath === '/' ? 'index.html' : urlPath);
    if (!filePath.startsWith(distDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to bind static server'));
        return;
      }
      resolve({ server, port: address.port });
    });
  });
}

async function main() {
  assertDistExists();
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(profileDir, { recursive: true });

  const { server, port } = await startStaticServer();
  const url = `http://127.0.0.1:${port}/login`;
  let chrome;

  try {
    chrome = await chromeLauncher.launch({
      chromePath: process.env.CHROME_PATH || undefined,
      userDataDir: profileDir,
      chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'],
    });

    const result = await lighthouse(url, {
      port: chrome.port,
      output: 'json',
      onlyCategories: ['accessibility'],
      formFactor: 'desktop',
      screenEmulation: { disabled: true },
    });

    if (!result || !result.lhr) {
      throw new Error('Lighthouse returned no result');
    }

    const reportPath = path.join(outDir, 'login-a11y.json');
    fs.writeFileSync(reportPath, result.report);

    const score = result.lhr.categories.accessibility?.score;
    if (typeof score !== 'number') {
      throw new Error('Accessibility category score missing');
    }

    console.log(`[audit:a11y] url=${url}`);
    console.log(`[audit:a11y] accessibility_score=${score}`);
    console.log(`[audit:a11y] report=${reportPath}`);

    if (score < minA11y) {
      throw new Error(
        `Accessibility score ${score} is below required minimum ${minA11y}`
      );
    }

    console.log('[audit:a11y] PASS');
  } finally {
    if (chrome) {
      try {
        await chrome.kill();
      } catch (err) {
        console.warn('[audit:a11y] chrome cleanup warning:', err?.message || err);
      }
    }
    await new Promise((resolve) => server.close(() => resolve()));
  }
}

main().catch((err) => {
  console.error('[audit:a11y] FAIL:', err?.message || err);
  process.exitCode = 1;
});
