/** Playoffs / qualification copy and bracket (top-four format after league). */
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

  function store() {
    return DKPL.store;
  }

  function teamLabel(id, fallback) {
    if (!id) return fallback;
    const name = store().teamName(id);
    return name && name !== "-" ? name : fallback;
  }

  function seedName(index, fallback) {
    const table = store().pointsTable();
    if (table[index] && table[index].played > 0) return table[index].name;
    return fallback;
  }

  function matchLine(stage) {
    const m = store().playoffMatch ? store().playoffMatch(stage) : null;
    if (!m) return null;
    const vs = teamLabel(m.teamA, "TBD") + " vs " + teamLabel(m.teamB, "TBD");
    if (m.status === "Completed" && m.result && m.result.text) {
      return { title: vs, sub: m.result.text, badgeClass: "done", extra: "" };
    }
    if (m.status === "Live") {
      return { title: vs, sub: "Live now", badgeClass: "live", extra: "" };
    }
    return { title: vs, sub: "Upcoming", badgeClass: "up", extra: "" };
  }

  function slot(stage, fallbackTitle, fallbackSub, extraClass) {
    const live = matchLine(stage);
    if (live) {
      return {
        badgeClass: live.badgeClass,
        title: live.title,
        sub: live.sub,
        extraClass: extraClass || ""
      };
    }
    return {
      badgeClass: extraClass === "final" ? "live" : extraClass === "highlight" ? "done" : "up",
      title: fallbackTitle,
      sub: fallbackSub,
      extraClass: extraClass || ""
    };
  }

  function liveSlots() {
    const q1 = cfg.playoffs.bracket[0];
    const el = cfg.playoffs.bracket[1];
    const q2 = cfg.playoffs.bracket[2];
    const fin = cfg.playoffs.bracket[3];
    const q1w = store().playoffWinner ? store().playoffWinner("Qualifier 1") : "";

    return {
      q1: slot("Qualifier 1", seedName(0, q1.detail.split(" vs ")[0]) + " vs " + seedName(1, "Rank 2"), q1.outcome, ""),
      el: slot("Eliminator", seedName(2, "Rank 3") + " vs " + seedName(3, "Rank 4"), el.outcome, ""),
      berth: {
        badgeClass: "done",
        extraClass: "highlight",
        title: q1w ? teamLabel(q1w, "Final berth") : "Final berth",
        sub: q1w ? "Winner Q1 · waits for Qualifier 2" : "Winner Q1"
      },
      q2: slot("Qualifier 2", q2.detail, q2.outcome, ""),
      fin: slot("Final", fin.detail, fin.outcome, "final")
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
    const s = liveSlots();
    return (
      '<div class="playoff-flow playoff-flow--desktop">' +
      '<div class="playoff-col">' +
      nodeHtml({ badgeClass: s.q1.badgeClass, badge: "Qualifier 1", title: s.q1.title, sub: s.q1.sub }) +
      nodeHtml({ badgeClass: s.el.badgeClass, badge: "Eliminator", title: s.el.title, sub: s.el.sub }) +
      "</div>" +
      '<div class="playoff-arrows" aria-hidden="true"><span>→</span><span>→</span></div>' +
      '<div class="playoff-col">' +
      nodeHtml({
        extraClass: s.berth.extraClass,
        badgeClass: s.berth.badgeClass,
        badge: "Direct",
        title: s.berth.title,
        sub: s.berth.sub
      }) +
      nodeHtml({ badgeClass: s.q2.badgeClass, badge: "Qualifier 2", title: s.q2.title, sub: s.q2.sub }) +
      "</div>" +
      '<div class="playoff-arrows playoff-arrows--single" aria-hidden="true"><span>→</span></div>' +
      '<div class="playoff-col playoff-col--final">' +
      nodeHtml({
        extraClass: "final",
        badgeClass: s.fin.badgeClass,
        badge: "Final",
        title: s.fin.title,
        sub: s.fin.sub
      }) +
      "</div>" +
      "</div>"
    );
  }

  function bracketMobileHtml() {
    const s = liveSlots();
    return (
      '<div class="playoff-bracket-mobile">' +
      '<section class="playoff-round">' +
      '<h4 class="playoff-round-label">Round 1 <span>· league seeds</span></h4>' +
      '<div class="playoff-pair">' +
      nodeHtml({ badgeClass: s.q1.badgeClass, badge: "Qualifier 1", title: s.q1.title, sub: s.q1.sub }) +
      nodeHtml({ badgeClass: s.el.badgeClass, badge: "Eliminator", title: s.el.title, sub: s.el.sub }) +
      "</div>" +
      '<p class="playoff-round-hint">These two matches are played first (not one after the other).</p>' +
      "</section>" +
      '<section class="playoff-round">' +
      '<h4 class="playoff-round-label">Paths to the Final</h4>' +
      '<div class="playoff-path">' +
      connectorHtml("Winner of Qualifier 1") +
      nodeHtml({
        extraClass: s.berth.extraClass,
        badgeClass: s.berth.badgeClass,
        badge: "Direct",
        title: s.berth.title,
        sub: s.berth.sub
      }) +
      "</div>" +
      '<div class="playoff-path">' +
      connectorHtml("Loser Q1 vs Winner Eliminator") +
      nodeHtml({ badgeClass: s.q2.badgeClass, badge: "Qualifier 2", title: s.q2.title, sub: s.q2.sub }) +
      connectorHtml("Winner of Qualifier 2") +
      "</div>" +
      "</section>" +
      '<section class="playoff-round playoff-round--final">' +
      connectorHtml("Championship match") +
      nodeHtml({
        extraClass: "final",
        badgeClass: s.fin.badgeClass,
        badge: "Final",
        title: s.fin.title,
        sub: s.fin.sub
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

  function sectionHtml(settings, opts) {
    const o = opts || {};
    const s = mergedSettings(settings);
    const rules = s.rules
      .map(function (line) {
        return "<li>" + esc(line) + "</li>";
      })
      .join("");

    const heading = o.omitHeading
      ? ""
      : '<p class="kicker">After league · Top 4</p><h3>Playoffs &amp; qualification</h3>';

    const st = store();
    const leagueDone = st.leagueComplete ? st.leagueComplete() : false;
    const notice = leagueDone
      ? "League complete. Qualifier 1 and the Eliminator are created from the points table. Qualifier 2 and the Final fill in as those matches are published."
      : "League matches fill the points table (playoffs do not count). After all 15 league matches, Qualifier 1 (1st vs 2nd) and the Eliminator (3rd vs 4th) are created automatically.";

    return (
      '<article class="card playoff-card">' +
      heading +
      '<p class="muted">' + esc(s.intro) + "</p>" +
      '<ul class="rule-list">' + rules + "</ul>" +
      (s.adminNote ? '<p class="situation admin-playoff-note">' + esc(s.adminNote) + "</p>" : "") +
      bracketHtml() +
      '<p class="notice">' + esc(notice) + "</p>" +
      "</article>"
    );
  }

  DKPL.playoffs = {
    mergedSettings: mergedSettings,
    sectionHtml: sectionHtml,
    bracketHtml: bracketHtml
  };
})();
