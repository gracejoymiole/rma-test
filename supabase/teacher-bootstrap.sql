-- PRIVATE ONE-TIME SETUP. Run after schema.sql in the Supabase SQL Editor.
--
-- This script no longer contains a usable credential. Set the password yourself:
--
--   \set teacher_password 'choose-a-strong-password'
--   \i supabase/teacher-bootstrap.sql
--
-- or paste a literal into rma_bootstrap_teacher_password below before running.
--
-- Earlier revisions of this file shipped a shared password in plaintext and set
-- must_change_password = false. That account must be rotated in the Supabase
-- dashboard and this history rewritten before the project is shared, because the
-- old password remains readable in every existing git commit.
do $$
declare
  v_password text := nullif(current_setting('rma_bootstrap_teacher_password', true), '');
  v_username text := coalesce(nullif(current_setting('rma_bootstrap_teacher_username', true), ''), 'teacher123');
begin
  if v_password is null or length(v_password) < 12 then
    raise exception 'Set rma_bootstrap_teacher_password to at least 12 characters before running this script.';
  end if;

  insert into public.rma_teacher_accounts (username, password_hash, must_change_password)
  values (v_username, extensions.crypt(v_password, extensions.gen_salt('bf')), true)
  on conflict (username) do update
    set password_hash = excluded.password_hash,
        must_change_password = true;
end;
$$;