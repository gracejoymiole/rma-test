const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const listeners = { input: [], change: [], click: [] };
const overlay = {
  innerHTML: '',
  addEventListener(type, fn, capture) { listeners[type].push(fn); },
  querySelectorAll() { return []; }
};
const store = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };

const els = {
  loginOverlay: overlay,
  authMessage: { hidden: true, textContent: '', dataset: {} }
};

const node = () => ({ hidden: false, textContent: '', innerHTML: '', value: '', style: {}, dataset: {},
  querySelector: () => ({ textContent: '' }), prepend(){}, appendChild(){}, addEventListener(){} });

global.window = {
  RMA_SUPABASE: { url: 'https://x.supabase.co', publishableKey: 'k' },
  addEventListener() {}
};
global.document = {
  body: { dataset: { grade: '7' }, appendChild() {} },
  head: { appendChild() {} },
  getElementById: (id) => (els[id] || (els[id] = node())),
  createElement: () => node()
};
global.localStorage = store();
global.sessionStorage = store();
global.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
global.console = console;

const src = fs.readFileSync(ROOT + '/rma-auth.js', 'utf8');
const out = [];
const check = (n, c, x) => out.push((c ? 'PASS' : 'FAIL') + '  ' + n + (x ? '  -> ' + x : ''));

try {
  new Function(src)();
  check('rma-auth.js evaluates without throwing', true);
} catch (e) {
  check('rma-auth.js evaluates without throwing', false, e.message);
console.log(out.join('\n'));
  process.exit(1);
}

const html = overlay.innerHTML;
check('grade dropdown present', /<select id="signupGrade"/.test(html));
check('dropdown has 4 grade options', (html.match(/<option value="(7|8|9|10)"/g) || []).length === 4, (html.match(/<option value="\d+"/g) || []).join(','));
check('page grade preselected', /<option value="7" selected>/.test(html));
check('grade warning element present', /id="gradeWarning"/.test(html));
check('MATH Teacher section heading', /MATH TEACHER'S NAME/.test(html));
check("MATH Teacher's surname label", /MATH Teacher's surname/.test(html));
check("MATH Teacher's first name label", /MATH Teacher's first name/.test(html));
check("MATH Teacher's title label", /MATH Teacher's title/.test(html));
check('click listeners attached', listeners.click.length > 0, String(listeners.click.length));
check('input listeners attached', listeners.input.length > 0, String(listeners.input.length));
check('change listeners attached', listeners.change.length > 0, String(listeners.change.length));

// syncProgress must be a real function now
check('RMAAuth.syncProgress is a function', typeof window.RMAAuth.syncProgress === 'function');
check('RMAAuth.saveProgress exposed', typeof window.RMAAuth.saveProgress === 'function');

// warning behaviour
const src2 = src;
check('showGradeWarning wired to signupGrade change', /showGradeWarning\(event\.target\.value, "register"\)/.test(src2));
check('mismatch requires second tap', /state\.gradeConfirmed/.test(src2));
check('register uses selected grade', /p_grade: Number\(selectedGrade\)/.test(src2));
check('login parses grade from student ID', /match\(\/\^RMA-\(\\d\+\)-\/\)/.test(src2));

// uppercase enforcement
check('uppercase input handler covers all text fields', /'signupLastName', 'signupFirstName', 'signupSection'/.test(src2) && /'teacherLastName', 'teacherFirstName', 'loginStudentId'/.test(src2));

// --- the reveal button must not make a password look uppercase ---
// The stylesheet uppercases every input that is not type="password". Revealing
// flips the field to type="text", which would silently uppercase the password a
// student is trying to check. The rule has to exclude the field itself.
check('uppercase rule cannot capture a revealed password',
  /input:not\(\[type="password"\]\):not\(\.rma-auth-password input\)/.test(src2));
check('uppercase rule is not the bare type-only selector',
  !/input:not\(\[type="password"\]\)\s*\{\s*text-transform/.test(src2));

// --- password reveal on the student login ---
// The student card is built entirely in rma-auth.js, markup and CSS together. The
// teacher card is markup and CSS in teacher.html with its behaviour in
// teacher-portal.js, so each is checked against the file that actually holds it.
const portalSrc = fs.readFileSync(path.join(ROOT, 'teacher-portal.js'), 'utf8');
const teacherHtml = fs.readFileSync(path.join(ROOT, 'teacher.html'), 'utf8');
[['student login', src2, src2, 'rma-auth-eye'],
  ['teacher login', portalSrc, teacherHtml, 'pwd-eye']].forEach(([where, js, markup, cls]) => {
  check(`${where} has a reveal button`,
    new RegExp(`data-toggle-password="\\w+"`).test(markup));
  check(`${where} reveal button is labelled for screen readers`,
    /aria-label="Show password"[^>]*aria-pressed="false"/.test(markup)
    || /aria-pressed="false"[^>]*aria-label="Show password"/.test(markup));
  check(`${where} reveal is tied to its password field`,
    new RegExp(`aria-controls="\\w+"`).test(markup));
  check(`${where} reveal toggles the input type`,
    /input\.type = revealed \? "text" : "password"/.test(js));
  check(`${where} reveal updates aria-pressed`,
    /setAttribute\("aria-pressed", String\(revealed\)\)/.test(js));
  check(`${where} reveal stops the label stealing the click`, /event\.preventDefault\(\)/.test(js));
  check(`${where} reveal styles exist`, new RegExp(`\\.${cls}\\b`).test(markup));
  check(`${where} reveal icon hides its slash until revealed`,
    new RegExp(`\\.${cls}-slash \\{ opacity:0`).test(markup.replace(/\s+/g, ' ')));
  check(`${where} reveal icon is an inline svg`, /<svg[^>]*viewBox="0 0 24 24"/.test(markup));
});
// The student card is generated, so the button must survive into the real DOM.
check('student reveal button reaches the rendered card',
  /data-toggle-password="loginPassword"/.test(html));
// A revealed password must never survive a re-render or a sign-in.
check('student reveal is re-masked when the card re-renders',
  /maskPasswords\(\);/.test(src2) && /function maskPasswords\(\)/.test(src2));
check('teacher reveal is re-masked on sign-in',
  /maskTeacherPasswords\(\);/.test(portalSrc) && /function maskTeacherPasswords\(\)/.test(portalSrc));

// --- the onboarding UI is English only ---
// The aligned Filipino questions in the teacher's Question Map are deliberate
// assessment content and are not in scope here; this is the student sign-up and
// log-in card only.
const FILIPINO = ['Antas', 'Apelyido', 'Mag-log in', 'Magrehistro', 'Sekyon', 'Lumikha',
  'napagawa', 'Pindutin', 'Pakipili', 'Awtomatikong', 'Ingatan', 'Magpatuloy',
  'Piliin ang', 'Hindi tugma', 'Unang Pangalan', 'Titulo', 'ITYPE ANG'];
check('no "English | Filipino" pairs remain in the auth card',
  !/\|/.test(html.replace(/\|\|/g, '')) || !FILIPINO.some((w) => html.includes(w)),
  FILIPINO.filter((w) => html.includes(w)).join(', '));
FILIPINO.forEach((w) => check(`auth UI drops "${w}"`, !html.includes(w)));
check('English labels survive the cleanup',
  ['Log in', 'Sign up', 'Password', 'Grade level', 'Student surname', 'Section']
    .every((l) => html.includes(l)));

// --- the password must be normalised before it is checked ---
// rma_student_login compares with crypt(), which is case-sensitive, while the
// password is generated as upper(hex). Every generated password contains at
// least one letter, so a student who writes it in lower case can never log in
// and the portal only reports that the credentials are wrong.
// The window has to clear the explanatory comment above the password line.
const loginCall = (src2.match(/rpc\("rma_student_login"[\s\S]{0,1200}?\n\s*\}\);/) || [])[0] || '';
check('the login call was found to assert against', loginCall.length > 0);
check('login sends an uppercased password',
  /p_password:[^\n]*\.toLocaleUpperCase\(\)/.test(loginCall));
check('login does not send the raw password field',
  !/p_password:\s*document\.getElementById\("loginPassword"\)\.value\s*,/.test(loginCall));
check('the password field is uppercased as it is typed',
  /'loginPassword'/.test(src2));
check('student ID is still uppercased at the send site',
  /loginStudentId"\)\.value\.trim\(\)\.toLocaleUpperCase\(\)/.test(src2));

// --- the sign-in button must not run the exam's name validation ---
// startBtn belongs to rma-auth.js: it is the "Log in and start" button. The
// grade pages attach their own handler to it and used to run it on a real
// click, which asked a student who had only typed a student ID and password to
// enter their name. rma-auth re-dispatches that click after authenticating,
// with RMAAuth.bypass set, and no page ever read the flag.
const PAGES = ['FINAL GRADE 7 RMA/G7 RMA1 V1.html', 'RMA G8 V2/G8 RMA V5.html',
  'RMA G9 V1/rmag9 v3.html', 'RMA G10 V1/g10rma v4.html'];
PAGES.forEach((rel) => {
  const page = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const base = path.basename(rel);
  const handler = (page.match(/getElementById\('startBtn'\)\.addEventListener\('click', \(\) => \{([\s\S]*?)\n\s*const now = Date\.now\(\);/) || [])[1] || '';
  check(`${base} guards its startBtn handler`, handler.length > 0);
  check(`${base} ignores a sign-in click`,
    /window\.RMAAuth\.bypass !== true\)\s*return/.test(handler));
});
check('auth sets the bypass flag before re-dispatching the click',
  /RMAAuth\.bypass = true;[\s\S]{0,200}?dispatchEvent/.test(src2)
  && /RMAAuth\.bypass = false;/.test(src2));
check('every grade page attaches exactly one startBtn handler', PAGES.every((rel) => {
  const page = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  return (page.match(/getElementById\('startBtn'\)\.addEventListener/g) || []).length === 1;
}));

console.log(out.join('\n'));
console.log(out.some((r) => r.startsWith('FAIL')) ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED');
