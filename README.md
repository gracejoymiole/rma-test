# RMA PATHWAYS

Static grade-selection portal and four standalone MWNHS RMA assessment pages.

## Supabase setup

1. Open the Supabase project SQL Editor for `ogcrbrfzsjjizsubzdpg`.
2. Run the contents of [`supabase/schema.sql`](supabase/schema.sql) once.
3. The browser uses the project's publishable key from [`supabase-config.js`](supabase-config.js). This key is public by design; never add a service-role or secret key to this site.
4. Score submission and violation logging require the schema above. The section leaderboard shows student names, scores, and durations to anyone who can access the site. Review applicable school/student-data policies before publishing.

Supabase's browser publishable key cannot create database tables or apply policies. Until the SQL is run by an authorized project administrator, score/violation submissions and leaderboards will report a backend error; the grade chooser and assessments still load.

## Vercel

Deploy this folder as a static site with this folder as the project root and no build command. The root `index.html` is the entry page. The four grade pages keep their existing folders and local image assets.

## GitHub

Repository: <https://github.com/gracejoymiole/rma-test>

The workspace has a local `main` commit and `origin` configured. GitHub returned 404 without authenticated access, so the commit has not been pushed. After signing in to an account with write access, push `main` from this folder and connect `gracejoymiole/rma-test` in the Vercel project's **Settings → Git** to enable automatic deployments on pushes. The current production deployment was created directly from the workspace and is already live independently of GitHub.

Supabase setup: <https://supabase.com/dashboard/project/ogcrbrfzsjjizsubzdpg/sql/new>
