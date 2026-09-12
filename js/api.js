(function () {
  const DKPL = (window.DKPL = window.DKPL || {});
  const config = window.DKPL_CONFIG;

  DKPL.demo = {
    home: function () {
      return {
        preview: !config.apiBase,
        live: {
          matchId: "M012",
          teamA: "Titans",
          teamB: "Warriors",
          batting: "Titans",
          score: "87/3",
          overs: "8.2",
          striker: "Ravi 42*(28)",
          nonStriker: "Kumar 15*(12)",
          bowler: "Anil 2.2-0-11-1",
          situation: "Need 24 runs from 10 balls",
          venue: "Doddakittadahalli Ground"
        },
        upcoming: [
          { matchId: "M013", teamA: "Strikers", teamB: "Royals", date: "Sun 4:00 PM", venue: "DKPL Ground", stage: "League" },
          { matchId: "M014", teamA: "Knights", teamB: "Blasters", date: "Sun 6:30 PM", venue: "DKPL Ground", stage: "League" },
          { matchId: "M015", teamA: "Titans", teamB: "Royals", date: "Mon 5:00 PM", venue: "DKPL Ground", stage: "League" }
        ],
        latest: {
          teamA: "Knights",
          teamB: "Strikers",
          result: "Knights won by 12 runs",
          scores: "Knights 96/5 (10) · Strikers 84/7 (10)"
        },
        stats: {
          teams: config.teams,
          leagueMatches: config.leagueMatches,
          completed: 11,
          remaining: 4
        }
      };
    },
    teams: function () {
      return [
        { TeamID: "T01", TeamName: "Titans", Captain: "Ravi" },
        { TeamID: "T02", TeamName: "Warriors", Captain: "Anil" },
        { TeamID: "T03", TeamName: "Strikers", Captain: "Kiran" },
        { TeamID: "T04", TeamName: "Royals", Captain: "Manoj" },
        { TeamID: "T05", TeamName: "Knights", Captain: "Suresh" },
        { TeamID: "T06", TeamName: "Blasters", Captain: "Prakash" }
      ];
    },
    players: function () {
      return [
        { PlayerID: "P01", TeamName: "Titans", PlayerName: "Ravi", Role: "Batter" },
        { PlayerID: "P02", TeamName: "Titans", PlayerName: "Kumar", Role: "All-rounder" },
        { PlayerID: "P03", TeamName: "Warriors", PlayerName: "Anil", Role: "Bowler" },
        { PlayerID: "P04", TeamName: "Strikers", PlayerName: "Kiran", Role: "Batter" },
        { PlayerID: "P05", TeamName: "Royals", PlayerName: "Manoj", Role: "Wicketkeeper" },
        { PlayerID: "P06", TeamName: "Knights", PlayerName: "Suresh", Role: "Bowler" }
      ];
    },
    fixtures: function () {
      return [
        { MatchID: "M012", Stage: "League", TeamA: "Titans", TeamB: "Warriors", Date: "Live", Status: "Live" },
        { MatchID: "M013", Stage: "League", TeamA: "Strikers", TeamB: "Royals", Date: "Sun 4:00 PM", Status: "Upcoming" },
        { MatchID: "M011", Stage: "League", TeamA: "Knights", TeamB: "Strikers", Date: "Sat 6:00 PM", Status: "Completed", Winner: "Knights" }
      ];
    },
    points: function () {
      return [
        { TeamName: "Titans", Played: 4, Won: 3, Lost: 1, Points: 6, NRR: 1.24 },
        { TeamName: "Knights", Played: 4, Won: 3, Lost: 1, Points: 6, NRR: 0.81 },
        { TeamName: "Warriors", Played: 3, Won: 2, Lost: 1, Points: 4, NRR: 0.44 },
        { TeamName: "Royals", Played: 3, Won: 1, Lost: 2, Points: 2, NRR: -0.18 },
        { TeamName: "Strikers", Played: 4, Won: 1, Lost: 3, Points: 2, NRR: -0.92 },
        { TeamName: "Blasters", Played: 4, Won: 1, Lost: 3, Points: 2, NRR: -1.10 }
      ];
    },
    stats: function () {
      return {
        mostRuns: [{ player: "Ravi", team: "Titans", value: "186" }],
        mostWickets: [{ player: "Anil", team: "Warriors", value: "9" }],
        highestScore: [{ player: "Kiran", team: "Strikers", value: "62*" }],
        bestBowling: [{ player: "Suresh", team: "Knights", value: "4/9" }],
        mvp: [{ player: "Ravi", team: "Titans", value: "214" }]
      };
    }
  };

  async function request(action) {
    if (!config.apiBase) return null;
    const url = config.apiBase + (config.apiBase.indexOf("?") >= 0 ? "&" : "?") + "action=" + encodeURIComponent(action);
    const res = await fetch(url);
    if (!res.ok) throw new Error("API error");
    return res.json();
  }

  DKPL.api = {
    get: async function (action, demoFn) {
      try {
        const live = await request(action);
        if (live) return live;
      } catch (err) {
        console.warn("DKPL API fallback:", err);
      }
      return demoFn();
    }
  };

  DKPL.ui = {
    initNav: function () {
      const toggle = document.querySelector(".nav-toggle");
      const nav = document.querySelector(".site-nav");
      if (!toggle || !nav) return;
      toggle.addEventListener("click", function () {
        nav.classList.toggle("open");
      });
    }
  };

  document.addEventListener("DOMContentLoaded", DKPL.ui.initNav);
})();
