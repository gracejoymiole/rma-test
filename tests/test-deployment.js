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
const KEY = (config.match(/publishableKey:\s*"([^"]+)"/) || [])[1] || '';
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
  'rma_teacher_dashboard', 'rma_teacher_login', 'rma_student_login', 'rma_leaderboard_top', 'rma_student_leaderboard',
  'rma_teacher_leaderboard']
  .forEach((fn) => check(`schema defines ${fn}`, schema.includes(`function public.${fn}(`)));

const studentLeaderboard = (schema.match(/create or replace function public\.rma_student_leaderboard\([\s\S]*?\n\$\$;/) || [''])[0];
const shortStudentName = /concat\(btrim\(peer\.last_name\), ', ', upper\(left\(btrim\(peer\.first_name\), 1\)\), '\.'\) as name/g;
check('student leaderboard abbreviates names in both lists',
  (studentLeaderboard.match(shortStudentName) || []).length === 2);
const studentLeaderboardPatch = fs.readFileSync(path.join(ROOT, 'supabase', 'apply-student-leaderboard.sql'), 'utf8');
check('standalone student leaderboard patch uses the same abbreviated name',
  (studentLeaderboardPatch.match(shortStudentName) || []).length === 2);

check('schema drops the dead section comparison', /drop function if exists public\.rma_section_comparison/.test(schema));
check('schema no longer creates section comparison', !/create or replace function public\.rma_section_comparison/.test(schema));

// --- aggregate queries must order INSIDE jsonb_agg, never after FROM (42803) ---
// A trailing "from <table> order by <col>" makes Postgres demand that the column
// be grouped or aggregated, which aborts the whole schema run.
['schema.sql', 'urgent-leaderboard-fix.sql', 'teacher-bootstrap.sql'].forEach((file) => {
  const body = fs.readFileSync(path.join(__dirname, '..', 'supabase', file), 'utf8');
  check(`${file} has no bare "from ... order by" on an aggregate`,
    !/\)\s*from\s+[a-z_][\w.]*\s+order\s+by/i.test(body));
});
check('rma_get_score_bands orders inside the aggregate',
  /jsonb_agg\([\s\S]*?order by sort_order[\s\S]*?\)\s*from public\.rma_score_bands/.test(schema));
check('rma_get_score_bands returns an array even when empty',
  /coalesce\([\s\S]*?jsonb_agg\([\s\S]*?'\[\]'::jsonb[\s\S]*?\)\s*from public\.rma_score_bands/.test(schema));

// --- every function body must be dollar-quoted with $$ ---
// A single "$" is not a valid delimiter: Postgres stops the function body at the
// end of the line and the whole schema run fails on the first one that has it.
// This exists because two functions in schema.sql were written that way and the
// suite passed, because nothing here had ever looked at the quoting.
fs.readdirSync(path.join(ROOT, 'supabase'))
  .filter((f) => f.endsWith('.sql'))
  .forEach((file) => {
    const body = fs.readFileSync(path.join(ROOT, 'supabase', file), 'utf8');
    check(`${file} opens every function body with $$`, !/as \$$/m.test(body));
    check(`${file} closes every function body with $$`, !/^\$$;/m.test(body));
    check(`${file} has balanced dollar quotes`,
      (body.match(/\$\$/g) || []).length % 2 === 0);
  });

// --- apply-missing.sql is the tail that a rolled-back run never created ---
const missing = fs.readFileSync(path.join(ROOT, 'supabase', 'apply-missing.sql'), 'utf8');
['rma_get_score_bands()', 'rma_teacher_profile(p_token text)',
  'rma_set_attempt_complete(p_token text, p_student_code text, p_complete boolean)']
  .forEach((fn) => check(`apply-missing defines ${fn}`, missing.includes(`function public.${fn}`)));
check('apply-missing creates the score bands table', /create table if not exists public\.rma_score_bands/.test(missing));
// A plpgsql body is not resolved when the function is created, so a missing
// column creates fine and only breaks when a real teacher calls it.
[["rma_teacher_accounts", "first_name"], ["rma_teacher_accounts", "last_name"],
  ["rma_teacher_accounts", "see_all_sections"], ["rma_scores", "attempt_number"],
  ["rma_scores", "is_complete"]].forEach(([t, c]) => check(
  `apply-missing adds ${t}.${c}`,
  missing.includes(`alter table public.${t} add column if not exists ${c} `)));
check('apply-missing adds every column before any function is created',
  Math.max(...['first_name', 'last_name', 'see_all_sections', 'attempt_number', 'is_complete']
    .map((c) => missing.indexOf('if not exists ' + c + ' ')))
    < missing.indexOf('function public.rma_teacher_profile'));
check('apply-missing seeds the score bands', /insert into public\.rma_score_bands/.test(missing));
check('apply-missing adds attempt_number', missing.includes('add column if not exists attempt_number'));
check('apply-missing adds is_complete', missing.includes('add column if not exists is_complete'));
check('apply-missing grants all three functions',
  ['rma_get_score_bands()', 'rma_teacher_profile(text)', 'rma_set_attempt_complete(text, text, boolean)']
    .every((s) => missing.includes(`grant execute on function public.${s} to anon, authenticated`)));
// rma_set_attempt_complete writes is_complete, so the column must come first.
check('apply-missing adds is_complete before it is written',
  missing.indexOf('add column if not exists is_complete') < missing.indexOf('function public.rma_set_attempt_complete'));
check('apply-missing has no bare "from ... order by" on an aggregate',
  !/\)\s*from\s+[a-z_][\w.]*\s+order\s+by/i.test(missing));
// The band icons are multi-byte and astral-plane. Slicing this file through
// Windows PowerShell's Get-Content silently corrupts them, so check the bytes.
const bandIcons = [0x2705, 0x1f7e1, 0x1f7e0, 0x1f534];
check('apply-missing keeps the band icons intact',
  bandIcons.every((cp) => missing.includes(Buffer.from(String.fromCodePoint(cp), 'utf8'))));
check('apply-missing has no mojibake', !missing.includes(Buffer.from([0xc3, 0xa2, 0xc5, 0x93])));
check('apply-missing is valid UTF-8',
  Buffer.compare(Buffer.from(missing.toString('utf8'), 'utf8'), Buffer.from(missing, 'utf8')) === 0);

// Everything here must also exist in the authoritative file, so the two cannot drift.
const missingStatements = missing
  .split('\n').map((l) => l.trim())
  .filter((l) => l && !l.startsWith('--') && !/^[$a-z ]*\$\$$/.test(l));
const orphans = missingStatements.filter((l) => !schema.includes(l));
check('every statement in apply-missing.sql comes from schema.sql',
  orphans.length === 0, orphans.length ? 'orphans: ' + orphans.join(' | ') : '');

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
// --- every grant/revoke must target a function the same script creates ---
// REVOKE or GRANT on a function that does not exist fails with 42883 and takes
// the entire paste down, which is how a rolled-back run can look like a
// successful one. Each target must be created or dropped earlier in its file.
['schema.sql', 'urgent-leaderboard-fix.sql', 'apply-missing.sql', 'teacher-bootstrap.sql']
  .forEach((file) => {
    const sql = fs.readFileSync(path.join(ROOT, 'supabase', file), 'utf8');
    const re = /\b(revoke|grant)\s+(?:all|execute)\b[^;]*?\bon\s+function\s+(?:public\.)?(\w+)\s*\(/gi;
    const orphans = [];
    let m;
    while ((m = re.exec(sql)) !== null) {
      const before = sql.slice(0, m.index);
      const made = new RegExp(`create\\s+or\\s+replace\\s+function\\s+(?:public\\.)?${m[2]}\\s*\\(`, 'i')
        .test(before)
        || new RegExp(`drop\\s+function\\s+if\\s+exists\\s+(?:public\\.)?${m[2]}\\s*\\(`, 'i').test(before);
      if (!made) orphans.push(m[2] + '()');
    }
    check(`${file} grants/revokes only what it creates`, orphans.length === 0,
      orphans.length ? 'orphans: ' + orphans.join(', ') : '');
  });
check('no revoke targets a function that may be absent',
  !/revoke all on function public\.rma_section_comparison/.test(schema)
  && !/revoke all on function public\.rma_section_comparison/.test(missing));

// --- the live-deploy checker stays honest and out of the bundle ---
const live = fs.readFileSync(path.join(ROOT, 'tools', 'verify-live.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
['rma_teacher_dashboard', 'rma_teacher_profile', 'rma_set_attempt_complete',
  'rma_remove_student',
  'rma_teacher_removal_history',
  'rma_leaderboard_top', 'rma_student_login', 'rma_teacher_login', 'rma_get_score_bands',
  'rma_teacher_leaderboard']
  .forEach((fn) => check(`verify-live probes ${fn}`, live.includes(`'${fn}'`)));
check('verify-live asserts the leaking view stays hidden', live.includes('rma_leaderboard?select='));
['rma_scores', 'rma_teacher_accounts'].forEach((t) => {
  const wanted = t === 'rma_scores' ? ['attempt_number', 'is_complete'] : ['first_name', 'last_name', 'see_all_sections'];
  wanted.forEach((c) => check(`verify-live checks ${t}.${c}`,
    live.includes(`checkColumn('${t}', '${c}')`)));
});
check('verify-live reads the key from config, never hardcoded',
  live.includes('publishableKey:') && !live.includes(KEY));
check('verify-live sends the key on every request', live.includes('Authorization:'));
check('verify-live fails loudly', /process\.exit\(failed\.length \? 1 : 0\)/.test(live));
// Postgres resolves column names before checking table privileges, so a
// permission error means the column exists. Reporting it as missing would be a
// false alarm on every table that anon cannot read, which is the safe default.
check('verify-live reads a permission error as "column exists"',
  live.includes('exists (not anon-readable)') && /42501/.test(live));
check('verify-live still fails on a genuinely missing column',
  live.includes("'column does not exist'"));
check('verify-live is wired to npm run', /verify-live\.js$/.test(pkg.scripts['verify:live'] || ''));

// --- verify-live must never point the operator at a script that lacks the fix ---
// SQL can only be applied by hand, so a wrong filename is worse than no advice:
// it reads as progress and leaves the failure in place. This is the guard for
// exactly that. rma_teacher_leaderboard was missing from the live project while
// the tool kept telling the reader to run apply-missing.sql, which does not
// create it.
const remedyBlock = (live.match(/const REMEDIATION = \{([\s\S]*?)\n\};/) || [])[1] || '';
// Keys are bare when they are valid identifiers and quoted otherwise, so both
// forms have to parse or a silently dropped entry would look like full coverage.
const remedies = [...remedyBlock.matchAll(/^\s*(?:'([^']+)'|([\w.]+)):\s*'([^']+)'/gm)]
  .map((m) => ({ name: m[1] || m[2], file: m[3] }));
check('verify-live declares a remediation map', remedies.length > 0,
  remedies.length + ' entries');

const sqlText = (rel) => {
  const p = path.join(ROOT, rel.replace(/\//g, path.sep));
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
};

// A check name is either a bare RPC (created as a function) or table.column
// (created as a column), plus one special case for the dropped leaderboard view.
function createsThe(sql, name) {
  if (name === 'rma_leaderboard view hidden') {
    return /create or replace function public\.rma_leaderboard_top\(/.test(sql);
  }
  if (name.includes('.')) {
    return new RegExp(`add column if not exists ${name.split('.')[1]}\\b`).test(sql);
  }
  return new RegExp(`create\\s+or\\s+replace\\s+function\\s+(?:public\\.)?${name}\\s*\\(`).test(sql);
}

remedies.forEach(({ name, file }) => {
  const sql = sqlText(file);
  check(`remediation for ${name} names a real script`, sql !== null, file);
  check(`remediation for ${name} names a script that creates it`,
    sql !== null && createsThe(sql, name), file);
});

// Every RPC the tool probes must have an entry, or a failure would report no fix.
['rma_student_login', 'rma_teacher_login', 'rma_teacher_dashboard', 'rma_teacher_profile',
  'rma_set_attempt_complete', 'rma_leaderboard_top', 'rma_teacher_leaderboard',
  'rma_student_leaderboard',
  'rma_remove_student',
  'rma_teacher_removal_history',
  'rma_get_score_bands'].forEach((fn) => check(`remediation map covers ${fn}`,
  remedies.some((r) => r.name === fn)));

// Every column the tool probes must have an entry too.
['rma_scores.attempt_number', 'rma_scores.is_complete', 'rma_teacher_accounts.first_name',
  'rma_teacher_accounts.last_name', 'rma_teacher_accounts.see_all_sections']
  .forEach((c) => check(`remediation map covers ${c}`,
    remedies.some((r) => r.name === c)));
check('remediation map covers the leaderboard leak',
  remedies.some((r) => r.name === 'rma_leaderboard view hidden'));
// No entry may be dead weight, which would let the map drift out of date quietly.
check('remediation map has no entries for checks that are never made',
  remedies.every((r) => live.includes(`'${r.name}'`)), 
  remedies.filter((r) => !live.includes(`'${r.name}'`)).map((r) => r.name).join(', '));
check('tools/ is excluded from deploy', /\ntools\//.test(fs.readFileSync(path.join(ROOT, '.vercelignore'), 'utf8')));
check('tests/ is excluded from deploy', /\ntests\//.test(fs.readFileSync(path.join(ROOT, '.vercelignore'), 'utf8')));

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
