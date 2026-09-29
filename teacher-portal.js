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

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  async function loadDashboard() {
    dashboardMessage.hidden = true;
    try {
      rows = await rpc("rma_teacher_dashboard", { p_token: token });
      const grades = unique(rows.map((row) => String(row.grade))).sort((a, b) => Number(a) - Number(b));
      gradeFilter.innerHTML = '<option value="">Choose a grade level</option>' + grades.map((grade) => `<option value="${escapeHtml(grade)}">Grade ${escapeHtml(grade)}</option>`).join("");
      sectionFilter.innerHTML = '<option value="">Select a grade first</option>';
      sectionFilter.disabled = true;
      document.getElementById("reportCard").hidden = true;
      if (!rows.length) setMessage(dashboardMessage, "No student accounts are registered yet.", false);
    } catch (error) {
      setMessage(dashboardMessage, error.message || "Could not load mastery data.");
      if (String(error.message).toLowerCase().includes("expired")) { token = ""; dashboard.hidden = true; loginCard.hidden = false; }
    }
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

  function questionStats(members) {
    const totals = new Map();
    members.filter((row) => row.score !== null && row.score !== undefined).forEach((row) => {
      parseResponses(row).forEach((correct, question) => {
        const total = totals.get(question) || { correct: 0, count: 0 };
        total.count++;
        if (correct) total.correct++;
        totals.set(question, total);
      });
    });
    return [...totals.entries()].map(([question, total]) => ({
      question,
      correct: total.correct,
      count: total.count,
      rate: Math.round((total.correct / total.count) * 100)
    })).sort((a, b) => {
      const qa = a.question.match(/(\d+)$/); const qb = b.question.match(/(\d+)$/);
      const groupA = a.question.startsWith("RMA") ? 0 : 1; const groupB = b.question.startsWith("RMA") ? 0 : 1;
      return groupA - groupB || Number(qa?.[1] || 0) - Number(qb?.[1] || 0);
    });
  }

  function extremes(members) {
    const stats = questionStats(members);
    if (!stats.length) return null;
    const minimum = Math.min(...stats.map((item) => item.rate));
    const maximum = Math.max(...stats.map((item) => item.rate));
    return {
      least: stats.filter((item) => item.rate === minimum),
      most: stats.filter((item) => item.rate === maximum)
    };
  }

  function renderHorizontalChart(targetId, sections, metric) {
    const target = document.getElementById(targetId);
    if (!sections.length) {
      target.innerHTML = '<p class="report-note">No sections are registered for this grade yet.</p>';
      return;
    }
    const width = 760;
    const left = 190;
    const trackWidth = 450;
    const rowHeight = 42;
    const height = Math.max(76, sections.length * rowHeight + 22);
    const rowsSvg = sections.map((section, index) => {
      const scoreRows = section.members.filter((row) => row.score !== null && row.score !== undefined);
      const value = metric === "completion"
        ? (section.members.length ? Math.round((scoreRows.length / section.members.length) * 100) : 0)
        : (scoreRows.length ? Math.round(scoreRows.reduce((sum, row) => sum + Number(row.score || 0), 0) / scoreRows.length) : 0);
      const y = 27 + index * rowHeight;
      const barWidth = Math.round(trackWidth * value / 100);
      const label = escapeHtml(section.name.length > 23 ? `${section.name.slice(0, 20)}…` : section.name);
      const resultLabel = metric === "score" && !scoreRows.length ? "No scores" : `${value}%`;
      return `<text x="${left - 12}" y="${y + 15}" text-anchor="end" fill="#51484a" font-size="13">${label}</text>
        <rect x="${left}" y="${y}" width="${trackWidth}" height="22" rx="8" fill="#eee8e3"></rect>
        <rect x="${left}" y="${y}" width="${barWidth}" height="22" rx="8" fill="${metric === "completion" ? "#ad8734" : "#5c9b70"}"></rect>
        <text x="${left + trackWidth + 12}" y="${y + 15}" fill="#31090e" font-size="13" font-weight="700">${resultLabel}</text>`;
    }).join("");
    target.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${metric === "completion" ? "Section completion percentage" : "Section average latest score"} chart">${rowsSvg}</svg>`;
  }

  function formatExtreme(items) {
    if (!items?.length) return "No item data";
    return `${items.map((item) => item.question).join(", ")} · ${items[0].rate}%`;
  }

  function renderGradeOverview(grade) {
    const members = rows.filter((row) => Number(row.grade) === grade);
    const sectionNames = unique(members.map((row) => row.section)).sort((a, b) => a.localeCompare(b));
    const sections = sectionNames.map((name) => ({ name, members: members.filter((row) => row.section === name) }));
    const completed = members.filter((row) => row.score !== null && row.score !== undefined);
    const avg = completed.length ? Math.round(completed.reduce((sum, row) => sum + Number(row.score || 0), 0) / completed.length) : null;
    document.getElementById("summary").innerHTML = `
      <div class="metric"><b>${sections.length}</b>Sections</div>
      <div class="metric"><b>${members.length}</b>Registered students</div>
      <div class="metric"><b>${completed.length} / ${members.length}</b>Completed latest attempt</div>
      <div class="metric"><b>${avg === null ? "—" : `${avg}%`}</b>Grade average latest score</div>`;

    renderHorizontalChart("completionChart", sections, "completion");
    renderHorizontalChart("scoreChart", sections, "score");

    const gradeExtremes = extremes(members);
    document.getElementById("gradeHighlights").innerHTML = gradeExtremes
      ? `<div class="highlight"><span>Least mastered</span><strong>${escapeHtml(formatExtreme(gradeExtremes.least))}</strong><small>Across all sections in Grade ${grade}</small></div>
         <div class="highlight"><span>Most mastered</span><strong>${escapeHtml(formatExtreme(gradeExtremes.most))}</strong><small>Across all sections in Grade ${grade}</small></div>`
      : '<p class="report-note">No submitted question-level results for this grade yet.</p>';

    document.getElementById("sectionExtremes").innerHTML = sections.map((section) => {
      const range = extremes(section.members);
      return `<tr><td>${escapeHtml(section.name)}</td><td>${escapeHtml(range ? range.least.map((item) => item.question).join(", ") : "No item data")}</td><td>${range ? `${range.least[0].rate}%` : "—"}</td><td>${escapeHtml(range ? range.most.map((item) => item.question).join(", ") : "No item data")}</td><td>${range ? `${range.most[0].rate}%` : "—"}</td></tr>`;
    }).join("") || '<tr><td colspan="5">No registered sections yet.</td></tr>';

    document.getElementById("reportCard").hidden = false;
    renderSelectedReport();
  }

  function statusFor(score) {
    if (score === null || score === undefined) return { label: "Not started", className: "status-pending" };
    if (Number(score) >= 80) return { label: "On track", className: "status-mastered" };
    if (Number(score) >= 60) return { label: "Developing", className: "status-track" };
    return { label: "Needs support", className: "status-support" };
  }

  function renderSelectedReport() {
    const grade = Number(gradeFilter.value);
    const chosenSection = sectionFilter.value;
    if (!grade) return;
    const gradeMembers = rows.filter((row) => Number(row.grade) === grade);
    const members = chosenSection && chosenSection !== "*"
      ? gradeMembers.filter((row) => row.section === chosenSection)
      : gradeMembers;
    const scope = chosenSection && chosenSection !== "*" ? `Grade ${grade} · Section ${chosenSection}` : `All sections · Grade ${grade}`;
    document.getElementById("questionScope").textContent = `${scope}. Question mastery is correct responses divided by responses to that item; randomized bank items only count students who received that item.`;
    document.getElementById("studentScope").textContent = `${scope}. Status is based on the latest score: 80%+ on track, 60–79% developing, below 60% needs support.`;

    const stats = questionStats(members);
    document.getElementById("masteryRows").innerHTML = stats.length ? stats.map((item) =>
      `<tr><td>${escapeHtml(item.question)}</td><td>${item.correct}</td><td>${item.count}</td><td><div class="bar" aria-label="${item.rate}% mastery"><i style="width:${item.rate}%"></i></div></td><td><b>${item.rate}%</b></td></tr>`
    ).join("") : '<tr><td colspan="5">No item-level results have been submitted for this report scope.</td></tr>';

    document.getElementById("studentRows").innerHTML = members.map((row) => {
      const state = statusFor(row.score);
      const score = row.score === null || row.score === undefined ? "—" : `${Number(row.score)}%`;
      const attempt = row.created_at ? new Date(row.created_at).toLocaleString() : "—";
      return `<tr><td>${escapeHtml(row.student_code)}</td><td>${escapeHtml(row.student_name)}</td><td>${escapeHtml(row.teacher_name)}</td><td>${score}</td><td><span class="status ${state.className}">${state.label}</span></td><td>${escapeHtml(attempt)}</td></tr>`;
    }).join("") || '<tr><td colspan="6">No students are registered for this report scope.</td></tr>';
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

  gradeFilter.addEventListener("change", () => {
    const grade = Number(gradeFilter.value);
    if (!grade) {
      sectionFilter.innerHTML = '<option value="">Select a grade first</option>';
      sectionFilter.disabled = true;
      document.getElementById("reportCard").hidden = true;
      return;
    }
    const sections = unique(rows.filter((row) => Number(row.grade) === grade).map((row) => row.section)).sort((a, b) => a.localeCompare(b));
    sectionFilter.innerHTML = '<option value="*">All sections</option>' + sections.map((section) => `<option value="${escapeHtml(section)}">${escapeHtml(section)}</option>`).join("");
    sectionFilter.disabled = false;
    sectionFilter.value = "*";
    renderGradeOverview(grade);
  });
  sectionFilter.addEventListener("change", renderSelectedReport);
  document.getElementById("teacherLogout").addEventListener("click", () => {
    sessionStorage.removeItem("rma_teacher_token"); token = ""; rows = [];
    dashboard.hidden = true; loginCard.hidden = false;
  });

  // Do not silently reuse a stored teacher token: shared devices require a fresh sign-in.
})();
