/* Probe the live rma_teacher_dashboard with a real teacher session, to confirm
   student_id is now present.

   The token lives in sessionStorage under "rma_teacher_token", not localStorage,
   and it is only readable from the browser's developer console on the teacher
   portal -- not from PowerShell. So this prints the exact commands to run rather
   than making you guess.

   1. Open http://localhost:5500/teacher.html and sign in.
   2. Press F12, go to the Console tab, paste this and press Enter:

        copy(sessionStorage.getItem("rma_teacher_token"))

   3. Back in PowerShell, paste the copied token:

        $env:RMA_TEACHER_TOKEN = Read-Host "paste the token"
        node tools/check-remove-ready.js

   The token stays in your shell; nothing is written to disk. Treat it like a
   password, because that is what it is. */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const cfg = fs.readFileSync(path.join(ROOT, 'supabase-config.js'), 'utf8');
const KEY = (cfg.match(/publishableKey:\s*"([^"]+)"/) || [])[1];
const token = (process.env.RMA_TEACHER_TOKEN || '').trim();

if (!token) {
  console.log('No token set, so nothing was checked.');
  console.log('');
  console.log('Sign in at http://localhost:5500/teacher.html, press F12 -> Console, and run:');
  console.log('');
  console.log('  copy(sessionStorage.getItem("rma_teacher_token"))');
  console.log('');
  console.log('Then in PowerShell:');
  console.log('');
  console.log('  $env:RMA_TEACHER_TOKEN = Read-Host "paste the token"');
  console.log('  node tools/check-remove-ready.js');
  process.exit(2);
}

if (token.startsWith('<') || token === 'paste' || /\s/.test(token)) {
  console.log('That looks like a placeholder, not a token: "' + token + '"');
  console.log('Paste the value the browser console gave you, with no angle brackets.');
  process.exit(2);
}

(async () => {
  const r = await fetch('https://ogcrbrfzsjjizsubzdpg.supabase.co/rest/v1/rpc/rma_teacher_dashboard', {
    method: 'POST',
    headers: {
      apikey: KEY,
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_token: token }),
  });
  const text = await r.text();
  if (!r.ok) { console.log('HTTP ' + r.status + '\n' + text.slice(0, 400)); process.exit(1); }
  const rows = JSON.parse(text);
  console.log('learners returned: ' + rows.length);
  const withId = rows.filter((x) => x.student_id).length;
  console.log('carrying student_id: ' + withId);
  console.log(withId === rows.length && rows.length > 0
    ? 'READY - the remove-a-student list can populate.'
    : 'NOT READY - rows are still missing student_id.');
  if (rows.length) {
    console.log('\nsample:');
    rows.slice(0, 3).forEach((x) => console.log('  ' + (x.student_id || '(none)') + '  ' + x.student_code + '  ' + x.student_name));
    console.log('\nsections in Grade 7: ' + JSON.stringify([...new Set(rows.filter((x) => Number(x.grade) === 7).map((x) => x.section))]));
  }
})();