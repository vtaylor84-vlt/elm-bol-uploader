# ELM CONNECT Driver Experience — Integration Boundaries

Defines what may write where for **Production** vs **Showcase Mode**. Violating these boundaries is a release blocker.

---

## Two experiences, one codebase

| Concern | Production | Showcase |
|---------|------------|----------|
| Route prefix | `` (e.g. `/today`) | `/showcase` |
| Layout | `ProductionExperienceLayout` | `ShowcaseExperienceLayout` |
| Data | `ProductionDriverDataSource` | `ShowcaseDriverDataSource` |
| Actions | Production action port (live upload flows) | `ShowcaseDriverActionPort` (sim only) |
| Auth gate | `ProtectedRoute` (session) | `ShowcaseProtectedRoute` (session + admin grant) |

Shared React pages (Today, Loads, Capture, Pay, More) must branch on `mode` / data source — never hardcode Showcase seeds into production adapters.

---

## Write rules

### Production — allowed writes

| Write | Path | Notes |
|-------|------|-------|
| BOL/POD / receipt upload | `App` → `/.netlify/functions/upload` → GAS `02_App_UploadHandler` | Token injected **only** at gateway |
| DB_Docs intake | GAS `04_App_DocIntakeWriter` | After authorized upload |
| Drive file create | GAS per-tenant folders (`SETTINGS.FOLDERS`) | Company isolation |
| Email / SMS notify | GAS `05_App_Notifications` | No tokens/PII in logs |
| Offline vault | `localStorage` `multi_vault` | Failed **production** uploads only |
| Session / grant clear | Auth logout | Clears Showcase grant too |

### Production — forbidden writes

- Client-supplied `UPLOAD_TOKEN`
- Direct browser → Apps Script upload (bypass Netlify)
- Writing Showcase fixtures into Sheets/Drive
- Fabricating payroll / escrow balances as if live

### Showcase — allowed “writes”

| Action | Effect |
|--------|--------|
| Simulated POD / receipt / ack / home time / maintenance / training / payroll inquire / assistant | In-memory UI status + `SIMULATED ACTION` result only |

### Showcase — forbidden writes

| Forbidden | Why |
|-----------|-----|
| Import or call production upload / `submissionUpload` / vault save for “success” demos | Would create real documents |
| Call Netlify `upload` with Showcase payloads | Contaminates tenant Drive/DB_Docs |
| Send live SMS/email as if message center | Confuses ops; not a real thread |
| Mutate live payroll, escrow, ELD logs, load status in TMS | Source AI/finance rules forbid silent financial/ops changes |
| Persist demo pay as accounting truth | Unexplained balances forbidden by vision |

`ShowcaseDriverActionPort` comment contract: **must never import** production upload, vault, or Netlify upload clients.

---

## Gateway rejection

Netlify `upload` function remains the privileged gate:

1. Origin allowlist  
2. Company map / allow list (BST, GLX)  
3. File MIME / size limits (20 files, 10 MB/file, 50 MB total, JPG/PNG; HEIC blocked)  
4. Field length limits  
5. Inject `uploadToken` server-side  

**Showcase expectation:** Simulated Capture must not reach this function. If a request is identifiable as Showcase/simulated (or originates from a blocked path), the gateway **rejects** privileged upload — do not “make the demo work” by weakening auth.

GAS additionally validates `UPLOAD_TOKEN` and `isAllowedUploadCompany_` before Drive/intake.

---

## Pay disconnected in production

| Mode | Pay UI |
|------|--------|
| Production | Explicit **not connected** / no live figures |
| Showcase | Demonstration summary with `DEMONSTRATION DATA` |

Never silently “fill in” production Pay with Showcase numbers to avoid empty states.

---

## GLX / BST isolation

| Rule | Detail |
|------|--------|
| Session company | Authenticated session determines company — not free client input |
| Showcase packs | Built for session `carrierId` only |
| Fixtures | GLX-7721 / GLX-441 never in BST pack; BST-48291 / T-204 never in GLX pack |
| Production Today | Must not show either carrier’s Showcase seeds |
| Uploads | Tenant Drive folders and emails from `gas/00_App_Config.js` |
| Cross-company | Only with explicit future permission — not in Showcase |

---

## Roster vs upload paths (do not conflate)

| Traffic | Route | Secrets |
|---------|-------|---------|
| Roster / loads | `GOOGLE_SCRIPT_URL?action=...` | Public web app URL; no upload token |
| Uploads | `/.netlify/functions/upload` → GAS | `UPLOAD_TOKEN` server-side only |
| Showcase grant | `/.netlify/functions/showcase-access` | `SHOWCASE_GRANT_SECRET` server-side; fail-closed |

**Known gap (honesty):** Portal may call `getDriverLoads` while repo `01_App_routes.js` may only expose `getDrivers`. Do not claim live auto load scan from repo alone without verifying live GAS.

---

## Field identity (intake)

| Field | Meaning | Never merge |
|-------|---------|-------------|
| `loadNum` | Assigned Load # | ≠ bolNum |
| `bolNum` | Driver-entered BOL # | ≠ loadNum |
| `loadId` | Internal load id | ≠ display load # |

Do not reintroduce `loadNum || bolNum` fallbacks in upload/intake.

---

## Security checklist (boundaries)

- [ ] No secrets in React, git, or public URLs  
- [ ] Showcase grant fail-closed if secret missing  
- [ ] Non-admin cannot enter Showcase  
- [ ] Expired grant cannot enter Showcase  
- [ ] Production empty states free of Showcase seeds  
- [ ] Showcase actions return disclosure strings  
- [ ] Logout clears grant  
- [ ] Manual fallback remains logged/roster-tied if used  

---

## Future integrations (boundary posture)

When wiring ELD, navigation, payroll, HR, fuel, or TMS:

1. Read/write through server-authorized APIs — not browser secrets  
2. Tenant scope on every query  
3. Distinguish **estimate** vs **actual** for financial tools (source rule)  
4. Certified ELD remains external — ELM CONNECT does not become the ELD in first major release  
5. Navigation via commercial provider — not a from-scratch engine  

**Unconfirmed:** Exact partner shortlist priority and data-processing agreements — Product Owner decision.

---

*See also platform standards in `docs/ELM_CONNECT_Enterprise_Platform_Standards_v1.0.md` and `AGENTS.md`.*
