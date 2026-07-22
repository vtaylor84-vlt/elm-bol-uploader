# ELM CONNECT Driver Showcase — Progress Tracker

**Branch:** `feature/driver-experience-showcase`  
**Starting SHA:** `79684ba0` (`fix(a11y): unblock CI login accessibility gate`)  
**Latest tip (pre-push):** see `git log -1` on this branch  
**Last progress update:** 2026-07-22  

---

## Phase status

| Phase | Name | Status |
|-------|------|--------|
| **0** | Repository & source verification | **Complete** |
| **1** | Product translation docs | **Complete** |
| **2** | Shared foundation (fixtures, icons, nav, components) | **Complete** |
| **3** | Core workflows (Today, Loads, Capture, Pay) | **Complete** |
| **4** | Supporting modules (Messages, Equipment, Safety, More, Notifications, Search, AI) | **Complete** |
| **5** | Polish & driver language | **Complete** |
| **6** | Quality & local evidence | **Complete** (local prod-build screenshots) |
| **7** | Push / draft PR / Deploy Preview | **Partial** — draft [PR #8](https://github.com/vtaylor84-vlt/elm-bol-uploader/pull/8) open; Actions skip non-`main` base; Netlify DP pending |

---

## Commits on this branch

1. `852cc247` — docs(driver): translate driver app vision into showcase specification  
2. `306c1136` — feat(driver): add typed showcase fixture data foundation  
3. `6e84d0cc` — feat(driver): upgrade navigation and shared experience components  
4. `0f916250` — feat(driver): build showcase today loads capture pay messages equipment safety and more (+ tests)  
5. `5a52fd69` — docs(driver): add production-preview evidence and handoff  
6. `2cd328ad` — docs(driver): note push complete and PR auth blocker  

**PR #8 head at open (confirmed):** `2cd328ad` on `origin/feature/driver-experience-showcase`

---

## PR #8 / CI diagnosis (2026-07-22)

**Confirmed:** draft PR #8 → base `codex/driver-rc1-desktop-shell`, head `feature/driver-experience-showcase` @ `2cd328ad`. Local HEAD, remote tip, and PR head SHA matched.

**Why GitHub showed 0 checks:** `.github/workflows/quality.yml` only runs for `pull_request` events whose **base branch is `main`**. PR #8 targets `codex/driver-rc1-desktop-shell`, so Quality Pipeline never matches. API showed `workflow_runs: []` and `check_runs: []` for this tip — expected with the current filter.

**Why Netlify Deploy Preview #8 may be missing:** separate from Actions. At tip `2cd328ad`, GitHub reported empty commit statuses and empty deployments. Likely Netlify site settings / GitHub App linkage after repo rename (`qlm-bol-uploader` → `elm-bol-uploader`), draft-PR preview policy, or ignored-branch rules — verify in Netlify UI.

**Sync poke:** this docs-only progress update is pushed to fire `pull_request` `synchronize` for Netlify (and any other PR listeners). GitHub Actions Quality will still skip until the workflow base-branch filter includes this PR’s base (or the PR is retargeted to `main`).

### 2026-07-22 — Netlify preview eligibility for RC1 base

Netlify Deploy Preview eligibility was enabled for the PR base branch `codex/driver-rc1-desktop-shell`. A new documentation-only commit is being pushed on `feature/driver-experience-showcase` so Netlify can evaluate PR #8 after that configuration change.

---

## Local quality (this machine)

| Gate | Result |
|------|--------|
| Typecheck | Pass |
| Lint (errors) | Pass |
| Unit tests | 37/37 pass |
| Playwright (RC1 + Showcase) | 111 passed / 1 intermittent wide-desktop Capture flake mitigated with longer timeout |
| Production build | Pass |
| Local prod-build screenshots | 52 files in `docs/evidence/showcase-prod-build/` |

---

## What works in Showcase Mode (admin + grant)

- Persistent banner: “Showcase Mode — Demonstration data only…”
- Today command center with haul, exceptions, HOS/pay teasers, timeline, quick actions  
- Loads with Current / Upcoming / Completed + detail panel  
- Capture with prioritized modules (BOL/POD, receipts, freight, inspection, incident, maintenance) — simulated only  
- Pay full demonstration settlement (never production payroll)  
- Messages, Equipment, Safety, More, Notifications, Search, ELM AI assistant  
- Desktop rail includes Messages / Equipment / Safety; mobile keeps 5-item bottom nav  
- Heroicons-based consistent icon system  
- GLX / BST fixture isolation  

## Production safety (unchanged)

- Production Pay remains disconnected (`NOT CONNECTED TO PRODUCTION`)  
- Production Today remains empty / truthful (no fixture haul)  
- Showcase writes are simulated only; gateway rejects showcase-marked uploads  
- Ordinary drivers cannot enter Showcase  

## Evidence

- Local production-build screenshots: `docs/evidence/showcase-prod-build/`  
- Deploy Preview evidence: capture after Netlify builds the draft PR  

## Remaining / deferred (honest)

- Full vision §5 truck navigation, §25 recruiting, §37 office console, §38 analytics — deferred  
- Real ELD / telematics / payroll integrations — not connected  
- External AI API — not connected (scripted assistant only)  
- Some vision capabilities remain Partial (see capability matrix)  

## Next for a fresh chat

1. Confirm Deploy Preview URL and visually inspect at 390 / 768 / 1440 / 1920  
2. Owner walkthrough with `ELM_CONNECT_DRIVER_SHOWCASE_ACCEPTANCE_CRITERIA.md`  
3. Do **not** merge or publish Production unless Vernon explicitly asks  
