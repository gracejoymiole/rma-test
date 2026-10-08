/* RMA Pathways shared theme behaviour.
   Loaded with <script defer src="../rma-theme.js"></script> by every grade page.

   The markup for the XP pill, the "Your run today" card, the topic chip, the
   results ring and the mobile leaderboard sheet all ships in rma-theme.css and
   the grade pages. None of it is wired up here in the page scripts, because the
   page scripts only own the quiz: which question is showing, whether the answer
   was right, and when the run ends. This file turns those three moments into the
   decorative state around them.

   Every lookup is optional on purpose. A page that omits an element must still
   work, so a missing id is skipped rather than throwing and taking the quiz down
   with it. */
(function () {
  "use strict";

  /* Same four bands as rma_score_bands in the database, with wording a student
     can act on rather than a teacher's label. Kept in sync by tests/test-theme.js,
     which reads the band rows out of schema.sql. */
  var BANDS = [
    { min: 80, label: "Proficient", note: "You have a strong grasp of this topic." },
    { min: 60, label: "Developing", note: "Getting there. Review the ones you missed." },
    { min: 40, label: "Emerging", note: "Keep going. The practice is working." },
    { min: 0, label: "Building foundations", note: "Start with the easier items and build up." },
  ];

  var state = { startedAt: null, muted: false, masteryPercent: null };

  /* XP lives in the page (gameState.scorePoints). The page earns it, rma-help.js
     spends it, and this file only draws it, so the pill, the run card and the help
     card cannot disagree about the balance. */
  function xp() {
    return (typeof gameState !== "undefined" && gameState.scorePoints) || 0;
  }
  function correctSoFar() {
    return (typeof gameState !== "undefined" && gameState.correctCount) || 0;
  }
  function answeredSoFar() {
    return (typeof gameState !== "undefined" && gameState.userAnswers)
      ? Object.keys(gameState.userAnswers).length : 0;
  }

  function $(id) { return document.getElementById(id); }

  function setText(id, value) {
    var el = $(id);
    if (el) el.textContent = String(value);
  }

  /* The run card mirrors the XP pill. Both are updated together so the header and
     the sidebar can never disagree about the score. */
  function paintXp() {
    setText("xpValue", xp());
    setText("runXP", xp());
    var bar = $("runBar");
    var total = (typeof gameState !== "undefined" && gameState.activeQuestions.length) || 0;
    if (bar) bar.style.width = (total ? Math.min(100, Math.round((correctSoFar() / total) * 100)) : 0) + "%";
  }

  function bandFor(percent) {
    for (var i = 0; i < BANDS.length; i++) {
      if (percent >= BANDS[i].min) return BANDS[i];
    }
    return BANDS[BANDS.length - 1];
  }

  function formatDuration(ms) {
    var total = Math.max(0, Math.floor(ms / 1000));
    var m = Math.floor(total / 60);
    var s = total % 60;
    return m + "m " + (s < 10 ? "0" : "") + s + "s";
  }

  function ensureReviewPanel() {
    var actions = $("actionButtons");
    if (!actions || $("reviewMissedBtn")) return;
    var button = document.createElement("button");
    button.type = "button";
    button.id = "reviewMissedBtn";
    button.className = "btn btn-secondary hidden";
    button.textContent = "Review missed skills";
    var panel = document.createElement("section");
    panel.id = "missedSkillsPanel";
    panel.className = "missed-skills-panel hidden";
    panel.setAttribute("aria-live", "polite");
    actions.insertBefore(button, actions.firstChild);
    actions.insertAdjacentElement("afterend", panel);
    button.addEventListener("click", function () {
      panel.classList.toggle("hidden");
      button.setAttribute("aria-expanded", String(!panel.classList.contains("hidden")));
      if (!panel.classList.contains("hidden")) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function shortExplanation(rawIndex) {
    var question = (typeof rawQuestions !== "undefined" && rawQuestions[rawIndex]) || {};
    var text = String(question.explanation || "Practice the questions you missed to strengthen this skill.")
      .replace(/\[[^\]]+\]/g, "").replace(/\s+/g, " ").trim();
    var sentence = text.match(/^.*?[.!?](?:\s|$)/);
    text = (sentence ? sentence[0] : text).trim();
    return text.length > 150 ? text.slice(0, 147).trim() + "…" : text;
  }

  function startTargetedRetry(rawIndices) {
    if (!rawIndices.length || typeof gameState === "undefined" || typeof loadQuestion !== "function") return;
    // This is a study-only run. It deliberately never reaches submitFinalData,
    // so the completed assessment and its recorded mastery percentage stay put.
    window.RMATargetedRetry = true;
    gameState.activeQuestions = rawIndices.map(function (rawIndex) { return { rawIndex: rawIndex }; });
    gameState.currentQIndex = 0;
    gameState.correctCount = 0;
    gameState.scorePoints = 0;
    gameState.userAnswers = {};
    gameState.itemAnalysisRecords = [];
    var result = $("resultContent");
    var quiz = $("quizContent");
    if (result) result.classList.add("hidden");
    if (quiz) quiz.classList.remove("hidden");
    if (window.RMAHelp) window.RMAHelp.reset();
    RMATheme.reset({ preserveMastery: true });
    setText("qTotalDisp", rawIndices.length);
    loadQuestion();
    var heading = $("qText");
    if (heading) heading.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function paintMissedSkills() {
    ensureReviewPanel();
    var button = $("reviewMissedBtn");
    var panel = $("missedSkillsPanel");
    if (!button || !panel || typeof gameState === "undefined") return;
    var misses = Array.isArray(gameState.itemAnalysisRecords)
      ? gameState.itemAnalysisRecords.filter(function (item) { return item.result !== "T" && item.result !== "1"; }) : [];
    if (!misses.length) {
      button.classList.add("hidden");
      panel.classList.add("hidden");
      panel.replaceChildren();
      return;
    }
    var groups = {};
    misses.forEach(function (item) {
      var topic = typeof getMathObjective === "function" ? getMathObjective(Number(item.id)) : "Review this skill";
      var rawIndex = Number(item.id) - 1;
      if (!Number.isInteger(rawIndex) || rawIndex < 0) return;
      if (!groups[topic]) groups[topic] = { indices: [], explanation: shortExplanation(rawIndex) };
      if (groups[topic].indices.indexOf(rawIndex) === -1) groups[topic].indices.push(rawIndex);
    });
    panel.replaceChildren();
    var title = document.createElement("h3");
    title.textContent = "Skills to review next";
    panel.appendChild(title);
    var note = document.createElement("p");
    note.textContent = "Choose one skill for a short retry. This study retry does not change your recorded mastery.";
    panel.appendChild(note);
    var list = document.createElement("div");
    list.className = "missed-skill-cards";
    Object.keys(groups).sort(function (a, b) { return groups[b].indices.length - groups[a].indices.length; }).forEach(function (topic) {
      var item = document.createElement("article");
      item.className = "missed-skill-card";
      var name = document.createElement("b");
      name.textContent = topic;
      item.appendChild(name);
      var count = document.createElement("span");
      count.textContent = groups[topic].indices.length + (groups[topic].indices.length === 1 ? " missed question" : " missed questions");
      item.appendChild(count);
      var explanation = document.createElement("p");
      explanation.textContent = groups[topic].explanation;
      item.appendChild(explanation);
      var retry = document.createElement("button");
      retry.type = "button";
      retry.className = "btn btn-secondary missed-skill-retry";
      retry.textContent = "Retry this skill";
      retry.addEventListener("click", function () { startTargetedRetry(groups[topic].indices); });
      item.appendChild(retry);
      list.appendChild(item);
    });
    panel.appendChild(list);
    button.classList.remove("hidden");
    button.setAttribute("aria-expanded", "false");
  }

  /* ---------- called by the page scripts ---------- */

  var RMATheme = {
    /* loadQuestion() */
    onQuestion: function (topic, index, total) {
      var chip = $("qTopic");
      if (chip) chip.textContent = topic || "Practice";
      setText("qIndexDisp", index);
      if (total) setText("qTotalDisp", total);
      setText("progressPct", Math.round(((index - 1) / total) * 100) + "%");
      if (!state.startedAt) state.startedAt = Date.now();
    },

    /* the checkBtn handler, after it has decided isCorrect */
    onAnswer: function () {
      paintXp();
      var note = $("runNote");
      if (note) {
        note.textContent = correctSoFar() + " of " + answeredSoFar() +
          " correct so far. Keep going.";
      }
    },

    /* endGame(), after the score has been computed */
    onFinish: function (percent, correct, total) {
      paintXp();

      var isTargetedRetry = window.RMATargetedRetry === true;
      var ring = $("scoreRing");
      if (isTargetedRetry) {
        if (ring && state.masteryPercent !== null) ring.style.setProperty("--pct", String(state.masteryPercent));
        if (state.masteryPercent !== null) setText("finalScore", state.masteryPercent + "%");
      } else {
        state.masteryPercent = percent;
        if (ring) ring.style.setProperty("--pct", String(percent));
      }
      var band = bandFor(percent);
      var chip = $("bandChip");
      if (chip) {
        chip.textContent = band.label;
        chip.title = band.note;
      }
      var title = $("resultTitle");
      var message = $("resultMessage");
      if (title && message) {
        // The page sets its own headline for a perfect score or a security
        // failure; only fill these in when it has not already spoken.
        if (!title.textContent || title.textContent === "Practice complete") {
          title.textContent = band.label;
        }
        if (isTargetedRetry) {
          title.textContent = "Targeted practice complete";
          message.textContent = "You answered " + correct + " of " + total + " correctly. This study retry does not change your recorded mastery.";
        } else {
          message.textContent = band.note + " You answered " + correct +
            " of " + total + " correctly (" + percent + "%).";
        }
      }

      setText("statCorrect", correct + " / " + total);
      /* With the help system present the third stat is how many were answered with
         no help at all; without it, the XP earned. */
      var help = window.RMAHelp && window.RMAHelp.summary();
      if (help) {
        setText("statXP", help.unaidedCorrect + " / " + help.total);
        setText("helpSummary", help.helpCount
          ? "You used help on " + help.helpCount + (help.helpCount === 1 ? " question" : " questions") +
            " and spent " + help.xpSpent + " XP. Your teacher can see this."
          : "You answered everything without using help.");
      } else {
        setText("statXP", xp());
      }
      setText("statTime", state.startedAt ? formatDuration(Date.now() - state.startedAt) : "-");
      paintMissedSkills();

      var gif = $("resultGif");
      if (gif) gif.style.display = "none";
    },

    /* rma-help.js asks for a redraw after it spends XP. */
    syncRun: function () { paintXp(); },

    reset: function (options) {
      state.startedAt = null;
      if (!options || !options.preserveMastery) state.masteryPercent = null;
      paintXp();
      var note = $("runNote");
      if (note) note.textContent = "Answer a question to start earning points.";
      var review = $("reviewMissedBtn");
      var reviewPanel = $("missedSkillsPanel");
      if (review) review.classList.add("hidden");
      if (reviewPanel) { reviewPanel.classList.add("hidden"); reviewPanel.replaceChildren(); }
    },

    getXp: xp,
    BANDS: BANDS,
  };

  /* ---------- wiring that needs no cooperation from the page ---------- */

  function wireSound() {
    var button = $("soundToggle");
    if (!button) return;
    button.addEventListener("click", function () {
      state.muted = !state.muted;
      button.setAttribute("aria-pressed", String(state.muted));
      button.setAttribute("aria-label", state.muted ? "Unmute sounds" : "Mute sounds");
      ["soundCorrect", "soundWrong", "soundWin"].forEach(function (id) {
        var el = $(id);
        if (el) el.muted = state.muted;
      });
    });
  }

  /* On phones the leaderboard is a bottom sheet (rma-theme.css moves it), so the
     table needs an opener and a dismiss. Desktop ignores both because the CSS
     keeps the card in the sidebar. */
  function wireLeaderboardSheet() {
    var toggle = $("lbToggle");
    var card = $("lbCard");
    var close = $("lbClose");
    var backdrop = $("lbBackdrop");
    if (!toggle || !card) return;

    function setOpen(open) {
      card.classList.toggle("open", open);
      if (backdrop) backdrop.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    }

    toggle.addEventListener("click", function () { setOpen(!card.classList.contains("open")); });
    if (close) close.addEventListener("click", function () { setOpen(false); });
    if (backdrop) backdrop.addEventListener("click", function () { setOpen(false); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && card.classList.contains("open")) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* Confetti is decorative, so a student who asked for less motion should not get
     it. The page calls confetti() itself; overriding the global here is the only
     place that reliably covers all four call sites. */
  function respectReducedMotion() {
    if (!window.matchMedia || !window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    window.confetti = function () {};
    ["soundCorrect", "soundWrong", "soundWin"].forEach(function (id) {
      var el = $(id);
      if (el) el.muted = true;
    });
  }

  window.RMATheme = RMATheme;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      wireSound();
      wireLeaderboardSheet();
      respectReducedMotion();
      paintXp();
      ensureReviewPanel();
    });
  } else {
    wireSound();
    wireLeaderboardSheet();
    respectReducedMotion();
    paintXp();
    ensureReviewPanel();
  }
})();
