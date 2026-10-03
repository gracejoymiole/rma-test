# RMA PATHWAYS - Quick Start Guide

## 🚀 TO RUN LOCALLY

### 1. Start a local server
```bash
# Using Python (if installed)
python -m http.server 8000

# Or use Node.js (if installed)
npx serve

# Or use PHP (if installed)
php -S localhost:8000
```

Then open: http://localhost:8000/teacher.html

### 2. Login
- **Account**: none ships with the project. Run `supabase/teacher-bootstrap.sql` with `rma_bootstrap_teacher_password` set to create one.

### 3. Test the new features

#### 📊 Teacher Dashboard Filtering
1. Select a grade level from the dropdown
2. Select a section from the dropdown
3. Verify all data (students, scores, charts) are filtered by your selection

#### 📚 Question Map Panel
1. Click on the "Question Map" tab
2. Browse all RMA original questions
3. View bank questions
4. View aligned Filipino scenario questions (10 per RMA question)
5. Use filters:
   - Search by keyword
   - Filter by type (RMA/Bank/Aligned)
   - Filter by mastery level
6. Click "SHOW ALIGNED QUESTIONS" to expand
7. Click "SHOW EXPLANATION" to see feedback

#### 👤 Student Registration
1. Open any grade assessment page (e.g., FINAL GRADE 7 RMA/)
2. Click "Sign up"
3. Fill in all fields:
   - Student Last Name (auto-uppercases)
   - Student First Name (auto-uppercases)
   - Section (auto-uppercases)
   - Teacher Title (Mr./Ms.)
   - Teacher Last Name (auto-uppercases, with suggestions)
   - Teacher First Name (auto-uppercases, with suggestions)
4. Verify suggestions appear for teacher names
5. Submit and verify account is created

---

## 📋 CHANGES MADE

### Modified Files:
1. **teacher.html** - Added Question Map tab and panel
2. **teacher-portal.js** - Added QUESTION_BANK, filtering, and Question Map functions
3. **rma-auth.js** - Fixed teacher name uppercase handling
4. **supabase/schema.sql** - Added score bands table, uppercase name fields

### New Files:
1. **`README.md`** - Project documentation
2. **QUICK_START.md** - This file

---

## ✅ VERIFICATION CHECKLIST

- [ ] Teacher dashboard filters by grade level
- [ ] Teacher dashboard filters by section
- [ ] Question Map tab displays all questions
- [ ] Question Map search works
- [ ] Question Map type filter works
- [ ] Question Map mastery filter works
- [ ] Aligned questions expand/collapse
- [ ] Feedback/explanations display correctly
- [ ] Student registration auto-uppercases all fields
- [ ] Teacher name suggestions work
- [ ] All fields are required

---

## 🎯 KEY FEATURES IMPLEMENTED

✅ Teacher dashboard with grade/section filtering  
✅ Question Map panel with all RMA questions  
✅ 10 aligned Filipino scenario questions per RMA question  
✅ Explanation feedback for all aligned questions  
✅ Student signup with teacher name fields  
✅ Auto-uppercase for all text fields  
✅ Teacher name auto-suggestions  
✅ Configurable score bands  
✅ Priority learners identification  
✅ Completion monitoring  

---

## 💡 TIPS

1. **All text fields auto-uppercase** - Type normally, it will convert to CAPS
2. **Teacher name suggestions** - Start typing, suggestions will appear after 2 characters
3. **Question Map filters** - Combine search, type, and mastery filters for precise results
4. **Aligned questions** - Each has Filipino context and explanation to help teachers understand the concept

---

## 📞 NEED HELP?

Check the **README.md** file for complete details on all implemented features.
