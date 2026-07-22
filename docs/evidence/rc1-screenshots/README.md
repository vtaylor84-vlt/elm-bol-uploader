# RC1 visual evidence

Screenshots captured with `node ./scripts/capture-rc1-screenshots.mjs` against a local Vite preview build.

Fixtures use test-only sessionStorage profiles. No real driver credentials or production records.

## Viewports

| Name | Size |
|------|------|
| mobile | 390×844 |
| tablet | 768×1024 |
| desktop | 1440×900 |
| wide | 1920×1080 |

## Files

Pattern: `{viewport}-{route}.png`

Key reviews:

- `*-today-glx-empty.png` — Production empty haul (GLX)
- `*-today-bst-empty.png` — Production empty haul (BST)
- `*-login.png` — Login
- `*-loads.png`, `*-capture.png`, `*-pay.png`, `*-more.png`
- `*-bol-pod.png`, `*-expense.png` — workflow entry (no submit)
- `*-admin-bol-pod.png` — Admin upload mode chrome
