-- ═══════════════════════════════════════════════════════════
-- 75 Jours Challenge — Schéma complet Supabase
-- Colle ce SQL dans l'éditeur SQL de ton dashboard Supabase
-- ═══════════════════════════════════════════════════════════

-- ─── Users ────────────────────────────────────────────────
create table if not exists users (
  id                   text primary key check (id in ('simon', 'emma')),
  name                 text not null,
  emoji                text not null default '🦁',
  macro_targets        jsonb not null default '{"calories":2000,"protein":150,"carbs":200,"fat":65}',
  challenge_start_date date not null default '2026-06-01',
  challenge_extra_days int  not null default 0,
  created_at           timestamptz not null default now()
);

-- Seed the two participants
insert into users (id, name, emoji, macro_targets) values
  ('simon', 'Simon', '🦁', '{"calories":2500,"protein":180,"carbs":280,"fat":80}'),
  ('emma',  'Emma',  '🦊', '{"calories":1800,"protein":130,"carbs":200,"fat":60}')
on conflict (id) do nothing;


-- ─── Daily logs ───────────────────────────────────────────
create table if not exists daily_logs (
  id               uuid        primary key default gen_random_uuid(),
  user_id          text        not null references users(id),
  date             date        not null,
  water_ml         int         not null default 0,
  steps            int         not null default 0,
  -- workout_count: 0 = not addressed, -1 = rest day, >=1 = workouts done
  workout_count    int         not null default 0,
  stretching       boolean     not null default false,
  reinforcement    boolean     not null default false,
  pages            int         not null default 0,
  study_minutes    int         not null default 0,
  -- study_mode: 'study' | 'work' | 'vacation'
  study_mode       text        not null default 'study'
                               check (study_mode in ('study', 'work', 'vacation')),
  alcohol          boolean     not null default false,
  completed        boolean     not null default false,
  streak_day       int         not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists idx_daily_logs_user_date
  on daily_logs(user_id, date desc);


-- ─── Meals ────────────────────────────────────────────────
create table if not exists meals (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            text        not null references users(id),
  date               date        not null,
  name               text        not null,
  calories           numeric     not null default 0,
  protein            numeric     not null default 0,
  carbs              numeric     not null default 0,
  fat                numeric     not null default 0,
  input_type         text        not null default 'text'
                                 check (input_type in ('text', 'photo', 'voice')),
  ai_raw_response    text,
  manually_adjusted  boolean     not null default false,
  created_at         timestamptz not null default now()
);

create index if not exists idx_meals_user_date
  on meals(user_id, date desc);


-- ─── Justifications ───────────────────────────────────────
-- Peer validation: one user submits, the other accepts/rejects
create table if not exists justifications (
  id             uuid        primary key default gen_random_uuid(),
  user_id        text        not null references users(id),
  date           date        not null,
  category       text,       -- comma-separated habit IDs
  reason         text        not null,
  verdict        text        not null default 'pending'
                             check (verdict in ('pending', 'accepted', 'rejected')),
  ai_explanation text,       -- stores the reviewer's decision message
  reviewed_by    text        references users(id),
  created_at     timestamptz not null default now()
);

create index if not exists idx_justifications_user_verdict
  on justifications(user_id, verdict);


-- ─── Streaks ──────────────────────────────────────────────
create table if not exists streaks (
  id          uuid        primary key default gen_random_uuid(),
  user_id     text        not null references users(id),
  start_date  date        not null,
  end_date    date,
  length      int         not null default 0,
  active      boolean     not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists idx_streaks_user_active
  on streaks(user_id, active);


-- ─── Auto-update updated_at ───────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_daily_logs_updated_at on daily_logs;
create trigger trg_daily_logs_updated_at
  before update on daily_logs
  for each row execute function set_updated_at();


-- ═══════════════════════════════════════════════════════════
-- MIGRATION ADDITIVE (si la DB existe déjà sans study_mode)
-- Exécute seulement si tu avais déjà créé les tables avant.
-- ═══════════════════════════════════════════════════════════
-- alter table daily_logs
--   add column if not exists study_mode text not null default 'study'
--   check (study_mode in ('study', 'work', 'vacation'));
