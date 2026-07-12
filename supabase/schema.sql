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
-- 1. Authentication -> Providers -> Email -> Enable.
-- 2. (Optional, recommended for a quick start) Authentication ->
--    Providers -> Email -> turn OFF "Confirm email", so new
--    sign-ups can log in immediately without checking their inbox.
--    Turn it back ON later if you want stronger verification.
--
-- The app now signs each visitor in with a real email + password
-- account (see js/auth-ui.js), which is what lets the SAME data
-- follow them across devices - log in with the same email/password
-- on your phone and your computer and you'll see the same tanks.
-- The table/policies above already support this with no changes.
-- ============================================================
