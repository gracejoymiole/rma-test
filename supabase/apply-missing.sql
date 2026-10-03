-- TARGETED DEPLOYMENT: everything a rolled-back run never created.
--
-- A schema.sql run failed at rma_get_score_bands and Supabase rolled the whole
-- script back, so these objects were never created. Verified against the live
-- project 2026-10-02 by probing PostgREST:
--   rma_get_score_bands       PGRST202
--   rma_teacher_profile       PGRST202
--   rma_set_attempt_complete  PGRST202
--   public.rma_score_bands    PGRST205
--   rma_teacher_accounts.first_name        missing
--   rma_teacher_accounts.last_name         missing
--   rma_teacher_accounts.see_all_sections  missing
--   rma_scores.attempt_number              missing
--   rma_scores.is_complete                 missing
--
-- The columns come first, and all of them, because a plpgsql body is not
-- resolved until it runs: rma_teacher_profile would be created happily against
-- missing first_name/last_name/see_all_sections and only fail for a real
-- teacher later. rma_set_attempt_complete writes is_complete, and
-- rma_get_score_bands reads rma_score_bands.
--
-- Every statement is copied verbatim from schema.sql, which stays the
-- authoritative file; tests/test-deployment.js fails if the two ever drift.
-- Idempotent, so it is safe to run more than once.
alter table public.rma_teacher_accounts add column if not exists first_name text not null default '';
alter table public.rma_teacher_accounts add column if not exists last_name text not null default '';
alter table public.rma_teacher_accounts add column if not exists see_all_sections boolean not null default true;
-- Score bands table for configurable performance levels
create table if not exists public.rma_score_bands (
  id uuid primary key default gen_random_uuid(),
  band_name text not null unique,
  min_score smallint not null check (min_score >= 0 and min_score <= 100),
  max_score smallint not null check (max_score >= 0 and max_score <= 100),
  label text not null,
  color text not null,
  icon text not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  check (min_score <= max_score)
);

-- Insert default score bands
insert into public.rma_score_bands (band_name, min_score, max_score, label, color, icon, sort_order)
values
  ('proficient', 80, 100, 'Ready / Proficient', '#155b30', '✅', 1),
  ('developing', 60, 79, 'Developing', '#c2410c', '🟡', 2),
  ('emerging', 40, 59, 'Emerging', '#c2410c', '🟠', 3),
  ('needs_support', 0, 39, 'Needs Intensive Support', '#991b1b', '🔴', 4)
on conflict (band_name) do nothing;

-- Add attempt tracking to scores table
alter table public.rma_scores add column if not exists attempt_number smallint not null default 1;
alter table public.rma_scores add column if not exists is_complete boolean not null default true;
-- RPC to get score bands
create or replace function public.rma_get_score_bands()
returns jsonb language sql security definer
set search_path = public, extensions, pg_temp
as $$
  -- ORDER BY must live inside the aggregate: a bare "order by sort_order"
  -- after FROM is rejected (42803) because sort_order is neither grouped nor
  -- aggregated. The client sorts by sort_order too, but return it ordered.
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'band_name', band_name,
        'min_score', min_score,
        'max_score', max_score,
        'label', label,
        'color', color,
        'icon', icon,
        'sort_order', sort_order
      )
      order by sort_order
    ),
    '[]'::jsonb
  ) from public.rma_score_bands;
$$;

grant execute on function public.rma_get_score_bands() to anon, authenticated;
-- Lets the portal tell the teacher what scope they are looking at.
create or replace function public.rma_teacher_profile(p_token text)
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
  return jsonb_build_object('username', v_teacher.username,
    'first_name', v_teacher.first_name, 'last_name', v_teacher.last_name,
    'see_all_sections', v_teacher.see_all_sections);
end;
$$;

-- Teacher-recorded observation of whether the latest attempt was finished.
create or replace function public.rma_set_attempt_complete(p_token text, p_student_code text, p_complete boolean)
returns boolean language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare v_teacher public.rma_teacher_accounts%rowtype; v_count integer;
begin
  select t.* into v_teacher from public.rma_auth_sessions se
    join public.rma_teacher_accounts t on t.id = se.teacher_id
   where se.token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
     and se.role = 'teacher' and se.expires_at > now();
  if v_teacher.id is null then raise exception 'Teacher session expired. Sign in again.' using errcode = '28000'; end if;
  if v_teacher.must_change_password then
    raise exception 'Change the initial teacher password before opening student records.' using errcode = '42501';
  end if;

  update public.rma_scores sc set is_complete = coalesce(p_complete, true)
   from public.rma_students st
   where st.id = sc.student_id
     and st.student_code = upper(trim(coalesce(p_student_code, '')))
     and sc.id = (select sc2.id from public.rma_scores sc2
                   where sc2.student_id = st.id order by sc2.created_at desc limit 1);
  get diagnostics v_count = row_count;
  if v_count = 0 then
    raise exception 'No submitted attempt was found for that student.' using errcode = 'P0002';
  end if;
  return true;
end;
$$;
revoke all on function public.rma_teacher_profile(text) from public;
revoke all on function public.rma_set_attempt_complete(text, text, boolean) from public;
grant execute on function public.rma_teacher_profile(text) to anon, authenticated;
grant execute on function public.rma_set_attempt_complete(text, text, boolean) to anon, authenticated;
drop function if exists public.rma_section_comparison(smallint);
