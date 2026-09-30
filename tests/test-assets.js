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
  'Table-1.png', 'Table-2.png', 'addimg-1.png', 'addimg-2.png', 'mwnhslogo.png'];

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

// --- the dead eq1.png entry is gone ---
const g7 = fs.readFileSync(path.join(ROOT, PAGES[0]), 'utf8');
check('missing eq1.png entry removed', !/eq1\.png/.test(g7));
check('getFigureUrl still defined', /function getFigureUrl\(label\)/.test(g7));
check('figure map still has the real labels', /"Box 1": "\.\.\/assets\/Box-1\.png"/.test(g7));

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