-- i'm hungry — Supabase schema (Phase 1 MVP)
-- Apply via Supabase MCP (apply_migration) or the dashboard SQL editor.
-- Row Level Security locks every table to auth.uid() = user_id.

-- ─────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────

-- User preferences (extends Supabase auth.users)
create table if not exists user_profiles (
  id uuid references auth.users primary key,
  dietary_restrictions text[],   -- captured once via chips; HARD filter (safety)
  allergies            text[],   -- captured once via chips; HARD filter (safety)
  preferred_cuisines   text[],   -- LEARNED over time, not asked upfront
  disliked_foods       text[],   -- LEARNED from skips/feedback
  pantry_staples       text[],   -- optional at setup; ['eggs','pasta','rice']
  budget_range         text,     -- 'low' | 'medium' | 'high'
  last_input_mode      text,     -- 'text'|'surprise'|'this_or_that'|'voice'|'swipe'|'form'
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- Each decision session
create table if not exists food_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users,
  input_mode       text,
  raw_input        text,
  cravings         text[],
  surprise         boolean default false,
  hunger_level     int,
  time_available_mins int,
  budget_override  text,
  format_pref      text,          -- 'order' | 'cook' | 'either'
  day_of_week      int,           -- 0=Sun ... 6=Sat
  hour_of_day      int,           -- 0-23
  created_at       timestamptz default now()
);

-- Recommendations surfaced per session
create table if not exists recommendations (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references food_sessions,
  type         text,              -- 'delivery' | 'recipe'
  dish_name    text,
  cuisine      text,
  est_time_mins int,
  est_cost_range text,
  deep_link    text,
  recipe_steps jsonb,
  rank         int,
  created_at   timestamptz default now()
);

-- Explicit feedback — did the rec land?
create table if not exists feedback (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid references food_sessions,
  recommendation_id uuid references recommendations,
  outcome           text,         -- 'chose' | 'skipped_all' | 'dismissed'
  reaction          text,         -- 'love' | 'good' | 'meh' | 'not_it'
  dismiss_reason    text,
  rating            int,          -- 1-5, optional post-meal
  created_at        timestamptz default now()
);

-- Implicit signals — low-effort behavioral data
create table if not exists interaction_events (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid references food_sessions,
  recommendation_id uuid references recommendations,
  event_type        text,         -- 'view'|'dwell'|'tap_order'|'expand_recipe'|'reroll'|'time_to_decision'
  value             numeric,
  created_at        timestamptz default now()
);

-- Cached "living taste profile" — format-flexible JSONB
create table if not exists taste_profile (
  user_id      uuid references auth.users primary key,
  stats        jsonb,
  refreshed_at timestamptz default now()
);

-- Ratings layer — decoupled, source-tagged. Resolver blends at read time.
create table if not exists ratings (
  id            uuid primary key default gen_random_uuid(),
  dish_key      text,             -- normalized dish/restaurant identifier
  source        text,             -- 'first_party' | 'google' | 'yelp' | ...
  score         numeric,
  scale         int default 5,
  votes         int,
  raw_payload   jsonb,
  user_id       uuid references auth.users,  -- set only for first_party rows
  refreshed_at  timestamptz default now(),
  created_at    timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────

alter table user_profiles      enable row level security;
alter table food_sessions      enable row level security;
alter table recommendations    enable row level security;
alter table feedback           enable row level security;
alter table interaction_events enable row level security;
alter table taste_profile      enable row level security;
alter table ratings            enable row level security;

-- user_profiles: id IS the user id
create policy "own profile - select" on user_profiles
  for select using (auth.uid() = id);
create policy "own profile - insert" on user_profiles
  for insert with check (auth.uid() = id);
create policy "own profile - update" on user_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- food_sessions: user_id column
create policy "own sessions - select" on food_sessions
  for select using (auth.uid() = user_id);
create policy "own sessions - insert" on food_sessions
  for insert with check (auth.uid() = user_id);
create policy "own sessions - update" on food_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- recommendations: owned via parent session
create policy "own recs - select" on recommendations
  for select using (
    exists (select 1 from food_sessions s
            where s.id = recommendations.session_id and s.user_id = auth.uid())
  );
create policy "own recs - insert" on recommendations
  for insert with check (
    exists (select 1 from food_sessions s
            where s.id = recommendations.session_id and s.user_id = auth.uid())
  );

-- feedback: owned via parent session
create policy "own feedback - select" on feedback
  for select using (
    exists (select 1 from food_sessions s
            where s.id = feedback.session_id and s.user_id = auth.uid())
  );
create policy "own feedback - insert" on feedback
  for insert with check (
    exists (select 1 from food_sessions s
            where s.id = feedback.session_id and s.user_id = auth.uid())
  );
create policy "own feedback - update" on feedback
  for update using (
    exists (select 1 from food_sessions s
            where s.id = feedback.session_id and s.user_id = auth.uid())
  );

-- interaction_events: owned via parent session
create policy "own events - select" on interaction_events
  for select using (
    exists (select 1 from food_sessions s
            where s.id = interaction_events.session_id and s.user_id = auth.uid())
  );
create policy "own events - insert" on interaction_events
  for insert with check (
    exists (select 1 from food_sessions s
            where s.id = interaction_events.session_id and s.user_id = auth.uid())
  );

-- taste_profile: user_id column
create policy "own taste - select" on taste_profile
  for select using (auth.uid() = user_id);
create policy "own taste - insert" on taste_profile
  for insert with check (auth.uid() = user_id);
create policy "own taste - update" on taste_profile
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ratings: external rows (google/yelp) are world-readable seeds; first_party
-- rows are private to their owner. Writes restricted to own first_party rows.
create policy "ratings - select external or own" on ratings
  for select using (source <> 'first_party' or auth.uid() = user_id);
create policy "ratings - insert own first_party" on ratings
  for insert with check (source = 'first_party' and auth.uid() = user_id);
create policy "ratings - update own first_party" on ratings
  for update using (source = 'first_party' and auth.uid() = user_id)
  with check (source = 'first_party' and auth.uid() = user_id);
