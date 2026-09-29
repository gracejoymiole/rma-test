// Shared browser-side Supabase REST adapter for the four standalone RMA assessments.
(function () {
  const config = window.RMA_SUPABASE;
  const grade = Number(document.body.dataset.grade);

  function apiUrl(path) {
    if (!config || !config.url || !config.publishableKey) {
      throw new Error("Supabase is not configured. Check supabase-config.js.");
    }
    return `${config.url}/rest/v1/${path}`;
  }

  async function request(path, options = {}) {
    const response = await fetch(apiUrl(path), {
      ...options,
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${config.publishableKey}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      }
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Supabase request failed (${response.status}): ${detail.slice(0, 240)}`);
    }
    return response;
  }

  function durationSeconds(value) {
    if (typeof value === "number") return Math.max(0, Math.floor(value));
    const text = String(value || "");
    const minutes = text.match(/(\d+)\s*m/i);
    const seconds = text.match(/(\d+)\s*s/i);
    if (minutes || seconds) return Number(minutes?.[1] || 0) * 60 + Number(seconds?.[1] || 0);
    const numeric = Number(text);
    return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0;
  }

  window.RMAData = Object.freeze({
    async submit(formData) {
      const payload = {
        grade,
        last_name: String(formData.get("lastName") || "").trim().slice(0, 100),
        first_name_mi: String(formData.get("firstNameMI") || "").trim().slice(0, 100),
        section: String(formData.get("section") || "").trim().slice(0, 100),
        score: Math.max(0, Math.min(100, Number.parseInt(formData.get("score"), 10) || 0)),
        start_time: String(formData.get("startTime") || "").slice(0, 40),
        end_time: String(formData.get("endTime") || "").slice(0, 40),
        duration: String(formData.get("duration") || "").slice(0, 40),
        duration_seconds: durationSeconds(formData.get("duration")),
        rma_data: String(formData.get("rma") || "").slice(0, 12000),
        bank_data: String(formData.get("bankData") || "").slice(0, 12000)
      };
      await request("rma_scores", { method: "POST", body: JSON.stringify(payload), headers: { Prefer: "return=minimal" } });
      return { success: true };
    },

    async reportViolation(formData) {
      const payload = {
        grade,
        student_name: String(formData.get("name") || "Unknown").trim().slice(0, 200),
        category: String(formData.get("category") || "OTHER").slice(0, 80),
        action: String(formData.get("action") || "").slice(0, 240)
      };
      await request("rma_violations", { method: "POST", body: JSON.stringify(payload), headers: { Prefer: "return=minimal" } });
      return { success: true };
    },

    async getLeaderboard(section) {
      const query = new URLSearchParams({
        select: "name,score,duration,duration_seconds",
        grade: `eq.${grade}`,
        section: `eq.${section}`,
        order: "score.desc,duration_seconds.asc,created_at.asc",
        limit: "10"
      });
      const response = await request(`rma_leaderboard?${query.toString()}`);
      const rows = await response.json();
      return {
        success: true,
        mode: "ALL-TIME",
        data: rows.map((row, index) => ({ ...row, rank: index + 1 }))
      };
    }
  });
})();
