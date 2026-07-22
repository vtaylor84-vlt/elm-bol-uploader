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
| **6** | Quality & evidence | **In progress** |
| **7** | Push / draft PR / Deploy Preview | **In progress** |

---

## Commits on this branch

1. `852cc247` — docs(driver): translate driver app vision into showcase specification  
2. `306c1136` — feat(driver): add typed showcase fixture data foundation  
3. `6e84d0cc` — feat(driver): upgrade navigation and shared experience components  
4. `0f916250` — feat(driver): build showcase today loads capture pay messages equipment safety and more (+ tests)

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
