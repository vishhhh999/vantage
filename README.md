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

---

## Supabase setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy the project URL and anon key into `.env`
3. For v1 (no auth), Supabase is optional — the app works without it
4. For v2 (user accounts + history), run this SQL in the Supabase editor:

```sql
create table reports (
  id uuid default gen_random_uuid() primary key,
  riot_id text not null,
  puuid text,
  region text,
  overview jsonb,
  priorities jsonb,
  coaching_report jsonb,
  created_at timestamp with time zone default now()
);

create index on reports (riot_id);
create index on reports (puuid);
```

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
