// Runs every assertion suite and reports one total.
// Usage: node tests/run-all.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const suites = fs
  .readdirSync(__dirname)
  .filter((f) => /^test-.*\.js$/.test(f))
  .sort();

let totalPass = 0;
let totalFail = 0;
const failures = [];

for (const suite of suites) {
  let output = '';
  try {
    output = execFileSync(process.execPath, [path.join(__dirname, suite)], { encoding: 'utf8' });
  } catch (error) {
    output = (error.stdout || '') + (error.stderr || '');
    failures.push(`${suite}: exited non-zero`);
  }

  const pass = (output.match(/^PASS/gm) || []).length;
  const fail = (output.match(/^FAIL/gm) || []).length;
  totalPass += pass;
  totalFail += fail;

  (output.match(/^FAIL.*$/gm) || []).forEach((line) => failures.push(`${suite}  ${line.trim()}`));
  const status = fail ? 'FAIL' : ' ok ';
  console.log(`${status} ${suite.padEnd(24)} ${String(pass).padStart(3)} pass ${fail} fail`);
}

console.log('-'.repeat(52));
console.log(`${suites.length} suites  ${totalPass} pass  ${totalFail} fail`);

if (failures.length) {
  console.log('\nFailures:');
  failures.forEach((f) => console.log('  ' + f));
  process.exit(1);
}