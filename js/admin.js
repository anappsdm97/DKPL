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
    { key: "playoffs", label: "Playoffs" },
    { key: "data", label: "Data" }
  ];

  let tab = "teams";
  let editingTeam = null;
  let editingPlayer = null;
  let editingMatch = null;

  function syncSheet() {
    if (!DKPL.api.enabled()) return;
    DKPL.api.pushAll(S).catch(function (err) {
      console.warn(err);
      U.toast("Local save OK; Google Sheet sync failed");
    });
  }

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
        editingMatch = null;
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
    if (tab === "playoffs") return playoffsTab();
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
    const teams = S.teams();
    const m = editingMatch || {};
    const stages = ["League"].concat(cfg.playoffs.stages);

    function teamOptions(selected) {
      return (
        '<option value="">Select team</option>' +
        teams
          .map(function (t) {
            return '<option value="' + U.esc(t.id) + '"' + (t.id === selected ? " selected" : "") + ">" + U.esc(t.name) + "</option>";
          })
          .join("")
      );
    }

    const editForm = editingMatch
      ? '<section class="card"><h2>Edit fixture</h2>' +
        '<form id="matchForm"><div class="field-grid">' +
        '<div class="field"><label for="matchTeamA">Team A</label><select id="matchTeamA" required>' + teamOptions(m.teamA) + "</select></div>" +
        '<div class="field"><label for="matchTeamB">Team B</label><select id="matchTeamB" required>' + teamOptions(m.teamB) + "</select></div>" +
        '<div class="field"><label for="matchStage">Stage</label><select id="matchStage">' +
        stages
          .map(function (s) {
            return '<option value="' + U.esc(s) + '"' + (s === m.stage ? " selected" : "") + ">" + U.esc(s) + "</option>";
          })
          .join("") +
        "</select></div>" +
        '<div class="field"><label for="matchOvers">Overs</label><input id="matchOvers" type="number" min="1" max="20" value="' + U.esc(m.overs || cfg.oversOptions[cfg.oversOptions.length - 1]) + '"></div>' +
        '<div class="field"><label for="matchVenue">Venue</label><input id="matchVenue" value="' + U.esc(m.venue || cfg.venueDefault) + '"></div>' +
        '<div class="field"><label for="matchDate">Date / time</label><input id="matchDate" value="' + U.esc(m.date || "") + '"></div>' +
        '<div class="field"><label for="matchStatus">Status</label><select id="matchStatus">' +
        ["Upcoming", "Live", "Completed"]
          .map(function (st) {
            return '<option value="' + st + '"' + (st === m.status ? " selected" : "") + ">" + st + "</option>";
          })
          .join("") +
        "</select></div>" +
        "</div>" +
        '<p class="notice">Changing teams or overs does not auto-fix scores. Use <strong>Reset score</strong> to wipe ball-by-ball data and start again.</p>' +
        '<div class="row-actions"><button class="btn btn-primary" type="submit">Save fixture</button>' +
        '<button class="btn btn-ghost" type="button" id="cancelMatch">Cancel</button></div></form></section>'
      : "";

    return (
      editForm +
      '<section class="card"><h2>Fixtures</h2>' +
      '<p class="muted">Delete test matches or edit fixtures below. Round robin adds any missing league pairs (6 teams = 15). Playoffs are created from the points table after the league ends.</p>' +
      '<div class="row-actions">' +
      '<button class="btn btn-primary" type="button" id="genLeague">Generate league fixtures</button>' +
      '<button class="btn btn-ghost" type="button" id="genPlayoffs">Create / refresh playoffs</button>' +
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
                '<button class="btn btn-ghost" type="button" data-edit-match="' + U.esc(m.id) + '">Edit</button>' +
                '<a class="btn btn-ghost" href="scorer.html?match=' + U.esc(m.id) + '">Score</a>' +
                (m.innings && m.innings.length
                  ? '<button class="btn btn-ghost" type="button" data-reset-match="' + U.esc(m.id) + '">Reset score</button>'
                  : "") +
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

  /* ------------------------------------------------------------- playoffs */

  function playoffsTab() {
    const s = S.settings();
    const rulesText = s.rules.join("\n");
    return (
      '<section class="card"><h2>Playoffs &amp; qualification text</h2>' +
      '<p class="muted">Shown on the home page and fixtures. Knockout fixtures are created automatically from the league table. Edit this copy anytime — syncs to Google Sheets (Settings tab).</p>' +
      '<form id="playoffsForm"><div class="field field-wide">' +
      "<label for=\"playoffIntro\">Introduction</label>" +
      '<textarea id="playoffIntro" rows="4">' + U.esc(s.intro) + "</textarea></div>" +
      '<div class="field field-wide"><label for="playoffRules">Rules (one line each)</label>' +
      '<textarea id="playoffRules" rows="10">' + U.esc(rulesText) + "</textarea></div>" +
      '<div class="field field-wide"><label for="playoffNote">Extra note (optional)</label>' +
      '<textarea id="playoffNote" rows="3" placeholder="e.g. Playoffs on Sunday 6 March at DKPL Ground">' + U.esc(s.adminNote) + "</textarea></div>" +
      '<div class="row-actions"><button class="btn btn-primary" type="submit">Save &amp; sync</button></div></form></section>" +
      (DKPL.playoffs ? DKPL.playoffs.sectionHtml(S.settingsRaw()) : "")
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

    const matchForm = document.getElementById("matchForm");
    if (matchForm) {
      matchForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const teamA = document.getElementById("matchTeamA").value;
        const teamB = document.getElementById("matchTeamB").value;
        if (!teamA || !teamB || teamA === teamB) {
          U.toast("Pick two different teams");
          return;
        }
        const status = document.getElementById("matchStatus").value;
        const keepScore = status !== "Upcoming";
        S.saveMatch({
          id: editingMatch.id,
          teamA: teamA,
          teamB: teamB,
          stage: document.getElementById("matchStage").value,
          overs: Number(document.getElementById("matchOvers").value) || 10,
          venue: document.getElementById("matchVenue").value.trim(),
          date: document.getElementById("matchDate").value.trim(),
          status: status,
          innings: keepScore ? editingMatch.innings || [] : [],
          result: keepScore ? editingMatch.result || null : null,
          toss: keepScore ? editingMatch.toss || null : null,
          playerOfMatch: keepScore ? editingMatch.playerOfMatch || "" : ""
        });
        editingMatch = null;
        U.toast("Fixture saved");
        syncSheet();
        render();
      });
    }

    const playoffsForm = document.getElementById("playoffsForm");
    if (playoffsForm) {
      playoffsForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const rules = document
          .getElementById("playoffRules")
          .value.split("\n")
          .map(function (line) {
            return line.trim();
          })
          .filter(Boolean);
        S.saveSettings({
          intro: document.getElementById("playoffIntro").value.trim(),
          rules: rules,
          adminNote: document.getElementById("playoffNote").value.trim()
        });
        U.toast("Playoff instructions saved");
        DKPL.api.pushSettings(S.settingsRaw()).catch(function () {
          U.toast("Saved locally; sheet sync failed");
        });
        render();
      });
    }

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

      if (target.id === "cancelMatch") {
        editingMatch = null;
        return render();
      }

      const editMatch = target.closest("[data-edit-match]");
      if (editMatch) {
        editingMatch = S.matchById(editMatch.dataset.editMatch);
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const resetMatch = target.closest("[data-reset-match]");
      if (resetMatch) {
        const ok = await U.confirm(
          "Reset this match score?",
          "All innings and the result will be cleared. The fixture stays as Upcoming."
        );
        if (ok) {
          S.resetMatch(resetMatch.dataset.resetMatch);
          U.toast("Score cleared");
          syncSheet();
          render();
        }
        return;
      }

      const delMatch = target.closest("[data-del-match]");
      if (delMatch) {
        const ok = await U.confirm("Delete this match?", "Scores for this match will be lost.");
        if (ok) {
          S.deleteMatch(delMatch.dataset.delMatch);
          U.toast("Match deleted");
          syncSheet();
          render();
        }
        return;
      }

      if (target.id === "genLeague") {
        const created = S.generateLeague(cfg.venueDefault);
        U.toast(created.length ? created.length + " fixtures created" : "Fixtures already exist");
        return render();
      }

      if (target.id === "genPlayoffs") {
        const out = S.syncPlayoffFixtures();
        if (!out.ok && out.reason === "league") {
          U.toast("Finish all " + cfg.leagueMatches + " league matches first");
        } else if (!out.ok) {
          U.toast("Need four teams on the points table");
        } else {
          U.toast("Playoff fixtures updated");
          syncSheet();
        }
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
