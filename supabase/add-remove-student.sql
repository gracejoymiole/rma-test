-- Remove a student and everything recorded about them.
--
-- Run once in the Supabase SQL editor. Safe to run twice. Until it runs the
-- portal hides the Remove student control and the dashboard simply does not
-- offer the action, so a deployment without it behaves as it does today.
--
-- Scope is enforced here rather than in the browser: a teacher may only remove a
-- student whose recorded teacher matches their own, unless their account carries
-- see_all_sections. The browser-side filter is a convenience, not the guard.
begin;

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

commit;