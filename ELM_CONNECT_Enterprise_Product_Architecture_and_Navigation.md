# ELM CONNECT Enterprise Product Architecture & Navigation

**Status:** Proposed governing architecture  
**Date:** July 22, 2026  
**Scope:** Product taxonomy, information architecture, navigation, role adaptation, View As, Showcase, capability states, and long-term scale  
**Not in scope:** Visual styling, code, technical implementation, database architecture, or engineering sequencing

---

## 1. Executive Summary

ELM CONNECT should be organized as one platform containing a small number of durable business products, not as a dashboard containing a growing collection of buttons.

The strongest long-term architecture is:

1. **Operations** — loads, dispatch, trips, warehouse activity, and operational exceptions.
2. **Payroll** — driver earnings, rules, exceptions, approvals, settlements, payment handoff, and payroll history.
3. **Fleet** — vehicles, trailers, assignments, inspections, maintenance, fuel, and asset cost.
4. **Safety & Compliance** — qualifications, incidents, claims, training, HOS/ELD compliance, and regulatory readiness.
5. **Workforce** — recruiting, onboarding, worker profiles, employment records, availability, and offboarding.
6. **Finance** — billing, receivables, payables, expenses, reconciliations, profitability, and financial close.
7. **Analytics** — a governed analysis product for cross-domain dashboards, reports, metrics, and forecasting.

**Driver Workspace is not an eighth peer product.** It is a role-composed work surface that presents authorized capabilities from Operations, Payroll, Fleet, Safety & Compliance, Workforce, and shared platform services in one simple experience. This distinction is critical. Drivers think in tasks—what to do now, what to submit, what they earned—not in enterprise departments.

**ELM AI is not a product in the primary switcher.** It is a shared intelligence service surfaced through global search, contextual assistance, summaries, recommendations, and controlled actions.

The proposed names **Operate, Drive, Pay, Fleet, Safety, People, Finance, Insights** mix verbs, audiences, domains, and products. That symmetry looks neat but produces architectural ambiguity. The recommended names deliberately use stable business nouns. In driver-facing contexts, the interface can still use plain labels such as **Trips**, **Pay**, and **Help**.

The platform has four distinct navigation layers:

- **Global shell:** product switcher, universal search, notifications, help, profile, and authorized administration entry.
- **Product navigation:** modules belonging to the active product.
- **Page structure:** categories, records, states, and actions inside the selected module.
- **Contextual shortcuts:** role-appropriate links into authoritative pages; they never create a second system of record.

For drivers, the exact five-button mobile navigation is:

| Position | Label | Purpose |
|---|---|---|
| 1 | **Home** | Today, next task, alerts, and status |
| 2 | **Trips** | Assigned work, trip progress, stops, and load paperwork |
| 3 | **Capture** | Camera-first submission of documents, receipts, photos, and incident evidence |
| 4 | **Pay** | Earnings, settlements, deductions, savings, escrow, and pay questions |
| 5 | **More** | Vehicle, safety, schedule, documents, support, settings, and profile |

This model scales because users do not browse all future products, modules, or pages. Entitlements, role, company, carrier, feature flags, and environment compose a small relevant workspace from a large governed catalog.

### Governing recommendation

Adopt **seven enterprise products plus the Driver Workspace**, a single global shell, one authoritative capability registry, and role-composed navigation. Do not promote every domain, workflow, dashboard, or shortcut to product status.

---

## 2. Architectural Review

### 2.1 Evidence and assumptions

The requested complete business-domain inventory and complete current driver navigation inventory were not included after their placeholders. This document therefore uses:

- the stated proposed products and platform capabilities;
- known ELM CONNECT domains: dispatch, load operations, driver portal, payroll, accounting, fleet, maintenance, fuel, safety, ELD/HOS, compliance, recruiting, CRM, warehouse, documents, reporting, notifications, permissions, and AI;
- supplied payroll workbooks, which confirm intake, weekly payroll, driver records, CPM/rate logic, adjustments, escrow, savings, approvals, settlements/payment export, and historical week-level records;
- previously established ELM CONNECT principles: append-only ledgers, immutable snapshots, audit trails, sidebar/operator workflows, multi-company operation, and future SaaS support.

This is an authoritative target architecture, but the capability matrix is a **baseline registry**, not a claim that an omitted inventory was reviewed. A later inventory reconciliation may add rows without changing the hierarchy or navigation rules.

### 2.2 Critical findings

#### A. The proposed top level mixes incompatible concepts

| Proposed item | Actual architectural type | Problem |
|---|---|---|
| Operate | Product candidate | Verb is broad and does not establish a durable boundary. |
| Drive | Role workspace | Represents a user's experience, not an independently owned business system. |
| Pay | Product candidate | Valid product, but the name is consumer-facing shorthand rather than the enterprise name. |
| Fleet | Product | Durable asset-management responsibility. |
| Safety | Product candidate | Must include compliance or its boundary remains incomplete. |
| People | Domain/product candidate | Too vague; risks swallowing driver records, payroll, permissions, recruiting, and training. |
| Finance | Product | Valid only if payroll authority is explicitly excluded. |
| Insights | Cross-domain product/layer | Risks becoming a duplicate home for every dashboard and report. |

#### B. “Documents” is a service, a record type, and a contextual view—not one ordinary product

Documents are created in operational contexts and governed by a shared document service. A BOL belongs to a trip; a settlement belongs to Payroll; a qualification document belongs to Safety & Compliance. A global document search can exist, but it must not become a parallel filing system that competes with those authoritative records.

#### C. “Mission Control” is a page pattern, not a domain

Mission Control may describe an exception-oriented command dashboard inside Operations or Payroll. It cannot be a universal destination beside the products it summarizes. Otherwise, records and actions acquire two homes.

#### D. “Admin Center” currently bundles unrelated authority

Company administration, product configuration, security administration, integrations, feature management, View As, and platform tenant operations have different risk levels and owners. They may share an administrative entry point, but they must be separated into permissioned administrative workspaces.

#### E. Carrier and company selection are contextual scope, not business products

Selection belongs in the shell's context control. Most users should have a default scope and never be asked to choose repeatedly. Cross-company users may change scope; single-company drivers should not see a selector.

#### F. Search, notifications, and ELM AI should not compete with product navigation

They are global utilities. Making them product tiles wastes attention and teaches the wrong mental model.

#### G. Driver and enterprise navigation cannot be one menu with hidden items

A permission-filtered enterprise sidebar is still an enterprise sidebar. Driver workflows require a separately composed navigation model, plain language, touch-first targets, offline-tolerant task continuity, and strong next-step signaling.

### 2.3 Duplicated and overlapping concepts

1. **Driver documents vs Documents:** Capture may submit a BOL, but the authoritative record remains the trip document record.
2. **Payroll vs Finance:** Payroll calculates and certifies worker pay; Finance records obligations, exports payment instructions, and reconciles cash.
3. **People vs Safety:** Workforce owns employment/onboarding records; Safety owns qualifications, training compliance, incidents, and regulatory status.
4. **Fleet vs Safety:** Fleet owns asset condition and maintenance; Safety owns compliance outcomes. Inspections may feed both, but have one authoritative inspection record.
5. **Operations vs Fleet:** Operations assigns equipment; Fleet owns the equipment and assignment eligibility.
6. **Operations dashboards vs Insights:** Operational dashboards drive action; Analytics explains performance across time and domains.
7. **Notifications vs alerts:** Notifications are delivered messages; alerts are business states requiring attention. An alert can generate a notification, but they are not the same object.
8. **Timeline vs Audit History:** A business timeline explains a record to a user; Audit records immutable changes and access for governance.

### 2.4 Products that should merge or split

- Merge **Safety** and **Compliance** into **Safety & Compliance**. Splitting them creates constant record and ownership duplication.
- Keep **Maintenance** and **Fuel** as Fleet modules until their scope, buyers, and independent workflows justify product status.
- Keep **Recruiting** and **Onboarding** as Workforce modules. They can later become a separately sellable Talent product if external recruiting customers emerge.
- Split **People** into (a) Workforce business records and (b) platform Identity & Access. Authentication, accounts, permissions, and impersonation must never be owned by Workforce.
- Split **Insights** into operational dashboards inside products and cross-domain Analytics as a governed product.
- Do not merge Payroll into Finance. Their controls, users, approval states, historical truth, and privacy are materially different.

### 2.5 Navigation anti-patterns to prohibit

- Flat launchpads with dozens of equally weighted buttons.
- A “More” menu that becomes the permanent home of major products.
- Separate mobile, tablet, and desktop taxonomies.
- “Quick actions” that open alternate forms or records disconnected from the authoritative page.
- Product names based on current code, worksheets, database tables, or internal teams.
- Permanent navigation entries for temporary states such as “Coming Soon.”
- Using color alone to communicate state.
- Showing inaccessible enterprise products to drivers as locked teasers.
- Putting View As or Showcase beside ordinary profile choices without persistent warnings.
- Treating every dashboard card as a destination.

### 2.6 Enterprise and driver risks

| Risk | Consequence | Architectural response |
|---|---|---|
| Too many product tiles | Choice paralysis and poor discoverability | Favorites, recent products, role defaults, searchable catalog |
| Ambiguous company/carrier scope | Actions on the wrong legal entity | Persistent context identity and scope-aware permissions |
| Duplicate document entry points | Conflicting records and missing paperwork | One document service; contextual views point to canonical records |
| Driver exposure to admin language | Confusion, distrust, support calls | Dedicated Driver Workspace vocabulary and progressive disclosure |
| Cross-product financial edits | Broken accounting and payroll history | Explicit ownership, state transitions, and immutable certified records |
| View As mistaken for real identity | Unauthorized or accidental action | Strong banner, restricted actions, session reason, automatic expiry, audit |
| Demo data entering production | Operational and legal contamination | Isolated Showcase tenant/data plane and disabled external side effects |

---

## 3. Design Principles

1. **One capability, one authority.** Each capability has one owner, product, module, route, record model, and permission policy.
2. **Products represent durable responsibilities.** A product is not a button collection, persona, or database module.
3. **Role workspaces compose products.** Users see the tasks relevant to their role without changing product ownership.
4. **Actions live with objects.** “Upload POD” belongs to the delivery/trip context; “Approve payroll” belongs to the payroll run.
5. **Global utilities stay quiet.** Search, notifications, help, and profile are always reachable but do not visually compete with work.
6. **Mobile is task-first.** It emphasizes next actions, capture, status, and continuity.
7. **Desktop is throughput-first.** It emphasizes lists, filters, comparison, bulk handling, keyboard access, and multi-panel context.
8. **The same nouns persist across devices.** Responsive presentation changes; ownership and taxonomy do not.
9. **State is explicit.** Users can distinguish unavailable, restricted, disconnected, demo-only, and future capabilities.
10. **Context is persistent.** Active carrier/company, environment, role, and View As identity remain visible when they matter.
11. **Exceptions drive enterprise work.** Dashboards identify what requires attention and link to authoritative queues.
12. **Auditability is structural.** Simplicity must not erase approvals, reasons, effective dates, history, or separation of duties.
13. **Labels match user language.** Enterprise labels can differ from driver labels when they point to the same authority.
14. **Growth happens through registration, not rearrangement.** New products join a governed catalog and do not force shell redesign.

---

## 4. Recommended Product Architecture

### 4.1 Platform and product portfolio

| Layer | Recommended components |
|---|---|
| **ELM CONNECT Platform** | Identity, authorization, tenant/company/carrier context, search, notifications, document service, ELM AI, audit, workflow/event services, configuration, integrations, feature flags, security, help, and platform administration |
| **Business products** | Operations; Payroll; Fleet; Safety & Compliance; Workforce; Finance; Analytics |
| **Role workspaces** | Driver Workspace; Dispatcher Workspace; Payroll Workspace; Fleet Workspace; Safety Workspace; Accounting Workspace; Recruiting Workspace; Warehouse Workspace; Executive Workspace |
| **External experiences** | Future customer, broker, vendor, and public developer portals |

### 4.2 Product boundaries

#### Operations

Owns commercial movement execution from planned/accepted load through pickup, transit, warehouse touch, delivery, paperwork completion, and operational closure.

**Modules:** Command Center, Loads, Dispatch, Trips, Stops, Warehouse, Exceptions, Operational Documents, Communications.

#### Payroll

Owns the complete driver-pay lifecycle from intake and applicable rules through calculation, exception resolution, approval, certified settlement, payment handoff, and immutable history.

**Modules:** Payroll Home, Intake, Runs, Exceptions, Earnings, Adjustments, Rules, Savings & Escrow, Approvals, Settlements, Payment Handoff, History.

#### Fleet

Owns the lifecycle, readiness, assignment eligibility, condition, maintenance, utilization, fuel, and cost of powered and non-powered assets.

**Modules:** Fleet Home, Vehicles, Trailers, Assignments, Inspections, Maintenance, Repairs, Fuel, Vendors, Asset Costs.

#### Safety & Compliance

Owns safe and lawful operation: driver qualification, HOS/ELD compliance, incidents, claims coordination, violations, corrective action, required training, permits, and audit readiness.

**Modules:** Safety Home, Qualifications, HOS & ELD, Incidents, Claims, Violations, Training Compliance, Permits, Compliance Calendar, Audit Readiness.

#### Workforce

Owns the worker relationship outside pay calculation and safety qualification: recruiting, applicant pipeline, onboarding, worker profile, employment status, availability, leave, communications, and offboarding.

**Modules:** Workforce Home, Recruiting, Applicants, Onboarding, Worker Directory, Employment, Availability, Leave, Offboarding.

#### Finance

Owns the financial lifecycle beyond payroll calculation: customer billing, receivables, carrier/vendor payables, reimbursable expenses, financial reconciliation, profitability, cash visibility, and close.

**Modules:** Finance Home, Billing, Receivables, Payables, Expenses, Reconciliation, Profitability, Close, Financial Documents.

#### Analytics

Owns governed, cross-domain analytical consumption—not operational transactions.

**Modules:** Executive Overview, Scorecards, Reports, Metric Catalog, Trends, Forecasts, Scheduled Delivery, Data Quality.

### 4.3 Why Driver Workspace is not a product

Driver Workspace has a distinct experience but not independent domain ownership. Trips remain owned by Operations; settlements by Payroll; vehicle inspection by Fleet; qualifications by Safety & Compliance; profile and onboarding by Workforce. The workspace is valuable precisely because it hides those enterprise boundaries without duplicating them.

### 4.4 Why Analytics remains a product

Simple dashboards do not justify a product. Analytics qualifies because governed cross-domain metrics, report authoring, scheduled distribution, forecasting, metric definitions, and data quality have their own users, lifecycle, and organizational ownership. Every operational product still retains its action-oriented dashboards.

---

## 5. Product Qualification Analysis

| Product | Why a product, not module | Organizational owner | Sellable alone? | Five-year durability | Verdict |
|---|---|---|---|---|---|
| Operations | End-to-end movement execution with multiple modules and roles | Operations leadership | Yes, as TMS/dispatch | Core transportation responsibility | **Product** |
| Payroll | Independent control lifecycle, rules, approvals, settlements, history | Payroll/Controller | Yes, as driver payroll | Durable despite payment providers changing | **Product** |
| Fleet | Full asset lifecycle and cost responsibility | Fleet leadership | Yes, as fleet management | Durable across fleet types | **Product** |
| Safety & Compliance | Regulatory and risk lifecycle with distinct authority | Safety/Compliance leadership | Yes | Regulation and risk remain permanent | **Product** |
| Workforce | Talent and worker lifecycle, distinct from IAM and payroll | HR/People operations | Yes, as recruiting/workforce suite | Durable if scope remains worker relationship | **Product** |
| Finance | Accounting and financial control lifecycle | Controller/CFO | Yes | Durable | **Product** |
| Analytics | Governed cross-domain analysis and metric lifecycle | BI/Data leadership | Yes | Durable as portfolio scales | **Product** |
| Driver Workspace | Aggregates other products for one role | Product Experience with domain owners | Not cleanly; lacks its own authority | Role remains, boundaries stay external | **Workspace, not product** |
| Maintenance | Important but contained within asset lifecycle | Fleet | Yes in market, but current ELM scope is dependent | Could graduate later | **Fleet module now** |
| Recruiting | Coherent but currently part of worker lifecycle | Workforce/Recruiting | Yes | Could graduate with external customer scope | **Workforce module now** |
| Documents | Infrastructure plus contextual records | Platform + domain owners | Document service could be sold, but not a trucking responsibility | Durable service | **Platform service, not product** |
| ELM AI | Assists every product; should not own source records | Platform/AI governance | Potentially | Durable service pattern | **Platform service** |

No product receives permanent status solely because another vendor sells something similar. ELM CONNECT should graduate a module into a product only when it gains independent buyers, ownership, permissions, lifecycle, navigation, and value without its parent product.

---

## 6. Platform Hierarchy

```text
ELM CONNECT Platform
└── Product: Payroll
    └── Module: Payroll Runs
        └── Page: Week 28 Payroll Run
            └── Category: Exceptions
                └── Action: Resolve missing pay rule
```

### Formal meaning

| Level | Definition | Example |
|---|---|---|
| Platform | Shared ecosystem, governance, shell, and services | ELM CONNECT |
| Product | Durable business responsibility intentionally entered | Payroll |
| Module | Major capability family inside one product | Payroll Runs |
| Page | Routable destination representing a collection, record, queue, or dashboard | Week 28 Payroll Run |
| Category | Non-routable organization within a page | Exceptions |
| Action | Verb applied to the current object or workflow | Resolve |

Categories do not appear in the app switcher. Actions do not become permanent navigation. Shortcuts do not change ownership.

---

## 7. Product Map

| Product | Primary modules | Key records |
|---|---|---|
| Operations | Command Center, Loads, Dispatch, Trips, Stops, Warehouse, Exceptions, Communications | Load, trip, stop, assignment, warehouse event, operational exception |
| Payroll | Intake, Runs, Exceptions, Earnings, Adjustments, Rules, Savings & Escrow, Approvals, Settlements, Payment Handoff, History | Payroll event, rule, run, exception, adjustment, snapshot, settlement |
| Fleet | Vehicles, Trailers, Assignments, Inspections, Maintenance, Repairs, Fuel, Vendors, Costs | Asset, assignment, inspection, work order, fuel transaction |
| Safety & Compliance | Qualifications, HOS/ELD, Incidents, Claims, Violations, Training, Permits, Audit Readiness | Qualification, duty record, incident, claim, violation, certification |
| Workforce | Recruiting, Applicants, Onboarding, Directory, Employment, Availability, Leave, Offboarding | Applicant, worker, employment record, availability, onboarding task |
| Finance | Billing, Receivables, Payables, Expenses, Reconciliation, Profitability, Close | Invoice, receipt, payable, expense, reconciliation, close period |
| Analytics | Overview, Scorecards, Reports, Metrics, Trends, Forecasts, Data Quality | Metric definition, report, subscription, forecast, quality issue |

---

## 8. Enterprise App Switcher

The app switcher is a **product catalog**, not the main navigation and not a tile dump.

### Structure

1. **Current scope:** company/carrier identity above the catalog when the user can change it.
2. **Pinned:** up to five user-pinned, authorized products.
3. **Recent:** up to three recently entered products.
4. **All products:** authorized catalog grouped by business responsibility, searchable by product name and recognized synonyms.
5. **External portals:** clearly separated when authorized.

Each product entry shows only name, concise purpose, and meaningful attention count. It does not show module shortcuts, setup controls, or promotional copy.

Drivers do not use the enterprise app switcher. Users with only one product enter it directly. Administrators access administration through the profile/administration control, not as a business product tile.

At 50 products, catalog search, favorites, recently used items, entitlement filtering, and product families prevent the switcher from becoming a 50-tile wall.

---

## 9. Desktop Navigation

### Global shell

- Product switcher at upper left.
- Active product and active company/carrier scope remain visible.
- Universal search centered or immediately reachable by keyboard.
- Notifications, help, and profile at upper right.
- Persistent environment/View As/Showcase banner above product content when active.

### Product navigation

- Left navigation contains the active product's modules only.
- Product Home is first.
- Frequent modules are visible; lower-frequency modules may be grouped under clearly named sections.
- Labels remain stable. Users may pin modules but cannot rename authoritative destinations.
- Record actions appear in the page header or selected-record panel.
- High-volume list/detail work may use split views without changing routes or ownership.

### Desktop home

Every product Home answers:

1. What requires attention?
2. What is happening now?
3. What work is next?
4. What changed since I last visited?

It is not a complete report gallery. It links to queues and records.

---

## 10. Tablet Navigation

Tablet uses the same product and module taxonomy with adaptive presentation:

- Global shell remains visible in landscape and compact in portrait.
- Product module navigation collapses to an icon-plus-label rail or overlay drawer.
- List/detail can coexist in landscape; portrait favors sequential views.
- Primary page action remains visible; secondary actions move to labeled overflow.
- Touch targets meet accessibility sizing and do not depend on hover.
- Driver tablet mode uses Driver Workspace navigation, not a compressed enterprise sidebar.

Tablet is not a third information architecture. It is a responsive expression of the same authority model.

---

## 11. Mobile Navigation

### Enterprise mobile

Enterprise mobile prioritizes approval, exception resolution, status review, communication, and field tasks. It does not attempt to reproduce every desktop configuration function.

- Bottom navigation may contain Home, Work/Queue, Search, Notifications, and More for the active product.
- Product switching occurs through the header/product control, not through bottom tabs.
- Complex configuration remains discoverable but may be explicitly marked desktop-required when a safe mobile interaction is not available.
- Deep links preserve company, product, record, and return context.

### Global mobile rules

- One prominent primary action per screen.
- Critical status and next action appear before historical detail.
- Back navigation returns to the user's prior filtered context.
- Offline or disconnected state is explicit and never represented as successful submission.
- Destructive or financially binding actions require clear confirmation and consequence language.

---

## 12. Driver Navigation

### 12.1 Exact five-button navigation

1. **Home**
2. **Trips**
3. **Capture**
4. **Pay**
5. **More**

These labels are short, concrete, and recognizable under stress. “Capture” is retained because it describes the camera-first action hub, but each task inside it uses an explicit object label: **Trip paperwork**, **Receipt**, **Freight photos**, **Vehicle issue**, **Incident evidence**.

### 12.2 Driver Home dashboard

Ordered by urgency:

1. **Next step:** current stop/task with time, location, and one primary action.
2. **Attention:** missing paperwork, rejected upload, expiring qualification, HOS risk, unresolved pay question.
3. **Current trip:** route, status, dispatcher contact, equipment, and progress.
4. **Recent activity:** latest accepted submission, trip completion, settlement availability.
5. **Quick shortcuts:** only contextually valid actions such as Call dispatch, Navigate, Upload POD, Report delay.

The Home dashboard contains no generic grid of all features.

### 12.3 Trips

- Current trip opens by default.
- Upcoming and completed trips are secondary views.
- Trip page contains stops, instructions, contacts, equipment, timeline, documents, issues, and earnings preview when authorized.
- “Arrived,” “Loaded,” “Departed,” “Delivered,” “Report delay,” and “Submit paperwork” are contextual actions, not navigation buttons.

### 12.4 Capture

Capture is an action hub with a short first choice:

- Trip paperwork
- Receipt
- Freight photos
- Vehicle issue
- Incident evidence

When opened from a trip, the trip and expected document type are preselected. The resulting record returns to its authoritative product location.

### 12.5 Pay

- Current/most recent earnings summary.
- Settlement history.
- Trip earnings and adjustments.
- Savings and escrow balances where applicable.
- Pay questions linked to the relevant settlement or line item.

Drivers never see rule tables, approval controls, accounting exports, internal exception codes, or payroll configuration.

### 12.6 More menu

The More menu is organized by driver mental model:

**My work**
- Schedule & availability
- Documents

**My vehicle**
- Assigned truck & trailer
- Inspections
- Maintenance issues
- Fuel activity when applicable

**Safety**
- Hours & compliance
- Qualifications
- Training
- Report an incident

**Support**
- Messages & contacts
- Help

**Account**
- Profile
- Company information
- Language
- Notification preferences
- Sign out

Items appear only when enabled and authorized. Important daily work must not be buried here.

### 12.7 Contextual shortcuts

- Home “Upload POD” → current trip's required delivery document submission.
- Trip “Report delay” → operational exception attached to that trip.
- Pay “Question this line” → payroll inquiry attached to the settlement line.
- Vehicle “Report issue” → Fleet maintenance issue for assigned asset.
- Safety alert → authoritative qualification, HOS, training, or incident page.

---

## 13. Navigation for Every Major Role

| Role | Default workspace/product | Primary navigation | Hidden or restricted |
|---|---|---|---|
| Driver | Driver Workspace | Home, Trips, Capture, Pay, More | Enterprise products, configuration, other workers' data |
| Dispatcher | Operations | Home, Loads, Dispatch, Trips, Exceptions, Warehouse, Communications | Payroll details beyond allowed operational status; platform admin |
| Payroll Operator | Payroll | Home, Intake, Runs, Exceptions, Adjustments, Approvals, Settlements, History | Security/tenant controls; bank execution unless separately authorized |
| Fleet Manager | Fleet | Home, Assets, Assignments, Inspections, Maintenance, Fuel, Costs | Payroll calculations and personnel-sensitive records |
| Safety Manager | Safety & Compliance | Home, Qualifications, HOS/ELD, Incidents, Claims, Violations, Training, Audit Readiness | Payroll details; unrelated financial records |
| Accounting | Finance | Home, Billing, Receivables, Payables, Expenses, Reconciliation, Profitability, Close | Payroll rule editing; safety case details unless required |
| Recruiting | Workforce | Home, Applicants, Recruiting, Onboarding, Directory | Employee payroll, operations, and safety investigations beyond onboarding status |
| Warehouse | Operations: Warehouse workspace | Home, Arrivals, Departures, Inventory/touch records, Documents, Exceptions | Dispatch planning, payroll, finance, admin |
| Executive | Executive Workspace + Analytics | Overview, Operations, Financial, Workforce, Fleet, Safety scorecards | Transaction editing by default |
| Company Administrator | Administration | Company, Users, Roles, Products, Integrations, Configuration, Audit, View As | Platform-wide tenant controls unless delegated |
| Platform Administrator | Platform Administration | Tenants, Security, Features, Integrations, Audit, Support, Showcase | Business transactions except controlled support access |

Role navigation is a default, not a replacement for permissions. A user with multiple responsibilities may switch products; the system does not fuse unrelated modules into one giant sidebar.

---

## 14. Complete Capability Matrix — Baseline Registry

| Capability | Authoritative product/service | Module | Primary users | Horizon | Primary navigation | Contextual shortcuts | Default state |
|---|---|---|---|---|---|---|---|
| Load board | Operations | Loads | Dispatcher | Current | Operations > Loads | Operations Home | Available |
| Dispatch planning | Operations | Dispatch | Dispatcher | Current | Operations > Dispatch | Load, driver, asset | Available |
| Trip execution | Operations | Trips | Driver, Dispatcher | Current | Trips / Operations > Trips | Home next task | Available |
| Stop events | Operations | Stops | Driver, Dispatcher | Current | Within Trip | Current task | Available |
| Warehouse activity | Operations | Warehouse | Warehouse, Dispatcher | Current | Operations > Warehouse | Load/Trip | Available |
| Operational exceptions | Operations | Exceptions | Dispatcher | Current | Operations > Exceptions | Trip alerts | Attention Required when open |
| BOL/POD submission | Operations + Document Service | Trip Documents | Driver, Dispatcher | Current | Trip > Documents | Capture | Available |
| Freight photos | Operations + Document Service | Trip Documents | Driver | Current | Trip > Documents | Capture | Available |
| Dispatch communications | Operations | Communications | Driver, Dispatcher | Current/Future | Operations > Communications | Trip, notification | Available/Not Connected |
| Payroll intake | Payroll | Intake | Payroll Operator | Current | Payroll > Intake | Run readiness | Available |
| Payroll runs | Payroll | Runs | Payroll Operator | Current | Payroll > Runs | Payroll Home | Available |
| Pay rules/rates | Payroll | Rules | Payroll Admin | Current | Payroll > Rules | Exception resolution | Restricted |
| Payroll exceptions | Payroll | Exceptions | Payroll Operator | Current | Payroll > Exceptions | Run, notification | Attention Required |
| Adjustments | Payroll | Adjustments | Payroll Operator | Current | Run > Adjustments | Driver/settlement | Restricted |
| Escrow | Payroll | Savings & Escrow | Payroll, Driver | Current | Payroll module / Driver Pay | Settlement | Available |
| Savings | Payroll | Savings & Escrow | Payroll, Driver | Current | Payroll module / Driver Pay | Settlement | Available |
| Payroll approval | Payroll | Approvals | Approver | Current | Run > Approval | Notification | Restricted/Attention Required |
| Settlement | Payroll | Settlements | Payroll, Driver | Current | Payroll > Settlements / Pay | Notification, trip | Available |
| Payment handoff/export | Payroll | Payment Handoff | Payroll, Accounting | Current | Payroll > Payment Handoff | Approved run | Restricted |
| Payroll history/snapshots | Payroll | History | Payroll, Audit | Current | Payroll > History | Driver/settlement | Available |
| Pay inquiry | Payroll | Settlements | Driver, Payroll | Future/current concept | Pay > Settlement | Line-item shortcut | Available |
| Vehicle registry | Fleet | Vehicles | Fleet | Current/Future | Fleet > Vehicles | Assignment | Available |
| Trailer registry | Fleet | Trailers | Fleet | Current/Future | Fleet > Trailers | Trip, assignment | Available |
| Asset assignments | Fleet | Assignments | Fleet, Dispatch | Current | Fleet > Assignments | Dispatch, Driver More | Available |
| Driver vehicle inspection | Fleet | Inspections | Driver, Fleet | Future | Fleet > Inspections | Driver More, pre-trip task | Coming Soon until released |
| Maintenance | Fleet | Maintenance | Fleet, Driver | Future/current concept | Fleet > Maintenance | Vehicle, Driver More | Available/Coming Soon |
| Repair/work orders | Fleet | Repairs | Fleet | Future | Fleet > Repairs | Maintenance alert | Coming Soon |
| Fuel log | Fleet | Fuel | Driver, Fleet, Accounting | Current concept | Fleet > Fuel | Capture receipt, vehicle | Available/Not Connected |
| Asset cost | Fleet | Asset Costs | Fleet, Accounting | Current concept | Fleet > Asset Costs | Finance profitability | Restricted |
| Qualification file | Safety & Compliance | Qualifications | Safety, Driver | Future/current docs | Safety > Qualifications | Driver More, alerts | Available |
| HOS/ELD | Safety & Compliance | HOS & ELD | Driver, Safety, Dispatch | Future | Safety > HOS & ELD | Driver Home, trip risk | Not Connected until integrated |
| Incident reporting | Safety & Compliance | Incidents | Driver, Safety | Future/current concept | Safety > Incidents | Capture, Driver More | Available/Coming Soon |
| Claims coordination | Safety & Compliance | Claims | Safety, Finance | Future | Safety > Claims | Incident | Coming Soon |
| Violations | Safety & Compliance | Violations | Safety, Driver | Future | Safety > Violations | Driver alert | Restricted by role |
| Training compliance | Safety & Compliance | Training | Safety, Driver | Future | Safety > Training | Driver More, alert | Coming Soon |
| Permits/registrations compliance | Safety & Compliance | Permits | Safety, Fleet | Future | Safety > Permits | Asset | Coming Soon |
| Recruiting pipeline | Workforce | Recruiting/Applicants | Recruiting | Current site/future platform | Workforce > Applicants | Public careers portal | Available/Future integration |
| Applicant experience | Workforce | Recruiting | Applicant, Recruiting | Current/Future | External recruiting portal | Campaign link | Available |
| Onboarding | Workforce | Onboarding | Recruiting, Driver | Future | Workforce > Onboarding | Applicant conversion | Coming Soon |
| Worker directory | Workforce | Directory | Managers/Admin | Current concept | Workforce > Directory | Cross-product person link | Restricted |
| Employment status | Workforce | Employment | Workforce Admin | Future/current master data | Worker > Employment | Payroll eligibility | Restricted |
| Availability/leave | Workforce | Availability | Driver, Dispatch | Future | Workforce > Availability | Driver More, dispatch | Coming Soon |
| Offboarding | Workforce | Offboarding | Workforce, Safety, Fleet, Payroll | Future | Worker > Offboarding | Required cross-product tasks | Restricted |
| Customer billing | Finance | Billing | Accounting | Current/Future | Finance > Billing | Delivered load | Available/Future |
| Receivables | Finance | Receivables | Accounting | Future | Finance > Receivables | Invoice | Coming Soon |
| Payables | Finance | Payables | Accounting | Future | Finance > Payables | Vendor, payroll handoff | Coming Soon |
| Expense submission | Finance + Document Service | Expenses | Driver, Accounting | Current concept | Finance > Expenses | Capture Receipt | Available |
| Reimbursement | Finance | Expenses | Accounting, Driver | Current concept | Expense record | Driver receipt status | Available |
| Reconciliation | Finance | Reconciliation | Accounting | Future | Finance > Reconciliation | Payment handoff | Coming Soon |
| Profitability | Finance | Profitability | Owner, Accounting | Current concept | Finance > Profitability | Load, truck | Available |
| Executive scorecards | Analytics | Executive Overview | Executive | Future/current concept | Analytics > Overview | Executive Home | Available |
| Operational reports | Analytics | Reports | Managers | Future | Analytics > Reports | Product dashboards | Available/Future |
| Metric catalog | Analytics | Metrics | Analyst/Admin | Future | Analytics > Metrics | Report definition | Restricted |
| Forecasting | Analytics | Forecasts | Executive, Managers | Future | Analytics > Forecasts | Scorecard | Coming Soon |
| Universal search | Platform | Search | All authorized users | Future/current concept | Global utility | Everywhere | Available |
| Notifications | Platform | Notifications | All users | Current/Future | Global utility | Alerts and records | Available |
| Document storage/versioning | Platform | Document Service | All products | Current | Not primary nav | Every authoritative record | Available |
| Global document search | Platform | Search/Documents view | Authorized staff | Future | Search filter | Product records | Available |
| ELM AI | Platform | Intelligence Service | Authorized users | Future | Global/contextual | Search, record, dashboard | Coming Soon/Admin controlled |
| Authentication | Platform | Identity | All | Current | Entry only | Session renewal | Available |
| Roles & permissions | Platform Admin | Access Control | Admin | Current/Future | Administration | User/product setup | Admin Only |
| Company/carrier scope | Platform | Context | Multi-scope users | Current | Shell context control | App switcher | Available |
| Audit history | Platform Admin | Audit | Admin/Auditor | Current/Future | Administration > Audit | Record “View activity” | Admin Only |
| Configuration | Product + Platform Admin | Configuration | Authorized admin | Current | Administration | Product setup warning | Admin Only |
| Integrations | Platform Admin | Integrations | Admin | Future/current | Administration > Integrations | Product connection status | Admin Only |
| Security | Platform Admin | Security | Security Admin | Current/Future | Administration > Security | Alerts | Admin Only |
| Feature flags | Platform Admin | Feature Management | Platform Admin | Current/Future | Platform Administration | Showcase/scenario controls | Admin Only |
| Tenant management | Platform Admin | Tenants | Platform Admin | Future | Platform Administration | Support workflows | Admin Only |
| View As | Platform Admin | Support & Access | Authorized Admin | Future/current concept | Administration > View As | User record | Admin Only |
| Showcase | Platform Admin | Demonstrations | Authorized Admin/Sales | Future/current concept | Profile/Admin entry | Scenario link | Demonstration Only |
| Help | Platform | Help | All | Current/Future | Global utility | Contextual help | Available |
| Profile/preferences | Platform | Account | All | Current | Global utility | Driver More | Available |

---

## 15. Feature Placement Audit

| Capability | Decision | Authoritative placement | Reason |
|---|---|---|---|
| Operate | Rename | **Operations** product | Durable noun and clear enterprise responsibility |
| Drive | Reclassify | **Driver Workspace** | Persona experience composing multiple products |
| Pay | Rename at enterprise level | **Payroll**; driver label remains **Pay** | Separates product identity from friendly tab label |
| Safety | Expand/merge | **Safety & Compliance** | One risk and regulatory lifecycle |
| People | Rename/split | **Workforce**; identity moves to Platform | Prevents HR records from owning accounts and permissions |
| Insights | Rename/clarify | **Analytics** product; operational dashboards stay local | Prevents duplicate reporting homes |
| Capture | Keep as driver action hub | Driver Workspace, with records routed to domains | Camera-first recurring task; not a record repository |
| Truck | Rename | **Vehicle** in enterprise; **My vehicle** for driver | Includes non-truck powered assets and sounds natural |
| Equipment | Keep but narrow | Fleet assets and Operations assignments | “Equipment” is a category, not a standalone product |
| Timeline | Split semantic views | Record Timeline vs Platform Audit | User history and immutable audit have different audiences |
| Assistant | Rename | **ELM AI** shared service | Establishes governed cross-product intelligence |
| Mission Control | Demote to page pattern | Product Home/Command Center | Not an independent system or product |
| Documents | Split | Platform Document Service + contextual record documents | Prevents parallel filing hierarchy |
| Admin Center | Split within one admin entry | Company Admin and Platform Admin workspaces | Different authority, risk, and scope |
| Carrier Selection | Move | Global context control | Scope, not a destination |
| Company Selection | Move/merge | Global context control | Carrier/company relationship should be represented once |
| Search | Move | Global utility | Cross-product service |
| Notifications | Move | Global utility | Cross-product service |
| View As | Restrict | Administration > View As | High-risk support capability |
| Showcase Mode | Restrict and isolate | Demonstration environment entry | Must not behave as production feature toggle |
| Audit History | Move/restrict | Administration > Audit; contextual read-only links | Central authority with record entry points |
| Configuration | Split | Product configuration + platform configuration | Configuration belongs to the object being governed |
| Fuel | Keep as module | Fleet > Fuel; Finance consumes transactions | Fleet operational authority, accounting downstream |
| Maintenance | Keep as module | Fleet > Maintenance | Part of asset lifecycle today |
| Recruiting | Keep as module | Workforce > Recruiting | Can graduate later if market and ownership expand |
| Warehouse | Keep as Operations module/workspace | Operations > Warehouse | A role/location view of load execution |
| CRM | Split by business purpose | Operations customer/broker relationships initially; future Commercial product if expanded | “CRM” is a technology category, not a single responsibility |

---

## 16. Naming Review

| Current name | Recommendation | Explanation |
|---|---|---|
| Capture | **Capture** for driver tab; explicit task names inside | Strong camera-first verb, but too ambiguous as a record name |
| Truck | **Vehicle** enterprise; **My vehicle** driver | Supports tractors and future powered assets; driver label is personal and clear |
| Equipment | **Assets** in Fleet; **Assigned equipment** in Operations | Fleet owns assets; Operations uses assignments |
| Timeline | **Activity** for user-facing changes; **Trip timeline** for events; **Audit history** for governance | One word should not conceal three different histories |
| Assistant | **ELM AI** | Identifiable platform capability; “Assistant” is generic and may be confused with help/support |
| Mission Control | **Command Center** in Operations; **Payroll Home** or **Run Control** in Payroll | Name the responsibility, not a dramatic universal metaphor |
| Documents | **Documents** only as a view/filter; specific types in context | Users look for BOLs, receipts, settlements, and qualifications—not an abstract document system |
| People | **Workforce** | Clear business scope and avoids collision with accounts/identity |
| Insights | **Analytics** | Signals governed reporting and analysis; “insights” is an output, not an owning system |

Naming rule: enterprise names describe durable responsibilities; driver names describe immediate tasks. Both may route to the same authoritative capability.

---

## 17. Navigation Rules

| Element | Formal rule |
|---|---|
| Product | Must pass the qualification test, have an owner, durable records, multiple modules, independent permission boundary, and explicit catalog entry. |
| Module | Must group related pages inside exactly one product; no module is duplicated across products. |
| Dashboard/Home | Must summarize state and route to action queues; cannot become a substitute database or report catalog. |
| Page | Must be routable, permission-aware, and represent a collection, queue, record, dashboard, or controlled workflow. |
| Category | Organizes content inside a page; is not routable unless it becomes a stable user destination. |
| Action | A verb applied to current context; belongs in page header, record panel, or contextual menu. |
| Shortcut | Alternate entry into the canonical route with context preselected; never creates a separate record or policy. |
| Global utility | Available regardless of product and visually secondary: search, notifications, help, profile. |
| Notification | Delivered event with source, time, state, and canonical destination; not an independent task record. |
| Search | Returns permission-filtered results grouped by record type/product and opens canonical pages. |
| Alert | Business condition requiring awareness or action; lives in the owning product and may emit notifications. |
| Floating action | Allowed only for one high-frequency, context-safe action; never used to expose an action menu of unrelated tasks. |
| Overflow menu | Contains secondary actions on the current object, not hidden primary navigation. |

No page may introduce a new noun when an authoritative platform noun already exists without an architecture decision.

---

## 18. Duplicate Prevention Rules

1. Maintain a **Capability Registry** containing canonical name, aliases, owner, product, module, record type, route, permissions, lifecycle state, and allowed shortcuts.
2. A new navigation item requires a registry entry or explicit reference to an existing entry.
3. Every shortcut stores a canonical destination and context parameters; it does not own data or workflow state.
4. Cross-product cards may summarize foreign data but must link to the owning product for mutation.
5. Shared services may index or deliver records but may not redefine their business meaning.
6. Documents inherit the owner and retention policy of the record they support.
7. Reports never become an alternate transaction-editing surface.
8. Notifications never become the only place a task can be found.
9. Driver-friendly aliases are permitted only when mapped to the same authority.
10. Architecture review is required when two teams claim the same verb, record, or lifecycle state.

Example: **Capture > Receipt** creates an expense submission owned by Finance and stores the file through Document Service. The receipt then appears in Driver activity and Finance Expenses, but there is only one expense record.

---

## 19. View As Workflow

### Purpose

View As is a controlled administrative diagnostic capability for verifying a user's authorized experience. It is not account switching, unrestricted impersonation, or a way to bypass separation of duties.

### Entry

1. Authorized administrator opens **Administration > View As**.
2. Administrator supplies a reason or support reference.
3. Selects scope in order: **carrier → company → role → specific user**.
4. Reviews effective permissions and enabled products.
5. May apply only approved temporary permission/feature variations in a clearly labeled simulation layer; this does not alter the user's stored permissions.
6. Confirms entry.

### Active identity

A persistent, non-dismissible banner shows:

> Viewing as Vernon Taylor · Driver · GLX

It also shows simulated changes, remaining session time, **Exit View As**, and **Return to Admin**.

The administrator's real identity remains the auditing actor. The viewed user's identity is the effective subject. Both are recorded.

### Safety controls

- Default is read-only simulation.
- Financial approval, payment release, credential/security changes, external communication, legal acceptance, data export, and destructive actions are blocked.
- If a narrowly permitted support action is allowed, it must show **Performed by [admin] while viewing as [user]** and require explicit confirmation.
- Session expires after inactivity and has a hard maximum duration.
- Company/carrier changes require restarting the View As session.
- No nested View As.
- Opening a deep link outside the active scope is blocked or exits safely.

### Exit

Exit returns the administrator to the exact Administration context with a session summary. Closing the browser or timing out terminates the effective identity. There is no silent persistence into a later session.

---

## 20. Showcase Workflow

### Definition

Showcase is an isolated demonstration environment containing curated fictional scenarios. It is not production with fake records, a role simulation alone, or a second production operating system.

### Production versus Showcase

| Dimension | Production | Showcase |
|---|---|---|
| Data | Real authorized company data | Synthetic, resettable scenario data |
| External effects | Real integrations and communications | Blocked or routed to safe simulators |
| Financial actions | Governed real outcomes | Demonstration-only, never transmitted |
| Audit | Full production audit | Separate demo activity log |
| Identity | Real role and permissions | Authorized demonstrator plus selected demo persona |
| Reset | Never arbitrary | Scenario reset to known baseline |

### Entry

1. Authorized user chooses **Enter Showcase** from the profile/admin control.
2. Selects demo carrier/brand, scenario, persona, and optional device view.
3. Reviews the isolation notice.
4. Enters a separately themed shell with a persistent **DEMO — SHOWCASE** banner.

### Scenario examples

- Driver completing a delivery with missing POD.
- Payroll run containing rule and duplicate-intake exceptions.
- Dispatcher managing a late load and warehouse handoff.
- Executive reviewing a multi-company scorecard.

### Protections

- Separate tenant and data boundary.
- No production identifiers copied into scenarios.
- Email, SMS, payment, ELD, accounting, and document-sharing side effects disabled or simulated.
- Downloaded files visibly marked as demonstration data.
- Product/feature configuration can vary only within scenario metadata.
- Reset restores a known baseline and clearly warns that demo changes will be discarded.
- Exit returns to the user's last production destination after a production identity confirmation.

---

## 21. Capability State Specification

| State | Meaning | Visual/behavioral treatment | Driver language |
|---|---|---|---|
| Available | Authorized and usable | Normal emphasis; opens directly | Normal label |
| Attention Required | Usable but has unresolved task/risk | Status icon, text label, count when useful; sorts higher | “Needs attention” plus required next step |
| Restricted | Exists but user lacks permission | Usually hidden; shown only when awareness is useful, with reason/request path | Prefer hidden; never show “RBAC” or policy codes |
| Coming Soon | Announced, intentionally unavailable | Low emphasis with explicit label; no error-like styling | “Coming soon” |
| Demonstration Only | Exists only in Showcase | Demo badge and blocked production entry | “Demo only” |
| Admin Only | Authorized administration capability | Hidden from ordinary navigation; visible in Administration | Never shown to drivers |
| Not Connected | Product is enabled but required integration is absent | Connection label and responsible admin action; no dead click | “Not available yet” or “Contact dispatch,” depending on task |

Rules:

- Hidden is preferred when the user cannot benefit from knowing the capability exists.
- Locked items are not marketing decorations in production workflows.
- No state relies on color alone.
- Every visible unavailable state explains whether the cause is permission, release timing, environment, or connection.
- “Error,” “null,” “disabled flag,” “endpoint,” “API,” and developer codes never appear in driver copy.

---

## 22. Before & After Driver Navigation Comparison

| Dimension | Before: domain/button-oriented risk | After: task-oriented architecture |
|---|---|---|
| Top level | Potential mix of Drive, Capture, Truck, Equipment, Documents, Timeline, Assistant, Pay, Safety | Exactly Home, Trips, Capture, Pay, More |
| Current work | Distributed among load, timeline, documents, and actions | Home shows next step; Trips owns trip progress |
| Paperwork | Separate document destinations and upload actions | Capture is shortcut; Trip Documents is authority |
| Vehicle | Truck and Equipment may compete | My vehicle groups assigned powered/non-powered assets |
| History | Timeline, Documents, and Pay may duplicate events | Context-specific activity within Trip, Pay, Vehicle, or Safety |
| Help/AI | Assistant may compete as a primary destination | Contextual ELM AI/help; no replacement for navigation |
| Unavailable items | Locked/dead buttons | Hidden or intentionally labeled state |
| Enterprise exposure | Permission-filtered enterprise menu | Dedicated Driver Workspace |

The after-state removes structural knowledge from the driver's burden. A driver does not need to know whether a receipt is technically Finance, Documents, or Payroll-related before submitting it.

---

## 23. User Journeys

### 23.1 Driver completes delivery and submits paperwork

1. Driver Home shows **Next step: Deliver load [identifier]**.
2. Driver opens the stop, reviews delivery instructions, and marks arrival.
3. After delivery, the page makes **Complete delivery** the primary action.
4. Required evidence is listed in plain language: signed POD and optional freight photos.
5. Driver uses the embedded capture flow; trip and document type are already known.
6. Submission shows upload/sync progress and a clear accepted or needs-correction state.
7. Delivery status updates only according to the governed workflow; document acceptance remains separately visible.
8. Home now shows the next assignment or “No assigned trip.”
9. The POD is accessible from Trip Documents. Capture does not retain a competing copy.

### 23.2 Payroll operator resolves a payroll exception

1. Payroll Home shows a Week 28 run with three blocking exceptions.
2. Operator opens **Exceptions**, already filtered to that run.
3. Exception explains the affected driver, source event, failed rule/validation, financial impact, and permitted resolutions.
4. Operator follows the authoritative link to the pay rule or intake event rather than editing an unexplained calculated total.
5. Any correction requires effective date, reason, and supporting evidence where applicable.
6. The run recalculates and records lineage; the exception resolves only when its condition is actually satisfied.
7. Approval remains unavailable until blocking exceptions are zero and certification gates pass.
8. Approver reviews summarized changes and certifies the immutable run snapshot.
9. Settlement becomes available to the driver; payment handoff becomes available to authorized Payroll/Accounting users.

### 23.3 Owner switches products and uses View As

1. Owner is viewing the Executive Workspace for GLX.
2. Product switcher shows pinned Operations, Payroll, Finance, and Analytics.
3. Owner enters Operations to review late loads, then returns through the switcher to Analytics without losing GLX scope.
4. To verify a driver's experience, owner opens Administration and selects View As.
5. Owner records the reason, selects GLX, Driver, then Vernon Taylor.
6. Review screen displays effective products, permissions, and feature flags.
7. Owner enters read-only View As; persistent banner reads **Viewing as Vernon Taylor · Driver · GLX**.
8. Owner verifies the five-button driver navigation and a specific trip state. Restricted actions remain blocked.
9. Owner exits and returns to Administration with a recorded session summary, then returns to the prior Executive context.

---

## 24. Architecture Decision Log

| Decision | Previous state | Recommended state | Reason | Benefits | Tradeoffs | Migration considerations |
|---|---|---|---|---|---|---|
| Product portfolio | Operate, Drive, Pay, Fleet, Safety, People, Finance, Insights | Seven products + Driver Workspace | Previous list mixed architectural types | Clear ownership and scale | Less superficial naming symmetry | Map aliases and existing routes without changing record authority |
| Driver architecture | Driver as product/enterprise subset | Role-composed Driver Workspace | Driver needs cross-domain tasks | Lower cognitive load | Requires coordinated domain presentation | Preserve existing deep links behind new navigation |
| Operations name | Operate | Operations | Noun states durable responsibility | Enterprise clarity | Slightly less consumer-like | Driver still sees Trips, not Operations |
| Payroll boundary | Potential overlap with Finance | Payroll owns calculation/certification; Finance owns accounting/payment reconciliation | Financial integrity and separation of duties | Strong audit and ownership | Cross-product handoff required | Define certified handoff record and permissions |
| People boundary | Broad People domain | Workforce business product; Identity stays Platform | Prevents HR/IAM collision | Security and privacy clarity | Two admin surfaces for different purposes | Establish authoritative worker-to-account relationship |
| Safety boundary | Safety separate/ambiguous compliance | Safety & Compliance combined | Shared lifecycle and records | Fewer duplicates | Broad product scope | Organize modules and permissions carefully |
| Insights | General destination | Analytics product plus local operational dashboards | Action vs analysis distinction | Better discoverability | Some metrics appear summarized in two contexts | Both surfaces use same governed metric definition |
| Documents | Potential product/button | Shared service with contextual authoritative records | Documents support business objects | One record and retention model | Global browsing is secondary | Create aliases and canonical record links |
| Mission Control | Cross-platform concept | Product-specific Command Center/Home pattern | Avoids duplicate control systems | Predictable navigation | Loses universal branded destination | Retain brand phrase only as optional page subtitle |
| ELM AI | Assistant destination | Shared contextual service | AI should not own business truth | Available everywhere safely | Less visible as a standalone novelty | Provide global entry plus contextual invocations |
| Admin Center | One mixed area | One entry, separated Company and Platform admin workspaces | Different authority levels | Safer delegation | More deliberate navigation | Map existing controls by owner and risk |
| Company/carrier | Repeated selection | Persistent global scope context | Scope applies across products | Prevents wrong-entity work | Consumes shell space for multi-scope users | Hide for single-scope users |
| View As | General mode | Audited, time-boxed admin simulation | High impersonation risk | Safe support/testing | Some actions unavailable while viewing | Preserve actor and subject in audit |
| Showcase | Alternative mode/system | Isolated synthetic demonstration environment | Prevent production contamination | Reliable demos and resets | Requires curated scenarios | Never copy real data into demo scenarios |
| Mobile taxonomy | Potential custom button set | Same authority, task-first role composition | Avoids platform fragmentation | Learnability across devices | Not all desktop functions fit mobile | Mark safe device limitations intentionally |
| Future products | Add buttons | Register in catalog and entitlement model | 50-product scale | No shell redesign | Requires governance discipline | Enforce product qualification gate |

---

## 25. UX Evaluation

### Information architecture

**Strength:** Separates platform, products, modules, pages, and actions; assigns one authoritative owner.  
**Remaining risk:** Cross-domain records such as driver, asset assignment, expense, and incident need explicit reference relationships so users do not encounter conflicting summaries.  
**Improvement:** Govern a shared business glossary and capability registry alongside this architecture.

### Progressive disclosure

**Strength:** Drivers receive five primary destinations; administrators and experts gain deeper modules only when authorized.  
**Remaining risk:** More can become a dumping ground.  
**Improvement:** Set a threshold: any item used weekly by a majority of a role must be evaluated for Home or contextual surfacing rather than buried in More.

### Cognitive Load Theory

**Strength:** Tasks are chunked by responsibility, and role workspaces hide organizational complexity.  
**Remaining risk:** Cross-product switching may burden users with multiple jobs.  
**Improvement:** Preserve scope, recent context, and task queues; allow favorites without allowing personal taxonomy drift.

### Hick's Law

**Strength:** Five driver choices and filtered product catalogs reduce simultaneous choices.  
**Remaining risk:** An app switcher with 50 visible items still fails.  
**Improvement:** Use pinned, recent, role-recommended, and searchable catalog sections; never render all products as equal tiles.

### Fitts's Law

**Strength:** Bottom navigation and contextual primary actions are reachable and large on mobile.  
**Remaining risk:** Capture in the center may be mistaken for a generic floating action.  
**Improvement:** Keep it a labeled tab, not an unlabeled oversized icon; within tasks, use one large explicit primary action.

### Nielsen's heuristics

- **Visibility of status:** persistent upload, trip, payroll, context, demo, and View As states.
- **Match with real world:** Trips, Pay, My vehicle, Needs attention.
- **User control:** safe back behavior, draft retention, clear exit from special modes.
- **Consistency:** same nouns and states across products and devices.
- **Error prevention:** scope identity, restricted high-risk actions, preselected context, separation of duties.
- **Recognition over recall:** recent work, next tasks, expected documents, product catalog aliases.
- **Efficiency:** keyboard search, filters, bulk enterprise workflows, contextual driver shortcuts.
- **Minimalism:** utilities and admin tools do not compete with business work.
- **Recovery:** rejection states explain what failed and how to correct it.
- **Help:** contextual support tied to the current record and role.

### Accessibility

The architecture supports—but does not by itself guarantee—WCAG-aligned implementation. Required behavioral standards include text labels with icons, non-color state indicators, logical focus order, keyboard access, adequate touch targets, screen-reader names, zoom/reflow support, plain error language, language selection, and no critical information conveyed only by spatial placement.

Driver use requires additional attention to glare, vibration, one-handed use, intermittent connectivity, limited time, language accessibility, and safe interaction. The product must never encourage interaction while driving.

### Enterprise UX

**Strength:** Clear data authority, approvals, audit, scope, role boundaries, and exception queues.  
**Remaining risk:** Local teams may request shortcut dashboards that become shadow products.  
**Improvement:** Require every proposed shortcut to declare its canonical destination and mutation owner.

### Mobile UX

**Strength:** Task-first navigation and capture flow match field work.  
**Remaining risk:** Too many attention cards can turn Home into an anxiety feed.  
**Improvement:** Rank by safety, time sensitivity, operational dependency, and financial impact; collapse informational notices.

### Discoverability and learnability

**Strength:** Stable labels, product homes, search aliases, and contextual shortcuts reduce training.  
**Remaining risk:** Different driver and enterprise labels can confuse support staff.  
**Improvement:** Maintain approved aliases in search and support tooling—for example Pay → Payroll and My vehicle → Fleet asset.

### Challenge to this design

Seven products may still be too many for ELM CONNECT's current maturity. The architecture therefore does **not** require launching seven visible products immediately. A product can exist in the target model while remaining unentitled, unreleased, or represented by a module until its workflows mature. The shell should expose only products that provide coherent user value today.

Analytics is the weakest immediate product candidate. If ELM CONNECT initially offers only fixed dashboards, keep those dashboards inside their owning products and delay the Analytics catalog entry. Promote Analytics only when cross-domain metric governance, report discovery, subscriptions, and analysis workflows are real.

Workforce is also a candidate for staged promotion. If recruiting and onboarding remain a separate public site with minimal internal worker lifecycle, keep Workforce out of the switcher until it provides a coherent employee/recruiter workspace.

This staged visibility preserves the long-term model without pretending unfinished capability is a product.

---

## 26. Five-Year Scalability

The architecture scales to 50 products, 500 modules, and 5,000 pages because navigation is resolved through metadata and relevance rather than global enumeration.

### Scaling mechanisms

1. **Product catalog:** searchable, entitlement-filtered, pinnable, and grouped into stable families.
2. **Role composition:** each user sees a bounded workspace derived from role, permissions, company, carrier, enabled products, feature flags, environment, and View As state.
3. **Canonical routes:** search, notifications, AI, and shortcuts all resolve to one authoritative page.
4. **Independent product navigation:** 500 modules never appear in one shell; only active-product modules appear.
5. **Federated ownership with central governance:** domain owners govern records and workflows; platform governance controls taxonomy, identity, audit, states, and shell behavior.
6. **White-label separation:** brand, terminology aliases, enabled products, and theme vary by tenant without changing capability identity.
7. **Portal separation:** customers, brokers, vendors, and public API consumers receive purpose-built experiences over governed records—not the internal enterprise menu.
8. **Stable integration contracts:** integrations connect to authoritative capabilities and events rather than screen-specific workflows.
9. **Search as accelerator, not substitute:** expert users can jump directly; first-time users can still browse a coherent hierarchy.
10. **Lifecycle states:** unreleased, disconnected, demo-only, and restricted capabilities remain intentional and governed.

### Product families at larger scale

When the catalog becomes large, products may be grouped under non-clickable families such as **Transportation**, **Workforce**, **Assets**, **Risk**, **Financial**, **Intelligence**, and **External Portals**. Families organize the switcher but do not introduce another navigation hierarchy or own data.

---

## 27. Final Recommendation

ELM CONNECT should adopt the following target architecture:

- **Platform:** shared identity, context, search, notifications, documents, ELM AI, audit, configuration, integrations, feature management, security, and tenant services.
- **Business products:** Operations, Payroll, Fleet, Safety & Compliance, Workforce, Finance, and—when sufficiently mature—Analytics.
- **Role workspaces:** especially Driver Workspace, which composes authoritative capabilities without becoming another system of record.
- **Driver navigation:** Home, Trips, Capture, Pay, More.
- **Enterprise shell:** one product switcher, one global utility area, one active-product navigation, and separated administrative entry.

The most important correction is to stop treating every visible destination as a peer product. **Drive is a workspace. Documents and ELM AI are platform services. Mission Control is a dashboard pattern. Carrier/company are context. View As and Showcase are controlled administrative modes. Actions belong inside records.**

Do not force visual symmetry across the portfolio. Clear boundaries are more valuable than eight matching tiles.

The governing test for every future addition is:

> What responsibility owns this capability, what is its one authoritative home, and why does this user need to see it here?

If those questions cannot be answered precisely, the capability is not ready for navigation.

