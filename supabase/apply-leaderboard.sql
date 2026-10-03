-- Deploys the teacher-side section leaderboard.
--
-- The CLI account cannot administer ogcrbrfzsjjizsubzdpg, so this has to be
-- pasted into the Supabase SQL Editor for that project. Idempotent.
--
-- Scope is resolved once into v_scope and both the live and all-time lists read
-- from that same array, so the two can never disagree about which learners are
-- visible. Grade and section filters are applied inside the function: a caller
-- cannot widen its own scope by passing different arguments.
--
-- Only granted to authenticated, never to anon. Re-run
-- npm run verify:live afterwards; add "teacher leaderboard" to that check.
-- Teacher-side leaderboards: "live" is each student's most recent completed
-- attempt, "all time" is their personal best. Both are scoped to the teacher,
-- with the grade and section filters applied inside the function so a caller
-- cannot widen its own scope by passing different arguments.
--
-- The scope is resolved once into v_scope and both lists read from that same
-- array, so the two leaderboards can never disagree about who is visible.
create or replace function public.rma_teacher_leaderboard(
  p_token text,
  p_grade smallint default null,
  p_section text default null,
  p_limit integer default 10
)
returns jsonb language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_teacher public.rma_teacher_accounts%rowtype;
  v_limit integer := greatest(1, least(coalesce(p_limit, 10), 100));
  v_scope uuid[] := '{}'::uuid[];
  v_live jsonb;
  v_all_time jsonb;
begin
  select t.* into v_teacher from public.rma_auth_sessions se
    join public.rma_teacher_accounts t on t.id = se.teacher_id
   where se.token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
     and se.role = 'teacher' and se.expires_at > now();
  if v_teacher.id is null then raise exception 'Teacher session expired. Sign in again.' using errcode = '28000'; end if;
  if v_teacher.must_change_password then
    raise exception 'Change the initial teacher password before opening student records.' using errcode = '42501';
  end if;

  select coalesce(array_agg(st.id), '{}'::uuid[]) into v_scope
    from public.rma_students st
   where (p_grade is null or st.grade = p_grade)
     and (p_section is null or lower(btrim(st.section)) = lower(btrim(p_section)))
     and (v_teacher.see_all_sections
          or v_teacher.first_name = '' or v_teacher.last_name = ''
          or (lower(st.teacher_first_name) = lower(v_teacher.first_name)
              and lower(st.teacher_last_name) = lower(v_teacher.last_name)));

  -- Live: the latest completed attempt per student. An attempt the teacher (or
  -- the student) marked unfinished is left out: a half-finished paper has not
  -- earned a place on a leaderboard.
  with per_student as (
    select distinct on (sc.student_id)
           sc.student_id, sc.score, sc.duration, sc.duration_seconds, sc.created_at,
           coalesce(sc.attempt_number, 0) as attempt_number
      from public.rma_scores sc
     where sc.student_id = any(v_scope)
       and coalesce(sc.is_complete, true)
       and sc.score is not null
     order by sc.student_id, sc.created_at desc
  )
  select coalesce(jsonb_agg(row_to_json(q) order by q.rank), '[]'::jsonb) into v_live
    from (
      select row_number() over (order by ps.score desc, ps.duration_seconds asc nulls last, ps.created_at asc) as rank,
             st.grade, st.section,
             nullif(btrim(st.student_code), '') as student_code,
             concat(st.last_name, ', ', st.first_name,
               case when st.middle_initial = '' then '' else ' ' || st.middle_initial || '.' end) as name,
             ps.score, ps.duration, ps.created_at, ps.attempt_number,
             (select count(*)::int from public.rma_scores a
               where a.student_id = ps.student_id and a.score is not null) as attempts
        from per_student ps
        join public.rma_students st on st.id = ps.student_id
       order by ps.score desc, ps.duration_seconds asc nulls last, ps.created_at asc
       limit v_limit
    ) q;

  -- All time: each student's personal best, so repeat attempts improve a score
  -- rather than replacing it. Slower and earlier attempts win ties.
  with per_student as (
    select distinct on (sc.student_id)
           sc.student_id, sc.score, sc.duration, sc.duration_seconds, sc.created_at
      from public.rma_scores sc
     where sc.student_id = any(v_scope)
       and coalesce(sc.is_complete, true)
       and sc.score is not null
     order by sc.student_id, sc.score desc, sc.duration_seconds asc nulls last, sc.created_at asc
  )
  select coalesce(jsonb_agg(row_to_json(q) order by q.rank), '[]'::jsonb) into v_all_time
    from (
      select row_number() over (order by ps.score desc, ps.duration_seconds asc nulls last, ps.created_at asc) as rank,
             st.grade, st.section,
             nullif(btrim(st.student_code), '') as student_code,
             concat(st.last_name, ', ', st.first_name,
               case when st.middle_initial = '' then '' else ' ' || st.middle_initial || '.' end) as name,
             ps.score, ps.duration, ps.created_at,
             (select count(*)::int from public.rma_scores a
               where a.student_id = ps.student_id and a.score is not null) as attempts
        from per_student ps
        join public.rma_students st on st.id = ps.student_id
       order by ps.score desc, ps.duration_seconds asc nulls last, ps.created_at asc
       limit v_limit
    ) q;

  return jsonb_build_object('live', v_live, 'all_time', v_all_time);
end;
$$;

revoke all on function public.rma_teacher_leaderboard(text, smallint, text, integer) from public;
grant execute on function public.rma_teacher_leaderboard(text, smallint, text, integer) to authenticated;
