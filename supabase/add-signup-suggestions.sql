-- Suggestions while a student signs up: sections, and teacher names by surname or
-- first name.
--
-- Run once in the Supabase SQL Editor. Safe to run twice. The pages fall back to a
-- plain text input when these are missing, so nothing breaks before this runs.
--
-- Two problems this fixes:
--
-- 1. rma_teacher_suggestions only ever returned teacher FIRST names. The surname
--    box called the same function, so it was filled with first names. It now takes
--    a kind and returns the right column.
--
-- 2. Both are scoped by the grade the page is showing. A student on the Grade 8
--    assessment can only discover names and sections that actually exist for
--    Grade 8, rather than the whole school's teaching staff.
--
-- <datalist> is also unreliable on phones, so the pages draw their own popup.
-- These functions just supply the matches.
begin;

drop function if exists public.rma_teacher_suggestions(text);
drop function if exists public.rma_teacher_suggestions(text, text, smallint);

-- p_kind is 'last' or 'first'.
create or replace function public.rma_teacher_suggestions(p_kind text, p_prefix text, p_grade smallint default null)
returns text[] language sql stable security definer
set search_path = public, extensions, pg_temp
as $$
  select coalesce(array_agg(s.name order by s.name), '{}'::text[])
    from (
      select distinct
        case when lower(coalesce(p_kind, 'first')) = 'last'
          then s.teacher_last_name else s.teacher_first_name end as name
      from public.rma_students s
      where case when lower(coalesce(p_kind, 'first')) = 'last'
              then s.teacher_last_name else s.teacher_first_name end
            ilike left(coalesce(p_prefix, ''), 40) || '%'
        and (p_grade is null or s.grade = p_grade)
      order by name
      limit 8
    ) s
    where s.name <> '';
$$;

create or replace function public.rma_section_suggestions(p_grade smallint, p_prefix text)
returns text[] language sql stable security definer
set search_path = public, extensions, pg_temp
as $$
  select coalesce(array_agg(s.section order by s.section), '{}'::text[])
    from (
      select distinct section from public.rma_students
       where section ilike left(coalesce(p_prefix, ''), 60) || '%'
         and (p_grade is null or grade = p_grade)
         and section <> ''
       order by section
       limit 12
    ) s;
$$;

revoke all on function public.rma_teacher_suggestions(text, text, smallint) from public;
revoke all on function public.rma_section_suggestions(smallint, text) from public;
grant execute on function public.rma_teacher_suggestions(text, text, smallint) to anon, authenticated;
grant execute on function public.rma_section_suggestions(smallint, text) to anon, authenticated;

commit;