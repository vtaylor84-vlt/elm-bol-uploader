/**
 * Non-sensitive release identity for deployment drift troubleshooting.
 * Values are injected at build time (see vite.config.ts). Never includes secrets or endpoints.
 */

export type ReleaseEnvironmentLabel =
  | 'production'
  | 'deploy-preview'
  | 'branch-deploy'
  | 'local'
  | 'unknown';

export interface ReleaseIdentity {
  shortSha: string;
  buildTimestamp: string;
  environment: ReleaseEnvironmentLabel;
  appVersion: string;
  /** Compact single-line label for discreet UI surfaces */
  displayLabel: string;
}

export interface ReleaseIdentityEnv {
  VITE_RELEASE_SHA?: string;
  VITE_RELEASE_BUILD_TIME?: string;
  VITE_RELEASE_ENV?: string;
  VITE_APP_VERSION?: string;
}

function normalizeEnv(raw?: string): ReleaseEnvironmentLabel {
  const v = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');
  if (v === 'production' || v === 'prod') return 'production';
  if (v === 'deploy-preview' || v === 'preview') return 'deploy-preview';
  if (v === 'branch-deploy' || v === 'branch') return 'branch-deploy';
  if (v === 'local' || v === 'development' || v === 'dev') return 'local';
  return 'unknown';
}

function shortShaFrom(raw?: string): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/^"|"$/g, '');
  if (!cleaned || cleaned === 'unknown' || cleaned === 'local') return 'local';
  return cleaned.slice(0, 7);
}

function readViteEnv(): ReleaseIdentityEnv {
  try {
    // Vite replaces import.meta.env.* at build time.
    const env = (import.meta as ImportMeta & { env?: ReleaseIdentityEnv }).env || {};
    return env;
  } catch {
    return {};
  }
}

/** Resolve release identity from Vite-injected env with safe fallbacks. */
export function getReleaseIdentity(env: ReleaseIdentityEnv = readViteEnv()): ReleaseIdentity {
  const shortSha = shortShaFrom(env.VITE_RELEASE_SHA);
  const buildTimestamp = String(env.VITE_RELEASE_BUILD_TIME || '').trim() || 'unknown';
  const environment = normalizeEnv(env.VITE_RELEASE_ENV);
  const appVersion = String(env.VITE_APP_VERSION || '').trim() || '1.0.0';
  const displayLabel = `${appVersion} · ${shortSha} · ${environment}`;
  return { shortSha, buildTimestamp, environment, appVersion, displayLabel };
}
