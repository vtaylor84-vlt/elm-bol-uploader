# ELM CONNECT Driver Experience Showcase — Scope

**Branch:** `feature/driver-experience-showcase`  
**Starting SHA:** `79684ba0`  
**Audience:** Product Owner (Vernon) and implementing agents  
**Companion:** Vision, Capability Matrix, Integration Boundaries, Acceptance Criteria

---

## Purpose

This branch delivers an **admin-authorized Showcase Mode**: a carrier-scoped, fixture-driven demonstration of the future Driver Experience (Mission Control IA) **without** writing to production Drive, DB_Docs, payroll, SMS, or messaging systems.

It is **not** a claim that the full 43-area vision is live.

---

## What this showcase branch delivers

### Authorization and isolation

- Server-backed Showcase grant (`showcase-access` + grant secret), fail-closed
- Entry from **More → Enter Showcase** for verified admins with valid unexpired grant
- Access denied for non-admins, missing/expired grants, or misconfigured secret
- Logout clears session **and** Showcase grant
- Routes under `/showcase/*` use `ShowcaseExperienceLayout` + Showcase data/action adapters
- Production routes under `/today`, `/loads`, `/capture`, `/pay`, `/more` never render Showcase fixtures

### Primary information architecture (driver nav)

| Nav item | Production | Showcase |
|----------|------------|----------|
| **Today** | Truthful empty / not-connected Mission Control; live Capture CTA | Fixture Mission Control (active haul, exceptions, tasks, earnings demo) |
| **Loads** | Empty / not-connected list | Carrier demo loads (active + history) |
| **Capture** | Live BOL/POD + expense modules → real submission flows | Simulated modules only (`SIMULATED ACTION`) |
| **Pay** | Explicit **not connected** | Demonstration settlement summary |
| **More** | Profile + admin Showcase entry + links | Same shell + Showcase future-module links; Exit Showcase |

### Showcase-only modules (presentation)

Mounted under `/showcase/...` (not production nav chrome for all of these):

| Path | Module | Intent |
|------|--------|--------|
| `/showcase` | Hub | Scenario / entry overview |
| `/showcase/messages` | Messages | Demo inbox + simulate acknowledge |
| `/showcase/truck` | Equipment | Demo tractor/trailer status + sim maintenance |
| `/showcase/safety` | Safety | Demo safety status |
| `/showcase/home-time` | Home Time | Demo request status + sim request |
| `/showcase/benefits` | Benefits | FUTURE CAPABILITY cards |
| `/showcase/documents` | Documents | Demo document packet status |
| `/showcase/performance` | Performance | Demo scorecard |
| `/showcase/timeline` | Timeline | Demo chronological events |
| `/showcase/assistant` | AI Assistant | Simulated replies only |

### Disclosure language (mandatory)

Surfaces must use one or more of:

- `DEMONSTRATION DATA`
- `FUTURE CAPABILITY`
- `SIMULATED ACTION`
- `NOT CONNECTED TO PRODUCTION`

Drivers and admins must never confuse Showcase numbers with live pay, loads, or equipment truth.

### Fixture scenarios (carrier-scoped)

`normal`, `urgent_pod`, `payroll_ready`, `maintenance`, `safety_review`, `road_breakdown`, `storm_delay`, `missing_paperwork`, `perfect_week`, `new_driver` — see Fixture Data Spec.

### Production capabilities preserved (outside Showcase)

- Roster login / company session
- Live Capture → Netlify upload → GAS → Drive + DB_Docs + notifications
- Offline vault for failed production uploads
- Pay page remains disconnected in production (truthful messaging)

---

## What this branch defers

| Deferred area | Rationale |
|---------------|-----------|
| Commercial navigation engine | Integrate partner later; do not build from scratch |
| Live TMS load scan / status machine | Confirm live GAS `getDriverLoads` + TMS before claiming |
| Escrow/savings ledgers & payroll timeline | No live finance systems |
| Full messaging / push / quiet hours | Outbound upload notify ≠ inbox |
| DVIR, accident response, HOS/ELD | Compliance-sensitive; ELD via certified partners |
| Fuel, scale, parking, community | Partner / content dependent |
| Recruiting, referrals, recognition suites | Separate programs |
| Global search + production AI | Requires authorized data plane + guardrails |
| Multilingual full UI | Professional legal/safety review required |
| Office console & executive analytics | Outside driver Showcase |
| Owner-operator board & financial tools | Distinct product surface |
| Theme toggles | Platform forbids casual dark/light toggles |

---

## Production isolation rules (non-negotiable)

1. **No Showcase fixtures on production routes.** Production `DriverDataSource` returns empty/disconnected views.
2. **No production writes from Showcase actions.** `ShowcaseDriverActionPort` must not import upload, vault, or Netlify upload clients.
3. **Gateway must reject Showcase / simulated payloads** that attempt privileged production upload (see Integration Boundaries).
4. **GLX fixtures never appear in BST Showcase session** and vice versa.
5. **Pay:** production always disconnected; Showcase pay is labeled demonstration only.
6. **Secrets:** `UPLOAD_TOKEN`, `SHOWCASE_GRANT_SECRET` only in Netlify env / server — never in client bundles or git.
7. **Manual fallback / roster rules** must not be weakened to make demos easier.

---

## Viewport coverage

| Viewport | Expectation |
|----------|-------------|
| **Mobile (primary)** | Bottom nav: Today / Loads / Capture / Pay / More; thumb-reachable primary actions; attention-first Today |
| **Tablet** | Same IA; readable Mission Control cards without horizontal cramping |
| **Desktop** | Desktop nav rail replaces bottom nav; same routes; Showcase disclosure still visible above the fold |

**Attention-first:** Critical exceptions and due-now tasks appear before secondary promo/content. Showcase must still read as Driver Terminal / ELM CONNECT (futuristic dark, electric blue) — no redesign.

---

## Success definition for this branch

An authorized admin can enter Showcase, walk GLX and BST scenarios, show Today → Loads → Capture (sim) → Pay (demo) → Messages/Equipment/Safety/More modules, exit to production, and prove production still has empty/truthful states and live upload path unchanged.

---

## Related docs

- `ELM_CONNECT_DRIVER_APP_VISION.md`
- `ELM_CONNECT_DRIVER_APP_CAPABILITY_MATRIX.md`
- `ELM_CONNECT_DRIVER_SCREEN_SPECIFICATIONS.md`
- `ELM_CONNECT_DRIVER_FIXTURE_DATA_SPEC.md`
- `ELM_CONNECT_DRIVER_INTEGRATION_BOUNDARIES.md`
- `ELM_CONNECT_DRIVER_SHOWCASE_ACCEPTANCE_CRITERIA.md`
- `ELM_CONNECT_DRIVER_SHOWCASE_PROGRESS.md`
