/**
 * DKPL 2026 backend.
 *
 * SETUP (must all be true or the site cannot sync):
 * 1. Open spreadsheet DKPL-2026 → Extensions → Apps Script (bound project, not script.google.com alone).
 * 2. Paste this entire file into Code.gs → Save.
 * 3. In the toolbar dropdown (NOT "json"), choose initDKPL → Run ▶ → allow access.
 *    DKPL-2026 must show tabs Teams, Players, Matches, BallByBall (not only Sheet1).
 * 4. Deploy → New deployment → Type: Web app (NOT Library) → Execute as Me → Anyone → Deploy.
 * 5. Copy the URL ending in /exec into js/config.js (apiBase). Ignore library URLs (/library/d/...).
 * 6. Test: open YOUR_URL?action=ping — must show JSON, not "doGet not found".
 *
 * Sheets used: Teams, Players, Matches, BallByBall.
 * BallByBall is written for analysis; the app reads Matches.
 */

/**
 * If the project title is "Untitled project" and initDKPL does nothing, paste the
 * spreadsheet ID from the DKPL-2026 URL: .../spreadsheets/d/PASTE_THIS_PART/edit
 */
var DKPL_SPREADSHEET_ID = "";

var SHEETS = {
  teams: { name: "Teams", headers: ["TeamID", "TeamName", "Short", "Captain", "Colour", "LogoURL"] },
  players: { name: "Players", headers: ["PlayerID", "TeamID", "PlayerName", "Role", "PhotoURL"] },
  matches: {
    name: "Matches",
    headers: [
      "MatchID", "Stage", "TeamA", "TeamB", "Overs", "Venue", "Date",
      "TossWinner", "Decision", "Status", "Winner", "Result", "PlayerOfMatch", "InningsJSON"
    ]
  },
  ballbyball: {
    name: "BallByBall",
    headers: [
      "MatchID", "Innings", "Over", "Ball", "Batsman", "NonStriker", "Bowler",
      "Runs", "ExtraType", "ExtraRuns", "Wicket", "DismissalType", "PlayerOut", "Timestamp"
    ]
  }
};

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheet() {
  if (DKPL_SPREADSHEET_ID) {
    return SpreadsheetApp.openById(DKPL_SPREADSHEET_ID);
  }
  var ss = SpreadsheetApp.getActive();
  if (!ss) {
    throw new Error(
      "No spreadsheet linked. Open DKPL-2026 → Extensions → Apps Script, " +
        "or set DKPL_SPREADSHEET_ID at the top of Code.gs."
    );
  }
  return ss;
}

function sheetFor(key) {
  var spec = SHEETS[key];
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(spec.name);
  if (!sheet) {
    sheet = ss.insertSheet(spec.name);
    sheet.appendRow(spec.headers);
  }
  return sheet;
}

function readRows(key) {
  var sheet = sheetFor(key);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values.shift();
  return values
    .filter(function (row) {
      return String(row[0]).trim() !== "";
    })
    .map(function (row) {
      var obj = {};
      headers.forEach(function (h, i) {
        obj[h] = row[i];
      });
      return obj;
    });
}

function writeRows(key, rows) {
  var spec = SHEETS[key];
  var sheet = sheetFor(key);
  sheet.clear();
  sheet.appendRow(spec.headers);
  if (rows.length) {
    sheet.getRange(2, 1, 1 + rows.length, spec.headers.length).setValues(rows);
  }
}

/* ------------------------------------------------------------- mapping */

function teamToRow(t) {
  return [t.id, t.name || "", t.short || "", t.captain || "", t.colour || "", t.logo || ""];
}

function rowToTeam(r) {
  return { id: r.TeamID, name: r.TeamName, short: r.Short, captain: r.Captain, colour: r.Colour, logo: r.LogoURL };
}

function playerToRow(p) {
  return [p.id, p.teamId || "", p.name || "", p.role || "", p.photo || ""];
}

function rowToPlayer(r) {
  return { id: r.PlayerID, teamId: r.TeamID, name: r.PlayerName, role: r.Role, photo: r.PhotoURL };
}

function matchToRow(m) {
  var toss = m.toss || {};
  var result = m.result || {};
  return [
    m.id,
    m.stage || "",
    m.teamA || "",
    m.teamB || "",
    m.overs || "",
    m.venue || "",
    m.date || "",
    toss.winnerId || "",
    toss.decision || "",
    m.status || "",
    result.winnerId || "",
    result.text || "",
    m.playerOfMatch || "",
    JSON.stringify(m.innings || [])
  ];
}

function rowToMatch(r) {
  var innings = [];
  try {
    innings = r.InningsJSON ? JSON.parse(r.InningsJSON) : [];
  } catch (err) {
    innings = [];
  }
  return {
    id: r.MatchID,
    stage: r.Stage,
    teamA: r.TeamA,
    teamB: r.TeamB,
    overs: Number(r.Overs) || 0,
    venue: r.Venue,
    date: r.Date,
    toss: { winnerId: r.TossWinner, decision: r.Decision },
    status: r.Status,
    result: r.Result ? { winnerId: r.Winner, text: r.Result } : null,
    playerOfMatch: r.PlayerOfMatch,
    innings: innings
  };
}

/** Flattens every stored delivery into the BallByBall sheet. */
function rebuildBallByBall(matches) {
  var rows = [];
  matches.forEach(function (m) {
    (m.innings || []).forEach(function (inn, inningsIndex) {
      var legal = 0;
      var striker = inn.openers ? inn.openers.strikerId : "";
      var nonStriker = inn.openers ? inn.openers.nonStrikerId : "";

      (inn.deliveries || []).forEach(function (d) {
        var overIndex = Math.floor(legal / 6);
        var bowler = (inn.overBowlers || [])[overIndex] || "";
        var isLegal = d.extra !== "WD" && d.extra !== "NB";
        var extraRuns = isLegal ? 0 : 1;

        rows.push([
          m.id,
          inningsIndex + 1,
          overIndex,
          (legal % 6) + 1,
          striker,
          nonStriker,
          bowler,
          d.runs || 0,
          d.extra || "-",
          extraRuns,
          d.wicket ? "Yes" : "No",
          d.wicket ? d.wicket.type : "-",
          d.wicket ? d.wicket.outBatsmanId : "-",
          new Date()
        ]);

        if (isLegal) legal += 1;
        if ((d.runs || 0) % 2 === 1) {
          var swap = striker;
          striker = nonStriker;
          nonStriker = swap;
        }
        if (d.wicket) {
          if (striker === d.wicket.outBatsmanId) striker = d.wicket.newBatsmanId || "";
          else if (nonStriker === d.wicket.outBatsmanId) nonStriker = d.wicket.newBatsmanId || "";
        }
        if (isLegal && legal % 6 === 0) {
          var end = striker;
          striker = nonStriker;
          nonStriker = end;
        }
      });
    });
  });
  writeRows("ballbyball", rows);
}

/**
 * Run once from the editor: select initDKPL in the dropdown (not json) → Run ▶.
 */
function initDKPL() {
  var ss = getSpreadsheet();
  sheetFor("teams");
  sheetFor("players");
  sheetFor("matches");
  sheetFor("ballbyball");
  var msg = "Created DKPL tabs in spreadsheet: " + ss.getName();
  Logger.log(msg);
  try {
    SpreadsheetApp.getUi().alert(msg);
  } catch (err) {
    // Web app context has no UI; editor run shows the alert.
  }
}

/* ------------------------------------------------------------ handlers */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "all";

  if (action === "ping") {
    return json({ ok: true, service: "DKPL 2026", sheet: getSpreadsheet().getName() });
  }

  if (action === "all") {
    return json({
      teams: readRows("teams").map(rowToTeam),
      players: readRows("players").map(rowToPlayer),
      matches: readRows("matches").map(rowToMatch)
    });
  }
  if (action === "teams") return json(readRows("teams").map(rowToTeam));
  if (action === "players") return json(readRows("players").map(rowToPlayer));
  if (action === "matches") return json(readRows("matches").map(rowToMatch));

  return json({ error: "Unknown action" });
}

function doPost(e) {
  var raw = (e.postData && e.postData.contents) || e.parameter.payload || "{}";
  var payload = JSON.parse(raw);
  if (payload.action !== "save") return json({ error: "Unknown action" });

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (payload.entity === "teams") writeRows("teams", (payload.rows || []).map(teamToRow));
    else if (payload.entity === "players") writeRows("players", (payload.rows || []).map(playerToRow));
    else if (payload.entity === "matches") {
      writeRows("matches", (payload.rows || []).map(matchToRow));
      rebuildBallByBall(payload.rows || []);
    } else {
      return json({ error: "Unknown entity" });
    }
    return json({ ok: true });
  } finally {
    lock.releaseLock();
  }
}
