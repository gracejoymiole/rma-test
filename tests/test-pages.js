// The four grade pages are standalone HTML with large inline scripts. Extract
// each inline script and syntax-check it, so an edit that breaks the page is
// caught here rather than in a student's browser.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PAGES = [
  'FINAL GRADE 7 RMA/G7 RMA1 V1.html',
  'RMA G8 V2/G8 RMA V5.html',
  'RMA G9 V1/rmag9 v3.html',
  'RMA G10 V1/g10rma v4.html',
];

const out = [];
const check = (n, c, x) => out.push((c ? 'PASS' : 'FAIL') + '  ' + n + (x ? '  -> ' + x : ''));

PAGES.forEach((rel) => {
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const biggest = scripts.reduce((a, b) => (b.length > a.length ? b : a), '');
  try {
    new vm.Script(biggest, { filename: rel });
    check(`${path.basename(rel)} inline script parses`, true, `${biggest.length} chars, ${scripts.length} script block(s)`);
  } catch (e) {
    check(`${path.basename(rel)} inline script parses`, false, e.message);
  }
  // The selection call must sit inside initGame, after rawQuestions is defined.
  const order = [
    ['const rawQuestions', /const rawQuestions\s*=/],
    ['RMASelection.selectByTopic', /RMASelection\.selectByTopic\(/],
    ['activeQuestions assignment', /gameState\.activeQuestions\s*=/],
  ].map(([label, re]) => ({ label, at: html.search(re) }));
  const monotonic = order.every((o) => o.at >= 0) &&
    order.every((o, i) => i === 0 || o.at > order[i - 1].at);
  check(`${path.basename(rel)} selection runs after rawQuestions is defined`, monotonic,
    order.map((o) => o.label + '=' + o.at).join(' '));
});

console.log(out.join('\n'));
const fails = out.filter((r) => r.startsWith('FAIL')).length;
console.log(fails ? `\n${fails} FAILED` : `\nALL CHECKS PASSED (${out.length})`);
if (fails) process.exit(1);