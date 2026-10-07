-- Student live + all-time leaderboard. Paste this whole file in the Supabase
-- SQL Editor, then run `npm run verify:live`. Safe to run more than once.
-- The scope is derived from the signed-in student's session; callers cannot
-- choose a grade or section.
create or replace function public.rma_student_leaderboard(p_token text, p_limit integer default 10)
returns jsonb language plpgsql stable security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_student public.rma_students%rowtype;
  v_limit integer := greatest(1, least(coalesce(p_limit, 10), 100));
  v_live jsonb;
  v_all_time jsonb;
begin
  select st.* into v_student
    from public.rma_auth_sessions se
    join public.rma_students st on st.id = se.student_id
   where se.token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
     and se.role = 'student' and se.expires_at > now();
  if v_student.id is null then
    raise exception 'Student session required.' using errcode = '28000';
  end if;

  with per_student as (
    select distinct on (sc.student_id)
           sc.student_id, sc.score, sc.duration, sc.duration_seconds, sc.created_at
      from public.rma_scores sc
      join public.rma_students peer on peer.id = sc.student_id
     where peer.grade = v_student.grade
       and lower(btrim(peer.section)) = lower(btrim(v_student.section))
       and coalesce(sc.is_complete, true) and sc.score is not null
     order by sc.student_id, sc.created_at desc
  )
  select coalesce(jsonb_agg(row_to_json(q) order by q.rank), '[]'::jsonb) into v_live
    from (
      select row_number() over (order by ps.score desc, ps.duration_seconds asc nulls last, ps.created_at asc) as rank,
             coalesce(nullif(btrim(peer.student_code), ''), concat(peer.last_name, ', ', peer.first_name)) as name,
             ps.score, ps.duration, ps.duration_seconds, ps.created_at,
             (ps.student_id = v_student.id) as is_current_student
        from per_student ps join public.rma_students peer on peer.id = ps.student_id
       order by ps.score desc, ps.duration_seconds asc nulls last, ps.created_at asc
       limit v_limit
    ) q;

  with per_student as (
    select distinct on (sc.student_id)
           sc.student_id, sc.score, sc.duration, sc.duration_seconds, sc.created_at
      from public.rma_scores sc
      join public.rma_students peer on peer.id = sc.student_id
     where peer.grade = v_student.grade
       and lower(btrim(peer.section)) = lower(btrim(v_student.section))
       and coalesce(sc.is_complete, true) and sc.score is not null
     order by sc.student_id, sc.score desc, sc.duration_seconds asc nulls last, sc.created_at asc
  )
  select coalesce(jsonb_agg(row_to_json(q) order by q.rank), '[]'::jsonb) into v_all_time
    from (
      select row_number() over (order by ps.score desc, ps.duration_seconds asc nulls last, ps.created_at asc) as rank,
             coalesce(nullif(btrim(peer.student_code), ''), concat(peer.last_name, ', ', peer.first_name)) as name,
             ps.score, ps.duration, ps.duration_seconds, ps.created_at,
             (ps.student_id = v_student.id) as is_current_student
        from per_student ps join public.rma_students peer on peer.id = ps.student_id
       order by ps.score desc, ps.duration_seconds asc nulls last, ps.created_at asc
       limit v_limit
    ) q;

  return jsonb_build_object('live', v_live, 'all_time', v_all_time);
end;
$$;

revoke all on function public.rma_student_leaderboard(text, integer) from public;
grant execute on function public.rma_student_leaderboard(text, integer) to anon, authenticated;
notify pgrst, 'reload schema';
