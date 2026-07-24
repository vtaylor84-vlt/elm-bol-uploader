# View As — Security Boundaries (Driver Showcase)

**Updated:** 2026-07-22  
**Environment:** Admin Showcase on `feature/driver-experience-showcase`

## Separation of concerns

| Concept | Meaning |
|---------|---------|
| **View As** | Identity / permissions preview — changes effective UI subject |
| **Showcase** | Isolated demonstration data environment |
| **Scenario** | Selected demonstration situation within Showcase |

## Who can use View As

- Authorized platform admins with a valid Showcase grant only.
- Ordinary drivers cannot access Showcase or View As.
- Nested View As is prevented — selecting a persona replaces the current subject.

## Behavior in this branch

- Carrier + persona selectors live in **Demo controls**.
- Persistent banner when viewing a non-default persona:  
  `Viewing as {displayName} · {Driver|Admin} · {carrier}`
- **Exit View As** restores the default driver persona for the active carrier.
- **Exit Showcase** clears View As and returns to Production `/home`.
- Real admin session remains the auditing actor; viewed persona is the effective subject for fixture presentation.
- Showcase write block remains engaged (`setShowcaseProductionWriteBlock(true)`).
- Simulated actions only — no Production email, SMS, payroll, or Drive writes.

## Sensitive mutations

Default View As behavior in Showcase is **simulation / read-oriented**:

| Blocked / simulated only |
|--------------------------|
| Financial approval / payment release |
| Security / permission changes |
| Destructive deletes |
| External communications (email/SMS) |
| Production document uploads |

## Honest gaps (not fabricated as complete)

- Full production-safe impersonation across live Production records requires backend authorization work outside this branch.
- This implementation provides polished **Showcase View As** UI + safe simulation boundaries.
- View As does **not** mint a separate authentication session or weaken roster/grant checks.
