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

  function sectionHtml() {
    const r = cfg.tournamentRules;
    if (!r) return "";

    let body = "";

    if (r.sections && r.sections.length) {
      r.sections.forEach(function (sec) {
        body += "<h4>" + esc(sec.title) + "</h4>" + listHtml(sec.items, true);
      });
    } else {
      body += listHtml(r.items, true);
      if (r.formatTitle && r.formatItems) {
        body += "<h4>" + esc(r.formatTitle) + "</h4>" + listHtml(r.formatItems, false);
      }
    }

    return (
      '<article class="card rules-card">' +
      '<p class="muted">' + esc(r.intro) + "</p>" +
      body +
      '<p class="notice">For questions or disputes off the field, contact the DKPL organising committee.</p>' +
      "</article>"
    );
  }

  DKPL.rules = { sectionHtml: sectionHtml };
})();
