# ELM CONNECT Driver Showcase — Fixture Data Spec

Defines demonstration data for Showcase Mode. Fixtures are **not** production records and must never be written to Drive, DB_Docs, payroll, or live messaging.

**Code:** `fixtures/showcase/personas.ts`, `fixtures/showcase/scenarioPacks.ts`  
**Types:** `types/showcase.ts`

---

## Principles

1. **Namespace:** Prefer `DEMO-*` for internal IDs (e.g., `loadId: DEMO-GLX-7721`). Display load numbers may use carrier-style codes (`GLX-7721`, `BST-48291`) **only** inside Showcase.
2. **Carrier isolation:** Every fixture row carries `carrierId` `GLX` | `BST`. A GLX session never receives BST seeds.
3. **Coherent relationships:** Truck, trailer, load, messages, pay, safety, and timeline for a scenario must refer to the same active load/equipment set.
4. **No real PII / payroll:** Synthetic display names and phone/email patterns only. No real driver SSNs, bank accounts, live settlement amounts, or real employee personal data.
5. **Deterministic presentation:** Scenario packs are pure functions of `(carrierId, scenarioId, displayName)`. Avoid `Math.random()` for demo facts. Timestamps/labels use relative clock language (“Today · morning”) unless a fixed demo clock is introduced.
6. **Disclosure on every surface:** `DEMONSTRATION DATA` | `FUTURE CAPABILITY` | `SIMULATED ACTION` | `NOT CONNECTED TO PRODUCTION`.

---

## Carrier demo config

| Carrier | Display name | Legal name (demo) | Support phone (demo) | Support email (demo) |
|---------|--------------|-------------------|----------------------|----------------------|
| GLX | Greenleaf Xpress | Greenleaf Xpress LLC | 800-555-0142 | maintenance@greenleafxpressllc.com |
| BST | BST Expedite Inc | BST Expedite Inc | 800-555-0199 | nick@bstexpediteinc.com |

Phones/emails above are **demo placeholders** for Showcase UI only — not authority for production contact routing.

---

## Personas

| Persona id | Carrier | Role | Demo driver id | Display name | Default scenario |
|------------|---------|------|----------------|--------------|------------------|
| `glx-driver` | GLX | driver | GLX-D-204 | Avery Chen | normal |
| `glx-admin` | GLX | admin | GLX-A-01 | Morgan Ellis (GLX Admin) | normal |
| `bst-driver` | BST | driver | BST-D-881 | Jordan Rivers | normal |
| `bst-admin` | BST | admin | BST-A-01 | Casey Brooks (BST Admin) | normal |

Showcase entry for demos uses the **authenticated admin’s company** with Showcase adapters; personas supply display naming for packs.

---

## Seed equipment & loads (per carrier)

| Field | GLX | BST |
|-------|-----|-----|
| Active load # | GLX-7721 | BST-48291 |
| Internal loadId | `DEMO-GLX-7721` | `DEMO-BST-48291` |
| Origin | Columbus, OH | Dallas, TX |
| Destination | Charlotte, NC | Atlanta, GA |
| Truck | GLX-441 | T-204 |
| Trailer | GLX-T19 | TR-881 |
| History load # | GLX-7602 | BST-47110 |
| History O/D | Indianapolis → Nashville | Houston → Memphis |
| Demo commodity | Retail dry van | General freight |
| Demo weight | 38,400 lbs | 41,200 lbs |
| Demo gross (haul) | $2,410.00 | $2,850.00 |

**Production ban list:** These load numbers and city pairs must **not** appear on production `/today` or `/loads`.

---

## Scenario catalog

| ScenarioId | Label | Relationship effects (coherent pack) |
|------------|-------|--------------------------------------|
| `normal` | Normal operations | Base en-route haul; light task; standard earnings |
| `urgent_pod` | Urgent POD | At delivery; missing POD; critical exception; primary CTA → Capture sim; message preview mentions POD |
| `payroll_ready` | Payroll ready | Settlement-ready messaging; primary CTA → Pay; higher projected earnings labels |
| `maintenance` | Maintenance issue | Exception → truck; truck status Attention required; task to log maintenance |
| `safety_review` | Safety review | Safety open items; exception → Safety; score “Review open” |
| `road_breakdown` | Road breakdown | Critical roadside exception; haul status Breakdown; timeline may log breakdown |
| `storm_delay` | Storm delay | Weather exception; delayed status; +ETA risk label; message subject Weather advisory |
| `missing_paperwork` | Missing paperwork | Missing BOL+POD; documents Incomplete; exception → Documents |
| `perfect_week` | Perfect week | No critical exceptions; aspirational earnings; home time Approved (demo); messages mostly read |
| `new_driver` | New driver | Onboarding exception → Assistant; training task |

All monetary figures in scenarios are **demonstration labels**, not accounting truth.

---

## Entity relationship diagram (logical)

```
Persona (carrierId)
  └─ ScenarioPack
       ├─ MissionControl (activeHaul loadNum/truck/trailer)
       ├─ Loads[] (active + history, same carrierId)
       ├─ PaySummary (period aligned to mission.earnings)
       ├─ Messages[] (may reference loadNum in preview)
       ├─ TruckStatus (same truck/trailer as haul)
       ├─ SafetyStatus
       ├─ HomeTimeRequest
       ├─ Benefits[]
       ├─ Documents[] (titled with loadNum)
       ├─ Performance
       ├─ Timeline[] (events reference origin / loadNum)
       └─ AssistantTurn[]
```

---

## Simulated actions (no persistence)

| Action | Result disclosure | Persistence |
|--------|-------------------|-------------|
| submitPodSimulated | SIMULATED ACTION | None (ephemeral UI status) |
| submitReceiptSimulated | SIMULATED ACTION | None |
| acknowledgeMessage | SIMULATED ACTION | None |
| requestHomeTime | SIMULATED ACTION | None |
| requestMaintenance | SIMULATED ACTION | None |
| completeTraining | SIMULATED ACTION | None |
| inquirePayroll | SIMULATED ACTION | None |
| askAssistant | SIMULATED ACTION / not connected | None |

Optional `simulatedId` like `sim-<base36>` is ephemeral only.

---

## Deterministic clock notes

- Prefer relative labels: `Today · morning`, `Today · afternoon`, `Today · midday`.
- Do not depend on the wall clock for branching scenario content.
- If a frozen demo clock is added later, document the fixed ISO instant here and seed all `whenLabel` values from it.
- Appointment strings like `Today · afternoon` / `On schedule` are narrative, not live ETA calculations.

---

## PII and payroll prohibitions

| Forbidden in fixtures | Allowed |
|-----------------------|---------|
| Real driver names from Driver_Master | Synthetic personas (Avery Chen, etc.) |
| Real SSN, DOB, license, medical card numbers | Omitted or obviously fake masks if ever needed |
| Live bank / routing numbers | Omitted |
| Real settlement PDF contents | Summary labels only |
| Production upload tokens | Never |
| Cross-tenant phone books | Carrier-local demo support contacts only |

---

## Acceptance hooks for fixtures

- Unit: production adapter never contains `48291`, `Dallas`, `Atlanta` demo pairs used by Showcase  
- Unit: GLX pack `carrierId` on messages/truck/safety/loads is always `GLX`  
- E2E: production Today shows empty/truthful; Showcase Today shows labeled demonstration  

---

## Extending fixtures

1. Add `ScenarioId` to `types/showcase.ts` + `SCENARIO_OPTIONS`  
2. Extend `applyScenario` and any pack fields needed  
3. Keep seeds table as single source for load/truck identity  
4. Update this spec and Capability Matrix status if a deferred area becomes presentable  

---

*Do not invent business rules (pay rates, escrow targets, safety thresholds) beyond narrative demo labels without Product Owner confirmation.*
