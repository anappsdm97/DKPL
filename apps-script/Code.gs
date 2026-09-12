function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheet(name) {
  return SpreadsheetApp.getActive().getSheetByName(name);
}

function rowsToObjects(name) {
  const sh = sheet(name);
  if (!sh) return [];
  const values = sh.getDataRange().getValues();
  const headers = values.shift();
  return values
    .filter(function (row) { return row.join("").trim() !== ""; })
    .map(function (row) {
      const obj = {};
      headers.forEach(function (h, i) { obj[h] = row[i]; });
      return obj;
    });
}

function doGet(e) {
  const action = (e.parameter.action || "home").toLowerCase();

  if (action === "teams") return json(rowsToObjects("Teams"));
  if (action === "players") return json(rowsToObjects("Players"));
  if (action === "fixtures") return json(rowsToObjects("Matches"));
  if (action === "points") return json(rowsToObjects("PointsTable"));
  if (action === "mvp") return json(rowsToObjects("MVP"));
  if (action === "live") return json(buildLive());
  if (action === "stats") return json(buildStats());
  if (action === "home") return json(buildHome());

  return json({ error: "Unknown action" });
}

function buildHome() {
  const matches = rowsToObjects("Matches");
  const liveMatch = matches.find(function (m) { return String(m.Status).toLowerCase() === "live"; }) || null;
  const upcoming = matches.filter(function (m) { return String(m.Status).toLowerCase() === "upcoming"; }).slice(0, 3);
  const completed = matches.filter(function (m) { return String(m.Status).toLowerCase() === "completed"; });
  const latest = completed[completed.length - 1] || null;

  return {
    preview: false,
    live: liveMatch ? {
      matchId: liveMatch.MatchID,
      teamA: liveMatch.TeamA,
      teamB: liveMatch.TeamB,
      batting: liveMatch.TeamA,
      score: "0/0",
      overs: "0.0",
      striker: "-",
      nonStriker: "-",
      bowler: "-",
      situation: "Innings in progress",
      venue: liveMatch.Venue
    } : {
      matchId: "",
      teamA: "-",
      teamB: "-",
      batting: "-",
      score: "-",
      overs: "-",
      striker: "-",
      nonStriker: "-",
      bowler: "-",
      situation: "No live match",
      venue: "-"
    },
    upcoming: upcoming.map(function (m) {
      return {
        matchId: m.MatchID,
        teamA: m.TeamA,
        teamB: m.TeamB,
        date: m.Date,
        venue: m.Venue,
        stage: m.Stage
      };
    }),
    latest: latest ? {
      teamA: latest.TeamA,
      teamB: latest.TeamB,
      result: (latest.Winner || "") + " won",
      scores: latest.Stage
    } : {
      teamA: "-",
      teamB: "-",
      result: "No result yet",
      scores: "-"
    },
    stats: {
      teams: rowsToObjects("Teams").length,
      leagueMatches: 15,
      completed: completed.length,
      remaining: Math.max(0, 15 - completed.length)
    }
  };
}

function buildLive() {
  return buildHome().live;
}

function buildStats() {
  const mvp = rowsToObjects("MVP");
  return {
    mostRuns: mvp.slice().sort(function (a, b) { return Number(b.Runs) - Number(a.Runs); }).slice(0, 5)
      .map(function (p) { return { player: p.PlayerID, team: "", value: String(p.Runs) }; }),
    mostWickets: mvp.slice().sort(function (a, b) { return Number(b.Wickets) - Number(a.Wickets); }).slice(0, 5)
      .map(function (p) { return { player: p.PlayerID, team: "", value: String(p.Wickets) }; }),
    highestScore: [],
    bestBowling: [],
    mvp: mvp.slice().sort(function (a, b) { return Number(b.MVPPoints) - Number(a.MVPPoints); }).slice(0, 5)
      .map(function (p) { return { player: p.PlayerID, team: "", value: String(p.MVPPoints) }; })
  };
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents || "{}");
  if (payload.action === "ball") {
    const sh = sheet("BallByBall");
    sh.appendRow([
      payload.MatchID,
      payload.Innings,
      payload.Over,
      payload.Ball,
      payload.Batsman,
      payload.NonStriker,
      payload.Bowler,
      payload.Runs,
      payload.ExtraType || "-",
      payload.ExtraRuns || 0,
      payload.Wicket || "No",
      payload.DismissalType || "-",
      payload.PlayerOut || "-",
      new Date()
    ]);
    return json({ ok: true });
  }
  return json({ error: "Unknown action" });
}
