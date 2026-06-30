# Security Settings — QLM BOL Uploader

This document describes the security controls for the upload pipeline and how to configure them in Netlify and Google Apps Script.

---

## Architecture (secured)

```
Driver PWA (browser)
    → Service Worker (same-origin fetch, no secrets)
    → Netlify Function: upload.js (validation + CORS)
    → Google Apps Script Web App (UPLOAD_TOKEN required)
    → Drive + DB_Docs + Email + SMS
```

**Important:** `UPLOAD_TOKEN` is stored only in:
- Google Apps Script **Script Properties**
- Netlify **Environment Variables**

It is **never** placed in frontend code, the service worker, or the git repository.

---

## Required Netlify environment variables

Set these in **Netlify Dashboard → Site configuration → Environment variables**.

| Variable | Required | Secret | Description |
|----------|----------|--------|-------------|
| `UPLOAD_TOKEN` | Yes | Yes | Must match the Apps Script `UPLOAD_TOKEN` Script Property exactly. |
| `APPS_SCRIPT_WEB_APP_URL` | Yes | No* | Full deployed Web App URL, e.g. `https://script.google.com/macros/s/AKfycb.../exec` |
| `ALLOWED_ORIGINS` | Yes | No | Comma-separated list of allowed browser origins. |

\* Treat the URL as sensitive operational info; it is not embedded in client code.

### Example values

```env
UPLOAD_TOKEN=your-long-random-token-here
APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
ALLOWED_ORIGINS=https://your-site.netlify.app,https://www.your-domain.com,http://localhost:5173
```

### Notes

- Use the **same** `UPLOAD_TOKEN` value in Netlify and Apps Script.
- Include every domain drivers use (production Netlify URL, custom domain, local dev).
- After changing env vars, trigger a **new deploy** so functions pick up the values.
- `GOOGLE_PRIVATE_KEY` is **no longer used** by `upload.js`. You may remove it from Netlify if nothing else needs it.

---

## Required Apps Script Script Property

In **Apps Script → Project Settings → Script properties**:

| Property | Value |
|----------|-------|
| `UPLOAD_TOKEN` | Same random token as Netlify `UPLOAD_TOKEN` |

Redeploy the Web App after code or property changes.

---

## Netlify function security controls

File: `netlify/functions/upload.js`

| Control | Behavior |
|---------|----------|
| CORS | No wildcard. Only origins listed in `ALLOWED_ORIGINS` receive `Access-Control-Allow-Origin`. |
| Origin check | Requests without a matching `Origin` header are rejected with `403`. |
| Company | Only `Greenleaf Xpress` / `BST Expedite` (mapped to `GLX` / `BST`). |
| Driver name | Required, max 100 characters. |
| Load / BOL | At least one required, max 64 characters each. |
| BOL type | Only `Pickup` / `Delivery` (mapped to `PICKUP` / `DELIVERY`). |
| File count | 1–20 files per submission. |
| File size | Max 10 MB per file, 50 MB total. |
| MIME types | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` only. |
| Token injection | `UPLOAD_TOKEN` added server-side when calling Apps Script. |

---

## Apps Script security controls

See `REF FILES_ELM_CONNECT_UPLOADER.txt`:

| Control | Behavior |
|---------|----------|
| `uploadToken` | Required on every `doPost`. Wrong/missing → `{ "status": "error", "message": "Unauthorized" }` |
| Company | Only `BST` and `GLX` accepted. |

---

## Deployment checklist

1. [ ] Set `UPLOAD_TOKEN` in Apps Script Script Properties.
2. [ ] Deploy Apps Script Web App (new version).
3. [ ] Set `UPLOAD_TOKEN`, `APPS_SCRIPT_WEB_APP_URL`, `ALLOWED_ORIGINS` in Netlify.
4. [ ] Deploy Netlify site (includes updated function + frontend).
5. [ ] Submit one test BOL and confirm email, SMS, Drive PDF, and `DB_Docs` row.

---

## Rotating the upload token

1. Generate a new long random token.
2. Update Apps Script Script Property `UPLOAD_TOKEN`.
3. Update Netlify env var `UPLOAD_TOKEN`.
4. Redeploy Apps Script Web App.
5. Redeploy Netlify site.

Brief upload failures occur between step 2–5 if values are out of sync.

---

## What stays in the browser (by design)

- Form data and file blobs (queued in IndexedDB).
- Service worker posts to `/.netlify/functions/upload` on the **same origin** only.
- No `UPLOAD_TOKEN`, no Google service account keys, no Apps Script URL in client code.
