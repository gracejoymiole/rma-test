const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const portal = fs.readFileSync(ROOT + '/teacher-portal.js', 'utf8');
const start = portal.indexOf('// MASTER MAP (Grades 7-10)');
const end = portal.indexOf('// PHASE 1: CONFIGURABLE SCORE BANDS');
if (start < 0 || end < 0) throw new Error('slice markers not found');
const slice = portal.slice(start, end);

const makeEl = (id) => ({
  id, innerHTML: '', textContent: '', value: 'all', dataset: {},
  addEventListener() {}, insertAdjacentHTML(_p, html) { this.html = (this.html || '') + html; }
});
const els = {};
const document = {
  getElementById(id) { return els[id] || (els[id] = makeEl(id)); }
};
const window = {};
global.window = window;
global.document = document;
require(ROOT + '/rma-master-map.js');

const escapeHtml = (v) => String(v ?? '');
const fn = new Function('document', 'window', 'escapeHtml', slice + '\nreturn { initMasterMap, renderMasterMap, mmReadFilters, renderBlueprint, resetMasterMapFilters, mmMatches };');
const api = fn(document, window, escapeHtml);

const results = [];
const check = (name, cond, extra) => results.push((cond ? 'PASS' : 'FAIL') + '  ' + name + (extra ? '  -> ' + extra : ''));

check('initMasterMap bootstraps', api.initMasterMap() === true);
check('grade options added', (els.mmGrade.html || '').includes('Grade 10'));
check('topic options added', (els.mmTopic.html || '').includes('Equations in Graphs'));
check('source note set', els.masterMapSource.textContent.includes('RMA_Grade7-10_Complete_Question_Mapping.xlsx'));

// all rows
els.mmSearch.value = '';
api.renderMasterMap();
check('all grades -> 448 rows', els.masterMapCount.textContent.includes('448 of 448'), els.masterMapCount.textContent);
check('summary rendered', (els.masterMapSummary.innerHTML.match(/metric/g) || []).length === 4);
check('blueprint 47 items', (els.blueprintRows.innerHTML.match(/<tr>/g) || []).length === 47);

// grade filter
els.mmGrade.value = '7';
api.renderMasterMap();
check('grade 7 -> 72 rows', els.masterMapCount.textContent.includes('72 of 448'), els.masterMapCount.textContent);
check('grade 7 rows all tagged grade 7', !els.masterMapRows.innerHTML.includes('Grade 8'));

// topic filter
els.mmTopic.value = 'Triangles';
api.renderMasterMap();
check('G7 + Triangles -> 14 rows', els.masterMapCount.textContent.includes('14 of 448'), els.masterMapCount.textContent);

// reset
api.resetMasterMapFilters();
check('reset restores 448', els.masterMapCount.textContent.includes('448 of 448'));
check('reset clears search', els.mmSearch.value === '');

// source type
els.mmType.value = 'RMA Aligned';
api.renderMasterMap();
check('aligned only = 297', els.masterMapCount.textContent.includes('297 of 448'), els.masterMapCount.textContent);
api.resetMasterMapFilters();

// search
els.mmSearch.value = 'purok';
api.renderMasterMap();
const n = parseInt(els.masterMapCount.textContent.replace(/[^0-9]/g, '').slice(0, 3), 10);
check('search "purok" returns rows', n > 0, els.masterMapCount.textContent);
api.resetMasterMapFilters();

// numeric search hits RMA item column
els.mmSearch.value = '15';
api.renderMasterMap();
check('search "15" -> 2 rows (RMA item 15)', els.masterMapCount.textContent.includes('2 of 448'), els.masterMapCount.textContent);

// no-match state
els.mmSearch.value = 'zzzzz';
api.renderMasterMap();
check('no-match message', els.masterMapRows.innerHTML.includes('No questions match'));
check('no-match counts 0', els.masterMapSummary.innerHTML.includes('<b>0</b>'));
api.resetMasterMapFilters();

// topic counts
const counts = els.masterMapTopicCounts.innerHTML.match(/<strong>[^<]+<\/strong>/g) || [];
check('topic breakdown lists 7 topics', counts.length === 7, counts.join(' | '));

console.log(results.join('\n'));
console.log(results.some((r) => r.startsWith('FAIL')) ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED');
