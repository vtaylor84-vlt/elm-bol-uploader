# Driver Workspace Production Release — Rollback

**Date:** 2026-07-23  
**Feature tip at release prep:** `3cb23e39` (and later polish commits on `feature/driver-experience-showcase`)  
**PR:** #8 → currently bases on `codex/driver-rc1-desktop-shell`

## Last known Production snapshot (pre-release)

- Domain: `https://bol.elmconnect.net`
- Observed Production asset (pre-release inspect): `/assets/index-dvHQ6e5-.js`
- Netlify site: `elmconnect` (custom domain `bol.elmconnect.net`)
- Production branch policy: confirm in Netlify UI (typically `main`)

## Rollback procedure (Netlify)

1. Open Netlify → site **elmconnect** → **Deploys**
2. Locate the last **Published** Production deploy before this release (note deploy ID + commit SHA)
3. Open that deploy → **Publish deploy** (instant rollback to that build)
4. Verify `https://bol.elmconnect.net/login` loads and primary nav still works
5. Do **not** roll back by force-pushing git history unless Vernon explicitly directs it

## If custom domain fails but Netlify URL works

1. Netlify → Domain management → confirm `bol.elmconnect.net` points at this site
2. Check HTTPS certificate status
3. Check HTTPS redirects (force HTTPS)
4. Do not change Payroll (`payroll.elmconnect.net`) DNS or hosting

## Out of scope for rollback

- Google Apps Script / clasp
- Payroll repository, payroll calculations, Sheets, Drive
