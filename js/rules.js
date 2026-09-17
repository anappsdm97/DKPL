/** Tournament rules section for the home page. */
(function () {
  const DKPL = (window.DKPL = window.DKPL || {});
  const cfg = window.DKPL_CONFIG;

  function esc(v) {
    return DKPL.ui.esc(v);
  }

  function listHtml(items, numbered) {
    if (!items || !items.length) return "";
    if (numbered) {
      return (
        '<ol class="rule-list rule-list-numbered">' +
        items
          .map(function (line, i) {
            return '<li><span class="rule-num">' + (i + 1) + ".</span> " + esc(line) + "</li>";
          })
          .join("") +
        "</ol>"
      );
    }
    return (
      '<ul class="rule-list">' +
      items
        .map(function (line) {
          return "<li>" + esc(line) + "</li>";
        })
        .join("") +
      "</ul>"
    );
  }

  function sectionsHtml(sections) {
    if (!sections || !sections.length) return "";
    return sections
      .map(function (sec) {
        return "<h4>" + esc(sec.title) + "</h4>" + listHtml(sec.items, true);
      })
      .join("");
  }

  function sectionHtml() {
    const r = cfg.tournamentRules;
    if (!r) return "";

    let body = sectionsHtml(r.sections);

    if (r.kannadaSections && r.kannadaSections.length) {
      body +=
        '<div class="rules-lang-block" lang="kn">' +
        '<h3 class="rules-lang-title">ಕನ್ನಡ</h3>' +
        (r.kannadaIntro ? '<p class="muted">' + esc(r.kannadaIntro) + "</p>" : "") +
        sectionsHtml(r.kannadaSections) +
        "</div>";
    }

    return (
      '<article class="card rules-card">' +
      '<p class="rules-lang-label kicker">English</p>' +
      '<p class="muted">' + esc(r.intro) + "</p>" +
      body +
      '<p class="notice">For questions or disputes off the field, contact the DKPL organising committee.</p>' +
      "</article>"
    );
  }

  DKPL.rules = { sectionHtml: sectionHtml };
})();
