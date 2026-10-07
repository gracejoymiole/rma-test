-- URGENT: closes an anonymous learner-data leak that is LIVE right now.
--
-- Paste this whole file into the Supabase SQL Editor and run it. It is safe to
-- run more than once.
--
-- Verified against the live project on 2026-10-02: the old rma_leaderboard view
-- is still granted to anon and returns 664 rows to anyone, including real
-- first and last names for any row without a student code, enumerable by grade
-- and section. This drops that view and replaces it with a session-scoped
-- function, so the data is no longer reachable without a signed-in student.
--
-- After this, apply the full supabase/schema.sql to restore the remaining
-- functions (rma_get_score_bands, rma_teacher_profile, rma_set_attempt_complete).
-- The leaderboard shows learner names, and rma_scores has no row-level security, so it
-- must never be readable as a table. The old rma_leaderboard view was granted to anon,
-- which made every student's name and score world-readable through PostgREST: any caller
-- could pass their own grade/section/select/limit and read the entire results set.
-- Reading now goes through this definer function, which takes the caller's session and
-- ignores any scope they ask for, so a student can only ever see their own section.
drop view if exists public.rma_leaderboard cascade;

create or replace function public.rma_leaderboard_top(p_token text, p_limit integer default 10)
returns table (
  rank bigint,
  name text,
  score integer,
  duration text,
  duration_seconds integer,
  created_at timestamptz
) language plpgsql stable security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_student public.rma_students%rowtype;
  v_limit integer := greatest(1, least(coalesce(p_limit, 10), 100));
begin
  if coalesce(p_token, '') = '' or not exists (
       select 1 from public.rma_auth_sessions se
        where se.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
          and se.role = 'student' and se.expires_at > now()
    ) then
    raise exception 'Student session required.' using errcode = '28000';
  end if;

  select s.* into v_student
    from public.rma_auth_sessions se
    join public.rma_students s on s.id = se.student_id
   where se.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
     and se.role = 'student' and se.expires_at > now();

  -- Name comes from rma_scores, not rma_students: student_id is `on delete set
  -- null`, so any score from a deleted or unregistered student has no joined
  -- row. Reading the names through that join yields an empty string, and the
  -- grade pages skip entries with a blank name, which silently drops those
  -- scores off the leaderboard. first_name_mi and last_name are both NOT NULL
  -- on rma_scores, so the label is always populated.
  return query
  select row_number() over (order by sc.score desc, sc.duration_seconds asc nulls last, sc.created_at asc),
         coalesce(nullif(btrim(sc.student_code), ''),
                  nullif(btrim(concat_ws(' ', nullif(btrim(sc.first_name_mi), ''), sc.last_name)), '')),
         sc.score::integer, sc.duration, sc.duration_seconds, sc.created_at
    from public.rma_scores sc
   where sc.grade = v_student.grade
     and lower(btrim(sc.section)) = lower(btrim(v_student.section))
   order by sc.score desc, sc.duration_seconds asc nulls last, sc.created_at asc
   limit v_limit;
end;
$$;

revoke all on function public.rma_leaderboard_top(text, integer) from public;
grant execute on function public.rma_leaderboard_top(text, integer) to anon, authenticated;
