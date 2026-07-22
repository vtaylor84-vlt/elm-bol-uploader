# ELM CONNECT Driver Experience RC1 — Overnight Report

**Generated:** 2026-07-22  
**Agent role:** Lead engineer / release manager / UX / QA / security reviewer  
**Overall status:** READY FOR OWNER REVIEW

---

## 1. Executive summary

Release hardening and a separable desktop shell were completed locally on stacked branches. Production `/today` no longer fabricates an operational load; empty truck/safety placeholders no longer hardcode BST; release identity metadata is available on More → System; automated unit/integration and Playwright E2E coverage now protect the highest-risk isolation boundaries.

**Still blocked for human/owner actions:** authenticated GLX/BST Deploy Preview validation, `SHOWCASE_GRANT_SECRET` on Deploy Preview, PR readiness/merge, and Production publish. No merge, Production deploy, or real document/expense submission was performed.

---

## 2. Starting state

| Item | Value |
|------|-------|
| Starting branch | `feature/driver-experience-cursor` |
| Starting commit (RC1 head) | `53691102b1bc32d3104bd7235c93eeccf147fae3` |
| Expected PR | PR #4 (draft) — `gh` CLI not installed locally; metadata not re-fetched via API |
| `origin/main` | `b2c1f1053ccb0832d6ee4b7e884a7313a2cd5cfc` (matches expected production generation) |
| Known-good Production deploy | `6a600fc332744c00088d4f1a` @ `b2c1f105` |
| Working tree note | Unrelated `dist/` churn stashed as `preserve-dist-baseline` before branching |

### Baseline quality gates (pre-change)

| Command | Result | Notes |
|---------|--------|-------|
| `npm run typecheck` | PASS (~3.7s) | |
| `npm run lint` | PASS (~1.2s) | 120 pre-existing warnings |
| `npm test` | PASS (~0.6s) | 12 tests |

---

## 3. Confirmed defects corrected

### 3A. Demonstration haul in Production `/today`

| | |
|--|--|
| **Root cause** | `services/missionControlAdapter.ts` always returned fabricated Load `48291` Dallas→Atlanta as Production Mission Control data. |
| **Files** | `services/missionControlAdapter.ts`, `components/mission-control/ActiveHaulCard.tsx`, `tests/rc1-isolation.test.ts`, `e2e/rc1-driver-experience.spec.ts` |
| **Correction** | Production adapter returns `activeHaul: null`, empty exceptions/tasks, truthful empty copy; live BOL/POD primary action retained. Showcase fixtures untouched in `fixtures/showcase/`. |
| **Tests** | Unit: production never contains `48291`/`Dallas`/`Atlanta`; Showcase still has approved fixtures. E2E: empty state visible; demo load absent. |
| **Validation** | Automated pass + screenshot review |

### 3B. Hardcoded `carrierId: 'BST'` placeholders

| | |
|--|--|
| **Root cause** | `ProductionDriverDataSource` hardcoded BST on truck/safety/home-time/performance placeholders. |
| **Files** | `utils/companyMap.ts` (`resolveCarrierId`), `services/dataSource/ProductionDriverDataSource.ts`, `services/dataSource/types.ts` (optional `carrierId`) |
| **Correction** | Placeholders brand from authenticated carrier only; unknown company stays carrier-neutral. |
| **Tests** | GLX/BST/unknown isolation unit tests |
| **Validation** | Automated pass |

### 3C. Release identity diagnostics

| | |
|--|--|
| **Root cause** | No safe way to compare Live vs Preview frontend generation. |
| **Files** | `utils/releaseIdentity.ts`, `vite.config.ts`, `pages/MissionPlaceholders.tsx` (More → System) |
| **Correction** | Non-secret SHA / build time / env / version injected at build. Netlify: `COMMIT_REF` + `CONTEXT` → `VITE_RELEASE_*`. Local fallbacks: git SHA or `local`. |
| **Tests** | Release identity fallback + Netlify-style normalization unit tests |
| **Validation** | Automated pass |

---

## 4. Architecture preservation

| Boundary | Status |
|----------|--------|
| DriverDataSource | Preserved — Production vs Showcase factories unchanged in role |
| AuthContext | Preserved — logout still clears session + Showcase grant |
| ShowcaseContext | Preserved — server grant gate unchanged |
| DriverExperienceContext | Preserved |
| GLX / BST carrier config | Preserved + hardened (`resolveCarrierId`) |
| Production / Showcase separation | Preserved — fixtures only via Showcase source |
| Server-backed Showcase authorization | Preserved — fail-closed without secret |
| Upload services / gateway validation | Unchanged except stronger test coverage of demo rejection |
| Payroll isolation | Preserved — `NOT CONNECTED TO PRODUCTION` |
| Production write protection / Showcase write blocking | Preserved |

---

## 5. Release-hardening branch

| | |
|--|--|
| **Branch** | `codex/driver-rc1-release-hardening` |
| **Commit** | `0f1aadff05571172d04892c7c82572b76d1655ae` |
| **Parent RC1** | `53691102` |
| **Push / PR** | **Not pushed** (remote publish blocked pending owner approval in this environment). No PR created. |
| **Review URL** | N/A until push |

### Changed files (hardening)

`.gitignore`, `ActiveHaulCard.tsx`, `showcaseGrant.test.js`, `package.json`, `package-lock.json`, `MissionPlaceholders.tsx`, `playwright.config.ts`, `ProductionDriverDataSource.ts`, `types.ts` (dataSource), `missionControlAdapter.ts`, `tsconfig.json`, `companyMap.ts`, `releaseIdentity.ts`, `vite.config.ts`, `tests/*`, `e2e/*`

### Hardening test results

| Suite | Result |
|-------|--------|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (pre-existing warnings) |
| `npm test` | PASS — **30** tests |
| `npm run build` | PASS |
| Playwright (desktop project, pre-desktop-shell) | PASS — 17/17 |

---

## 6. Desktop UX branch

| | |
|--|--|
| **Branch** | `codex/driver-rc1-desktop-shell` |
| **Commit** | `690d63a20851f3b72f72fa6800b1486401494018` |
| **Based on** | hardening `0f1aadff` |
| **Push / PR** | **Not pushed**. No PR created. |
| **Review URL** | N/A until push |

### Responsive behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (&lt;1024) | Bottom nav retained; header logout retained; stacked content |
| Tablet | Constrained canvas; bottom nav retained |
| Desktop (≥1024) | Persistent left rail; header logout hidden (rail logout); wider content canvas |
| Wide (≥1440) | Slightly wider rail + form max-width; Today two-column composition |

Shared primitives added: `EmptyState`, `LoadingState`, `ErrorState`, `SectionHeading`, `StatusPill`, `FormSection`, `DesktopNavRail`, shared `shellNav`.

### Desktop test results

| Suite | Result |
|-------|--------|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — ~129 warnings (≈120 pre-existing + new-file a11y/import-type noise) |
| `npm test` | PASS — 30 |
| `npm run build` | PASS |
| `npx playwright test` (4 viewports) | PASS — **68/68** |

---

## 7. Visual evidence

Directory: [`docs/evidence/rc1-screenshots/`](docs/evidence/rc1-screenshots/)

Captured routes × viewports include: login, today (GLX/BST empty), loads, capture, workspace, pay, more, bol-pod, expense, admin bol-pod.

**Self-review notes:** Desktop rail replaces bottom nav; mobile bottom nav preserved; no fabricated Load 48291; GLX/BST labels match session; pay shows disconnected messaging. Showcase authorized success-path screenshots **not** captured (secret + live grant unavailable) — denied path covered by E2E.

---

## 8. Quality-gate matrix

| Command | Result | Approx duration | Warnings | New vs pre-existing |
|---------|--------|-----------------|----------|---------------------|
| `npm run typecheck` | PASS | ~18s | none | — |
| `npm run lint` | PASS | ~1s | ~129 | Mostly pre-existing; +~9 from new components |
| `npm test` | PASS | &lt;1s | none | Expanded suite |
| `npx playwright test` | PASS | ~1.2m | none | New |
| `npm run build` | PASS | ~5–8s | browserslist age notice | Pre-existing tooling notice |
| `npm run audit:a11y` | **Not re-run overnight** | — | — | Use CI Chrome path on PR |
| CI (`quality.yml`) | Not executed on GitHub (no push) | — | — | Local CI-equivalent above |

---

## 9. Automated coverage matrix

| Area | Status |
|------|--------|
| GLX carrier resolution | Automated pass |
| BST carrier resolution | Automated pass |
| Unknown carrier | Automated pass |
| Auth session cleanup | Automated pass (storage helpers) |
| Logout E2E | Automated pass |
| Production data isolation | Automated pass |
| Showcase fixtures allowed | Automated pass (unit) |
| Showcase denial (driver / invalid grant) | Automated pass (E2E) |
| Showcase secret fail-closed | Automated pass (unit) |
| Showcase write blocking (sim port / upload rejection) | Automated pass |
| Upload demo payload rejection | Automated pass |
| Pay isolation | Automated pass |
| Admin mode chrome | Automated pass (E2E source-level) |
| Driver selection UI | Automated pass (admin BOL/POD option present) |
| Truck selection | **Source-reviewed** — interactive live roster still human |
| Route refreshes | Automated pass |
| Mobile / tablet / desktop / wide | Automated pass |
| Accessibility | Source-reviewed + lint a11y warnings; Lighthouse audit not re-run |
| Authenticated GLX Preview | **Blocked** |
| Authenticated BST Preview | **Blocked** |
| Showcase success path (authorized) | **Blocked** (`SHOWCASE_GRANT_SECRET`) |
| Real upload / expense submit | **Not run** (by design) |

---

## 10. Remaining human-required actions

### A. Add `SHOWCASE_GRANT_SECRET` to Netlify (Deploy Preview + Production scopes as appropriate)

1. Generate a strong random secret (do not reuse `UPLOAD_TOKEN`).
2. Netlify → Site → Environment variables → add `SHOWCASE_GRANT_SECRET`.
3. Apply to Deploy Previews (and Production only if Showcase should work in Production for admins).
4. Also set the same value in GAS Script Properties only if a GAS path mints grants (current mint path is Netlify login/showcase functions).
5. Trigger a new Deploy Preview build; confirm More → Enter Showcase no longer fails for missing secret.

### B. Authenticated GLX Preview validation

1. Open PR Deploy Preview URL.
2. Sign in with approved GLX test driver credentials.
3. Verify `/today` empty/truthful state, `/loads`, `/capture`, `/pay`, `/submissions/bol-pod` navigation **without** submitting.
4. Confirm company chrome shows Greenleaf Xpress only.
5. More → System: note Release SHA vs expected branch commit.

### C. Authenticated BST Preview validation

Same as B with BST credentials; confirm BST Expedite Inc only; no GLX leakage.

### D. Admin driver/truck selection

1. Sign in as verified admin with Showcase grant (after A).
2. Open `/submissions/bol-pod`; confirm Admin Upload Mode + driver select.
3. Exercise truck selection if roster loads; do not submit production documents unless intentionally testing in a safe environment.

### E. Decide desktop branch join strategy

Option recommended: stack desktop onto RC1 after hardening review — merge hardening first (or include both commits in one PR from `codex/driver-rc1-desktop-shell`).

### F. PR readiness / merge / Production

1. Push branches (commands below).
2. Open or update PR against `main` (or retarget PR #4).
3. Mark ready only after A–D.
4. Merge only with owner approval.
5. Wait for Netlify Production deploy.
6. Smoke test; declare parity or roll back.

### Exact next commands (owner machine with `gh` + remotes)

```bash
git checkout codex/driver-rc1-release-hardening
git push -u origin HEAD

git checkout codex/driver-rc1-desktop-shell
git push -u origin HEAD

# Then open PRs, e.g.:
gh pr create --base feature/driver-experience-cursor --head codex/driver-rc1-release-hardening --title "fix(driver): RC1 release hardening" --body "..."
gh pr create --base codex/driver-rc1-release-hardening --head codex/driver-rc1-desktop-shell --title "feat(driver): RC1 desktop shell" --body "..."
```

---

## 11. Proposed release sequence

1. Review `codex/driver-rc1-release-hardening` (`0f1aadff`).
2. Add and verify `SHOWCASE_GRANT_SECRET` on Deploy Preview.
3. Complete authenticated GLX + BST Preview validation.
4. Decide: desktop (`690d63a2`) joins RC1 now or immediately after hardening merge.
5. Mark approved PR ready (update draft PR #4 or replace with hardening/desktop stack).
6. Merge approved commit(s) — **owner only**.
7. Wait for Netlify Production deployment.
8. Post-deploy smoke: login GLX/BST, `/today` empty honesty, capture entry, pay disconnected, release SHA matches.
9. Declare Live/Preview parity for intended generation.
10. If critical gate fails → roll back to deploy `6a600fc332744c00088d4f1a` / commit `b2c1f105`.

---

## 12. Rollback

| | |
|--|--|
| **Known-good deploy** | `6a600fc332744c00088d4f1a` |
| **Known-good commit** | `b2c1f105` |

**Triggers:** Production shows fabricated loads again; tenant leakage; upload auth weakened; Showcase writing to production; critical login/upload outage after RC1 publish.

**Verification after rollback:** Login works; upload gateway healthy; no RC1-only routes required for legacy ops; SHA/deploy ID match baseline.

---

## 13. Final status

| Track | Status |
|-------|--------|
| Release hardening | **RELEASE HARDENING COMPLETE — HUMAN VALIDATION REQUIRED** |
| Desktop UX | **DESKTOP RC1 READY FOR REVIEW** |
| Overall | **READY FOR OWNER REVIEW** |

### Branch / SHA cheat sheet

```
RC1 baseline:     53691102  feature/driver-experience-cursor
Hardening:        0f1aadff  codex/driver-rc1-release-hardening
Desktop shell:    690d63a2  codex/driver-rc1-desktop-shell
Production main:  b2c1f105  deploy 6a600fc332744c00088d4f1a
```
