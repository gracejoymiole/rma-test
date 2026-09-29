-- Run this entire script once in the Supabase SQL Editor for project ogcrbrfzsjjizsubzdpg.
-- Student names appear on the section leaderboard. The public view deliberately omits answer-level data.

create table if not exists public.rma_scores (
  id uuid primary key default gen_random_uuid(),
  grade smallint not null check (grade in (7, 8, 9, 10)),
  last_name text not null check (length(last_name) between 1 and 100),
  first_name_mi text not null check (length(first_name_mi) between 1 and 100),
  section text not null check (length(section) between 1 and 100),
  score smallint not null check (score between 0 and 100),
  start_time text not null default '',
  end_time text not null default '',
  duration text not null default '',
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  rma_data text not null default '',
  bank_data text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists rma_scores_leaderboard_idx
  on public.rma_scores (grade, section, score desc, duration_seconds asc, created_at asc);

create table if not exists public.rma_violations (
  id uuid primary key default gen_random_uuid(),
  grade smallint not null check (grade in (7, 8, 9, 10)),
  student_name text not null default 'Unknown' check (length(student_name) <= 200),
  category text not null default 'OTHER' check (length(category) <= 80),
  action text not null default '' check (length(action) <= 240),
  created_at timestamptz not null default now()
);

alter table public.rma_scores enable row level security;
alter table public.rma_violations enable row level security;

-- Browsers may submit attempts/events but may not read the underlying tables.
drop policy if exists "Public may submit RMA scores" on public.rma_scores;
create policy "Public may submit RMA scores"
  on public.rma_scores for insert to anon, authenticated with check (true);
drop policy if exists "Public may submit RMA violations" on public.rma_violations;
create policy "Public may submit RMA violations"
  on public.rma_violations for insert to anon, authenticated with check (true);

revoke all on public.rma_scores from anon, authenticated;
grant insert on public.rma_scores to anon, authenticated;
revoke all on public.rma_violations from anon, authenticated;
grant insert on public.rma_violations to anon, authenticated;

-- Postgres views run as their owner by default: this exposes only the fields needed for a leaderboard.
create or replace view public.rma_leaderboard as
  select grade, section,
         concat_ws(' ', nullif(first_name_mi, ''), last_name) as name,
         score, duration, duration_seconds, created_at
    from public.rma_scores;
revoke all on public.rma_leaderboard from public;
grant select on public.rma_leaderboard to anon, authenticated;
