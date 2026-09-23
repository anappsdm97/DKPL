/**
 * Google Apps Script web app client.
 * POST uses text/plain so the browser does not send a CORS preflight (required for GAS).
 * PINs are verified on the server (Script properties), not stored in this repo.
 */
(function () {
  const DKPL = (window.DKPL = window.DKPL || {});
  const cfg = window.DKPL_CONFIG;

  const TOKEN_KEY = "dkpl.authToken";
  const ROLE_KEY = "dkpl.authRole";

  function enabled() {
    return Boolean(cfg && cfg.apiBase);
  }

  function parseJson(text) {
    try {
      return JSON.parse(text);
    } catch (err) {
      throw new Error("Invalid JSON from server (check Apps Script deployment)");
    }
  }

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  }

  function getRole() {
    return sessionStorage.getItem(ROLE_KEY) || "";
  }

  function setSession(token, role) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(ROLE_KEY, role);
  }

  function clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem("dkpl.admin");
    sessionStorage.removeItem("dkpl.scorer");
  }

  async function post(payload) {
    if (!enabled()) throw new Error("apiBase is not configured");
    const res = await fetch(cfg.apiBase, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    const data = parseJson(text);
    if (data.error === "Unauthorized" || data.error === "Forbidden") {
      clearSession();
    }
    if (!res.ok && !data.error) throw new Error("Request failed: " + res.status);
    return data;
  }

  /** mode: "admin" | "scorer" — admin mode accepts admin PIN only; scorer accepts admin or scorer PIN. */
  async function auth(mode, pin) {
    return post({ action: "auth", mode: mode, pin: pin });
  }

  async function fetchWithTimeout(url, options, ms) {
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = setTimeout(function () {
      if (ctrl) ctrl.abort();
    }, ms || 8000);
    try {
      const opts = Object.assign({}, options || {});
      if (ctrl) opts.signal = ctrl.signal;
      return await fetch(url, opts);
    } finally {
      clearTimeout(timer);
    }
  }

  async function pull() {
    if (!enabled()) return null;
    const url = cfg.apiBase + (cfg.apiBase.indexOf("?") >= 0 ? "&" : "?") + "action=all&_=" + Date.now();
    const res = await fetchWithTimeout(url, { redirect: "follow", cache: "no-store" }, 8000);
    const text = await res.text();
    if (!res.ok) throw new Error("Sheets read failed: " + res.status);
    return parseJson(text);
  }

  async function push(entity, rows) {
    if (!enabled()) return null;
    const data = await post({
      action: "save",
      entity: entity,
      rows: rows,
      token: getToken()
    });
    if (data.error) throw new Error(data.error);
    return data;
  }

  async function pushSettings(data) {
    if (!enabled()) return null;
    const out = await post({
      action: "save",
      entity: "settings",
      data: data || {},
      token: getToken()
    });
    if (out.error) throw new Error(out.error);
    return out;
  }

  async function pushAll(store) {
    await push("teams", store.teams());
    await push("players", store.players());
    await push("matches", store.matches());
    if (store.settingsRaw) await pushSettings(store.settingsRaw());
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

  DKPL.api = {
    enabled: enabled,
    auth: auth,
    getToken: getToken,
    getRole: getRole,
    setSession: setSession,
    clearSession: clearSession,
    pull: pull,
    push: push,
    pushSettings: pushSettings,
    pushAll: pushAll,
    testConnection: testConnection
  };
})();
