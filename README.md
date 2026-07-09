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
src/
├── pages/
│   ├── Landing.jsx       # Marketing + input form
│   ├── Landing.module.css
│   ├── Report.jsx        # Core product — analysis output
│   ├── Report.module.css
│   └── Dashboard.jsx     # v2 placeholder
├── lib/
│   ├── riot.js           # Riot API client
│   ├── scoring.js        # Decision error framework
│   ├── coaching.js       # Claude API prompt engine
│   └── supabase.js       # Supabase client
├── styles/
│   └── globals.css       # Design tokens
├── App.jsx               # Router
└── main.jsx              # Entry point
```

---

## Submitting to Riot for production key

Your submission needs:
1. A live URL (deploy to Vercel first)
2. Screenshots of the full user flow: landing → input → loading → report
3. Description matching their approved use case: "Training tool allowing players to view their own match history and aggregate stats"
4. A note that you will implement RSO opt-in before public launch

Register your app at [developer.riotgames.com](https://developer.riotgames.com) under Applications → Create Application.
