-- XP help system: records which questions used help and the unaided score.
-- Run once in the Supabase SQL editor, BEFORE or after deploying the new pages: until it
-- runs, pages keep saving scores (rma-data.js retries without the new fields).
-- Safe to run twice.
begin;

alter table public.rma_scores add column if not exists help_data text not null default '';
alter table public.rma_scores add column if not exists unaided_score smallint check (unaided_score between 0 and 100);

-- The two new arguments have defaults, so grades that do not send them keep working.
drop function if exists public.rma_submit_score(text,smallint,integer,text,text,text,integer,text,text);
create or replace function public.rma_submit_score(
  p_token text, p_grade smallint, p_score integer, p_start_time text, p_end_time text,
  p_duration text, p_duration_seconds integer, p_rma_data text, p_bank_data text,
  p_help_data text default '', p_unaided_score integer default null
) returns boolean language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare v_student public.rma_students%rowtype;
begin
  select st.* into v_student from public.rma_auth_sessions se join public.rma_students st on st.id = se.student_id
   where se.token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
     and se.role = 'student' and se.expires_at > now();
  if not found or v_student.grade <> p_grade then raise exception 'Student session expired. Please sign in again.' using errcode = '28000'; end if;
  insert into public.rma_scores (grade, last_name, first_name_mi, section, score, start_time, end_time,
      duration, duration_seconds, rma_data, bank_data, student_id, student_code, teacher_name,
      help_data, unaided_score)
    values (v_student.grade, v_student.last_name,
      concat_ws(' ', v_student.first_name, nullif(v_student.middle_initial, '')), v_student.section,
      greatest(0, least(100, p_score)), coalesce(p_start_time, ''), coalesce(p_end_time, ''),
      coalesce(p_duration, ''), greatest(0, coalesce(p_duration_seconds, 0)),
      left(coalesce(p_rma_data, ''), 12000), left(coalesce(p_bank_data, ''), 12000),
      v_student.id, v_student.student_code,
      concat_ws(' ', v_student.teacher_title, v_student.teacher_first_name, v_student.teacher_last_name),
      left(coalesce(p_help_data, ''), 2000),
      case when p_unaided_score is null then null else greatest(0, least(100, p_unaided_score)) end);
  return true;
end;
$$;

revoke all on function public.rma_submit_score(text,smallint,integer,text,text,text,integer,text,text,text,integer) from public;
grant execute on function public.rma_submit_score(text,smallint,integer,text,text,text,integer,text,text,text,integer) to anon, authenticated;

-- Teacher records now include help_data and unaided_score.
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

commit;
