# Owner Security Response — QLM BOL Uploader

**Date:** June 2026  
**Status:** Security hardening in progress  
**Priority:** Security over temporary upload continuity (brief downtime acceptable)

---

## Executive summary

We identified that the BOL uploader had **unauthenticated upload endpoints** — anyone who discovered the URLs could send fake documents, write to Google Drive, and trigger dispatch emails and SMS messages.

We are fixing this in two layers:

1. **Google Apps Script** — now requires a secret `uploadToken` on every upload.
2. **Netlify upload function** — now validates all submissions, blocks unknown origins, and forwards uploads to Apps Script with the token added **server-side only** (never exposed to drivers’ phones or browsers).

---

## What was wrong

| Risk | Impact |
|------|--------|
| Open Apps Script `doPost` | Unauthorized Drive writes, spreadsheet pollution, email/SMS spam |
| Open Netlify `upload` function | Direct Google API access bypassing Apps Script controls |
| Wildcard CORS (`*`) | Any website could trigger uploads |
| Secrets in architecture | Risk of token/key exposure if placed in frontend code |

---

## What we changed

### Google Apps Script (production backend)

- Added `UPLOAD_TOKEN` Script Property requirement.
- Rejects missing/wrong token before any file, sheet, mail, or SMS action.
- Rejects company values other than `BST` and `GLX`.

### Netlify function (`netlify/functions/upload.js`)

- **Removed** direct Google Drive/Sheets API usage from the upload path.
- **Added** server-side proxy to Apps Script with `UPLOAD_TOKEN` injected in Netlify only.
- **Added** validation: company, driver, load/BOL, file count, file size, MIME type.
- **Restricted** CORS to domains listed in `ALLOWED_ORIGINS` (no wildcard).

### Frontend (minimal, no secrets)

- Service worker sends file category metadata (`bol` vs `freight`) required by Apps Script.
- **No** `UPLOAD_TOKEN` in browser or service worker code.

---

## What you need to configure

### In Netlify (Site → Environment variables)

| Name | What to put |
|------|-------------|
| `UPLOAD_TOKEN` | Same secret password you set in Apps Script |
| `APPS_SCRIPT_WEB_APP_URL` | Your deployed Apps Script Web App URL |
| `ALLOWED_ORIGINS` | Your live site URL(s), comma-separated |

### In Apps Script (Project Settings → Script properties)

| Name | What to put |
|------|-------------|
| `UPLOAD_TOKEN` | Same secret as Netlify |

Full step-by-step: see `SECURITY_SETTINGS.md`.

---

## Expected behavior after deployment

| Scenario | Result |
|----------|--------|
| Driver submits via official PWA | Upload succeeds → email, SMS, PDF, `DB_Docs` row |
| Request without valid origin | Blocked (`403 Forbidden origin`) |
| Request with bad/missing data | Blocked (`400` with error message) |
| Direct call to Apps Script without token | Blocked (`Unauthorized`) |
| Old queued uploads without file categories | Fail validation until app/service worker is updated |

---

## Short downtime expectation

- Drivers may see brief upload failures while Netlify env vars are set and both Apps Script and Netlify are redeployed.
- Queued jobs retry automatically when the service worker syncs again.
- After deploy, confirm with **one real test upload** using the production checklist (email, SMS, Drive, `DB_Docs`).

---

## What is still not in scope (future work)

- Rate limiting per IP/driver
- Driver dropdown from `getDrivers` API (name validation is length/required only today)
- Gemini API key moved fully server-side
- Retiring unused legacy code paths (`queueService.ts` simulation, `Form.tsx`)

---

## Owner action items

1. [ ] Confirm `UPLOAD_TOKEN` is set in Apps Script Script Properties.
2. [ ] Confirm Apps Script Web App is redeployed (new version).
3. [ ] Add the three Netlify environment variables.
4. [ ] Deploy the Netlify site.
5. [ ] Run one real driver test upload and verify email + SMS + `DB_Docs`.
6. [ ] Store the token in a password manager — not email or chat.

---

## Contact / escalation

If uploads fail after deployment:

1. Check Netlify function logs (Netlify → Functions → upload → Logs).
2. Verify `UPLOAD_TOKEN` matches exactly in Netlify and Apps Script.
3. Verify `ALLOWED_ORIGINS` includes the exact URL drivers use (including `https://`).
4. See `SECURITY_SETTINGS.md` for the full troubleshooting checklist.
