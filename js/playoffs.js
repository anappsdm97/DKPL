/** Playoffs / qualification copy and bracket (IPL-style after league). */
(function () {
  const DKPL = (window.DKPL = window.DKPL || {});
  const cfg = window.DKPL_CONFIG;

  function esc(v) {
    return DKPL.ui.esc(v);
  }

  function mergedSettings(raw) {
    const p = cfg.playoffs;
    const s = raw || {};
    return {
      intro: s.intro || p.defaultIntro,
      rules: Array.isArray(s.rules) && s.rules.length ? s.rules : p.defaultRules.slice(),
      adminNote: s.adminNote || ""
    };
  }

  function nodeHtml(opts) {
    const extra = opts.extraClass ? " " + opts.extraClass : "";
    return (
      '<div class="playoff-node' + extra + '">' +
      '<span class="badge ' + esc(opts.badgeClass) + '">' + esc(opts.badge) + "</span>" +
      "<strong>" + esc(opts.title) + "</strong>" +
      "<small>" + esc(opts.sub) + "</small></div>"
    );
  }

  function connectorHtml(label) {
    return (
      '<div class="playoff-connector">' +
      (label ? '<span class="playoff-connector-label">' + esc(label) + "</span>" : "") +
      '<span class="playoff-connector-arrow" aria-hidden="true">↓</span></div>'
    );
  }

  function bracketDesktopHtml() {
    const q1 = cfg.playoffs.bracket[0];
    const el = cfg.playoffs.bracket[1];
    const q2 = cfg.playoffs.bracket[2];
    const fin = cfg.playoffs.bracket[3];

    return (
      '<div class="playoff-flow playoff-flow--desktop">' +
      '<div class="playoff-col">' +
      nodeHtml({ badgeClass: "up", badge: q1.stage, title: q1.detail, sub: q1.outcome }) +
      nodeHtml({ badgeClass: "up", badge: el.stage, title: el.detail, sub: el.outcome }) +
      "</div>" +
      '<div class="playoff-arrows" aria-hidden="true"><span>→</span><span>→</span></div>' +
      '<div class="playoff-col">' +
      nodeHtml({
        extraClass: "highlight",
        badgeClass: "done",
        badge: "Direct",
        title: "Final berth",
        sub: "Winner Q1"
      }) +
      nodeHtml({ badgeClass: "up", badge: q2.stage, title: q2.detail, sub: q2.outcome }) +
      "</div>" +
      '<div class="playoff-arrows playoff-arrows--single" aria-hidden="true"><span>→</span></div>' +
      '<div class="playoff-col playoff-col--final">' +
      nodeHtml({
        extraClass: "final",
        badgeClass: "live",
        badge: "Final",
        title: fin.detail,
        sub: fin.outcome
      }) +
      "</div>" +
      "</div>"
    );
  }

  function bracketMobileHtml() {
    const q1 = cfg.playoffs.bracket[0];
    const el = cfg.playoffs.bracket[1];
    const q2 = cfg.playoffs.bracket[2];
    const fin = cfg.playoffs.bracket[3];

    return (
      '<div class="playoff-bracket-mobile">' +
      '<section class="playoff-round">' +
      '<h4 class="playoff-round-label">Round 1 <span>· league seeds</span></h4>' +
      '<div class="playoff-pair">' +
      nodeHtml({ badgeClass: "up", badge: q1.stage, title: q1.detail, sub: q1.outcome }) +
      nodeHtml({ badgeClass: "up", badge: el.stage, title: el.detail, sub: el.outcome }) +
      "</div>" +
      '<p class="playoff-round-hint">These two matches are played first (not one after the other).</p>' +
      "</section>" +
      '<section class="playoff-round">' +
      '<h4 class="playoff-round-label">Paths to the Final</h4>' +
      '<div class="playoff-path">' +
      connectorHtml("Winner of Qualifier 1") +
      nodeHtml({
        extraClass: "highlight",
        badgeClass: "done",
        badge: "Direct",
        title: "Final berth",
        sub: "Waits for Qualifier 2 winner"
      }) +
      "</div>" +
      '<div class="playoff-path">' +
      connectorHtml("Loser Q1 vs Winner Eliminator") +
      nodeHtml({ badgeClass: "up", badge: q2.stage, title: q2.detail, sub: q2.outcome }) +
      connectorHtml("Winner of Qualifier 2") +
      "</div>" +
      "</section>" +
      '<section class="playoff-round playoff-round--final">' +
      connectorHtml("Championship match") +
      nodeHtml({
        extraClass: "final",
        badgeClass: "live",
        badge: "Final",
        title: fin.detail,
        sub: fin.outcome
      }) +
      "</section>" +
      "</div>"
    );
  }

  function bracketHtml() {
    return (
      '<div class="playoff-bracket-wrap">' + bracketDesktopHtml() + bracketMobileHtml() + "</div>"
    );
  }

  function sectionHtml(settings) {
    const s = mergedSettings(settings);
    const rules = s.rules
      .map(function (line) {
        return "<li>" + esc(line) + "</li>";
      })
      .join("");

    return (
      '<article class="card playoff-card">' +
      '<p class="kicker">After league · Top 4</p>' +
      "<h3>Playoffs &amp; qualification</h3>" +
      '<p class="muted">' + esc(s.intro) + "</p>" +
      '<ul class="rule-list">' + rules + "</ul>" +
      (s.adminNote ? '<p class="situation admin-playoff-note">' + esc(s.adminNote) + "</p>" : "") +
      bracketHtml() +
      '<p class="notice">League matches fill the points table. Admin creates playoff fixtures after the league ends (Admin → Fixtures / Scorer).</p>' +
      "</article>"
    );
  }

  DKPL.playoffs = {
    mergedSettings: mergedSettings,
    sectionHtml: sectionHtml,
    bracketHtml: bracketHtml
  };
})();
