-- PRIVATE ONE-TIME SETUP. Run after schema.sql in the Supabase SQL Editor.
-- Shared teacher account: username=teacher123, password=moonwalk123
-- This account is configured to NOT require password change on first login.
insert into public.rma_teacher_accounts (username, password_hash, must_change_password)
values ('teacher123', extensions.crypt('moonwalk123', extensions.gen_salt('bf')), false)
on conflict (username) do nothing;
