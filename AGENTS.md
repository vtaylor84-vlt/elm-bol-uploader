# ELM CONNECT — Agent Instructions

This file orients AI coding agents (Cursor, Claude, etc.) working in this repository.

## Authoritative Reference

Before architectural, security, or multi-tenant changes, read:

**[docs/ELM_CONNECT_Enterprise_Platform_Standards_v1.0.md](docs/ELM_CONNECT_Enterprise_Platform_Standards_v1.0.md)** (v1.1 — includes technical appendix, `authDiag` notes, API surface)

One-page owner summary: **[docs/ELM_CONNECT_Executive_Brief_v1.0.md](docs/ELM_CONNECT_Executive_Brief_v1.0.md)**

AI development workflow (clasp, Netlify, testing, incidents): **[docs/ELM_CONNECT_AI_DEVELOPMENT_STANDARD_v1.md](docs/ELM_CONNECT_AI_DEVELOPMENT_STANDARD_v1.md)**

## Platform Model (Non-Negotiable)

- **ELM CONNECT** = platform operator (software, deployment, shared standards).
- **BST, GLX, future orgs** = tenants. Tenant data must never leak across company boundaries.
- Every domain record (driver, load, document, payroll, audit) must carry a **company / organization scope**.

## Repository Layout

| Path | Role |
|------|------|
| `App.tsx` | Driver portal — 5 stages (`EVENT`→`REVIEW`), manual mode, `multi_vault`, cosmetic splash (`isLocked`) |
| `utils/uploadFileRules.ts` | Client file validation (JPG/PNG; HEIC into compress; blocks PDF/WEBP/video) |
| `netlify/functions/upload.js` | Upload gateway — CORS, company map, file validation, token injection |
| `netlify.toml` | Node 20 build, `dist` publish, cache headers |
| `gas/00_App_Config.js` | `SETTINGS` — spreadsheet ID, per-tenant `FOLDERS` / `EMAILS`, SMS gateway |
| `gas/01_App_routes.js` | `doGet` (`ping`, `getDrivers`) / `doPost` → upload handler |
| `gas/02_App_UploadHandler.js` | Decode files, Drive save, PDF, notifications, intake |
| `gas/03__App_DriverLookup.js` | `getDriversData()` — `Driver_Master` roster gate |
| `gas/04_App_DocIntakeWriter.js` | `DB_Docs` append, `DocIntakeId`, canonical driver lookup |
| `gas/05_App_Notifications.js` | Email + SMS gateway mail |
| `gas/06_App_Utils.js` | `UPLOAD_TOKEN` auth, `authDiag`, company allow list |
| `public/auth.html` | Planned Google sign-in scaffold — **not** wired to main portal |
| `docs/` | Platform standards and executive brief |
| `.cursor/rules/elm-connect-platform.mdc` | Always-apply Cursor rule |

## Two API Paths (Do Not Conflate)

| Traffic | Route | Secrets |
|---------|-------|---------|
| Roster / loads | `App.tsx` → `GOOGLE_SCRIPT_URL?action=...` | Public web app URL; no upload token |
| Uploads | `App.tsx` → `/.netlify/functions/upload` → GAS | `UPLOAD_TOKEN` injected server-side only |

**Gap to know:** Portal calls `getDriverLoads` but `01_App_routes.js` in repo only routes `getDrivers`. Confirm live GAS deployment implements load scan before assuming auto mode works from repo alone.

## Security Rules for Agents

1. **Never** commit secrets (`UPLOAD_TOKEN`, API keys, `.env`). Use Netlify env + GAS Script Properties.
2. **Never** expose `UPLOAD_TOKEN` in client bundles or public URLs.
3. **Always** validate uploads server-side (gateway + GAS), not only in the browser.
4. **Always** scope new data models and queries by `company` / `organization_id`.
5. **Do not** weaken `ALLOWED_ORIGINS`, company allow lists (`BST`/`GLX`), or roster checks without explicit owner approval.
6. Manual fallback must remain **logged and reviewable** — not anonymous.
7. **Do not** remove `authDiag` from GAS without updating handbook Appendix Q — or prefer removing `authDiag` from API responses in production (recommended).
8. **Do not** claim the splash screen (`authStage`) is real authentication — roster + server validation are the current controls.

## Upload Pipeline

```
Driver Portal (App.tsx)
  → Netlify Function (upload.js)
      — ALLOWED_ORIGINS, COMPANY_MAP, file MIME/size, field length
      — inject uploadToken from env
  → Apps Script (02_App_UploadHandler.js)
      — isUploadAuthorized_, isAllowedUploadCompany_
  → Drive folders per company (00_App_Config.js SETTINGS.FOLDERS)
  → DB_Docs intake (04_App_DocIntakeWriter.js)
  → Email/SMS (05_App_Notifications.js)
```

**Limits (gateway):** 20 files max, 10 MB/file, 50 MB total, JPG/PNG only (HEIC blocked at gateway).

## Tenant Configuration

- Company codes: `BST`, `GLX` — `COMPANY_MAP` in `upload.js`, `isAllowedUploadCompany_` in `06_App_Utils.js`.
- Display names: `BST Expedite Inc`, `Greenleaf Xpress` map to codes at gateway.
- Per-tenant Drive folders and emails: `gas/00_App_Config.js`.
- Driver roster: `Driver_Master` — columns B (name), Y (`ShowInUploader`), AB (`IsActive`).

## Current vs. Planned

| Area | Current | Do not assume |
|------|---------|---------------|
| Auth | Roster selection; cosmetic splash | Full SSO already exists |
| Staff auth | `auth.html` scaffold only | Employee portal is live |
| Data | Google Sheets + Drive | PostgreSQL tables do not exist yet |
| Hosting | React + Vite + Netlify | Next.js migration is complete |
| Load scan | Client calls `getDriverLoads` | Handler exists in this repo's `01_App_routes.js` |

When implementing features, design for the **planned** model (PostgreSQL, Supabase, unified identity) but ship against **current** infrastructure unless the task says otherwise.

## Coding Conventions

- Match existing file naming and patterns in `gas/` and `App.tsx`.
- Minimize scope — focused diffs; no unrelated refactors.
- Defense in depth: client + gateway + GAS validation for uploads.
- Log diagnostics without printing secrets or full tokens (`logUiDiag`, `[upload-diag]`, `[upload-auth-diag]`).
- Offline: failed uploads save to `localStorage` key `multi_vault` — preserve this behavior unless explicitly changing resilience design.

## Common Tasks

| Task | Start here |
|------|------------|
| Add tenant | `00_App_Config.js`, `COMPANY_MAP` in `upload.js`, `isAllowedUploadCompany_` |
| Change file rules | `uploadFileRules.ts` **and** `upload.js` **and** verify GAS accepts output |
| Roster change | `03__App_DriverLookup.js`, `Driver_Master` sheet |
| Intake fields | `04_App_DocIntakeWriter.js`, `DB_Docs` headers |
| Rotate upload token | Netlify env + GAS Script Property `UPLOAD_TOKEN`, then E2E test |
| GLX upload email sender | `SETTINGS.GLX_SENDER` in `00_App_Config.js`; alias check in `05_App_Notifications.js`. Add **Send mail as** alias on the executor Gmail account only — no Apps Script ownership transfer or GLX admin access required. Run `testGlxSenderAliases()`; falls back with `GLX_SENDER_ALIAS_MISSING` if absent. |

## When Unsure

1. Re-read the handbook section for the relevant domain (Document §E, Driver §D, Workflow §G, Appendix Q/R).
2. Prefer tenant isolation and server validation over convenience.
3. Document honest limitations (roster auth vs. future SSO; `authDiag` dev risk) — do not oversell security.
