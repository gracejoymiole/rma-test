/* Guards the answer feedback, the remove-learner flow and the denser layout.

   The feedback bug is the one worth a test: the verdict line was hardcoded as
   "Exactly right." and the "+1 XP" badge was painted by CSS on every shown
   explanation, so a question that timed out claimed the answer was right and
   awarded a point it never earned. */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const out = [];
const check = (n, c, x) => out.push((c ? 'PASS' : 'FAIL') + '  ' + n + (x ? '  -> ' + x : ''));

const PAGES = [
  'FINAL GRADE 7 RMA/G7 RMA1 V1.html',
  'RMA G8 V2/G8 RMA V5.html',
  'RMA G9 V1/rmag9 v3.html',
  'RMA G10 V1/g10rma v4.html',
];
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const css = read('rma-theme.css');
const portal = read('teacher-portal.js');
const teacherHtml = read('teacher.html');
const schema = read('supabase/schema.sql');
const migration = read('supabase/add-remove-student.sql');

// ---- feedback must match the verdict ----
check('the theme does not paint an XP badge unconditionally',
  /\.explanation::after \{ content: none; \}/.test(css));
check('the XP badge hangs off a correct answer',
  /\.explanation\.is-correct::after \{\s*content: "\+1 XP"/.test(css));
check('a miss is styled without the reward',
  /\.explanation\.is-wrong, \.explanation\.is-timeup/.test(css));

PAGES.forEach((rel) => {
  const src = read(rel);
  const base = path.basename(rel);
  check(`${base} no longer ships a hardcoded verdict`,
    !/class="fb-title">Exactly right\./.test(src));
  check(`${base} has a verdict element to update`, /id="fbTitle"/.test(src));
  check(`${base} caches fbTitle in dom`, /fbTitle:\s*document\.getElementById\('fbTitle'\)/.test(src));
  check(`${base} says so when a correct answer is given`,
    /dom\.fbTitle\.textContent = 'Exactly right\.';/.test(src));
  check(`${base} says so when an answer is wrong`,
    /dom\.fbTitle\.textContent = 'Not this time\.';/.test(src));
  check(`${base} says so when time runs out`,
    /dom\.fbTitle\.textContent = 'Time ran out'/.test(src));
  check(`${base} adds the badge class only on a correct answer`,
    /explanationBox\.classList\.add\('is-correct'\)/.test(src));
  check(`${base} clears the verdict classes between questions`,
    /explanationBox\.classList\.remove\('is-correct', 'is-wrong', 'is-timeup'\)/.test(src));
  check(`${base} shows the explanation on a miss too`,
    /is-wrong'\);[\s\S]{0,200}explanationBox\.style\.display = 'block'/.test(src));
});

// ---- remove a learner ----
check('the removal card exists', /id="removeStudentCard"/.test(teacherHtml));
check('the card names the learner list', /id="removableList"/.test(teacherHtml));
check('the card warns that it cannot be undone',
  /cannot be undone/i.test(teacherHtml));
check('removal is listed after the student status table',
  teacherHtml.indexOf('id="removableList"') > teacherHtml.indexOf('id="studentRows"'));

check('the portal renders the removable list', /function renderRemovableStudents\(\)/.test(portal));
check('the list is scoped to the chosen grade',
  /Number\(row\.grade\) === grade[\s\S]{0,120}row\.student_id/.test(portal));
check('the list is scoped to the chosen section',
  /section === "\*" \|\| String\(row\.section\) === String\(section\)/.test(portal));
check('removal needs a second, separate confirm',
  /button\.dataset\.armed !== "1"/.test(portal) && /Confirm delete/.test(portal));
check('a stray first click only arms the confirm',
  /button\.dataset\.armed = "1";\s*\n\s*button\.textContent = "Confirm delete";/.test(portal));
check('the armed state disarms itself',
  /button\.dataset\.armed = "0";/.test(portal) && /setTimeout/.test(portal));
check('removal refreshes the dashboard', /await loadDashboard\(\)/.test(portal));
check('a missing function is explained rather than leaked',
  /add-remove-student\.sql/.test(portal) && /schema cache/.test(portal));
check('the removal button never carries raw HTML from the row',
  /escapeHtml\(row\.student_name \|\| ""\)[\s\S]{0,400}?data-remove-student="\$\{escapeHtml\(row\.student_id\)\}"/.test(portal));

// ---- the database half ----
[schema, migration].forEach((sql, i) => {
  const where = i === 0 ? 'schema.sql' : 'add-remove-student.sql';
  check(`${where} defines rma_remove_student`,
    /create or replace function public\.rma_remove_student\(p_token text, p_student_id uuid\)/.test(sql));
  check(`${where} deletes the scores`, /delete from public\.rma_scores where student_id = v_student\.id/.test(sql));
  check(`${where} deletes the violations`, /delete from public\.rma_violations where student_id = v_student\.id/.test(sql));
  check(`${where} deletes the sessions`,
    /delete from public\.rma_auth_sessions where student_id = v_student\.id/.test(sql));
  check(`${where} deletes the student`, /delete from public\.rma_students where id = v_student\.id/.test(sql));
  check(`${where} enforces teacher scope in the database`,
    /That student is not in one of your sections\./.test(sql)
    && /v_teacher\.see_all_sections/.test(sql));
  check(`${where} requires a signed-in teacher`,
    /Teacher session expired\. Sign in again\./.test(sql));
  check(`${where} blocks a teacher who has not changed the initial password`,
    /Change the initial teacher password before removing student records\./.test(sql));
  check(`${where} grants the function to signed-in teachers only`,
    /grant execute on function public\.rma_remove_student\(text, uuid\) to authenticated;/.test(sql)
    && !/grant execute on function public\.rma_remove_student\(text, uuid\) to anon/.test(sql));
  check(`${where} revokes the function from the public role`,
    /revoke all on function public\.rma_remove_student\(text, uuid\) from public;/.test(sql));
  // The order matters: the child rows go first, because scores and violations
  // are on delete set null and would otherwise be orphaned.
  const order = ['rma_auth_sessions', 'rma_violations', 'rma_scores', 'rma_students']
    .map((t) => sql.indexOf('delete from public.' + t));
  check(`${where} deletes child rows before the student`,
    order.every((v, i) => v > 0 && (i === 0 || v > order[i - 1])),
    order.join(' -> '));
});

// ---- denser as the screen grows ----
// Type must not grow with the viewport, or a desktop shows the same words in a
// bigger box and fits nothing extra. clamp() cannot shrink, so the scale is
// kept near-flat and a large-screen query does the trimming.
function nearFlat(value, name, tolerance) {
  const nums = value.match(/[\d.]+/g).map(Number);
  const grew = (nums[2] - nums[0]) / nums[0];
  check(`${name} does not grow with the viewport (${value})`, grew <= tolerance,
    `${Math.round(grew * 1000) / 10}% over the range`);
}
// Padding may grow a little from phone to desktop -- 12px on a monitor is
// cramped -- but it must stop well short of ballooning.
function capped(value, name, ceiling) {
  const nums = value.match(/[\d.]+/g).map(Number);
  check(`${name} is capped, never ballooning (${value})`, nums[0] < nums[2] && nums[2] <= ceiling,
    `max ${nums[2]}px, ceiling ${ceiling}`);
}
// The sheet has more than one :root block (palette, then fluid foundations), so
// every block is scanned rather than only the first.
const allRootVars = [...css.matchAll(/:root \{([\s\S]*?)\n\}/g)].map((m) => m[1]).join('\n');
['--fs-xs', '--fs-sm', '--fs-base', '--fs-lg'].forEach((v) => {
  const m = allRootVars.match(new RegExp(v + ':\\s*(clamp\\([^)]*\\))'));
  check(`theme defines ${v} as fluid`, !!m, m && m[1]);
  if (m && m[1].startsWith('clamp')) nearFlat(m[1], `theme ${v}`, 0.04);
});
check('a wide screen actually trims the type',
  /@media \(min-width: 1500px\)[\s\S]{0,320}?--fs-base:\s*\.8/.test(css));
[['--gutter', 24], ['--pad-card', 30], ['--pad-quiz', 34]].forEach(([v, ceil]) => {
  const m = allRootVars.match(new RegExp(v + ':\\s*(clamp\\([^)]*\\))'));
  check(`theme defines ${v} as fluid`, !!m, m && m[1]);
  if (m && m[1].startsWith('clamp')) capped(m[1], `theme ${v}`, ceil);
});
check('question text does not grow with the viewport',
  /font:\s*600 clamp\(1\.15rem, 2\.6vw, 1\.3rem\)/.test(css)
  || /font:\s*600 clamp\(1\.15rem, 2\.6vw, 1\.45rem\)/.test(css));
const measure = (css.match(/--measure:\s*(\d+)px/) || [])[1];
check('the measure is a ceiling, not a target', !!measure && Number(measure) <= 1180, measure + 'px');
check('the very wide query adds density, not width',
  /@media \(min-width: 1600px\)[\s\S]{0,320}?--measure/.test(css)
  && !/@media \(min-width: 1600px\)[\s\S]{0,320}?font-size:\s*clamp\([^)]*1\.4vw/.test(css));

// ---- question mastery stays scrollable and compact ----
check('the mastery list is height capped', /\.scroll, \.mm-scroll \{ max-height:var\(--card-list-max\)/.test(teacherHtml));
check('the cap is viewport relative, not a fixed pixel budget',
  /--card-list-max:\s*62dvh/.test(teacherHtml));
check('the cap is not removed on a phone', !/\.scroll, \.mm-scroll \{ max-height:none/.test(teacherHtml));
check('the list scrolls rather than widening the page',
  /overscroll-behavior:contain/.test(teacherHtml) && /-webkit-overflow-scrolling:touch/.test(teacherHtml));
check('the header row of a scrolled list stays readable',
  /\.scroll thead th, \.scroll th \{ position:sticky; top:0/.test(teacherHtml));

// ---- the stray line ----
check('the empty leaderboard note no longer pulls the grid up',
  !/id="leaderboardNote"[^>]*style="margin-top:-8px"/.test(teacherHtml));
check('the leaderboard note starts hidden', /id="leaderboardNote" hidden/.test(teacherHtml));
check('an empty note takes no space', /\.leaderboard-note:empty \{ display:none; \}/.test(teacherHtml));
check('writing the note reveals it',
  /note\.hidden = false;/.test(portal)
  && /note\.textContent = `\$\{scope\}\./.test(portal));
check('clearing the note hides it again',
  /note\.textContent = ""; note\.hidden = true;/.test(portal));

console.log(out.join('\n'));
const failed = out.filter((l) => l.startsWith('FAIL')).length;
console.log(`\n${out.length - failed}/${out.length} passed`);
console.log(failed ? `\nSOME CHECKS FAILED (${failed})` : '\nALL CHECKS PASSED');
process.exit(failed ? 1 : 0);