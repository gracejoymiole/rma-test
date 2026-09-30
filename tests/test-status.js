const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const src = fs.readFileSync(ROOT + '/teacher-portal.js', 'utf8');
const start = src.indexOf('function statusFor');
const end = src.indexOf('function renderDashboardOverview');
const slice = src.slice(start, end);

// getPriorityLearners now derives learning gaps, which lives further down the file.
const gapStart = src.indexOf('let mmTopicIndex = null;');
const gapEnd = src.indexOf('function renderSelectedReport()');
if (gapStart < 0 || gapEnd < 0) throw new Error('learning-gap block not found');
const gapSlice = src.slice(gapStart, gapEnd);

const mapWin = {};
global.window = mapWin;
require(ROOT + '/rma-master-map.js');
const MAP = mapWin.RMA_MASTER_MAP;

const out = [];
const check = (n, c, x) => out.push((c ? 'PASS' : 'FAIL') + '  ' + n + (x ? '  -> ' + x : ''));

const scoreBands = [
  { band_name: 'proficient', min_score: 80, max_score: 100, label: 'Ready / Proficient' },
  { band_name: 'developing', min_score: 60, max_score: 79, label: 'Developing' },
  { band_name: 'emerging', min_score: 40, max_score: 59, label: 'Emerging' },
  { band_name: 'needs_support', min_score: 0, max_score: 39, label: 'Needs Intensive Support' }
];
let currentGrade = 8;
let currentSection = null;
const escapeHtml = (v) => String(v ?? '');
const els = {};
const document = { getElementById: (id) => (els[id] || (els[id] = { innerHTML: '', textContent: '' })) };

const api = new Function('scoreBands', 'document', 'escapeHtml', 'window',
  'let currentGrade = 8, currentSection = null;\n' + gapSlice + '\n' + slice + '\nreturn { statusFor, getCompletionStats, getLevelDistribution, getPriorityLearners, renderCompletionStatus, getWeakTopics };'
)(scoreBands, document, escapeHtml, mapWin);

const mk = (o) => ({ grade: 8, section: 'RIZAL', student_name: o.name, student_code: 'RMA-8-00000' + (o.n || 1), ...o });

// --- statusFor: three states ---
check('no score + no attempt -> Not yet taken', api.statusFor(null, 0, null).label === 'Not yet taken');
check('no score + attempt > 0 -> Incomplete', api.statusFor(null, 1, null).label === 'Incomplete');
check('score + is_complete=false -> Incomplete', api.statusFor(85, 1, false).label === 'Incomplete', api.statusFor(85, 1, false).label);
check('score 85 + complete -> Proficient', api.statusFor(85, 1, true).label === 'Ready / Proficient');
check('score 45 -> Emerging band', api.statusFor(45, 1, true).band.band_name === 'emerging');
check('incomplete state sorts before bands', api.statusFor(50, 1, false).state === 'incomplete');

// --- getCompletionStats ---
const rows = [
  mk({ n: 1, name: 'Dela Cruz, Juan', score: 85, is_complete: true, attempt_number: 2 }),
  mk({ n: 2, name: 'Santos, Maria', score: 50, is_complete: false, attempt_number: 1 }),
  mk({ n: 3, name: 'Reyes, Carlo', score: null, is_complete: null, attempt_number: 0 }),
  mk({ n: 4, name: 'Cruz, Anna', score: 30, is_complete: true, attempt_number: 1 }),
  mk({ n: 5, name: 'Garcia, Leah', score: null, is_complete: null, attempt_number: 0 })
];
const stats = api.getCompletionStats(rows, 8, null);
check('total = 5', stats.total === 5, String(stats.total));
check('completed = 2 (incomplete excluded)', stats.completed === 2, String(stats.completed));
check('incomplete = 1', stats.incomplete === 1, String(stats.incomplete));
check('notTaken = 2', stats.notTaken === 2, String(stats.notTaken));
check('completionRate = 40%', stats.completionRate === 40, String(stats.completionRate));
check('incompleteList has Maria', stats.incompleteList.length === 1 && /Maria/.test(stats.incompleteList[0].student_name));
check('notTakenList has 2', stats.notTakenList.length === 2);

// --- priority learners must include the incomplete learner ---
const priority = api.getPriorityLearners(rows, 8, null);
const names = priority.map((p) => p.student_name);
check('incomplete learner is in priority list', names.some((n) => /Maria/.test(n)), names.join(' | '));
check('low scorer (30%) is in priority list', names.some((n) => /Cruz, Anna/.test(n)));
check('proficient learner excluded', !names.some((n) => /Dela Cruz/.test(n)));
check('not-taken excluded from priority', !names.some((n) => /Reyes/.test(n)));
check('incomplete sorted first', /Maria/.test(names[0]), names.join(' | '));

// --- level distribution ignores incomplete ---
const levels = api.getLevelDistribution(rows, 8, null);
check('emerging count = 0 (Maria is incomplete)', levels.emerging === 0, JSON.stringify(levels));
check('needs_support count = 1', levels.needs_support === 1);
check('proficient count = 1', levels.proficient === 1);

// --- completion card renders the three states ---
api.renderCompletionStatus(stats);
const card = document.getElementById('completionStatusContainer').innerHTML;
check('card shows Incomplete badge', /⚠️ Incomplete 1/.test(card));
check('card shows Not yet taken badge', /⏳ Not yet taken 2/.test(card));
check('card lists incomplete learner', /Incomplete — started but not finished \(1\)/.test(card) && /Maria/.test(card));

// --- the removed force-default must be gone ---
check('force-default attempt_number removed', !/row\.attempt_number = 1/.test(src));
check('dashboard RPC not re-defaulted', !/attempt_number === undefined \|\| row\.attempt_number === null/.test(src));

// --- every statusFor call site passes is_complete ---
const callSites = src.match(/statusFor\([^)]*\)/g) || [];
check('all statusFor calls pass 3 args', callSites.every((c) => (c.match(/,/g) || []).length >= 2), callSites.join(' '));

console.log(out.join('\n'));
console.log(out.some((r) => r.startsWith('FAIL')) ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED');
