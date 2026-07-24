# Production-build visual fix evidence

Captured with `PREVIEW_BASE=http://127.0.0.1:4174 node ./scripts/capture-rc1-screenshots.mjs`
against **`npm run build` + `vite preview`** (not `npm run dev`).

Root cause fixed in this commit: Tailwind v4 was only scanning `src/`, so utility classes used in root-level `components/` / `pages/` / `design-system/` were purged from the production CSS bundle. Deploy Preview and local production builds shared that defect; earlier overnight screenshots already reflected the broken utilities (misclassified as review-ready).
