# RMA PATHWAYS - LOCAL TESTING README

## 🎯 PURPOSE
Test the implementation of the Question Map panel and related features before committing to GitHub.

---

## 📋 WHAT'S NEW

### 1. Question Map Panel
- **Location:** Teacher Dashboard → 📚 Question Map tab
- **Features:**
  - View all RMA questions and aligned Filipino scenario questions
  - Filter by type (RMA, Bank, Aligned)
  - Filter by mastery level
  - Search questions
  - Expand to view aligned questions
  - Toggle feedback/explanations

### 2. Grade 10 Question Bank
- **5 RMA questions** from Box 1 Pattern (Questions 1-5)
- **50 Aligned Filipino scenario questions** (10 per RMA question)
- All aligned questions have multiple-choice options and answers
- Filipino context with local scenarios

### 3. Teacher Name in CAPS
- Student registration already has:
  - Separate Teacher Last Name and First Name fields
  - Auto-transform to UPPERCASE as you type
  - Suggestions to prevent duplicates

---

## 🚀 QUICK START

### Option A: Open directly from file explorer
1. Navigate to: `C:\\Users\\Administrator\\OneDrive - Department of Education\\Desktop\\MWNHS 2025-2026\\WEBSITES_APPS\\RMA FILES\\`
2. Double-click `teacher.html`
3. Log in with:
- Account: none ships with the project. Run the bootstrap script to create the account you will test with.

### Option B: Use Live Server (VS Code)
1. Open VS Code
2. Open the RMA FILES folder
3. Right-click `teacher.html` → "Open with Live Server"
4. Log in with credentials above

### Option C: Drag to browser
1. Open Chrome/Firefox/Edge
2. Drag `teacher.html` file to the browser window
3. Log in with credentials above

---

## 📊 TEST CHECKLIST

- [ ] Can log in with the bootstrapped account
- [ ] Dashboard loads successfully
- [ ] Can see grade filter dropdown
- [ ] Can see section filter dropdown
- [ ] Can click 📚 Question Map tab
- [ ] Question Map loads (shows questions)
- [ ] Can see RMA questions (RMA-Q10-01 to RMA-Q10-05)
- [ ] Can expand aligned questions
- [ ] Aligned questions have options
- [ ] Correct answers are highlighted
- [ ] Can search questions
- [ ] Can filter by type
- [ ] Can filter by mastery
- [ ] Feedback/explanation toggles work

---

## 📚 DOCUMENTATION

| Document | Purpose |
|----------|---------|
| `README.md` | Project documentation, layout, and feature reference |
| `LOCAL_TEST_GUIDE.md` | Step-by-step testing instructions |
| `README_TEST.md` | This file - quick reference |

---

## 🎓 QUESTION STRUCTURE

Each RMA question has:
```
RMA-Q10-01: Main question from Grade 10 assessment
├── ALIGN-Q10-01-01: Filipino scenario #1
├── ALIGN-Q10-01-02: Filipino scenario #2
├── ...
└── ALIGN-Q10-01-10: Filipino scenario #10
```

Each question includes:
- Question text (in English and Filipino)
- Multiple-choice options
- Correct answer
- Feedback/explanation
- Category
- Type (RMA, Aligned)

---

## ⚠️ KNOWN LIMITATIONS

1. **Only 5 Grade 10 questions implemented** (out of 47)
2. **No actual student data** - Dashboard will show sample/empty data
3. **Supabase connection required** - For teacher name suggestions
4. **Internet required** - For RPC calls to Supabase

---

## 💡 TIPS

### For Best Experience:
- Use Chrome browser
- Enable JavaScript (required)
- Use desktop/laptop (better than mobile for testing)
- Clear cache if issues occur (Ctrl+Shift+Del)

### If Something Doesn't Work:
1. Check browser console (F12 → Console)
2. Verify files are saved (check modification dates)
3. Try a different browser
4. Check the documentation files

---

## 📞 NEED HELP?

The implementation is **working and ready for testing**. 

After testing:
1. ✅ Approve the structure and features
2. ✅ Request completion of remaining 42 Grade 10 questions
3. ✅ Commit to GitHub
4. ✅ Deploy to Vercel

---

**Last Updated:** September 29, 2025
**Status:** ✅ Ready for Local Testing
