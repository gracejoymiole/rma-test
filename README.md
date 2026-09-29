# RMA PATHWAYS

Static grade-selection portal, four RMA assessments, student account onboarding, and a teacher mastery portal.

## Supabase setup

1. Open the [Supabase SQL Editor](https://supabase.com/dashboard/project/ogcrbrfzsjjizsubzdpg/sql/new).
2. Run [`supabase/schema.sql`](supabase/schema.sql). It adds student registration/login RPCs, hashed passwords, expiring sessions, authenticated score submissions, teacher-only reporting, and teacher-name suggestions.
3. Run the local, git-ignored `supabase/teacher-bootstrap.sql` once to create the requested initial teacher account. Use the initial credentials supplied for this setup to sign in at `/teacher.html`; the portal requires an immediate password change (minimum 12 characters). Keep the bootstrap SQL private and never commit it.
4. The browser uses the project's publishable key from [`supabase-config.js`](supabase-config.js). This key is public by design; never add a service-role or secret key to this site.
5. Students sign up once per grade/section/name, receive a generated student ID and one-time generated password, and use those credentials on later visits. Repeated account creation for the same normalized grade, section, surname, first name, and middle initial is rejected; spelling variations cannot be reliably identified as the same person without a school roster or teacher approval workflow. Password recovery is not yet available, so students must safely keep their generated credentials. Teachers can review the latest attempt per registered student and item mastery at `/teacher.html`.

Student onboarding accepts a typed uppercase section, teacher title (Mr./Ms.), teacher surname, and teacher first name. Name suggestions use previously entered first names. Certificates use the section and teacher recorded on the authenticated student account. Student mastery records and teacher access are sensitive school data; restrict portal access and confirm school privacy requirements before using real student information. The student-facing leaderboard remains public as in the prior site (new account names are represented by student IDs there).

Supabase's browser publishable key cannot create database tables or policies. An authorized project administrator must run both SQL setup steps before account creation, score saving, and teacher reporting work. The static grade chooser and assessment pages can still be viewed before setup.

## Vercel

Deploy this folder as a static site with this folder as the project root and no build command. The root `index.html` is the entry page. The four grade pages keep their existing folders and local image assets.

## GitHub

Repository: <https://github.com/gracejoymiole/rma-test>

The source is in <https://github.com/gracejoymiole/rma-test> on branch `main`. The current production deployment is <https://rma-pathways.vercel.app>.
