/* Student leaderboard UI shared by all four grade assessments.
   The database returns two lists: "live" (each learner's latest completed
   run) and "all_time" (each learner's personal best). Keeping this display
   here prevents the grade pages from drifting apart. */
(function () {
  "use strict";

  function byId(id) { return document.getElementById(id); }
  function currentName() {
    return String(window.gameState && gameState.student && gameState.student.name || "")
      .trim().toLocaleLowerCase();
  }
  function empty(body, message) {
    body.replaceChildren();
    const row = body.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 4;
    cell.className = "lb-message";
    cell.textContent = message;
  }
  function duration(value) {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "number") {
      return Math.floor(value / 60) + "m " + String(value % 60).padStart(2, "0") + "s";
    }
    return String(value);
  }
  function renderRows(entries, mode) {
    const body = document.querySelector("#leaderboard tbody");
    const status = byId("lb-status");
    if (!body) return;
    if (status) status.textContent = mode === "live" ? "LIVE" : "ALL-TIME";
    if (!Array.isArray(entries) || !entries.length) {
      empty(body, "No completed attempts in your section yet.");
      return;
    }
    const mine = currentName();
    body.replaceChildren();
    entries.forEach(function (entry, index) {
      const rank = Number(entry.rank || index + 1);
      const row = body.insertRow();
      const name = String(entry.name || "Learner").trim();
      if (entry.is_current_student || (mine && name.toLocaleLowerCase().includes(mine))) row.className = "active-user";
      if (rank <= 3) row.classList.add("rank-" + rank);
      const rankCell = row.insertCell();
      rankCell.textContent = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : String(rank);
      const nameCell = row.insertCell();
      nameCell.textContent = name;
      const scoreCell = row.insertCell();
      scoreCell.textContent = Number.isFinite(Number(entry.score)) ? Number(entry.score) + "%" : "—";
      const timeCell = row.insertCell();
      timeCell.textContent = duration(entry.duration);
    });
  }
  function setMode(mode, data) {
    document.querySelectorAll("[data-lb-mode]").forEach(function (button) {
      const active = button.dataset.lbMode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    renderRows(data[mode], mode);
  }
  function wire(data) {
    document.querySelectorAll("[data-lb-mode]").forEach(function (button) {
      button.onclick = function () { setMode(button.dataset.lbMode, data); };
    });
  }
  window.RMAStudentLeaderboard = Object.freeze({
    render: async function () {
      const body = document.querySelector("#leaderboard tbody");
      const status = byId("lb-status");
      if (!body) return;
      empty(body, "Loading your section…");
      if (status) status.textContent = "LOADING";
      try {
        const response = await window.RMAData.getLeaderboard();
        if (!response || !response.success) throw new Error("Leaderboard unavailable");
        const data = {
          live: Array.isArray(response.live) ? response.live : [],
          all_time: Array.isArray(response.all_time) ? response.all_time : []
        };
        wire(data);
        setMode("live", data);
      } catch (error) {
        console.warn("[rma] student leaderboard failed:", error);
        empty(body, "Leaderboard is unavailable. Please try again shortly.");
        if (status) status.textContent = "OFFLINE";
      }
    }
  });
})();
