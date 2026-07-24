import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function resolveGitSha(): string {
  if (process.env.COMMIT_REF) return String(process.env.COMMIT_REF).trim();
  if (process.env.VITE_RELEASE_SHA) return String(process.env.VITE_RELEASE_SHA).trim();
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'local';
  }
}

function resolveReleaseEnv(): string {
  if (process.env.VITE_RELEASE_ENV) return String(process.env.VITE_RELEASE_ENV).trim();
  const context = String(process.env.CONTEXT || '').trim().toLowerCase();
  if (context === 'production' || context === 'deploy-preview' || context === 'branch-deploy') {
    return context;
  }
  return process.env.NODE_ENV === 'production' ? 'unknown' : 'local';
}

function resolveAppVersion(): string {
  if (process.env.VITE_APP_VERSION) return String(process.env.VITE_APP_VERSION).trim();
  try {
    const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'));
    return String(pkg.version || '1.0.0');
  } catch {
    return '1.0.0';
  }
}

const releaseSha = resolveGitSha();
const releaseEnv = resolveReleaseEnv();
const appVersion = resolveAppVersion();
const buildTime = process.env.VITE_RELEASE_BUILD_TIME || new Date().toISOString();

/**
 * Netlify supplies COMMIT_REF and CONTEXT at build time.
 * Vite exposes VITE_* values to the client bundle (non-secret metadata only).
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  define: {
    'import.meta.env.VITE_RELEASE_SHA': JSON.stringify(releaseSha),
    'import.meta.env.VITE_RELEASE_BUILD_TIME': JSON.stringify(buildTime),
    'import.meta.env.VITE_RELEASE_ENV': JSON.stringify(releaseEnv),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  },
  build: {
    outDir: 'dist',
  },
});
