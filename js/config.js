window.DKPL_CONFIG = {
  tournamentName: "DKPL 2026",
  fullName: "Doddakittadahalli Premier League 2026",
  season: "2026",
  logo: "images/dkpl-logo.png",
  teamCount: 6,
  leagueMatches: 15,
  qualify: 4,
  oversOptions: [6, 8, 10],
  venueDefault: "Doddakittadahalli Ground",

  /**
   * After all league matches, top 4 enter Q1 / Eliminator / Q2 / Final playoffs (not 1v4 / 2v3 semis).
   */
  playoffs: {
    stages: ["Qualifier 1", "Eliminator", "Qualifier 2", "Final"],
    bracket: [
      {
        stage: "Qualifier 1",
        detail: "Rank 1 vs Rank 2",
        outcome: "Winner → Final · Loser → Qualifier 2"
      },
      {
        stage: "Eliminator",
        detail: "Rank 3 vs Rank 4",
        outcome: "Winner → Qualifier 2 · Loser out"
      },
      {
        stage: "Qualifier 2",
        detail: "Loser Q1 vs Winner Eliminator",
        outcome: "Winner → Final"
      },
      {
        stage: "Final",
        detail: "Winner Q1 vs Winner Q2",
        outcome: "DKPL champion"
      }
    ],
    defaultIntro:
      "All 15 league matches are round-robin. They decide the top four on the points table only. " +
      "After the league, playoffs use the Qualifier / Eliminator format — win and you advance.",
    defaultRules: [
      "Whoever wins more league matches earns more points and climbs the table (NRR breaks ties). Top 4 qualify for playoffs.",
      "League fixtures are separate from the playoff bracket — league results only set seeds (1st–4th).",
      "In every playoff match, the team that wins advances to the next round.",
      "Qualifier 1 (1st vs 2nd): winner goes straight to the Final; loser plays Qualifier 2.",
      "Eliminator (3rd vs 4th): winner plays Qualifier 2; loser is eliminated.",
      "Qualifier 2: loser of Q1 vs winner of Eliminator — winner reaches the Final.",
      "Final: winner of Q1 vs winner of Q2 — winner is crowned DKPL champion."
    ]
  },

  mvp: {
    run: 1,
    four: 1,
    six: 2,
    fifty: 10,
    hundred: 25,
    wicket: 20,
    maiden: 10,
    economy: [
      { max: 4, bonus: 15 },
      { max: 6, bonus: 8 },
      { max: 8, bonus: 3 }
    ],
    catch: 8,
    runOut: 10,
    stumping: 10
  },

  apiBase: "https://script.google.com/macros/s/AKfycbw9GOiu3nsynqghQ0H8QIwyo5_AdYMi5m0EJ9Lo1DPSTIZtT0TUUUxKPmb2Za5aCwmf/exec"
};
