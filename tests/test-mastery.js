// The Question Map tab used to render every question with a hardcoded
// masteryRate of 0, so the "High" and "Medium" filters always returned nothing
// and "Low" returned everything. These checks pin real mastery computation.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const out = [];
const check = (n, c, x) => out.push((c ? 'PASS' : 'FAIL') + '  ' + n + (x ? '  -> ' + x : ''));

const portal = fs.readFileSync(path.join(ROOT, 'teacher-portal.js'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'teacher.html'), 'utf8');

// slice the mastery functions out of the portal
const start = portal.lastIndexOf('/**', portal.indexOf('* Real per-question accuracy'));
const end = portal.lastIndexOf('/**', portal.indexOf('* Render all questions with filters'));
if (start < 0 || end < 0 || end <= start) throw new Error('mastery block not found');
const block = portal.slice(start, end);

const api = new Function(
  'rows', 'currentGrade',
  'let questionMastery = new Map();\n' + block +
  '\nreturn { computeQuestionMastery, masteryFor, get: () => questionMastery };'
)([], 10);

// --- the dead no-op is gone ---
check('dead updateQuestionMasteryFromData removed', !/updateQuestionMasteryFromData/.test(portal));
check('no "would update in actual implementation" stub remains', !/would update mastery in actual implementation/.test(portal));
check('mastery is computed from rows', /computeQuestionMastery\(\);/.test(portal));

// --- id format: rma_data item N maps to RMA-Q<grade>-NN, zero padded ---
const row = (grade, bits) => ({
  grade, score: 80, is_complete: true,
  rma_data: bits.map((b) => (b ? '1' : '0')).join('|'), bank_data: ''
});
const set = (g, rows) => new Function('rows', 'currentGrade',
  'let questionMastery = new Map();\n' + block +
  '\ncomputeQuestionMastery(); return questionMastery;')(rows, g);

// Read through a safe accessor so a regression reports as FAIL lines with a
// useful message instead of a stack trace on an undefined lookup.
const rate = (map, id) => (map.get(id) || {}).rate;
const cell = (map, id) => (map.get(id) || {});

const ten = set(10, [row(10, [1, 1, 0]), row(10, [1, 0, 0])]);
check('item 1 keyed as RMA-Q10-01', ten.has('RMA-Q10-01'), [...ten.keys()].join(','));
check('zero-padded ids, not RMA-Q10-1', !ten.has('RMA-Q10-1'));
check('rate for item 1 is 100%', rate(ten, 'RMA-Q10-01') === 100, String(rate(ten, 'RMA-Q10-01')));
check('rate for item 2 is 50%', rate(ten, 'RMA-Q10-02') === 50, String(rate(ten, 'RMA-Q10-02')));
check('rate for item 3 is 0%', rate(ten, 'RMA-Q10-03') === 0, String(rate(ten, 'RMA-Q10-03')));
check('counts recorded for item 2', cell(ten, 'RMA-Q10-02').correct === 1 && cell(ten, 'RMA-Q10-02').count === 2,
  JSON.stringify(cell(ten, 'RMA-Q10-02')));

// --- scoping ---
const mixed = set(10, [row(10, [1]), row(8, [0]), row(9, [0])]);
check('only the selected grade counts', mixed.size === 1 && mixed.has('RMA-Q10-01'), [...mixed.keys()].join(','));
check('other grades excluded from a grade 10 view', !mixed.has('RMA-Q8-01'));

// --- incomplete and not-taken attempts are not mastery evidence ---
const withBad = set(10, [
  { grade: 10, score: 90, is_complete: false, rma_data: '1|1|1|1', bank_data: '' },
  { grade: 10, score: null, is_complete: true, rma_data: '0|0|0|0', bank_data: '' },
  row(10, [1, 1])
]);
check('incomplete attempt excluded', cell(withBad, 'RMA-Q10-01').count === 1, String(cell(withBad, 'RMA-Q10-01').count));
check('not-taken attempt excluded', cell(withBad, 'RMA-Q10-02').count === 1, String(cell(withBad, 'RMA-Q10-02').count));
check('excluded attempts did not skew the rate', rate(withBad, 'RMA-Q10-01') === 100, String(rate(withBad, 'RMA-Q10-01')));

// --- malformed data does not produce bogus keys ---
const messy = set(10, [{ grade: 10, score: 50, is_complete: true, rma_data: '1|x||1|', bank_data: '' }]);
check('non-bit tokens skipped', messy.size === 2 && messy.has('RMA-Q10-01') && messy.has('RMA-Q10-04'),
  [...messy.keys()].join(','));
check('empty rma_data yields nothing', set(10, [{ grade: 10, score: 50, rma_data: '', bank_data: '' }]).size === 0);
check('no rows yields nothing', set(10, []).size === 0);

// --- grade 7 has 21 items, so item 21 must key as RMA-Q7-21 ---
const g7 = set(7, [row(7, new Array(21).fill(1))]);
check('grade 7 keys all 21 items', g7.size === 21, String(g7.size));
check('last grade 7 item keyed RMA-Q7-21', g7.has('RMA-Q7-21'));

// --- the UI must not claim a band for items with no data ---
check('no-data band exists', /mastery-none/.test(portal) && /\.mastery-none/.test(html));
check('card marks whether mastery exists', /data-has-mastery="\$\{rate === null \? 'no' : 'yes'\}"/.test(portal));
check('filter excludes no-data items from every band', /card\.dataset\.hasMastery !== 'yes'/.test(portal));
check('mastery badge always renders', !/question\.masteryRate > 0 \?/.test(portal));
check('mastery no longer read off the static question object', !/question\.masteryRate/.test(portal));
check('bank data is not parsed for mastery', !/row\.bank_data|bank_data\s*\)/.test(block));
check('the reason bank data is skipped is documented', /bank_data/.test(block));

// --- the tab heading no longer claims completeness ---
check('heading drops the word Complete', !/Complete Question Map/.test(html));
check('heading points at the Master Map for full coverage', /Master Map<\/button>/.test(html));
check('filter option relabelled from All Levels', /<option value="all">All Items<\/option>/.test(html));
check('mastery-none and count styles defined', /\.mastery-none/.test(html) && /\.mastery-count/.test(html));
check('link-btn style defined', /\.link-btn/.test(html));

console.log(out.join('\n'));
const fails = out.filter((r) => r.startsWith('FAIL')).length;
console.log(fails ? `\n${fails} FAILED` : '\nALL CHECKS PASSED');
console.log(`${out.length - fails}/${out.length} passed`);
if (fails) process.exit(1);