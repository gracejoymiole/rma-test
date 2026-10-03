# LOCAL TEST GUIDE - RMA PATHWAYS

## Quick Start: Test the Implementation

### Step 1: Open the Teacher Portal
- Navigate to: `C:\\Users\\Administrator\\OneDrive - Department of Education\\Desktop\\MWNHS 2025-2026\\WEBSITES_APPS\\RMA FILES\\teacher.html`
- Open in Chrome/Firefox/Edge browser

### Step 2: Log In
- **Account:** none ships with the project. Create one with `supabase/teacher-bootstrap.sql`, then sign in and complete the forced password change.
- Click "Sign in"
- You should see the teacher dashboard

### Step 3: View Question Map
- Click the **📚 Question Map** button at the top
- Wait for questions to load

---

## What You Should See

### ✅ Question Map Panel
You should see:
- 5 RMA Original questions (RMA-Q10-01 to RMA-Q10-05)
- 50 Aligned Filipino scenario questions (ALIGN-Q10-01-01 to ALIGN-Q10-05-10)
- Each question displayed in a card format
- Options shown for all questions
- Correct answers highlighted with ✓
- Categories and types displayed

### ✅ Filtering Works
Try these filters:
1. **Search:** Type "pattern" or "Aling" in the search box
2. **Type Filter:** Select "RMA Original" to see only RMA questions
3. **Type Filter:** Select "Aligned" to see only Filipino scenario questions
4. **Mastery Filter:** Try different mastery levels

### ✅ Expand Aligned Questions
- For each RMA question, click "SHOW ALIGNED QUESTIONS"
- You should see 10 aligned Filipino scenario questions
- Each has options and correct answer highlighted
- Click "SHOW EXPLANATION" to see the feedback

---

## Verify Teacher Name Fields

To test the student registration:

1. Open any grade assessment page (e.g., `FINAL GRADE 7 RMA\\G7 RMA1 V1.html`)
2. Click "Magrehistro" (Sign up)
3. Fill in student details
4. **Teacher Name Fields:**
   - Teacher surname | Apelyido ng Guro: Type "REYES" (should auto-transform to UPPERCASE)
   - Teacher first name | Unang Pangalan ng Guro: Type "juan" (should auto-transform to UPPERCASE)
   - Teacher title | Pamagat: Select "Mr." or "Ms."
5. **Suggestions:**
   - Start typing "RE" in surname field
   - Wait for suggestions to appear (after 2+ characters)
   - Select a suggestion from the dropdown
6. Register and verify the account is created

---

## Verify Dashboard Filtering

1. On the teacher dashboard, select a grade from the dropdown
2. Select a section from the second dropdown
3. View the filtered data:
   - Summary metrics
   - Section completion chart
   - Section average score chart
   - Student status table

---

## Implementation Details

### Grade 10 Questions Implemented
| RMA Question | Topic | Aligned Questions | Status |
|--------------|-------|-------------------|--------|
| RMA-Q10-01 | Box 1 Pattern Verification | 10 | ✅ Complete |
| RMA-Q10-02 | Next Pattern Expression | 10 | ✅ Complete |
| RMA-Q10-03 | Algebraic Expression | 10 | ✅ Complete |
| RMA-Q10-04 | Pattern Explanation | 10 | ✅ Complete |
| RMA-Q10-05 | Meaning of n | 10 | ✅ Complete |
| RMA-Q10-06 to RMA-Q10-47 | Various topics | 0 | ⏳ Pending |

**Total:** 5 RMA questions × 10 aligned = **50 aligned questions** with options and answers

### Files Modified
1. **teacher-portal.js** - Added Grade 10 questions with aligned questions
2. **No changes needed** to teacher.html (already had Question Map structure)
3. **No changes needed** to rma-auth.js (already had teacher name fields with CAPS and suggestions)

---

## Expected Behavior

### Question Map
- ✅ Loads automatically when clicking the tab
- ✅ Defaults to Grade 10
- ✅ Displays all questions with proper formatting
- ✅ Options shown with correct answer highlighted
- ✅ Filtering works in real-time
- ✅ Aligned questions expand/collapse
- ✅ Feedback/explanation toggles

### Teacher Dashboard
- ✅ Filters by grade level
- ✅ Filters by section
- ✅ Shows class summary
- ✅ Shows charts
- ✅ Shows student status

### Student Registration
- ✅ Teacher name fields are separate (Last, First)
- ✅ Text transforms to UPPERCASE as you type
- ✅ Suggestions appear after 2+ characters
- ✅ Prevents duplicates
- ✅ Saves to database in UPPERCASE

---

## Troubleshooting

### If Question Map doesn't load:
1. Check browser console (F12 → Console)
2. Verify `teacher-portal.js` file is saved
3. Refresh the page (Ctrl+F5)
4. Clear browser cache

### If suggestions don't work:
1. Check internet connection (Supabase RPC needed)
2. Type at least 2 characters
3. Wait 1-2 seconds for suggestions to load

### If login fails:
1. Verify the username matches the account you created with the bootstrap script
2. Verify you completed the forced password change on first login
3. Confirm the account exists: `select username, must_change_password from public.rma_teacher_accounts;`

### If login still fails:
Apply `supabase/schema.sql` in the SQL editor. `rma_teacher_login` returns 404 until the function exists.

---

## Next Steps After Testing

1. ✅ Test locally and verify everything works
2. ✅ Review the 5 implemented Grade 10 questions
3. ✅ Provide feedback on the structure
4. ⏳ Complete remaining 42 Grade 10 questions (if approved)
5. ⏳ Commit to GitHub (after approval)
6. ⏳ Deploy to Vercel

---

## Contact

For questions or issues, refer to:
- Project documentation: `README.md`
- This guide: `LOCAL_TEST_GUIDE.md`

**Note:** All changes are currently only in local files. No changes have been committed to GitHub yet.
