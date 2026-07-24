# ELM CONNECT Driver Workspace — Navigation Map

**Status:** Implemented on `feature/driver-experience-showcase`  
**Authority:** `ELM_CONNECT_Enterprise_Product_Architecture_and_Navigation.md`  
**Updated:** 2026-07-22

## Persistent mobile destinations (exactly five)

| # | Label | Path | Owns |
|---|-------|------|------|
| 1 | **Home** | `/home` (`/showcase/home`) | Next step, needs attention, current trip, recent activity, shortcuts |
| 2 | **Trips** | `/trips` (`/showcase/trips`) | Current / upcoming / completed trips, stops, paperwork, trip actions |
| 3 | **Capture** | `/capture` | Camera-first submissions (not a document repository) |
| 4 | **Pay** | `/pay` | Driver-facing settlement view into Payroll |
| 5 | **More** | `/more` | My work, My vehicle, Safety, Support, Account |

Desktop uses the **same five** destinations in the rail. Messages, vehicle, and safety are **not** peer tabs.

## Nested destinations (under More / utilities)

| Destination | Path | Section |
|-------------|------|---------|
| Messages & contacts | `/messages` | Support |
| Assigned truck & trailer | `/equipment` | My vehicle |
| Safety | `/safety` | Safety |
| Notifications | `/notifications` | Global utility + Support |
| Search | `/search` | Global utility + Support |
| ELM AI | `/assistant` | Global utility + Support |
| Documents | `/showcase/documents` | My work (Showcase) |
| Schedule & availability | `/showcase/home-time` | My work (Showcase) |
| Activity | `/showcase/timeline` | Contextual |
| Help | `/showcase/help` | Support (Showcase) |
| Preferences | `/showcase/preferences` | Account (Showcase) |

## Legacy compatibility redirects

| Legacy | Canonical |
|--------|-----------|
| `/today` | `/home` |
| `/loads` | `/trips` |
| `/workspace` | `/capture` |
| `/truck` | `/equipment` |
| `/showcase/today` | `/showcase/home` |
| `/showcase/loads` | `/showcase/trips` |
| `/showcase/truck` | `/showcase/equipment` |

## Global utilities

Search, Notifications, Help/Profile (via More), and ELM AI remain reachable from the shell header (Showcase) and desktop rail footer. They never compete with the five primary destinations.

## Admin controls (Showcase only)

| Control | Purpose |
|---------|---------|
| **DEMO — SHOWCASE** bar | Persistent demo-data indicator |
| **Demo controls** | Carrier, View As, Scenario, Reset, Exit |
| **View As banner** | `Viewing as {name} · {role} · {carrier}` when persona ≠ default driver |
| **Exit Showcase** | Returns to Production `/home` |

## Not peer products / not tabs

Documents, Search, Notifications, ELM AI, Identity, Showcase, View As, Mission Control (removed from driver nav).
