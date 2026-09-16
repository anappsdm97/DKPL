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

  function bracketHtml() {
    const q1 = cfg.playoffs.bracket[0];
    const el = cfg.playoffs.bracket[1];
    const q2 = cfg.playoffs.bracket[2];
    const fin = cfg.playoffs.bracket[3];

    return (
      '<div class="playoff-flow">' +
      '<div class="playoff-col">' +
      '<div class="playoff-node"><span class="badge up">' + esc(q1.stage) + "</span><strong>" + esc(q1.detail) + "</strong><small>" + esc(q1.outcome) + "</small></div>" +
      '<div class="playoff-node"><span class="badge up">' + esc(el.stage) + "</span><strong>" + esc(el.detail) + "</strong><small>" + esc(el.outcome) + "</small></div>" +
      "</div>" +
      '<div class="playoff-arrows" aria-hidden="true">→<br>→</div>' +
      '<div class="playoff-col">' +
      '<div class="playoff-node highlight"><span class="badge done">Direct</span><strong>Final berth</strong><small>Winner Q1</small></div>' +
      '<div class="playoff-node"><span class="badge up">' + esc(q2.stage) + "</span><strong>" + esc(q2.detail) + "</strong><small>" + esc(q2.outcome) + "</small></div>" +
      "</div>" +
      '<div class="playoff-arrows" aria-hidden="true">→</div>' +
      '<div class="playoff-col">' +
      '<div class="playoff-node final"><span class="badge live">Final</span><strong>' + esc(fin.detail) + "</strong><small>" + esc(fin.outcome) + "</small></div>" +
      "</div>" +
      "</div>"
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
