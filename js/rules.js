/** Tournament rules section for the home page. */
(function () {
  const DKPL = (window.DKPL = window.DKPL || {});
  const cfg = window.DKPL_CONFIG;
  const LANG_KEY = "dkpl.rulesLang";

  function esc(v) {
    return DKPL.ui.esc(v);
  }

  function savedLang() {
    const v = sessionStorage.getItem(LANG_KEY);
    return v === "kn" ? "kn" : "en";
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
    const r = window.DKPL_RULES || (cfg && cfg.tournamentRules);
    if (!r) return "";

    const knSections = r.kannadaSections || [];
    const hasKn = knSections.length > 0;
    const lang = savedLang();

    const englishBlock =
      '<p class="muted">' + esc(r.intro) + "</p>" + sectionsHtml(r.sections);

    const kannadaBlock = hasKn
      ? (r.kannadaIntro ? '<p class="muted">' + esc(r.kannadaIntro) + "</p>" : "") +
        sectionsHtml(knSections)
      : '<p class="muted">ಕನ್ನಡ ನಿಯಮಗಳು ಲೋಡ್ ಆಗಿಲ್ಲ. ಪುಟವನ್ನು ರಿಫ್ರೆಶ್ ಮಾಡಿ ಅಥವಾ ತಾಜಾ ಸೈಟ್ ಪ್ರಕಟಿಸಲಾಗಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ.</p>';

    const tabs = hasKn
      ? '<div class="rules-tabs tabs" role="tablist" aria-label="Rule language">' +
        '<button type="button" class="tab' +
        (lang === "en" ? " active" : "") +
        '" data-rules-lang="en" aria-selected="' +
        (lang === "en" ? "true" : "false") +
        '">English</button>' +
        '<button type="button" class="tab' +
        (lang === "kn" ? " active" : "") +
        '" data-rules-lang="kn" aria-selected="' +
        (lang === "kn" ? "true" : "false") +
        '">ಕನ್ನಡ</button>' +
        "</div>"
      : "";

    return (
      '<article class="card rules-card">' +
      tabs +
      '<div class="rules-panel" data-rules-panel="en"' +
      (lang !== "en" ? " hidden" : "") +
      ">" +
      englishBlock +
      "</div>" +
      (hasKn
        ? '<div class="rules-panel" data-rules-panel="kn" lang="kn"' +
          (lang !== "kn" ? " hidden" : "") +
          ">" +
          kannadaBlock +
          "</div>"
        : "") +
      '<p class="notice rules-notice-en">For questions or disputes off the field, contact the DKPL organising committee.</p>' +
      '<p class="notice rules-notice-kn" lang="kn" hidden>ಪಂದ್ಯದ ಹೊರಗಿನ ಪ್ರಶ್ನೆಗಳು ಅಥವಾ ವಿವಾದಗಳಿಗೆ DKPL ಆಯೋಜಕ ಸಮಿತಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.</p>' +
      "</article>"
    );
  }

  function applyLang(card, lang) {
    sessionStorage.setItem(LANG_KEY, lang);
    card.querySelectorAll("[data-rules-lang]").forEach(function (b) {
      const on = b.getAttribute("data-rules-lang") === lang;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    card.querySelectorAll("[data-rules-panel]").forEach(function (panel) {
      panel.hidden = panel.getAttribute("data-rules-panel") !== lang;
    });
    const enNotice = card.querySelector(".rules-notice-en");
    const knNotice = card.querySelector(".rules-notice-kn");
    if (enNotice) enNotice.hidden = lang === "kn";
    if (knNotice) knNotice.hidden = lang !== "kn";
  }

  function bindTabs(container) {
    if (!container) return;
    const card = container.querySelector(".rules-card");
    if (!card) return;

    applyLang(card, savedLang());

    card.querySelectorAll("[data-rules-lang]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyLang(card, btn.getAttribute("data-rules-lang"));
      });
    });
  }

  DKPL.rules = {
    sectionHtml: sectionHtml,
    bindTabs: bindTabs
  };
})();
