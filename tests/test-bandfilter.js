const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const src = fs.readFileSync(ROOT + '/teacher-portal.js', 'utf8');
const html = fs.readFileSync(ROOT + '/teacher.html', 'utf8');

const out = [];
const check = (n, c, x) => out.push((c ? 'PASS' : 'FAIL') + '  ' + n + (x ? '  -> ' + x : ''));

// slice the band-filter block plus the status helpers it depends on
const start = src.indexOf('  // WHO NEEDS HELP?');
const end = src.indexOf('  function renderCompletionStatus');
if (start < 0 || end < 0) throw new Error('slice markers missing');
const slice = src.slice(start, end);

const scoreBands = [
  { band_name: 'proficient', min_score: 80, max_score: 100, label: 'Ready / Proficient', color: '#155b30', icon: '✅' },
  { band_name: 'developing', min_score: 60, max_score: 79, label: 'Developing', color: '#c2410c', icon: '🟡' },
  { band_name: 'emerging', min_score: 40, max_score: 59, label: 'Emerging', color: '#c2410c', icon: '🟠' },
  { band_name: 'needs_support', min_score: 0, max_score: 39, label: 'Needs Intensive Support', color: '#991b1b', icon: '🔴' }
];
const escapeHtml = (v) => String(v ?? '');
const els = {};
const document = { getElementById: (id) => (els[id] || (els[id] = { innerHTML: '', textContent: '', value: '' })) };

const api = new Function('scoreBands', 'document', 'escapeHtml',
  'let currentGrade = 8, currentSection = null;\n' + slice +
  '\nreturn { renderPriorityPanel, setPriorityBandFilter, priorityMatchesBand, get priorityFilter() { return priorityBandFilter; } };'
)(scoreBands, document, escapeHtml);

const statusFor = (score, attempt, complete) => {
  if (score === null || score === undefined) {
    return attempt > 0 ? { label: 'Incomplete', className: 'status-incomplete', band: null, state: 'incomplete' }
      : { label: 'Not yet taken', className: 'status-not-taken', band: null, state: 'not-taken' };
  }
  if (complete === false) return { label: 'Incomplete', className: 'status-incomplete', band: null, state: 'incomplete' };
  const band = scoreBands.find((b) => score >= b.min_score && score <= b.max_score);
  return band ? { label: band.label, className: 'status-' + band.band_name, band, state: 'complete' }
    : { label: 'Unknown', className: 'status-pending', band: null, state: 'complete' };
};

const mk = (n, name, score, complete) => ({ student_name: name, student_code: 'RMA-8-00000' + n, section: 'RIZAL',
  score, is_complete: complete, attempt_number: complete === false ? 1 : 2, created_at: '2026-09-29T00:00:00Z',
  status: statusFor(score, complete === false ? 1 : 2, complete) });

const learners = [
  mk(1, 'Dela Cruz, Juan', 30, true),    // needs_support
  mk(2, 'Santos, Maria', 85, true),     // proficient -> excluded from priority
  mk(3, 'Reyes, Carlo', 50, false),     // incomplete
  mk(4, 'Cruz, Anna', 45, true)         // emerging
].filter((r) => !(r.score === 85));

const levels = { proficient: 1, developing: 2, emerging: 1, needs_support: 1 };
const stats = { total: 6, completed: 3, incomplete: 1, notTaken: 2, completionRate: 50,
  notTakenList: [{ student_name: 'Garcia, Leah', student_code: 'RMA-8-000005', section: 'RIZAL' },
                 { student_name: 'Torres, Ana', student_code: 'RMA-8-000006', section: 'MABINI' }],
  incompleteList: [] };

api.renderPriorityPanel(learners, stats, levels);

const chips = () => document.getElementById('priorityFilterContainer').innerHTML;
const list = () => document.getElementById('priorityLearnersContainer').innerHTML;

const chipCount = () => (chips().match(/class="band-chip[ "]/g) || []).length;
check('chips render for all + 4 bands + incomplete + not-taken', chipCount() === 7, String(chipCount()));
check('"All" chip active by default', /class="band-chip active"\s*data-band="all"/.test(chips()));
check('not-taken chip count is 2', /Not yet taken<\/span>\s*<span class="band-chip-count">2</.test(chips()));
check('default list shows all 3 priority learners', (list().match(/student-card-priority/g) || []).length === 3);

// filter: needs_support only
api.setPriorityBandFilter('needs_support');
check('filter needs_support -> 1 learner', (list().match(/student-card-priority/g) || []).length === 1, list().match(/<h4>[^<]+/g));
check('filter label shown', /Needs Intensive Support/.test(list()));
check('"Show all" reset present', /priority-clear/.test(list()));
check('active chip moved to needs_support', /class="band-chip active"\s*data-band="needs_support"[\s\S]{0,60}aria-pressed="true"/.test(chips()));
check('only one chip active at a time', (chips().match(/aria-pressed="true"/g) || []).length === 1);
check('singular wording for 1 learner', /1 learner — Needs Intensive Support/.test(list()), list().match(/\d+ learners?[^<]*/)?.[0]);

// filter: incomplete
api.setPriorityBandFilter('incomplete');
check('filter incomplete -> Reyes only', /Reyes, Carlo/.test(list()) && !/Dela Cruz/.test(list()));

// toggle off
api.setPriorityBandFilter('incomplete');
check('clicking active chip clears filter -> 3 learners', (list().match(/student-card-priority/g) || []).length === 3);

// not-taken
api.setPriorityBandFilter('not-taken');
check('not-taken shows the 2 named learners', (list().match(/student-card-priority/g) || []).length === 2);
check('not-taken shows Garcia + Torres', /Garcia, Leah/.test(list()) && /Torres, Ana/.test(list()));
check('not-taken badge correct', /status-not-taken/.test(list()));
api.setPriorityBandFilter('not-taken');

// empty band
api.setPriorityBandFilter('developing');
check('empty band explains itself', /No learners in Developing/.test(list()));
api.setPriorityBandFilter('developing');

// pluralisation
check('plural wording when unfiltered', /\d+ learners? need support/.test(list()), list().match(/\d+ learners?[^<]*/)?.[0]);

// markup + wiring
check('html has priorityFilterContainer', /id="priorityFilterContainer"/.test(html));
check('html has band-chips container class', /class="band-chips"/.test(html));
check('band chip styles present', /\.band-chip\s*\{/.test(html) && /\.band-chip\.active/.test(html));
check('setPriorityBandFilter exported to window', /window\.setPriorityBandFilter = setPriorityBandFilter/.test(src));
check('click delegation wired', /priorityFilterContainer"\)\.addEventListener\("click"/.test(src));
check('grade change resets filter', /currentGrade = grade;[\s\S]{0,80}priorityBandFilter = null/.test(src));
check('section change resets filter', /currentSection = sectionFilter\.value === "\*" \? null : sectionFilter\.value;[\s\S]{0,80}priorityBandFilter = null/.test(src));
check('stale "Click to view details" removed', !/Click to view details/.test(src));
check('renderPriorityPanel receives levels', /renderPriorityPanel\(priorityLearners, stats, levels\)/.test(src));

console.log(out.join('\n'));
console.log(out.some((r) => r.startsWith('FAIL')) ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED');
if (out.some((r) => r.startsWith('FAIL'))) process.exit(1);
