# ELM CONNECT Driver Showcase — Progress Tracker

**Branch:** `feature/driver-experience-showcase`  
**Starting SHA:** `79684ba0` (`fix(a11y): unblock CI login accessibility gate`)  
**Last progress update:** 2026-07-22  

---

## Phase status

| Phase | Name | Status |
|-------|------|--------|
| **0** | Product documentation & baseline alignment | **Complete** |
| **1** | Showcase experience hardening & owner-ready demo | **In progress** |
| **2** | Expanded scenarios / module depth (post-acceptance) | Not started |
| **3** | Production integrations (TMS, pay, messaging, etc.) | Not started — separate from Showcase |

---

## Phase 0 — Complete

Delivered in `docs/product/`:

| File | Role |
|------|------|
| `ELM_CONNECT_DRIVER_APP_VISION.md` | Full vision translation (43 capability areas) |
| `ELM_CONNECT_DRIVER_APP_CAPABILITY_MATRIX.md` | Status matrix + counts |
| `ELM_CONNECT_DRIVER_SHOWCASE_SCOPE.md` | Deliver vs defer, IA, isolation, viewports |
| `ELM_CONNECT_DRIVER_SCREEN_SPECIFICATIONS.md` | Screen specs + language rules |
| `ELM_CONNECT_DRIVER_FIXTURE_DATA_SPEC.md` | DEMO-* / scenario coherence |
| `ELM_CONNECT_DRIVER_INTEGRATION_BOUNDARIES.md` | Write rules / gateway / tenants |
| `ELM_CONNECT_DRIVER_SHOWCASE_ACCEPTANCE_CRITERIA.md` | Owner-testable criteria |
| `ELM_CONNECT_DRIVER_SHOWCASE_PROGRESS.md` | This tracker |
| `ELM_CONNECT_DRIVER_APP_SOURCE.docx` | Original source brief (retained) |

Intermediate extract `_docx_extract.txt` removed after vision write.

**Capability counts (from matrix):**

| Metric | Count |
|--------|------:|
| Total capability areas | 43 |
| Showcase Implemented (planned/presentable) | 6 |
| Showcase Partial | 16 |
| Showcase Deferred | 21 |

---

## Phase 1 — In progress

### Already present on branch (implementation baseline)

- Production vs Showcase layouts and data/action adapters  
- Showcase grant gate (`showcase-access`, fail-closed)  
- Fixture personas + scenario packs (10 scenarios)  
- Shared pages: Today, Loads, Capture, Pay, More  
- Showcase modules: Messages, Truck, Safety, Home Time, Benefits, Documents, Performance, Timeline, Assistant  
- Isolation tests / E2E denial paths (see RC1 report & smoke checklist)  
- Production Pay disconnected; production Today empty/truthful  

### Phase 1 remaining / next steps for continuation

1. **Owner walkthrough** against `ELM_CONNECT_DRIVER_SHOWCASE_ACCEPTANCE_CRITERIA.md` on Deploy Preview (with grant secret configured).  
2. **Authorized Showcase success-path evidence** — screenshots/video when `SHOWCASE_GRANT_SECRET` available (denied path already automated).  
3. **Close any disclosure gaps** — ensure every Showcase money/load surface shows demonstration labeling above the fold.  
4. **Verify Capture sim cannot hit production upload** — unit + manual network check; fix if any path leaks.  
5. **Scenario switcher UX** (if not already obvious on Hub) — let admins flip `ScenarioId` without code changes for demos.  
6. **GLX + BST dual-carrier demo script** — one-pager for Vernon (optional short runbook).  
7. **Align live GAS** with any load-scan claims before marketing “auto loads” outside Showcase.  
8. **Do not** production-deploy Netlify/GAS unless Vernon explicitly requests.  

---

## Phase 2 — Candidate (after Phase 1 acceptance)

- Deeper load detail (stops, notes) as fixtures only  
- Richer message threads tied to load IDs  
- Timeline density toward vision §29 (still demo data)  
- Notification center prototype (still local/fixture)  
- Accessibility pass beyond login gate (text size, focus order on Mission Control)  

---

## Phase 3 — Production roadmap (not Showcase scope)

Prioritize with Product Owner; do not invent SLAs:

- TMS / `getDriverLoads` verification and live Today  
- Payroll/settlement connection (replace disconnected Pay)  
- Messaging inbox  
- ELD partner, navigation partner  
- Escrow ledgers with full traceability  
- Office console  

Unconfirmed business rules remain listed in Vision + Matrix — confirm before encoding as policy.

---

## Risk / honesty log

| Item | Status |
|------|--------|
| Full vision ≠ live product | Documented |
| Roster auth vs future SSO | Documented |
| Pay live | Disconnected in production |
| Showcase write isolation | Required continuous regression |
| `getDriverLoads` in live GAS | Verify before claiming |

---

## Change log (docs)

| Date | Change |
|------|--------|
| 2026-07-22 | Phase 0 docs package created from source `.docx`; Phase 1 marked in progress; starting SHA `79684ba0` |

---

## How to continue (agents)

1. Read Vision + Scope + Integration Boundaries before code changes.  
2. Prefer matrix statuses over inventing new modules.  
3. After code milestones, update **this** Progress file (phase checkboxes / next steps).  
4. Commit only when Vernon asks; do not auto-deploy production.  
5. After `gas/` edits, `clasp push` unless instructed otherwise — and report live sync state.  
