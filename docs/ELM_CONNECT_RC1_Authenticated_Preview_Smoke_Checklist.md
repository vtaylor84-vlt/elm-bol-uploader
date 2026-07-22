# ELM CONNECT RC1 — Authenticated Deploy Preview Smoke Checklist

**Branch tip for desktop preview:** `codex/driver-rc1-desktop-shell` @ `5c13c954`  
**Do not submit real documents or expenses.** Stop at review screens.

**Preview URL:** ________________________________  
**Tester:** ________________________________  **Date:** ________

Legend: Pass / Fail / Blocked · attach screenshots to evidence folder notes

---

## GLX driver

| # | Action | Expected result | Pass/Fail | Screenshot | Defect notes |
|---|--------|-----------------|-----------|------------|--------------|
| G1 | Open Preview → `/login` → sign in with approved **GLX** driver email | Authenticated shell; routed toward Today / Connecting → Today | | | |
| G2 | Confirm header / profile company chrome | Shows **Greenleaf Xpress** / GLX only — no BST labels | | | |
| G3 | Open `/today` | Heading “What needs attention”; **No current load available**; no Load `48291`, Dallas, or Atlanta | | | |
| G4 | Open `/loads` | Empty / not-connected load list copy; no Showcase fixtures | | | |
| G5 | Open `/capture` | Live BOL/POD and Expense modules visible | | | |
| G6 | Capture → BOL/POD → land on `/submissions/bol-pod` | Workflow opens; **do not submit** | | | |
| G7 | Capture → Expense → `/submissions/receipt` | Expense workflow opens; **do not submit** | | | |
| G8 | Open `/pay` | Disclosure **NOT CONNECTED TO PRODUCTION**; no live pay amounts | | | |
| G9 | Hard-refresh `/today`, `/loads`, `/capture`, `/pay` | Same shell retained; no redirect to login | | | |
| G10 | Logout (confirm dialog) → visit `/today` | Returns to `/login`; session cleared | | | |

---

## BST driver

Repeat G1–G10 with approved **BST** credentials.

| # | Action | Expected result | Pass/Fail | Screenshot | Defect notes |
|---|--------|-----------------|-----------|------------|--------------|
| B1 | Login as BST driver | Authenticated | | | |
| B2 | Carrier branding | **BST Expedite Inc** only — no Greenleaf / GLX leakage | | | |
| B3 | `/today` empty state | Truthful empty; no fabricated haul | | | |
| B4 | `/loads` | Production empty / integration copy | | | |
| B5 | `/capture` | Live modules | | | |
| B6 | BOL/POD without submit | Opens workflow | | | |
| B7 | Expense without submit | Opens workflow | | | |
| B8 | `/pay` isolation | NOT CONNECTED TO PRODUCTION | | | |
| B9 | Direct-route refresh | Shell retained | | | |
| B10 | Logout | Session cleared; `/login` | | | |

---

## Admin

Requires verified admin (`authRole=admin`, `canSelectAnyDriver`).

| # | Action | Expected result | Pass/Fail | Screenshot | Defect notes |
|---|--------|-----------------|-----------|------------|--------------|
| A1 | Login as admin | Admin session established | | | |
| A2 | Open `/submissions/bol-pod` | **Admin Upload Mode** visible | | | |
| A3 | Driver selector | “Select driver” / roster options present | | | |
| A4 | Truck selector (if roster loaded) | Trucks for selected context; no silent wrong-carrier trucks | | | |
| A5 | Switch GLX ↔ BST where UI allows | Company context updates; no mixed tenant rows | | | |
| A6 | Select driver → navigate Capture → return | Selected identity persists as designed | | | |
| A7 | Inspect listed drivers/loads | No unauthorized cross-carrier data | | | |

---

## Showcase

Requires `SHOWCASE_GRANT_SECRET` configured on Deploy Preview **and** a valid server-issued grant for admin entry.

| # | Action | Expected result | Pass/Fail | Screenshot | Defect notes |
|---|--------|-----------------|-----------|------------|--------------|
| S1 | As **non-admin** driver open `/showcase/today` | Access denied | | | |
| S2 | As admin **without** valid grant (or expired) open `/showcase/today` | Access denied / grant messaging | | | |
| S3 | As admin with valid grant → More → Enter Showcase | Showcase hub / today with **Showcase / DEMONSTRATION** labeling | | | |
| S4 | Showcase `/today` | Fixtures visible; clearly labeled demonstration | | | |
| S5 | Compare Production `/today` (exit Showcase) | No Showcase fixture numbers (e.g. BST-48291 / GLX-7721) | | | |
| S6 | Showcase capture / simulated actions | Simulated only; no production upload | | | |
| S7 | Exit Showcase → Production Today | Production empty/truthful state restored | | | |
| S8 | Logout after Showcase | Grant + session cleared; re-entry denied until new login/grant | | | |

**If S3 blocked by missing secret:** mark Blocked; complete Netlify secret steps first; do not invent a secret.

---

## Desktop shell checks (desktop Preview viewport ≥1024)

| # | Action | Expected result | Pass/Fail | Screenshot | Defect notes |
|---|--------|-----------------|-----------|------------|--------------|
| D1 | Resize ≥1024px on `/today` | Left nav rail visible; bottom nav hidden | | | |
| D2 | Resize &lt;1024px | Bottom nav visible; rail hidden | | | |
| D3 | Rail Logout | Confirm dialog → login | | | |

---

## Sign-off

| Gate | Result |
|------|--------|
| GLX driver | |
| BST driver | |
| Admin | |
| Showcase | |
| Desktop shell | |
| Critical defects found | |
| Ready to mark PR ready? | Yes / No |
