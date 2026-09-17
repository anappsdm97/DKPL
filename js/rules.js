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

    const knSections = r.kannadaSections || [];
    const hasKn = knSections.length > 0;

    const englishBlock =
      '<p class="muted">' + esc(r.intro) + "</p>" + sectionsHtml(r.sections);

    const kannadaBlock = hasKn
      ? (r.kannadaIntro ? '<p class="muted">' + esc(r.kannadaIntro) + "</p>" : "") +
        sectionsHtml(knSections)
      : '<p class="muted">Kannada rules are not loaded. Refresh the page or check that the latest site files are published.</p>';

    const tabs = hasKn
      ? '<div class="rules-tabs tabs" role="tablist" aria-label="Rule language">' +
        '<button type="button" class="tab active" data-rules-lang="en" aria-selected="true">English</button>' +
        '<button type="button" class="tab" data-rules-lang="kn" aria-selected="false">ಕನ್ನಡ</button>' +
        "</div>"
      : "";

    return (
      '<article class="card rules-card">' +
      tabs +
      '<div class="rules-panel" data-rules-panel="en">' +
      englishBlock +
      "</div>" +
      (hasKn
        ? '<div class="rules-panel" data-rules-panel="kn" lang="kn" hidden>' + kannadaBlock + "</div>"
        : "") +
      '<p class="notice">For questions or disputes off the field, contact the DKPL organising committee.</p>' +
      "</article>"
    );
  }

  function bindTabs(container) {
    if (!container) return;
    const card = container.querySelector(".rules-card");
    if (!card || card.dataset.rulesTabsBound === "yes") return;
    card.dataset.rulesTabsBound = "yes";

    card.querySelectorAll("[data-rules-lang]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const lang = btn.getAttribute("data-rules-lang");
        card.querySelectorAll("[data-rules-lang]").forEach(function (b) {
          const on = b === btn;
          b.classList.toggle("active", on);
          b.setAttribute("aria-selected", on ? "true" : "false");
        });
        card.querySelectorAll("[data-rules-panel]").forEach(function (panel) {
          panel.hidden = panel.getAttribute("data-rules-panel") !== lang;
        });
      });
    });
  }

  DKPL.rules = {
    sectionHtml: sectionHtml,
    bindTabs: bindTabs
  };
})();
