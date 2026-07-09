# VANTAGE

AI-powered Valorant coaching. Analyzes your last 20 matches and surfaces the exact decisions costing you rounds.

---

## Stack

- React + Vite
- Supabase (auth — RSO in v2)
- Riot Match-V5 API
- Claude API (coaching engine)
- Deployed on Vercel

---

## Local setup

```bash
# 1. Clone and install
git clone https://github.com/YOUR_USERNAME/vantage.git
cd vantage
npm install

# 2. Set up environment variables
cp .env.example .env
# Fill in your keys (see below)

# 3. Run dev server
npm run dev
```

---

## Environment variables

```
VITE_SUPABASE_URL=         # From Supabase project settings
VITE_SUPABASE_ANON_KEY=    # From Supabase project settings
VITE_RIOT_API_KEY=         # From developer.riotgames.com
VITE_ANTHROPIC_API_KEY=    # From console.anthropic.com
```

---

## Riot API setup (read this carefully)

### Dev key (for local testing)
1. Go to [developer.riotgames.com](https://developer.riotgames.com)
2. Log in with your Riot account
3. Generate a Development API Key — it expires every 24 hours
4. Paste it into `VITE_RIOT_API_KEY` in your `.env`
5. Dev keys have rate limits: 20 requests/second, 100 requests/2 minutes

### Production key (required to go live)
1. Create a new app on the developer portal
2. Select "VALORANT" as the product
3. Use case: "Training tools that allow players to view their own match histories and aggregate stats" (this is explicitly approved)
4. Submit mockups or a working prototype showing the user flow
5. Riot reviews and contacts you via portal messaging
6. Once approved, implement RSO (Riot Sign On) for user auth

### Important Riot API notes
- Match data is in region routing: `asia.api.riotgames.com` covers AP + KR
- The match list endpoint uses PUUID, not Riot ID — you need to look up account first
- Valorant API uses `/val/match/v1/` prefix, not `/lol/`
- Player data requires opt-in — in production every user must authenticate via RSO
- **Confirmed by real testing**: `account-v1` (name → PUUID lookup) works without RSO, but `val-match-v1` (actual match history) returns 403 without it — even with a fully approved production key that has the product attached. RSO is not optional once your app is live.

### Riot Sign-On (RSO) — required for match data
This is the actual fix for match history returning 403 despite an approved key. RSO proves the specific player consented to your app reading their data.

**1. Request RSO client credentials from Riot.** This is not self-service — go to your app in the developer portal → Messages tab → ask Riot to provision an RSO client (`client_id` + `client_secret`) for VANTAGE. Reference the docs at `Implementing Riot Sign On` linked from the API policy page. This step can take time; nothing below works until Riot responds.

**2. Set the redirect URI.** Tell Riot (and set in your env) something like:
```
https://your-domain.vercel.app/riot-callback
```

**3. Set environment variables** (see `.env.example`) — note `RIOT_CLIENT_ID` is intentionally set twice: once as `VITE_RIOT_CLIENT_ID` (public, used client-side to build the Riot login URL) and once as plain `RIOT_CLIENT_ID` (used server-side alongside the secret). `RIOT_CLIENT_SECRET` must never get a `VITE_` prefix — that would ship it to every browser.

**4. How the flow works in this codebase:**
```
Dashboard "Sign in with Riot" button
  → redirects to Riot's own login page (buildRiotAuthorizeUrl in src/lib/riotAuth.js)
  → player logs in directly with Riot, consents to data sharing
  → Riot redirects back to /riot-callback with a one-time code
  → RiotCallback.jsx sends that code to /api/riot-token.js
  → api/riot-token.js exchanges it server-side for an access token
    (this is the only place the client_secret is used)
  → resolves the player's real puuid, Riot ID, and active region
  → links that verified identity to the signed-in Supabase user
  → runs and saves the first analysis
```

Until RSO credentials are set, the dashboard falls back to manual Riot ID entry with a visible warning — it'll let you link a profile, but match analysis will still 403, because that's the actual Riot-side requirement, not a bug in this app.

## Supabase setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy the project URL and anon key into `.env` — must look exactly like `https://your-project-ref.supabase.co`, nothing appended
3. Go to **Authentication → URL Configuration** and set:
   - **Site URL**: your deployed Vercel URL (e.g. `https://vantage-ochre-alpha.vercel.app`)
   - **Redirect URLs**: add `https://vantage-ochre-alpha.vercel.app/**`
   (without this, magic link emails redirect to `localhost:3000` and dead-end)
4. Run `supabase/schema.sql` in the Supabase SQL Editor. This creates:
   - `profiles` — one row per user, storing their linked Riot ID + region
   - `reports` — every analysis ever run for that user, with Row Level Security so users only ever see their own data

## Dashboard behavior

- First sign-in: user links one Riot ID + region to their account.
- Every dashboard load: if the last saved report is more than 5 minutes old (or none exists), a fresh analysis runs automatically and is saved.
- Manual **Re-run analysis** button is disabled with a live countdown until that same 5-minute cooldown expires — same rule for auto and manual, so a user can't spam the Riot/Claude APIs.
- **Progress** section compares the very first saved report to the latest one (win rate, K/D, ADR, HS%) so improvement is visible over time.
- **Report history** shows the last 6 analyses with date, win rate, K/D, and top issue at a glance.

---

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Project Settings → Environment Variables
# Add all four VITE_ vars
```

Or connect your GitHub repo to Vercel for automatic deploys on push.

---

## Project structure

```
api/
├── riot.js              # Proxies Riot API calls (keeps X-Riot-Token server-side)
├── riot-token.js        # RSO OAuth code exchange (keeps client_secret server-side)
└── anthropic.js         # Proxies Claude API calls

src/
├── pages/
│   ├── Landing.jsx / .module.css       # Marketing page + sample report
│   ├── Login.jsx / .module.css         # Magic-link sign-in
│   ├── Dashboard.jsx / .module.css     # Signed-in home — linked account, auto-refresh, progress
│   ├── Report.jsx / .module.css        # Standalone analysis view
│   └── RiotCallback.jsx / .module.css  # RSO redirect handler
├── components/
│   └── TacticalRadar.jsx / .module.css # Interactive HUD-style visual
├── lib/
│   ├── riot.js           # Riot API client + VAL-CONTENT-V1 name resolver
│   ├── riotAuth.js        # RSO authorize URL + code exchange (client-side half)
│   ├── scoring.js        # Decision error framework (parses the REAL Riot match schema)
│   ├── analysis.js       # Shared pipeline: Riot -> scoring -> Claude coaching
│   ├── coaching.js       # Claude API prompt engine
│   ├── assets.js         # Agent/rank/map name -> local asset path resolver
│   ├── dashboard.js      # Supabase queries (profile, reports, cooldown)
│   └── supabase.js       # Supabase client (singleton-guarded against HMR duplication)
├── styles/
│   └── globals.css       # Design tokens + tactical clip-path utilities
├── App.jsx               # Router
└── main.jsx              # Entry point

public/
├── assets/
│   ├── agents/   # 29 agent portraits (.webp, 256x256)
│   ├── ranks/    # 25 rank badges (.png)
│   ├── maps/     # 13 map images
│   └── weapons/  # 16 weapon icons (not yet wired into any UI — see note below)
├── icons/        # PWA app icons (192/512/maskable/apple-touch/favicon)
└── manifest.json # PWA manifest
```

### A note on the data pipeline correctness fix

Earlier versions of `scoring.js` were written against an **unofficial** third-party API's response shape (`match.players.all_players`, `player.character`, `player.damage_made`, etc.) even though the app calls Riot's **official** `VAL-MATCH-V1`, which has a completely different schema (`match.players[]`, `player.characterId` as a UUID, per-round damage nested in `roundResults[].playerStats[]`, and so on). It also had a debug fallback that would silently pick *any* player whose name contained "john" if the real PUUID lookup failed. Both are fixed now — `scoring.js` parses the actual official schema, and agent/map UUIDs are resolved via `VAL-CONTENT-V1` (fetched once per analysis and cached in memory) rather than a hardcoded UUID table, so it won't go stale when Riot ships new agents.

### Weapons

16 weapon icons are in `public/assets/weapons/` but nothing in the scoring model currently tracks per-weapon stats — `VAL-MATCH-V1`'s round-level `economy.weapon` field would need to be aggregated into a new score category to make use of them. Not wired in yet; flagging so they're not mistaken for a bug.

---

## PWA / Add to Home Screen

The app has a full manifest + icon set and iOS meta tags, so it installs as a home-screen app on both Android (Chrome reads `manifest.json` directly and offers "Add to Home Screen") and iOS (Safari → Share → "Add to Home Screen", using the `apple-touch-icon` and `apple-mobile-web-app-*` meta tags in `index.html`). No service worker is included — this gives an app-like icon/launch/status-bar experience but not offline support. If you want offline caching later, that's a separate addition (Workbox or a hand-rolled service worker).

---

## Typography licensing

Bebas Neue (display) and Barlow (body) are currently used as free, license-clean substitutes for Tungsten and DIN Next respectively — both are Google Fonts, no attribution or licensing cost required. If you have licensed access to Tungsten/DIN Next and want the exact reference typefaces, send the font files and their license terms and they can be self-hosted via `@font-face` in `globals.css` in place of the Google Fonts import in `index.html`.

---

## Submitting to Riot for production key

Your submission needs:
1. A live URL (deploy to Vercel first)
2. Screenshots of the full user flow: landing → input → loading → report
3. Description matching their approved use case: "Training tool allowing players to view their own match history and aggregate stats"
4. A note that you will implement RSO opt-in before public launch

Register your app at [developer.riotgames.com](https://developer.riotgames.com) under Applications → Create Application.
