# ELM CONNECT Driver App — Capability Matrix

Maps each meaningful capability from the source vision (43 areas + critical sub-capabilities) to module, workflow, Showcase status, production integration, data source, security, acceptance criteria, and future phase.

**Legend — Showcase status**

| Status | Meaning |
|--------|---------|
| **Implemented** | Presentable Showcase UI with fixtures / simulated actions on this branch |
| **Partial** | Some UI or narrative exists; incomplete vs vision |
| **Deferred** | Out of Showcase branch deliverables |

**Legend — Production integration**

| Status | Meaning |
|--------|---------|
| **Live** | Connected path in production experience |
| **Disconnected** | UI exists with truthful empty / not-connected messaging |
| **None** | No production surface yet |
| **Platform** | Cross-cutting infra (auth, gateway, Sheets/Drive) |

---

## Counts (top-level capability areas 1–43)

| Metric | Count |
|--------|------:|
| Total capability areas (source) | **43** |
| Showcase **Implemented** (planned / in-branch presentation ready) | **6** |
| Showcase **Partial** | **16** |
| Showcase **Deferred** | **21** |
| Production **Live** (meaningful driver path today) | **3** |
| Production **Disconnected** / empty-truthful | **4** |

**Showcase Implemented (6):** §2 Today home (Mission Control), §3 Loads list (fixture), §6 Document upload *simulation* in Showcase Capture, §8 Pay *demo summary*, §11 Messages *fixture inbox*, §13 Truck/Equipment *fixture status*.

**Showcase Partial (16):** §1 Access (grant gate only), §4 Guided workflow (milestones), §7 Receipts (sim), §12 Exceptions (Today cards), §15 Maintenance (scenario + sim), §16 Safety module, §22 Home Time, §23 Benefits, §24 Training (sim), §27 Performance, §29 Timeline, §31 AI Assistant (sim), §33 Accessibility (partial platform), §34 Notifications (via Today exceptions only), §36 Offline (prod vault; Showcase N/A), §40 Security (core controls).

**Showcase Deferred (21):** §5 Navigation, §9 Escrow ledgers, §10 Payroll timeline, §14 DVIR, §17 Accident response, §18 HOS/ELD, §19 Fuel intelligence, §20 Scale/cargo tools, §21 Parking, §25 Recruiting, §26 Referral, §28 Recognition, §30 Global search, §32 Multilingual, §35 Support center, §37 Office console, §38 Executive analytics, §39 Broad integrations (beyond current stack), §41 Owner-operator board, §42 Financial tools suite, §43 Community.

*Sub-capability rows below refine the same 43 areas; they do not change the top-level totals.*

---

## Matrix

| ID | Capability | Primary module | Screen / workflow | Showcase status | Production integration | Data source | Security considerations | Acceptance criteria (summary) | Future phase |
|----|------------|----------------|-------------------|-----------------|------------------------|-------------|-------------------------|-------------------------------|--------------|
| 1.1 | Roster / company-scoped session | More / Login | Login → Connecting → Today | Partial | Live | Driver_Master via GAS `getDrivers` | Session company, not free client companyId | Driver sees only allowed company roster | Identity / SSO |
| 1.2 | MFA / passkey / biometric | Login | — | Deferred | None | — | — | — | Identity |
| 1.3 | Showcase admin grant | More | Enter Showcase | Implemented | Platform | Netlify `showcase-access` + grant secret | Fail-closed without secret; admin-only | Non-admin denied; expired grant denied | Harden grant UX |
| 2.1 | Attention-first Today dashboard | Today | Mission Control | Implemented | Disconnected | Showcase pack / Production empty adapter | No prod fixtures on `/today` | Showcase labeled DEMO; prod empty truthful | Live TMS feed |
| 2.2 | Exceptions + required actions | Today | Exception cards / tasks | Partial | Disconnected | Scenario fixtures | Disclosure chips required | Critical items deep-link to action | Live alerts engine |
| 2.3 | Earnings / escrow snippet on home | Today / Pay | Earnings card | Partial | Disconnected | Fixture pay fields | Must say DEMONSTRATION / NOT CONNECTED | Never imply live payroll | Payroll API |
| 3.1 | Active + history load list | Loads | Loads page | Implemented | Disconnected | Fixture loads / empty prod | Carrier-scoped seeds only | GLX never shows BST load numbers | TMS |
| 3.2 | Full multi-stop / LTL detail | Loads | Load detail | Deferred | None | — | — | — | TMS |
| 3.3 | Attached docs / rate conf / pay on load | Loads / Capture | — | Deferred | None | — | Field separation loadNum/bolNum/loadId | — | Intake + TMS |
| 4.1 | Status state machine | Loads | Status updates | Deferred | None | — | Prevent invalid transitions server-side | — | Dispatch |
| 4.2 | Fixture milestones / status labels | Today / Loads | Active haul milestones | Partial | None | Scenario pack | Label as demo | Matches scenarioId | Live geofence |
| 5.* | Commercial navigation | Today | — | Deferred | None | External nav provider | No invented routing claims | — | Nav partner |
| 6.1 | BOL/POD live upload | Capture | `/submissions/bol-pod` → review → success | N/A (prod) | Live | Netlify upload → GAS → Drive/DB_Docs | Token server-side only; MIME/size limits | Files land in tenant folder; intake row | OCR later |
| 6.2 | Showcase simulated BOL/POD | Capture | Showcase Capture sim | Implemented | None (blocked) | Showcase action port | Must not call upload client | Network: no production upload | Keep sim forever for demos |
| 6.3 | OCR / auto-classify / edge detect | Capture | — | Deferred | None | — | — | — | Doc AI |
| 7.1 | Receipt live upload | Capture | `/submissions/receipt` | N/A (prod) | Live | Same gateway | Same as 6.1 | Expense intake recorded | Policy engine |
| 7.2 | Showcase expense sim | Capture | Sim expense module | Partial | None | Action port | Blocked from prod write | Sim confirmation only | — |
| 7.3 | Reimbursement workflow statuses | Pay | — | Deferred | None | — | Append-only accounting | — | Payroll |
| 8.1 | Production Pay page | Pay | Disconnected copy | Partial UI | Disconnected | Production adapter | No fake numbers | Shows NOT CONNECTED | Payroll |
| 8.2 | Showcase pay summary | Pay | Gross/deductions/net demo | Implemented | None | Fixture pay | DEMONSTRATION DATA chip | Carrier-specific demo figures only | — |
| 8.3 | Line-item explanations + disputes | Pay | — | Deferred | None | — | No silent financial changes | — | Payroll |
| 9.* | Escrow / savings ledgers | Pay | — | Deferred | None | Ledger | Every $ must trace | — | Finance |
| 10.* | Payroll transparency timeline | Pay | — | Deferred | None | Payroll system | Immutable snapshots | — | Payroll |
| 11.1 | Showcase message list + ack | Messages | `/showcase/messages` | Implemented | None | Fixture messages | Demo only; no SMS send | Ack returns SIMULATED ACTION | Messaging service |
| 11.2 | Production inbox | Messages | — | Deferred | None | — | — | — | Messaging |
| 11.3 | Upload notification email/SMS | Notifications | GAS notifications | Deferred as inbox | Live (outbound) | GAS `05_App_Notifications` | No PII in logs | Ops receive upload alerts | Preferential channels |
| 12.1 | Exception cards (scenarios) | Today | Exception list | Partial | None | Scenario pack | Demo narrative | Scenario switches content | Case mgmt |
| 12.2 | Guided issue case system | Messages / Today | — | Deferred | None | — | Audit timeline | — | Cases |
| 13.1 | Showcase truck/trailer status | Equipment | `/showcase/truck` | Implemented | None | Fixture truck | Carrier-scoped units | GLX-441 vs T-204 isolation | Telematics |
| 13.2 | Live equipment master | Equipment | — | Deferred | None | — | — | — | Fleet |
| 14.* | Digital DVIR | Equipment / Safety | — | Deferred | None | — | Retention rules **Unconfirmed** | — | Compliance |
| 15.1 | Maintenance scenario + sim request | Equipment | Truck + action | Partial | None | Scenario + action port | Sim only | No real roadside ticket | Maintenance CRM |
| 15.2 | Full breakdown assistance | Equipment | — | Deferred | None | — | Emergency escalation **Unconfirmed** | — | Roadside partners |
| 16.1 | Showcase safety status | Safety | `/showcase/safety` | Partial | None | Fixture safety | Fair/contextual — no punishment UX | Review scenario shows open items | Safety platform |
| 16.2 | Dashcam / coaching feeds | Safety | — | Deferred | None | Telematics | Privacy controls | — | Safety |
| 17.* | Accident response workflow | Safety | — | Deferred | None | — | Immutable timeline | — | Claims |
| 18.* | HOS / ELD integration | Safety / Today | — | Deferred | None | Certified ELD | Do not become ELD v1 | — | ELD partner |
| 19.* | Fuel intelligence | Equipment / Capture | — | Deferred | None | Fuel card | Theft/suspicious alerts | — | Fuel partners |
| 20.* | Scale / weight / cargo tools | Capture / Loads | — | Deferred | None | CAT Scale etc. | — | — | Scale partners |
| 21.* | Parking / convenience | Today / More | — | Deferred | None | — | — | — | Places data |
| 22.1 | Showcase home time | More | `/showcase/home-time` | Partial | None | Fixture + sim | FUTURE CAPABILITY label | Sim request OK | Dispatch |
| 22.2 | Live PTO / home-time | More | — | Deferred | None | HR/dispatch | — | — | HR |
| 23.1 | Showcase benefits card | More | `/showcase/benefits` | Partial | None | Fixture | Prefer HR link for sensitive data | FUTURE CAPABILITY | HR platform |
| 23.2 | Live benefits / W-2 / tax | More | — | Deferred | None | HR | Minimal local storage of PII | — | HR |
| 24.1 | Training sim (new_driver) | More / AI | Scenario + action | Partial | None | Action port | — | Sim complete training | LMS |
| 24.2 | Full learning center | More | — | Deferred | None | — | Offline materials **Unconfirmed** set | — | LMS |
| 25.* | Recruiting / onboarding portal | More | — | Deferred | None | — | Clearinghouse consent | — | Recruiting |
| 26.* | Referral program | More | — | Deferred | None | — | Anti-fraud | — | Recruiting |
| 27.1 | Showcase performance | More | `/showcase/performance` | Partial | None | Fixture | Explainable metrics only | Demo % labels | Analytics |
| 27.2 | Live performance center | More | — | Deferred | None | — | Driver-controllable factors | — | Analytics |
| 28.* | Recognition / rewards | More / Safety | — | Deferred | None | — | No unsafe gamification | — | Engagement |
| 29.1 | Showcase timeline | More | `/showcase/timeline` | Partial | None | Fixture events | — | Events carrier-scoped | Unified timeline |
| 29.2 | Full lifecycle timeline | More | — | Deferred | None | All domains | Audit open-from-event | — | Platform core |
| 30.* | Global natural-language search | Search | — | Deferred | None | Index | Tenant filter mandatory | — | Search |
| 31.1 | Showcase AI assistant | AI | `/showcase/assistant` | Partial | None | Simulated replies | Must not invent financial truth | Disclosure SIMULATED; no prod writes | Guardrailed AI |
| 31.2 | Production AI on authorized data | AI | — | Deferred | None | Authorized APIs only | Hard deny list (pay alter, etc.) | — | AI |
| 32.* | Multilingual | Cross-cutting | — | Deferred | None | — | Legal/safety human review | — | i18n |
| 33.1 | A11y basics / large targets | Cross-cutting | Shell / forms | Partial | Platform | — | Login a11y gate in CI | Touch targets usable | Continuous |
| 33.2 | Driving mode / TTS / text size | Cross-cutting | — | Deferred | None | — | — | — | A11y |
| 34.1 | Today attention as proto-notifications | Notifications / Today | Exceptions | Partial | None | Fixtures | — | Deep links work in Showcase | Push service |
| 34.2 | Full notification center | Notifications | — | Deferred | None | — | Quiet hours / emergency override | — | Push/SMS |
| 35.* | Support center | More | — | Deferred | None | — | — | — | Support |
| 36.1 | Offline upload vault | Capture | `multi_vault` | Partial (prod) | Live | localStorage | No secrets in vault payload beyond needed fields | Retry without dupes **Unconfirmed** exact dedupe | Sync service |
| 36.2 | Offline loads/status/inspections | Cross-cutting | — | Deferred | None | Cache | Conflict policy **Unconfirmed** | — | Offline sync |
| 37.* | Office admin console | Office | — | Deferred | None | — | Company isolation | — | Ops console |
| 38.* | Executive analytics | Office | — | Deferred | None | — | Multi-company only if authorized | — | BI |
| 39.1 | Sheets / Drive / Netlify / GAS / email-SMS | Platform | Upload + roster | Partial vs vision list | Live | Current stack | Secrets in env/properties only | Upload E2E works | Expand partners |
| 39.2 | ELD / nav / fuel / HR / TMS | Platform | — | Deferred | None | Partners | — | — | Integration roadmap |
| 40.1 | Upload auth + company isolation | Platform | Gateway + GAS | Implemented (core) | Live | Token + allow lists | Never expose UPLOAD_TOKEN to client | Unauthorized upload rejected | Continuous |
| 40.2 | Showcase write isolation | Platform | Action port / gateway | Implemented | Platform | Fixtures | Showcase cannot write prod | Upload from Showcase path rejected | Continuous |
| 40.3 | Malware scan / legal hold / device mgmt | Platform | — | Deferred | None | — | — | — | Security hardening |
| 41.* | Owner-operator load board | Loads / Pay | — | Deferred | None | — | Rate visibility rules **Unconfirmed** | — | O/O |
| 42.* | Financial tools / tax estimates | Pay | — | Deferred | None | — | Distinguish estimate vs actual | — | Finance UX |
| 43.* | Driver community | More / Messages | — | Deferred | None | — | Moderation required | — | Community |

---

## Module rollup

| Module | Implemented | Partial | Deferred | Notes |
|--------|------------:|--------:|---------:|-------|
| Today | 1 | 3 | 1 | Core Showcase home |
| Loads | 1 | 1 | 3 | List yes; deep load ops later |
| Capture | 1 | 2 | 2 | Prod live + Showcase sim |
| Pay | 1 | 1 | 5 | Showcase demo; prod disconnected |
| Messages | 1 | 0 | 2 | Showcase inbox only |
| Equipment | 1 | 1 | 4 | Truck module + maintenance partial |
| Safety | 0 | 1 | 4 | Safety status partial |
| More | 0 | 5 | 6 | Hub for future modules |
| Notifications | 0 | 1 | 1 | Proto via Today |
| Search | 0 | 0 | 1 | Deferred |
| AI | 0 | 1 | 1 | Simulated only |
| Platform / cross-cutting | 2 | 3 | 8 | Security + vault + i18n etc. |

---

## Business rules requiring confirmation (do not invent)

| Topic | Why flagged |
|-------|-------------|
| English-proficiency acknowledgement triggers | Legal/ops — source says “where required” |
| Rate confirmation visibility to drivers | “Where appropriate” |
| Status-transition approval matrix | Not specified |
| Reimbursement auto-approve rules | Policy validation mentioned, rules not listed |
| Escrow withdrawal authorization | “Where authorized” |
| FMCSA retention configuration | “Where applicable” |
| Offline conflict / dedupe algorithm | Mandatory offline, exact rules not specified |
| Owner-operator counteroffer permissions | “Where permitted” |
| Dark mode toggle vs existing dark Terminal UI | Source lists dark mode; platform rule forbids casual theme toggles |

---

*Derived from `ELM_CONNECT_DRIVER_APP_VISION.md` and current `feature/driver-experience-showcase` implementation.*
