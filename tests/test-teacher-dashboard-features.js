const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const portal = fs.readFileSync(path.join(ROOT, 'teacher-portal.js'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'teacher.html'), 'utf8');

const checks = [];
const check = (name, passed) => checks.push(`${passed ? 'PASS' : 'FAIL'} ${name}`);
check('intervention preset selects the needs-help cohort', /function setInterventionReady[\s\S]*?priorityBandFilter = NEEDS_HELP/.test(portal));
check('intervention cards show one top missed skill', /function renderTopSkill\(learner\)[\s\S]*?\[0\]/.test(portal));
check('intervention export includes the top missed skill', /interventionReady \? "Top missed skill"/.test(portal));
check('intervention group has a print action', /function printInterventionGroup\(\)/.test(portal) && /onclick="printInterventionGroup\(\)"/.test(portal));
check('refresh timestamp follows a successful dashboard RPC', /rows = await rpc\("rma_teacher_dashboard"[\s\S]*?lastDashboardRefresh = Date\.now\(\)/.test(portal));
check('manual refresh preserves selected grade and section', /loadDashboard\(\{ preserveSelection: true \}\)/.test(portal));
check('dashboard displays relative freshness', /Updated just now/.test(portal) && /Last refreshed \$\{elapsedMinutes\}m ago/.test(portal));
check('short question lists retain their full text as a tooltip', /title="\$\{escapeHtml\(least\.join[\s\S]*?compactQuestions\(range\.least\)/.test(portal));
check('dashboard layout uses compact spacing', /#dashboard \.card \{ padding:13px; \}/.test(html));
check('dashboard panel cards have tighter vertical gaps', /#dashboard #tabOverviewContent > \.card \{ margin:10px 0 !important; \}/.test(html));
check('leaderboard score caption uses mastery percentage', /<small>mastery %<\/small>/.test(portal));
check('redundant completion and grade-extremes panels are removed', !html.includes('completionChart') && !html.includes('Section completion') && !html.includes('gradeHighlights') && !html.includes('Whole-grade question extremes') && html.includes('Section average score'));
check('section averages use completed scores and render labeled percentages', /row\.is_complete !== false/.test(portal) && /section-score-track[\s\S]*?section-score-count/.test(portal) && /\.section-score-track \{ height:9px/.test(html));
check('summary omits duplicate completion-rate card but keeps its action', !/\$\{stats\.completionRate\}%[\s\S]{0,80}Completion Rate/.test(portal) && /id="actionCompletion"/.test(html));
check('visible table labels include a legend', /Q = question; \+N = additional items/.test(html));

console.log(checks.join('\n'));
const failed = checks.filter((result) => result.startsWith('FAIL')).length;
console.log(failed ? `\n${failed} FAILED` : `\nALL CHECKS PASSED (${checks.length})`);
if (failed) process.exit(1);