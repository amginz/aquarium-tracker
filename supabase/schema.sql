-- ============================================================
-- Aquarium Tracker - Supabase schema
-- ------------------------------------------------------------
-- Run this once in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run).
--
-- Design: the whole app state (all tanks + their fish, plants,
-- lighting, filters, CO2, fertilizer schedule, calculator inputs)
-- is stored as a single JSON blob per user, in one row. This
-- mirrors exactly what the app already keeps in memory (the `S`
-- object in js/state.js), so no relational redesign is needed to
-- get cloud sync working. If you outgrow this later, each key
-- inside `data.tanks[]` can be split into its own table.
-- ============================================================

create table if not exists public.aquarium_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- Row Level Security: every user can only ever see/edit their own row.
alter table public.aquarium_state enable row level security;

drop policy if exists "Users manage their own aquarium state" on public.aquarium_state;
create policy "Users manage their own aquarium state"
  on public.aquarium_state
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Auth setup (do this in the Dashboard, not SQL):
-- Authentication -> Providers -> Anonymous Sign-ins -> Enable.
-- The app signs each visitor in anonymously (no email/password)
-- so their data follows them across sessions on the same browser.
-- If you want real accounts (login on any device), you can swap
-- signInAnonymously() in js/storage.js for Supabase's email/OAuth
-- sign-in methods instead - the table/policies above already
-- support that with no changes.
-- ============================================================
