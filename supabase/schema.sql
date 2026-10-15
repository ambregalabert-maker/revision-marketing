-- =====================================================================
-- Révision Marketing · Chapitre 1 — base de données Supabase
-- À coller en entier dans Supabase : SQL Editor → New query → Run.
-- On peut le relancer sans risque (il ne supprime pas les données).
-- =====================================================================

-- ---------- Profils (un par compte) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  prenom text not null default '',
  pseudo text not null default '',
  objectif_hebdo smallint not null default 5 check (objectif_hebdo in (3, 5, 7)),
  date_qcm date,
  apparait_classement boolean not null default false,
  onboarding_fait boolean not null default false,
  boutique jsonb not null default '{}'::jsonb,       -- compagnon, accessoires, Marks dépensés
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- Répétition espacée (boîtes de Leitner) ----------
create table if not exists public.card_reviews (
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id text not null,
  boite smallint not null check (boite between 1 and 5),
  prochaine_revision date not null,
  derniere_revision date,
  nb_revisions integer not null default 0,
  nb_echecs integer not null default 0,
  primary key (user_id, card_id)
);

-- ---------- Toutes les réponses (flashcards, QCM, exercices, cas) ----------
create table if not exists public.attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null,
  type text not null check (type in ('flashcard', 'qcm', 'exercice', 'cas')),
  notion text not null,
  seance smallint not null check (seance in (1, 2)),
  correct boolean not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_id, created_at)
);
create index if not exists attempts_user_idx on public.attempts (user_id, created_at);

-- ---------- Séances de révision ----------
create table if not exists public.study_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  debut timestamptz not null,
  duree_minutes integer not null default 0,
  type text not null check (type in ('pomodoro', 'guidee', 'daily', 'libre')),
  xp_gagnes integer not null default 0
);
create index if not exists sessions_user_idx on public.study_sessions (user_id, debut);

-- ---------- Statistiques (XP, niveau, série, joker) ----------
create table if not exists public.user_stats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  xp_total integer not null default 0,
  niveau smallint not null default 1,
  serie_actuelle integer not null default 0,
  meilleure_serie integer not null default 0,
  joker_utilise_semaine date,          -- lundi de la semaine où le joker a servi
  derniere_activite date,
  xp_semaine integer not null default 0,
  semaine_cle date,                    -- lundi de la semaine de xp_semaine
  minutes_par_jour jsonb not null default '{}'::jsonb,
  chemin jsonb not null default '{}'::jsonb,   -- étoiles du chemin (mode daily)
  maj_le timestamptz not null default now()
);

-- ---------- Badges ----------
create table if not exists public.badges (
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_id text not null,
  obtenu_le timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- ---------- Mises à jour (si tu avais déjà collé une ancienne version de ce fichier) ----------
alter table public.user_stats add column if not exists chemin jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists boutique jsonb not null default '{}'::jsonb;
alter table public.study_sessions drop constraint if exists study_sessions_type_check;
alter table public.study_sessions add constraint study_sessions_type_check check (type in ('pomodoro', 'guidee', 'daily', 'libre'));

-- =====================================================================
-- Sécurité (Row Level Security) : chaque utilisateur ne lit et n'écrit
-- QUE ses propres lignes.
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.card_reviews enable row level security;
alter table public.attempts enable row level security;
alter table public.study_sessions enable row level security;
alter table public.user_stats enable row level security;
alter table public.badges enable row level security;

drop policy if exists "profil : le mien" on public.profiles;
create policy "profil : le mien" on public.profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "cartes : les miennes" on public.card_reviews;
create policy "cartes : les miennes" on public.card_reviews
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "réponses : les miennes" on public.attempts;
create policy "réponses : les miennes" on public.attempts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "séances : les miennes" on public.study_sessions;
create policy "séances : les miennes" on public.study_sessions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "stats : les miennes" on public.user_stats;
create policy "stats : les miennes" on public.user_stats
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "badges : les miens" on public.badges;
create policy "badges : les miens" on public.badges
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =====================================================================
-- Création automatique du profil à l'inscription
-- =====================================================================
create or replace function public.creer_profil()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  insert into public.user_stats (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists a_l_inscription on auth.users;
create trigger a_l_inscription
  after insert on auth.users
  for each row execute function public.creer_profil();

-- =====================================================================
-- Classement de la semaine : seulement le pseudo et les XP de la semaine,
-- seulement pour les étudiants qui ont accepté d'apparaître.
-- Jamais d'e-mail. Les XP repartent de zéro chaque lundi.
-- (La vue s'exécute avec les droits de son propriétaire : c'est voulu,
--  elle n'expose que ces deux colonnes.)
-- =====================================================================
create or replace view public.classement_semaine as
select
  p.pseudo,
  case
    when s.semaine_cle = date_trunc('week', (now() at time zone 'Europe/Paris'))::date then s.xp_semaine
    else 0
  end as xp_semaine
from public.profiles p
join public.user_stats s on s.user_id = p.id
where p.apparait_classement = true
  and length(trim(p.pseudo)) > 0;

revoke all on public.classement_semaine from anon;
grant select on public.classement_semaine to authenticated;

-- =====================================================================
-- « Supprimer mon compte » : efface le compte et toutes ses données
-- (les tables sont liées avec "on delete cascade").
-- =====================================================================
create or replace function public.supprimer_mon_compte()
returns void
language sql
security definer set search_path = public
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.supprimer_mon_compte() from public, anon;
grant execute on function public.supprimer_mon_compte() to authenticated;
