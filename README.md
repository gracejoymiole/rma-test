# RMA Pathways

Assessment and teacher-reporting platform for the Mathematics Department of
MWNHS, covering the Read, Make, and Assess (RMA) instruments for Grades 7-10.

## Layout

```
index.html                 landing page, links to each grade
teacher.html               teacher portal (requires a teacher account)
assets/                    shared images used by every grade page
FINAL GRADE 7 RMA/         Grade 7 assessment
RMA G8 V2/                 Grade 8
RMA G9 V1/                 Grade 9
RMA G10 V1/                Grade 10
supabase/                  schema.sql and teacher-bootstrap.sql (not served)
tests/                     assertion suites
```

The four grade folders hold only their question HTML. Figures and the school
logo live once in `assets/` and are referenced as `../assets/<name>.png`.

## Running locally

```powershell
npm run serve     # http://localhost:5500
```

Any static server works; there is no build step. The included script refuses to
serve `supabase/`, which holds the schema and the bootstrap script.

## Teacher portal

`teacher.html` is three tabs over the same session-scoped data.

**📊 Overview** — grade and section filters, then class metrics, section
completion and average-score charts, highest and lowest item mastery for the
grade and per section, a question mastery table, and a per-student status table.
Status comes from the `rma_score_bands` table rather than hardcoded thresholds:
`Ready / Proficient` (80-100), `Developing` (60-79), `Emerging` (40-59), and
`Needs Intensive Support` (0-39), plus `Incomplete` for an unfinished attempt and
`Not yet taken` for no attempt at all. The Who Needs Help card filters by band. A
teacher sees their own sections unless `see_all_sections` is set on their account.

**📚 Question Map** — answer keys and explanations, filterable by search text, by
type (RMA original / bank / aligned Filipino), and by mastery band. Mastery
appears for RMA items only, computed from real submissions: `rma_data` stores one
bit per RMA item, so item N maps to `RMA-Q<grade>-<NN>`. Bank and aligned items
are never submitted per-item, so they carry no mastery value and are left blank
rather than reported as 0%.

**🗺️ Master Map** — the full question inventory across all four grades, from
`rma-master-map.js`, which is generated from
`RMA_Grade7-10_Complete_Question_Mapping.xlsx` and must not be edited by hand. It
carries 47 blueprint items and 448 question rows tagged by grade, topic and
cognitive process.

## XP and help

Students earn **1 XP for each correct answer**; a wrong or timed-out answer changes
nothing. XP can be spent on help from the card under the options, and **there is no
free help**: every use is paid for from XP already earned in the run.

| Help | Cost | Limit |
| --- | --- | --- |
| Remove one wrong option | 10 XP | once per question |
| Add 10 seconds | 5 XP | once per question |
| Second chance | 20 XP | after a wrong answer, **once per attempt** |

A run can spend at most 30 XP on help. Starting a new attempt ("Practice again") resets
XP, the spending total, the stored answers and the second chance. The costs, the cap and
the one-second-chance limit live in the `RULES` table at the top of `rma-help.js`; the
XP per correct answer is `XP_PER_CORRECT` in each grade page. Each use of help is saved
per question (`help_data`) with the score without help (`unaided_score`), and the teacher
portal shows both. Run `supabase/add-help-tracking.sql` once to add the columns; until
then pages keep saving scores without them.

`python3 tools/browser-check.py` drives the real pages in Chromium (needs Playwright).

## Penalties

The practice test is deliberately forgiving. Reaching the limit — 3 warnings, or
3 cancellations — makes the next attempt unavailable for **one day**, not longer.
`banDuration` sits in the `SECURITY` object at the top of each grade page, so the
length is one number per file. The thresholds (`maxStrikes`, `maxQuits`) are in the
same object, and the ban message reads them from there rather than hardcoding a
number.

## Type

One font site-wide: **Comic Relief**, loaded from Google Fonts by a `<link>` in each
page's `<head>`, with the family name held in `--font-display` and `--font-body` in
`rma-theme.css`. `index.html` and `teacher.html` define their own copies of those two
custom properties so they match without loading the stylesheet twice. `tests/test-theme.js`
fails if a page goes back to a different family, or if the old names come back.

## Tests

```powershell
npm test           # all suites, 986 assertions
npm run check      # syntax-check the shipped scripts
npm run verify     # both, as CI runs it
npm run verify:live  # checks the deployed Supabase project, not the repo
```

`npm run verify:live` is the one to run after you paste SQL into the Supabase
SQL Editor. It probes the live project over the same public PostgREST surface
the browser uses, so it reports what a real user would get rather than what the
Editor claims after a script that may have rolled back. It exits non-zero and
names anything still missing.

Suites read the real shipped files, so they fail if product code drifts. GitHub
Actions runs `verify` on every push and pull request to `main`.

Coverage worth knowing about:

| Suite | Guards |
| --- | --- |
| `test-assets.js` | every image a page references exists; no duplicate copies |
| `test-hardening.js` | leaderboard scoping, RLS, escaping, credential absence, no orphans |
| `test-privacy.js` | teacher scoping and session expiry |
| `test-status.js` | Not yet taken / Incomplete / completed states |
| `test-bandfilter.js` | Who Needs Help band filtering |
| `test-gaps-export.js` | learning-gap derivation, Excel export, print report |
| `test-mastery.js` | per-question mastery, and that items with no data are not counted as 0% |
| `test-deployment.js` | schema/client contract, and that no client reads a table directly |
| `test-selection.js` | tag-aware question selection, and that all four pages use it |
| `test-leaderboard.js` | leaderboard RPC scope, permissions, and live vs all-time semantics |
| `test-pages.js` | the four grade pages still parse as JavaScript |
| `test-master-map.js` | the 448-question map |
| `test-auth.js` | student onboarding and auth |

## Deploying

Static hosting; the docs name Vercel. Two things to set before the first deploy:

1. Apply `supabase/schema.sql`, or every RPC returns 404.
2. Replace nothing in `supabase-config.js` — the publishable key is meant for the
   browser. All protection is in RLS, which is why the schema matters.

The project ref lives in `supabase-config.js`. Confirm it matches the project you
are deploying to: the CLI's project list can name a project "RMA" that is a
different database entirely, and a mismatched ref will happily reject the
publishable key with `Invalid API key`.

## Supabase

### If the leaderboard is leaking, run this first

`supabase/urgent-leaderboard-fix.sql` is a single paste into the SQL Editor that
drops the anonymous `rma_leaderboard` view and replaces it with
`rma_leaderboard_top(p_token, p_limit)`, which derives grade and section from
the caller's own session. Idempotent; safe to re-run.

Then apply the full `supabase/schema.sql`, which is idempotent and safe to
re-run. It ends with `notify pgrst, 'reload schema'`.

The SQL Editor runs a script as one transaction, so a single error discards
everything it did. If a run fails partway, use `supabase/apply-missing.sql`
instead: it holds only the objects that never got created, copied verbatim from
`schema.sql`. `tests/test-deployment.js` fails if the two files ever drift apart.

Two traps that file is ordered to avoid:

- A bare `order by <col>` after `from <table>` in an aggregate fails with 42803.
  The ordering has to live inside `jsonb_agg`.
- `revoke` and `grant` on a function that does not exist fail with 42883, while
  `drop ... if exists` is safe. Revoke only what the same script creates.

A `plpgsql` body is not resolved when the function is created, so a missing
column will not fail the paste; it fails later, for a real teacher, in the
browser. Add every column before the functions that use it, and let
`npm run verify:live` check the columns too.

After any paste, confirm it with `npm run verify:live`.

### Leaderboard

The teacher dashboard shows a live and an all-time leaderboard per section.
Live is each learner's most recent completed attempt; all time is their personal
best, so a repeat attempt improves a score rather than replacing it. Unfinished
attempts are left off both.

`supabase/apply-leaderboard.sql` deploys the RPC that backs it. It is granted to
`authenticated` only, never `anon`, and resolves the teacher's scope once into
an array that both lists read from, so the two cannot disagree about who is
visible. Grade and section filters are applied inside the function: a caller
cannot widen its own scope by passing different arguments.

### Question selection

Each grade page serves a fixed block of RMA items plus a random block drawn from
the rest. `rma-selection.js` decides that random block using the topic tags the
pages already derive through `getMathObjective(i + 1)`, so a student gets a fair
sample across the topics that grade covers instead of whichever bank items
happened to sit at the end of the array.

The Filipino-aligned items in `teacher-portal.js` are **not** served to students:
no grade page loads that file. They are also incomplete as questions, so they
cannot be served as they stand.

| Grade | Filipino-aligned | Has options + answer |
|-------|------------------|----------------------|
| 7 | 30 | 10 |
| 8 | 30 | 0 |
| 9 | 30 | 0 |
| 10 | 200 | 200 |

Until Grades 7, 8 and 9 have answerable items, selection covers the English
questions only. Nothing in the student path references the aligned bank.

Create the first teacher account:

```sql
set rma_bootstrap_teacher_password = 'choose-a-strong-password';
\i supabase/teacher-bootstrap.sql
```

The script forces `must_change_password = true`, so the account prompts for a
new password on first login.

Never commit a working password. Earlier revisions of `teacher-bootstrap.sql`
shipped one in plaintext; it remains readable in git history and must be
rotated.

### Data access model

There is no direct table access from the browser. All six tables have RLS
enabled and are revoked from `anon`; access goes through `security definer`
functions that pin `search_path` and validate a session token first.

`rma_leaderboard_top(p_token, p_limit)` is the one function reachable by
`anon`, because a student may view the leaderboard before the portal is
unlocked. It derives grade and section from the caller's session, so the scope
cannot be widened by the caller. Do not replace it with a view or a
caller-supplied scope.

Passwords are bcrypt (`extensions.crypt`); session tokens are stored as SHA-256
digests. Tokens live in `sessionStorage` and expire after 12 hours for students
and 8 for teachers.