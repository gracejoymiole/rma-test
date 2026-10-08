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
  function duration(value, fallbackSeconds) {
    if (value !== null && value !== undefined && value !== "") {
      if (typeof value === "number") {
        return Math.floor(value / 60) + "m " + String(value % 60).padStart(2, "0") + "s";
      }
      return String(value);
    }
    const seconds = Number(fallbackSeconds);
    if (!Number.isFinite(seconds)) return "—";
    const totalSeconds = Math.max(0, Math.floor(seconds));
    return Math.floor(totalSeconds / 60) + "m " + String(totalSeconds % 60).padStart(2, "0") + "s";
  }
  function renderRows(entries, mode, unavailable) {
    const body = document.querySelector("#leaderboard tbody");
    const status = byId("lb-status");
    if (!body) return;
    if (status) status.textContent = unavailable ? "READY" : (mode === "live" ? "LIVE" : "ALL-TIME");
    if (!Array.isArray(entries) || !entries.length) {
      empty(body, unavailable
        ? "Complete a practice run to start your section leaderboard."
        : "No completed attempts in your section yet.");
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
      timeCell.textContent = duration(entry.duration, entry.duration_seconds);
    });
  }
  function setMode(mode, data) {
    document.querySelectorAll("[data-lb-mode]").forEach(function (button) {
      const active = button.dataset.lbMode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    const definition = byId("lbDefinition");
    if (definition) definition.textContent = mode === "live"
      ? "Latest run reflects each learner’s most recent completed attempt."
      : "Personal best reflects each learner’s strongest completed attempt.";
    renderRows(data[mode], mode, data.unavailable);
  }
  function wire(data) {
    const tabs = document.querySelector(".lb-tabs");
    if (tabs && !byId("lbDefinition")) {
      const definition = document.createElement("p");
      definition.id = "lbDefinition";
      definition.className = "lb-definition";
      tabs.insertAdjacentElement("afterend", definition);
    }
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
        const data = { live: [], all_time: [], unavailable: true };
        wire(data);
        setMode("live", data);
      }
    }
  });
})();
