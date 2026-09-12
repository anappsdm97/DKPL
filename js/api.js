/**
 * Transport for the Google Apps Script web app.
 * Everything degrades to browser-only storage when apiBase is empty.
 */
(function () {
  const DKPL = (window.DKPL = window.DKPL || {});
  const cfg = window.DKPL_CONFIG;

  function enabled() {
    return Boolean(cfg.apiBase);
  }

  async function pull() {
    if (!enabled()) return null;
    const url = cfg.apiBase + (cfg.apiBase.indexOf("?") >= 0 ? "&" : "?") + "action=all";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Sheets read failed: " + res.status);
    return res.json();
  }

  async function push(entity, rows) {
    if (!enabled()) return null;
    // No custom headers: keeps this a simple CORS request for Apps Script.
    const res = await fetch(cfg.apiBase, {
      method: "POST",
      body: JSON.stringify({ action: "save", entity: entity, rows: rows })
    });
    if (!res.ok) throw new Error("Sheets write failed: " + res.status);
    return res.json();
  }

  DKPL.api = { enabled: enabled, pull: pull, push: push };
})();
