(function () {
  const config = window.RMA_SUPABASE;
  const loginCard = document.getElementById("loginCard");
  const changeCard = document.getElementById("changeCard");
  const dashboard = document.getElementById("dashboard");
  const message = document.getElementById("teacherMessage");
  const passwordMessage = document.getElementById("passwordMessage");
  const dashboardMessage = document.getElementById("dashboardMessage");
  const gradeFilter = document.getElementById("gradeFilter");
  const sectionFilter = document.getElementById("sectionFilter");
  let token = "";
  let rows = [];

  async function rpc(name, payload) {
    const response = await fetch(`${config.url}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: { apikey: config.publishableKey, Authorization: `Bearer ${config.publishableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.details || `Request failed (${response.status})`);
    return data;
  }

  function setMessage(node, text, error = true) {
    node.className = error ? "error" : "success";
    node.textContent = text;
    node.hidden = false;
  }

  function showChangePassword() {
    loginCard.hidden = true;
    changeCard.hidden = false;
    dashboard.hidden = true;
  }

  function showDashboard() {
    loginCard.hidden = true;
    changeCard.hidden = true;
    dashboard.hidden = false;
    loadDashboard();
  }

  function unique(values) { return [...new Set(values.filter(Boolean))]; }

  async function loadDashboard() {
    dashboardMessage.hidden = true;
    try {
      rows = await rpc("rma_teacher_dashboard", { p_token: token });
      const grades = unique(rows.map((row) => String(row.grade))).sort((a, b) => Number(a) - Number(b));
      gradeFilter.innerHTML = '<option value="">Select grade</option>' + grades.map((grade) => `<option value="${grade}">Grade ${grade}</option>`).join("");
      sectionFilter.innerHTML = '<option value="">Select section</option>';
      document.getElementById("reportCard").hidden = true;
      if (!rows.length) setMessage(dashboardMessage, "No student accounts or completed attempts are recorded yet.", false);
    } catch (error) {
      setMessage(dashboardMessage, error.message || "Could not load mastery data.");
      if (String(error.message).includes("expired")) { token = ""; dashboard.hidden = true; loginCard.hidden = false; }
    }
  }

  function refreshSections() {
    const grade = Number(gradeFilter.value);
    const sections = unique(rows.filter((row) => Number(row.grade) === grade).map((row) => row.section)).sort((a, b) => a.localeCompare(b));
    sectionFilter.innerHTML = '<option value="">Select section</option>' + sections.map((section) => `<option value="${escapeHtml(section)}">${escapeHtml(section)}</option>`).join("");
    document.getElementById("reportCard").hidden = true;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function parseResponses(row) {
    const result = new Map();
    String(row.rma_data || "").split("|").forEach((answer, index) => {
      if (answer === "0" || answer === "1") result.set(`RMA Q${index + 1}`, answer === "1");
    });
    String(row.bank_data || "").split("|").forEach((entry) => {
      const match = entry.match(/^([^:]+):([01])$/);
      if (match) result.set(`Bank item ${match[1]}`, match[2] === "1");
    });
    return result;
  }

  function renderReport() {
    const grade = Number(gradeFilter.value);
    const section = sectionFilter.value;
    const members = rows.filter((row) => Number(row.grade) === grade && row.section === section);
    const attempts = members.filter((row) => row.score !== null && row.score !== undefined);
    const avg = attempts.length ? Math.round(attempts.reduce((sum, row) => sum + Number(row.score || 0), 0) / attempts.length) : 0;
    document.getElementById("summary").innerHTML = `
      <div class="metric"><b>${members.length}</b>Students in section</div>
      <div class="metric"><b>${attempts.length}</b>Completed attempts</div>
      <div class="metric"><b>${attempts.length ? `${avg}%` : "—"}</b>Average latest score</div>`;

    const totals = new Map();
    attempts.forEach((row) => parseResponses(row).forEach((correct, question) => {
      const total = totals.get(question) || { correct: 0, count: 0 };
      total.count++;
      if (correct) total.correct++;
      totals.set(question, total);
    }));
    const masteryRows = document.getElementById("masteryRows");
    const orderedQuestions = [...totals.keys()].sort((a, b) => {
      const qa = a.match(/(\d+)$/); const qb = b.match(/(\d+)$/);
      const groupA = a.startsWith("RMA") ? 0 : 1; const groupB = b.startsWith("RMA") ? 0 : 1;
      return groupA - groupB || Number(qa?.[1] || 0) - Number(qb?.[1] || 0);
    });
    masteryRows.innerHTML = orderedQuestions.length ? orderedQuestions.map((question) => {
      const total = totals.get(question); const rate = Math.round((total.correct / total.count) * 100);
      return `<tr><td>${escapeHtml(question)}</td><td>${total.correct}</td><td>${total.count}</td><td><div class="bar" aria-label="${rate}% mastery"><i style="width:${rate}%"></i></div></td><td><b>${rate}%</b></td></tr>`;
    }).join("") : '<tr><td colspan="5">No item-level results have been submitted for this section yet.</td></tr>';

    document.getElementById("studentRows").innerHTML = members.map((row) => {
      const score = row.score === null || row.score === undefined ? "Not taken" : `${Number(row.score)}%`;
      const attempt = row.created_at ? new Date(row.created_at).toLocaleString() : "—";
      return `<tr><td>${escapeHtml(row.student_code)}</td><td>${escapeHtml(row.student_name)}</td><td>${escapeHtml(row.teacher_name)}</td><td>${score}</td><td>${escapeHtml(attempt)}</td></tr>`;
    }).join("") || '<tr><td colspan="5">No students are registered in this section yet.</td></tr>';
    document.getElementById("reportCard").hidden = false;
  }

  document.getElementById("teacherLogin").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    message.hidden = true;
    try {
      const result = await rpc("rma_teacher_login", {
        p_username: document.getElementById("teacherUsername").value.trim(),
        p_password: document.getElementById("teacherPassword").value
      });
      token = result.token;
      sessionStorage.setItem("rma_teacher_token", token);
      if (result.must_change_password) showChangePassword(); else showDashboard();
    } catch (error) {
      setMessage(message, error.message || "Sign in failed.");
    } finally { button.disabled = false; }
  });

  document.getElementById("saveTeacherPassword").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const password = document.getElementById("newTeacherPassword").value;
    if (password !== document.getElementById("confirmTeacherPassword").value) return setMessage(passwordMessage, "The password fields do not match.");
    button.disabled = true;
    try {
      await rpc("rma_teacher_change_password", { p_token: token, p_new_password: password });
      showDashboard();
    } catch (error) { setMessage(passwordMessage, error.message || "Could not change the password."); }
    finally { button.disabled = false; }
  });

  gradeFilter.addEventListener("change", refreshSections);
  sectionFilter.addEventListener("change", () => { if (gradeFilter.value && sectionFilter.value) renderReport(); });
  document.getElementById("teacherLogout").addEventListener("click", () => {
    sessionStorage.removeItem("rma_teacher_token"); token = ""; rows = [];
    dashboard.hidden = true; loginCard.hidden = false;
  });

  // Do not silently reuse a stored teacher token: signing in again keeps shared devices safer.
})();
