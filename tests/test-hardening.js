const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const portal = fs.readFileSync(ROOT + '/teacher-portal.js', 'utf8');
const data = fs.readFileSync(ROOT + '/rma-data.js', 'utf8');
const schema = fs.readFileSync(ROOT + '/supabase/schema.sql', 'utf8');
const serve = fs.readFileSync(ROOT + '/serve-local.ps1', 'utf8');
const vercel = fs.readFileSync(ROOT + '/.vercelignore', 'utf8');
const boot = fs.readFileSync(ROOT + '/supabase/teacher-bootstrap.sql', 'utf8');
const gradePages = [
  'FINAL GRADE 7 RMA/G7 RMA1 V1.html',
  'RMA G8 V2/G8 RMA V5.html',
  'RMA G9 V1/rmag9 v3.html',
  'RMA G10 V1/g10rma v4.html'
].map((f) => fs.readFileSync(ROOT + '/' + f, 'utf8'));

const out = [];
const check = (n, c, x) => out.push((c ? 'PASS' : 'FAIL') + '  ' + n + (x ? '  -> ' + x : ''));

// ---- 1. leaderboard exposure closed ----
check('rma_leaderboard view is dropped', /drop view if exists public\.rma_leaderboard cascade/.test(schema));
check('no select grant on rma_scores remains', !/grant select on public\.rma_scores/.test(schema));
check('leaderboard view is not recreated anywhere', !/create( or replace)? view public\.rma_leaderboard/.test(schema));
check('leaderboard moved to a definer function', /create or replace function public\.rma_leaderboard_top\(p_token text/.test(schema));
check('leaderboard function is security definer', /rma_leaderboard_top\(p_token text, p_limit integer default 10\)\s*returns table[\s\S]{0,400}?security definer/.test(schema));
check('leaderboard pins search_path', /rma_leaderboard_top[\s\S]*?set search_path = public, extensions, pg_temp/.test(schema));
check('leaderboard requires a live student session', /raise exception 'Student session required\.'[\s\S]{0,200}?28000/.test(schema));
check('leaderboard derives scope from the session', /sc\.grade = v_student\.grade[\s\S]{0,120}?lower\(btrim\(sc\.section\)\) = lower\(btrim\(v_student\.section\)\)/.test(schema));
check('leaderboard takes no caller-supplied grade', !/rma_leaderboard_top\(p_token text, p_limit integer default 10\)[\s\S]{0,300}?p_grade/.test(schema));
check('leaderboard has no plain select on the results table', !/grant select on public\.rma_leaderboard/.test(schema));

// --- leaderboard label must never be blank ---
// rma_scores.student_id is `on delete set null`, so joining rma_students for the
// name loses every score from a deleted or unregistered student. The grade pages
// skip entries with a blank name, so that silently emptied the leaderboard.
const lbBody = schema.slice(schema.indexOf('create or replace function public.rma_leaderboard_top'),
  schema.indexOf('revoke all on function public.rma_leaderboard_top'));
check('leaderboard does not join rma_students for the name', !/left join public\.rma_students/.test(lbBody) && !/join public\.rma_students sv/.test(lbBody));
check('leaderboard name reads rma_scores.first_name_mi', /sc\.first_name_mi/.test(lbBody));
check('leaderboard name reads rma_scores.last_name', /sc\.last_name/.test(lbBody));
check('leaderboard prefers student_code when present', /coalesce\(nullif\(btrim\(sc\.student_code\), ''\)/.test(lbBody));
check('leaderboard falls back to a full name, never empty', /nullif\(btrim\(concat_ws\(' ', nullif\(btrim\(sc\.first_name_mi\), ''\), sc\.last_name\)\), ''\)/.test(lbBody));
check('both name columns are NOT NULL on rma_scores',
  /last_name text not null check/.test(schema) && /first_name_mi text not null check/.test(schema));
gradePages.forEach((p, i) => {
  check(`grade page ${i + 1} skips blank names, so the RPC must never return one`,
    /!entry\.name\s*\|\|\s*entry\.name\.trim\(\)\s*===\s*""/.test(p));
});
check('client no longer queries the view directly', !/from\("rma_leaderboard"\)|rma_leaderboard\?/.test(data));
check('client passes the session token', /rpc\("rma_leaderboard_top", \{ p_token: token, p_limit: 10 \}\)/.test(data));
check('client no longer accepts a section arg', /async getLeaderboard\(\)/.test(data) && !/getLeaderboard\(section\)/.test(data));
check('client still returns a name for the UI', /data: list\.map\(\(row, index\)/.test(data));
gradePages.forEach((p, i) => {
  check(`grade page ${i + 1} calls the session-scoped call`, /getLeaderboard\(\)/.test(p) && !/getLeaderboard\(section\)/.test(p));
});
check('leaderboard scope is no longer client-controlled', !/grade: `eq\.\$\{grade\}`[\s\S]{0,60}?section: `eq\.\$\{section\}`/.test(data));

// ---- 2. credential removed from the tree ----
check('bootstrap no longer embeds a password', !/moonwalk1234/.test(boot));
check('bootstrap no longer embeds a username literal', !/values \('teacher123'/.test(boot));
check('bootstrap requires an externally supplied password', /rma_bootstrap_teacher_password/.test(boot));
check('bootstrap enforces a minimum length', /length\(v_password\) < 12/.test(boot));
check('bootstrap forces a password change', /must_change_password = true/.test(boot));
check('bootstrap rotates an existing account', /on conflict \(username\) do update/.test(boot));
check('no plaintext password anywhere in shipped code', !/moonwalk1234/.test(portal + data + schema + serve));
check('no plaintext password in any doc', !['', ...fs.readdirSync(ROOT).filter((f) => f.endsWith('.md')).map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8'))].some((t) => /moonwalk1234|teacher123/.test(t)));

// ---- 8. repo hygiene ----
check('package.json exists with a test script', /"test":\s*"node tests\/run-all\.js"/.test(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')));
check('no default teacher account documented', !/Username\*?\*?:?\s*`?teacher123/.test(['', ...fs.readdirSync(ROOT).filter((f) => f.endsWith('.md')).map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8'))].join('\n')));
const assetsDir = path.join(ROOT, 'assets');
check('shared assets directory exists', fs.existsSync(assetsDir));
check('assets holds one copy per image', fs.existsSync(assetsDir) && fs.readdirSync(assetsDir).filter((f) => /\.(png|jpg|jpeg|gif)$/i.test(f)).length === 16);
const gradeDirs = ['FINAL GRADE 7 RMA', 'RMA G8 V2', 'RMA G9 V1', 'RMA G10 V1'];
check('no grade folder keeps its own image copies', gradeDirs.every((d) => !fs.readdirSync(path.join(ROOT, d)).some((f) => /\.(png|jpg|jpeg|gif)$/i.test(f))));
check('all four grade pages still present', gradeDirs.every((d) => fs.existsSync(path.join(ROOT, d)) && fs.readdirSync(path.join(ROOT, d)).some((f) => f.endsWith('.html'))));
['teacher-portal-backup.js', 'question-map-functions.js', 'rma-grade10-extract.js', 'extract-rma-questions.js', 'student-preview.html', 'teacher-preview.html'].forEach((orphan) => {
  check(`${orphan} removed`, !fs.existsSync(path.join(ROOT, orphan)));
});
check('tests directory is tracked in the repo', fs.existsSync(path.join(ROOT, 'tests', 'run-all.js')));
check('vercelignore excludes supabase/', /supabase\//.test(vercel));
check('bootstrap is not in the deploy set', !/teacher-bootstrap/.test(vercel));

// ---- 3. innerHTML escaping ----
const sinks = [...portal.matchAll(/\.innerHTML\s*=\s*`([\s\S]*?)`/g)];
check('innerHTML sinks found', sinks.length >= 8, String(sinks.length));
const offenders = [];
sinks.forEach((s) => {
  const line = portal.slice(0, s.index).split('\n').length;
  [...s[1].matchAll(/\$\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g)].forEach((m) => {
    const expr = m[1].trim();
    if (/escapeHtml|xmlEscape/.test(expr)) return;
    // numbers, lengths, and static literals are not attacker-controlled
    if (/^\d/.test(expr)) return;
    if (/^[a-zA-Z_$][\w.$]*\.(length|count|total|completed|incomplete|notTaken|completionRate|rank|score|duration_seconds|mode|seen|missed|rate|id)\b/.test(expr)) return;
    if (/\?\s*["'`]|:\s*["'`]/.test(expr) && !/\$\{/.test(expr.replace(/\?\s*["'`][^"'`]*["'`]/g, ''))) return;
    if (/^(learner|student|t|band|topGaps|range|section)\b/.test(expr)) offenders.push(`L${line}: ${expr.replace(/\s+/g, ' ').slice(0, 70)}`);
  });
});
check('no unescaped data reaches innerHTML', offenders.length === 0, offenders.join(' || '));
check('completion header escapes section', /<h3>Grade \$\{escapeHtml\(currentGrade\)\} - \$\{escapeHtml\(currentSection/.test(portal));
check('band label escaped', /\$\{escapeHtml\(band\.label\)\}/.test(portal));
check('band colour escaped', /style="color: \$\{escapeHtml\(band\.color\)\}"/.test(portal));
check('status className escaped', /class="status-badge \$\{escapeHtml\(learner\.status\.className\)\}"/.test(portal));

// ---- 4. filename injection ----
check('export filename is sanitised', /sanitizeFilenamePart\(currentSection\)/.test(portal));
check('sanitiser strips path characters', /replace\(\/\[\^A-Za-z0-9\._-\]\+\/g, "-"\)/.test(portal));
check('sanitiser bounds length and rejects empty', /\.slice\(0, 40\) \|\| "Section"/.test(portal));

// ---- 5. local server ----
check('server blocks the supabase directory', /\$blocked = @\('supabase'\)/.test(serve));
check('blocklist is case-insensitive', /ToLowerInvariant\(\)/.test(serve));
check('server returns 403 for blocked paths', /\$res\.StatusCode = 403/.test(serve));
check('blocking happens before file read', serve.indexOf("$blocked = @('supabase')") < serve.indexOf('Test-Path -LiteralPath $path -PathType Leaf'));

// ---- 6. dead RPC removed ----
check('rma_section_comparison is dropped', /drop function if exists public\.rma_section_comparison/.test(schema));
check('rma_section_comparison is no longer created', !/create or replace function public\.rma_section_comparison/.test(schema));
check('rma_section_comparison is no longer granted', !/grant execute on function public\.rma_section_comparison/.test(schema));

// ---- 7. hardening preserved ----
check('scores table still has RLS enabled', /alter table public\.rma_scores enable row level security/.test(schema));
check('scores still revoked from anon', /revoke all on public\.rma_students[\s\S]{0,160}?rma_scores/.test(schema));
check('bcrypt still used for passwords', /extensions\.crypt\(/.test(schema));
check('all definer functions pin search_path', (schema.match(/set search_path = public, extensions, pg_temp/g) || []).length >= 10, String((schema.match(/set search_path = public, extensions, pg_temp/g) || []).length));

console.log(out.join('\n'));
const fails = out.filter((r) => r.startsWith('FAIL')).length;
console.log(fails ? `\n${fails} FAILED` : '\nALL CHECKS PASSED');
console.log(`${out.length - fails}/${out.length} passed`);
if (fails) process.exit(1);