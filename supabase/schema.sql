-- Run once in the Supabase SQL Editor. Existing score/violation tables are extended in place.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.rma_students (
  id uuid primary key default gen_random_uuid(),
  student_no bigint generated always as identity unique,
  student_code text unique,
  grade smallint not null check (grade in (7, 8, 9, 10)),
  section text not null check (length(section) between 1 and 60),
  last_name text not null check (length(last_name) between 1 and 100),
  first_name text not null check (length(first_name) between 1 and 100),
  middle_initial text not null default '' check (length(middle_initial) <= 5),
  teacher_title text not null check (teacher_title in ('Mr.', 'Ms.')),
  teacher_last_name text not null check (length(teacher_last_name) between 1 and 100),
  teacher_first_name text not null check (length(teacher_first_name) between 1 and 100),
  password_hash text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists rma_students_one_account_per_identity
  on public.rma_students (grade, lower(section), lower(last_name), lower(first_name), lower(middle_initial));

create table if not exists public.rma_teacher_accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);

-- Teacher scoping. Both default to the previous behaviour: a blank name or
-- see_all_sections = true means the account may view every section, so adding
-- these columns can never lock an existing account out. Set a name and flip
-- see_all_sections to false to restrict an account to its own classes.
alter table public.rma_teacher_accounts add column if not exists first_name text not null default '';
alter table public.rma_teacher_accounts add column if not exists last_name text not null default '';
alter table public.rma_teacher_accounts add column if not exists see_all_sections boolean not null default true;

create table if not exists public.rma_auth_sessions (
  token_hash text primary key,
  role text not null check (role in ('student', 'teacher')),
  student_id uuid references public.rma_students(id) on delete cascade,
  teacher_id uuid references public.rma_teacher_accounts(id) on delete cascade,
  expires_at timestamptz not null,
  check ((role = 'student' and student_id is not null and teacher_id is null)
      or (role = 'teacher' and teacher_id is not null and student_id is null))
);

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
  student_id uuid references public.rma_students(id) on delete set null,
  student_code text,
  teacher_name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.rma_scores add column if not exists student_id uuid references public.rma_students(id) on delete set null;
alter table public.rma_scores add column if not exists student_code text;
alter table public.rma_scores add column if not exists teacher_name text not null default '';
create index if not exists rma_scores_leaderboard_idx
  on public.rma_scores (grade, section, score desc, duration_seconds asc, created_at asc);
create index if not exists rma_scores_student_latest_idx
  on public.rma_scores (student_id, created_at desc);

create table if not exists public.rma_violations (
  id uuid primary key default gen_random_uuid(),
  grade smallint not null check (grade in (7, 8, 9, 10)),
  student_name text not null default 'Unknown' check (length(student_name) <= 200),
  category text not null default 'OTHER' check (length(category) <= 80),
  action text not null default '' check (length(action) <= 240),
  student_id uuid references public.rma_students(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.rma_violations add column if not exists student_id uuid references public.rma_students(id) on delete set null;

alter table public.rma_students enable row level security;
alter table public.rma_teacher_accounts enable row level security;
alter table public.rma_auth_sessions enable row level security;
alter table public.rma_scores enable row level security;
alter table public.rma_violations enable row level security;

-- Private tables are only accessed by the carefully scoped security-definer RPCs below.
drop policy if exists "Public may submit RMA scores" on public.rma_scores;
drop policy if exists "Public may submit RMA violations" on public.rma_violations;
revoke all on public.rma_students, public.rma_teacher_accounts, public.rma_auth_sessions,
  public.rma_scores, public.rma_violations from public, anon, authenticated;
revoke all on sequence public.rma_students_student_no_seq from public, anon, authenticated;

create or replace function public.rma_teacher_suggestions(p_prefix text)
returns text[] language sql stable security definer
set search_path = public, extensions, pg_temp
as $$
  select coalesce(array_agg(s.teacher_first_name order by s.teacher_first_name), '{}'::text[])
    from (select distinct teacher_first_name from public.rma_students
           where teacher_first_name ilike left(coalesce(p_prefix, ''), 40) || '%'
           order by teacher_first_name limit 8) s;
$$;

create or replace function public.rma_student_register(
  p_grade smallint, p_last_name text, p_first_name text, p_middle_initial text,
  p_section text, p_teacher_title text, p_teacher_last_name text, p_teacher_first_name text
) returns jsonb language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare v_student public.rma_students%rowtype; v_password text; v_token text;
begin
  if p_grade not in (7, 8, 9, 10)
    or nullif(trim(p_last_name), '') is null or nullif(upper(trim(p_first_name)), '') is null
    or nullif(trim(p_section), '') is null or p_teacher_title not in ('Mr.', 'Ms.')
    or nullif(trim(p_teacher_last_name), '') is null or nullif(upper(trim(p_teacher_first_name)), '') is null then
    raise exception 'Please complete all required student, section, and teacher fields.' using errcode = '22023';
  end if;
  if length(p_section) > 60 or length(p_last_name) > 100 or length(p_first_name) > 100 then
    raise exception 'One or more fields exceed the allowed length.' using errcode = '22023';
  end if;

  v_password := upper(substr(encode(extensions.gen_random_bytes(10), 'hex'), 1, 12));
  insert into public.rma_students (grade, section, last_name, first_name, middle_initial,
      teacher_title, teacher_last_name, teacher_first_name, password_hash)
    values (p_grade, upper(trim(p_section)), upper(trim(p_last_name)), upper(trim(p_first_name)),
      upper(trim(coalesce(p_middle_initial, ''))), p_teacher_title, upper(trim(p_teacher_last_name)),
      upper(trim(p_teacher_first_name)), extensions.crypt(v_password, extensions.gen_salt('bf')))
    returning * into v_student;

  v_student.student_code := 'RMA-' || v_student.grade || '-' || lpad(v_student.student_no::text, 6, '0');
  update public.rma_students set student_code = v_student.student_code where id = v_student.id;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.rma_auth_sessions (token_hash, role, student_id, expires_at)
    values (encode(extensions.digest(v_token, 'sha256'), 'hex'), 'student', v_student.id, now() + interval '12 hours');

  return jsonb_build_object(
    'token', v_token, 'student_code', v_student.student_code, 'generated_password', v_password,
    'profile', jsonb_build_object('student_id', v_student.id, 'student_code', v_student.student_code,
      'grade', v_student.grade, 'section', v_student.section, 'last_name', v_student.last_name,
      'first_name', v_student.first_name, 'middle_initial', v_student.middle_initial,
      'teacher_title', v_student.teacher_title, 'teacher_last_name', v_student.teacher_last_name,
      'teacher_first_name', v_student.teacher_first_name));
exception when unique_violation then
  raise exception 'An account already exists for this student name, grade, and section.' using errcode = '23505';
end;
$$;

create or replace function public.rma_student_login(p_student_code text, p_password text, p_grade smallint)
returns jsonb language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare v_student public.rma_students%rowtype; v_token text;
begin
  select * into v_student from public.rma_students
   where student_code = upper(trim(p_student_code)) and grade = p_grade;
  if not found or extensions.crypt(coalesce(p_password, ''), v_student.password_hash) <> v_student.password_hash then
    raise exception 'Student ID or password is incorrect.' using errcode = '28000';
  end if;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.rma_auth_sessions (token_hash, role, student_id, expires_at)
    values (encode(extensions.digest(v_token, 'sha256'), 'hex'), 'student', v_student.id, now() + interval '12 hours');
  return jsonb_build_object('token', v_token, 'profile', jsonb_build_object(
    'student_id', v_student.id, 'student_code', v_student.student_code, 'grade', v_student.grade,
    'section', v_student.section, 'last_name', v_student.last_name, 'first_name', v_student.first_name,
    'middle_initial', v_student.middle_initial, 'teacher_title', v_student.teacher_title,
    'teacher_last_name', v_student.teacher_last_name, 'teacher_first_name', v_student.teacher_first_name));
end;
$$;

create or replace function public.rma_submit_score(
  p_token text, p_grade smallint, p_score integer, p_start_time text, p_end_time text,
  p_duration text, p_duration_seconds integer, p_rma_data text, p_bank_data text
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
      duration, duration_seconds, rma_data, bank_data, student_id, student_code, teacher_name)
    values (v_student.grade, v_student.last_name,
      concat_ws(' ', v_student.first_name, nullif(v_student.middle_initial, '')), v_student.section,
      greatest(0, least(100, p_score)), coalesce(p_start_time, ''), coalesce(p_end_time, ''),
      coalesce(p_duration, ''), greatest(0, coalesce(p_duration_seconds, 0)),
      left(coalesce(p_rma_data, ''), 12000), left(coalesce(p_bank_data, ''), 12000),
      v_student.id, v_student.student_code,
      concat_ws(' ', v_student.teacher_title, v_student.teacher_first_name, v_student.teacher_last_name));
  return true;
end;
$$;

create or replace function public.rma_report_violation(p_token text, p_grade smallint, p_category text, p_action text)
returns boolean language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare v_student public.rma_students%rowtype;
begin
  select st.* into v_student from public.rma_auth_sessions se join public.rma_students st on st.id = se.student_id
   where se.token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
     and se.role = 'student' and se.expires_at > now();
  if not found or v_student.grade <> p_grade then raise exception 'Student session expired.' using errcode = '28000'; end if;
  insert into public.rma_violations (grade, student_name, category, action, student_id)
    values (v_student.grade, concat(v_student.last_name, ', ', v_student.first_name),
      left(coalesce(p_category, 'OTHER'), 80), left(coalesce(p_action, ''), 240), v_student.id);
  return true;
end;
$$;

create or replace function public.rma_teacher_login(p_username text, p_password text)
returns jsonb language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare v_teacher public.rma_teacher_accounts%rowtype; v_token text;
begin
  select * into v_teacher from public.rma_teacher_accounts where username = lower(trim(p_username));
  if not found or extensions.crypt(coalesce(p_password, ''), v_teacher.password_hash) <> v_teacher.password_hash then
    raise exception 'Username or password is incorrect.' using errcode = '28000';
  end if;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.rma_auth_sessions (token_hash, role, teacher_id, expires_at)
    values (encode(extensions.digest(v_token, 'sha256'), 'hex'), 'teacher', v_teacher.id, now() + interval '8 hours');
  return jsonb_build_object('token', v_token, 'must_change_password', v_teacher.must_change_password);
end;
$$;

create or replace function public.rma_teacher_change_password(p_token text, p_new_password text)
returns boolean language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare v_teacher_id uuid;
begin
  if length(coalesce(p_new_password, '')) < 12 then raise exception 'Use at least 12 characters for the new teacher password.' using errcode = '22023'; end if;
  select teacher_id into v_teacher_id from public.rma_auth_sessions
   where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
     and role = 'teacher' and expires_at > now();
  if v_teacher_id is null then raise exception 'Teacher session expired. Sign in again.' using errcode = '28000'; end if;
  update public.rma_teacher_accounts set password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
      must_change_password = false where id = v_teacher_id;
  return true;
end;
$$;

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
      'attempt_number', coalesce(latest.attempt_number, 0), 'is_complete', latest.is_complete,
      'attempts', coalesce(tally.attempts, 0))
      order by st.grade, st.section, st.last_name, st.first_name)
    from public.rma_students st
    left join lateral (select sc.score, sc.duration, sc.rma_data, sc.bank_data, sc.created_at,
        sc.attempt_number, sc.is_complete
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

revoke all on function public.rma_teacher_suggestions(text) from public;
revoke all on function public.rma_student_register(smallint,text,text,text,text,text,text,text) from public;
revoke all on function public.rma_student_login(text,text,smallint) from public;
revoke all on function public.rma_submit_score(text,smallint,integer,text,text,text,integer,text,text) from public;
revoke all on function public.rma_report_violation(text,smallint,text,text) from public;
revoke all on function public.rma_teacher_login(text,text) from public;
revoke all on function public.rma_teacher_change_password(text,text) from public;
revoke all on function public.rma_teacher_dashboard(text) from public;
revoke all on function public.rma_teacher_profile(text) from public;
revoke all on function public.rma_set_attempt_complete(text, text, boolean) from public;
grant execute on function public.rma_teacher_suggestions(text) to anon, authenticated;
grant execute on function public.rma_student_register(smallint,text,text,text,text,text,text,text) to anon, authenticated;
grant execute on function public.rma_student_login(text,text,smallint) to anon, authenticated;
grant execute on function public.rma_submit_score(text,smallint,integer,text,text,text,integer,text,text) to anon, authenticated;
grant execute on function public.rma_report_violation(text,smallint,text,text) to anon, authenticated;
grant execute on function public.rma_teacher_login(text,text) to anon, authenticated;
grant execute on function public.rma_teacher_change_password(text,text) to anon, authenticated;
grant execute on function public.rma_teacher_dashboard(text) to anon, authenticated;
grant execute on function public.rma_teacher_profile(text) to anon, authenticated;
grant execute on function public.rma_set_attempt_complete(text, text, boolean) to anon, authenticated;

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

  return query
  select row_number() over (order by sc.score desc, sc.duration_seconds asc nulls last, sc.created_at asc),
         coalesce(nullif(sc.student_code, ''),
                  concat_ws(' ', nullif(sv.first_name, ''), sv.last_name)),
         sc.score, sc.duration, sc.duration_seconds, sc.created_at
    from public.rma_scores sc
    left join public.rma_students sv on sv.id = sc.student_id
   where sc.grade = v_student.grade
     and lower(trim(sc.section)) = lower(trim(v_student.section))
   order by sc.score desc, sc.duration_seconds asc nulls last, sc.created_at asc
   limit v_limit;
end;
$$;

revoke all on function public.rma_leaderboard_top(text, integer) from public;
grant execute on function public.rma_leaderboard_top(text, integer) to anon, authenticated;

notify pgrst, 'reload schema';

-- PHASE 1: Configurable Score Bands


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
  select jsonb_agg(
    jsonb_build_object(
      'band_name', band_name,
      'min_score', min_score,
      'max_score', max_score,
      'label', label,
      'color', color,
      'icon', icon,
      'sort_order', sort_order
    )
  ) from public.rma_score_bands order by sort_order;
$$;

grant execute on function public.rma_get_score_bands() to anon, authenticated;

-- Removed: rma_section_comparison(p_grade smallint).
-- It aggregated rma_students and rma_scores into per-section counts and averages
-- and was granted to anon, so anyone could enumerate enrolment and mean scores for
-- every section in a grade. No client code called it, so it was attack surface with
-- no benefit. Teachers get the same picture from rma_teacher_dashboard(p_token),
-- which requires a session. Drop it in case an older deploy created it.
revoke all on function public.rma_section_comparison(smallint) from public, anon, authenticated;
drop function if exists public.rma_section_comparison(smallint);
