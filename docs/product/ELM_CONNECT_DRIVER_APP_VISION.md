# ELM CONNECT Driver App — Product Vision

**Source:** `docs/product/ELM_CONNECT_DRIVER_APP_SOURCE.docx` (full text extracted for translation)  
**Platform:** ELM CONNECT (tenants: GLX, BST, future carriers)  
**Document role:** Authoritative product vision translated from the source capability brief.  
**Status labels used throughout**

| Label | Meaning |
|-------|---------|
| **Product vision** | Intended end-state capability from the source document |
| **Current capabilities** | Live today in production (roster login; BOL/POD/receipt upload via Netlify → GAS) |
| **Demonstration capabilities** | Showcase Mode fixtures / simulated UI on `feature/driver-experience-showcase` |
| **Future integrations** | External systems the source expects ELM CONNECT to connect to, not build alone |
| **Unconfirmed** | Business rule implied or incomplete in source — requires Product Owner confirmation |

---

## North star

When finished, ELM CONNECT should **not** feel like a document uploader or carrier portal. It should function as the driver’s **complete operating system** for work, pay, equipment, communication, safety, and employment.

At full maturity, the product connects the entire driver lifecycle:

> Recruiting → Application → Onboarding → Credentials → Truck Assignment → Dispatch → Navigation → Documents → Expenses → Payroll → Settlement → Maintenance → Safety → Training → Home Time → Performance → Retention → Offboarding

The advantage is not feature count. Every feature must share the same **driver, load, truck, document, payroll, and timeline** context.

A driver should never have to wonder:

- Which app do I use?
- Who do I call?
- Was my document received?
- Why is my pay different?
- What is wrong with my truck request?
- When do I need to be there?
- What am I supposed to do next?

ELM CONNECT should answer those questions immediately.

---

## Capability areas (1–43)

### 1. Secure Driver Access

**Product vision**

- Driver login using email, phone, employee ID, passkey, or single sign-on
- Multi-factor authentication; biometric login; secure session management
- Company-specific access for GLX, BST, and future carriers
- Role-based access for drivers, owner-operators, trainees, trainers, and administrators
- Device registration and trusted-device controls
- Password and account recovery
- Language selection before or after login
- English-proficiency acknowledgement where legally and operationally required
- Privacy, consent, and policy acknowledgements
- Automatic account activation and deactivation based on driver status

**Current capabilities**

- Roster-gated driver selection / session for allowed companies (BST, GLX)
- Cosmetic splash / lock UX is **not** authentication (see platform standards)
- Server-side upload authorization via Netlify gateway + GAS `UPLOAD_TOKEN`

**Demonstration capabilities**

- Showcase Mode entry gated to verified admins with server-backed grant
- Demo personas per carrier (GLX/BST) for presentation — not production identity

**Future integrations**

- Unified SSO / identity provider; passkeys; device trust services

**Unconfirmed**

- Exact legal triggers for English-proficiency acknowledgement by jurisdiction
- Which roles beyond driver/admin are in scope for RC1 vs later phases

---

### 2. Personalized Driver Home

**Product vision**

The dashboard immediately answers: *What am I doing now? Where do I need to be? What is due? What requires my attention? What am I getting paid?*

Dashboard capabilities include: current load; next stop; appointment countdown; current truck and trailer; ETA; remaining required actions; missing documents; payroll status; pending reimbursements; escrow and savings balances; HOS summary; weather and route alerts; maintenance warnings; safety or compliance alerts; messages requiring acknowledgement; upcoming home time; training due; license or medical-card expiration; quick actions customized to the driver’s situation.

**Current capabilities**

- Production **Today** surface with truthful empty / not-connected states when no live load service is connected
- Primary path into live Capture (BOL/POD / expenses)

**Demonstration capabilities**

- Showcase **Today** (Mission Control) with carrier-scoped fixtures, exceptions, tasks, earnings preview, and scenario packs

**Unconfirmed**

- Priority ranking rules when multiple alerts compete for attention
- Exact payroll / escrow fields shown on home before settlement systems are connected

---

### 3. Load and Trip Management

**Product vision**

Current, upcoming, completed, cancelled loads; load history; multi-stop; LTL and partial loads; pickup / transfer / warehouse / delivery events; driver handoff; load and customer reference numbers; broker; shipper/receiver; commodity; weight; dimensions and pallet count; special handling; temperature; hazmat; appointments; dock; gate code; facility contacts; detention and lumper instructions; seal numbers; trailer and warehouse assignment; stop sequence; load / driver / dispatch notes; attached rate confirmation where appropriate; attached BOL, POD, receipts, photos; load-specific message, incident, and pay history.

**Current capabilities**

- Production Loads: empty / not-connected messaging; Capture for document submission against driver-entered identifiers
- Critical field separation preserved: `loadNum` ≠ `bolNum` ≠ `loadId`

**Demonstration capabilities**

- Showcase Loads list with active + historical demo loads (carrier-scoped DEMO seeds)

**Future integrations**

- TMS / dispatch systems as system of record for live loads

**Unconfirmed**

- Whether rate confirmations are always visible to drivers or role-gated
- Handoff ownership rules across pickup / transit / delivery drivers

---

### 4. Guided Load Workflow

**Product vision**

Operational states from Assigned through Closed (including document and payroll/invoicing readiness). Capabilities: one-touch status updates; automatic timestamps; GPS-supported arrival/departure; geofence suggestions; required fields by stage; prevention of invalid status changes; exception reasons; dispatcher notification; customer-update automation; check-call reduction; complete load-event timeline.

**Current capabilities**

- Not a live status engine in production today

**Demonstration capabilities**

- Fixture milestones and status labels (e.g., En route, At delivery, Breakdown) within scenario packs — presentation only

**Future integrations**

- Geofencing / telematics providers; customer notification channels

**Unconfirmed**

- Canonical state machine and which transitions require dispatcher approval

---

### 5. Truck-Specific Navigation and Route Intelligence

**Product vision**

Commercial vehicle turn-by-turn; height/weight/width/length restrictions; hazmat routing; low-clearance, weight-restricted roads, bridges, toll preferences, truck-prohibited roads; construction, closures, traffic; weather overlays (high wind, flood, snow/ice, mountain pass, steep grade); weigh / inspection stations; truck parking availability; rest areas; fuel; repair; company terminals; approved warehouses; route deviation alerts; revised ETA; automated ETA to dispatch; route history and actual-vs-planned analysis.

**Source directive (confirmed in brief):** ELM CONNECT should **integrate with a proven commercial navigation provider** rather than building its own navigation engine from scratch.

**Current / demonstration**

- Not implemented as live navigation
- Weather delay scenario exists as Showcase fixture narrative only

**Future integrations**

- Commercial truck navigation provider; weather/traffic data; weigh-station / PrePass-class services

---

### 6. BOL, POD, Photo, and Document Upload

**Product vision**

BOL, POD, freight/seal/loading/unloading/damage photos; receipts; scale tickets; inspection, accident, maintenance, and driver documents; multi-page / multi-image; camera and gallery; rotation, crop, edge detection, perspective correction; glare/blur and low-resolution warnings; missing signature/page warnings; duplicate detection; automatic classification and load matching; barcode/QR; OCR; reference/date/amount extraction; automatic filename; secure Drive or object storage; submission / processing / accepted / rejected statuses; rejection reason; resubmission; document history; search by load, date, driver, origin, destination, type, or extracted text.

**Current capabilities**

- Live BOL/POD and receipt upload path: **React → Netlify `upload` function → GAS UploadHandler → Drive + DB_Docs → notifications**
- Gateway limits: 20 files max, 10 MB/file, 50 MB total, JPG/PNG (HEIC blocked at gateway)
- Offline vault (`multi_vault`) for failed uploads

**Demonstration capabilities**

- Showcase Capture modules labeled **SIMULATED ACTION** — must not call production upload

**Unconfirmed**

- Which OCR / classification vendors are approved
- Auto load-matching rules when identifiers conflict

---

### 7. Receipt and Reimbursement Management

**Product vision**

Expense types (fuel, toll, scale, parking, truck wash, hotel, lumper, warehouse fee, repair, maintenance, transportation, permit, other); fields (date, vendor, type, amount, truck, load, paid-with, reimbursement flag, receipt, notes, accounting comments); workflow Submitted → … → Reimbursed / Disputed / Corrected; OCR; duplicate detection; missing-receipt alerts; policy validation; out-of-policy warning; reimbursement ETA; link to settlement where paid.

**Current capabilities**

- Production expense / receipt capture and upload through the secure gateway

**Demonstration capabilities**

- Simulated expense submission in Showcase

**Unconfirmed**

- Per-company reimbursement policy matrices
- Which expense types auto-approve vs always require review

---

### 8. Driver Pay and Settlement Center

**Product vision**

Payroll period; estimated / pending / approved / paid trip pay; mileage, CPM, flat weekly, salary, salary+CPM, revenue-share, daily, trip, hybrid; layover, detention, extra-stop, pickup, delivery, breakdown pay; bonuses and incentives; reimbursements; advances; adjustments; escrow/savings and other deductions; gross/net; YTD; prior settlements; downloadable/email statements; payment status/date/method; pending issues; driver acknowledgement; dispute workflow; explanation for every line item; links from pay items to originating load/event.

**Current capabilities**

- Production Pay: **explicitly disconnected** — truthful “not connected” messaging (no live payroll)

**Demonstration capabilities**

- Showcase Pay summary with **DEMONSTRATION DATA** disclosure

**Unconfirmed**

- Compensation model variants per carrier and which appear in driver UI
- Dispute SLA and ownership (payroll vs dispatch)

---

### 9. Escrow, Savings, and Driver Accounts

**Product vision**

Escrow and savings balances, targets, weekly contributions, full transaction history, opening balances, adjustments, reversals, refunds, authorized withdrawals, projections, account rules, effective dates, acknowledgements, downloadable statements, full audit history.

**Source rule (confirmed in brief):** The portal should **never show an unexplained balance**. Every dollar must trace to a specific payroll period and ledger event.

**Current / demonstration**

- Not live; not a dedicated Showcase ledger UI in current branch scope beyond home/pay narrative mentions

**Unconfirmed**

- Withdrawal authorization policy; interest or fee rules (if any)

---

### 10. Payroll Timeline and Transparency

**Product vision**

Visual timeline per payroll cycle from driver submission through payment completed. Driver sees current stage, next step, owner of next action, blockers, whether driver action is required, estimated payment date.

**Current / demonstration**

- Not a live timeline; Showcase “payroll_ready” scenario is narrative only

---

### 11. Driver Messages and Communication Center

**Product vision**

Direct messaging with dispatch, payroll, safety, maintenance, HR, fleet; conversations scoped to load, truck, settlement, or issue; attachments; voice; read receipts; required acknowledgements; priority; urgent escalation; templates; translation; searchable history; push / SMS / email fallback; quiet hours; emergency override; company announcements; fleet-wide alerts.

**Source rule (confirmed):** Messages should always be connected to the relevant load, truck, settlement, or case — not unstructured chat.

**Demonstration capabilities**

- Showcase Messages module with demo threads + simulate acknowledge

**Current capabilities**

- Upload-related email/SMS notifications from GAS (not a full inbox)

---

### 12. Driver Issue and Exception Reporting

**Product vision**

Report pickup/delivery delay, refusal, damage, shortage/overage/missing/wrong freight, seal, lumper, detention, layover, route, unsafe facility, equipment/trailer, accident, citation, inspection, injury, payroll/document issues, other exceptions. Guided forms; photos/video; GPS; timestamp; severity; escalation; owner; status; resolution; acknowledgement; case timeline.

**Demonstration capabilities**

- Exception cards on Showcase Today for selected scenarios (presentation)

**Unconfirmed**

- Severity taxonomy and auto-escalation matrix

---

### 13. Truck and Trailer Center

**Product vision**

Assigned truck/trailer identity and credentials (VIN, unit, make/model/year, plate, registration, insurance, IFTA, permits); inspection status; mileage; fuel/DEF where integrated; tires; fault codes; open defects; maintenance/repair history; PM schedule; oil-change countdown; annual inspection / registration / insurance expiration; trailer location/condition/inspection; equipment documents; emergency roadside information.

**Demonstration capabilities**

- Showcase Truck module with demo unit status

---

### 14. Digital DVIR and Inspection Workflow

**Product vision**

Pre/post-trip; tractor/trailer; custom checklists; pass/fail; defect severity; photos; notes; signature; GPS/timestamp; mechanic review; repair assignment; OOS; repair certification; reinspection; history; FMCSA-compliant retention where applicable; defect trends.

**Unconfirmed**

- Exact checklist content per carrier and FMCSA retention configuration

---

### 15. Maintenance and Breakdown Assistance

**Product vision**

Maintenance request with equipment choice, category, symptoms, media, fault code, location, drivability, load status, safety risk; emergency escalation; repair facility; appointment; roadside ETA; repair/parts status; ETA; driver updates; authorization; replacement truck; hotel/transport assistance; downtime and breakdown-pay tracking; full case history.

**Demonstration capabilities**

- Maintenance / road_breakdown scenarios; simulate maintenance request action

---

### 16. Safety Center

**Product vision**

Safety score; inspection/violation/accident/citation history; dashcam and coaching events; harsh events; trends; acknowledgement; dispute; corrective action; training; recognition; milestones; documents; emergency procedures; accident-response workflow; drug/alcohol policy; regulatory updates.

**Source rule (confirmed):** Safety data must be contextual and fair — help drivers improve, **not** function as a hidden punishment system.

**Demonstration capabilities**

- Showcase Safety module + safety_review scenario

---

### 17. Accident and Incident Response

**Product vision**

Emergency call shortcut; confirm safety; notify dispatch/safety; GPS; datetime; other-party / vehicle / insurance / witness / police / injury / cargo / equipment; scene media; diagram; statement; document checklist; towing; repair routing; drug-testing instructions; follow-up; case status; claims; **immutable** incident timeline.

---

### 18. HOS, ELD, and Compliance Integration

**Product vision**

Duty status; drive/shift/cycle remaining; break; violation-risk; recap forecast; split-sleeper where supported; ELD deep link and sync; unassigned-drive alerts; log certification; malfunction reporting; PC/yard-move guidance; inspection-mode; DQ / license / medical / MVR / Clearinghouse / permits.

**Source directive (confirmed):** Integrate with **certified ELD providers**; do **not** become the certified ELD in the first major release.

---

### 19. Fuel and Cost Intelligence

**Product vision**

Approved stops; prices; route-based recommendations; fuel card; authorization; gallons/cost/odometer; MPG; idle; economy trends; CPM fuel cost; DEF; receipts; missing receipt; exceptions; suspicious / out-of-route alerts; theft reporting; estimated savings; fuel-advance integration.

---

### 20. Scale, Weight, and Cargo Tools

**Product vision**

CAT Scale integration; electronic tickets; axle weights; reweigh history; compliance warnings; load-weight comparison; tandem notes; trailer configuration; securement checklist; seal capture; freight-condition and temperature/reefer reporting; overweight escalation; permit request; load-rework documentation.

---

### 21. Parking and Driver Convenience

**Product vision**

Parking search/availability/reservations; rest areas; truck-stop amenities; showers; laundry; restaurants; repair; Wi-Fi; approved hotels; terminals; safe-parking recommendations; driver facility ratings; notes on bathrooms, overnight parking, security, wait times.

---

### 22. Home Time, PTO, and Availability

**Product vision**

Request home time / PTO / unpaid leave; preferred dates, lanes, regions; availability; pending/approved/rejected with reasons and alternatives; PTO balance; upcoming home time; return-to-work; calendar; dispatch coordination; reminders; emergency leave.

**Demonstration capabilities**

- Showcase Home Time module + simulate request

---

### 23. Benefits and HR Self-Service

**Product vision**

Benefits summary (medical, dental, vision, life, retirement, HSA/FSA); enrollment; open-enrollment reminders; beneficiaries; emergency contacts; direct deposit; tax forms; W-2; employment verification; handbook/policies/agreements/contracts; HR cases; directory.

**Source note (confirmed):** Sensitive fields may **link to a secure HR platform** rather than being stored directly in ELM CONNECT.

**Demonstration capabilities**

- Showcase Benefits module with FUTURE CAPABILITY disclosure

---

### 24. Training and Learning Center

**Product vision**

Orientation and safety/hazmat/securement/defensive/accident/customer/equipment/policy training; videos; materials; quizzes; certifications; e-sign; assignments; due dates; reminders; history; expiration; trainer comments; questions; certificates; multilingual; offline for selected materials.

**Demonstration capabilities**

- New-driver scenario + simulate complete training action

---

### 25. Driver Recruiting and Onboarding

**Product vision**

Applicant portal connected to active driver app: job listings, matching, language, application, resume/CDL/medical uploads, MVR and employment/driving/accident history, Clearinghouse and background consent, interview, recruiter messaging, status, offer, e-sign, orientation/travel, checklists, road test, training, payroll/direct-deposit setup, truck assignment, conversion to active driver without duplicate entry.

---

### 26. Referral Program

**Product vision**

Submit/track referrals; eligibility; bonus; milestones; expected payment; paid history; shareable link/QR/social; leaderboard where appropriate; anti-fraud controls.

---

### 27. Driver Performance Center

**Product vision**

Miles (weekly/monthly/YTD); revenue and pay metrics; fuel/idle; on-time pickup/delivery; document speed; safety/inspection; service failures; detention/layovers; downtime; customer ratings where appropriate; trends; goals; recognition; incentive progress.

**Source rule (confirmed):** Performance information should be transparent, explainable, and based on factors the driver can **actually control**.

**Demonstration capabilities**

- Showcase Performance module with demo scorecard

---

### 28. Recognition and Rewards

**Product vision**

Safe-mile milestones; accident-free streaks; clean inspection; fuel efficiency; on-time; training; anniversaries; driver of the month; referral recognition; customer compliments; company feed; badges; bonus eligibility; reward history.

**Source rule (confirmed):** Avoid gimmicky competition that encourages speeding, skipped breaks, or unsafe behavior.

---

### 29. Driver Timeline

**Product vision — defining feature**

Complete chronological record from application through offboarding: credentials, equipment, loads, stops, statuses, documents, expenses, reimbursements, payrolls, settlements, escrow, savings, advances, messages, maintenance, repairs, inspections, violations, accidents, training, home time, bonuses, recognition, corrective actions, employment changes.

Every event opens to source records, documents, participants, status, and audit history.

**Demonstration capabilities**

- Showcase Timeline module with demo events

---

### 30. Search Across Everything

**Product vision**

Natural-language examples (settlements, PODs, deductions, lumper receipts, medical card, damaged freight, inspections, truck repairs). Domains: loads, stops, documents, messages, payroll, settlements, expenses, maintenance, safety, training, policies, equipment, timeline.

---

### 31. ELM AI Driver Assistant

**Product vision**

Use **authorized** ELM CONNECT data only; never invent operational or financial answers. Explain load/instructions; locate documents; explain settlement/escrow/savings; missing paperwork; draft delay updates; start maintenance/incident; guide accident procedures; policy Q&A; translate; summarize messages; required actions; contacts; expirations; missing info; safe next steps; escalate to human when uncertainty matters.

**Must not:** alter pay; approve expenses; change load status without confirmation; release payments; modify logs; merge identities; make compliance claims without verified data.

**Demonstration capabilities**

- Showcase Assistant with **SIMULATED ACTION** replies only

---

### 32. Multilingual Experience

**Product vision**

Language selector; full UI translation; translated instructions/training/policy summaries; message translation; voice-to-text / text-to-speech; search in supported languages; driver submits in preferred language; office sees original + translation; English-proficiency disclosure where required; critical legal/safety language professionally reviewed (not machine-only).

---

### 33. Accessibility and Ease of Use

**Product vision**

Large touch targets; high contrast; adjustable text; screen reader; voice input; read-aloud; icons with labels; low-distraction driving mode; minimal typing; smart defaults; saved preferences; one-handed workflows; dark mode; low-bandwidth; offline drafts; auto-retry; clear errors; progress; autosave; no unexplained technical errors.

**Note:** Source lists dark mode as a vision item. Platform UI rules require **not** adding dark/light toggles unless explicitly asked; Driver Terminal already uses the dark ELM CONNECT visual language.

---

### 34. Notifications and Alerts

**Product vision**

Categories: Critical (HOS risk, accident, unsafe equipment, appointment at risk, route closure, load rejection, required safety action, emergency company alert); Action Required (missing POD, rejected receipt, payroll question, training due, credential expiring, maintenance follow-up, message acknowledgement, home-time response); Informational (settlement, reimbursement, payment, load assigned, maintenance confirmed, news, recognition).

Capabilities: push, SMS, email, in-app inbox, preferences, quiet hours, urgency rules, escalation when ignored, history, deep links to required action.

---

### 35. Driver Support Center

**Product vision**

Help center; FAQs; how-tos; videos; payroll/dispatch/safety/maintenance/HR/tech support; case creation/status/assignee/history/attachments/escalation; emergency and after-hours contacts; call-back; SLAs.

---

### 36. Offline and Low-Connectivity Operation

**Product vision**

Cached load/stop/contact views; draft status updates; offline document/receipt/inspection/maintenance capture; queue messages; local timestamps; sync on reconnect; conflict handling; clear sync status; **no duplicate submissions**.

**Source rule (confirmed):** Mandatory for a trucking app — connectivity cannot be assumed.

**Current capabilities**

- Failed upload vault (`multi_vault`) with retry behavior for document submissions

---

### 37. Administrative and Office-Side Capabilities

**Product vision**

Operating console for office users: drivers, loads, status, map positions where authorized, missing docs, upload review accept/reject, expenses/reimbursements, payroll issues, load messages, maintenance/safety cases, training, home time, credentials, access, timelines, search, reports, notification config, branding, languages, audit history, corrections without overwriting history.

**Demonstration / current**

- Showcase admin grant gate is **not** the full office console

---

### 38. Management and Executive Analytics

**Product vision**

Fleet and people KPIs (utilization, miles, revenue, pay, fuel, CPM, downtime, on-time, document turnaround, payroll exceptions, reimbursement cycle, safety/inspection, retention/turnover, recruiting funnel, training/credential compliance, home-time fulfillment, support volume, satisfaction, portal adoption, feature usage, authorized multi-company comparison).

---

### 39. Integrations

**Product vision (potential)**

ELD (Samsara, Motive, Platform Science, Geotab, Omnitracs, Trimble); truck navigation; Drivewyze; PrePass; CAT Scale; fuel cards (Comdata, EFS, WEX); Pilot/Love’s/TA; payroll/banking; Workday or HR; background checks; FMCSA/Clearinghouse where permitted; mapping/geocoding; weather/traffic; email/SMS; Google Drive; Google Sheets (current phase); Netlify; cloud storage; accounting; TMS/dispatch; customer/broker visibility platforms.

**Current capabilities**

- Google Sheets + Drive + Netlify + GAS + email/SMS gateway

---

### 40. Security, Audit, and Data Protection

**Product vision**

Encryption in transit/at rest; RBAC; company isolation; least privilege; server-side authorization; secure upload validation; malware scanning; file-type restrictions; token expiration; session revocation; device management; suspicious-login detection; audit logs; immutable payroll snapshots; append-only financial ledgers; document versioning; correction history; before/after; actor+timestamp; export controls; retention; legal hold; privacy/consent; **no secrets in browser code**; **no silent financial changes**.

**Current capabilities**

- Upload token only in Netlify env + GAS Script Properties
- Origin allowlist, company allow list, file validation
- Tenant isolation (GLX/BST)
- Showcase grant fail-closed; Showcase writes must not hit production pipelines

---

### 41. Owner-Operator Capabilities

**Product vision**

Available-load board; search/recommendations; lane preferences; rate visibility; booking; offers/counteroffers where permitted; settlement; fuel/maintenance discounts; insurance/lease/equipment deductions; escrow; chargebacks; revenue/expense analytics; CPM/profit; estimated taxes; IFTA; documents; contractor compliance; fleet-driver management; multi-truck.

---

### 42. Driver Financial Tools

**Product vision**

Earnings goals; income trends; yearly projections; savings/escrow projections; expense tracking; estimated tax reserve for contractors; CPM calculator; home-time income impact; load profitability for O/Os; downloadable summaries; financial education.

**Source rule (confirmed):** Tools must clearly distinguish **estimates** from actual payroll and accounting truth.

---

### 43. Driver Community

**Product vision**

Company news; announcements; recognition; terminal updates; facility reviews; road conditions; parking tips; approved peer discussion; mentoring; trainer communication; new-driver support; events; surveys/polls; anonymous feedback; suggestion box.

**Source rule (confirmed):** Moderated and operationally useful — **not** another noisy social network.

---

## Traceability: vision section → primary module

| # | Capability area | Primary module |
|---|-----------------|----------------|
| 1 | Secure Driver Access | More (session) / Login (outside nav) |
| 2 | Personalized Driver Home | **Today** |
| 3 | Load and Trip Management | **Loads** |
| 4 | Guided Load Workflow | **Loads** / Today |
| 5 | Truck-Specific Navigation | **Today** / Loads (future deep link) |
| 6 | BOL, POD, Photo, Document Upload | **Capture** |
| 7 | Receipt and Reimbursement | **Capture** / Pay |
| 8 | Driver Pay and Settlement | **Pay** |
| 9 | Escrow, Savings, Accounts | **Pay** |
| 10 | Payroll Timeline | **Pay** |
| 11 | Messages and Communication | **Messages** |
| 12 | Issue and Exception Reporting | **Today** / Messages |
| 13 | Truck and Trailer Center | **Equipment** |
| 14 | Digital DVIR | **Equipment** / Safety |
| 15 | Maintenance and Breakdown | **Equipment** |
| 16 | Safety Center | **Safety** |
| 17 | Accident and Incident Response | **Safety** |
| 18 | HOS, ELD, Compliance | **Safety** / Today |
| 19 | Fuel and Cost Intelligence | **Equipment** / Capture |
| 20 | Scale, Weight, Cargo | **Capture** / Loads |
| 21 | Parking and Convenience | **Today** / More |
| 22 | Home Time, PTO, Availability | **More** (Home Time) |
| 23 | Benefits and HR | **More** (Benefits) |
| 24 | Training and Learning | **More** / Safety |
| 25 | Recruiting and Onboarding | **More** (future) |
| 26 | Referral Program | **More** |
| 27 | Driver Performance | **More** (Performance) |
| 28 | Recognition and Rewards | **More** / Safety |
| 29 | Driver Timeline | **More** (Timeline) |
| 30 | Search Across Everything | **Search** |
| 31 | ELM AI Driver Assistant | **AI** |
| 32 | Multilingual Experience | Cross-cutting (More / Login) |
| 33 | Accessibility and Ease of Use | Cross-cutting |
| 34 | Notifications and Alerts | **Notifications** |
| 35 | Driver Support Center | **More** |
| 36 | Offline and Low-Connectivity | Cross-cutting / Capture |
| 37 | Administrative Console | Outside driver nav (office) |
| 38 | Management Analytics | Outside driver nav (office) |
| 39 | Integrations | Platform |
| 40 | Security, Audit, Data Protection | Platform |
| 41 | Owner-Operator Capabilities | **Loads** / Pay / More |
| 42 | Driver Financial Tools | **Pay** |
| 43 | Driver Community | **More** / Messages |

---

## Related product docs

| Document | Purpose |
|----------|---------|
| `ELM_CONNECT_DRIVER_APP_CAPABILITY_MATRIX.md` | Capability → status mapping |
| `ELM_CONNECT_DRIVER_SHOWCASE_SCOPE.md` | Showcase deliver vs defer |
| `ELM_CONNECT_DRIVER_SCREEN_SPECIFICATIONS.md` | Screen specs |
| `ELM_CONNECT_DRIVER_FIXTURE_DATA_SPEC.md` | DEMO-* fixtures |
| `ELM_CONNECT_DRIVER_INTEGRATION_BOUNDARIES.md` | Production vs Showcase writes |
| `ELM_CONNECT_DRIVER_SHOWCASE_ACCEPTANCE_CRITERIA.md` | Owner acceptance tests |
| `ELM_CONNECT_DRIVER_SHOWCASE_PROGRESS.md` | Phase tracker |

---

*Source `.docx` remains at `docs/product/ELM_CONNECT_DRIVER_APP_SOURCE.docx`. Intermediate `_docx_extract.txt` is removed after vision translation.*
