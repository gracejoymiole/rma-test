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

## Tests

```powershell
npm test          # all suites, 303 assertions
npm run check     # syntax-check the shipped scripts
npm run verify    # both, as CI runs it
```

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
| `test-master-map.js` | the 448-question map |
| `test-auth.js` | student onboarding and auth |

## Deploying

Static hosting; the docs name Vercel. Two things to set before the first deploy:

1. Apply `supabase/schema.sql`, or every RPC returns 404.
2. Replace nothing in `supabase-config.js` — the publishable key is meant for the
   browser. All protection is in RLS, which is why the schema matters.

## Supabase

1. Apply `supabase/schema.sql` in the SQL editor. It is idempotent and safe to
   re-run; it ends with `notify pgrst, 'reload schema'`.
2. Create the first teacher account:

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