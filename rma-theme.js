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

  var state = { startedAt: null, muted: false };

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

      var ring = $("scoreRing");
      if (ring) ring.style.setProperty("--pct", String(percent));

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
        message.textContent = band.note + " You answered " + correct +
          " of " + total + " correctly (" + percent + "%).";
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

      var gif = $("resultGif");
      if (gif) gif.style.display = "none";
    },

    /* rma-help.js asks for a redraw after it spends XP. */
    syncRun: function () { paintXp(); },

    reset: function () {
      state.startedAt = null;
      paintXp();
      var note = $("runNote");
      if (note) note.textContent = "Answer a question to start earning points.";
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
    });
  } else {
    wireSound();
    wireLeaderboardSheet();
    respectReducedMotion();
    paintXp();
  }
})();