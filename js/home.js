(function () {
  function el(id) {
    return document.getElementById(id);
  }

  function render(data) {
    const live = data.live;
    el("liveMatch").innerHTML =
      '<span class="badge live">Live</span>' +
      '<div class="score-line"><div><div class="team-name">' + live.teamA + ' vs ' + live.teamB + '</div>' +
      '<div class="muted">' + live.venue + '</div></div>' +
      '<div class="score">' + live.score + '</div></div>' +
      '<p class="muted" style="margin-top:8px">' + live.batting + ' · ' + live.overs + ' Overs</p>' +
      '<div class="batter-row"><span>' + live.striker + '</span><span>' + live.nonStriker + '</span></div>' +
      '<div class="bowler-row"><span>Bowler</span><span>' + live.bowler + '</span></div>' +
      '<div class="situation">' + live.situation + '</div>';

    el("upcomingMatches").innerHTML = data.upcoming.map(function (m) {
      return '<article class="card"><span class="badge up">' + m.stage + '</span>' +
        '<h3 style="margin:10px 0 6px">' + m.teamA + ' vs ' + m.teamB + '</h3>' +
        '<p class="muted">' + m.date + ' · ' + m.venue + '</p></article>';
    }).join("");

    el("latestResult").innerHTML =
      '<span class="badge done">Result</span>' +
      '<h3 style="margin:10px 0 6px">' + data.latest.teamA + ' vs ' + data.latest.teamB + '</h3>' +
      '<p>' + data.latest.result + '</p>' +
      '<p class="muted">' + data.latest.scores + '</p>';

    const s = data.stats;
    el("tournamentStats").innerHTML =
      '<div class="card stat-card"><strong>' + s.teams + '</strong><span>Teams</span></div>' +
      '<div class="card stat-card"><strong>' + s.leagueMatches + '</strong><span>League matches</span></div>' +
      '<div class="card stat-card"><strong>' + s.completed + '</strong><span>Completed</span></div>' +
      '<div class="card stat-card"><strong>' + s.remaining + '</strong><span>Remaining</span></div>';

    if (data.preview) {
      el("dataNotice").hidden = false;
    }
  }

  document.addEventListener("DOMContentLoaded", async function () {
    const data = await DKPL.api.get("home", DKPL.demo.home);
    render(data);
  });
})();
