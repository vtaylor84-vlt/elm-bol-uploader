# ELM CONNECT Driver Experience — Screen Specifications

Specifications for primary Driver Experience modules. Applies to **production** and **Showcase** shells unless noted. Visual language: existing Driver Terminal / ELM CONNECT (dark, electric blue). Do **not** redesign unless explicitly asked.

---

## Cross-cutting rules

### Attention-first design

1. **Exceptions and due-now work outrank** earnings, history, and marketing.
2. One primary CTA per screen when an urgent action exists (e.g., Simulate POD / Open Capture).
3. Deep links from alerts land on the screen that completes the action.
4. Status and disclosure chips (`DEMONSTRATION DATA`, `NOT CONNECTED TO PRODUCTION`, etc.) stay visible without hunting.
5. Empty / disconnected production states are **truthful**, never filled with demo loads or pay.

### Driver-facing language

| Do | Don’t |
|----|-------|
| Short, operational words: load, stop, upload, pay, truck | Internal jargon: adapter, fixture pack, schema, tenantId |
| “Demonstration data” / “Not connected” when true | Imply live payroll or live GPS when disconnected |
| “Upload POD” / “Open Capture” | “Invoke submission pipeline” |
| Company display names (Greenleaf Xpress, BST Expedite Inc) | Mix GLX and BST copy in one session |
| Explain next step ownership (“Waiting on you” / “Waiting on office”) when known | Invent owners or SLAs not confirmed in source |

**Unconfirmed copy:** Do not invent reimbursement policy text, legal English-proficiency wording, or pay dispute SLAs.

### Shell

- **Mobile:** bottom nav — Today, Loads, Capture, Pay, More
- **Desktop:** left nav rail — same destinations
- Showcase uses `routePrefix=/showcase`; Exit Showcase returns to production Today

---

## 1. Today (Mission Control)

| | |
|--|--|
| **Routes** | `/today`, `/showcase/today` |
| **Purpose** | Answer: what am I doing now, where, what’s due, what needs attention, what am I getting paid (when known) |
| **Primary module** | Today |

### Layout (top → bottom)

1. Header: driver display name, company label, connection / capability label  
2. **Exceptions** (if any) — severity-ordered  
3. **Active haul** card — load #, status, O/D, next milestone, appointment/countdown, truck/trailer, missing docs  
4. **Primary action** — single dominant CTA  
5. **Earnings** strip — period + projected (Showcase demo) or disconnected note (production)  
6. **Tasks** list — due_now before due_soon  

### Production behavior

- `activeHaul: null`, empty exceptions/tasks when no live load service  
- Copy directs driver to Capture for live BOL/POD/expenses  
- Never show BST-48291 / GLX-7721 or other Showcase seeds  

### Showcase behavior

- Carrier-scoped fixtures from scenario pack  
- Scenario switches exceptions, milestones, primary CTA, earnings note  
- All money and load facts labeled demonstration  

### Attention-first notes

- Critical exception (e.g., urgent POD) must appear before earnings  
- Primary action helper text: “SIMULATED ACTION · not a production upload” in Showcase  

---

## 2. Loads

| | |
|--|--|
| **Routes** | `/loads`, `/showcase/loads` |
| **Purpose** | Current and recent trips at a glance |
| **Primary module** | Loads |

### Production

- Empty / not-connected state  
- CTA to Capture for uploads when driver has work documents  

### Showcase

- List: active demo load + at least one delivered historical demo load  
- Each row: load number, O/D, status, `DEMONSTRATION DATA`  
- No full multi-stop editor in this phase  

### Language

- Prefer “Load GLX-7721” over “mission object”  
- Status labels: En route, Delivered, Delayed — weather, etc. (fixture vocabulary)

---

## 3. Capture

| | |
|--|--|
| **Routes** | `/capture` (and `/workspace`), `/showcase/capture` |
| **Purpose** | Document and expense intake |
| **Primary module** | Capture |

### Production modules

| Module | Flow |
|--------|------|
| BOL / POD | → `/submissions/bol-pod` → review → success → Netlify upload |
| Expenses / receipts | → `/submissions/receipt` → review → success |

**Rules:** JPG/PNG; HEIC blocked at gateway; preserve `loadNum` / `bolNum` / `loadId` separation; no client `UPLOAD_TOKEN`.

### Showcase modules

| Module | Behavior |
|--------|----------|
| BOL / POD (simulated) | Local sim confirmation only |
| Expenses (simulated) | Local sim confirmation only |

Badge: `SIMULATED ACTION`. Must not navigate into production submission upload that hits the gateway with Showcase intent, or must be blocked if it does.

### Attention-first

- When Today says POD required, Capture is the destination of the urgent CTA  

---

## 4. Pay

| | |
|--|--|
| **Routes** | `/pay`, `/showcase/pay` |
| **Purpose** | Settlement visibility |
| **Primary module** | Pay |

### Production

- Title: Pay  
- Body: payroll/settlement **not connected** in this build  
- No fabricated gross/net  

### Showcase

- Period, gross, deductions, net from fixtures  
- Chip: `DEMONSTRATION DATA`  
- Note: not live pay  

### Deferred on this screen (vision only)

Line-item explanations, disputes, escrow ledgers, payroll timeline, downloadable statements.

### Language

- “Settlement preview (demonstration)”  
- Never “Your deposit of …” for Showcase figures  

---

## 5. Messages

| | |
|--|--|
| **Routes** | `/showcase/messages` (production inbox deferred) |
| **Purpose** | Operational conversations tied to load/truck/settlement/case |
| **Primary module** | Messages |

### Showcase content

- List: from, subject, preview, unread, disclosure  
- Action: **Simulate acknowledge** → `SIMULATED ACTION` status  

### Rules from source

- Prefer structured, entity-linked threads over free-floating chat  
- No real SMS/email send from Showcase  

### Production

- Outbound upload notifications exist in GAS; full inbox **deferred**  

---

## 6. Equipment (Truck)

| | |
|--|--|
| **Routes** | `/showcase/truck` |
| **Purpose** | Assigned power unit / trailer status |
| **Primary module** | Equipment |

### Showcase

- Truck #, trailer #, status, next service label  
- `DEMONSTRATION DATA`  
- Optional: simulate maintenance request  

### Deferred

Live VIN/credentials, fault codes, DVIR checklists, roadside ETA integrations.

### Language

- “Attention required” / “In service”  
- Avoid raw telematics codes without plain-language meaning  

---

## 7. Safety

| | |
|--|--|
| **Routes** | `/showcase/safety` |
| **Purpose** | Safety posture and required acknowledgements |
| **Primary module** | Safety |

### Showcase

- Score / status label; open items list when `safety_review`  
- Disclosure: typically `FUTURE CAPABILITY` or demonstration  

### Design ethics (source)

- Contextual and fair; **not** a hidden punishment system  
- Avoid gamification that rewards speeding or skipped breaks  

### Deferred

Dashcam feeds, violation history, accident response workflow, ELD deep links.

---

## 8. More

| | |
|--|--|
| **Routes** | `/more`, `/showcase/more` |
| **Purpose** | Profile, secondary modules, Showcase entry/exit |
| **Primary module** | More |

### Production

- Links to Today / Capture  
- Admin: **Enter Showcase** when grant valid  
- Non-admins: no Showcase entry  

### Showcase

- Links to Messages, Truck, Safety, Home Time, Benefits, Documents, Performance, Timeline, Assistant  
- **Exit Showcase** → production Today  

### Nested Showcase modules (summary)

| Module | Route | Driver language |
|--------|-------|-----------------|
| Home Time | `/showcase/home-time` | Request / pending window (demo) |
| Benefits | `/showcase/benefits` | Benefits summary (future) |
| Documents | `/showcase/documents` | Packet status (demo) |
| Performance | `/showcase/performance` | On-time / safety labels (demo) |
| Timeline | `/showcase/timeline` | Chronological demo events |
| AI Assistant | `/showcase/assistant` | Simulated Q&A |

---

## 9. Notifications

| | |
|--|--|
| **Routes** | No dedicated production route in current IA; proto via Today exceptions |
| **Purpose** | Critical / action-required / informational alerts with deep links |
| **Primary module** | Notifications |

### Current Showcase / production

- Treat Today exceptions + tasks as the interim notification surface  
- Categories from vision (Critical / Action Required / Informational) guide severity mapping  

### Deferred

Push, preference center, quiet hours, escalation when ignored, full history inbox.

### Attention-first

- Critical > Action Required > Informational  
- Deep link must open the completing workflow  

---

## 10. Search

| | |
|--|--|
| **Routes** | Deferred |
| **Purpose** | Natural search across loads, docs, pay, messages, equipment, timeline |
| **Primary module** | Search |

### Spec for future build

- Examples from source (“Show my Week 18 settlement”, “Find my POD from Chicago”, …)  
- **Hard requirement:** tenant filter (GLX/BST) on every query  
- Results open source records; no invented hits  

### Showcase interim

- Do not fake a search product; omit or label FUTURE CAPABILITY if placeholder appears  

---

## 11. AI Assistant

| | |
|--|--|
| **Routes** | `/showcase/assistant` |
| **Purpose** | Help driver understand authorized data and next steps |
| **Primary module** | AI |

### Showcase

- Thread seeded with disclaimer: simulated only  
- `askAssistant` returns `SIMULATED ACTION` / not connected  

### Must not (source)

Alter pay; approve expenses; change load status without confirmation; release payments; modify logs; merge identities; make compliance claims without verified data.

### Must (source)

Escalate to human when uncertainty matters; never invent operational or financial answers when live.

### Language

- “I’m a demonstration assistant — answers are simulated.”  
- Prefer “I don’t have live payroll connected” over fabricated explanations  

---

## Viewport checklist (all screens)

| Check | Mobile | Desktop |
|-------|--------|---------|
| Primary CTA reachable without scroll when urgent | Required | Required |
| Disclosure visible above fold in Showcase | Required | Required |
| Bottom nav / rail labels match IA | Required | Required |
| No GLX/BST cross-leak in copy or fixtures | Required | Required |
| Production empty states not demo-looking | Required | Required |

---

*Align implementation with `pages/TodayPage.tsx`, `MissionPlaceholders.tsx`, `WorkspacePage.tsx`, `ShowcaseFutureModulePage.tsx`, and mission-control shell components.*
