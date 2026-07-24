# ELM CONNECT Driver Showcase — Acceptance Criteria

Testable criteria for Product Owner review of `feature/driver-experience-showcase`.  
Pass = observable in Deploy Preview or local build with documented setup.  
**Do not** weaken auth or isolation to force a pass.

---

## A. Authorization and isolation

| ID | Criterion | Pass evidence |
|----|-----------|---------------|
| A1 | Non-admin driver opening `/showcase/today` is denied | Access denied / Showcase unavailable copy |
| A2 | Admin without valid grant (missing or expired) is denied | Denied; no fixture Mission Control |
| A3 | Admin with valid unexpired grant can enter via More → Enter Showcase | Lands on Showcase hub or `/showcase/today` with demonstration labeling |
| A4 | Missing `SHOWCASE_GRANT_SECRET` fails closed | Grant issuance denied; no open Showcase |
| A5 | Logout clears session and Showcase grant | Re-entry requires new login + grant |
| A6 | Production `/today` never shows Showcase load seeds (e.g. BST-48291, GLX-7721, Dallas→Atlanta demo pair) | Empty/truthful production state |
| A7 | After Exit Showcase, production Today restored | No demonstration earnings/loads |

---

## B. Information architecture and disclosure

| ID | Criterion | Pass evidence |
|----|-----------|---------------|
| B1 | Bottom nav (mobile) / rail (desktop): Today, Loads, Capture, Pay, More | Labels present and routed |
| B2 | Showcase surfaces show disclosure chips/copy | `DEMONSTRATION DATA` / `FUTURE CAPABILITY` / `SIMULATED ACTION` / `NOT CONNECTED TO PRODUCTION` as appropriate |
| B3 | Attention-first: critical exceptions appear above earnings on Today when scenario has critical items | Visual order on `urgent_pod` / `road_breakdown` |
| B4 | Driver-facing language — no engineer jargon on primary screens | No “adapter”, “fixture pack”, “schema” in driver UI copy |

---

## C. Today / Loads / Capture / Pay (Showcase)

| ID | Criterion | Pass evidence |
|----|-----------|---------------|
| C1 | Showcase Today shows active haul coherent with carrier seeds | GLX: GLX-7721 / GLX-441; BST: BST-48291 / T-204 |
| C2 | Scenario change updates exceptions/tasks/CTA (when scenario control available) | e.g. urgent_pod → POD CTA |
| C3 | Showcase Loads lists active + history demo loads for **session carrier only** | No cross-carrier load numbers |
| C4 | Showcase Capture modules labeled simulated | Helper text states not production upload |
| C5 | Simulated POD/expense action does not create Drive/DB_Docs rows | No new intake from sim; network has no successful privileged upload for sim |
| C6 | Showcase Pay shows demo gross/deductions/net with demonstration disclosure | Figures + chip |
| C7 | Production Pay remains disconnected | Explicit not-connected messaging; no demo numbers |

---

## D. Showcase future modules

| ID | Criterion | Pass evidence |
|----|-----------|---------------|
| D1 | `/showcase/messages` lists demo messages; acknowledge returns simulated status | Status string includes SIMULATED ACTION |
| D2 | `/showcase/truck` shows truck/trailer matching Today haul | Same unit numbers |
| D3 | `/showcase/safety` shows status; safety_review shows open items | Open items non-empty in that scenario |
| D4 | Home Time / Benefits / Documents / Performance / Timeline / Assistant reachable from Showcase More | Pages render with FUTURE/DEMO disclosures |
| D5 | Assistant replies are simulated and disclaim production | No claim of live payroll authority |

---

## E. Production upload path (regression)

| ID | Criterion | Pass evidence |
|----|-----------|---------------|
| E1 | Production Capture still offers live BOL/POD and expense entry | Navigates to submission flows |
| E2 | Authorized production upload still goes Netlify → GAS | Successful upload only with valid gateway+token path |
| E3 | Client bundle does not contain `UPLOAD_TOKEN` | Build/search verification |
| E4 | `loadNum` / `bolNum` / `loadId` remain distinct in upload payload builders | Code + sample payload review |
| E5 | Offline vault behavior for failed production uploads preserved | Failed upload savable/retryable per existing design |

---

## F. Tenant isolation

| ID | Criterion | Pass evidence |
|----|-----------|---------------|
| F1 | GLX Showcase session never renders BST seed load/truck IDs | UI inspection + unit tests |
| F2 | BST Showcase session never renders GLX seed load/truck IDs | Same |
| F3 | Company on uploads determined by authorized session mapping | Gateway/GAS allow list behavior unchanged |

---

## G. Viewport

| ID | Criterion | Pass evidence |
|----|-----------|---------------|
| G1 | Mobile: primary CTA reachable; bottom nav usable | Manual or Playwright |
| G2 | Desktop: nav rail present; Showcase disclosure above fold | Screenshot / manual |
| G3 | Login accessibility gate remains green in CI | CI a11y check |

---

## H. Honesty / non-claims

| ID | Criterion | Pass evidence |
|----|-----------|---------------|
| H1 | Docs and UI do not claim full 43-area product is live | Scope + Progress docs match UI |
| H2 | Splash/lock screen not described as real authentication | Copy / owner brief accurate |
| H3 | Unconfirmed business rules not hardcoded as policy | No invented escrow/dispute/legal copy |

---

## Suggested owner review script (15–20 min)

1. Login as non-admin → confirm Showcase denied.  
2. Login as admin → without grant denied; with grant enter Showcase.  
3. Walk Today → Loads → Capture (sim) → Pay on **GLX**.  
4. Open Messages, Truck, Safety; run one simulate action.  
5. Exit Showcase → confirm production empty/truthful + Pay disconnected.  
6. Repeat smoke on **BST** session (isolation).  
7. Optional: one real production BOL upload in non-Showcase path (staging) to confirm regression.

Checklist companion: `docs/ELM_CONNECT_RC1_Authenticated_Preview_Smoke_Checklist.md`.

---

## Exit criteria for “Showcase Phase 1 complete”

- A1–A7, B1–B4, C1–C7, D1–D5, F1–F2 pass  
- E1–E5 no regressions  
- Progress doc updated; Product Owner sign-off recorded  

Phase 0 (docs + baseline) complete when this document set exists and branch starts at `79684ba0`.
