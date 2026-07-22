# ELM CONNECT Driver Workspace — Terminology Map

**Updated:** 2026-07-22

| Avoid (driver-facing) | Use instead |
|-----------------------|-------------|
| Today (nav) | **Home** |
| Loads (nav) | **Trips** |
| Upload (as destination) | **Capture** (destination) / “Upload BOL” etc. as task verbs |
| Truck / Equipment (vague nav) | **My vehicle** / **Assigned truck & trailer** |
| Timeline | **Activity** / **Trip activity** |
| Assistant | **ELM AI** |
| Mission Control / Open Mission Control | Remove — open the actual task (Home, trip action, Capture) |
| Showcase Scenario Control Panel | **Demo controls** |
| Documents (as peer product) | Contextual documents under Trips, Pay, Vehicle, Safety, or My work |
| Safety (as peer mobile tab) | **Safety** section inside More |
| Messages (as peer mobile tab) | **Messages & contacts** under Support |
| Load # (driver chrome) | **Trip #** in driver copy (internal `loadNum` unchanged) |

## Capability-state labels (driver language)

| State | Visible label |
|-------|---------------|
| AVAILABLE | (no badge) |
| NEEDS_ATTENTION | Needs attention |
| COMING_SOON | Coming soon |
| NOT_CONNECTED | Not available yet |
| RESTRICTED | Usually hidden |
| DEMO_ONLY | Demo only |
| ADMIN_TEST | Admin test (admin Showcase only — never ordinary drivers) |
