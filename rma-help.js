// RMA Pathways: spend XP for help on a question.
//
// Rules live in RULES so the numbers can be tuned in one place. Everything here
// is per run: the spending cap and the single second chance reset when a run starts.
// There is no free help: every use is paid for from XP earned in this run (1 XP per
// correct answer, set in each grade page).
// Every use of help is logged per question so the teacher can see unaided mastery.
//
// Needs the page script's globals: gameState, rawQuestions, selectedOptions,
// dom, startQuestionTimer() and questionTimeLeft.
(function () {
  "use strict";

  var RULES = {
    cost: { eliminate: 10, time: 5, retry: 20 },
    extraSeconds: 10,
    retriesPerRun: 1,       // Second chance may be used once per attempt of the practice test
    maxSpendPerRun: 30      // XP a student may spend on help in one run
  };
  var CODE = { eliminate: "E", time: "T", retry: "R" };
  var NAME = { eliminate: "Remove one wrong option", time: "Add 10 seconds", retry: "Second chance" };

  var state = fresh();      // per run
  var used = freshQuestion(); // per question

  function fresh() { return { log: {}, spent: 0, retries: RULES.retriesPerRun }; }
  function freshQuestion() { return { eliminate: false, time: false, retry: false }; }
  function $(id) { return document.getElementById(id); }
  function pointer() { return gameState.activeQuestions[gameState.currentQIndex]; }
  function questionId() { return pointer().rawIndex + 1; }
  function inAnswer(q, text) { return Array.isArray(q.answer) ? q.answer.indexOf(text) !== -1 : q.answer === text; }

  // answering | correct | wrong | timeup
  function phase() {
    if (!dom.checkBtn.classList.contains("hidden")) return "answering";
    if (document.querySelector(".option-label.correct")) return "correct";
    if (document.querySelector(".option-label.wrong")) return "wrong";
    return "timeup";
  }

  function candidates() {
    var q = rawQuestions[pointer().rawIndex];
    return Array.prototype.filter.call(document.querySelectorAll(".option-label"), function (label) {
      var cb = label.querySelector("input");
      return !cb.checked && !label.classList.contains("eliminated") && !label.classList.contains("tried") && !inAnswer(q, cb.value);
    });
  }

  // Can this kind of help be used right now? Returns { ok, why }.
  function check(kind) {
    var ph = phase(), balance = gameState.scorePoints || 0, cost = RULES.cost[kind];
    if (used[kind]) return { ok: false, why: "Used on this question" };
    if (kind === "retry") {
      if (state.retries <= 0) return { ok: false, why: "Used this attempt" };
      if (ph === "answering") return { ok: false, why: "Available after a wrong answer" };
      if (ph !== "wrong") return { ok: false, why: ph === "timeup" ? "Time ran out" : "Not needed" };
    } else {
      if (ph !== "answering") return { ok: false, why: ph === "timeup" ? "Time ran out" : "Answer already checked" };
      if (kind === "eliminate" && candidates().length < 2) return { ok: false, why: "Nothing safe to remove" };
    }
    if (state.spent + cost > RULES.maxSpendPerRun) return { ok: false, why: "Help limit reached" };
    if (balance < cost) return { ok: false, why: "Not enough XP" };
    return { ok: true };
  }

  function pay(kind) {
    if (kind === "retry") state.retries--;
    gameState.scorePoints = (gameState.scorePoints || 0) - RULES.cost[kind];
    state.spent += RULES.cost[kind];
  }

  function record(kind) {
    var id = questionId(), codes = state.log[id] || "";
    if (codes.indexOf(CODE[kind]) === -1) state.log[id] = codes + CODE[kind];
    used[kind] = true;
  }

  function refreshXp() {
    if (window.RMATheme && window.RMATheme.syncRun) window.RMATheme.syncRun();
    render();
  }

  function say(text) { var n = $("helpNote"); if (n) n.textContent = text; }

  var actions = {
    eliminate: function () {
      var status = check("eliminate"); if (!status.ok) return;
      var pool = candidates();
      var pick = pool[Math.floor(Math.random() * pool.length)];
      pay("eliminate"); record("eliminate");
      var cb = pick.querySelector("input");
      cb.checked = false; cb.disabled = true;
      pick.classList.remove("selected"); pick.classList.add("eliminated");
      say("One wrong option was removed.");
      refreshXp();
    },
    time: function () {
      var status = check("time"); if (!status.ok) return;
      pay("time"); record("time");
      if (typeof questionTimeLeft === "number") {
        questionTimeLeft += RULES.extraSeconds;
        var shown = $("timeRemaining"); if (shown) shown.textContent = questionTimeLeft;
      }
      say(RULES.extraSeconds + " seconds added.");
      refreshXp();
    },
    retry: function () {
      var status = check("retry"); if (!status.ok) return;
      pay("retry"); record("retry");
      var tried = selectedOptions.slice();
      Array.prototype.forEach.call(document.querySelectorAll(".option-label"), function (label) {
        var cb = label.querySelector("input");
        label.classList.remove("selected", "wrong", "correct", "disabled");
        cb.checked = false;
        if (tried.indexOf(cb.value) !== -1) { label.classList.add("tried"); cb.disabled = true; }
        else cb.disabled = label.classList.contains("eliminated");
      });
      selectedOptions = [];
      dom.explanationBox.style.display = "none";
      dom.checkBtn.disabled = true;
      dom.checkBtn.classList.remove("hidden");
      dom.nextBtn.classList.add("hidden");
      startQuestionTimer();
      say("Try again. Your first choice is marked so you can skip it.");
      refreshXp();
    }
  };

  function render() {
    try {
      var card = $("helpCard"); if (!card) return;
      var balance = gameState.scorePoints || 0;
      $("helpBalance").textContent = balance + " XP";
      $("helpToken").textContent = "Second chance: " + state.retries + " left";
      $("helpBudget").textContent = Math.max(0, RULES.maxSpendPerRun - state.spent) + " XP of help left this run";
      Object.keys(actions).forEach(function (kind) {
        var btn = $("help-" + kind), status = check(kind);
        btn.disabled = !status.ok;
        btn.classList.toggle("is-used", used[kind]);
        btn.querySelector(".help-cost").textContent = used[kind] ? "Used" : RULES.cost[kind] + " XP";
        btn.querySelector(".help-why").textContent = status.ok ? "" : status.why;
      });
    } catch (e) { /* the quiz must keep working if the card cannot draw */ }
  }

  function bind() {
    Object.keys(actions).forEach(function (kind) {
      var btn = $("help-" + kind);
      if (btn) btn.addEventListener("click", actions[kind]);
    });
    var qNumber = $("qNumber");
    if (qNumber) new MutationObserver(function () { used = freshQuestion(); say(""); render(); })
      .observe(qNumber, { childList: true, characterData: true, subtree: true });
    [dom.checkBtn, dom.nextBtn].forEach(function (el) {
      new MutationObserver(render).observe(el, { attributes: true, attributeFilter: ["class"] });
    });
    render();
  }

  // What gets saved with the result. Item ids match rma_data / bank_data.
  function summary() {
    var total = gameState.activeQuestions.length, unaided = 0, parts = [];
    gameState.activeQuestions.forEach(function (p) {
      var id = p.rawIndex + 1, codes = state.log[id] || "";
      if (codes) parts.push(id + ":" + codes);
      if (!codes && gameState.userAnswers && gameState.userAnswers[id] === "T") unaided++;
    });
    return {
      helpData: parts.join("|"),
      helpCount: parts.length,
      xpSpent: state.spent,
      unaidedCorrect: unaided,
      total: total,
      unaidedScore: total ? Math.round((unaided / total) * 100) : 0
    };
  }

  window.RMAHelp = {
    RULES: RULES,
    summary: summary,
    reset: function () { state = fresh(); used = freshQuestion(); render(); },
    refresh: render
  };

  try { bind(); } catch (e) { console.warn("Help card unavailable:", e); }
})();
