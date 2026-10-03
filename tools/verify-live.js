// Confirms that a Supabase deploy actually landed, from outside the app.
//
// The SQL Editor gives you one "Success" line for a whole script, and a script
// that fails partway can roll back everything. This re-checks the live project
// through the same public PostgREST surface the browser uses, so it reports
// what a real user would get rather than what the Editor claims.
//
//   node tools/verify-live.js
//
// Reads the URL and publishable key from supabase-config.js so it can never
// drift from what the app sends. Exits non-zero if anything is still missing.

const fs = require('fs');
const path = require('path');

const cfg = fs.readFileSync(path.join(__dirname, '..', 'supabase-config.js'), 'utf8');
const url = (cfg.match(/url:\s*"([^"]+)"/) || [])[1];
const key = (cfg.match(/publishableKey:\s*"([^"]+)"/) || [])[1];
if (!url || !key) {
  console.error('Could not read url/publishableKey from supabase-config.js');
  process.exit(2);
}

const rest = `${url}/rest/v1`;
const headers = { apikey: key, Authorization: `Bearer ${key}` };

const results = [];
const pass = (name, detail) => results.push({ ok: true, name, detail });
const fail = (name, detail) => results.push({ ok: false, name, detail });

async function call(rpc, body) {
  const r = await fetch(`${rest}/rpc/${rpc}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let json = null;
  try { json = await r.json(); } catch { /* non-JSON error body */ }
  return { status: r.status, code: json && json.code, message: (json && json.message) || '' };
}

// PGRST202 means "no such function in the schema cache". A 28000 means the
// function ran and rejected our fake session, which proves it exists.
function classify(r) {
  if (r.status === 404 && r.code === 'PGRST202') return 'missing';
  if (r.status === 403 && r.code === '28000') return 'present';
  if (r.status === 200) return 'present';
  return 'unknown';
}

async function checkRpc(name, body, expect = 'present') {
  let r;
  try {
    r = await call(name, body);
  } catch (e) {
    return fail(name, `request failed: ${e.message}`);
  }
  const state = classify(r);
  if (state === expect) return pass(name, `HTTP ${r.status}`);
  return fail(name, `HTTP ${r.status} ${r.code || ''} ${r.message}`.trim());
}

// A column is "present" if Postgres stops complaining about the column. It
// resolves names before it checks table privileges, so a permission error
// actually proves the column exists: 42703 means missing, 42501/401 means found
// but not readable by anon, which is the correct end state.
async function checkColumn(table, column) {
  const name = `${table}.${column}`;
  const r = await fetch(`${rest}/${table}?select=${column}&limit=1`, { headers });
  if (r.status === 200) return pass(name, 'present');
  if (r.status === 404) return fail(name, 'table not exposed (PGRST205)');
  const t = await r.text();
  if (/does not exist/.test(t)) return fail(name, 'column does not exist');
  if (r.status === 401 || r.status === 403 || /42501/.test(t)) {
    return pass(name, 'exists (not anon-readable)');
  }
  return fail(name, `HTTP ${r.status} ${t.slice(0, 120)}`);
}

async function main() {
  // 1. The leak must stay closed. A 404 here is the desired outcome.
  let lb;
  try {
    lb = await fetch(`${rest}/rma_leaderboard?select=name&limit=1`, { headers });
  } catch (e) {
    return fail('rma_leaderboard view hidden', e.message);
  }
  const lbBody = await lb.text();
  if (lb.status === 404 && lbBody.includes('PGRST205')) {
    pass('rma_leaderboard view hidden', 'not reachable without a session');
  } else {
    fail('rma_leaderboard view hidden', `HTTP ${lb.status} ${lbBody.slice(0, 160)}`);
  }

  // 2. Functions the portal calls. Session-scoped ones are probed with a
  //    deliberately invalid token, so a clean auth rejection is the pass.
  const BAD = { p_token: 'verify-live-invalid-token' };
  await checkRpc('rma_student_login', { p_student_code: 'X', p_password: 'x', p_grade: 7 });
  await checkRpc('rma_teacher_login', { p_username: 'x', p_password: 'x' });
  await checkRpc('rma_teacher_dashboard', BAD);
  await checkRpc('rma_teacher_profile', BAD);
  await checkRpc('rma_set_attempt_complete', { ...BAD, p_student_code: 'X', p_complete: true });
  await checkRpc('rma_leaderboard_top', { ...BAD, p_limit: 10 });
  await checkRpc('rma_teacher_leaderboard', { ...BAD, p_grade: 7, p_section: null, p_limit: 10 });

  // 3. rma_get_score_bands takes no session, so it should return real data.
  let bands = [];
  try {
    const r = await fetch(`${rest}/rpc/rma_get_score_bands`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (r.status === 200) {
      const parsed = await r.json();
      bands = Array.isArray(parsed) ? parsed : [];
    }
  } catch { /* reported as a failure below */ }
  if (bands.length === 4) {
    const ordered = bands.every((b, i) => i === 0 || b.sort_order >= bands[i - 1].sort_order);
    pass('rma_get_score_bands', `${bands.length} bands${ordered ? ', ordered' : ', OUT OF ORDER'}`);
    if (!ordered) results[results.length - 1].ok = false;
  } else {
    fail('rma_get_score_bands', `expected 4 bands, got ${bands.length}`);
  }

  // 4. Columns the features read. plpgsql bodies are not resolved when the
  //    function is created, so a missing column here means a broken feature
  //    that no amount of function-level checking would have caught.
  await checkColumn('rma_scores', 'attempt_number');
  await checkColumn('rma_scores', 'is_complete');
  await checkColumn('rma_teacher_accounts', 'first_name');
  await checkColumn('rma_teacher_accounts', 'last_name');
  await checkColumn('rma_teacher_accounts', 'see_all_sections');

  const width = Math.max(...results.map((r) => r.name.length)) + 2;
  const pad = (s) => (s + ' '.repeat(width)).slice(0, width);
  console.log('\nLive check against ' + url + '\n');
  for (const r of results) {
    console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${pad(r.name)}  ${r.detail}`);
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log('\nStill missing: run supabase/apply-missing.sql in the SQL Editor,');
    console.log('or the full supabase/schema.sql, then run this again.');
  }
  process.exit(failed.length ? 1 : 0);
}

main();
