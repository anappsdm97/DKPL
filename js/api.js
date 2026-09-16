/**
 * Google Apps Script web app client.
 * POST uses text/plain so the browser does not send a CORS preflight (required for GAS).
 */
(function () {
  const DKPL = (window.DKPL = window.DKPL || {});
  const cfg = window.DKPL_CONFIG;

  function enabled() {
    return Boolean(cfg.apiBase);
  }

  function parseJson(text) {
    try {
      return JSON.parse(text);
    } catch (err) {
      throw new Error("Invalid JSON from server (check Apps Script deployment)");
    }
  }

  async function pull() {
    if (!enabled()) return null;
    const url = cfg.apiBase + (cfg.apiBase.indexOf("?") >= 0 ? "&" : "?") + "action=all";
    const res = await fetch(url, { redirect: "follow", cache: "no-store" });
    const text = await res.text();
    if (!res.ok) throw new Error("Sheets read failed: " + res.status);
    return parseJson(text);
  }

  async function push(entity, rows) {
    if (!enabled()) return null;
    const body = JSON.stringify({ action: "save", entity: entity, rows: rows });
    const res = await fetch(cfg.apiBase, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: body
    });
    const text = await res.text();
    if (!res.ok) throw new Error("Sheets write failed: " + res.status);
    return parseJson(text);
  }

  /** Push teams, players and matches in one go (use after scoring or from Admin). */
  async function pushAll(store) {
    await push("teams", store.teams());
    await push("players", store.players());
    await push("matches", store.matches());
  }

  async function testConnection() {
    const data = await pull();
    return {
      ok: true,
      teams: (data.teams || []).length,
      players: (data.players || []).length,
      matches: (data.matches || []).length
    };
  }

  DKPL.api = { enabled: enabled, pull: pull, push: push, pushAll: pushAll, testConnection: testConnection };
})();
