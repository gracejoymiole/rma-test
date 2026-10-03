const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const src = fs.readFileSync(ROOT + '/teacher-portal.js', 'utf8');
const sql = fs.readFileSync(ROOT + '/supabase/schema.sql', 'utf8');
const html = fs.readFileSync(ROOT + '/teacher.html', 'utf8');

const out = [];
const check = (n, c, x) => out.push((c ? 'PASS' : 'FAIL') + '  ' + n + (x ? '  -> ' + x : ''));

// ---- SQL safety: the scoping must never lock an account out ----
check('teacher account gains first_name', /add column if not exists first_name text not null default ''/.test(sql));
check('teacher account gains last_name', /add column if not exists last_name text not null default ''/.test(sql));
check('teacher account gains see_all_sections', /add column if not exists see_all_sections boolean not null default true/.test(sql));
check('blank name keeps full access', /v_teacher\.first_name = '' or v_teacher\.last_name = ''/.test(sql));
check('scoping matches student teacher names',
  /lower\(st\.teacher_first_name\) = lower\(v_teacher\.first_name\)/.test(sql) &&
  /lower\(st\.teacher_last_name\) = lower\(v_teacher\.last_name\)/.test(sql));
// Every RPC that hands back student records has to be blocked until the teacher
// has replaced the bootstrap password. Asserted per function rather than by
// counting occurrences, so adding an RPC cannot silently skip the guard.
const fnBody = (name) => (sql.match(new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`)) || [''])[0];
const PASSWORD_GUARD = 'Change the initial teacher password before opening student records';
const studentRecordRPCs = ['rma_teacher_dashboard', 'rma_set_attempt_complete', 'rma_teacher_leaderboard'];
studentRecordRPCs.forEach((fn) => check(
  `password guard present on ${fn}`, fnBody(fn).includes(PASSWORD_GUARD)));
check('profile is deliberately not password-guarded (it returns the teacher\'s own name only)',
  fnBody('rma_teacher_profile').length > 0 && !fnBody('rma_teacher_profile').includes(PASSWORD_GUARD));
check('set_attempt_complete only touches the latest attempt', /order by sc2\.created_at desc limit 1/.test(sql));
check('set_attempt_complete checks row_count', /get diagnostics v_count = row_count/.test(sql));
check('set_attempt_complete errors when nothing matched', /No submitted attempt was found for that student/.test(sql));
check('new RPCs revoked from public',
  /revoke all on function public\.rma_teacher_profile\(text\) from public/.test(sql) &&
  /revoke all on function public\.rma_set_attempt_complete\(text, text, boolean\) from public/.test(sql));
check('new RPCs granted',
  /grant execute on function public\.rma_teacher_profile\(text\) to anon, authenticated/.test(sql) &&
  /grant execute on function public\.rma_set_attempt_complete\(text, text, boolean\) to anon, authenticated/.test(sql));
check('session expiry guard on both new RPCs',
  (sql.match(/Teacher session expired\. Sign in again\.' using errcode = '28000'/g) || []).length >= 4);

// ---- Portal behaviour ----
const start = src.indexOf('  async function renderTeacherScope');
const end = src.indexOf('  // AUTHENTICATION');
if (start < 0 || end < 0) throw new Error('slice markers missing');
const slice = src.slice(start, end);

const PREAMBLE = [
  'let token = "tok";',
  'let rows = [];',
  'const dashboardMessage = {};',
  'const state = { busy: false };',
  'const escapeHtml = (v) => String(v ?? "");',
  'const els = {};',
  'const document = { getElementById: (id) => (els[id] || (els[id] = { innerHTML: "", textContent: "", hidden: true, className: "" })) };',
  'const setMessage = (n, t) => { globalThis.__msg = t; };',
  'function renderDashboardOverview() { globalThis.__rendered = (globalThis.__rendered || 0) + 1; }',
  'async function rpc(name, body) { globalThis.__calls.push({ name, body }); return globalThis.__rpc(name, body); }',
  slice,
  'return { renderTeacherScope, setAttemptComplete, document, state };'
].join('\n');

const api = new Function(PREAMBLE)();
globalThis.document = api.document;
globalThis.state = api.state;

(async () => {
  globalThis.__calls = [];
  const n1 = document.getElementById('teacherScopeNote');

  globalThis.__rpc = async () => ({ username: 'teacher123', first_name: '', last_name: '', see_all_sections: true });
  await api.renderTeacherScope();
  check('permissive scope shows a note', /Showing every registered section/.test(n1.textContent));
  check('permissive scope is neutral', n1.className === 'report-note scope-all', n1.className);

  globalThis.__rpc = async () => ({ username: 'reyes', first_name: 'Juan', last_name: 'Reyes', see_all_sections: false });
  await api.renderTeacherScope();
  check('restricted scope names the teacher', /Showing only the classes assigned to Juan Reyes/.test(n1.textContent), n1.textContent);
  check('restricted scope is highlighted', n1.className === 'report-note scope-scoped', n1.className);

  globalThis.__rpc = async () => { throw new Error('Could not find the function in the database cache'); };
  await api.renderTeacherScope();
  check('missing RPC degrades silently', n1.hidden === true);

  // happy path
  globalThis.__calls = []; globalThis.__rendered = 0;
  globalThis.__rpc = async (name) => name === 'rma_teacher_dashboard' ? [{ student_code: 'RMA-8-000001' }] : true;
  await api.setAttemptComplete('rma-8-000001', false);
  const c = globalThis.__calls;
  check('flags via rma_set_attempt_complete', c[0].name === 'rma_set_attempt_complete', c[0].name);
  check('sends the student code', c[0].body.p_student_code === 'rma-8-000001');
  check('sends the token', c[0].body.p_token === 'tok');
  check('sends p_complete=false', c[0].body.p_complete === false);
  check('then refreshes the dashboard', c[1] && c[1].name === 'rma_teacher_dashboard');
  check('re-renders the overview', globalThis.__rendered === 1, String(globalThis.__rendered));

  // error path
  globalThis.__msg = '';
  globalThis.__rpc = async () => { throw new Error('No submitted attempt was found for that student.'); };
  await api.setAttemptComplete('RMA-8-999999', true);
  check('error is surfaced to the teacher', /No submitted attempt was found/.test(globalThis.__msg), globalThis.__msg);

  // busy guard
  state.busy = true;
  globalThis.__calls = [];
  await api.setAttemptComplete('RMA-8-000001', true);
  check('busy guard prevents double submit', globalThis.__calls.length === 0);
  state.busy = false;

  // markup
  check('html has scope note', /id="teacherScopeNote"/.test(html));
  check('setAttemptComplete exported', /window\.setAttemptComplete = setAttemptComplete/.test(src));
  check('flag buttons rendered', /Flag attempt as unfinished/.test(src) && /Mark attempt finished/.test(src));
  check('flag button escapes the student code', /setAttemptComplete\('\$\{escapeHtml\(learner\.student_code\)\}'/.test(src));
  check('score 0 renders as 0, not a dash', !/\$\{learner\.score \|\| '—'\}/.test(src));
  check('scope + action styles present', /\.scope-scoped/.test(html) && /\.student-actions/.test(html));

  console.log(out.join('\n'));
  console.log(out.some((r) => r.startsWith('FAIL')) ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED');
  if (out.some((r) => r.startsWith('FAIL'))) process.exit(1);
})();
