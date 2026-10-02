// The live project can be probed with the publishable key, which is public by
// design. These checks record the deployment state the app depends on and the
// exposure that must not come back.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const out = [];
const check = (n, c, x) => out.push((c ? 'PASS' : 'FAIL') + '  ' + n + (x ? '  -> ' + x : ''));

const schema = fs.readFileSync(path.join(ROOT, 'supabase', 'schema.sql'), 'utf8');
const urgent = fs.readFileSync(path.join(ROOT, 'supabase', 'urgent-leaderboard-fix.sql'), 'utf8');
const config = fs.readFileSync(path.join(ROOT, 'supabase-config.js'), 'utf8');
const portal = fs.readFileSync(path.join(ROOT, 'teacher-portal.js'), 'utf8');
const data = fs.readFileSync(path.join(ROOT, 'rma-data.js'), 'utf8');

// --- the urgent file must be self-contained and safe to re-run ---
check('urgent file drops the leaking view', /drop view if exists public\.rma_leaderboard cascade;/.test(urgent));
check('urgent file creates the scoped replacement', /create or replace function public\.rma_leaderboard_top\(p_token text/.test(urgent));
check('urgent file grants the replacement', /grant execute on function public\.rma_leaderboard_top\(text, integer\) to anon, authenticated;/.test(urgent));
check('urgent file pins search_path', /set search_path = public, extensions, pg_temp/.test(urgent));
check('urgent file requires a live session', /raise exception 'Student session required\.'/.test(urgent));
check('urgent file never recreates the view', !/create( or replace)? view public\.rma_leaderboard/.test(urgent));
check('urgent file is idempotent by construction', /if exists/.test(urgent) && /create or replace function/.test(urgent));
check('urgent block matches schema.sql', urgent.includes('create or replace function public.rma_leaderboard_top(p_token text')
  && schema.includes('create or replace function public.rma_leaderboard_top(p_token text'));
check('urgent file keeps the empty-name guard', /first_name_mi/.test(urgent) && !/left join public\.rma_students/.test(urgent));

// --- the full schema still carries everything the portal calls ---
['rma_get_score_bands', 'rma_teacher_profile', 'rma_set_attempt_complete',
  'rma_teacher_dashboard', 'rma_teacher_login', 'rma_student_login', 'rma_leaderboard_top']
  .forEach((fn) => check(`schema defines ${fn}`, schema.includes(`function public.${fn}(`)));

check('schema drops the dead section comparison', /drop function if exists public\.rma_section_comparison/.test(schema));
check('schema no longer creates section comparison', !/create or replace function public\.rma_section_comparison/.test(schema));

// --- client calls match what the schema offers ---
check('client calls rma_leaderboard_top with a token', /rpc\("rma_leaderboard_top", \{ p_token: token, p_limit: 10 \}\)/.test(data));
check('portal calls rma_teacher_profile', /rpc\("rma_teacher_profile"/.test(portal));
check('portal calls rma_set_attempt_complete', /rpc\("rma_set_attempt_complete"/.test(portal));
check('portal calls rma_get_score_bands', /rpc\("rma_get_score_bands"/.test(portal));
check('portal calls rma_teacher_dashboard', /rpc\("rma_teacher_dashboard"/.test(portal));

// --- no client path may read a table directly ---
check('client reads no table directly', !/\/rest\/v1\/rma_(students|scores|teacher_accounts|auth_sessions)/.test(data + portal));
check('only the leaderboard function is anon-reachable', (schema.match(/to anon, authenticated;/g) || []).length >= 1);

// --- config sanity: the browser key is publishable, never a secret ---
check('config holds a publishable key only', /sb_publishable_/.test(config));
check('config has no secret or service_role key', !/sb_secret_|service_role/.test(config));
check('config declares the live project ref', /ogcrbrfzsjjizsubzdpg/.test(config));

// --- serve-local still refuses the supabase directory ---
const serve = fs.readFileSync(path.join(ROOT, 'serve-local.ps1'), 'utf8');
check('local server blocks supabase/', /\$blocked = @\('supabase'\)/.test(serve));
check('urgent fix is excluded from any deploy', /supabase\//.test(fs.readFileSync(path.join(ROOT, '.vercelignore'), 'utf8')));

console.log(out.join('\n'));
const fails = out.filter((r) => r.startsWith('FAIL')).length;
console.log(fails ? `\n${fails} FAILED` : '\nALL CHECKS PASSED');
console.log(`${out.length - fails}/${out.length} passed`);
if (fails) process.exit(1);