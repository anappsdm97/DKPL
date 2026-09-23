/** Ball-by-ball scoring console. */
(function () {
  const DKPL = window.DKPL;
  const cfg = window.DKPL_CONFIG;
  const S = DKPL.store;
  const E = DKPL.engine;
  const U = DKPL.ui;

  const CATCH_LIKE = ["Caught", "Run Out", "Stumped"];
  let matchId = new URLSearchParams(location.search).get("match") || "";
  let pendingExtra = null;

  function app() {
    return document.getElementById("app");
  }

  function match() {
    return matchId ? S.matchById(matchId) : null;
  }

  function currentInnings(m) {
    return m.innings[m.innings.length - 1];
  }

  function currentState(m) {
    return S.inningsState(m, m.innings.length - 1);
  }

  function setMatch(id) {
    matchId = id;
    history.replaceState(null, "", "scorer.html?match=" + encodeURIComponent(id));
  }

  function squadOptions(teamId, exclude, labelRole) {
    return S.squad(teamId)
      .filter(function (p) {
        return (exclude || []).indexOf(p.id) < 0;
      })
      .map(function (p) {
        return { value: p.id, label: p.name, sub: labelRole ? p.role : "" };
      });
  }

  /* ---------------------------------------------------------------- views */

  function currentMaxWickets(m) {
    const inn = currentInnings(m);
    if (inn && Number(inn.maxWickets) > 0) return Number(inn.maxWickets);
    return S.maxWickets(inn ? inn.battingTeamId : m.teamA);
  }

  function render() {
    const m = match();
    if (!m) return renderPicker();
    if (!m.innings || !m.innings.length || m.status === "Upcoming") return renderSetup(m);
    if (m.status === "Completed") return renderResult(m);
    const inn = currentInnings(m);
    if (inn && !inn.openers.strikerId) {
      openInnings();
      return;
    }
    return renderScoring(m);
  }

  function renderPicker() {
    const matches = S.matches().filter(function (m) {
      return m.status !== "Completed";
    });

    if (S.teams().length < 2) {
      app().innerHTML = U.empty(
        "Add at least two teams and their players before scoring a match.",
        "admin.html",
        "Open admin"
      );
      return;
    }

    app().innerHTML =
      '<section class="card" id="pickerSection">' +
      "<h2>Pick a match to score</h2>" +
      (matches.length
        ? '<div class="list">' +
          matches
            .map(function (m) {
              return (
                '<button class="list-row" type="button" data-match="' + U.esc(m.id) + '">' +
                "<span><strong>" + U.esc(S.teamName(m.teamA)) + " vs " + U.esc(S.teamName(m.teamB)) + "</strong>" +
                '<small>' + U.esc(m.stage) + " · " + U.esc(m.overs) + " overs · " + U.esc(m.venue || "") + "</small></span>" +
                '<span class="badge ' + (m.status === "Live" ? "live" : "up") + '">' + U.esc(m.status) + "</span>" +
                "</button>"
              );
            })
            .join("") +
          "</div>"
        : '<p class="muted">No scheduled matches yet.</p>') +
      '<button class="btn btn-primary" type="button" id="newMatch">Start a new match</button>' +
      "</section>";

    document.getElementById("pickerSection").addEventListener("click", function (e) {
      const row = e.target.closest("[data-match]");
      if (row) {
        setMatch(row.dataset.match);
        render();
        return;
      }
      if (e.target.id === "newMatch") {
        const created = S.saveMatch({
          stage: "League",
          teamA: "",
          teamB: "",
          overs: cfg.oversOptions[cfg.oversOptions.length - 1],
          venue: cfg.venueDefault,
          date: "",
          status: "Upcoming",
          innings: [],
          result: null
        });
        setMatch(created.id);
        render();
      }
    });
  }

  function renderSetup(m) {
    const teams = S.teams();
    function teamSelect(id, selected) {
      return (
        '<select id="' + id + '" required><option value="">Select team</option>' +
        teams
          .map(function (t) {
            return '<option value="' + U.esc(t.id) + '"' + (t.id === selected ? " selected" : "") + ">" + U.esc(t.name) + "</option>";
          })
          .join("") +
        "</select>"
      );
    }

    app().innerHTML =
      '<form class="card setup" id="setupForm">' +
      "<h2>Match setup</h2>" +
      '<p class="muted">Teams, overs and toss are locked in before the first ball.</p>' +
      '<div class="field-grid">' +
      '<div class="field"><label for="teamA">Team A</label>' + teamSelect("teamA", m.teamA) + "</div>" +
      '<div class="field"><label for="teamB">Team B</label>' + teamSelect("teamB", m.teamB) + "</div>" +
      '<div class="field"><label for="stage">Stage</label><select id="stage">' +
      ["League"]
        .concat(
          cfg.playoffs.stages
        )
        .map(function (s) {
          return '<option value="' + U.esc(s) + '"' + (s === m.stage ? " selected" : "") + ">" + U.esc(s) + "</option>";
        })
        .join("") +
      "</select></div>" +
      '<div class="field"><label for="venue">Venue</label><input id="venue" value="' + U.esc(m.venue || cfg.venueDefault) + '"></div>' +
      '<div class="field"><label for="date">Date / time</label><input id="date" value="' + U.esc(m.date || "") + '" placeholder="Sun 4:00 PM"></div>' +
      '<div class="field"><label>Overs per innings</label><div class="radio-row">' +
      cfg.oversOptions
        .map(function (o) {
          return (
            '<label class="radio"><input type="radio" name="overs" value="' + o + '"' +
            (Number(m.overs) === o ? " checked" : "") + "><span>" + o + "</span></label>"
          );
        })
        .join("") +
      "</div></div>" +
      '<div class="field"><label for="tossWinner">Toss won by</label><select id="tossWinner" required>' +
      '<option value="">Select</option><option value="A">Team A</option><option value="B">Team B</option></select></div>' +
      '<div class="field"><label>Decision</label><div class="radio-row">' +
      '<label class="radio"><input type="radio" name="decision" value="bat" checked><span>Bat</span></label>' +
      '<label class="radio"><input type="radio" name="decision" value="field"><span>Field</span></label>' +
      "</div></div>" +
      "</div>" +
      '<p class="notice" id="setupError" hidden></p>' +
      '<div class="row-actions"><button class="btn btn-primary" type="submit">Start match</button>' +
      '<button class="btn btn-ghost" type="button" id="backToList">Back</button></div>' +
      "</form>";

    document.getElementById("backToList").addEventListener("click", function () {
      matchId = "";
      history.replaceState(null, "", "scorer.html");
      render();
    });

    document.getElementById("setupForm").addEventListener("submit", function (e) {
      e.preventDefault();
      const teamA = document.getElementById("teamA").value;
      const teamB = document.getElementById("teamB").value;
      const tossSide = document.getElementById("tossWinner").value;
      const error = document.getElementById("setupError");

      if (!teamA || !teamB || teamA === teamB) {
        error.hidden = false;
        error.textContent = "Pick two different teams.";
        return;
      }
      if (S.squad(teamA).length < 2 || S.squad(teamB).length < 2) {
        error.hidden = false;
        error.textContent = "Both teams need at least two players. Add them in Admin first.";
        return;
      }
      if (!tossSide) {
        error.hidden = false;
        error.textContent = "Select who won the toss.";
        return;
      }

      const decision = document.querySelector('input[name="decision"]:checked').value;
      const tossWinner = tossSide === "A" ? teamA : teamB;
      const other = tossWinner === teamA ? teamB : teamA;
      const battingFirst = decision === "bat" ? tossWinner : other;
      const bowlingFirst = battingFirst === teamA ? teamB : teamA;

      const saved = S.saveMatch({
        id: m.id,
        stage: document.getElementById("stage").value,
        teamA: teamA,
        teamB: teamB,
        overs: Number(document.querySelector('input[name="overs"]:checked').value),
        venue: document.getElementById("venue").value,
        date: document.getElementById("date").value,
        toss: { winnerId: tossWinner, decision: decision },
        status: "Live",
        innings: [E.newInnings(battingFirst, bowlingFirst, null)],
        result: null
      });

      setMatch(saved.id);
      openInnings();
    });
  }

  async function openInnings() {
    const m = match();
    const inn = currentInnings(m);
    const batting = inn.battingTeamId;

    const strikerId = await U.choose("Who is on strike?", squadOptions(batting, [], true), {
      note: (inn.superOver ? "Super Over · " : "") + S.teamName(batting) + (inn.superOver ? " (1 over, 2 wickets)" : " opening pair"),
      cancel: false
    });
    const nonStrikerId = await U.choose("Who is at the non-striker end?", squadOptions(batting, [strikerId], true), {
      cancel: false
    });
    const bowlerId = await U.choose("Opening bowler", squadOptions(inn.bowlingTeamId, [], true), {
      note: S.teamName(inn.bowlingTeamId),
      cancel: false
    });

    inn.openers = { strikerId: strikerId, nonStrikerId: nonStrikerId };
    inn.overBowlers = [bowlerId];
    S.saveMatch(m);
    render();
  }

  function renderScoring(m) {
    const state = currentState(m);
    const inningsNo = m.innings.length;

    app().innerHTML =
      '<article class="card live-card scorer-board">' +
      DKPL.board.miniHtml(m) +
      DKPL.board.currentPlayers(m) +
      "</article>" +
      (state.complete ? breakPanel(m, state) : keypad()) +
      '<div class="row-actions scorer-links">' +
      '<a class="btn btn-ghost" href="live.html">Public view</a>' +
      (U.isAdminSession() ? '<a class="btn btn-ghost" href="admin.html">Admin</a>' : "") +
      '<button class="btn btn-ghost" type="button" id="endInnings">End ' +
      (currentInnings(m).superOver ? "Super Over innings" : "innings " + inningsNo) +
      "</button>" +
      "</div>";

    bindScoring();
  }

  function keypad() {
    let hint;
    if (pendingExtra === "WD") {
      hint =
        "Wide selected — tap WD again for wide only (1 run). Or tap 1–4 for bye runs on the wide (total = 1 wide + byes). " +
        "Run out / stumped on this wide: tap OUT (do not tap bye runs first unless it is a normal wide with byes only).";
    } else if (pendingExtra === "NB") {
      hint =
        "No ball selected — tap NB again for no ball only (1 run). Or tap 0–6 for runs off the bat (total = 1 no-ball + those runs). " +
        "Run out on this no-ball: tap OUT, then enter runs off the bat on the same no-ball.";
    } else {
      hint =
        "Normal ball: tap runs. +5 is a time penalty to the batting score (fielding delay). Run out with runs: tap OUT first. UNDO fixes mistakes.";
    }

    const keys = [0, 1, 2, 3, 4, 5, 6]
      .map(function (n) {
        return '<button class="key" type="button" data-key="' + n + '">' + n + "</button>";
      })
      .join("");

    return (
      '<div class="card keypad-card">' +
      '<div class="score-keys" id="scoreKeys">' +
      keys +
      '<button class="key extra' + (pendingExtra === "WD" ? " active" : "") + '" type="button" data-key="WD">WD</button>' +
      '<button class="key extra' + (pendingExtra === "NB" ? " active" : "") + '" type="button" data-key="NB">NB</button>' +
      '<button class="key extra" type="button" data-key="PEN">+5</button>' +
      '<button class="key out" type="button" data-key="OUT">OUT</button>' +
      '<button class="key undo" type="button" data-key="UNDO">UNDO</button>' +
      "</div>" +
      '<p class="notice">' + U.esc(hint) + "</p>" +
      "</div>"
    );
  }

  function breakPanel(m, state) {
    const inn = currentInnings(m);
    const soCount = (m.innings || []).filter(function (i) {
      return i.superOver;
    }).length;

    if (inn.superOver) {
      if (soCount % 2 === 1) {
        return (
          '<div class="card break-panel">' +
          "<h2>Super Over — innings break</h2>" +
          "<p>" + U.esc(S.teamName(inn.battingTeamId)) + " scored " + state.runs + "/" + state.wickets +
          " in " + state.oversText + " overs.</p>" +
          "<p class=\"situation\">Target " + (state.runs + 1) + " from 1 over (2 wickets)</p>" +
          '<button class="btn btn-primary" type="button" id="startSuperOver">Start chasing Super Over</button>' +
          "</div>"
        );
      }
      const soResult = E.resultText(m, S.teamName, m.overs, currentMaxWickets(m));
      if (!soResult.winnerId) {
        return (
          '<div class="card break-panel">' +
          "<h2>Super Over tied</h2>" +
          "<p>Scores are still level. Play another Super Over to decide the winner.</p>" +
          '<button class="btn btn-primary" type="button" id="startSuperOver">Start another Super Over</button>' +
          "</div>"
        );
      }
      return (
        '<div class="card break-panel">' +
        "<h2>Super Over complete</h2>" +
        "<p class=\"situation\">" + U.esc(soResult.text) + "</p>" +
        '<button class="btn btn-primary" type="button" id="publish">Publish result</button>' +
        "</div>"
      );
    }

    const regular = (m.innings || []).filter(function (i) {
      return !i.superOver;
    });
    if (regular.length === 1) {
      return (
        '<div class="card break-panel">' +
        "<h2>Innings break</h2>" +
        "<p>" + U.esc(S.teamName(m.innings[0].battingTeamId)) + " scored " + state.runs + "/" + state.wickets +
        " in " + state.oversText + " overs.</p>" +
        "<p class=\"situation\">Target " + (state.runs + 1) + " from " + m.overs + " overs</p>" +
        '<button class="btn btn-primary" type="button" id="startSecond">Start second innings</button>' +
        "</div>"
      );
    }

    const regularResult = E.resultText(
      { innings: regular, overs: m.overs },
      S.teamName,
      m.overs,
      S.maxWickets(regular[1].battingTeamId)
    );
    if (!regularResult.winnerId) {
      return (
        '<div class="card break-panel">' +
        "<h2>Match tied</h2>" +
        "<p>Scores are level. Tournament rules require a Super Over (1 over each, 2 wickets) to decide the winner.</p>" +
        '<button class="btn btn-primary" type="button" id="startSuperOver">Start Super Over</button>' +
        "</div>"
      );
    }

    return (
      '<div class="card break-panel">' +
      "<h2>Innings complete</h2>" +
      "<p class=\"situation\">" + U.esc(regularResult.text) + "</p>" +
      '<button class="btn btn-primary" type="button" id="publish">Publish result</button>' +
      "</div>"
    );
  }

  function renderResult(m) {
    const mvp = E.matchMvp(m, m.overs, 10)[0];
    app().innerHTML =
      '<article class="card result-card">' +
      '<span class="badge done">Result</span>' +
      "<h2>" + U.esc(m.result ? m.result.text : "Match completed") + "</h2>" +
      (mvp ? '<p class="situation">Man of the match: ' + U.esc(S.playerName(mvp.playerId)) + " · " + mvp.points + " MVP points</p>" : "") +
      "</article>" +
      DKPL.board.fullHtml(m) +
      '<div class="row-actions"><a class="btn btn-primary" href="scorer.html">Score another match</a>' +
      '<a class="btn btn-ghost" href="points.html">Points table</a></div>';
  }

  /* ------------------------------------------------------------- actions */

  function bindScoring() {
    const keys = document.getElementById("scoreKeys");
    if (keys) {
      keys.addEventListener("click", function (e) {
        const btn = e.target.closest("button[data-key]");
        if (btn) handleKey(btn.dataset.key);
      });
    }

    const endInnings = document.getElementById("endInnings");
    if (endInnings) {
      endInnings.addEventListener("click", async function () {
        const ok = await U.confirm("End this innings now?", "Use this only if the innings stops early.");
        if (!ok) return;
        const m = match();
        currentInnings(m).closed = true;
        S.saveMatch(m);
        render();
      });
    }

    const second = document.getElementById("startSecond");
    if (second) second.addEventListener("click", startSecondInnings);

    const superOver = document.getElementById("startSuperOver");
    if (superOver) superOver.addEventListener("click", startSuperOver);

    const publish = document.getElementById("publish");
    if (publish) publish.addEventListener("click", publishResult);
  }

  function promptRunOutRuns(extra) {
    if (extra === "WD") {
      return U.choose("Bye runs on this wide? (1 wide is counted automatically)", [
        { value: "0", label: "Wide only", sub: "Team total +1" },
        { value: "1", label: "Wide + 1 bye", sub: "Team total +2" },
        { value: "2", label: "Wide + 2 byes", sub: "Team total +3" },
        { value: "3", label: "Wide + 3 byes", sub: "Team total +4" },
        { value: "4", label: "Wide + 4 byes", sub: "Team total +5" }
      ]);
    }
    if (extra === "NB") {
      return U.choose("Runs off the bat on this no-ball? (1 no-ball run is counted automatically)", [
        { value: "0", label: "No ball only", sub: "Team total +1, ball re-bowled" },
        { value: "1", label: "1 run off the bat", sub: "Team total +2" },
        { value: "2", label: "2 runs", sub: "Team total +3" },
        { value: "3", label: "3 runs", sub: "" },
        { value: "4", label: "4 runs", sub: "" },
        { value: "5", label: "5 runs", sub: "" },
        { value: "6", label: "6 runs", sub: "" }
      ]);
    }
    return U.choose("Runs completed on this ball before the run out?", [
      { value: "0", label: "0 runs", sub: "Direct hit, no run completed" },
      { value: "1", label: "1 run", sub: "Single then run out" },
      { value: "2", label: "2 runs", sub: "Two runs then run out" },
      { value: "3", label: "3 runs", sub: "" },
      { value: "4", label: "4 runs", sub: "" },
      { value: "5", label: "5 runs", sub: "Overthrows etc." },
      { value: "6", label: "6 runs", sub: "" }
    ]);
  }

  async function handleKey(key) {
    const m = match();
    const state = currentState(m);

    if (key === "UNDO") return undo(m);

    if (state.needsBowler) {
      await promptBowler(m);
      return;
    }

    if (key === "WD" || key === "NB") {
      if (pendingExtra === key) {
        pendingExtra = null;
        return applyDelivery({ runs: 0, extra: key, wicket: null });
      }
      pendingExtra = key;
      return render();
    }

    if (key === "PEN") {
      pendingExtra = null;
      return applyDelivery({ runs: 5, extra: "PEN", wicket: null });
    }

    if (key === "OUT") return handleWicket(m, state);

    const runs = Number(key);
    const extra = pendingExtra;
    pendingExtra = null;
    applyDelivery({ runs: runs, extra: extra, wicket: null });
  }

  async function handleWicket(m, state) {
    const inn = currentInnings(m);
    const extra = pendingExtra;
    const options = E.dismissals
      .filter(function (d) {
        // Only a run out or stumping is possible off a wide.
        return extra !== "WD" || d === "Run Out" || d === "Stumped";
      })
      .filter(function (d) {
        return extra !== "NB" || d === "Run Out";
      })
      .map(function (d) {
        return { value: d, label: d };
      });

    const type = await U.choose("How was the batter out?", options);
    if (!type) return;

    let outBatsmanId = state.strikerId;
    let runsOnBall = 0;
    if (type === "Run Out") {
      const runsPick = await promptRunOutRuns(extra);
      if (runsPick === null || runsPick === undefined) return;
      runsOnBall = Number(runsPick) || 0;

      outBatsmanId = await U.choose("Which batter is out?", [
        { value: state.strikerId, label: S.playerName(state.strikerId), sub: "Striker" },
        { value: state.nonStrikerId, label: S.playerName(state.nonStrikerId), sub: "Non-striker" }
      ]);
      if (!outBatsmanId) return;
    }

    let fielderId = "";
    if (CATCH_LIKE.indexOf(type) >= 0) {
      fielderId = await U.choose(
        type === "Caught" ? "Who took the catch?" : "Fielder involved",
        squadOptions(inn.bowlingTeamId, [], false).concat([{ value: "", label: "Not recorded" }])
      );
      if (fielderId === null) return;
    }

    const maxWickets = currentMaxWickets(m);
    let newBatsmanId = "";
    if (state.wickets + 1 < maxWickets) {
      const used = Object.keys(state.bat).concat([state.strikerId, state.nonStrikerId]);
      const available = squadOptions(inn.battingTeamId, used, true);
      if (available.length) {
        newBatsmanId = await U.choose("Next batter in", available, { cancel: false });
      }
    }

    pendingExtra = null;
    applyDelivery({
      runs: type === "Run Out" ? runsOnBall : 0,
      extra: extra,
      wicket: { type: type, outBatsmanId: outBatsmanId, fielderId: fielderId || "", newBatsmanId: newBatsmanId }
    });
  }

  async function applyDelivery(delivery) {
    const m = match();
    currentInnings(m).deliveries.push(delivery);
    S.saveMatch(m);

    const state = currentState(m);
    if (!state.complete && state.needsBowler) {
      render();
      await promptBowler(match());
      return;
    }
    render();
  }

  async function promptBowler(m) {
    const inn = currentInnings(m);
    const state = currentState(m);
    const options = squadOptions(inn.bowlingTeamId, [state.previousBowlerId], true);
    const bowlerId = await U.choose("Bowler for over " + (Math.floor(state.balls / 6) + 1), options, {
      note: "The same bowler cannot bowl two overs in a row.",
      cancel: false
    });
    inn.overBowlers.push(bowlerId);
    S.saveMatch(m);
    render();
  }

  function undo(m) {
    const inn = currentInnings(m);
    if (!inn.deliveries.length) {
      U.toast("Nothing to undo");
      return;
    }
    inn.deliveries.pop();
    inn.closed = false;
    const state = currentState(m);
    const needed = Math.floor(state.balls / 6) + 1;
    while (inn.overBowlers.length > needed) inn.overBowlers.pop();
    S.saveMatch(m);
    pendingExtra = null;
    render();
  }

  function startSecondInnings() {
    const m = match();
    const first = S.inningsState(m, 0);
    m.innings.push(E.newInnings(m.innings[0].bowlingTeamId, m.innings[0].battingTeamId, first.runs + 1));
    S.saveMatch(m);
    openInnings();
  }

  async function startSuperOver() {
    const m = match();
    const so = (m.innings || []).filter(function (i) {
      return i.superOver;
    });
    const last = so[so.length - 1];
    const lastState = last ? S.inningsState(m, m.innings.indexOf(last)) : null;
    const startNewPair = !last || (lastState && lastState.complete && so.length % 2 === 0);

    let battingId;
    let bowlingId;
    let target = null;

    if (startNewPair) {
      const pick = await U.choose("Who bats first in the Super Over?", [
        { value: m.teamA, label: S.teamName(m.teamA) },
        { value: m.teamB, label: S.teamName(m.teamB) }
      ]);
      if (!pick) return;
      battingId = pick;
      bowlingId = pick === m.teamA ? m.teamB : m.teamA;
    } else {
      battingId = last.bowlingTeamId;
      bowlingId = last.battingTeamId;
      target = (lastState ? lastState.runs : 0) + 1;
    }

    m.innings.push(
      E.newInnings(battingId, bowlingId, target, { overs: 1, maxWickets: 2, superOver: true })
    );
    m.status = "Live";
    S.saveMatch(m);
    openInnings();
  }

  function publishResult() {
    const m = match();
    const chasingTeam = (m.innings[m.innings.length - 1] || {}).battingTeamId || m.teamB;
    const result = E.resultText(m, S.teamName, m.overs, S.maxWickets(chasingTeam));
    if (!result.winnerId && /tied/i.test(result.text || "")) {
      U.toast("Scores are level — start a Super Over");
      return;
    }
    const mvp = E.matchMvp(m, m.overs, 10)[0];

    m.result = result;
    m.playerOfMatch = mvp ? mvp.playerId : "";
    m.status = "Completed";
    S.saveMatch(m);
    const playoffs = S.syncPlayoffFixtures();
    U.toast(
      playoffs.ok && playoffs.created.length
        ? "Result published · playoff fixtures updated"
        : "Result published"
    );
    render();
  }

  function mountScorerChrome() {
    const title = document.querySelector(".page-title");
    if (!title || document.getElementById("scorerLock")) return;
    const actions = document.createElement("div");
    actions.className = "page-title-actions";
    actions.innerHTML =
      '<button class="btn btn-ghost" type="button" id="scorerLock">Lock scorer</button>';
    title.appendChild(actions);
    document.getElementById("scorerLock").addEventListener("click", U.signOutScorer);
  }

  document.addEventListener("DOMContentLoaded", function () {
    U.mount("");
    U.requireScorer(app(), function () {
      mountScorerChrome();
      S.ready().then(render).catch(function () {
        render();
      });
    });
  });
})();
