// Unit tests for the shared tag-aware selector. The pages themselves only get
// wired up and smoke-tested; the distribution logic is checked here where it
// can be driven deterministically.
const path = require('path');
const { selectByTopic, allocate } = require(path.join(__dirname, '..', 'rma-selection.js'));

const out = [];
const check = (n, c, x) => out.push((c ? 'PASS' : 'FAIL') + '  ' + n + (x ? '  -> ' + x : ''));

// deterministic shuffle so the tests do not flake
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const makeShuffle = (r) => (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
};

// A grade-8-shaped pool: 38 fixed RMA items then bank items across 7 topics.
function grade8Topics(i) {
  if (i < 11) return 'NUMBER EXPRESSIONS';
  if (i < 20) return 'DATA';
  if (i < 33) return 'COORDINATES';
  if (i < 43) return 'TRIANGLES';
  if (i < 53) return 'VARIABLES';
  if (i < 65) return 'EQUATIONS';
  if (i < 79) return 'CIRCLES';
  return 'CIRCLES';
}

const LEN = 122, FIXED = 38, RANDOM = 12;
const run = (seed) => selectByTopic({
  length: LEN, fixedCount: FIXED, randomCount: RANDOM,
  topicOf: grade8Topics, shuffle: makeShuffle(seeded(seed)),
});

// --- basic contract ---
let r = run(1);
check('returns the requested total', r.indices.length === FIXED + RANDOM, String(r.indices.length));
check('no duplicates', new Set(r.indices).size === r.indices.length);
check('every index is in range', r.indices.every((i) => i >= 0 && i < LEN));
check('the fixed block is always included', r.indices.every((i) => i >= 0 && i < FIXED || r.indices.includes(i)) && Array.from({ length: FIXED }, (_, i) => i).every((i) => r.indices.includes(i)));
check('every selected index respects the pool boundary', r.indices.filter((i) => i >= FIXED).length === RANDOM);

// --- topic coverage: the actual point of the change ---
const seenTopics = new Set();
for (let seed = 1; seed <= 40; seed++) seenTopics.add(Object.keys(run(seed).topicCounts).length);
check('every run draws from more than one topic', [...seenTopics].every((n) => n > 1), JSON.stringify([...seenTopics].sort()));
check('topic spread is stable across seeds', new Set([...seenTopics]).size === 1, JSON.stringify([...seenTopics]));

// Compare with the old behaviour: a flat pool meant the tail topics were the
// only ones reachable, and the first bank items dominated.
const oldStyle = [];
{
  const r2 = seeded(7);
  const pool = []; for (let i = FIXED; i < LEN; i++) pool.push(i);
  for (let k = pool.length - 1; k > 0; k--) { const j = Math.floor(r2() * (k + 1)); const t = pool[k]; pool[k] = pool[j]; pool[j] = t; }
  oldStyle.push(...pool.slice(0, RANDOM));
}
const oldTopics = new Set(oldStyle.map(grade8Topics));
check('the old flat pool drew from several topics too', oldTopics.size >= 3, oldTopics.size + ' topics');
check('new selection covers at least as many topics as the flat pool',
  Object.keys(r.topicCounts).length >= oldTopics.size,
  Object.keys(r.topicCounts).length + ' vs ' + oldTopics.size);

// --- randomness: different seeds must actually differ ---
const draws = new Set();
for (let seed = 1; seed <= 25; seed++) draws.add(run(seed).indices.join(','));
check('25 seeds produce more than one distinct paper', draws.size > 1, draws.size + ' distinct');
check('25 seeds mostly differ', draws.size >= 20, draws.size + ' distinct');

// --- distribution follows pool size ---
{
  // 10 slots over equal pools should give each topic at least one.
  const groups = { A: [0, 1, 2], B: [3, 4, 5], C: [6, 7, 8] };
  const q = allocate(groups, 9);
  check('allocation never exceeds pool size', Object.keys(groups).every((k) => q[k] <= groups[k].length), JSON.stringify(q));
  check('allocation uses every slot', Object.values(q).reduce((a, b) => a + b, 0) === 9, JSON.stringify(q));
  const q2 = allocate(groups, 2);
  check('a small budget still reaches multiple topics', Object.values(q2).filter((v) => v > 0).length >= 2, JSON.stringify(q2));
  const q3 = allocate({ A: [0] }, 5);
  check('a tiny pool cannot be over-drawn', q3.A <= 1, JSON.stringify(q3));
  check('allocation of zero slots is empty', Object.keys(allocate(groups, 0)).length === 0);
  check('allocation of no groups is empty', Object.keys(allocate({}, 5)).length === 0);
}

// --- degenerate inputs must not throw or over-draw ---
const cases = [
  ['empty pool', { length: 0, fixedCount: 0, randomCount: 0 }],
  ['fixedCount exceeds length', { length: 5, fixedCount: 99, randomCount: 3 }],
  ['randomCount exceeds what is left', { length: 10, fixedCount: 8, randomCount: 50 }],
  ['negative counts', { length: 10, fixedCount: -5, randomCount: -5 }],
  ['no topicOf supplied', { length: 10, fixedCount: 2, randomCount: 3 }],
];
let degenerateOk = true;
cases.forEach(([name, opts]) => {
  try {
    const res = selectByTopic(Object.assign({ topicOf: grade8Topics, shuffle: makeShuffle(seeded(3)) }, opts));
    const want = Math.min(opts.length, Math.max(0, opts.fixedCount) + Math.max(0, opts.randomCount));
    const ok = res.indices.length === Math.min(want, opts.length)
      && new Set(res.indices).size === res.indices.length
      && res.indices.every((i) => i >= 0 && i < opts.length);
    if (!ok) { degenerateOk = false; out.push('FAIL  degenerate: ' + name + ' -> ' + JSON.stringify(res.indices)); }
  } catch (e) {
    degenerateOk = false;
    out.push('FAIL  degenerate: ' + name + ' threw ' + e.message);
  }
});
check('degenerate inputs stay in bounds', degenerateOk);

// --- every page is wired to the shared module ---
const PAGES = [
  'FINAL GRADE 7 RMA/G7 RMA1 V1.html',
  'RMA G8 V2/G8 RMA V5.html',
  'RMA G9 V1/rmag9 v3.html',
  'RMA G10 V1/g10rma v4.html',
];
const fs = require('fs');
const ROOT = path.join(__dirname, '..');
PAGES.forEach((p) => {
  const html = fs.readFileSync(path.join(ROOT, p), 'utf8');
  check(`${p} loads rma-selection.js`, /<script src="\.\.\/rma-selection\.js"><\/script>/.test(html));
  check(`${p} calls RMASelection.selectByTopic`, /RMASelection\.selectByTopic\(/.test(html));
  check(`${p} keeps getMathObjective for tagging`, /getMathObjective\(/.test(html));
  check(`${p} has no leftover flat-pool slice`, !/randomPoolIndices\.slice\(/.test(html));
});

console.log(out.join('\n'));
const fails = out.filter((r) => r.startsWith('FAIL')).length;
console.log(fails ? `\n${fails} FAILED (${out.length - fails}/${out.length} passed)` : `\nALL CHECKS PASSED (${out.length})`);
if (fails) process.exit(1);