# Changes on `feat/best-buy-support`

Branch is based on `main` and has `origin/main` (up to `5c70025`, live search suggestions) merged in with no conflicts.

## Summary

1. Best Buy price alerts, alongside the existing Amazon ones.
2. `/api/create-alert` and `/api/subscribe` moved from Next.js routes into Cloud Functions, because the site is a static export and those routes were never deployed.
3. Price lookups switched to the context.dev endpoint that actually exists (`/v1/web/scrape`), so alerts use real prices instead of simulated data.

## Commits

| Commit | Message |
| :--- | :--- |
| `f271255` | feat(tracker): add Best Buy price alerts alongside Amazon |
| `332393d` | fix(api): serve /api endpoints from Cloud Functions |
| `14a7b2f` | fix(tracker): use context.dev /web/scrape product endpoint |
| merge | Merge `origin/main` into `feat/best-buy-support` |

## Changes by file

### Backend (`functions/`)

- `functions/src/api.ts` (new): HTTP functions `createAlert` and `subscribe`, ported from the old `app/api` routes.
  - `createAlert` detects Best Buy input (a `bestbuy.com` URL, `targetType: 'sku'`, or a bare 7–8 digit SKU) and stores `retailer: 'bestbuy' | 'amazon' | null` on the alert.
  - Non-POST requests return 405. A failed Firestore write returns 500 instead of a simulated success.
- `functions/src/tracker-cron.ts`: one retailer-aware loop shared by two scheduled functions, `checkAmazonDealsCron` (existing name kept) and `checkBestBuyDealsCron` (new). Alerts with no `retailer` field are treated as Amazon. Both jobs now have a 30 minute timeout.
- `functions/src/email-service.ts`: `AlertEmailPayload` takes `retailer` and `productId` instead of `asin`. Email text and link use the right retailer. Exports the `RETAILERS` map (name and product URL builder).
- `functions/src/index.ts`: exports the four functions.
- `functions/tsconfig.json` (new): the functions project had none, so `npm run build` could not work. It also compiles `lib/context-dev.ts` and `lib/projection-engine.ts`, so that logic is shared with the web app rather than copied.
- `functions/package.json`: Node runtime 18 → 22; `main` now `lib/functions/src/index.js` to match the new build output.

### Shared libraries (`lib/`)

- `lib/context-dev.ts`:
  - New `scrapeProduct(url, apiKey)` calling `POST https://api.context.dev/v1/web/scrape` with `formats: { product: true }`. The previous `/v1/extract` endpoint returns 404.
  - New `extractBestBuyContext(urlOrSku)` mirroring `extractAmazonContext`. It reads the key from `CONTEXT_DEV_API_KEY` only.
  - `extractAmazonContext` now uses `scrapeProduct` and fills `originalPrice` from the list price.
- `lib/firebase-admin.ts` (deleted): only the removed API routes used it.

### Web app

- `app/api/create-alert/route.ts`, `app/api/subscribe/route.ts` (deleted): replaced by the Cloud Functions above.
- `components/AlertModal.tsx`: copy accepts Amazon or Best Buy input; a failed request now shows an error instead of the success screen.
- `components/LiveDealsFeed.tsx`: deals carry `retailer` and `productId`; two Best Buy demo cards added; grid is 3 columns; button reads "View on {retailer}".
- `components/Hero.tsx`: button label "Set Deal Alert".

### Config and docs

- `firebase.json`: Hosting rewrites `/api/create-alert` → `createAlert` and `/api/subscribe` → `subscribe`; functions `predeploy` build step.
- `.gitignore`: ignores `graphify-out/`, `functions/lib/`, `functions/.env*`.
- `README.md`: describes both retailers, the functions-based API, local emulator testing, and deploying hosting together with functions.

## Impact on work already on `main`

- `components/QuickAlertBar.tsx` posts to `/api/create-alert`. That request only reaches a backend once the functions and the Hosting rewrites from this branch are deployed. The `userId` and `productTitle` it sends are ignored by the backend, the same as before.
- `npm run dev` on its own no longer serves `/api`. Use the emulator command in the README to test alert creation locally.

## Deployment notes

- Nothing on this branch has been deployed.
- The Firebase project has a deployed function, `generateText`, that is not in this repo. Deploy functions by name and without `--force`, or the CLI will offer to delete it:
  `npx firebase-tools deploy --only functions:createAlert,functions:subscribe,functions:checkAmazonDealsCron,functions:checkBestBuyDealsCron --project xylm-306e6`
- `functions/.env` must contain `CONTEXT_DEV_API_KEY` (and `RESEND_API_KEY` for real emails). The file is git-ignored.
- Deploy functions before hosting, so the rewrites have something to point at.

## Testing

- `npm run build` (site) and `npm run build` in `functions/` both pass.
- End to end on the Firebase emulators (hosting → function → Firestore), with live context.dev lookups: a Best Buy URL, a bare Best Buy SKU and an Amazon URL each saved an alert with the correct retailer, product ID, real title and real price. Category alerts, subscribe, 400 and 405 responses also behaved as expected.
- Not tested: the scheduled jobs (the emulator skips them) and real email sending.

## Known gaps, not addressed here

- If a price lookup fails, alerts are still created with simulated AirPods data ($189.99), which could cause false price-drop emails.
- Uncached lookups took 13–47 seconds; Hosting cuts requests off at 60 seconds.
- Category alerts, the predictive-drop option and the minimum-discount field are stored but not acted on by the cron.
- The context.dev key is still hardcoded in `.env.example`, `lib/context-dev.ts` and `functions/src/tracker-cron.ts`.
- The home page has a hydration error from `Math.random()` in `lib/projection-engine.ts`.
