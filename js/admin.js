/** Admin console: full control over teams, players, fixtures and matches. */
(function () {
  const DKPL = window.DKPL;
  const cfg = window.DKPL_CONFIG;
  const S = DKPL.store;
  const U = DKPL.ui;

  const ROLES = ["Batter", "Bowler", "All-rounder", "Wicketkeeper"];
  const TABS = [
    { key: "teams", label: "Teams" },
    { key: "players", label: "Players" },
    { key: "fixtures", label: "Fixtures" },
    { key: "data", label: "Data" }
  ];

  let tab = "teams";
  let editingTeam = null;
  let editingPlayer = null;

  function app() {
    return document.getElementById("app");
  }

  function render() {
    app().innerHTML =
      '<div class="tabs">' +
      TABS.map(function (t) {
        return '<button class="tab' + (t.key === tab ? " active" : "") + '" type="button" data-tab="' + t.key + '">' + t.label + "</button>";
      }).join("") +
      '<button class="tab tab-danger" type="button" id="signOut">Lock</button>' +
      "</div>" +
      '<div id="tabBody">' + body() + "</div>";

    document.querySelector(".tabs").addEventListener("click", function (e) {
      const btn = e.target.closest("[data-tab]");
      if (btn) {
        tab = btn.dataset.tab;
        editingTeam = null;
        editingPlayer = null;
        render();
      }
      if (e.target.id === "signOut") U.signOut();
    });

    bind();
  }

  function body() {
    if (tab === "teams") return teamsTab();
    if (tab === "players") return playersTab();
    if (tab === "fixtures") return fixturesTab();
    return dataTab();
  }

  /* --------------------------------------------------------------- teams */

  function teamsTab() {
    const t = editingTeam || {};
    const teams = S.teams();

    return (
      '<section class="card">' +
      "<h2>" + (editingTeam ? "Edit team" : "Add team") + "</h2>" +
      '<form id="teamForm"><div class="field-grid">' +
      '<div class="field"><label for="teamName">Team name</label><input id="teamName" required value="' + U.esc(t.name || "") + '"></div>' +
      '<div class="field"><label for="teamShort">Short code</label><input id="teamShort" maxlength="4" placeholder="TTN" value="' + U.esc(t.short || "") + '"></div>' +
      '<div class="field"><label for="teamCaptain">Captain</label><input id="teamCaptain" value="' + U.esc(t.captain || "") + '"></div>' +
      '<div class="field"><label for="teamColour">Team colour</label><input id="teamColour" type="color" value="' + U.esc(t.colour || "#0f766e") + '"></div>' +
      '<div class="field field-wide"><label for="teamLogo">Logo URL (Google Drive link or image URL)</label>' +
      '<input id="teamLogo" value="' + U.esc(t.logo || "") + '" placeholder="https://drive.google.com/file/d/.../view"></div>' +
      "</div>" +
      '<div class="row-actions"><button class="btn btn-primary" type="submit">' + (editingTeam ? "Save changes" : "Add team") + "</button>" +
      (editingTeam ? '<button class="btn btn-ghost" type="button" id="cancelTeam">Cancel</button>' : "") +
      "</div></form></section>" +
      '<section class="card"><h2>Teams (' + teams.length + " of " + cfg.teamCount + ")</h2>" +
      (teams.length
        ? '<div class="list">' +
          teams
            .map(function (team) {
              const squad = S.squad(team.id).length;
              return (
                '<div class="list-row"><span class="person">' +
                U.avatar(team.name, team.logo, team.colour) +
                "<span><strong>" + U.esc(team.name) + "</strong><small>" +
                (team.captain ? "Captain " + U.esc(team.captain) + " · " : "") + squad + " players</small></span></span>" +
                '<span class="row-buttons">' +
                '<button class="btn btn-ghost" type="button" data-edit-team="' + U.esc(team.id) + '">Edit</button>' +
                '<button class="btn btn-danger" type="button" data-del-team="' + U.esc(team.id) + '">Delete</button>' +
                "</span></div>"
              );
            })
            .join("") +
          "</div>"
        : '<p class="muted">No teams yet.</p>') +
      "</section>"
    );
  }

  /* ------------------------------------------------------------- players */

  function playersTab() {
    const teams = S.teams();
    if (!teams.length) return U.empty("Add a team first, then add its players.");

    const p = editingPlayer || {};
    const players = S.players();

    return (
      '<section class="card">' +
      "<h2>" + (editingPlayer ? "Edit player" : "Add player") + "</h2>" +
      '<form id="playerForm"><div class="field-grid">' +
      '<div class="field"><label for="playerName">Player name</label><input id="playerName" required value="' + U.esc(p.name || "") + '"></div>' +
      '<div class="field"><label for="playerTeam">Team</label><select id="playerTeam" required>' +
      teams
        .map(function (t) {
          return '<option value="' + U.esc(t.id) + '"' + (t.id === p.teamId ? " selected" : "") + ">" + U.esc(t.name) + "</option>";
        })
        .join("") +
      "</select></div>" +
      '<div class="field"><label for="playerRole">Role</label><select id="playerRole">' +
      ROLES.map(function (r) {
        return '<option value="' + r + '"' + (r === p.role ? " selected" : "") + ">" + r + "</option>";
      }).join("") +
      "</select></div>" +
      '<div class="field field-wide"><label for="playerPhoto">Photo URL (Google Drive link or image URL)</label>' +
      '<input id="playerPhoto" value="' + U.esc(p.photo || "") + '"></div>' +
      "</div>" +
      '<div class="row-actions"><button class="btn btn-primary" type="submit">' + (editingPlayer ? "Save changes" : "Add player") + "</button>" +
      (editingPlayer ? '<button class="btn btn-ghost" type="button" id="cancelPlayer">Cancel</button>' : "") +
      "</div></form></section>" +
      teams
        .map(function (team) {
          const squad = players.filter(function (x) {
            return x.teamId === team.id;
          });
          return (
            '<section class="card"><h2>' + U.esc(team.name) + " · " + squad.length + " players</h2>" +
            (squad.length
              ? '<div class="list">' +
                squad
                  .map(function (player) {
                    return (
                      '<div class="list-row"><span class="person">' +
                      U.avatar(player.name, player.photo, team.colour) +
                      "<span><strong>" + U.esc(player.name) + "</strong><small>" + U.esc(player.role || "") + "</small></span></span>" +
                      '<span class="row-buttons">' +
                      '<button class="btn btn-ghost" type="button" data-edit-player="' + U.esc(player.id) + '">Edit</button>' +
                      '<button class="btn btn-danger" type="button" data-del-player="' + U.esc(player.id) + '">Delete</button>' +
                      "</span></div>"
                    );
                  })
                  .join("") +
                "</div>"
              : '<p class="muted">No players yet.</p>') +
            "</section>"
          );
        })
        .join("")
    );
  }

  /* ------------------------------------------------------------ fixtures */

  function fixturesTab() {
    const matches = S.matches();
    return (
      '<section class="card"><h2>Fixtures</h2>' +
      '<p class="muted">Round robin creates every remaining league fixture (6 teams = 15 matches).</p>' +
      '<div class="row-actions">' +
      '<button class="btn btn-primary" type="button" id="genLeague">Generate league fixtures</button>' +
      '<a class="btn btn-ghost" href="scorer.html">Start a match</a>' +
      "</div></section>" +
      '<section class="card"><h2>All matches (' + matches.length + ")</h2>" +
      (matches.length
        ? '<div class="list">' +
          matches
            .map(function (m) {
              const score = m.innings && m.innings.length
                ? m.innings
                    .map(function (_, i) {
                      const s = S.inningsState(m, i);
                      return s.runs + "/" + s.wickets + " (" + s.oversText + ")";
                    })
                    .join(" · ")
                : "";
              return (
                '<div class="list-row"><span><strong>' + U.esc(S.teamName(m.teamA)) + " vs " + U.esc(S.teamName(m.teamB)) +
                "</strong><small>" + U.esc(m.stage) + " · " + U.esc(m.overs) + " ov · " + U.esc(m.date || "TBD") +
                (score ? " · " + U.esc(score) : "") +
                (m.result ? " · " + U.esc(m.result.text) : "") + "</small></span>" +
                '<span class="row-buttons">' +
                '<span class="badge ' + (m.status === "Live" ? "live" : m.status === "Completed" ? "done" : "up") + '">' + U.esc(m.status) + "</span>" +
                '<a class="btn btn-ghost" href="scorer.html?match=' + U.esc(m.id) + '">Score</a>' +
                '<button class="btn btn-danger" type="button" data-del-match="' + U.esc(m.id) + '">Delete</button>' +
                "</span></div>"
              );
            })
            .join("") +
          "</div>"
        : '<p class="muted">No matches yet.</p>') +
      "</section>"
    );
  }

  /* ---------------------------------------------------------------- data */

  function dataTab() {
    const synced = DKPL.api.enabled();
    return (
      '<section class="card"><h2>Storage</h2>' +
      "<p>" +
      (synced
        ? "Connected to Google Sheets. Every change is saved to your sheet."
        : "Saving in this browser only. Paste your Apps Script web app URL into <code>js/config.js</code> (apiBase) to sync with Google Sheets and share across devices.") +
      "</p>" +
      (synced
        ? '<div class="row-actions"><button class="btn btn-primary" type="button" id="testCloud">Test Google Sheet</button>' +
          '<button class="btn btn-ghost" type="button" id="pushCloud">Sync everything now</button></div>' +
          '<p class="notice" id="cloudStatus">After scoring, use <strong>Sync everything now</strong> so phones see live updates.</p>'
        : "") +
      "</section>" +
      '<section class="card"><h2>Tools</h2><div class="row-actions">' +
      '<button class="btn btn-ghost" type="button" id="seed">Load sample tournament</button>' +
      '<button class="btn btn-ghost" type="button" id="exportData">Export JSON backup</button>' +
      '<button class="btn btn-danger" type="button" id="clearAll">Delete everything</button>' +
      "</div>" +
      '<p class="notice">Sample data is for testing the scorer. Delete it before the real tournament starts.</p>' +
      "</section>"
    );
  }

  /* ------------------------------------------------------------- binding */

  function bind() {
    const root = document.getElementById("tabBody");

    const teamForm = document.getElementById("teamForm");
    if (teamForm) {
      teamForm.addEventListener("submit", function (e) {
        e.preventDefault();
        S.saveTeam({
          id: editingTeam ? editingTeam.id : undefined,
          name: document.getElementById("teamName").value.trim(),
          short: document.getElementById("teamShort").value.trim().toUpperCase(),
          captain: document.getElementById("teamCaptain").value.trim(),
          colour: document.getElementById("teamColour").value,
          logo: document.getElementById("teamLogo").value.trim()
        });
        editingTeam = null;
        U.toast("Team saved locally — syncing to sheet…");
        DKPL.api
          .pushAll(S)
          .then(function () {
            U.toast("Team saved to Google Sheet");
          })
          .catch(function (err) {
            U.toast("Sheet upload failed");
            console.warn(err);
          });
        render();
      });
    }

    const playerForm = document.getElementById("playerForm");
    if (playerForm) {
      playerForm.addEventListener("submit", function (e) {
        e.preventDefault();
        S.savePlayer({
          id: editingPlayer ? editingPlayer.id : undefined,
          name: document.getElementById("playerName").value.trim(),
          teamId: document.getElementById("playerTeam").value,
          role: document.getElementById("playerRole").value,
          photo: document.getElementById("playerPhoto").value.trim()
        });
        editingPlayer = null;
        U.toast("Player saved");
        render();
      });
    }

    root.addEventListener("click", async function (e) {
      const target = e.target;

      if (target.id === "cancelTeam") {
        editingTeam = null;
        return render();
      }
      if (target.id === "cancelPlayer") {
        editingPlayer = null;
        return render();
      }

      const editTeam = target.closest("[data-edit-team]");
      if (editTeam) {
        editingTeam = S.teamById(editTeam.dataset.editTeam);
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const delTeam = target.closest("[data-del-team]");
      if (delTeam) {
        const ok = await U.confirm("Delete this team?", "Its players will be removed too.");
        if (ok) {
          S.deleteTeam(delTeam.dataset.delTeam);
          render();
        }
        return;
      }

      const editPlayer = target.closest("[data-edit-player]");
      if (editPlayer) {
        editingPlayer = S.playerById(editPlayer.dataset.editPlayer);
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const delPlayer = target.closest("[data-del-player]");
      if (delPlayer) {
        const ok = await U.confirm("Delete this player?");
        if (ok) {
          S.deletePlayer(delPlayer.dataset.delPlayer);
          render();
        }
        return;
      }

      const delMatch = target.closest("[data-del-match]");
      if (delMatch) {
        const ok = await U.confirm("Delete this match?", "Scores for this match will be lost.");
        if (ok) {
          S.deleteMatch(delMatch.dataset.delMatch);
          render();
        }
        return;
      }

      if (target.id === "genLeague") {
        const created = S.generateLeague(cfg.venueDefault);
        U.toast(created.length ? created.length + " fixtures created" : "Fixtures already exist");
        return render();
      }

      if (target.id === "seed") {
        const ok = await U.confirm("Load sample tournament?", "This replaces all current data.");
        if (ok) {
          S.seedSample();
          U.toast("Sample tournament loaded");
          render();
        }
        return;
      }

      if (target.id === "clearAll") {
        const ok = await U.confirm("Delete all teams, players and matches?");
        if (ok) {
          S.clearAll();
          U.toast("All data cleared");
          render();
        }
        return;
      }

      if (target.id === "testCloud") {
        const status = document.getElementById("cloudStatus");
        if (status) status.textContent = "Testing…";
        DKPL.api
          .testConnection()
          .then(function (r) {
            if (status) {
              status.textContent =
                "Sheet OK: " + r.teams + " teams, " + r.players + " players, " + r.matches + " matches.";
            }
            U.toast("Google Sheet connected");
          })
          .catch(function (err) {
            if (status) status.textContent = "Sheet error: " + err.message;
            U.toast("Sheet connection failed");
          });
        return;
      }

      if (target.id === "pushCloud") {
        const status = document.getElementById("cloudStatus");
        if (status) status.textContent = "Uploading…";
        DKPL.api
          .pushAll(S)
          .then(function () {
            if (status) status.textContent = "Uploaded. Phones should update within a few seconds.";
            U.toast("Synced to Google Sheet");
          })
          .catch(function (err) {
            if (status) status.textContent = "Upload failed: " + err.message;
            U.toast("Sync failed");
          });
        return;
      }

      if (target.id === "exportData") {
        const blob = new Blob(
          [JSON.stringify({ teams: S.teams(), players: S.players(), matches: S.matches() }, null, 2)],
          { type: "application/json" }
        );
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "dkpl-backup.json";
        link.click();
        URL.revokeObjectURL(link.href);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", async function () {
    U.mount("admin");
    await S.ready();
    U.requireAdmin(app(), render);
  });
})();
