// Student credential onboarding for the standalone grade assessments.
(function () {
  const config = window.RMA_SUPABASE;
  const grade = Number(document.body.dataset.grade);
  const overlay = document.getElementById("loginOverlay");
  const state = { profile: null, token: null, busy: false };

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

  function profileFrom(value) {
    const profile = value.profile || value;
    state.profile = profile;
    state.token = value.token;
    window.RMAAuth.session = { token: state.token, profile };
    sessionStorage.setItem("rma_session", JSON.stringify(window.RMAAuth.session));
    document.getElementById("lastName").value = profile.last_name;
    document.getElementById("firstName").value = profile.first_name;
    document.getElementById("midInitial").value = profile.middle_initial || "";
    document.getElementById("studentSection").value = profile.section;
  }

  function continueToAssessment() {
    const button = document.getElementById("startBtn");
    if (!button || !state.profile) return;
    const student = window.gameState && window.gameState.student;
    if (student) {
      student.studentId = state.profile.student_code;
      student.studentUuid = state.profile.student_id;
      student.teacherTitle = state.profile.teacher_title;
      student.teacherFirstName = state.profile.teacher_first_name;
      student.teacherLastName = state.profile.teacher_last_name;
      student.section = state.profile.section;
    }
    document.getElementById("loginOverlay").style.display = "none";
    window.RMAAuth.bypass = true;
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    window.RMAAuth.bypass = false;
  }

  async function suggestTeachers() {
    const input = document.getElementById("teacherFirstName");
    const list = document.getElementById("teacherSuggestions");
    const prefix = input.value.trim();
    if (prefix.length < 2) return;
    try {
      const names = await rpc("rma_teacher_suggestions", { p_prefix: prefix });
      list.replaceChildren(...names.map((name) => {
        const option = document.createElement("option");
        option.value = name;
        return option;
      }));
    } catch (error) {
      console.warn("Teacher-name suggestions unavailable:", error.message);
    }
  }

  function render() {
    if (!overlay) return;
    overlay.innerHTML = `
      <section class="rma-auth-card" aria-labelledby="authTitle">
        <a class="rma-auth-home" href="../index.html">← RMA PATHWAYS</a>
        <h2 id="authTitle">Grade ${grade} RMA</h2>
        <p class="rma-auth-help">Create a student account once, or sign in with your student ID and password.</p>
        <div class="rma-auth-tabs" role="tablist" aria-label="Student account">
          <button type="button" class="rma-auth-tab active" data-panel="loginPanel">Log in</button>
          <button type="button" class="rma-auth-tab" data-panel="registerPanel">First-time sign up</button>
        </div>
        <div id="authMessage" class="rma-auth-message" role="alert" hidden></div>
        <div id="loginPanel" class="rma-auth-panel">
          <label>Student ID<input id="loginStudentId" autocomplete="username" placeholder="RMA-${grade}-000001" required></label>
          <label>Password<input id="loginPassword" type="password" autocomplete="current-password" required></label>
          <button type="button" id="startBtn" class="rma-auth-primary">Log in and start</button>
        </div>
        <div id="registerPanel" class="rma-auth-panel" hidden>
          <label>Student surname<input id="signupLastName" autocomplete="family-name" maxlength="100" required></label>
          <label>Student first name<input id="signupFirstName" autocomplete="given-name" maxlength="100" required></label>
          <label>Middle initial (optional)<input id="signupMiddleInitial" maxlength="5"></label>
          <label>Section<input id="signupSection" maxlength="60" placeholder="TYPE YOUR SECTION" required></label>
          <label>Teacher title<select id="teacherTitle"><option value="Mr.">Mr.</option><option value="Ms.">Ms.</option></select></label>
          <label>Teacher surname<input id="teacherLastName" maxlength="100" autocomplete="off" required></label>
          <label>Teacher first name<input id="teacherFirstName" maxlength="100" list="teacherSuggestions" autocomplete="off" required><datalist id="teacherSuggestions"></datalist></label>
          <button type="button" id="registerBtn" class="rma-auth-primary">Create account and generate credentials</button>
          <p class="rma-auth-note">Keep your generated student ID and password safe. The password is shown only once.</p>
        </div>
        <div id="credentialsPanel" class="rma-auth-panel" hidden>
          <h3>Account created — save these credentials</h3>
          <p>Your password will not be shown again.</p>
          <dl><dt>Student ID</dt><dd id="generatedStudentId"></dd><dt>Generated password</dt><dd id="generatedStudentPassword"></dd></dl>
          <button type="button" id="continueBtn" class="rma-auth-primary">Continue to practice</button>
        </div>
        <input type="hidden" id="lastName"><input type="hidden" id="firstName"><input type="hidden" id="midInitial"><input type="hidden" id="studentSection">
      </section>`;
    const style = document.createElement("style");
    style.textContent = `
      #loginOverlay { z-index: 10000; overflow-y:auto; padding:20px; }
      .rma-auth-card { width:min(470px,100%); max-height:calc(100vh - 40px); overflow:auto; margin:auto; padding:28px; background:#fff; color:#24191a; border-radius:18px; box-shadow:0 22px 70px #0004; font:15px/1.45 system-ui,sans-serif; }
      .rma-auth-card h2 { margin:8px 0; font-size:1.7rem; color:var(--primary,#521018); }
      .rma-auth-home { color:var(--primary,#521018); font-size:.8rem; font-weight:700; text-decoration:none; }
      .rma-auth-help,.rma-auth-note { color:#71666a; font-size:.88rem; }
      .rma-auth-tabs { display:flex; gap:8px; margin:20px 0; }
      .rma-auth-tab { flex:1; padding:10px; border:1px solid #ddd; border-radius:9px; background:#f7f5f1; cursor:pointer; font-weight:700; }
      .rma-auth-tab.active { color:#fff; background:var(--primary,#521018); border-color:var(--primary,#521018); }
      .rma-auth-panel { display:grid; gap:12px; }
      .rma-auth-panel[hidden] { display:none; }
      .rma-auth-panel label { display:grid; gap:5px; font-size:.83rem; font-weight:700; }
      .rma-auth-panel input,.rma-auth-panel select { width:100%; box-sizing:border-box; padding:11px 12px; border:1px solid #d8d1cc; border-radius:8px; font:inherit; }
      .rma-auth-primary { width:100%; margin-top:4px; padding:12px 16px; border:0; border-radius:9px; color:#fff; background:var(--primary,#521018); font:700 1rem system-ui,sans-serif; cursor:pointer; }
      .rma-auth-primary:disabled { opacity:.65; cursor:wait; }
      .rma-auth-message { margin:12px 0; padding:10px 12px; color:#7a1818; background:#fff0ee; border-radius:8px; font-size:.88rem; }
      .rma-auth-message[data-error="false"] { color:#155b30; background:#edf9f0; }
      .rma-auth-panel dl { display:grid; grid-template-columns:1fr; gap:4px; padding:12px; background:#f8f4e8; border-radius:8px; }
      .rma-auth-panel dt { color:#655; font-size:.75rem; font-weight:700; }
      .rma-auth-panel dd { margin:0 0 8px; overflow-wrap:anywhere; font:700 1.1rem ui-monospace,monospace; }
    `;
    document.head.appendChild(style);
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
    }
  };

  render();
  if (!overlay) return;

  overlay.addEventListener("input", (event) => {
    if (event.target.id === "signupLastName" || event.target.id === "signupSection" || event.target.id === "teacherLastName") {
      const start = event.target.selectionStart;
      event.target.value = event.target.value.toLocaleUpperCase();
      event.target.setSelectionRange(start, start);
    }
    if (event.target.id === "teacherFirstName") suggestTeachers();
  });

  overlay.addEventListener("click", async (event) => {
    const tab = event.target.closest("[data-panel]");
    if (tab) {
      overlay.querySelectorAll(".rma-auth-panel").forEach((panel) => panel.hidden = panel.id !== tab.dataset.panel);
      overlay.querySelectorAll(".rma-auth-tab").forEach((button) => button.classList.toggle("active", button === tab));
      document.getElementById("authMessage").hidden = true;
      return;
    }

    if (event.target.id === "continueBtn") {
      continueToAssessment();
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
        const fields = {
          p_grade: grade,
          p_last_name: document.getElementById("signupLastName").value.trim().toLocaleUpperCase(),
          p_first_name: document.getElementById("signupFirstName").value.trim(),
          p_middle_initial: document.getElementById("signupMiddleInitial").value.trim().toLocaleUpperCase(),
          p_section: document.getElementById("signupSection").value.trim().toLocaleUpperCase(),
          p_teacher_title: document.getElementById("teacherTitle").value,
          p_teacher_last_name: document.getElementById("teacherLastName").value.trim().toLocaleUpperCase(),
          p_teacher_first_name: document.getElementById("teacherFirstName").value.trim()
        };
        if (Object.values(fields).some((value, index) => index > 0 && !value && index !== 3)) throw new Error("Complete all required fields before signing up.");
        const result = await rpc("rma_student_register", fields);
        profileFrom(result);
        document.getElementById("generatedStudentId").textContent = result.student_code;
        document.getElementById("generatedStudentPassword").textContent = result.generated_password;
        document.getElementById("loginPanel").hidden = true;
        document.getElementById("registerPanel").hidden = true;
        document.getElementById("credentialsPanel").hidden = false;
        overlay.querySelectorAll(".rma-auth-tab").forEach((item) => item.hidden = true);
        message("Account created. Write down both credentials before continuing.", false);
      } else {
        const result = await rpc("rma_student_login", {
          p_student_code: document.getElementById("loginStudentId").value.trim().toLocaleUpperCase(),
          p_password: document.getElementById("loginPassword").value,
          p_grade: grade
        });
        profileFrom(result);
        continueToAssessment();
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
})();
