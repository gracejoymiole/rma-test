const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const portal = fs.readFileSync(ROOT + '/teacher-portal.js', 'utf8');
const html = fs.readFileSync(ROOT + '/teacher.html', 'utf8');
global.window = {};
require(ROOT + '/rma-master-map.js');
const MAP = global.window.RMA_MASTER_MAP;

const out = [];
const check = (n, c, x) => out.push((c ? 'PASS' : 'FAIL') + '  ' + n + (x ? '  -> ' + x : ''));

// --- slice the three new blocks ---
function slice(a, b) {
  const s = portal.indexOf(a), e = portal.indexOf(b);
  if (s < 0 || e < 0) throw new Error('markers missing: ' + a);
  return portal.slice(s, e);
}
const topicBlock = slice('  let mmTopicIndex = null;', '  function renderSelectedReport()');
const exportBlock = slice('  const EXPORT_COLUMNS', '  // AUTHENTICATION');
const statsBlock = slice('  function getCompletionStats(', '  function getPriorityLearners(');

const scoreBands = [
  { band_name: 'proficient', min_score: 80, max_score: 100, label: 'Ready / Proficient', color: '#155b30', icon: '✅' },
  { band_name: 'developing', min_score: 60, max_score: 79, label: 'Developing', color: '#c2410c', icon: '🟡' },
  { band_name: 'emerging', min_score: 40, max_score: 59, label: 'Emerging', color: '#c2410c', icon: '🟠' },
  { band_name: 'needs_support', min_score: 0, max_score: 39, label: 'Needs Intensive Support', color: '#991b1b', icon: '🔴' }
];
const statusFor = (score, attempt = null, isComplete = null) => {
  if (score === null || score === undefined) {
    return attempt > 0 ? { label: 'Incomplete', className: 'status-incomplete', band: null, state: 'incomplete' }
      : { label: 'Not yet taken', className: 'status-not-taken', band: null, state: 'not-taken' };
  }
  if (isComplete === false) return { label: 'Incomplete', className: 'status-incomplete', band: null, state: 'incomplete' };
  const b = scoreBands.find((x) => score >= x.min_score && score <= x.max_score);
  return b ? { label: b.label, className: 'status-' + b.band_name, band: b, state: 'complete' }
    : { label: 'Unknown', className: 'status-pending', band: null, state: 'complete' };
};

globalThis.__printed = '';
globalThis.__els = {};
globalThis.__links = [];
globalThis.__blobs = [];
globalThis.__msg = [];
const PRINT_PREP = `
const window = Object.assign(globalThis.window, {
  open() {
    return { document: { open() {}, write(h) { globalThis.__printed = h; }, close() {} }, focus() {}, print() { globalThis.__printCalled = true; } };
  }
});`;
globalThis.window = Object.assign(globalThis.window, { RMA_MASTER_MAP: MAP });

const PRE = [
  'let currentGrade = 8, currentSection = null, rows = [];',
  'const scoreBands = ' + JSON.stringify(scoreBands) + ';',
  'const statusFor = ' + statusFor.toString() + ';',
  'const msgs = [];',
  'const setMessage = (n, t) => { msgs.push(t); };',
  'const dashboardMessage = {};',
  'const Blob = class { constructor(parts, o) { globalThis.__blobs.push(parts.join("")); this.type = o && o.type; } };',
  'const URL = { createObjectURL: () => "blob:x", revokeObjectURL: () => {} };',
  PRINT_PREP,
  'const document = { createElement: () => ({ click() { globalThis.__links.push(this.download); }, remove() {} }), body: { appendChild() {} }, getElementById: (id) => globalThis.__els[id] || (globalThis.__els[id] = { innerHTML: "", textContent: "", hidden: true, className: "" }) };'
].join('\n');
globalThis.__els = {};
globalThis.__links = [];

const api = new Function(PRE + '\n' + statsBlock + '\n' + topicBlock + '\n' + exportBlock +
  '\nreturn { getWeakTopics, mmTopicLookup, exportRows, exportClassRecords, printClassReport, xmlEscape, getCompletionStats, getLevelDistribution, msgs, getRows: () => rows, setRows: (v) => { rows = v; }, setGrade: (v) => { currentGrade = v; }, setSection: (v) => { currentSection = v; } };')();

// ---------- learning gaps ----------
check('master map loaded for the test', MAP && MAP.questions.length === 448, String(MAP && MAP.questions.length));

const g7 = MAP.questions.filter((q) => q.g === 7 && q.type === 'RMA Original');
check('grade 7 has 21 originals', g7.length === 21, String(g7.length));
const lookup7 = api.mmTopicLookup(7);
check('lookup maps local id -> topic', !!lookup7[1] && !!lookup7[1].topic, JSON.stringify(lookup7[1]));

// Build a real answer string: miss every Number Expressions item, hit the rest.
const g7ByTopic = {};
g7.forEach((q) => { (g7ByTopic[q.topic] = g7ByTopic[q.topic] || []).push(q.id); });
const weakTopic = Object.keys(g7ByTopic)[0];
const missedIds = new Set(g7ByTopic[weakTopic]);
const rmaData = g7.map((q) => (missedIds.has(q.id) ? '0' : '1')).join('|');

const gaps = api.getWeakTopics({ grade: 7, rma_data: rmaData });
check('returns the missed topic', gaps.length === 1 && gaps[0].topic === weakTopic, JSON.stringify(gaps));
check('counts misses correctly', gaps[0].missed === missedIds.size, `${gaps[0].missed} vs ${missedIds.size}`);
check('seen is scoped to the topic, not the grade', gaps[0].seen === missedIds.size, String(gaps[0].seen));
check('all-missed topic scores 0%', gaps[0].rate === 0, String(gaps[0].rate));

// partial miss inside one topic exercises seen/missed/rate independently
const partial = new Set([...missedIds].slice(0, 3));
const rmaPart = g7.map((q) => (partial.has(q.id) ? '0' : '1')).join('|');
const gapPart = api.getWeakTopics({ grade: 7, rma_data: rmaPart })[0];
check('partial miss: missed counted', gapPart.missed === 3, String(gapPart.missed));
check('partial miss: seen is the whole topic', gapPart.seen === missedIds.size, String(gapPart.seen));
check('partial miss: rate computed', gapPart.rate === Math.round(((missedIds.size - 3) / missedIds.size) * 100), String(gapPart.rate));

// two topics missed, ordered worst-first
const twoTopics = Object.keys(g7ByTopic).slice(0, 2);
const bigSet = new Set([...g7ByTopic[twoTopics[0]]]);
const smallSet = new Set(g7ByTopic[twoTopics[1]].slice(0, 1));
const both = new Set([...bigSet, ...smallSet]);
const rma2 = g7.map((q) => (both.has(q.id) ? '0' : '1')).join('|');
const gaps2 = api.getWeakTopics({ grade: 7, rma_data: rma2 });
check('two topics returned, worst first', gaps2.length === 2 && gaps2[0].topic === twoTopics[0], gaps2.map((g) => `${g.topic}:${g.missed}`).join(' | '));
check('limit is respected', api.getWeakTopics({ grade: 7, rma_data: rma2 }, 1).length === 1);
check('perfect score -> no gaps', api.getWeakTopics({ grade: 7, rma_data: g7.map(() => '1').join('|') }).length === 0);
check('no rma_data -> no gaps', api.getWeakTopics({ grade: 7, rma_data: '' }).length === 0);
check('grade 8 carries its own item set', Object.keys(api.mmTopicLookup(8)).length === 38 && Object.keys(api.mmTopicLookup(7)).length === 21, `${Object.keys(api.mmTopicLookup(8)).length}/${Object.keys(api.mmTopicLookup(7)).length}`);
const g8topics = new Set(Object.values(api.mmTopicLookup(8)).map((v) => v.topic));
check('grade 8 exposes grade-specific topics', g8topics.has('Triangles') && g8topics.has('Circles') && !g8topics.has('Set of Ordered Pairs'), [...g8topics].join(' / '));
const g7topics = new Set(Object.values(api.mmTopicLookup(7)).map((v) => v.topic));
check('grade 7 lacks the algebra topics of grade 8', !g7topics.has('Variables') && !g7topics.has('Equations in Graphs'), [...g7topics].join(' / '));
check('grade 8 adds the algebra topics', g8topics.has('Variables') && g8topics.has('Equations in Graphs'));
check('every grade has all five core topics', [7, 8, 9, 10].every((g) => {
  const t = new Set(Object.values(api.mmTopicLookup(g)).map((v) => v.topic));
  return ['Number Expressions', 'Data', 'Coordinates (Points)', 'Triangles', 'Circles'].every((x) => t.has(x));
}));
check('lookups are cached per grade, not shared', api.mmTopicLookup(8) !== api.mmTopicLookup(7));
check('aligned questions excluded from lookup', !Object.values(api.mmTopicLookup(10)).some((v) => !v.topic));
check('master map items carry real topic names', gaps2.every((g) => MAP.topics.includes(g.topic)));

// ---------- export ----------
api.setRows([
  { student_code: 'RMA-8-000002', student_name: 'Santos, Maria', grade: 8, section: 'RIZAL', score: 85, is_complete: true, attempt_number: 2, attempts: 2, created_at: '2026-09-29T02:00:00Z' },
  { student_code: 'RMA-8-000001', student_name: 'Dela Cruz, Juan', grade: 8, section: 'BONIFACIO', score: 30, is_complete: true, attempt_number: 1, attempts: 1, created_at: '2026-09-28T02:00:00Z' },
  { student_code: 'RMA-8-000003', student_name: 'Reyes, Carlo', grade: 8, section: 'RIZAL', score: 50, is_complete: false, attempt_number: 1, attempts: 1, created_at: '2026-09-27T02:00:00Z' },
  { student_code: 'RMA-8-000004', student_name: 'Garcia, Leah', grade: 8, section: 'RIZAL', score: null, attempt_number: 0, attempts: 0 },
  { student_code: 'RMA-9-000001', student_name: 'Other Grade', grade: 9, section: 'RIZAL', score: 50, attempt_number: 1 }
]);
api.setGrade(8); api.setSection(null);
const xrows = api.exportRows();
check('export is scoped to the selected grade', xrows.length === 4, String(xrows.length));
check('export excludes other grades', !xrows.some((r) => r[2] === 9));
check('export sorted by section then name', xrows.map((r) => r[3]).join(',') === 'BONIFACIO,RIZAL,RIZAL,RIZAL', xrows.map((r) => r[3]).join(','));
check('proficient level label present', xrows.some((r) => r[6] === 'Ready / Proficient'));
check('incomplete learner has blank level', xrows.find((r) => r[0] === 'RMA-8-000003')[6] === '');
check('incomplete learner status correct', xrows.find((r) => r[0] === 'RMA-8-000003')[7] === 'Incomplete');
check('not-taken learner status correct', xrows.find((r) => r[0] === 'RMA-8-000004')[7] === 'Not yet taken');
check('not-taken has empty score and percentage', xrows.find((r) => r[0] === 'RMA-8-000004')[4] === '' && xrows.find((r) => r[0] === 'RMA-8-000004')[5] === '');
check('score 0 is not blanked', (() => { api.getRows()[1].score = 0; const r = api.exportRows().find((x) => x[0] === 'RMA-8-000001'); api.getRows()[1].score = 30; return r[4] === 0; })());
check('10 columns', xrows[0].length === 10, String(xrows[0].length));

globalThis.__links = []; api.msgs.length = 0;
api.exportClassRecords();
check('export triggers a download', globalThis.__links.length === 1, JSON.stringify(globalThis.__links));
check('filename includes grade and scope', /^RMA-Pathways-Grade8-AllSections\.xls$/.test(globalThis.__links[0] || ''), globalThis.__links[0]);
check('export confirms to the teacher', /Exported 4 learner records/.test(api.msgs.join(' ')), api.msgs.join(' | '));

api.setSection('RIZAL'); globalThis.__links = []; api.msgs.length = 0;
api.exportClassRecords();
check('section-scoped filename', /^RMA-Pathways-Grade8-RIZAL\.xls$/.test(globalThis.__links[0] || ''), globalThis.__links[0]);
check('section-scoped row count', /Exported 3 learner records/.test(api.msgs.join(' ')), api.msgs.join(' | '));

api.setGrade(null); api.msgs.length = 0;
api.exportClassRecords();
check('export refuses without a grade', /Choose a grade level first/.test(api.msgs.join(' ')));
api.setGrade(8);

// escaping
check('xmlEscape handles ampersands', api.xmlEscape('a&b') === 'a&amp;b');
check('xmlEscape handles quotes', api.xmlEscape('a"b') === 'a&quot;b');
check('xmlEscape handles null', api.xmlEscape(null) === '');

// ---------- print report ----------
api.setGrade(null); api.msgs.length = 0; globalThis.__printed = '';
api.printClassReport();
check('print refuses without a grade', /Choose a grade level first/.test(api.msgs.join(' ')));
check('nothing printed without a grade', globalThis.__printed === '');

api.setGrade(8); api.setSection(null); api.msgs.length = 0;
globalThis.__printed = ''; globalThis.__printCalled = false;
api.printClassReport();
const html2 = globalThis.__printed;

check('print opens a document', html2.length > 500, String(html2.length));
check('print has DepEd letterhead', /REPUBLIC OF THE PHILIPPINES/.test(html2) && /DEPARTMENT OF EDUCATION/.test(html2));
check('print has report title', /CLASS PROGRESS REPORT/.test(html2));
check('print has blank School field', /<span>School:<\/span><i><\/i>/.test(html2));
check('print has blank Teacher field', /<span>Teacher:<\/span><i><\/i>/.test(html2));
check('print has blank School Year field', /<span>School Year:<\/span><i><\/i>/.test(html2));
check('print shows the active scope', /Grade 8 - All Sections/.test(html2));
check('print lists one row per learner in scope', (html2.match(/<tr>\s*<td>\d+<\/td>/g) || []).length === 4, String((html2.match(/<tr>\s*<td>\d+<\/td>/g) || []).length));
check('print includes learner names', /Santos, Maria/.test(html2) && /Dela Cruz, Juan/.test(html2));
check('print shows a Status column', /<th>Status<\/th>/.test(html2));
check('print shows Not yet taken status', /Not yet taken/.test(html2));
check('print shows Incomplete status', /Incomplete/.test(html2));
check('print shows band summary pills', /Ready \/ Proficient/.test(html2));
check('print shows incomplete and not-taken counts', /Incomplete: <b>1<\/b>/.test(html2) && /Not yet taken: <b>1<\/b>/.test(html2));
check('print shows completion rate', /4 learners/.test(html2) && /Completion 50%/.test(html2), (html2.match(/Completion \d+%/) || [])[0]);
check('print carries a privacy footer', /protected learner information/.test(html2));
check('print is print-styled', /@media print/.test(html2) && /@page/.test(html2));

api.setSection('RIZAL'); globalThis.__printed = '';
api.printClassReport();
check('print honours the section scope', /Grade 8 - RIZAL/.test(globalThis.__printed) && (globalThis.__printed.match(/<tr>\s*<td>\d+<\/td>/g) || []).length === 3);

api.setGrade(9); api.setSection(null); api.setRows([]); api.msgs.length = 0;
api.printClassReport();
check('print blocks on an empty scope', /No learners in this scope to print/.test(api.msgs.join(' ')));

// ---------- markup / wiring ----------
check('html has export button', /id="exportClassRecords"/.test(html));
check('html has print button', /id="printClassReport"/.test(html));
check('html has gap summary', /id="priorityGapSummary"/.test(html));
check('export + print exported to window', /window\.exportClassRecords = exportClassRecords/.test(portal) && /window\.printClassReport = printClassReport/.test(portal));
check('buttons wired by id', /getElementById\("exportClassRecords"\)\.addEventListener/.test(portal) && /getElementById\("printClassReport"\)\.addEventListener/.test(portal));
check('export uses no external library', !/xlsx|SheetJS/.test(portal));
check('weak topic styles present', /\.weak-topics/.test(html) && /\.gap-summary/.test(html));
check('priority card renders "Needs support in"', /Needs support in/.test(portal));
check('priority learners carry weakTopics', /weakTopics: getWeakTopics\(r\)/.test(portal));

// ---------- output escaping (run last: it changes the row count) ----------
api.setGrade(8); api.setSection(null);
api.setRows([{ student_code: 'RMA-8-000009', student_name: '<script>alert(1)</script> O\'Neil & Co', grade: 8, section: 'RIZAL', score: 70, is_complete: true, attempt_number: 1 }]);
globalThis.__links = [];
api.exportClassRecords();
const xssXml = globalThis.__blobs.join('');
check('export escapes a hostile name', !xssXml.includes('<script>alert(1)</script>') && xssXml.includes('&lt;script&gt;'), xssXml.slice(-160));
check('export escapes quotes and ampersands', xssXml.includes('&amp;') && xssXml.includes('&apos;'), xssXml.slice(-160));

globalThis.__printed = '';
api.printClassReport();
check('print escapes a hostile name', !globalThis.__printed.includes('<script>alert(1)</script>') && globalThis.__printed.includes('&lt;script&gt;'));

(async () => {
  await new Promise((r) => setTimeout(r, 600));
  check('print triggers the print dialog', globalThis.__printCalled === true);
  console.log(out.join('\n'));
  console.log(out.some((r) => r.startsWith('FAIL')) ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED');
  console.log(`${out.filter((r) => r.startsWith('PASS')).length}/${out.length} passed`);
})();
