# ELM CONNECT — Enterprise Decision Log

**Version:** 1.0.0  
**Status:** Authoritative  
**Authority:** ELM CONNECT Enterprise Governance Council  
**Last Updated:** 2026-07-21

## Purpose

This document records approved product, architecture, engineering, security, UX, data, and governance decisions for ELM CONNECT.

Every AI agent, engineer, reviewer, and future contributor must read this document before proposing or implementing material changes.

No approved decision may be silently changed. A conflicting proposal must either conform to the existing decision or submit a formal replacement decision with rationale, impact, migration requirements, and approval status.

## Decision Status

- **PROPOSED** — Under review; not authorized for implementation.
- **APPROVED** — Authoritative and binding.
- **SUPERSEDED** — Replaced by a newer approved decision.
- **REJECTED** — Considered and not authorized.

## Decision Record Template

```text
Decision ID:
Title:
Status:
Date:
Owner:
Decision:
Rationale:
Consequences:
Implementation Constraints:
Related Documents:
Supersedes:
Superseded By:
```

---

## DEC-0001 — Platform Identity

**Status:** APPROVED  
**Date:** 2026-07-21  
**Owner:** Enterprise Governance Council

### Decision

ELM CONNECT is an **Enterprise Transportation Operating System (ETOS)**.

It is not merely payroll software, dispatch software, a document uploader, a driver portal, or a trucking application. Those are modules within a broader enterprise platform.

### Rationale

The platform is intended to unify operations, payroll, dispatch, accounting, drivers, fleet, maintenance, safety, compliance, reporting, communications, documents, AI, and future SaaS capabilities.

### Consequences

- Modules must share consistent business truth, identity, security, auditability, and UX principles.
- Local feature decisions must not undermine enterprise architecture.
- New work must be evaluated for cross-module impact.

---

## DEC-0002 — Current Production Technology Stack

**Status:** APPROVED  
**Date:** 2026-07-21  
**Owner:** Enterprise Architecture Council

### Decision

The current authorized stack is:

- React
- Vite
- Netlify
- Google Apps Script
- Google Sheets
- Google Drive

### Rationale

This stack supports the current operating constraints, existing production behavior, low-cost deployment, and the user’s present technical environment.

### Consequences

- No AI or engineer may redesign the backend without explicit approval.
- Improvements should preserve current deployment and integration contracts unless a migration decision is approved.
- Google Sheets may remain a current data store, but UI components must not depend directly on sheet layouts.

---

## DEC-0003 — Future Migration Strategy

**Status:** APPROVED  
**Date:** 2026-07-21  
**Owner:** Enterprise Architecture Council

### Decision

Future migration may include PostgreSQL, Supabase, Next.js, managed APIs, cloud functions, and enterprise identity services.

All current UI and service work should use stable DTOs, adapters, and repository boundaries so backend migration does not require a full user-facing redesign.

### Consequences

- UI components consume business objects, not raw sheet rows.
- Backend-specific mapping belongs in adapters or services.
- Future migration is enabled, not prematurely implemented.

---

## DEC-0004 — Production Upload Pipeline

**Status:** APPROVED  
**Date:** 2026-07-21  
**Owner:** Engineering Council

### Decision

The existing upload path is production-critical and must be preserved:

```text
React Client
  → Netlify Function Gateway
  → Google Apps Script
  → Google Drive
  → Google Sheets / DB_Docs
  → Notifications
```

### Consequences

- Upload changes require regression testing.
- Secrets remain server-side.
- Company isolation and file validation may not be weakened.
- Existing BOL/POD and expense behavior must not be broken during UX refactoring.
- Large-scale rewrites of the upload workflow require explicit approval.

---

## DEC-0005 — Payroll and Financial Integrity

**Status:** APPROVED  
**Date:** 2026-07-21  
**Owner:** Financial Integrity Council

### Decision

Payroll and financial history follow append-only, immutable-snapshot, auditable correction principles.

Historical financial truth must never be silently overwritten or recalculated without traceable correction records.

### Consequences

- Corrections create explicit records.
- Approved snapshots remain immutable.
- Defaults may not conceal unresolved pay rules.
- Financial calculations must be reproducible and reviewable.

---

## DEC-0006 — Enterprise UX Standard

**Status:** APPROVED  
**Date:** 2026-07-21  
**Owner:** Chief Experience Officer

### Decision

Every operational screen should answer:

1. What needs attention?
2. Why does it need attention?
3. What is the fastest safe action?

ELM CONNECT is Mission Control first, not dashboard decoration first.

### Consequences

- Avoid card-grid clutter and unnecessary visual theater.
- Prefer exception-first workflows.
- Users complete work through guided application workflows, not direct spreadsheet editing.
- Convenience may not weaken auditability or safety.

---

## DEC-0007 — Driver Experience Standard

**Status:** APPROVED  
**Date:** 2026-07-21  
**Owner:** Product and Experience Councils

### Decision

The driver experience is:

- Mobile-first
- Low cognitive load
- High contrast
- Large-touch-target friendly
- Offline-resilient where practical
- Camera-first for document capture
- Clear under poor connectivity
- Honest about live versus future capability

### Consequences

- Typing should be minimized.
- Error messages must be operational and actionable.
- No driver should lose work because a connection drops without receiving a clear recovery path.
- Driver safety and usability take precedence over decorative complexity.

---

## DEC-0008 — AI Role Separation

**Status:** APPROVED  
**Date:** 2026-07-21  
**Owner:** Enterprise Governance Council

### Decision

Tool responsibilities are separated as follows:

**Google AI Studio — Product and Experience Council**

- Information architecture
- UX and UI direction
- User journeys
- Workflow design
- Visual hierarchy
- Design system proposals
- Accessibility and product psychology

**Cursor — Engineering Lead**

- Repository inspection
- Implementation
- Refactoring
- Testing
- Security
- Build quality
- Netlify and Apps Script integration
- Git and pull-request execution

**ChatGPT — Enterprise Governance Board**

- Architecture review
- Governance review
- Cross-document consistency
- Product/engineering conflict resolution
- Approval or rejection recommendations
- Architecture-drift prevention

### Consequences

- AI Studio is not the repository authority.
- Cursor does not independently redefine product strategy.
- Material implementation passes governance review before merge.

---

## DEC-0009 — Repository Evidence Standard

**Status:** APPROVED  
**Date:** 2026-07-21  
**Owner:** Engineering Governance

### Decision

Repository claims must be supported by repository evidence.

Every material claim is classified as:

- **VERIFIED**
- **INFERRED**
- **PROPOSED**
- **UNKNOWN**

### Consequences

No contributor may invent files, routes, APIs, scripts, integrations, build results, security behavior, or backend behavior and present them as current state.

---

## DEC-0010 — Branch and Merge Strategy

**Status:** APPROVED  
**Date:** 2026-07-21  
**Owner:** Engineering Governance

### Decision

- `main` is protected and production-authoritative.
- No direct commits to `main`.
- Feature work occurs on dedicated branches.
- Driver experience branches must begin from the same approved baseline when comparative work is performed.
- Pull requests are required before merge.

Approved working branch patterns include:

- `feature/driver-experience-ai-studio`
- `feature/driver-experience-cursor`
- `governance/*`
- `fix/*`

### Consequences

- No production deployment or merge occurs without explicit Product Owner approval.
- AI Studio and Cursor must not overwrite or silently copy each other’s working branches.

---

## DEC-0011 — Capability Classification

**Status:** APPROVED  
**Date:** 2026-07-21  
**Owner:** Product Governance

### Decision

Every capability must be represented as one of:

- **LIVE** — Connected and operating against verified production behavior.
- **READY FOR INTEGRATION** — UI/service boundaries exist, but final production integration is incomplete.
- **DEMONSTRATION** — Uses placeholder or non-authoritative data and is visibly labeled.
- **FUTURE** — Not currently implemented.

### Consequences

No demonstration or placeholder capability may be presented as live production functionality.

---

## DEC-0012 — Implementation Governance Gate

**Status:** APPROVED  
**Date:** 2026-07-21  
**Owner:** Enterprise Governance Council

### Decision

Before material implementation:

- Confirm product requirement
- Verify repository evidence
- Assess architecture impact
- Assess security impact
- Assess regression risk
- Define acceptance criteria

After implementation:

- Report files changed
- Run build validation
- Run available lint/type checks
- Test affected workflows
- Review accessibility
- Review security
- Review performance
- Provide screenshots or equivalent evidence for UI changes

### Consequences

A successful build alone does not constitute production approval.

---

## DEC-0013 — Driver Portal Phase 1 Direction

**Status:** APPROVED  
**Date:** 2026-07-21  
**Owner:** Product Governance

### Decision

Driver Portal Phase 1 will preserve the live upload terminal while evolving it into an exception-first driver operating experience.

Priority sequence:

1. Shared design tokens and application shell
2. Mission Control / Today experience
3. Preserve and improve real BOL/POD and expense capture
4. Add integration-ready Loads, Documents, Pay, Equipment, Messages, and More experiences
5. Complete accessibility, security, performance, and regression review

### Consequences

- Existing integrations are preserved.
- The current large upload workflow is not rewritten wholesale without evidence and regression coverage.
- New functionality must be honestly classified.

---

## DEC-0014 — Security Baseline

**Status:** APPROVED  
**Date:** 2026-07-21  
**Owner:** Security Council

### Decision

- Secrets remain outside client bundles.
- Netlify Functions remain the public gateway for protected backend operations.
- Google Apps Script must independently validate tokens, tenant/company scope, and allowed operations.
- Client state is never treated as sole authorization.
- File type, size, and company restrictions may not be weakened.
- Security improvements must preserve operational usability.

---

## Open Decision Queue

| Decision ID | Topic | Status | Owner |
|---|---|---|---|
| DEC-0015 | Final driver navigation model | PROPOSED | Product Council |
| DEC-0016 | Session hardening strategy | PROPOSED | Security Council |
| DEC-0017 | Offline upload recovery architecture | PROPOSED | Engineering Council |
| DEC-0018 | Messaging MVP architecture | PROPOSED | Product + Engineering |
| DEC-0019 | Driver Portal design-system branding | PROPOSED | Experience Council |

## Change Control

Updates to this document require:

1. A dedicated branch or approved documentation branch.
2. A clear commit message.
3. Pull-request review.
4. Identification of decisions added, changed, superseded, or rejected.
5. Product Owner approval for material changes.
