/**
 * DKPL scoring engine.
 *
 * An innings is stored as an immutable list of deliveries. Every scoreboard
 * number is derived by replaying that list, so undo is just "drop the last
 * delivery and replay".
 */
(function () {
  const DKPL = (window.DKPL = window.DKPL || {});
  const cfg = window.DKPL_CONFIG;

  const DISMISSALS = ["Bowled", "Caught", "LBW", "Run Out", "Stumped", "Hit Wicket"];
  const BOWLER_CREDIT = ["Bowled", "Caught", "LBW", "Stumped", "Hit Wicket"];

  function emptyBat() {
    return { runs: 0, balls: 0, fours: 0, sixes: 0, out: false, how: "", bowlerId: "", fielderId: "" };
  }

  function emptyBowl() {
    return { balls: 0, runs: 0, wickets: 0, maidens: 0 };
  }

  function emptyField() {
    return { catches: 0, runOuts: 0, stumpings: 0 };
  }

  function oversText(balls) {
    return Math.floor(balls / 6) + "." + (balls % 6);
  }

  function oversFloat(balls) {
    return Math.floor(balls / 6) + (balls % 6) / 6;
  }

  function newInnings(battingTeamId, bowlingTeamId, target) {
    return {
      battingTeamId: battingTeamId,
      bowlingTeamId: bowlingTeamId,
      target: target || null,
      openers: { strikerId: "", nonStrikerId: "" },
      overBowlers: [],
      deliveries: []
    };
  }

  function label(d) {
    const base = d.extra === "WD" ? "wd" : d.extra === "NB" ? "nb" : "";
    const runs = d.runs || 0;
    let text;
    if (!base) text = String(runs);
    else text = base + (runs ? "+" + runs : "");
    if (d.wicket) text = text === "0" ? "W" : text + "+W";
    return text;
  }

  /**
   * Replays every delivery and returns the full scoreboard state.
   */
  function computeInnings(inn, oversLimit, maxWickets) {
    const bat = {};
    const bowl = {};
    const field = {};
    const overs = [];

    function getBat(id) {
      if (!bat[id]) bat[id] = emptyBat();
      return bat[id];
    }
    function getBowl(id) {
      if (!bowl[id]) bowl[id] = emptyBowl();
      return bowl[id];
    }
    function getField(id) {
      if (!field[id]) field[id] = emptyField();
      return field[id];
    }

    let runs = 0;
    let wickets = 0;
    let legal = 0;
    let wides = 0;
    let noBalls = 0;
    let overRuns = 0;
    let striker = inn.openers.strikerId;
    let nonStriker = inn.openers.nonStrikerId;

    inn.deliveries.forEach(function (d) {
      const overIndex = Math.floor(legal / 6);
      const bowlerId = inn.overBowlers[overIndex] || inn.overBowlers[inn.overBowlers.length - 1] || "";
      const b = getBowl(bowlerId);
      const s = getBat(striker);

      if (!overs[overIndex]) overs[overIndex] = [];
      overs[overIndex].push(label(d));

      let conceded;
      let batterRuns = 0;
      let isLegal = true;

      if (d.extra === "WD") {
        conceded = 1 + (d.runs || 0);
        wides += conceded;
        isLegal = false;
      } else if (d.extra === "NB") {
        conceded = 1 + (d.runs || 0);
        noBalls += 1;
        batterRuns = d.runs || 0;
        isLegal = false;
      } else {
        conceded = d.runs || 0;
        batterRuns = conceded;
      }

      runs += conceded;
      b.runs += conceded;
      overRuns += conceded;

      // A wide is not faced by the batter; a no-ball is.
      if (d.extra !== "WD") {
        s.balls += 1;
        s.runs += batterRuns;
        if (batterRuns === 4) s.fours += 1;
        if (batterRuns === 6) s.sixes += 1;
      }

      if (isLegal) {
        legal += 1;
        b.balls += 1;
      }

      if ((d.runs || 0) % 2 === 1) {
        const t = striker;
        striker = nonStriker;
        nonStriker = t;
      }

      if (d.wicket) {
        wickets += 1;
        const out = getBat(d.wicket.outBatsmanId);
        out.out = true;
        out.how = d.wicket.type;
        out.fielderId = d.wicket.fielderId || "";
        if (BOWLER_CREDIT.indexOf(d.wicket.type) >= 0) {
          out.bowlerId = bowlerId;
          b.wickets += 1;
        }
        if (d.wicket.fielderId) {
          const f = getField(d.wicket.fielderId);
          if (d.wicket.type === "Caught") f.catches += 1;
          else if (d.wicket.type === "Run Out") f.runOuts += 1;
          else if (d.wicket.type === "Stumped") f.stumpings += 1;
        }
        const newId = d.wicket.newBatsmanId || "";
        if (striker === d.wicket.outBatsmanId) striker = newId;
        else if (nonStriker === d.wicket.outBatsmanId) nonStriker = newId;
      }

      if (isLegal && legal % 6 === 0) {
        if (overRuns === 0) b.maidens += 1;
        overRuns = 0;
        const t = striker;
        striker = nonStriker;
        nonStriker = t;
      }
    });

    const ballsLimit = oversLimit * 6;
    const allOut = wickets >= maxWickets;
    const oversDone = legal >= ballsLimit;
    const chased = inn.target ? runs >= inn.target : false;
    const complete = allOut || oversDone || chased || Boolean(inn.closed);
    const currentOver = Math.floor(legal / 6);

    return {
      runs: runs,
      wickets: wickets,
      balls: legal,
      ballsLimit: ballsLimit,
      oversText: oversText(legal),
      oversFloat: oversFloat(legal),
      extras: { wides: wides, noBalls: noBalls, total: wides + noBalls },
      bat: bat,
      bowl: bowl,
      field: field,
      strikerId: striker,
      nonStrikerId: nonStriker,
      bowlerId: inn.overBowlers[currentOver] || "",
      previousBowlerId: currentOver > 0 ? inn.overBowlers[currentOver - 1] || "" : "",
      thisOver: overs[currentOver] || (legal > 0 && legal % 6 === 0 ? overs[currentOver - 1] || [] : []),
      overs: overs,
      needsBowler: !complete && inn.overBowlers.length <= currentOver,
      complete: complete,
      allOut: allOut,
      chased: chased,
      runRate: legal ? runs / oversFloat(legal) : 0,
      target: inn.target || null,
      runsNeeded: inn.target ? Math.max(0, inn.target - runs) : null,
      ballsLeft: Math.max(0, ballsLimit - legal),
      requiredRate: inn.target && ballsLimit - legal > 0
        ? (inn.target - runs) / ((ballsLimit - legal) / 6)
        : null
    };
  }

  function mvpPoints(batStat, bowlStat, fieldStat) {
    const m = cfg.mvp;
    let points = 0;

    if (batStat) {
      points += batStat.runs * m.run + batStat.fours * m.four + batStat.sixes * m.six;
      if (batStat.runs >= 100) points += m.hundred;
      else if (batStat.runs >= 50) points += m.fifty;
    }

    if (bowlStat) {
      points += bowlStat.wickets * m.wicket + bowlStat.maidens * m.maiden;
      if (bowlStat.balls >= 6) {
        const economy = bowlStat.runs / (bowlStat.balls / 6);
        for (let i = 0; i < m.economy.length; i++) {
          if (economy <= m.economy[i].max) {
            points += m.economy[i].bonus;
            break;
          }
        }
      }
    }

    if (fieldStat) {
      points += fieldStat.catches * m.catch + fieldStat.runOuts * m.runOut + fieldStat.stumpings * m.stumping;
    }

    return Math.round(points);
  }

  /**
   * Per-player MVP points for a single match, highest first.
   */
  function matchMvp(match, oversLimit, maxWickets) {
    const totals = {};

    function bucket(id) {
      if (!totals[id]) totals[id] = { playerId: id, bat: null, bowl: null, field: null, points: 0 };
      return totals[id];
    }

    (match.innings || []).forEach(function (inn) {
      const state = computeInnings(inn, oversLimit, maxWickets);
      Object.keys(state.bat).forEach(function (id) {
        if (id) bucket(id).bat = state.bat[id];
      });
      Object.keys(state.bowl).forEach(function (id) {
        if (id) bucket(id).bowl = state.bowl[id];
      });
      Object.keys(state.field).forEach(function (id) {
        if (id) bucket(id).field = state.field[id];
      });
    });

    return Object.keys(totals)
      .map(function (id) {
        const t = totals[id];
        t.points = mvpPoints(t.bat, t.bowl, t.field);
        return t;
      })
      .sort(function (a, b) {
        return b.points - a.points;
      });
  }

  function resultText(match, teamName, oversLimit, maxWickets) {
    if (!match.innings || match.innings.length < 2) return "";
    const first = computeInnings(match.innings[0], oversLimit, maxWickets);
    const second = computeInnings(match.innings[1], oversLimit, maxWickets);
    const chasingTeam = match.innings[1].battingTeamId;
    const defendingTeam = match.innings[0].battingTeamId;

    if (second.runs > first.runs) {
      return {
        winnerId: chasingTeam,
        text: teamName(chasingTeam) + " won by " + (maxWickets - second.wickets) + " wickets"
      };
    }
    if (second.runs === first.runs) {
      return { winnerId: "", text: "Match tied" };
    }
    return {
      winnerId: defendingTeam,
      text: teamName(defendingTeam) + " won by " + (first.runs - second.runs) + " runs"
    };
  }

  DKPL.engine = {
    dismissals: DISMISSALS,
    newInnings: newInnings,
    computeInnings: computeInnings,
    mvpPoints: mvpPoints,
    matchMvp: matchMvp,
    resultText: resultText,
    oversText: oversText,
    oversFloat: oversFloat
  };
})();
