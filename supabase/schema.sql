-- Run this in Supabase SQL Editor before using the dashboard.

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  riot_id text not null,
  region text not null default 'ap',
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  riot_id text not null,
  region text not null default 'ap',
  overview jsonb not null,
  priorities jsonb not null,
  summary text,
  created_at timestamptz not null default now()
);

create index if not exists reports_user_id_created_at_idx on reports (user_id, created_at desc);

-- Refresh tokens are kept in their own table, never in `profiles`, and get
-- zero RLS policies on purpose. No policy means no row is selectable or
-- writable through the anon or authenticated client roles, only through
-- the service role key, which only ever lives server-side. This is the
-- only sensitive-token storage in the schema, so it gets the tightest
-- possible access model rather than reusing the profiles table's policies.
create table if not exists riot_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  updated_at timestamptz not null default now()
);
alter table riot_tokens enable row level security;

-- Row Level Security: users can only ever read/write their own rows.
alter table profiles enable row level security;
alter table reports enable row level security;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = user_id);

create policy "reports_select_own" on reports
  for select using (auth.uid() = user_id);
create policy "reports_insert_own" on reports
  for insert with check (auth.uid() = user_id);
