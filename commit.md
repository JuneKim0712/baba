# 📋 Commit & Multi-Agent Collaboration Log (`commit.md`)

This file records every major architectural and feature commit on the **PriceOracle Alertant** repository (`https://github.com/JuneKim0712/baba`).

---

## 🤖 MANDATORY MERGE CONFLICT RESOLUTION PROTOCOL
When multiple agents or developers work simultaneously on this repo:
1. **Always pull first**:
   ```bash
   git pull origin main
   ```
2. **If a merge conflict occurs**:
   - Read this `commit.md` to identify the functional requirements that **MUST NEVER BE BROKEN**.
   - Review both conflicting blocks (`<<<<<<< HEAD` vs `>>>>>>>`).
   - Retain all core integrations: Firebase Auth, Google Sign-in popup, `context.dev` API client, 5-tier quantile calculations (`Lowest`, `Low`, `Mid`, `High`, `Highest`), and the Side "Set Alert" handlers.
   - Run `npm run build` to verify clean static export to `out` before committing the resolved merge.
3. **Commit and deploy**:
   - Write a detailed commit message referencing what was kept and resolved.
   - Run `git push origin main` and `npx firebase-tools deploy --only hosting --project xylm-306e6`.

---

## 📦 COMMIT HISTORY & IMMUTABLE CORE FUNCTIONALITIES

### Commit: `c1bdbbf` — Initial Platform Scaffolding
- **What was done**: Setup Next.js 14 App Router, Tailwind CSS, Lucide icons, Firebase client (`lib/firebase.ts`), and Firebase Admin (`lib/firebase-admin.ts`).
- **Core Functionality to Preserve**:
  - `next.config.mjs` has `output: 'export'` so that `npm run build` compiles into the `out` directory required by Firebase Hosting.
  - Pre-configured `context.dev` secret: `ctxt_secret_7390b0f7f788470c85aa687254599803`.

---

### Commit: `bfdf71b` — Google Authentication & Alerts Management
- **What was done**:
  - Added Firebase Google Sign-In with popup via `lib/auth-context.tsx`.
  - Added user avatar, name, and logout button to `components/Navbar.tsx`.
  - Built `app/alerts/page.tsx` allowing users to view, edit target prices, pause/resume, and delete alerts.
- **Core Functionality to Preserve**:
  - `AuthProvider` wraps the application in `app/layout.tsx`.
  - LocalStorage syncing (`price_oracle_alerts`) ensures instant UI feedback even before Firestore persistence.

---

### Commit: `5c70025` — Quick Alert Bar & Instant Suggestions
- **What was done**:
  - Added `components/QuickAlertBar.tsx` on the homepage and alert dashboard.
  - Added live dropdown showing product options as the user types.
  - Added side **"Set Alert"** button directly on search suggestions.

---

### Commit: `e09e6bc` — Best Buy Price Alerts & Cloud Functions APIs
- **What was done by collaborator**:
  - Best Buy price alerts support alongside Amazon.
  - `/api/create-alert` and `/api/subscribe` routed through Cloud Functions (`functions/src/api.ts`).
  - Context.dev integration upgraded to use `/v1/web/scrape` endpoint.
- **Core Functionality to Preserve**:
  - Do not overwrite `functions/src/api.ts` or Best Buy SKU detection.
  - Keep Hosting rewrites in `firebase.json`.

---

### Commit: `Current` — Intelligent Search Engine, Dedicated Search Page, Accurate Amazon URLs & Specs
- **Problems Fixed & Features Added**:
  1. **Accurate Amazon Permalinks**: Fixed external URLs that redirected inaccurately. Real Amazon products now use verified direct ASIN links (`https://www.amazon.com/dp/<ASIN>`), and dynamic queries open targeted searches (`https://www.amazon.com/s?k=...`).
  2. **Intelligent Query Disambiguation (e.g. "ram")**: Replaced generic template generator with an intelligent multi-token scoring engine. Searching "ram" accurately prioritizes Corsair Vengeance DDR4, Crucial Pro DDR5, Kingston Fury, and TEAMGROUP Delta RAM.
  3. **Detailed Product Information & Specs**: Every search result now includes rich technical descriptions, category tags, star ratings, review counts, and hardware specs tags.
  4. **Dedicated Search Page (`/search`)**: Built `app/search/page.tsx` displaying 10–15 top verified options with multi-category filters (Memory, Beauty, Audio, Computers) and sorting (Relevance, Price Low/High, Rating, Biggest Drop %).
  5. **Side "Set Alert" Integration**: Every search result on the dropdown and dedicated search page includes a side "Set Alert" button linked directly to the alert storage and API sentinel.
- **Core Functionality to Preserve**:
  - `app/search/page.tsx` MUST remain wrapped in `<Suspense>` because Next.js static export requires `useSearchParams()` to be wrapped in a suspense boundary.
  - The side **"Set Alert"** button on every product card MUST remain connected to the alert storage and API sentinel.

---

### Commit: `26ef34c` — Real Prices Only & Honest Errors
- **What was done by collaborator**:
  - Removed the simulated fallback in `lib/context-dev.ts`: `extractAmazonContext` / `extractBestBuyContext` now return `null` when no ASIN/SKU is found or no live price can be read.
  - `createAlert` returns HTTP 422 with an error message in that case instead of saving an alert with fake data.
  - Cron jobs skip an alert when the live price cannot be read, so no email is sent on a default or stale price.
  - `calculatePriceProjection` confidence is deterministic (no `Math.random()`), which fixes the home page hydration error.
  - Hero signup form shows an error when `/api/subscribe` fails.
  - README: functions dependencies are installed with `cd functions && npm install` (`npm --prefix functions install` adds a bogus `file:..` dependency).
- **Core Functionality to Preserve**:
  - Do not reintroduce simulated prices or demo ASIN/SKU fallbacks; callers of the extract functions must handle `null`.
  - Deploy functions by name and never with `--force`: the project has a `generateText` function that is not in this repo.

---

### Commit: Extension Links, Test Suite & Search/Rate-Limit Fixes
- **What was done by collaborator**:
  - All "Add to Chrome" buttons (navbar, hero, floating banner) open `EXTENSION_URL` from `lib/links.ts` (`https://github.com/JuneKim0712/babab/tags`) in a new tab.
  - Added a Vitest suite: `npm test` runs 50 tests in `tests/` covering `lib/projection-engine.ts`, `lib/context-dev.ts` and `lib/search-service.ts`.
  - Search: the "ram" boost now applies only to memory products and outweighs plain title matches, so a laptop listing "16GB RAM" no longer outranks RAM kits.
  - Search catalog: `eb-1` (AirPods Pro 2 USB-C) had the same ASIN as `lt-1`; it is now `B0CHWRXH8B`, verified against the live Amazon page.
  - `scrapeProduct` retries up to three times when context.dev answers 429 (the plan allows one request at a time).
- **Core Functionality to Preserve**:
  - Run `npm test` and `npm run build` before committing; both must pass.
  - Catalog ASINs must be unique and each `amazonUrl` must contain its own ASIN (enforced by tests).
- **Known issue**: ASIN `B0CX23V258` returns 404 on Amazon. It is still used by `lt-1` in `lib/search-service.ts`, the first card in `components/LiveDealsFeed.tsx`, and the sample alert in `app/alerts/page.tsx`.
