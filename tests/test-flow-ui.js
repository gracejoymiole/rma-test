const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const auth = fs.readFileSync(path.join(ROOT, 'rma-auth.js'), 'utf8');
const theme = fs.readFileSync(path.join(ROOT, 'rma-theme.js'), 'utf8');
const leaderboard = fs.readFileSync(path.join(ROOT, 'rma-student-leaderboard.js'), 'utf8');
const teacher = fs.readFileSync(path.join(ROOT, 'teacher-portal.js'), 'utf8');
const teacherHtml = fs.readFileSync(path.join(ROOT, 'teacher.html'), 'utf8');
let pass = 0;
let fail = 0;
function check(name, condition) {
  if (condition) { console.log('PASS  ' + name); pass += 1; }
  else { console.log('FAIL  ' + name); fail += 1; }
}

check('readiness shows grade-specific question counts and duration',
  /7:\s*\{ questions: 35, minutes: 20 \}/.test(auth)
  && /8:\s*\{ questions: 50, minutes: 30 \}/.test(auth)
  && /9:\s*\{ questions: 60, minutes: 35 \}/.test(auth)
  && /10:\s*\{ questions: 60, minutes: 35 \}/.test(auth));
check('readiness lists the actual tab, fullscreen, refresh, idle and tooling violations',
  /Stay on this tab/.test(auth) && /full screen/.test(auth) && /Do not refresh/.test(auth)
  && /one minute without activity/.test(auth) && /developer tools/.test(auth) && /screenshot shortcuts/.test(auth));
check('begin button is rendered and wired once',
  /id="confirmAssessmentStart"/.test(auth)
  && /confirmAssessmentStart"\)\.addEventListener\("click", beginAssessment, \{ once: true \}\)/.test(auth));
check('readiness preserves the original wired start button and profile fields',
  /authCard\.hidden = true/.test(auth)
  && /insertAdjacentHTML\("beforeend"/.test(auth)
  && !/function continueToAssessment\(\)[\s\S]{0,700}?overlay\.innerHTML\s*=/.test(auth));
check('a pre-start refresh restores the readiness screen without replacing the form',
  /function restoreSavedSession\(\)/.test(auth)
  && /if \(restoreSavedSession\(\)\) continueToAssessment\(\)/.test(auth));
check('not-yet button is rendered and returns to sign-in',
  /id="returnToSignIn"/.test(auth) && /RMAAuth\.logout\(\)/.test(auth) && /state\.mode = "login"/.test(auth));
check('missed-skills button is rendered, wired and ignores correct T answers',
  /button\.id = "reviewMissedBtn"/.test(theme)
  && /button\.addEventListener\("click"/.test(theme)
  && /item\.result !== "T"/.test(theme));
check('leaderboard tab definitions update with the selected view',
  /Latest run reflects/.test(leaderboard) && /Personal best reflects/.test(leaderboard));
check('leaderboard tabs stay wired when the database is unavailable',
  /const data = \{ live: \[\], all_time: \[\], unavailable: true \}/.test(leaderboard)
  && /wire\(data\);\s*setMode\("live", data\)/.test(leaderboard));
check('student-facing leaderboard fallback is helpful rather than an outage warning',
  /Complete a practice run to start your section leaderboard\./.test(leaderboard)
  && !/Leaderboard is unavailable\. Please try again shortly\./.test(leaderboard));
check('teacher priority actions render',
  /id="actionNeedsHelp"/.test(teacherHtml) && /id="actionIncomplete"/.test(teacherHtml)
  && /id="actionCompletion"/.test(teacherHtml));
check('teacher intervention and learner drill-down buttons are wired',
  /onclick="exportInterventionGroup\(\)"/.test(teacher)
  && /onclick="focusLearner\('/.test(teacher)
  && /window\.exportInterventionGroup = exportInterventionGroup/.test(teacher)
  && /window\.focusLearner = focusLearner/.test(teacher));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
