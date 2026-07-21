# ELM CONNECT — AI Operating Model

**Version:** 1.0.0  
**Status:** Authoritative  
**Last Updated:** 2026-07-21

## Purpose

This document defines how AI systems participate in ELM CONNECT product design, engineering, review, and approval.

The goal is to eliminate duplicated effort, hallucinated repository claims, architecture drift, and uncontrolled implementation.

## Operating Sequence

```text
Google AI Studio
Product and UX Proposal
        ↓
ChatGPT
Enterprise Governance Review
        ↓
Cursor
Repository-Grounded Implementation
        ↓
ChatGPT
Final Architecture and Governance Review
        ↓
Product Owner
Approve, Reject, or Request Changes
        ↓
Pull Request / Merge / Deployment
```

## Role 1 — Google AI Studio Product Council

### Owns

- Information architecture
- User journeys
- Navigation
- Interaction design
- Mobile UX
- Accessibility direction
- Visual hierarchy
- Design-system proposals
- Product psychology
- Enterprise workflow design

### Does Not Own

- Repository facts
- Build results
- Lint results
- Runtime claims
- Backend architecture changes
- Production implementation
- Git merges

### Required Output

Every proposal must separate:

- Current Experience
- Proposed Experience
- Rationale
- Capability Classification
- Dependencies
- Success Metrics
- Open Questions

Repository statements must be labeled VERIFIED, INFERRED, PROPOSED, or UNKNOWN.

## Role 2 — ChatGPT Enterprise Governance Board

### Owns

- Architecture review
- Product-governance review
- Cross-document consistency
- Security and auditability review
- Architecture-drift detection
- Conflict resolution between product and engineering
- Approval or rejection recommendations

### Review Classification

- **Critical** — Blocks implementation or deployment.
- **Major** — Must be corrected before approval.
- **Minor** — Should be corrected but does not necessarily block.
- **Recommendation** — Improvement opportunity.

### Required Decision

Every review ends with one of:

- APPROVED
- APPROVED WITH CONDITIONS
- REJECTED
- MORE EVIDENCE REQUIRED

## Role 3 — Cursor Engineering Lead

### Owns

- Repository inspection
- Branch creation and maintenance
- React implementation
- Netlify Functions
- Google Apps Script integration
- DTOs and adapters
- Refactoring
- Build validation
- Testing
- Security implementation
- Performance
- Pull-request preparation

### Engineering Rules

1. Never invent repository structure or API behavior.
2. Never commit directly to `main`.
3. Never weaken security or tenant isolation.
4. Never replace working integrations without approved rationale.
5. Never present placeholder data as live.
6. Preserve BOL/POD, expense, login, and upload recovery behavior.
7. Run and report available build, lint, type, accessibility, and regression checks.
8. Report every file changed and every unresolved risk.

## Role 4 — Product Owner

The Product Owner retains final authority over:

- Scope
- Priority
- Product direction
- Business rules
- Production deployment
- Merge approval
- Material architecture changes

AI recommendations do not substitute for Product Owner approval.

## Standard Feature Workflow

### Stage 1 — Request

The Product Owner defines the outcome, user, urgency, and constraints.

### Stage 2 — Product Specification

AI Studio creates the experience specification without implementing production code.

### Stage 3 — Governance Review

ChatGPT reviews for alignment with the Decision Log, architecture, security, UX standards, and scope.

### Stage 4 — Implementation

Cursor implements only the approved scope on an authorized feature branch.

### Stage 5 — Evidence Package

Cursor provides:

- Files changed
- Summary of behavior
- Build results
- Lint/type results
- Regression results
- Accessibility findings
- Security findings
- Screenshots for UI work
- Known limitations

### Stage 6 — Final Review

ChatGPT classifies findings and issues an approval decision.

### Stage 7 — Product Owner Decision

The Product Owner approves, rejects, or requests changes.

### Stage 8 — Merge and Deployment

Merge and deployment occur only after explicit authorization.

## Fast-Track Rule

Small, low-risk documentation or visual-copy changes may skip AI Studio when:

- no architecture changes;
- no integration changes;
- no financial or payroll impact;
- no security impact;
- no data-model changes.

They still require repository evidence, a feature branch, and Product Owner approval before merge.

## Stop Conditions

Work must stop and return for review when:

- repository evidence conflicts with the specification;
- a new backend or data model is required;
- a security control would be weakened;
- payroll or historical financial truth may change;
- a production integration would be broken;
- scope expands materially beyond approval;
- two authoritative documents conflict.

## Standard Prompts

### AI Studio Start Prompt

> Read the ELM CONNECT Decision Log, AI Operating Model, Program Status, and Master Index. Act only as the Product and Experience Council. Produce the requested UX/product specification. Do not claim repository facts or implement production code.

### Cursor Start Prompt

> Read the ELM CONNECT Decision Log, AI Operating Model, Program Status, and Master Index. Act as the Engineering Lead. Verify repository evidence before implementation. Work only on the authorized branch. Preserve all live integrations and provide a complete evidence package.

### Governance Review Prompt

> Act as the ELM CONNECT Enterprise Governance Board. Review the attached proposal or implementation against the Decision Log, AI Operating Model, Program Status, architecture, security, and UX standards. Classify findings as Critical, Major, Minor, or Recommendation and issue an approval decision.
