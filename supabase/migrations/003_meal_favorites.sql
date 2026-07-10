-- Favoris de repas, synchronisés par compte (Simon / Emma).
-- À exécuter une fois dans Supabase → SQL Editor.

create table if not exists meal_favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null,               -- 'simon' | 'emma'
  name       text not null,
  calories   integer not null default 0,
  protein    numeric not null default 0,
  carbs      numeric not null default 0,
  fat        numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, name)                   -- un favori unique par compte
);

create index if not exists meal_favorites_user_idx on meal_favorites (user_id);
