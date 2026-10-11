# 🌐 PriceOracle Alertant & Autonomous Agent Ecosystem

> **Project Mission**: Autonomous predictive e-commerce intelligence system combining a Google Chrome extension (injected Amazon price timing oracle) with a centralized web platform and automated Amazon and Best Buy alerting backend powered by `context.dev`, prediction market modeling, and Google Firebase.

---

## 🤖 Multi-Agent Collaboration Standards & Protocol

This repository is actively developed and maintained by **autonomous AI agents** (Cursor, Antigravity, Claude, etc.) and human developers. To prevent race conditions, merge conflicts, and regressions, **every agent interacting with this repository MUST adhere to the following rules**:

### 1. The Single Source of Truth
- **Branch**: All stable releases are pushed to `main`.
- **Target Deployment**: Firebase Project `xylm-306e6` (`https://xylm-306e6.web.app`).
- **Remote Origin**: `https://github.com/JuneKim0712/baba.git`.

### 2. Mandatory Pre-Commit & Pre-Deploy Checklist
Before committing or publishing changes:
1. **Never commit secrets**: Check that `.env.local` and private service account JSONs remain in `.gitignore`.
2. **Build Verification**: Run `npm run build` locally. If static export fails, **do not commit or deploy**.
3. **Atomic Changes**: Commit specific features or fixes with descriptive conventional commit messages (e.g., `feat(tracker): ...`, `fix(ui): ...`, `docs(standards): ...`).
4. **Deploy & Push**:
   ```bash
   git add .
   git commit -m "your descriptive message"
   git push origin main
   npx firebase-tools deploy --only hosting --project xylm-306e6
   ```

### 3. Component Architecture & Separation of Concerns
- `app/`: Next.js 14 App Router pages and API routes. Use `'use client'` strictly when client-side hooks (`useState`, `useEffect`) are used.
- `components/`: UI modules with isolated styling (Tailwind CSS).
  - Must never leak global CSS into the Amazon content scripts or break mobile responsiveness.
- `lib/`: Pure utility functions and shared math engines:
  - `projection-engine.ts`: 5-tier quantile calculations (`Lowest`, `Low`, `Mid`, `High`, `Highest`) and 30-day projected percentage changes.
  - `context-dev.ts`: Integration client for `context.dev` real-time extraction (`extractAmazonContext`, `extractBestBuyContext`).
  - `firebase.ts` / `firebase-admin.ts`: Firebase client and admin instances.
- `functions/`: Firebase Cloud Functions backend.
  - `tracker-cron.ts`: Scheduled jobs for monitoring Amazon and Best Buy prices and triggering email alerts. Alerts carry a `retailer` field (`'amazon'` | `'bestbuy'`); alerts without one are Amazon.
  - `email-service.ts`: HTML notification templates.

### 4. Mathematical Standards for Price Projections
All price predictions must output these consistent fields:
- `lowest`: Historical minimum or P5 floor.
- `low`: Promotional discount level (P25).
- `mid`: Fair expected 30-day clearing price (P50).
- `high`: Standard full retail ceiling (P75).
- `highest`: Peak supply constraint/scalper ceiling (P95).
- `deltaPercentMonth`: Percentage change from current price to `mid` 30 days out.
- `recommendation`: Either `'BUY NOW'`, `'WAIT'`, or `'FAIR PRICE'`.

---

## 🛠 Local Development & Testing

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build static export (generates /out for Firebase Hosting)
npm run build

# 4. Deploy to Firebase Hosting
npx firebase-tools deploy --only hosting --project xylm-306e6
```

---

## 🔑 External Services Configuration

| Service | Identifier / Secret | Role |
| :--- | :--- | :--- |
| **Firebase Project** | `xylm-306e6` | Authentication, Firestore, Cloud Functions & Hosting |
| **context.dev** | Pre-configured in `lib/context-dev.ts` | Real-time structured Amazon & Best Buy product scraping & context |
| **Gemini Prediction** | Configured via environment/options | Event contracts and sentiment probabilities |
| **Resend / Email** | Configured via `RESEND_API_KEY` | Transactional email delivery for price drops |
