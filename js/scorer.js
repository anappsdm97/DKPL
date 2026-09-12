(function () {
  const history = [];
  const state = {
    runs: 0,
    wickets: 0,
    balls: 0,
    extras: 0,
    strikerOnStrike: true
  };

  function overs() {
    return Math.floor(state.balls / 6) + "." + (state.balls % 6);
  }

  function render() {
    const score = document.getElementById("scorerScore");
    const over = document.getElementById("scorerOvers");
    const strike = document.getElementById("strikeNote");
    if (!score) return;
    score.textContent = state.runs + "/" + state.wickets;
    over.textContent = overs() + " Overs";
    if (strike) {
      strike.textContent = state.strikerOnStrike ? "Strike: Batter 1" : "Strike: Batter 2";
    }
  }

  function snapshot() {
    history.push(JSON.parse(JSON.stringify(state)));
  }

  function applyLegal(runs, isWicket) {
    snapshot();
    state.runs += runs;
    if (isWicket) state.wickets += 1;
    state.balls += 1;
    if (runs % 2 === 1) state.strikerOnStrike = !state.strikerOnStrike;
    if (state.balls % 6 === 0) state.strikerOnStrike = !state.strikerOnStrike;
    render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    const keys = document.getElementById("scoreKeys");
    if (!keys) return;
    keys.addEventListener("click", function (e) {
      const btn = e.target.closest("button[data-key]");
      if (!btn) return;
      const key = btn.dataset.key;
      if (key === "UNDO") {
        const prev = history.pop();
        if (prev) Object.assign(state, prev);
        render();
        return;
      }
      if (key === "WD" || key === "NB") {
        snapshot();
        state.runs += 1;
        state.extras += 1;
        render();
        return;
      }
      if (key === "OUT") {
        applyLegal(0, true);
        return;
      }
      applyLegal(Number(key), false);
    });
    render();
  });
})();
