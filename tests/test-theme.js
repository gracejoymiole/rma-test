/* Guards the shared theme.

   The four grade pages used to carry their own colours, fonts and header, built
   from inline styles, and drifted apart: green for Grade 7, yellow for Grade 8,
   blue for Grade 9, red for Grade 10, all in Segoe UI, while the landing page and
   the teacher portal used wine and gold. rma-theme.css plus rma-theme.js now hold
   all of it, and these checks stop a page from quietly going back to its own
   styling or losing the wiring that drives the new UI. */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const out = [];
const check = (name, cond, extra) =>
  out.push((cond ? 'PASS' : 'FAIL') + '  ' + name + (extra ? '  -> ' + extra : ''));

const PAGES = [
  { grade: 7, rel: 'FINAL GRADE 7 RMA/G7 RMA1 V1.html' },
  { grade: 8, rel: 'RMA G8 V2/G8 RMA V5.html' },
  { grade: 9, rel: 'RMA G9 V1/rmag9 v3.html' },
  { grade: 10, rel: 'RMA G10 V1/g10rma v4.html' },
];

const cssPath = path.join(ROOT, 'rma-theme.css');
const jsPath = path.join(ROOT, 'rma-theme.js');
check('rma-theme.css exists at the repo root', fs.existsSync(cssPath));
check('rma-theme.js exists at the repo root', fs.existsSync(jsPath));

const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
const js = fs.existsSync(jsPath) ? fs.readFileSync(jsPath, 'utf8') : '';

// --- the shared files themselves ---
['--ink', '--coral', '--amber', '--teal', '--ice', '--font-display', '--font-body']
  .forEach((token) => check(`rma-theme.css defines ${token}`, css.includes(token)));
check('the page scripts rely on these tokens, so the alias names must stay',
  ['--primary', '--accent', '--gold', '--success', '--danger', '--bg-light']
    .every((t) => css.includes(t + ':')));
check('the theme honours prefers-reduced-motion', /@media \(prefers-reduced-motion: reduce\)/.test(css));
check('the theme has a focus-visible style', /:focus-visible/.test(css));
check('the theme has no page-specific colour left in it',
  !/grade-7|grade-8|grade-9|grade-10/i.test(css));

check('rma-theme.js parses', (() => {
  try { new Function(js); return true; } catch (e) { return false; }
})());
check('rma-theme.js exposes its API', /window\.RMATheme\s*=/.test(js));
check('rma-theme.js guards every optional element', (js.match(/if \(\w+\) /g) || []).length >= 10);
check('rma-theme.js silences confetti under reduced motion',
  /prefers-reduced-motion/.test(js) && /window\.confetti = function/.test(js));
check('rma-theme.js gives the leaderboard sheet a dismiss path',
  /lbClose/.test(js) && /Escape/.test(js));
check('rma-theme.js has a reset for a second attempt', /reset: function/.test(js));

check('the theme tokens are the site-wide font', /--font-display:\s*"Fredoka"/.test(css)
  && /--font-body:\s*"Fredoka"/.test(css),
  'Fredoka');
check('the theme carries no superseded font family',
  !/Encode Sans Expanded|"Rubik"|Comic Relief|Comic Sans/.test(css));

// --- each page uses the shared theme and nothing else ---
PAGES.forEach(({ grade, rel }) => {
  const base = path.basename(rel);
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');

  check(`${base} links the shared stylesheet`, /<link rel="stylesheet" href="\.\.\/rma-theme\.css">/.test(src));
  check(`${base} loads the shared script`, /<script defer src="\.\.\/rma-theme\.js"><\/script>/.test(src));
  check(`${base} loads no Tailwind`, !/tailwind/i.test(src),
    (src.match(/tailwind/gi) || []).length + ' refs');
// One font family site-wide. If this ever changes, change it here too, so the
  // pages cannot each drift back to their own typeface.
  check(`${base} loads the shared font`,
    /fonts\.googleapis\.com\/css2\?family=Fredoka:wght@300\.\.700/.test(src));
  check(`${base} preconnects to the font host`,
    /<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">/.test(src)
    && /fonts\.gstatic\.com" crossorigin/.test(src));
  check(`${base} has no superseded font family left`,
    !/Encode\+Sans|family=Rubik|"Rubik"|Comic\+Relief/.test(src));
  check(`${base} is tagged with its grade`, new RegExp(`<body data-grade="${grade}">`).test(src));
  check(`${base} has no leftover school-year banner`, !/S\.Y\./.test(src));

  // Header, progress, card and sidebar come from the theme's class names.
  ['rma-header', 'rma-brand', 'chip-grade', 'pill-xp', 'progress-container',
    'card quiz-card', 'options-grid', 'option-label', 'controls', 'sidebar',
    'run-card', 'lb-card', 'leaderboard-table', 'ring', 'band-chip', 'stats']
    .forEach((cls) => check(`${base} uses .${cls}`,
      // Option labels are built by the quiz script at runtime, so they never appear as static markup.
      cls === 'option-label' ? src.includes(cls) : src.includes(`class="${cls}`) || src.includes(` ${cls}"`)));

  // The old inline header styling must be gone, or it will win over the theme.
  check(`${base} header has no inline background`,
    !/<header[^>]*style="[^"]*background/.test(src));
  check(`${base} logo is no longer 100px`, !/mwnhslogo\.png"[^>]*width="100"/.test(src));
  check(`${base} has no text-shadow title stack`,
    !/text-shadow:\s*1px 1px 0 #ffffff,\s*2px 2px 0 #ffffff/.test(src));

  // Correct and wrong must not be signalled by colour alone.
  check(`${base} marks correct with an icon`, /\.option-label\.correct[\s\S]{0,400}?::after/.test(css));
  check(`${base} options carry lettered badges`, /\.option-label::before[\s\S]{0,200}?upper-alpha/.test(css));

  // The theme is wired at the three moments that can change it.
  check(`${base} reports each question`, /RMATheme\.onQuestion\(/.test(src));
  check(`${base} reports each answer`, /RMATheme\.onAnswer\(isCorrect\)/.test(src));
  check(`${base} reports an expired question as a miss`, /RMATheme\.onAnswer\(false\)/.test(src));
  check(`${base} reports the finish`, /RMATheme\.onFinish\(/.test(src));
  check(`${base} resets for a second attempt`, /RMATheme\.reset\(\)/.test(src));

  // Accessibility affordances the redesign introduced.
  check(`${base} has a visible progressbar role`, /role="progressbar"/.test(src));
  check(`${base} labels the sound toggle`, /id="soundToggle"[\s\S]{0,120}?aria-label=/.test(src));
  check(`${base} leaderboard toggle reports expanded state`,
    /id="lbToggle"[\s\S]{0,160}?aria-expanded/.test(src));
  check(`${base} keeps the element ids the scripts use`,
    ['qText', 'optionsBox', 'checkBtn', 'nextBtn', 'leaderboard', 'progressBar',
      'resultContent', 'quizContent', 'explanationBox', 'retryBtn', 'certBtn']
      .every((id) => new RegExp(`id="${id}"`).test(src)));
});

// --- the band wording must match the database ---
// Students see these four labels on the results screen; the teacher portal shows
// rma_score_bands. If the two drift, a student is told one thing and their
// teacher sees another.
const schema = fs.readFileSync(path.join(ROOT, 'supabase', 'schema.sql'), 'utf8');
const bandRows = [...schema.matchAll(/\(\s*'(\w+)',\s*(\d+),\s*(\d+),\s*'([^']+)'/g)]
  .filter((m) => ['proficient', 'developing', 'emerging', 'needs_support'].includes(m[1]));
check('the four score bands are found in schema.sql', bandRows.length === 4, String(bandRows.length));

const STUDENT_WORDING = {
  proficient: 'Proficient',
  developing: 'Developing',
  emerging: 'Emerging',
  needs_support: 'Building foundations',
};
bandRows.forEach(([, band, min]) => {
  check(`the results band for ${band} (>=${min}%) says "${STUDENT_WORDING[band]}"`,
    js.includes(`"${STUDENT_WORDING[band]}"`));
});
// The thresholds have to agree with the table, not just the wording.
check('the theme bands use the database thresholds',
  js.includes('min: 80') && js.includes('min: 60') && js.includes('min: 40'));
check('no results GIF is shown', /\.result-gif|#resultGif\s*\{\s*display:\s*none\s*!important/.test(css)
  || /#resultGif/.test(css));

// --- the shared files must be reachable from a grade folder ---
PAGES.forEach(({ rel }) => {
  const dir = path.dirname(path.join(ROOT, rel));
  check(`${path.basename(rel)} can resolve ../rma-theme.css`,
    fs.existsSync(path.resolve(dir, '..', 'rma-theme.css')));
  check(`${path.basename(rel)} can resolve ../rma-theme.js`,
    fs.existsSync(path.resolve(dir, '..', 'rma-theme.js')));
});

// --- nothing private may ride along with the theme ---
const ignore = fs.readFileSync(path.join(ROOT, '.vercelignore'), 'utf8');
check('.vercelignore keeps supabase/ out of the deploy', /supabase\//.test(ignore));
check('.vercelignore keeps tests/ out of the deploy', /tests\//.test(ignore));
check('.vercelignore keeps tools/ out of the deploy', /tools\//.test(ignore));
check('.vercelignore excludes .kilo/', /^\.kilo\//m.test(ignore));

// --- phone-first: the base rules must suit a phone, not a desktop ---
// The sheet used to declare a two-column grid and a 1200px measure as the base
// and bolt max-width queries on top, which left nothing decided at 320px.
check('the base layout is one column', /\.main-container\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/.test(css));
check('wider screens are added with min-width, not max-width',
  (css.match(/@media \(min-width:/g) || []).length >= 3);
check('the desktop grid only returns at a min-width', /@media \(min-width:\s*1000px\)[\s\S]{0,900}?grid-template-columns:\s*minmax\(0,\s*1fr\)\s+clamp/.test(css));
check('gutter and padding are fluid', /--gutter:\s*clamp\(/.test(css)
  && /--pad-card:\s*clamp\(/.test(css));
check('question text is fluid, not a fixed size', /font:\s*600 clamp\(/.test(css));
check('tap targets have a floor', /--tap:\s*44px/.test(css) && /min-height:\s*max\(var\(--tap\)/.test(css));
check('actions stick within thumb reach', /\.controls\s*\{[^}]*position:\s*sticky/.test(css));
check('the action bar clears the home indicator', /env\(safe-area-inset-bottom/.test(css));
check('the bottom sheet tracks the visible viewport', /max-height:\s*85dvh/.test(css));
check('the page cannot be pushed sideways', /overflow-x:\s*hidden/.test(css));
check('the chart is no longer pinned to a wide floor', !/min-width:560px/.test(css));

// --- penalties: one day, and switchable off while testing ---
const ENFORCE = process.env.RMA_ENFORCE_SECURITY === '1';
PAGES.forEach(({ rel }) => {
  const page = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const base = path.basename(rel);
  check(`${base} has a ban length of one day`, /banDuration:\s*1 \* 24 \* 60 \* 60 \* 1000/.test(page));
  check(`${base} no longer hardcodes the ban message`, !/Naka-3 Strikes/.test(page));
  check(`${base} reads the thresholds for the message`, /SECURITY\.maxStrikes\} warnings/.test(page));
  check(`${base} has a security on/off switch`, /enforceSecurity:\s*(true|false)/.test(page));
  // Either it is enabled, or the violation handler really does bail out.
  const enforcing = /enforceSecurity:\s*true/.test(page);
  check(`${base} enforcement matches the expected state`,
    enforcing === ENFORCE, enforcing ? 'enforcing' : 'not enforcing');
  if (!enforcing) {
    check(`${base} handleViolation returns early when off`,
      /if \(!SECURITY\.enforceSecurity\)[\s\S]{0,120}?return;/.test(page));
    check(`${base} an old ban cannot block a new attempt`,
      /SECURITY\.enforceSecurity && SECURITY\.banUntil > now/.test(page));
  }
  check(`${base} clears its own grade's stale keys`, /clearStaleBan/.test(page));
});
// Grade 7 used to clear g10_exam_* keys, so its own strikes survived and the next
// attempt was banned again.
PAGES.forEach(({ grade, rel }) => {
  const page = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const keys = [...page.matchAll(/localStorage\.removeItem\("(g\d+_exam_\w+)"\)/g)].map((m) => m[1]);
  const foreign = keys.filter((k) => !k.startsWith(`g${grade}_exam_`));
  check(`${path.basename(rel)} only clears its own storage keys`, foreign.length === 0, foreign.join(', '));
});

// --- the teacher portal must be usable on a phone ---
const teacherHtml = fs.readFileSync(path.join(ROOT, 'teacher.html'), 'utf8');
check('teacher leaderboard uses compact ranked rows', /\.leaderboard-list \{ display:grid; gap:6px/.test(teacherHtml) && /leaderboard-entry\$\{rankClass\}/.test(fs.readFileSync(path.join(ROOT, 'teacher-portal.js'), 'utf8')));
check('teacher charts can shrink to the card', /min-width:min\(560px, 100%\)/.test(teacherHtml));
check('teacher leaderboard highlights its top three', /\.leaderboard-entry\.top-rank-1/.test(teacherHtml) && /\.leaderboard-entry\.top-rank-2/.test(teacherHtml) && /\.leaderboard-entry\.top-rank-3/.test(teacherHtml));
check('teacher dashboard cards use tighter spacing and type', /#dashboard \.report-note \{ margin-bottom:8px; font-size:\.74rem/.test(teacherHtml));
check('teacher portal grows with min-width', (teacherHtml.match(/@media \(min-width:/g) || []).length >= 3);
check('teacher controls meet the tap floor', /--tap:\s*44px/.test(teacherHtml));
check('teacher portal has a reduced-motion rule', /@media \(prefers-reduced-motion:reduce\)/.test(teacherHtml));

console.log(out.join('\n'));
const failed = out.filter((r) => r.startsWith('FAIL'));
console.log(`\n${out.length - failed.length}/${out.length} passed`);
console.log(failed.length ? `\nSOME CHECKS FAILED (${failed.length})` : '\nALL CHECKS PASSED');
process.exit(failed.length ? 1 : 0);