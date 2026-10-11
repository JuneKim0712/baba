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

---

### Commit: Verified Catalog, Real Alert Rules & Honest Alert Buttons
- **What was done by collaborator**:
  - Checked every catalog ASIN in `lib/search-service.ts` against the live Amazon page. 11 of 14 were dead pages (HTTP 404) and 2 were a different product than labelled.
    - Replaced with live-verified ASINs: `ram-1` B07RW6Z692, `eb-1` B0CHWRXH8B, `eb-2` B0C33XXS56, `eb-3` B0CD2FSRDD, `ms-1` B09HM94VDS, `kb-1` B07YB32H52, `lt-1` B0CX22ZW1T.
    - `ram-2` (B0C3RYHZJQ) is really a CORSAIR Vengeance DDR5 6000MHz kit, so its title, description and specs now say so.
    - `ram-3`, `ram-4`, `hp-1`..`hp-4` could not be matched to a live listing: they are flagged `isRealAmazonProduct: false` and link to an Amazon search for their title.
    - Prices of verified entries were set to the live price on the day of the check; they are a snapshot, not live.
  - `components/LiveDealsFeed.tsx` and the sample alert in `app/alerts/page.tsx` use live-verified ASINs (MacBook Air M3 B0CX22ZW1T, MX Master 3S B09HM94VDS, PS5 Slim B0CL61F39H, Ninja AF101 B07FDJMC9Q). The prices and discounts on the deal cards are still demo figures.
  - New `lib/alert-rules.ts` (tested): `isProductAlert` and `shouldTriggerAlert`. The cron now skips category/keyword alerts instead of scraping a bogus URL, honours `minDiscountPercent`, and fills the alert email from `calculatePriceProjection` instead of hardcoded numbers.
  - `createAlert` stores the `userId` sent by the client.
  - "Set Alert" on the search page and quick alert bar checks the backend response: a rejected alert is not written to local storage and the button shows "Not saved. Retry".
- **Core Functionality to Preserve**:
  - Only mark a catalog entry `isRealAmazonProduct: true` after checking its ASIN against the live page.
  - Each context.dev scrape costs 2 credits and only one may run at a time; do not add bulk or parallel lookups.
- **Known issues**:
  - Category alerts and the "predictive drop" option are stored but never trigger; there is no data source for either yet.
  - Generated search suggestions (`auto-*`) and unverified catalog entries have made-up ASINs, so "Set Alert" on them is rejected by the backend.
  - `firestore.rules` lets any signed-in user read, update and delete every alert, including other users' emails.
