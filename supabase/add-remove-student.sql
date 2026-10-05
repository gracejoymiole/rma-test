-- Remove a student and everything recorded about them.
--
-- Run once in the Supabase SQL editor. Safe to run twice. Until it runs the
-- Remove a student card explains that it cannot act, and the dashboard is
-- otherwise unaffected.
--
-- Scope is enforced here rather than in the browser: a teacher may only remove a
-- student whose recorded teacher matches their own, unless their account carries
-- see_all_sections. The browser-side filter is a convenience, not the guard.
--
-- The help and attempt columns are added here as well as in
-- add-help-tracking.sql and apply-missing.sql, and deliberately BEFORE the
-- dashboard function below. That function selects sc.help_data, sc.unaided_score,
-- sc.attempt_number and sc.is_complete, so on a database where those scripts have
-- not been run it would fail to execute at all and take the whole teacher Overview
-- down with it. Adding them first means this file stands on its own.
begin;

alter table public.rma_scores add column if not exists help_data text not null default '';
alter table public.rma_scores add column if not exists unaided_score smallint check (unaided_score between 0 and 100);
alter table public.rma_scores add column if not exists attempt_number smallint not null default 1;
alter table public.rma_scores add column if not exists is_complete boolean not null default true;

create or replace function public.rma_remove_student(p_token text, p_student_id uuid)
returns jsonb language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_teacher public.rma_teacher_accounts%rowtype;
  v_student public.rma_students%rowtype;
  v_scores integer;
  v_violations integer;
  v_sessions integer;
begin
  select t.* into v_teacher from public.rma_auth_sessions se
    join public.rma_teacher_accounts t on t.id = se.teacher_id
   where se.token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
     and se.role = 'teacher' and se.expires_at > now();
  if v_teacher.id is null then
    raise exception 'Teacher session expired. Sign in again.' using errcode = '28000';
  end if;
  if v_teacher.must_change_password then
    raise exception 'Change the initial teacher password before removing student records.' using errcode = '42501';
  end if;

  select st.* into v_student from public.rma_students st where st.id = p_student_id;
  if v_student.id is null then raise exception 'That student no longer exists.' using errcode = 'P0002'; end if;

  if not (v_teacher.see_all_sections
          or v_teacher.first_name = '' or v_teacher.last_name = ''
          or (lower(v_student.teacher_first_name) = lower(v_teacher.first_name)
              and lower(v_student.teacher_last_name) = lower(v_teacher.last_name))) then
    raise exception 'That student is not in one of your sections.' using errcode = '42501';
  end if;

  -- Sessions first: rma_auth_sessions.student_id references the student.
  delete from public.rma_auth_sessions where student_id = v_student.id;
  get diagnostics v_sessions = row_count;

  delete from public.rma_violations where student_id = v_student.id;
  get diagnostics v_violations = row_count;

  delete from public.rma_scores where student_id = v_student.id;
  get diagnostics v_scores = row_count;

  delete from public.rma_students where id = v_student.id;

  return jsonb_build_object(
    'removed', true,
    'student_code', v_student.student_code,
    'student_name', concat(v_student.last_name, ', ', v_student.first_name),
    'scores_deleted', v_scores,
    'violations_deleted', v_violations,
    'sessions_deleted', v_sessions);
end;
$$;

revoke all on function public.rma_remove_student(text, uuid) from public;
grant execute on function public.rma_remove_student(text, uuid) to authenticated;

-- The removal card needs rma_teacher_dashboard to return a student_id for every
-- learner, because rma_remove_student identifies the student by that id. An older
-- rma_teacher_dashboard on the database does not, which leaves the card with a
-- populated section and nothing it can act on. This re-sends the current
-- definition, and adds the help-tracking fields at the same time.
commit;

begin;

create or replace function public.rma_teacher_dashboard(p_token text)
returns jsonb language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare v_teacher public.rma_teacher_accounts%rowtype;
begin
  select t.* into v_teacher from public.rma_auth_sessions se
    join public.rma_teacher_accounts t on t.id = se.teacher_id
   where se.token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
     and se.role = 'teacher' and se.expires_at > now();
  if v_teacher.id is null then raise exception 'Teacher session expired. Sign in again.' using errcode = '28000'; end if;
  if v_teacher.must_change_password then
    raise exception 'Change the initial teacher password before opening student records.' using errcode = '42501';
  end if;

  -- An account with no name on file, or with see_all_sections set, keeps the
  -- original whole-school view. Otherwise it only sees its own classes.
  return coalesce((
    select jsonb_agg(jsonb_build_object('student_id', st.id, 'grade', st.grade, 'section', st.section,
      'student_code', st.student_code, 'student_name', concat(st.last_name, ', ', st.first_name,
        case when st.middle_initial = '' then '' else ' ' || st.middle_initial || '.' end),
      'teacher_name', concat_ws(' ', st.teacher_title,
        st.teacher_first_name, st.teacher_last_name), 'score', latest.score, 'duration', latest.duration,
      'rma_data', latest.rma_data, 'bank_data', latest.bank_data, 'created_at', latest.created_at,
      'help_data', latest.help_data, 'unaided_score', latest.unaided_score,
      'attempt_number', coalesce(latest.attempt_number, 0), 'is_complete', latest.is_complete,
      'attempts', coalesce(tally.attempts, 0))
      order by st.grade, st.section, st.last_name, st.first_name)
    from public.rma_students st
    left join lateral (select sc.score, sc.duration, sc.rma_data, sc.bank_data, sc.created_at,
        sc.help_data, sc.unaided_score, sc.attempt_number, sc.is_complete
      from public.rma_scores sc where sc.student_id = st.id order by sc.created_at desc limit 1) latest on true
    left join lateral (select count(*)::int as attempts
      from public.rma_scores sc where sc.student_id = st.id) tally on true
    where v_teacher.see_all_sections
       or v_teacher.first_name = '' or v_teacher.last_name = ''
       or (lower(st.teacher_first_name) = lower(v_teacher.first_name)
           and lower(st.teacher_last_name) = lower(v_teacher.last_name))
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.rma_teacher_dashboard(text) from public;
grant execute on function public.rma_teacher_dashboard(text) to authenticated;

commit;