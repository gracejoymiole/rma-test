const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const schema = fs.readFileSync(path.join(ROOT, 'supabase', 'schema.sql'), 'utf8');
const migration = fs.readFileSync(path.join(ROOT, 'supabase', 'add-remove-student.sql'), 'utf8');
const portal = fs.readFileSync(path.join(ROOT, 'teacher-portal.js'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'teacher.html'), 'utf8');

const checks = [];
const check = (name, passed) => checks.push(`${passed ? 'PASS' : 'FAIL'} ${name}`);
for (const [label, sql] of [['schema', schema], ['migration', migration]]) {
  const start = sql.indexOf('create table if not exists public.rma_student_removal_history');
  const table = start < 0 ? '' : sql.slice(start, sql.indexOf(');', start));
  const removeStart = sql.indexOf('create or replace function public.rma_remove_student');
  const historyStart = sql.indexOf('create or replace function public.rma_teacher_removal_history');
  const remove = removeStart < 0 ? '' : sql.slice(removeStart, historyStart > removeStart ? historyStart : sql.length);
  check(`${label} creates history without learner identifiers`, /teacher_id uuid/.test(table) && !/student_code|student_name|last_name|first_name/.test(table));
  check(`${label} permanently deletes attempts, violations, sessions, and account`, /delete from public\.rma_auth_sessions[\s\S]*?delete from public\.rma_violations[\s\S]*?delete from public\.rma_scores[\s\S]*?delete from public\.rma_students/.test(remove));
  check(`${label} logs event metadata without requiring a reason`, /insert into public\.rma_student_removal_history[\s\S]*?v_student\.grade, v_student\.section[\s\S]*?return jsonb_build_object/.test(remove) && !/p_reason/.test(remove));
  check(`${label} scopes history to a validated teacher session`, /rma_teacher_removal_history\(p_token text[\s\S]*?se\.role = 'teacher' and se\.expires_at > now\(\)[\s\S]*?where teacher_id = v_teacher\.id/.test(sql));
  check(`${label} denies direct access to the history table`, /enable row level security[\s\S]*?revoke all on (?:public\.rma_student_removal_history|public\.rma_students[\s\S]{0,220}rma_student_removal_history) from public, anon, authenticated/.test(sql));
}
check('portal loads recent removal events', /function loadRemovalHistory\(\)[\s\S]*?rma_teacher_removal_history/.test(portal));
check('portal gives a migration hint when history is not installed', /add-remove-student\.sql/.test(portal));
check('portal displays history without requiring learner identifiers', /id="removalHistoryList"/.test(html));

console.log(checks.join('\n'));
const failed = checks.filter((result) => result.startsWith('FAIL')).length;
console.log(failed ? `\n${failed} FAILED` : `\nALL CHECKS PASSED (${checks.length})`);
if (failed) process.exit(1);