-- Abonnements Web Push (rappels quotidiens, même app/téléphone fermés).
-- À exécuter dans Supabase → SQL Editor.

create table if not exists push_subscriptions (
  endpoint      text primary key,
  user_id       text not null,
  subscription  jsonb not null,
  reminder_time text not null default '20:00',   -- HH:MM (heure locale de l'utilisateur)
  timezone      text not null default 'Europe/Paris',
  last_sent     date,                            -- garde-fou : 1 rappel max/jour
  created_at    timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on push_subscriptions (user_id);
