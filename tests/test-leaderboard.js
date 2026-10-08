// Structural checks on the teacher leaderboard RPC. There is no local Postgres,
// so these catch the mistakes that have actually bitten this file: unbalanced
// dollar quotes, a grant or revoke that does not match its signature, and a
// function reachable by anon.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const out = [];
const check = (n, c, x) => out.push((c ? 'PASS' : 'FAIL') + '  ' + n + (x ? '  -> ' + x : ''));

const files = fs.readdirSync(path.join(ROOT, 'supabase')).filter((f) => f.endsWith('.sql'));
files.forEach((f) => {
  const sql = fs.readFileSync(path.join(ROOT, 'supabase', f), 'utf8');
  const dd = (sql.match(/\$\$/g) || []).length;
  check(`${f} dollar quotes balanced`, dd % 2 === 0, dd + ' markers');
  check(`${f} no bare "from ... order by" on an aggregate`,
    !/\)\s*from\s+[a-z_][\w.]*\s+order\s+by/i.test(sql));
});

const schema = fs.readFileSync(path.join(ROOT, 'supabase', 'schema.sql'), 'utf8');

const SIG = 'text, smallint, text, integer';
check('leaderboard RPC is defined',
  /create or replace function public\.rma_teacher_leaderboard\(\s*p_token text,\s*p_grade smallint default null,\s*p_section text default null,\s*p_limit integer default 10\s*\)/s.test(schema));
check('grant matches the real signature',
  schema.includes(`grant execute on function public.rma_teacher_leaderboard(${SIG}) to authenticated;`));
check('revoke matches the real signature',
  schema.includes(`revoke all on function public.rma_teacher_leaderboard(${SIG}) from public;`));
check('leaderboard is NOT reachable by anon',
  !/rma_teacher_leaderboard\([^)]*\)\s+to\s+anon/.test(schema));
check('leaderboard is security definer', /rma_teacher_leaderboard\([\s\S]{0,400}?security definer/.test(schema));
check('leaderboard pins search_path', /rma_teacher_leaderboard\([\s\S]{0,400}?set search_path = public, extensions, pg_temp/.test(schema));

// Session handling must match the other teacher RPCs.
check('leaderboard rejects a missing teacher session',
  /rma_teacher_leaderboard[\s\S]*?Teacher session expired\./.test(schema));
check('leaderboard blocks until the password is changed',
  /rma_teacher_leaderboard[\s\S]*?must_change_password then/.test(schema));

// Scope: resolved once, then both lists read that same array, so "live" and
// "all time" can never disagree about who is visible.
check('scope is resolved once into an array',
  /v_scope uuid\[\] := '\{\}'::uuid\[\]/.test(schema) &&
  (schema.match(/select coalesce\(array_agg\(st\.id\), '\{\}'::uuid\[\]\) into v_scope/) || []).length === 1);
check('both lists filter on the same scope array',
  (schema.match(/sc\.student_id = any\(v_scope\)/g) || []).length === 2);
check('teacher scope predicate is applied to the scope query',
  /into v_scope[\s\S]{0,400}?v_teacher\.see_all_sections/.test(schema));
check('grade filter is optional', /p_grade is null or st\.grade = p_grade/.test(schema));
check('section filter is optional', /p_section is null or lower\(btrim\(st\.section\)\) = lower\(btrim\(p_section\)\)/.test(schema));

// Leaderboard semantics.
// Split the function into its two per_student CTEs rather than counting
// characters between clauses, which is brittle against reformatting. The CTE
// ends at the line before the jsonb_agg that consumes it.
const fnBody = (schema.match(/create or replace function public\.rma_teacher_leaderboard\([\s\S]*?\n\$\$;/) || [''])[0];
const ctes = [...fnBody.matchAll(/with per_student as \(([\s\S]*?)\)\s*\n\s*select coalesce\(jsonb_agg/g)]
  .map((m) => m[1]);
check('the leaderboard builds exactly two per-student CTEs', ctes.length === 2, String(ctes.length));
const liveCte = ctes[0] || '';
const allTimeCte = ctes[1] || '';
check('live takes the latest attempt per student',
  /distinct on \(sc\.student_id\)/.test(liveCte) && /order by sc\.student_id, sc\.created_at desc/.test(liveCte),
  liveCte.replace(/\s+/g, ' ').slice(-70));
check('all time takes the personal best per student',
  /distinct on \(sc\.student_id\)/.test(allTimeCte) && /order by sc\.student_id, sc\.score desc/.test(allTimeCte),
  allTimeCte.replace(/\s+/g, ' ').slice(-70));
check('live is not ranked by score, all time is',
  !/order by sc\.student_id, sc\.score desc/.test(liveCte) && /sc\.score desc/.test(allTimeCte));
check('both return rank and attempts',
  (fnBody.match(/row_number\(\) over \(order by ps\.score desc/g) || []).length === 2 &&
  (fnBody.match(/as attempts/g) || []).length >= 2);
check('unfinished attempts are excluded from both',
  (fnBody.match(/coalesce\(sc\.is_complete, true\)/g) || []).length === 2);
check('null scores are excluded from both',
  (fnBody.match(/and sc\.score is not null/g) || []).length === 2);
check('result is a jsonb object with both lists',
  /return jsonb_build_object\('live', v_live, 'all_time', v_all_time\);/.test(schema));
check('limit is clamped', /greatest\(1, least\(coalesce\(p_limit, 10\), 100\)\)/.test(schema));

// The client must call what the schema offers.
const portal = fs.readFileSync(path.join(ROOT, 'teacher-portal.js'), 'utf8');
const studentPortal = fs.readFileSync(path.join(ROOT, 'rma-student-leaderboard.js'), 'utf8');
check('student leaderboard shows elapsed time with seconds fallback',
  /duration\(entry\.duration, entry\.duration_seconds\)/.test(studentPortal));
[
  'FINAL GRADE 7 RMA/G7 RMA1 V1.html',
  'RMA G8 V2/G8 RMA V5.html',
  'RMA G9 V1/rmag9 v3.html',
  'RMA G10 V1/g10rma v4.html',
].forEach((file) => {
  const page = fs.readFileSync(path.join(ROOT, file), 'utf8');
  check(`${path.basename(file)} labels elapsed leaderboard time`, /<th>Time elapsed<\/th>/.test(page));
});
check('portal calls the leaderboard RPC',
  /rpc\("rma_teacher_leaderboard"/.test(portal));
check('portal sends grade, section and limit',
  /p_grade:[\s\S]{0,120}?p_section:[\s\S]{0,120}?p_limit:/.test(portal));
['live', 'all_time'].forEach((k) => check(`portal renders the ${k} list`,
  new RegExp(`\\b${k}\\b`).test(portal)));
check('portal escapes leaderboard names and codes',
  /escapeHtml\((?:row|entry|lb)\.(?:name|student_code)\)/.test(portal));

// The card used to print the raw driver message, so a half-applied deploy put
// "Could not find the function public.rma_teacher_leaderboard(...) in the schema
// cache" in front of a teacher. The failure has to read as an instruction for
// the person who can fix it, not as Postgres internals.
const lbBody = (portal.match(/async function loadLeaderboards\(\) \{([\s\S]*?)\n  \}/) || [])[1] || '';
check('leaderboard card never prints error.message directly',
  lbBody.length > 0 && !/escapeHtml\(error\.message\)/.test(lbBody)
  && !/\$\{error\.message \|\|/.test(lbBody));
check('leaderboard routes failures through friendlyError',
  /friendlyError\(error,/.test(lbBody));
check('friendlyError has a message for a missing function',
  /schema cache\|PGRST202/.test(portal) && /database setup needs to be finished/.test(portal));
check('friendlyError has a message for a dropped connection',
  /failed to fetch/i.test(portal));
check('friendlyError falls back rather than showing raw text',
  /return hit \? hit\.message : fallback;/.test(portal));
check('the raw driver text is still logged for whoever deploys',
  /console\.warn\("\[rma\] leaderboard request failed:/.test(portal));
check('an expired session ends the portal, not just the card',
  /endSessionIfExpired\(error\)/.test(lbBody)
  && /function endSessionIfExpired/.test(portal)
  && /sessionStorage\.removeItem\("rma_teacher_token"\)/.test(portal));
check('the stale scope note is cleared when the card errors',
  /leaderboardNote[\s\S]{0,80}?\.textContent = ""/.test(lbBody));

// Every page that ships the teacher UI also needs a deploy file the operator
// can paste, because the CLI cannot reach the project.
const deploy = path.join(ROOT, 'supabase', 'apply-leaderboard.sql');
check('apply-leaderboard.sql exists', fs.existsSync(deploy));
if (fs.existsSync(deploy)) {
  const d = fs.readFileSync(deploy, 'utf8');
  check('deploy file defines the RPC',
    /create or replace function public\.rma_teacher_leaderboard\(/.test(d));
  check('deploy file carries the grant',
    d.includes(`grant execute on function public.rma_teacher_leaderboard(${SIG}) to authenticated;`));
  check('deploy file has no anon grant',
    !/rma_teacher_leaderboard\([^)]*\)\s+to\s+anon/.test(d));
  const lines = d.split('\n').map((l) => l.trim())
    .filter((l) => l && !l.startsWith('--') && !/^\$\$$/.test(l) && !/^[$a-z ]+\$\$$/.test(l));
  const orphans = lines.filter((l) => !schema.includes(l));
  check('every statement comes from schema.sql', orphans.length === 0,
    orphans.slice(0, 2).join(' | '));
}

console.log(out.join('\n'));
const fails = out.filter((r) => r.startsWith('FAIL')).length;
console.log(fails ? `\n${fails} FAILED (${out.length - fails}/${out.length} passed)`
  : `\nALL CHECKS PASSED (${out.length})`);
if (fails) process.exit(1);
