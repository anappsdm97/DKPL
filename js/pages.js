/** Renderers for the public pages. */
(function () {
  const DKPL = window.DKPL;
  const cfg = window.DKPL_CONFIG;
  const S = DKPL.store;
  const U = DKPL.ui;

  function el(id) {
    return document.getElementById(id);
  }

  function matchCard(m) {
    const meta = [m.stage, m.overs + " overs", m.date || "", m.venue || ""].filter(Boolean).join(" · ");
    const body =
      m.status === "Upcoming"
        ? '<span class="badge up">' + U.esc(m.stage) + "</span>"
        : DKPL.board.miniHtml(m);
    const title =
      m.status === "Upcoming"
        ? "<h3>" + U.esc(S.teamName(m.teamA)) + " vs " + U.esc(S.teamName(m.teamB)) + "</h3>" +
          '<p class="muted">' + U.esc(meta) + "</p>"
        : "";
    return '<article class="card fixture-card">' + body + title + "</article>";
  }

  /** Same-tab scoring + cross-tab admin + periodic Sheets pull for spectators. */
  function attachLiveRefresh(draw) {
    async function refresh() {
      if (DKPL.api.enabled()) await S.ready();
      draw();
    }
    window.addEventListener("dkpl-data-changed", draw);
    window.addEventListener("storage", draw);
    setInterval(refresh, 4000);
  }

  const pages = {
    home: function () {
      function renderHome() {
      const live = S.liveMatch();
      const upcoming = S.upcomingMatches().slice(0, 3);
      const completed = S.completedMatches();
      const latest = completed[completed.length - 1] || null;
      const table = S.pointsTable();
      const boards = S.leaderboards();

      if (S.isEmpty()) {
        el("liveSlot").innerHTML = U.empty(
          "No teams yet. Add your six teams and players in the admin console to bring the portal to life.",
          "pages/admin.html",
          "Open admin"
        );
        el("upcomingSlot").innerHTML = "";
        el("resultSlot").innerHTML = "";
      } else {
        el("liveSlot").innerHTML = live
          ? '<article class="card live-card">' + DKPL.board.miniHtml(live) + DKPL.board.currentPlayers(live) +
            '<a class="btn btn-primary" href="pages/live.html">Open full scoreboard</a></article>'
          : U.empty(
              "No live match yet. Create a fixture in Admin, open Scorer, complete setup and tap Start match.",
              "pages/scorer.html",
              "Open scorer"
            );

        el("upcomingSlot").innerHTML = upcoming.length
          ? upcoming.map(matchCard).join("")
          : U.empty("No upcoming matches scheduled.");

        el("resultSlot").innerHTML = latest
          ? '<article class="card">' + DKPL.board.miniHtml(latest) + "</article>"
          : U.empty("No completed matches yet.");
      }

      el("statsSlot").innerHTML =
        '<div class="card stat-card"><strong>' + S.teams().length + "</strong><span>Teams</span></div>" +
        '<div class="card stat-card"><strong>' + cfg.leagueMatches + "</strong><span>League matches</span></div>" +
        '<div class="card stat-card"><strong>' + completed.length + "</strong><span>Completed</span></div>" +
        '<div class="card stat-card"><strong>' + Math.max(0, cfg.leagueMatches - completed.length) + "</strong><span>Remaining</span></div>";

      el("tableSlot").innerHTML = table.length
        ? '<div class="card table-wrap"><table><thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>L</th><th>Pts</th><th>NRR</th></tr></thead><tbody>' +
          table
            .map(function (r, i) {
              return (
                "<tr" + (i < cfg.qualify ? ' class="qualified"' : "") + "><td>" + (i + 1) + "</td>" +
                '<td class="team-cell">' + U.avatar(r.name, r.logo, "") + U.esc(r.name) + "</td><td>" + r.played +
                "</td><td>" + r.won + "</td><td>" + r.lost + "</td><td>" + r.points + "</td><td>" + r.nrr + "</td></tr>"
              );
            })
            .join("") +
          "</tbody></table></div>"
        : U.empty("The points table fills up automatically once matches are played.");

      const mvp = boards.mvp[0];
      el("mvpSlot").innerHTML = mvp
        ? '<article class="card mvp-card">' + U.avatar(mvp.name, mvp.photo, "", "lg") +
          "<div><p class=\"kicker\">Leading MVP</p><h3>" + U.esc(mvp.name) + "</h3>" +
          '<p class="muted">' + U.esc(mvp.teamName) + " · " + mvp.runs + " runs · " + mvp.wickets + " wickets</p>" +
          '<p class="score">' + mvp.mvp + " pts</p></div></article>"
        : U.empty("MVP rankings appear after the first match.");
      }

      renderHome();
      attachLiveRefresh(renderHome);
    },

    teams: function () {
      function draw() {
      const teams = S.teams();
      el("app").innerHTML = teams.length
        ? '<div class="team-grid">' +
          teams
            .map(function (t) {
              const squad = S.squad(t.id);
              return (
                '<article class="card team-card" style="--team:' + U.esc(t.colour || "#0f766e") + '">' +
                '<div class="team-card-head">' + U.avatar(t.name, t.logo, t.colour, "lg") +
                "<div><h3>" + U.esc(t.name) + "</h3>" +
                '<p class="muted">' + (t.captain ? "Captain " + U.esc(t.captain) : "Captain to be named") + "</p></div></div>" +
                '<p class="muted">' + squad.length + " players</p>" +
                '<ul class="squad-list">' +
                squad
                  .map(function (p) {
                    return "<li>" + U.avatar(p.name, p.photo, t.colour) + "<span>" + U.esc(p.name) +
                      '<small>' + U.esc(p.role || "") + "</small></span></li>";
                  })
                  .join("") +
                "</ul></article>"
              );
            })
            .join("") +
          "</div>"
        : U.empty("No teams added yet.", "admin.html", "Add teams");
      }
      draw();
      attachLiveRefresh(draw);
    },

    players: function () {
      const teams = S.teams();
      const stats = S.playerStats();
      const filter = el("teamFilter");

      filter.innerHTML =
        '<option value="">All teams</option>' +
        teams
          .map(function (t) {
            return '<option value="' + U.esc(t.id) + '">' + U.esc(t.name) + "</option>";
          })
          .join("");

      function draw() {
        const teamId = filter.value;
        const rows = stats.filter(function (p) {
          return !teamId || p.teamId === teamId;
        });
        el("app").innerHTML = rows.length
          ? '<div class="player-grid">' +
            rows
              .map(function (p) {
                const team = S.teamById(p.teamId);
                return (
                  '<article class="card player-card">' +
                  U.avatar(p.name, p.photo, team && team.colour, "lg") +
                  "<h3>" + U.esc(p.name) + "</h3>" +
                  '<p class="muted">' + U.esc(p.teamName) + " · " + U.esc(S.playerById(p.playerId) ? S.playerById(p.playerId).role : "") + "</p>" +
                  '<div class="player-stats"><span><strong>' + p.runs + "</strong>Runs</span>" +
                  "<span><strong>" + p.wickets + "</strong>Wickets</span>" +
                  "<span><strong>" + p.mvp + "</strong>MVP</span></div>" +
                  "</article>"
                );
              })
              .join("") +
            "</div>"
          : U.empty("No players added yet.", "admin.html", "Add players");
      }

      filter.addEventListener("change", draw);
      draw();
    },

    fixtures: function () {
      const matches = S.matches();
      if (!matches.length) {
        el("app").innerHTML = U.empty("No fixtures yet.", "admin.html", "Create fixtures");
        return;
      }

      function group(title, rows) {
        if (!rows.length) return "";
        return (
          '<section class="section"><div class="section-head"><h2>' + title + "</h2></div>" +
          '<div class="grid grid-3">' + rows.map(matchCard).join("") + "</div></section>"
        );
      }

      el("app").innerHTML =
        group("Live", matches.filter(function (m) { return m.status === "Live"; })) +
        group("Upcoming", matches.filter(function (m) { return m.status === "Upcoming"; })) +
        group("Results", matches.filter(function (m) { return m.status === "Completed"; })) +
        '<section class="section"><div class="section-head"><h2>Knockout stage</h2></div>' +
        '<div class="grid grid-3">' +
        cfg.knockout
          .map(function (k) {
            return '<article class="card"><span class="badge up">' + U.esc(k.stage) + "</span><h3>" + U.esc(k.detail) + "</h3></article>";
          })
          .join("") +
        "</div></section>";
    },

    points: function () {
      const rows = S.pointsTable();
      el("app").innerHTML = rows.length
        ? '<div class="card table-wrap"><table><thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>L</th><th>T</th><th>Pts</th><th>NRR</th></tr></thead><tbody>' +
          rows
            .map(function (r, i) {
              return (
                "<tr" + (i < cfg.qualify ? ' class="qualified"' : "") + "><td>" + (i + 1) + "</td>" +
                '<td class="team-cell">' + U.avatar(r.name, r.logo, "") + U.esc(r.name) + "</td>" +
                "<td>" + r.played + "</td><td>" + r.won + "</td><td>" + r.lost + "</td><td>" + r.tied +
                "</td><td>" + r.points + "</td><td>" + r.nrr + "</td></tr>"
              );
            })
            .join("") +
          "</tbody></table>" +
          '<p class="notice">Top ' + cfg.qualify + " teams qualify. Net run rate breaks ties.</p></div>"
        : U.empty("No teams yet.", "admin.html", "Add teams");
    },

    stats: function () {
      const b = S.leaderboards();
      const blocks = [
        ["Most runs", b.mostRuns, "runs"],
        ["Most wickets", b.mostWickets, "wickets"],
        ["Highest score", b.highestScore, "highest"],
        ["Best bowling", b.bestBowling, "best"],
        ["MVP ranking", b.mvp, "mvp"]
      ];

      const any = blocks.some(function (x) {
        return x[1].length;
      });

      el("app").innerHTML = any
        ? '<div class="grid grid-3">' +
          blocks
            .map(function (block) {
              const rows = block[1];
              return (
                '<article class="card leader-card"><p class="kicker">' + block[0] + "</p>" +
                (rows.length
                  ? '<ol class="leader-list">' +
                    rows
                      .map(function (p) {
                        const value =
                          block[2] === "best" ? p.bestWickets + "/" + p.bestRuns : p[block[2]];
                        return (
                          "<li>" + U.avatar(p.name, p.photo, "") +
                          "<span><strong>" + U.esc(p.name) + "</strong><small>" + U.esc(p.teamName) + "</small></span>" +
                          "<b>" + U.esc(value) + "</b></li>"
                        );
                      })
                      .join("") +
                    "</ol>"
                  : '<p class="muted">No data yet.</p>') +
                "</article>"
              );
            })
            .join("") +
          "</div>" +
          '<section class="card"><h2>How MVP points are calculated</h2>' +
          '<div class="mvp-rules"><div><h4>Batting</h4><p>1 per run · +1 per four · +2 per six · +10 for a fifty · +25 for a hundred</p></div>' +
          "<div><h4>Bowling</h4><p>20 per wicket · 10 per maiden · economy bonus up to +15</p></div>" +
          "<div><h4>Fielding</h4><p>8 per catch · 10 per run out · 10 per stumping</p></div></div></section>"
        : U.empty("Statistics appear once the first match is scored.", "scorer.html", "Open scorer");
    },

    live: function () {
      function draw() {
        const live = S.liveMatch();
        if (live) {
          el("app").innerHTML = DKPL.board.fullHtml(live);
          return;
        }
        const completed = S.completedMatches();
        const latest = completed[completed.length - 1];
        el("app").innerHTML = latest
          ? '<p class="muted">No live match. Showing the most recent result.</p>' + DKPL.board.fullHtml(latest)
          : U.empty("No match is being scored right now.", "fixtures.html", "See fixtures");
      }

      draw();
      attachLiveRefresh(draw);
    }
  };

  DKPL.pages = pages;

  /** Boots a page: header, remote pull, then the renderer. */
  DKPL.start = async function (name, navKey) {
    U.mount(navKey || name);
    await S.ready();
    pages[name]();
  };
})();
