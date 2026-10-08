const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const pages = [
  'FINAL GRADE 7 RMA/G7 RMA1 V1.html',
  'RMA G8 V2/G8 RMA V5.html',
  'RMA G9 V1/rmag9 v3.html',
  'RMA G10 V1/g10rma v4.html',
];

const checks = [];
const check = (name, passed) => checks.push(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const theme = fs.readFileSync(path.join(ROOT, 'rma-theme.js'), 'utf8');

check('misses are grouped by the page skill tag', /groups\[topic\] = \{ indices: \[\], explanation: shortExplanation\(rawIndex\) \}/.test(theme));
check('each skill card offers its own targeted retry', /startTargetedRetry\(groups\[topic\]\.indices\)/.test(theme));
check('targeted practice is explicitly not mastery-scored', /does not change your recorded mastery/.test(theme));
check('targeted finish restores the recorded mastery percent', /state\.masteryPercent \+ "%"/.test(theme));

pages.forEach((relative) => {
  const html = fs.readFileSync(path.join(ROOT, relative), 'utf8');
  const finish = html.slice(html.indexOf('function endGame()'), html.indexOf('// 9. UTILITIES & DATA SUBMISSION'));
  check(`${path.basename(relative)} starts from raw missed item indices`, /gameState\.activeQuestions = rawIndices\.map/.test(theme));
  check(`${path.basename(relative)} skips score submission for retry`, /if \(!window\.RMATargetedRetry\)\s*\{\s*try \{ submitFinalData\(\);/.test(finish));
  check(`${path.basename(relative)} never awards a retry certificate`, /if \(window\.RMATargetedRetry\)[\s\S]*?dom\.certBtn\.classList\.add\('hidden'\)[\s\S]*?return;/.test(finish));
});

console.log(checks.join('\n'));
const failed = checks.filter((result) => result.startsWith('FAIL')).length;
console.log(failed ? `\n${failed} FAILED` : `\nALL CHECKS PASSED (${checks.length})`);
if (failed) process.exit(1);