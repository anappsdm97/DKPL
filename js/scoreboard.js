/** Shared scoreboard rendering used by the home page, live page and scorer. */
(function () {
  const DKPL = (window.DKPL = window.DKPL || {});

  function esc(v) {
    return DKPL.ui.esc(v);
  }

  function store() {
    return DKPL.store;
  }

  function rate(n) {
    return (Math.round(n * 100) / 100).toFixed(2);
  }

  function statusBadge(match) {
    if (match.status === "Live") return '<span class="badge live">Live</span>';
    if (match.status === "Completed") return '<span class="badge done">Result</span>';
    return '<span class="badge up">' + esc(match.stage || "Upcoming") + "</span>";
  }

  function teamLine(teamId, state, overs) {
    const team = store().teamById(teamId);
    const name = team ? team.name : "-";
    const score = state ? state.runs + "/" + state.wickets : "yet to bat";
    const detail = state ? state.oversText + " / " + overs + " ov" : "";
    return (
      '<div class="team-line">' +
      '<div class="team-id">' + DKPL.ui.avatar(name, team && team.logo, team && team.colour) +
      "<span>" + esc(name) + "</span></div>" +
      '<div class="team-score"><strong>' + esc(score) + "</strong><span>" + esc(detail) + "</span></div>" +
      "</div>"
    );
  }

  function situation(match) {
    const index = (match.innings || []).length - 1;
    if (index < 0) return "";
    const state = store().inningsState(match, index);
    if (!state) return "";

    if (match.status === "Completed") {
      return match.result ? match.result.text : "Match completed";
    }
    const inn = match.innings[index];
    if (inn && inn.superOver) {
      if (state.target) {
        if (state.runsNeeded <= 0) return "Super Over target reached";
        return (
          "Super Over · need " + state.runsNeeded + " runs from " + state.ballsLeft + " balls"
        );
      }
      return "Super Over · " + state.runs + "/" + state.wickets + " (" + state.oversText + ")";
    }
    if (index === 1 && state.target) {
      if (state.runsNeeded <= 0) return "Target reached";
      if (state.ballsLeft <= 0) return "Overs completed";
      return (
        "Need " + state.runsNeeded + " runs from " + state.ballsLeft + " balls · RRR " +
        rate(state.requiredRate)
      );
    }
    return "Current run rate " + rate(state.runRate);
  }

  function batterRow(match, innIndex, playerId, isStriker) {
    const state = store().inningsState(match, innIndex);
    const s = state.bat[playerId];
    if (!playerId) return "";
    const runs = s ? s.runs : 0;
    const balls = s ? s.balls : 0;
    const sr = balls ? rate((runs / balls) * 100) : "0.00";
    return (
      "<tr><td>" + esc(store().playerName(playerId)) + (isStriker ? ' <span class="strike">*</span>' : "") +
      "</td><td>" + runs + "</td><td>" + balls + "</td><td>" + (s ? s.fours : 0) +
      "</td><td>" + (s ? s.sixes : 0) + "</td><td>" + sr + "</td></tr>"
    );
  }

  function currentPlayers(match) {
    const index = (match.innings || []).length - 1;
    if (index < 0) return "";
    const state = store().inningsState(match, index);
    if (!state) return "";
    const bowl = state.bowl[state.bowlerId];
    const overs = bowl ? DKPL.engine.oversText(bowl.balls) : "0.0";
    const econ = bowl && bowl.balls ? rate(bowl.runs / (bowl.balls / 6)) : "0.00";

    return (
      '<div class="mini-cards">' +
      '<div class="table-wrap"><table class="mini"><thead><tr><th>Batting</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead><tbody>' +
      batterRow(match, index, state.strikerId, true) +
      batterRow(match, index, state.nonStrikerId, false) +
      "</tbody></table></div>" +
      '<div class="table-wrap"><table class="mini"><thead><tr><th>Bowling</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th></tr></thead><tbody>' +
      "<tr><td>" + esc(store().playerName(state.bowlerId)) + "</td><td>" + overs +
      "</td><td>" + (bowl ? bowl.maidens : 0) + "</td><td>" + (bowl ? bowl.runs : 0) +
      "</td><td>" + (bowl ? bowl.wickets : 0) + "</td><td>" + econ + "</td></tr>" +
      "</tbody></table></div>" +
      "</div>" +
      partnershipLine(state) +
      thisOver(state)
    );
  }

  function ballSpan(b) {
    const cls = b.indexOf("W") >= 0 ? "ball out" : b === "4" ? "ball four" : b === "6" ? "ball six" :
      b.indexOf("wd") === 0 || b.indexOf("nb") === 0 || b.charAt(0) === "P" ? "ball extra" : "ball";
    return '<span class="' + cls + '">' + esc(b) + "</span>";
  }

  function thisOver(state) {
    if (!state.thisOver || !state.thisOver.length) return "";
    return (
      '<div class="timeline"><span class="timeline-label">This over</span>' +
      state.thisOver.map(ballSpan).join("") +
      "</div>"
    );
  }

  function partnershipLine(state) {
    if (!state || !state.partnership || (!state.strikerId && !state.nonStrikerId)) return "";
    return (
      '<p class="muted extras-line">Partnership ' + state.partnership.runs +
      " (" + state.partnership.balls + "b)</p>"
    );
  }

  function tossLine(match) {
    if (!match.toss || !match.toss.winnerId) return "";
    const name = store().teamName(match.toss.winnerId);
    const dec = match.toss.decision === "field" ? "bowl" : "bat";
    return '<p class="muted extras-line">Toss: ' + esc(name) + " chose to " + dec + "</p>";
  }

  function oversList(state, compact) {
    if (!state.overs || !state.overs.length) return "";
    const rows = state.overs;
    const start = compact && rows.length > 3 ? rows.length - 3 : 0;
    let html = "";
    for (let i = start; i < rows.length; i++) {
      if (!rows[i] || !rows[i].length) continue;
      html +=
        '<div class="timeline over-line"><span class="timeline-label">Ov ' + (i + 1) + "</span>" +
        rows[i].map(ballSpan).join("") +
        "</div>";
    }
    return html;
  }

  function fowLine(state) {
    if (!state.fallOfWickets || !state.fallOfWickets.length) return "";
    const bits = state.fallOfWickets.map(function (w) {
      return w.score + "/" + w.wicket + " (" + esc(store().playerName(w.batterId)) + ", " + w.overs + ")";
    });
    return '<p class="muted extras-line">FOW ' + bits.join(" · ") + "</p>";
  }

  function shareText(match) {
    const cfg = window.DKPL_CONFIG;
    const lines = [(cfg.tournamentName || "DKPL") + " · " + (match.stage || "League")];
    (match.innings || []).forEach(function (inn, i) {
      if (i > 1 && !inn.superOver) return;
      const st = store().inningsState(match, i);
      if (!st) return;
      const tag = inn.superOver ? "SO " : "";
      lines.push(tag + store().teamName(inn.battingTeamId) + " " + st.runs + "/" + st.wickets + " (" + st.oversText + ")");
    });
    const sit = situation(match);
    if (sit) lines.push(sit);
    if (match.playerOfMatch) lines.push("Man of the match: " + store().playerName(match.playerOfMatch));
    return lines.join("\n");
  }

  function shareButtons(match) {
    if (!match || !match.id || match.status === "Upcoming") return "";
    return (
      '<div class="share-row">' +
      '<button type="button" class="btn btn-ghost" data-share-score="' + esc(match.id) + '" data-share-via="copy">Copy score</button>' +
      '<button type="button" class="btn btn-ghost" data-share-score="' + esc(match.id) + '" data-share-via="wa">WhatsApp</button>' +
      "</div>"
    );
  }

  function bindShare() {
    if (document.body.dataset.dkplShare === "yes") return;
    document.body.dataset.dkplShare = "yes";
    document.body.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-share-score]");
      if (!btn) return;
      const match = store().matchById(btn.getAttribute("data-share-score"));
      if (!match) return;
      const text = shareText(match);
      if (btn.getAttribute("data-share-via") === "wa") {
        window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          if (DKPL.ui && DKPL.ui.toast) DKPL.ui.toast("Score copied");
        });
      }
    });
  }

  function superOverLine(match) {
    const so = (match.innings || []).filter(function (inn) {
      return inn.superOver;
    });
    if (!so.length) return "";
    const bits = so.map(function (inn) {
      const idx = match.innings.indexOf(inn);
      const st = store().inningsState(match, idx);
      return store().teamName(inn.battingTeamId) + " " + (st ? st.runs + "/" + st.wickets : "—");
    });
    return '<p class="muted extras-line">Super Over · ' + esc(bits.join(" · ")) + "</p>";
  }

  function miniHtml(match) {
    bindShare();
    const innings = match.innings || [];
    const first = innings[0] ? store().inningsState(match, 0) : null;
    const second = innings[1] ? store().inningsState(match, 1) : null;

    return (
      statusBadge(match) +
      '<p class="match-meta">' + esc(match.stage || "League") + " · " + esc(match.venue || "") + "</p>" +
      teamLine(innings[0] ? innings[0].battingTeamId : match.teamA, first, match.overs) +
      teamLine(innings[1] ? innings[1].battingTeamId : match.teamB, second, match.overs) +
      tossLine(match) +
      superOverLine(match) +
      '<div class="situation">' + esc(situation(match)) + "</div>" +
      (match.status === "Completed" && match.playerOfMatch
        ? '<p class="situation">Man of the match: ' + esc(store().playerName(match.playerOfMatch)) + "</p>"
        : "") +
      shareButtons(match)
    );
  }

  function fullCard(match, innIndex) {
    const inn = match.innings[innIndex];
    const state = store().inningsState(match, innIndex);
    const batting = store().teamName(inn.battingTeamId);
    const squad = store().squad(inn.battingTeamId);

    const batRows = squad
      .filter(function (p) {
        return state.bat[p.id];
      })
      .map(function (p) {
        const s = state.bat[p.id];
        const how = s.out
          ? s.how + (s.fielderId ? " (" + store().playerName(s.fielderId) + ")" : "") +
            (s.bowlerId ? " b " + store().playerName(s.bowlerId) : "")
          : "not out";
        const sr = s.balls ? rate((s.runs / s.balls) * 100) : "0.00";
        return (
          "<tr><td>" + esc(p.name) + '<span class="how">' + esc(how) + "</span></td><td>" + s.runs +
          "</td><td>" + s.balls + "</td><td>" + s.fours + "</td><td>" + s.sixes + "</td><td>" + sr + "</td></tr>"
        );
      })
      .join("");

    const bowlRows = Object.keys(state.bowl)
      .map(function (id) {
        const s = state.bowl[id];
        const econ = s.balls ? rate(s.runs / (s.balls / 6)) : "0.00";
        return (
          "<tr><td>" + esc(store().playerName(id)) + "</td><td>" + DKPL.engine.oversText(s.balls) +
          "</td><td>" + s.maidens + "</td><td>" + s.runs + "</td><td>" + s.wickets + "</td><td>" + econ + "</td></tr>"
        );
      })
      .join("");

    return (
      '<article class="card innings-card">' +
      '<div class="innings-head"><h3>' + esc(inn.superOver ? "Super Over · " + batting : batting) + "</h3><strong>" + state.runs + "/" + state.wickets +
      ' <span class="muted">(' + state.oversText + ")</span></strong></div>" +
      '<div class="table-wrap"><table><thead><tr><th>Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead><tbody>' +
      (batRows || '<tr><td colspan="6" class="muted">No deliveries yet</td></tr>') +
      "</tbody></table></div>" +
      '<p class="muted extras-line">Extras ' + state.extras.total +
      " (wd " + state.extras.wides + ", nb " + state.extras.noBalls +
      (state.extras.penalties ? ", pen " + state.extras.penalties : "") + ")</p>" +
      fowLine(state) +
      oversList(state, false) +
      '<div class="table-wrap"><table><thead><tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th></tr></thead><tbody>' +
      (bowlRows || '<tr><td colspan="6" class="muted">No deliveries yet</td></tr>') +
      "</tbody></table></div>" +
      "</article>"
    );
  }

  function fullHtml(match) {
    const innings = match.innings || [];
    return (
      '<article class="card live-card">' + miniHtml(match) + currentPlayers(match) + "</article>" +
      innings
        .map(function (_, i) {
          return fullCard(match, i);
        })
        .join("")
    );
  }

  DKPL.board = {
    miniHtml: miniHtml,
    fullHtml: fullHtml,
    currentPlayers: currentPlayers,
    situation: situation,
    thisOver: thisOver,
    shareText: shareText,
    rate: rate
  };
})();
