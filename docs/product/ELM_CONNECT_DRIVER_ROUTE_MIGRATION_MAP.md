# ELM CONNECT Driver Workspace — Route Migration Map

**Updated:** 2026-07-22

| Previous route | New authoritative route | Disposition | Notes |
|----------------|-------------------------|-------------|-------|
| `/today` | `/home` | Redirect | Deep links preserved |
| `/showcase/today` | `/showcase/home` | Redirect | |
| `/loads` | `/trips` | Redirect | Internal load DTOs unchanged |
| `/showcase/loads` | `/showcase/trips` | Redirect | Driver copy uses “Trip” |
| `/capture` | `/capture` | Retained | Capture hub redesigned |
| `/workspace` | `/capture` | Redirect | Alias |
| `/pay` | `/pay` | Retained | Driver Pay presentation refined |
| `/more` | `/more` | Retained | Reorganized sections |
| `/messages` | `/messages` | Nested under More | Still reachable |
| `/equipment` | `/equipment` | Nested under More | Label: My vehicle |
| `/truck` | `/equipment` | Redirect | |
| `/safety` | `/safety` | Nested under More | |
| `/notifications` | `/notifications` | Global utility | |
| `/search` | `/search` | Global utility | Alias recognition added |
| `/assistant` | `/assistant` | Global utility | UI label: ELM AI |
| `/showcase/timeline` | `/showcase/timeline` | Retained | Label: Activity |
| `/showcase/home-time` | `/showcase/home-time` | Retained | Schedule & availability |
| `/showcase/documents` | `/showcase/documents` | Retained | My work → Documents |
| `/showcase/help` | `/showcase/help` | Added | Was linked but unregistered |
| `/showcase/preferences` | `/showcase/preferences` | Added | Was linked but unregistered |
| `/showcase/rewards` | `/showcase/rewards` | Added | Coming soon / future |
| `/submissions/*` | `/submissions/*` | Retained | Production BOL/POD + receipt unchanged |

**Deprecated driver-facing labels (not routes):** Mission Control, Today (as tab), Loads (as tab), Equipment (as vague destination), Assistant (as product name), Scenario Control Panel (replaced by Demo controls).
