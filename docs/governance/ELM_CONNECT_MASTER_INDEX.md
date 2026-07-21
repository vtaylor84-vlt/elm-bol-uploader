# ELM CONNECT — Master Index

**Version:** 1.0.0  
**Status:** Authoritative Entry Point  
**Last Updated:** 2026-07-21

## Purpose

This is the starting point for every AI agent, engineer, reviewer, and future contributor working on ELM CONNECT.

Before beginning material work, read the documents in the order listed below.

## Required Reading Order

1. [Enterprise Decision Log](./ELM_CONNECT_DECISION_LOG.md)
2. [AI Operating Model](./ELM_CONNECT_AI_OPERATING_MODEL.md)
3. [Program Status](./ELM_CONNECT_PROGRAM_STATUS.md)
4. Enterprise Constitution
5. Enterprise Product Blueprint
6. Enterprise Architecture Manual / Plan
7. Engineering Master Document
8. Product Governance Manual
9. Production Readiness Status
10. Module-specific authoritative documents

## Governance Documents in This Repository

| Document | Purpose | Authority |
|---|---|---|
| `ELM_CONNECT_DECISION_LOG.md` | Records binding decisions and open decisions | Enterprise Governance Council |
| `ELM_CONNECT_AI_OPERATING_MODEL.md` | Defines AI roles, workflow, evidence, and approvals | Enterprise Governance Council |
| `ELM_CONNECT_PROGRAM_STATUS.md` | Shows active phase, branches, gates, risks, and next actions | Program Management Office |
| `ELM_CONNECT_MASTER_INDEX.md` | Provides the authoritative reading order and document map | Enterprise Governance Council |

## Existing External Authoritative Documents

The following documents are part of the broader ELM CONNECT governance system and should be linked or copied into the repository when appropriate:

- ELM CONNECT Enterprise Constitution
- ELM CONNECT Enterprise Product Blueprint
- ELM CONNECT Enterprise Architecture Manual
- ELM CONNECT Executive PMO Operating Model
- ELM CONNECT Engineering Master Document
- ELM CONNECT Program Management Board
- ELM CONNECT Production Readiness Status
- ELM CONNECT Historical Payroll Migration Blueprint
- ELM CONNECT Product Governance Manual
- Cursor rules / engineering operating rules

## Authority Hierarchy

When documents conflict, use this order unless a newer approved decision explicitly changes it:

1. Enterprise Constitution
2. Approved Decision Log entries
3. Enterprise Architecture
4. Product Blueprint
5. Security and Financial Integrity standards
6. Engineering standards
7. Production Readiness and approved release gates
8. Module specifications
9. Temporary implementation plans
10. AI-generated recommendations

AI-generated output is never automatically authoritative.

## Current Active Workstream

**Workstream:** Driver Portal Modernization  
**Phase:** Phase 1A  
**Goal:** Preserve the live upload terminal while establishing an enterprise driver shell and Mission Control experience.

See [Program Status](./ELM_CONNECT_PROGRAM_STATUS.md) for current gates and blockers.

## Module Index

| Module | Current Authority / Status |
|---|---|
| Driver Portal | Active workstream; Decision Log and Program Status govern |
| Payroll | Append-only and immutable snapshot principles govern |
| Historical Payroll Migration | Historical Payroll Migration Blueprint |
| Dispatch | Product Blueprint and Architecture authority |
| Accounting | Product Blueprint and financial integrity decisions |
| Fleet and Equipment | Product Blueprint; implementation pending |
| Maintenance | Product Blueprint; implementation pending |
| Safety and Compliance | Product Blueprint; implementation pending |
| Documents | Current upload pipeline and DB_Docs behavior |
| Communications | Open architecture decision |
| AI | Must augment verified business truth; no invented production behavior |
| Future SaaS | Adapter/DTO migration strategy governs |

## Work Intake Rule

Every material request should identify:

- Business outcome
- Primary user
- Current problem
- Requested capability
- Current capability classification
- Security impact
- Data and integration impact
- Acceptance criteria
- Authorized branch

## Documentation Update Rule

A pull request must update the relevant governance document when it:

- changes an approved architecture decision;
- adds or removes a production capability;
- changes branch or release strategy;
- changes security, tenant, data, audit, or financial behavior;
- changes the active program phase;
- supersedes a prior decision.

## Fast Start

For a new AI session, provide this instruction:

> Read the ELM CONNECT Master Index, Decision Log, AI Operating Model, and Program Status before doing any work. State your assigned role, the authoritative constraints, the current phase, and any conflicts you identify. Do not implement until the requested role and branch are confirmed.
