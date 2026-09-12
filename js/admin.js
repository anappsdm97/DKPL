(function () {
  function page(title, body) {
    return '<h2>' + title + '</h2><p class="muted">' + body + '</p>';
  }

  const panels = {
    teams: page("Teams", "Add, edit, delete teams and upload logos. Data is stored in the Teams sheet."),
    players: page("Players", "Add or edit players, assign roles, and upload photos from Google Drive."),
    fixtures: page("Fixtures", "Create league fixtures (15 matches) and knockout ties: Rank 1 vs 4, Rank 2 vs 3, then the final."),
    match: page("Match control", "Start match, run toss, score ball by ball, edit score, and publish the result.")
  };

  document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("adminLogin");
    const dash = document.getElementById("adminDash");
    const panel = document.getElementById("adminPanel");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.hidden = true;
      dash.hidden = false;
    });

    dash.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-panel]");
      if (!btn) return;
      panel.innerHTML = panels[btn.dataset.panel] || "";
    });
  });
})();
