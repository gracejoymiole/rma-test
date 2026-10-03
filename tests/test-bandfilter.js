const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const src = fs.readFileSync(ROOT + '/teacher-portal.js', 'utf8');
const html = fs.readFileSync(ROOT + '/teacher.html', 'utf8');

const out = [];
const check = (n, c, x) => out.push((c ? 'PASS' : 'FAIL') + '  ' + n + (x ? '  -> ' + x : ''));

// slice the band-filter block plus the predicate it depends on
const start = src.indexOf('  function getScopedLearners');
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
  '\nreturn { renderPriorityPanel, setPriorityBandFilter, priorityMatchesBand, needsAttention, get priorityFilter() { return priorityBandFilter; } };'
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

// A learner who never sat the test has no rma_scores row at all, and
// rma_teacher_dashboard returns coalesce(attempt_number, 0) for them. Passing a
// higher attempt number would make statusFor read them as "Incomplete" instead
// of "Not yet taken", which is not what the portal ever sees.
const mk = (n, name, score, complete, attempt) => {
  const attemptNumber = attempt !== undefined ? attempt : (complete === false ? 1 : 2);
  return { student_name: name, student_code: 'RMA-8-00000' + n, section: 'RIZAL',
    score, is_complete: complete, attempt_number: attemptNumber, created_at: '2026-09-29T00:00:00Z',
    weakTopics: [], status: statusFor(score, attemptNumber, complete) };
};

// Every learner in scope, including the ones that are doing fine. The bug this
// guards against was building the chip counts from this list but filtering a
// list that had already thrown proficient and developing learners away.
// Not-taken learners belong here too: rma_teacher_dashboard returns them, which
// is why stats.total counts them, so the scope has to match or "All learners"
// would show fewer than its own count.
const scoped = [
  mk(1, 'Dela Cruz, Juan', 30, true),    // needs_support
  mk(2, 'Santos, Maria', 85, true),     // proficient
  mk(3, 'Reyes, Carlo', 50, false),     // incomplete (scored 50)
  mk(4, 'Cruz, Anna', 45, true),        // emerging
  mk(5, 'Bautista, Liza', 70, true),    // developing
  mk(6, 'Ocampo, Rica', 95, true),      // proficient
  mk(7, 'Garcia, Leah', null, true, 0), // not yet taken
  mk(8, 'Torres, Ana', null, true, 0)   // not yet taken
];
const priority = scoped.filter((l) => api.needsAttention(l));

const levels = { proficient: 2, developing: 1, emerging: 1, needs_support: 1 };
const stats = { total: 8, completed: 5, incomplete: 1, notTaken: 2, completionRate: 63,
  notTakenList: [{ student_name: 'Garcia, Leah', student_code: 'RMA-8-000007', section: 'RIZAL' },
                 { student_name: 'Torres, Ana', student_code: 'RMA-8-000008', section: 'MABINI' }],
  incompleteList: [] };

api.renderPriorityPanel(priority, scoped, stats, levels);

const chips = () => document.getElementById('priorityFilterContainer').innerHTML;
const list = () => document.getElementById('priorityLearnersContainer').innerHTML;
const cards = () => (list().match(/student-card-priority/g) || []).length;
const names = () => (list().match(/<h4>([^<]+)<\/h4>/g) || []).map((s) => s.replace(/<\/?h4>/g, ''));

const chipCount = () => (chips().match(/class="band-chip[ "]/g) || []).length;
check('chips render for needs-help + 4 bands + incomplete + not-taken + all', chipCount() === 8, String(chipCount()));
check('"Needs help" chip is active by default', /class="band-chip active"\s*data-band="needs-help"/.test(chips()));
check('default list shows only the 3 learners who need help', cards() === 3, String(cards()));
check('default list excludes proficient and developing learners',
  !/Santos, Maria/.test(list()) && !/Bautista, Liza/.test(list()));

// The reported bug: these two bands are selectable but could never match,
// because the list they were filtered from excluded them by construction.
api.setPriorityBandFilter('proficient');
check('filter proficient -> the 2 proficient learners', cards() === 2, String(cards()));
check('filter proficient shows the right names',
  /Santos, Maria/.test(list()) && /Ocampo, Rica/.test(list()) && !/Dela Cruz/.test(list()));
api.setPriorityBandFilter('developing');
check('filter developing -> the 1 developing learner', cards() === 1, String(cards()));
check('filter developing shows Bautista', /Bautista, Liza/.test(list()));
api.setPriorityBandFilter('emerging');
check('filter emerging -> Cruz, Anna', cards() === 1 && /Cruz, Anna/.test(list()));
api.setPriorityBandFilter('needs_support');
check('filter needs_support -> Dela Cruz', cards() === 1 && /Dela Cruz, Juan/.test(list()));
check('filter label shown', /Needs Intensive Support/.test(list()));
check('"Show all" reset present', /priority-clear/.test(list()));
check('only one chip active at a time', (chips().match(/aria-pressed="true"/g) || []).length === 1);
check('singular wording for 1 learner', /1 learner — Needs Intensive Support/.test(list()), list().match(/\d+ learners?[^<]*/)?.[0]);

// The invariant that matters: a chip's count must equal what it displays.
const chipCountFor = (key) => {
  const re = new RegExp('data-band="' + key + '"[\\s\\S]*?band-chip-count">(\\d+)');
  return Number((chips().match(re) || [])[1]);
};
let mismatches = [];
['needs-help', 'proficient', 'developing', 'emerging', 'needs_support', 'incomplete', 'not-taken', 'all']
  .forEach((key) => {
    api.setPriorityBandFilter(key);
    const shown = key === 'not-taken' ? 2 : cards();
    if (chipCountFor(key) !== shown) mismatches.push(key + ': chip=' + chipCountFor(key) + ' shown=' + shown);
  });
check('every chip count equals the learners it shows', mismatches.length === 0, mismatches.join('; '));

api.setPriorityBandFilter('incomplete');
check('filter incomplete -> Reyes only', /Reyes, Carlo/.test(list()) && !/Dela Cruz/.test(list()));

// Clicking the active chip returns to the default group, not to an undefined
// state that would silently list every learner under a "needs help" heading.
api.setPriorityBandFilter('incomplete');
check('clicking the active chip returns to needs-help', api.priorityFilter === 'needs-help' && cards() === 3,
  api.priorityFilter + ' / ' + cards());

api.setPriorityBandFilter('all');
check('all learners shows every scoped learner', cards() === 8, String(cards()));
check('all learners label is unadorned', /^8 learners/.test(list().replace(/<[^>]+>/g, '').trim()));

// not-taken
api.setPriorityBandFilter('not-taken');
check('not-taken shows the 2 named learners', cards() === 2);
check('not-taken shows Garcia + Torres', /Garcia, Leah/.test(list()) && /Torres, Ana/.test(list()));
check('not-taken badge correct', /status-not-taken/.test(list()));
check('not-taken reset button points at all learners', /setPriorityBandFilter\('all'\)/.test(list()));

// A band with nobody in it has to say so, not render an unexplained blank card.
api.renderPriorityPanel(
  priority,
  scoped.filter((l) => !l.status.band || l.status.band.band_name !== 'developing'),
  stats, levels);
api.setPriorityBandFilter('developing');
check('empty band explains itself', /No learners in Developing/.test(list()),
  list().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 100));

// markup + wiring
check('html has priorityFilterContainer', /id="priorityFilterContainer"/.test(html));
check('html has band-chips container class', /class="band-chips"/.test(html));
check('band chip styles present', /\.band-chip\s*\{/.test(html) && /\.band-chip\.active/.test(html));
check('setPriorityBandFilter exported to window', /window\.setPriorityBandFilter = setPriorityBandFilter/.test(src));
check('click delegation wired', /priorityFilterContainer"\)\.addEventListener\("click"/.test(src));
check('grade change resets to the default group', /currentGrade = grade;[\s\S]{0,80}priorityBandFilter = NEEDS_HELP/.test(src));
check('section change resets to the default group', /currentSection = sectionFilter\.value === "\*" \? null : sectionFilter\.value;[\s\S]{0,80}priorityBandFilter = NEEDS_HELP/.test(src));
check('stale "Click to view details" removed', !/Click to view details/.test(src));
check('renderPriorityPanel receives the scoped list', /renderPriorityPanel\(priorityLearners, scopedLearners, stats, levels\)/.test(src));

console.log(out.join('\n'));
console.log(out.some((r) => r.startsWith('FAIL')) ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED');
if (out.some((r) => r.startsWith('FAIL'))) process.exit(1);
