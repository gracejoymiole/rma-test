// Guards the XP help system and its three rules:
//   1. No free help: every use is paid for from XP the student has earned.
//   2. 1 XP per correct answer; a wrong or timed-out answer changes nothing.
//   3. Second chance is limited to once per attempt of the practice test.
// These are structural checks over the source. The behaviour was also driven end to
// end in a real browser on all four grade pages (see tools/browser-check.py).
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const out = [];
const check = (n, c, x) => out.push((c ? 'PASS' : 'FAIL') + '  ' + n + (x ? '  -> ' + x : ''));

const help = read('rma-help.js');
const theme = read('rma-theme.js');
const css = read('rma-theme.css');
const data = read('rma-data.js');
const schema = read('supabase/schema.sql');
const migration = read('supabase/add-help-tracking.sql');
const portal = read('teacher-portal.js');
const ignore = read('.vercelignore');

// ---- rule 1: no free help ----
check('no free token in the rules', !/freeTokens/.test(help));
check('no token state is kept', !/tokens\b/.test(help.replace(/\/\/.*$/gm, '')));
check('nothing is ever charged as free', !/free:\s*true/.test(help) && !/"Free"/.test(help));
check('every use must be affordable', /Not enough XP/.test(help) && /balance < cost/.test(help));
check('every use is charged', /gameState\.scorePoints = \(gameState\.scorePoints \|\| 0\) - RULES\.cost\[kind\]/.test(help));
check('costs live in one table', /cost:\s*\{\s*eliminate:\s*\d+,\s*time:\s*\d+,\s*retry:\s*\d+\s*\}/.test(help));
check('extra time adds 10 seconds', /extraSeconds:\s*10/.test(help));
check('per-run spending cap exists', /maxSpendPerRun:\s*\d+/.test(help) && /Help limit reached/.test(help));
check('each help is once per question', /used\[kind\]/.test(help) && /freshQuestion/.test(help));
check('every use of help is logged per question', /state\.log\[id\]/.test(help) && /helpData: parts\.join\("\|"\)/.test(help));

// ---- rule 3: one second chance per attempt ----
check('second chance allowance is one per run', /retriesPerRun:\s*1\b/.test(help));
check('allowance resets with the run', /retries:\s*RULES\.retriesPerRun/.test(help) && /reset: function \(\) \{ state = fresh\(\)/.test(help));
check('second chance is refused once the allowance is spent', /state\.retries <= 0\) return \{ ok: false, why: "Used this attempt"/.test(help));
check('using second chance spends the allowance', /if \(kind === "retry"\) state\.retries--/.test(help));
check('second chance only after a wrong answer', /Available after a wrong answer/.test(help));
check('chip shows how many second chances are left', /"Second chance: " \+ state\.retries \+ " left"/.test(help));

// ---- the pages: all four grades ----
const PAGES = [
  ['Grade 7', 'FINAL GRADE 7 RMA/G7 RMA1 V1.html'],
  ['Grade 8', 'RMA G8 V2/G8 RMA V5.html'],
  ['Grade 9', 'RMA G9 V1/rmag9 v3.html'],
  ['Grade 10', 'RMA G10 V1/g10rma v4.html'],
];
PAGES.forEach(([grade, rel]) => {
  const page = read(rel);
  const has = (re, name, extra) => check(`${grade}: ${name}`, re.test(page), extra);

  has(/<script defer src="\.\.\/rma-help\.js"><\/script>/, 'loads rma-help.js');
  has(/id="helpCard"/, 'has the help card');
  ['help-eliminate', 'help-time', 'help-retry', 'helpBalance', 'helpToken', 'helpBudget', 'helpNote', 'helpSummary']
    .forEach((id) => has(new RegExp(`id="${id}"`), `help card has #${id}`));
  has(/const XP_PER_CORRECT = 1;/, 'earns 1 XP per correct answer');
  has(/gameState\.scorePoints \+= XP_PER_CORRECT;/, 'adds XP only through XP_PER_CORRECT');
  check(`${grade}: no 10-point award is left`, !/scorePoints \+= 10/.test(page));
  check(`${grade}: score is only added in the correct-answer branch`,
    (page.match(/scorePoints \+=/g) || []).length === 1);
  has(/\+1 XP<\/span>/, 'static badge says +1 XP');
  check(`${grade}: no stale "+10 XP" text`, !/\+10 XP/.test(page));
  has(/gameState\.scorePoints = 0;[\s\S]{0,120}gameState\.userAnswers = \{\};[\s\S]{0,60}gameState\.itemAnalysisRecords = \[\];/,
    'a new attempt clears score, answers and bank records');
  has(/window\.RMAHelp\.reset\(\)/, 'a new attempt resets help (second chance returns)');
  has(/let questionTimeLeft = 30;/, 'exposes the question timer to help');
  check(`${grade}: timer uses questionTimeLeft`, !/\btimeRemaining\b(?!")/.test(page.replace(/getElementById\("timeRemaining"\)|id="timeRemaining"/g, '')));
  has(/formData\.append\("helpData", help\.helpData\);/, 'submits help data');
  has(/formData\.append\("unaidedScore", help\.unaidedScore\);/, 'submits the unaided score');
  has(/Without help/, 'results show the without-help stat');
  check(`${grade}: no "1 free help" chip`, !/free help/i.test(page));
});

// ---- the theme must not keep a second XP count ----
check('theme has no XP counter of its own', !/XP_PER_CORRECT|state\.xp\b/.test(theme));
check('theme reads XP from the page', /gameState\.scorePoints/.test(theme));
check('theme exposes syncRun for the help card', /syncRun:\s*function/.test(theme));
check('theme run bar follows correct answers, not raw XP', /correctSoFar\(\) \/ total/.test(theme));
check('theme results show unaided answers when help exists', /help\.unaidedCorrect/.test(theme));
check('the earned-XP badge in the stylesheet says +1', /content:\s*"\+1 XP"/.test(css) && !/\+10 XP/.test(css));
check('help card styles exist', /\.help-card\b/.test(css) && /\.help-btn\b/.test(css) && /\.option-label\.eliminated/.test(css));

// ---- saving: backwards compatible ----
check('submit sends help fields only when present', /formData\.has\("helpData"\)/.test(data));
check('submit retries without them before the migration', /isMissingFunction/.test(data) && /HELP_PARAMS/.test(data));
check('score is clamped to 0-100', /Math\.min\(100, Number\.parseInt\(formData\.get\("unaidedScore"\)/.test(data));

// ---- database ----
['help_data', 'unaided_score'].forEach((col) => {
  check(`schema.sql adds ${col}`, new RegExp(`add column if not exists ${col}`).test(schema));
  check(`migration adds ${col}`, new RegExp(`add column if not exists ${col}`).test(migration));
});
check('migration drops the old submit signature', /drop function if exists public\.rma_submit_score\(text,smallint,integer,text,text,text,integer,text,text\)/.test(migration));
check('new arguments have defaults so old pages keep working', /p_help_data text default ''/.test(schema) && /p_unaided_score integer default null/.test(schema));
check('unaided score is bounded in the database', /between 0 and 100/.test(schema));
check('grants follow the new signature', /grant execute on function public\.rma_submit_score\(text,smallint,integer,text,text,text,integer,text,text,text,integer\)/.test(schema));
check('teacher portal shows unaided score', /unaidedNote/.test(portal) && /Unaided Score/.test(portal));

// ---- deploy hygiene ----
check('.vercelignore keeps .kilo/ (worktree copies of the site) out of the deploy', /^\.kilo\/\s*$/m.test(ignore));

console.log(out.join('\n'));
const failed = out.filter((l) => l.startsWith('FAIL')).length;
console.log(`\n${out.length - failed} pass, ${failed} fail`);
process.exit(failed ? 1 : 0);
