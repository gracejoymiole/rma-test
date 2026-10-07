// Student credential onboarding for the standalone grade assessments.
// Phase 1 Implementation: Simplified registration with teacher info, localStorage progress saving, mobile optimization
(function () {
  const config = window.RMA_SUPABASE;
  const grade = Number(document.body.dataset.grade);
  const overlay = document.getElementById("loginOverlay");
  const state = { profile: null, token: null, busy: false, gradeConfirmed: false };
  
  // LocalStorage key for progress saving
  const PROGRESS_KEY = `rma_${grade}_progress`;

  async function rpc(name, body) {
    const response = await fetch(`${config.url}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${config.publishableKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || payload.details || payload.hint || `Request failed (${response.status})`);
    return payload;
  }

  function message(text, isError = true) {
    const node = document.getElementById("authMessage");
    if (node) {
      node.textContent = text;
      node.dataset.error = String(isError);
      node.hidden = false;
    }
  }

  // ============================================
  // GRADE LEVEL CHECK
  // The assessment page is opened from a specific grade folder, but the student
  // declares their own grade level during onboarding. If the declared grade does
  // not match the page they are on, warn them before the account is created so
  // nobody is filed under the wrong grade.
  // ============================================

  function showGradeWarning(selectedGrade, source) {
    const node = document.getElementById("gradeWarning");
    const hint = document.getElementById("signupGradeHint");
    if (!node) return false;
    if (source === "login") document.getElementById("registerPanel").prepend(node);

    if (!selectedGrade || Number(selectedGrade) === grade) {
      node.hidden = true;
      node.textContent = "";
      if (hint) hint.textContent = `This page is the Grade ${grade} assessment.`;
      return false;
    }

    node.innerHTML = `<span class="rma-auth-warning-icon" aria-hidden="true">⚠️</span><span>
        <strong>Grade level mismatch!</strong><br>
        You selected <strong>Grade ${selectedGrade}</strong>, but you are on the <strong>Grade ${grade}</strong> ${source === "login" ? "sign-in page" : "sign-up page"}.
        Continuing will file your account under <strong>Grade ${selectedGrade}</strong>.
        Please check that you opened the correct grade level, or change your selection to Grade ${grade}.
      </span>`;
    node.hidden = false;
    if (hint) hint.textContent = "";
    return true;
  }

  function resetGradeConfirmation() {
    state.gradeConfirmed = false;
    const button = document.getElementById("registerBtn");
    if (button) button.querySelector("span").textContent = "Create account";
  }

  // ============================================
  // OFFLINE SUBMISSION SYNC
  // A failed submit must never silently discard a student's answers. The
  // payload is queued in localStorage by rma-data.js and replayed here as soon
  // as the connection returns.
  // ============================================

  function syncProgress() {
    const pending = window.RMAData?.pendingCount ? window.RMAData.pendingCount() : 0;
    if (!pending) {
      window.RMAAuth?.showProgressNotification?.("✓ Progress synced");
      return Promise.resolve(false);
    }
    window.RMAAuth?.showProgressNotification?.("Syncing…");
    return window.RMAData
      .flushPending()
      .then((done) => {
        window.RMAAuth?.showProgressNotification?.(done ? "✓ Progress synced" : "Still offline — answers saved locally ✓");
        return done;
      })
      .catch(() => false);
  }

  function profileFrom(value) {
    const profile = value.profile || value;
    state.profile = profile;
    state.token = value.token;
    window.RMAAuth.session = { token: state.token, profile };
    sessionStorage.setItem("rma_session", JSON.stringify(window.RMAAuth.session));
    
    // Store profile in hidden fields for assessment pages
    document.getElementById("lastName").value = profile.last_name;
    document.getElementById("firstName").value = profile.first_name;
    document.getElementById("midInitial").value = profile.middle_initial || "";
    document.getElementById("studentSection").value = profile.section;
    
    // Clear any saved progress when logging in fresh
    localStorage.removeItem(PROGRESS_KEY);
  }

  function restoreSavedSession() {
    try {
      const saved = JSON.parse(sessionStorage.getItem("rma_session") || "null");
      const profile = saved && saved.profile;
      if (!saved?.token || !profile || Number(profile.grade) !== grade) return false;
      state.profile = profile;
      state.token = saved.token;
      window.RMAAuth.session = saved;
      document.getElementById("lastName").value = profile.last_name;
      document.getElementById("firstName").value = profile.first_name;
      document.getElementById("midInitial").value = profile.middle_initial || "";
      document.getElementById("studentSection").value = profile.section;
      return true;
    } catch {
      sessionStorage.removeItem("rma_session");
      return false;
    }
  }

  function beginAssessment() {
    const button = document.getElementById("startBtn");
    if (!button || !state.profile) return;
    const student = window.gameState && window.gameState.student;
    if (student) {
      student.studentId = state.profile.student_code;
      student.studentUuid = state.profile.student_id;
      student.teacherTitle = state.profile.teacher_title || "";
      student.teacherFirstName = state.profile.teacher_first_name || "";
      student.teacherLastName = state.profile.teacher_last_name || "";
      student.section = state.profile.section;
    }
    document.getElementById("loginOverlay").style.display = "none";
    window.RMAAuth.bypass = true;
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    window.RMAAuth.bypass = false;
  }

  function continueToAssessment() {
    if (!state.profile) return;
    const plans = {
      7: { questions: 35, minutes: 20 },
      8: { questions: 50, minutes: 30 },
      9: { questions: 60, minutes: 35 },
      10: { questions: 60, minutes: 35 }
    };
    const plan = plans[grade] || { questions: 35, minutes: 25 };
    // Keep the authenticated form and its hidden profile fields mounted. The
    // grade page attached its start handler to that exact button node during
    // initial load; replacing overlay.innerHTML detached the wired button and
    // made "Begin practice" appear clickable while doing nothing.
    const authCard = overlay.querySelector(".rma-auth-card");
    if (authCard) authCard.hidden = true;
    overlay.querySelector(".rma-ready-card")?.remove();
    overlay.insertAdjacentHTML("beforeend", `
      <section class="rma-ready-card" role="dialog" aria-labelledby="rmaReadyTitle" aria-modal="true">
        <p class="rma-auth-eyebrow">You’re signed in</p>
        <h2 id="rmaReadyTitle">Ready for Grade ${grade} practice?</h2>
        <p class="rma-ready-name"></p>
        <div class="rma-ready-facts" aria-label="Assessment details">
          <div><b>${plan.questions}</b><span>questions</span></div>
          <div><b>About ${plan.minutes}</b><span>minutes</span></div>
          <div><b>30 sec</b><span>per question</span></div>
        </div>
        <section class="rma-ready-rules" aria-labelledby="rmaReadyRulesTitle">
          <h3 id="rmaReadyRulesTitle">Keep your attempt valid</h3>
          <ul>
            <li>Stay on this tab and keep the practice in full screen.</li>
            <li>Do not refresh, close, or cancel while an attempt is running.</li>
            <li>Keep working—one minute without activity is recorded.</li>
            <li>Do not open developer tools, view page source, or use screenshot shortcuts.</li>
          </ul>
          <p>Repeated violations or cancellations can make practice unavailable for one day.</p>
        </section>
        <p class="rma-ready-note">Choose a quiet place. Your progress is saved if the connection drops, and your teacher will see the completed attempt.</p>
        <button type="button" class="rma-auth-primary" id="confirmAssessmentStart">Begin practice</button>
        <button type="button" class="rma-auth-secondary" id="returnToSignIn">Not yet</button>
      </section>`);
    overlay.style.display = "grid";
    overlay.querySelector(".rma-ready-name").textContent = `${state.profile.student_code} · ${state.profile.section}`;
    document.getElementById("confirmAssessmentStart").addEventListener("click", beginAssessment, { once: true });
    document.getElementById("returnToSignIn").addEventListener("click", () => {
      window.RMAAuth.logout();
      state.mode = "login";
      render();
    });
    document.getElementById("confirmAssessmentStart").focus();
  }

  // ============================================
  // LOCAL STORAGE PROGRESS SAVING
  // ============================================
  
  /**
   * Save assessment progress to localStorage
   * Called by assessment pages via window.RMAAuth.saveProgress
   */
  function saveProgress(answers, startTime, additionalData = {}) {
    try {
      const progress = {
        answers: answers || {},
        startTime: startTime || Date.now(),
        lastSaved: Date.now(),
        grade: grade,
        ...additionalData
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      
      // Notify assessment page
      if (window.saveProgressCallback) {
        window.saveProgressCallback(true);
      }
      return true;
    } catch (error) {
      console.error("Failed to save progress:", error);
      if (window.saveProgressCallback) {
        window.saveProgressCallback(false);
      }
      return false;
    }
  }

  /**
   * Load saved progress from localStorage
   * Called by assessment pages via window.RMAAuth.loadProgress
   */
  function loadProgress() {
    try {
      const saved = localStorage.getItem(PROGRESS_KEY);
      if (saved) {
        const progress = JSON.parse(saved);
        // Validate it's for this grade
        if (progress.grade === grade) {
          return progress;
        }
      }
      return null;
    } catch (error) {
      console.error("Failed to load progress:", error);
      return null;
    }
  }

  /**
   * Clear saved progress
   * Called after successful submission
   */
  function clearProgress() {
    localStorage.removeItem(PROGRESS_KEY);
  }

  /**
   * Auto-save every 30 seconds if there's an active session
   */
  function startAutoSave() {
    if (window.autoSaveInterval) {
      clearInterval(window.autoSaveInterval);
    }
    
    window.autoSaveInterval = setInterval(() => {
      if (state.profile && state.token) {
        // Check if there are unsaved answers
        if (window.getCurrentAnswers) {
          const answers = window.getCurrentAnswers();
          const startTime = window.getStartTime ? window.getStartTime() : null;
          if (answers && Object.keys(answers).length > 0) {
            saveProgress(answers, startTime);
          }
        }
      }
    }, 30000); // 30 seconds
  }

  // ============================================
  // SIGN-UP SUGGESTIONS
  // ============================================
  //
  // A student typing a section or a teacher's name gets matches from the
  // database as they type.
  //
  // These used to be <datalist> elements, which browsers do not show at all on
  // phones -- Chrome on Android and every iOS browser ignore them -- so on a
  // tablet the boxes simply offered nothing. The popup below is drawn by the
  // page, so it behaves the same everywhere, and it is keyboard reachable too.

  var suggestSeq = 0;

  function suggestBoxFor(input) {
    var id = input.id + "Suggest";
    var box = document.getElementById(id);
    if (box) return box;
    box = document.createElement("ul");
    box.id = id;
    box.className = "rma-auth-suggest";
    box.setAttribute("role", "listbox");
    box.hidden = true;
    input.insertAdjacentElement("afterend", box);
    return box;
  }

  function closeSuggest(box) {
    if (box) {
      box.hidden = true;
      box.replaceChildren();
    }
  }

  function closeAllSuggests(except) {
    var open = document.querySelectorAll(".rma-auth-suggest");
    Array.prototype.forEach.call(open, function (box) {
      if (box !== except) closeSuggest(box);
    });
  }

  function paintSuggest(input, values) {
    var box = suggestBoxFor(input);
    if (!values || !values.length) { closeSuggest(box); return; }
    closeAllSuggests(box);
    box.replaceChildren(...values.map(function (value) {
      var item = document.createElement("li");
      item.setAttribute("role", "option");
      item.tabIndex = -1;
      item.textContent = value;
      // Keep whatever the student already typed, so accepting a suggestion does
      // not throw away the characters they entered.
      item.addEventListener("mousedown", function (event) {
        event.preventDefault();
        input.value = value;
        closeSuggest(box);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
      return item;
    }));
    box.hidden = false;
  }

  // Fired on every keystroke; a slow response is discarded rather than shown
  // after the student has typed on.
  async function suggestInto(input, fetchValues) {
    var prefix = input.value.trim();
    var box = suggestBoxFor(input);
    if (prefix.length < 2) { closeSuggest(box); return; }
    var seq = ++suggestSeq;
    try {
      var values = await fetchValues(prefix);
      if (seq !== suggestSeq) return;
      paintSuggest(input, values);
    } catch (error) {
      // Suggestions are a convenience. If the function has not been applied yet,
      // the student can still type the section and the name by hand.
      console.warn("Suggestions unavailable:", error.message);
    }
  }

  function suggestSection() {
    var input = document.getElementById("signupSection");
    if (!input) return Promise.resolve();
    return suggestInto(input, function (prefix) {
      return rpc("rma_section_suggestions", { p_grade: grade, p_prefix: prefix });
    });
  }

  function suggestTeacherLastNames() {
    var input = document.getElementById("teacherLastName");
    if (!input) return Promise.resolve();
    return suggestInto(input, function (prefix) {
      return rpc("rma_teacher_suggestions", { p_kind: "last", p_prefix: prefix, p_grade: grade });
    });
  }

  function suggestTeacherFirstNames() {
    var input = document.getElementById("teacherFirstName");
    if (!input) return Promise.resolve();
    return suggestInto(input, function (prefix) {
      return rpc("rma_teacher_suggestions", { p_kind: "first", p_prefix: prefix, p_grade: grade });
    });
  }

  function render() {
    if (!overlay) return;
    const gradeSelectHtml = [7, 8, 9, 10]
      .map((g) => `<option value="${g}"${g === grade ? " selected" : ""}>Grade ${g}</option>`)
      .join("");
    overlay.innerHTML = `
      <section class="rma-auth-card" aria-labelledby="authTitle">
        <a class="rma-auth-home" href="../index.html">← RMA PATHWAYS</a>
        <h2 id="authTitle">Grade ${grade} RMA</h2>
        <p class="rma-auth-help">Choose the best answer.</p>
        <div class="rma-auth-tabs" role="tablist" aria-label="Student account">
          <button type="button" class="rma-auth-tab active" data-panel="loginPanel">Log in</button>
          <button type="button" class="rma-auth-tab" data-panel="registerPanel">Sign up</button>
        </div>
        <div id="authMessage" class="rma-auth-message" role="alert" hidden></div>
        <div id="loginPanel" class="rma-auth-panel">
          <label>
            <span>Student ID</span>
            <input id="loginStudentId" autocomplete="username" placeholder="RMA-${grade}-000001" required>
          </label>
          <label>
            <span>Password</span>
            <span class="rma-auth-password">
              <input id="loginPassword" type="password" autocomplete="current-password" placeholder="Enter password" required>
              <button type="button" class="rma-auth-eye" data-toggle-password="loginPassword"
                      aria-label="Show password" aria-pressed="false" aria-controls="loginPassword">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
                     stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                  <line class="rma-auth-eye-slash" x1="3.5" y1="3.5" x2="20.5" y2="20.5"></line>
                </svg>
              </button>
            </span>
          </label>
          <button type="button" id="startBtn" class="rma-auth-primary">
            <span>Log in and start</span>
          </button>
        </div>
        <div id="registerPanel" class="rma-auth-panel" hidden>
          <label>
            <span>Grade level</span>
            <select id="signupGrade" required>
              <option value="">Select your grade level</option>
              ${gradeSelectHtml}
            </select>
            <small class="rma-auth-hint" id="signupGradeHint"></small>
          </label>
          <div id="gradeWarning" class="rma-auth-warning" role="alert" hidden></div>
          <label>
            <span>Student surname</span>
            <input id="signupLastName" autocomplete="family-name" maxlength="100" placeholder="DELA CRUZ" required>
          </label>
          <label>
            <span>Student first name</span>
            <input id="signupFirstName" autocomplete="given-name" maxlength="100" placeholder="JUAN" required>
          </label>
          <label>
            <span>Section</span>
            <input id="signupSection" autocomplete="off" maxlength="60" placeholder="TYPE YOUR SECTION" required>
          </label>
          <p class="rma-auth-section">MATH TEACHER'S NAME</p>
          <label>
            <span>MATH Teacher's title</span>
            <select id="teacherTitle"><option value="Mr.">Mr.</option><option value="Ms.">Ms.</option></select>
          </label>
          <label>
            <span>MATH Teacher's surname</span>
            <input id="teacherLastName" maxlength="100" autocomplete="off" placeholder="REYES" required>
          </label>
          <label>
            <span>MATH Teacher's first name</span>
            <input id="teacherFirstName" maxlength="100" autocomplete="off" placeholder="JUAN" required>
          </label>
          <p class="rma-auth-note">All fields are automatically written in CAPITAL LETTERS.</p>
          <p class="rma-auth-note">Keep your generated student ID and password safe.</p>
          <button type="button" id="registerBtn" class="rma-auth-primary">
            <span>Create account</span>
          </button>
        </div>
        <div id="credentialsPanel" class="rma-auth-panel" hidden>
          <h3>Account created</h3>
          <p>Your password will not be shown again.</p>
          <dl>
            <dt>Student ID</dt>
            <dd id="generatedStudentId"></dd>
            <dt>Generated password</dt>
            <dd id="generatedStudentPassword"></dd>
          </dl>
          <button type="button" id="continueBtn" class="rma-auth-primary">
            <span>Continue to practice</span>
          </button>
        </div>
        <input type="hidden" id="lastName">
        <input type="hidden" id="firstName">
        <input type="hidden" id="midInitial">
        <input type="hidden" id="studentSection">
      </section>`;
    const style = document.createElement("style");
    style.textContent = `
      #loginOverlay { 
        z-index: 10000; 
        overflow-y:auto; 
        padding:20px; 
        background: rgba(0,0,0,0.5);
      }
      .rma-auth-card { 
        width:min(470px,100%); 
        max-height:calc(100vh - 40px); 
        overflow:auto; 
        margin:auto; 
        padding:28px; 
        background:#fff; 
        color:#24191a; 
        border-radius:18px; 
        box-shadow:0 22px 70px #0004; 
        font:15px/1.45 system-ui,sans-serif; 
      }
      .rma-auth-card h2 { 
        margin:8px 0; 
        font-size:1.7rem; 
        color:var(--primary,#521018); 
      }
      .rma-auth-home { 
        color:var(--primary,#521018); 
        font-size:.8rem; 
        font-weight:700; 
        text-decoration:none; 
      }
      .rma-auth-help,.rma-auth-note { 
        color:#71666a; 
        font-size:.88rem; 
      }
      .rma-auth-tabs { 
        display:flex; 
        gap:8px; 
        margin:20px 0; 
        flex-wrap: wrap;
      }
      .rma-auth-tab { 
        flex:1; 
        min-width: 120px;
        padding:10px; 
        border:1px solid #ddd; 
        border-radius:9px; 
        background:#f7f5f1; 
        cursor:pointer; 
        font-weight:700;
        font-size: 0.85rem;
      }
      .rma-auth-tab.active { 
        color:#fff; 
        background:var(--primary,#521018); 
        border-color:var(--primary,#521018); 
      }
      .rma-auth-panel { 
        display:grid; 
        gap:12px; 
      }
      .rma-auth-panel[hidden] { 
        display:none; 
      }
      .rma-auth-panel label { 
        display:grid; 
        gap:5px; 
        font-size:.83rem; 
        font-weight:700; 
      }
      .rma-auth-panel span { 
        font-weight: 700;
        font-size: 0.85rem;
      }
      .rma-auth-panel input,.rma-auth-panel select { 
        width:100%; 
        box-sizing:border-box; 
        padding:11px 12px; 
        border:1px solid #d8d1cc; 
        border-radius:8px; 
        font:inherit; 
        /* ALL TEXT IN UPPERCASE */
        text-transform: uppercase;
      }
      .rma-auth-primary {
        width:100%;
        margin-top:4px;
        padding:12px 16px;
        border:0;
        border-radius:9px;
        color:#fff;
        background:var(--primary,#521018);
        font:700 1rem system-ui,sans-serif;
        cursor:pointer;
      }
      /* Password field with a reveal button. The button sits inside the label, so
         it needs its own stacking and hit area rather than pushing the input. */
      .rma-auth-password {
        position:relative;
        display:block;
      }
      .rma-auth-password input {
        padding-right:42px;
        box-sizing:border-box;
        width:100%;
      }
      .rma-auth-eye {
        position:absolute;
        right:6px;
        top:50%;
        transform:translateY(-50%);
        display:flex;
        align-items:center;
        justify-content:center;
        width:32px;
        height:32px;
        padding:0;
        border:0;
        border-radius:7px;
        background:transparent;
        color:#71666a;
        cursor:pointer;
      }
      .rma-auth-eye:hover { background:#f1ece7; color:#24191a; }
      .rma-auth-eye:focus-visible { outline:2px solid var(--primary,#521018); outline-offset:1px; }
      /* The slash only appears once the password is actually visible. */
      .rma-auth-eye-slash { opacity:0; }
      .rma-auth-eye[aria-pressed="true"] .rma-auth-eye-slash { opacity:1; }
      .rma-auth-eye[aria-pressed="true"] { color:var(--primary,#521018); }
      /* Sign-up suggestions. Drawn by the page rather than a <datalist>, which
         browsers ignore entirely on phones, so the section and teacher boxes
         offer matches on a tablet as well as a desktop. */
      .rma-auth-suggest {
        position:absolute; z-index:20; left:0; right:0; top:100%; margin:3px 0 0;
        max-height:190px; overflow:auto; -webkit-overflow-scrolling:touch; overscroll-behavior:contain;
        list-style:none; margin-inline:0; padding:4px;
        border:1px solid #d8d1cc; border-radius:10px; background:#fff;
        box-shadow:0 14px 30px rgba(36,25,26,.18);
      }
      .rma-auth-suggest[hidden] { display:none; }
      .rma-auth-suggest li {
        padding:9px 11px; border-radius:7px; font-size:.88rem; font-weight:600;
        cursor:pointer; text-transform:none; letter-spacing:0;
      }
      .rma-auth-suggest li:hover, .rma-auth-suggest li:focus-visible {
        color:#fff; background:var(--primary,#521018);
      }
      /* The popup is anchored to its field, so the label above it must not
         collapse onto it. */
      .rma-auth-panel label { position:relative; }
      .rma-auth-primary:disabled { 
        opacity:.65; 
        cursor:wait; 
      }
      .rma-auth-message { 
        margin:12px 0; 
        padding:10px 12px; 
        color:#7a1818; 
        background:#fff0ee; 
        border-radius:8px; 
        font-size:.88rem; 
      }
      .rma-auth-message[data-error="false"] { 
        color:#155b30; 
        background:#edf9f0; 
      } 
      .rma-auth-warning { 
        display:flex; 
        gap:9px; 
        align-items:flex-start; 
        padding:11px 13px; 
        color:#7c2d12; 
        background:#fff4e5; 
        border:1px solid #f0b47a; 
        border-left:4px solid #c2410c; 
        border-radius:8px; 
        font-size:.86rem; 
        line-height:1.45; 
      } 
      .rma-auth-warning[hidden] { 
        display:none; 
      } 
      .rma-auth-warning .rma-auth-warning-icon { 
        flex:0 0 auto; 
        font-size:1rem; 
      } 
      .rma-auth-hint { 
        color:#71666a; 
        font-weight:400; 
        font-size:.76rem; 
      } 
      .rma-auth-section { 
        margin:6px 0 -2px; 
        padding:6px 10px; 
        color:#fff; 
        background:var(--primary,#521018); 
        border-radius:6px; 
        font-size:.74rem; 
        font-weight:800; 
        letter-spacing:.10em; 
        text-align:center; 
      }
      .rma-auth-panel dl { 
        display:grid; 
        grid-template-columns:1fr; 
        gap:4px; 
        padding:12px; 
        background:#f8f4e8; 
        border-radius:8px; 
      }
      .rma-auth-panel dt { 
        color:#655; 
        font-size:.75rem; 
        font-weight:700; 
      }
      .rma-auth-panel dd { 
        margin:0 0 8px; 
        overflow-wrap:anywhere; 
        font:700 1.1rem ui-monospace,monospace; 
      }
      
      /* Mobile Optimization - Phase 1 */
      @media (max-width: 412px) {
        .rma-auth-card { 
          width: min(100% - 40px, 470px);
          padding: 20px;
        }
        .rma-auth-panel label { 
          font-size: 0.85rem;
        }
        .rma-auth-primary { 
          font-size: 0.95rem;
        }
      }
      
      @media (max-width: 375px) {
        .rma-auth-card { 
          padding: 16px;
        }
        .rma-auth-tab { 
          padding: 8px;
          font-size: 0.75rem;
        }
      }
      
      @media (max-width: 320px) {
        .rma-auth-card { 
          padding: 14px;
        }
        .rma-auth-panel label { 
          font-size: 0.8rem;
        }
        .rma-auth-panel input { 
          padding: 10px 10px;
        }
        .rma-auth-primary { 
          padding: 10px 12px;
          font-size: 0.9rem;
        }
        .rma-auth-help,.rma-auth-note { 
          font-size: 0.8rem;
        }
      }
      
      /* Progress saving notification */
      .rma-progress-notification {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        background: #155b30;
        color: white;
        border-radius: 8px;
        font-size: 0.85rem;
        z-index: 10001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideUp 0.3s ease-out;
      }
      
      .rma-progress-notification.hidden {
        display: none;
      }

      .rma-ready-card { width:min(520px,calc(100% - 28px)); padding:28px; border-radius:24px; background:#fff; box-shadow:0 24px 70px rgba(31,29,54,.22); text-align:left; }
      .rma-auth-eyebrow { margin:0 0 4px; color:#B3203B; font-size:.76rem; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
      .rma-ready-card h2 { margin:0 0 6px; }
      .rma-ready-name { margin:0 0 20px; color:#5B5878; font-weight:700; }
      .rma-ready-facts { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:18px 0; }
      .rma-ready-facts div { padding:13px 9px; border:1px solid #D3E6EE; border-radius:14px; background:#F3FBFE; text-align:center; }
      .rma-ready-facts b,.rma-ready-facts span { display:block; }
      .rma-ready-facts b { color:#1F1D36; font-size:1.05rem; }
      .rma-ready-facts span { margin-top:3px; color:#5B5878; font-size:.72rem; }
      .rma-ready-note { color:#5B5878; line-height:1.55; }
      .rma-ready-rules { margin:16px 0; padding:14px 16px; border:1px solid #FFD2D9; border-radius:14px; background:#FFF6F7; }
      .rma-ready-rules h3 { margin:0 0 8px; color:#B3203B; font-size:.92rem; }
      .rma-ready-rules ul { display:grid; gap:6px; margin:0; padding-left:20px; color:#3F3B57; font-size:.82rem; line-height:1.4; }
      .rma-ready-rules p { margin:10px 0 0; color:#7A2435; font-size:.76rem; font-weight:700; }
      .rma-ready-card .rma-auth-secondary { width:100%; margin-top:8px; }
      @media(max-width:480px) { .rma-ready-facts { grid-template-columns:1fr; } .rma-ready-facts div { display:flex; justify-content:space-between; align-items:center; } }
      
      @keyframes slideUp {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      
      /* Auto-capitalize all text inputs. The reveal button flips the password field to
         type="text", so excluding by type alone would uppercase a password the
         moment a student checks it. Exclude the field itself instead. */
      input:not([type="password"]):not(.rma-auth-password input) {
        text-transform: uppercase;
      }
    `;
    document.head.appendChild(style);
    
    // Add progress notification element
    const notification = document.createElement('div');
    notification.id = 'rmaProgressNotification';
    notification.className = 'rma-progress-notification hidden';
    notification.textContent = 'Answer saved locally ✓';
    document.body.appendChild(notification);

    // innerHTML was just replaced, so any revealed password is masked again.
    maskPasswords();

    // Expose save/load to assessment pages
    window.RMAAuth.saveProgress = saveProgress;
    window.RMAAuth.loadProgress = loadProgress;
    window.RMAAuth.clearProgress = clearProgress;
    window.RMAAuth.syncProgress = syncProgress;
    window.RMAAuth.showProgressNotification = function() {
      const notif = document.getElementById('rmaProgressNotification');
      if (notif) {
        notif.classList.remove('hidden');
        setTimeout(() => notif.classList.add('hidden'), 2000);
      }
    };
  }

  window.RMAAuth = {
    session: null,
    bypass: false,
    rpc,
    logout() {
      sessionStorage.removeItem("rma_session");
      this.session = null;
      state.profile = null;
      state.token = null;
    },
    saveProgress,
    loadProgress,
    clearProgress
  };

  render();
  if (!overlay) return;

  // Show the page-grade hint straight away, and clear the warning if a student
  // picks the grade that matches the page they opened.
  showGradeWarning(grade, "register");

  // Reveal a password so it can be checked before submitting. Delegated, because
  // the card is re-rendered by render() and a bound listener would not survive.
  // Masking is also restored whenever the form is re-rendered, so a revealed
  // password is never left on screen after the view is rebuilt.
  overlay.addEventListener("click", (event) => {
    const button = event.target.closest("[data-toggle-password]");
    if (!button) return;
    // The button sits inside a <label>, so stop the label from also claiming the
    // click, which would fight the focus the toggle is trying to place.
    event.preventDefault();
    const input = document.getElementById(button.dataset.togglePassword);
    if (!input) return;
    const revealed = input.type === "password";
    input.type = revealed ? "text" : "password";
    button.setAttribute("aria-pressed", String(revealed));
    button.setAttribute("aria-label", revealed ? "Hide password" : "Show password");
    // Keep the caret in the password, so typing continues where it left off.
    input.focus({ preventScroll: true });
    const atEnd = input.value.length;
    try { input.setSelectionRange(atEnd, atEnd); } catch { /* not all types support it */ }
  });

  // A freshly rendered card must never inherit a revealed password. Declared as a
  // function so it hoists: render() calls this before the definition is reached.
  function maskPasswords() {
    overlay.querySelectorAll("[data-toggle-password]").forEach((button) => {
      const input = document.getElementById(button.dataset.togglePassword);
      if (input) input.type = "password";
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", "Show password");
    });
  }

  overlay.addEventListener("change", (event) => {
    if (event.target.id === "signupGrade") {
      showGradeWarning(event.target.value, "register");
      resetGradeConfirmation();
    }
  });

  overlay.addEventListener("input", (event) => {
    // AUTO-UPPERCASE ALL TEXT FIELDS
    const textInputs = ['signupLastName', 'signupFirstName', 'signupSection',
                       'teacherLastName', 'teacherFirstName', 'loginStudentId', 'loginPassword'];
    
    if (textInputs.includes(event.target.id)) {
      const start = event.target.selectionStart;
      event.target.value = event.target.value.toLocaleUpperCase();
      event.target.setSelectionRange(start, start);
      resetGradeConfirmation();
    }
    
    if (event.target.id === "loginStudentId") {
      const idGrade = (event.target.value.trim().toUpperCase().match(/^RMA-(\d+)-/) || [])[1];
      showGradeWarning(idGrade, "login");
    }

    // Trigger suggestions
    if (event.target.id === "signupSection") suggestSection();
    if (event.target.id === "teacherLastName") suggestTeacherLastNames();
    if (event.target.id === "teacherFirstName") suggestTeacherFirstNames();

    // Typing anywhere else, or pressing Tab out of a field, dismisses the popup.
    if (!event.target.id.startsWith("signupSection")
      && event.target.id !== "teacherLastName"
      && event.target.id !== "teacherFirstName") {
      closeAllSuggests(null);
    }
  });

  // A tap outside, an Escape, or switching tab closes whichever popup is open.
  overlay.addEventListener("focusout", (event) => {
    // A short delay lets a mousedown on an option land before the list is torn
    // down, otherwise tapping a suggestion on a phone closes it first.
    setTimeout(function () {
      if (overlay.contains(document.activeElement)) return;
      closeAllSuggests(null);
    }, 120);
  });

  overlay.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAllSuggests(null);
  });

  overlay.addEventListener("click", async (event) => {
    const tab = event.target.closest("[data-panel]");
    if (tab) {
      overlay.querySelectorAll(".rma-auth-panel").forEach((panel) => panel.hidden = panel.id !== tab.dataset.panel);
      overlay.querySelectorAll(".rma-auth-tab").forEach((button) => button.classList.toggle("active", button === tab));
      // Keep the grade warning visible on whichever panel is open.
      const warning = document.getElementById("gradeWarning");
      const activePanel = document.getElementById(tab.dataset.panel);
      if (warning && activePanel && !activePanel.contains(warning)) activePanel.prepend(warning);
      document.getElementById("authMessage").hidden = true;
      return;
    }

    if (event.target.id === "continueBtn") {
      continueToAssessment();
      // Start auto-save when assessment starts
      startAutoSave();
      return;
    }
    if (event.target.id !== "registerBtn" && event.target.id !== "startBtn") return;
    if (event.target.id === "startBtn" && window.RMAAuth.bypass) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (state.busy) return;

    const button = event.target;
    state.busy = true;
    button.disabled = true;
    try {
      if (button.id === "registerBtn") {
        // GET ALL FIELDS - Teacher name is REQUIRED for mastery card
        const selectedGrade = document.getElementById("signupGrade").value;
        const lastName = document.getElementById("signupLastName").value.trim();
        const firstName = document.getElementById("signupFirstName").value.trim();
        const section = document.getElementById("signupSection").value.trim();
        const teacherTitle = document.getElementById("teacherTitle").value;
        const teacherLastName = document.getElementById("teacherLastName").value.trim();
        const teacherFirstName = document.getElementById("teacherFirstName").value.trim();

        // Validate - ALL FIELDS REQUIRED
        if (!selectedGrade) {
          throw new Error("Please select your grade level.");
        }
        if (!lastName || !firstName || !section || !teacherLastName || !teacherFirstName) {
          throw new Error("Please complete ALL required fields.");
        }

        // Grade level mismatch: warn once, then require a deliberate second tap.
        if (showGradeWarning(selectedGrade, "register") && !state.gradeConfirmed) {
          state.gradeConfirmed = true;
          button.querySelector("span").textContent =
            `Tap again to create a Grade ${selectedGrade} account`;
          button.disabled = false;
          return;
        }

        // All values already in uppercase due to input event
        const fields = {
          p_grade: Number(selectedGrade),
          p_last_name: lastName.toLocaleUpperCase(),
          p_first_name: firstName.toLocaleUpperCase(),
          p_middle_initial: "",
          p_section: section.toLocaleUpperCase(),
          p_teacher_title: teacherTitle,
          p_teacher_last_name: teacherLastName.toLocaleUpperCase(),
          p_teacher_first_name: teacherFirstName.toLocaleUpperCase()
        };
        
        const result = await rpc("rma_student_register", fields);
        profileFrom(result);
        document.getElementById("generatedStudentId").textContent = result.student_code;
        document.getElementById("generatedStudentPassword").textContent = result.generated_password;
        document.getElementById("loginPanel").hidden = true;
        document.getElementById("registerPanel").hidden = true;
        document.getElementById("credentialsPanel").hidden = false;
        overlay.querySelectorAll(".rma-auth-tab").forEach((item) => item.hidden = true);
        message("Account created. Write down both credentials before continuing.", false);
        
        // Start auto-save for when they start assessment
        startAutoSave();
      } else {
        const studentId = document.getElementById("loginStudentId").value.trim().toLocaleUpperCase();
        // The student ID encodes the grade (RMA-7-000001). Warn on a mismatch.
        const idGrade = (studentId.match(/^RMA-(\d+)-/) || [])[1];
        if (idGrade) showGradeWarning(idGrade, "login");

        const result = await rpc("rma_student_login", {
          p_student_code: studentId,
          // rma_student_login compares the password with crypt(), which is
          // case-sensitive, and the password is generated as upper(hex). Every
          // generated password therefore contains at least one letter, so a
          // student who writes it down or types it in lower case can never log
          // in. Uppercase it here, the same way the student ID and every sign-up
          // field are already normalised, so what is typed is what is checked.
          p_password: document.getElementById("loginPassword").value.toLocaleUpperCase(),
          p_grade: idGrade || grade
        });
        profileFrom(result);
        continueToAssessment();
        
        // Start auto-save for returning students
        startAutoSave();
      }
    } catch (error) {
      console.error("Student account error:", error);
      const detail = error.message || "Unable to complete account request.";
      message(detail.includes("duplicate") || detail.includes("already exists")
        ? "An account with these details already exists. Log in with the existing student ID; contact the teacher if the account belongs to someone else."
        : detail);
    } finally {
      state.busy = false;
      button.disabled = false;
    }
  }, true);

  // A refresh before the student begins should return to the readiness screen,
  // not force another login. Once an attempt starts, the grade page's own
  // refresh guard still handles it as a violation.
  if (restoreSavedSession()) continueToAssessment();
})();
