// Verifies the shared-asset hoist: every image reference in a page resolves,
// no grade folder still carries its own copy, and assets/ holds one copy each.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const out = [];
const check = (n, c, x) => out.push((c ? 'PASS' : 'FAIL') + '  ' + n + (x ? '  -> ' + x : ''));

const PAGES = [
  'FINAL GRADE 7 RMA/G7 RMA1 V1.html',
  'RMA G8 V2/G8 RMA V5.html',
  'RMA G9 V1/rmag9 v3.html',
  'RMA G10 V1/g10rma v4.html'
];
const GRADE_DIRS = ['FINAL GRADE 7 RMA', 'RMA G8 V2', 'RMA G9 V1', 'RMA G10 V1'];
const EXPECTED = ['Box-1.png', 'Figure-1.png', 'Figure-2.png', 'Figure-3.png', 'Figure-4.png',
  'Figure-5.png', 'Figure-6.png', 'Figure-7.png', 'Figure-8.png', 'Figure-9.png', 'Figure-10.png',
  'Table-1.png', 'Table-2.png', 'eq1.png', 'addimg-2.png', 'mwnhslogo.png'];

const md5 = (buf) => require('crypto').createHash('md5').update(buf).digest('hex');

// --- assets/ holds exactly one copy of each shared image ---
const assets = fs.readdirSync(path.join(ROOT, 'assets')).filter((f) => f.endsWith('.png'));
check('assets holds one copy per image', assets.length === EXPECTED.length, String(assets.length));
check('assets names are as expected', EXPECTED.every((n) => assets.includes(n)), EXPECTED.filter((n) => !assets.includes(n)).join(','));

// --- no grade folder still carries images ---
GRADE_DIRS.forEach((d) => {
  const left = fs.readdirSync(path.join(ROOT, d)).filter((f) => /\.(png|jpg|jpeg|gif)$/i.test(f));
  check(`${d} has no leftover images`, left.length === 0, left.join(','));
});

// --- every reference in every page resolves ---
PAGES.forEach((rel) => {
  const full = path.join(ROOT, rel);
  const text = fs.readFileSync(full, 'utf8');
  const dir = path.dirname(full);
  const refs = [...new Set([...text.matchAll(/["'`]([A-Za-z0-9_.\/-]+\.(?:png|jpg|jpeg|gif))["'`]/g)]
    .map((m) => m[1])
    .filter((r) => !/^https?:/.test(r)))];

  const unresolved = refs.filter((r) => !fs.existsSync(path.resolve(dir, r)));
  check(`${path.basename(rel)} all refs resolve`, unresolved.length === 0, unresolved.join(',') || `${refs.length} refs`);

  const hoisted = refs.filter((r) => r.startsWith('../assets/'));
  check(`${path.basename(rel)} uses shared assets`, hoisted.length >= 13, `${hoisted.length}/${refs.length}`);
  check(`${path.basename(rel)} no bare grade-local refs`, !refs.some((r) => !r.startsWith('../assets/')), refs.filter((r) => !r.startsWith('../assets/')).join(','));
});

// --- every figure a question points at must actually reach the student ---
// getFigureUrl was defined on all four pages and called from none of them: the
// render loop built "Figure-1.png" from the label, which resolves against the
// page's own folder rather than assets/, so every figure 404'd and the onerror
// handler hid it. Students read "Refer to Figure 1" and were shown nothing.
// Defining the helper is not enough, so this checks it is wired up.
//
// "addimg 1" and "eq1" are two labels for one and the same image. It was filed
// as addimg-1.png, so every "Refer to eq1" question had nothing to resolve,
// while "Refer to addimg 1" resolved to a file that was never really that
// figure's name. Renamed to eq1.png on 2026-10-03, so both labels point there.
// No label is known to be missing now; the list stays so that a future gap is
// added deliberately rather than discovered in a browser.
const KNOWN_MISSING_FIGURES = [];

PAGES.forEach((rel) => {
  const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const base = path.basename(rel);

  const body = text.replace(/function getFigureUrl\([\s\S]*?\n\}/, '');
  check(`${base} calls getFigureUrl`, /getFigureUrl\(/.test(body));
  check(`${base} does not build image paths from the label`,
    !/fileName = label\.replace/.test(text));
  check(`${base} does not hide a figure that failed to load`,
    !/img\.onerror = function\(\)\s*\{[^}]*console\.log/.test(text));

  // The lookup table, and every label it promises.
  const table = (text.match(/const figures = \{([\s\S]*?)\}/) || [])[1] || '';
  const mapped = new Map([...table.matchAll(/"([^"]+)":\s*"([^"]+)"/g)].map((m) => [m[1], m[2]]));
  check(`${base} lookup table is not empty`, mapped.size > 0, `${mapped.size} labels`);

  const dir = path.dirname(path.join(ROOT, rel));
  const badTargets = [...mapped.entries()].filter(([, t]) => !fs.existsSync(path.resolve(dir, t)));
  check(`${base} every mapped figure exists`, badTargets.length === 0,
    badTargets.map(([l, t]) => `${l}->${t}`).join(', '));

  // Labels used by real questions. Read them out of the question text values
  // rather than scanning the file, so the matching regex used by the render
  // loop cannot be mistaken for a label.
  const qStart = text.indexOf('const rawQuestions');
  const qEnd = text.indexOf('];', qStart);
  const questions = text.slice(qStart, qEnd > qStart ? qEnd : undefined);
  const used = new Set();
  for (const m of questions.matchAll(/text:\s*"((?:[^"\\]|\\.)*)"/g)) {
    for (const ref of m[1].matchAll(/\[Refer to ([^\]]+)\]/g)) used.add(ref[1].trim());
  }
  check(`${base} has questions referencing figures`, used.size > 0, `${used.size} labels`);

  const unmapped = [...used].filter((l) => !mapped.has(l));
  const unexpected = unmapped.filter((l) => !KNOWN_MISSING_FIGURES.includes(l));
  check(`${base} every referenced label is mapped`, unexpected.length === 0,
    unexpected.length ? unexpected.join(', ')
      : unmapped.length ? `known gap: ${unmapped.join(', ')}` : '');
});

// The old filename must not come back, or "addimg 1" will resolve to a 404 the
// same way every figure did before. Checked across the whole repo, not just the
// lookup tables, because a stale reference anywhere is enough to break it.
const staleRefs = PAGES.filter((rel) =>
  fs.readFileSync(path.join(ROOT, rel), 'utf8').includes('addimg-1.png'));
check('no page still points at addimg-1.png', staleRefs.length === 0, staleRefs.join(', '));
check('addimg-1.png is gone from assets/',
  !fs.existsSync(path.join(ROOT, 'assets', 'addimg-1.png')));
check('eq1.png is in assets/ and non-empty', (() => {
  const p = path.join(ROOT, 'assets', 'eq1.png');
  return fs.existsSync(p) && fs.statSync(p).size > 0;
})());

// --- index.html points at the shared logo ---
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
check('index.html logo uses assets/', /src="assets\/mwnhslogo\.png"/.test(index));
check('index.html logo resolves', fs.existsSync(path.join(ROOT, 'assets', 'mwnhslogo.png')));
check('index.html has no stale grade-folder image path', !/FINAL%20GRADE[^"']*\.(png|jpg|jpeg|gif)/i.test(index));
check('index.html still links the four grade pages',
  ['FINAL%20GRADE%207%20RMA', 'RMA%20G8%20V2', 'RMA%20G9%20V1', 'RMA%20G10%20V1'].every((d) => index.includes(d)));

// --- the four pages still point at each other's real question files ---
PAGES.forEach((rel) => check(`${path.basename(rel)} still exists`, fs.existsSync(path.join(ROOT, rel))));

// --- byte-for-byte integrity of the hoisted copies ---
EXPECTED.forEach((n) => {
  const buf = fs.readFileSync(path.join(ROOT, 'assets', n));
  check(`assets/${n} non-empty`, buf.length > 0, `${buf.length}B`);
});

console.log(out.join('\n'));
const fails = out.filter((r) => r.startsWith('FAIL')).length;
console.log(fails ? `\n${fails} FAILED` : '\nALL CHECKS PASSED');
console.log(`${out.length - fails}/${out.length} passed`);
if (fails) process.exit(1);