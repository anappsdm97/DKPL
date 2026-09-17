document.addEventListener("DOMContentLoaded", function () {
  initHomeTabs();
  DKPL.start("home");
});

function initHomeTabs() {
  const tabBar = document.querySelector(".home-tabs");
  if (!tabBar) return;

  const tabs = tabBar.querySelectorAll("[data-home-tab]");
  const panels = {
    overview: document.getElementById("homeTabOverview"),
    rules: document.getElementById("homeTabRules"),
    playoffs: document.getElementById("homeTabPlayoffs")
  };

  function showPanel(key) {
    Object.keys(panels).forEach(function (k) {
      const panel = panels[k];
      if (!panel) return;
      const on = k === key;
      panel.hidden = !on;
      panel.classList.toggle("home-tab-panel-active", on);
    });
    tabs.forEach(function (btn) {
      const active = btn.getAttribute("data-home-tab") === key;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    if (key !== "overview") {
      window.scrollTo({ top: tabBar.offsetTop - 72, behavior: "smooth" });
    }
  }

  tabs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      showPanel(btn.getAttribute("data-home-tab"));
      const key = btn.getAttribute("data-home-tab");
      if (key === "overview") {
        history.replaceState(null, "", location.pathname + location.search);
      } else {
        history.replaceState(null, "", "#" + key);
      }
    });
  });

  function panelFromHash() {
    const hash = (location.hash || "").replace("#", "");
    if (hash === "rules" || hash === "playoffs") return hash;
    return "overview";
  }

  showPanel(panelFromHash());

  window.addEventListener("hashchange", function () {
    showPanel(panelFromHash());
  });
}
