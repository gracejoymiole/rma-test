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

console.log(out.join('\n'));
console.log(out.some((r) => r.startsWith('FAIL')) ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED');
