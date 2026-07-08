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
