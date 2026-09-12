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

  // Local gate for the admin console. GitHub Pages is public, so this only
  // keeps casual visitors out of the admin screens.
  adminPin: "1926",

  knockout: [
    { stage: "Semi Final 1", detail: "Rank 1 vs Rank 4" },
    { stage: "Semi Final 2", detail: "Rank 2 vs Rank 3" },
    { stage: "Final", detail: "Winner SF1 vs Winner SF2" }
  ],

  mvp: {
    run: 1,
    four: 1,
    six: 2,
    fifty: 10,
    hundred: 25,
    wicket: 20,
    maiden: 10,
    // Economy bonus for bowlers who completed at least one over.
    economy: [
      { max: 4, bonus: 15 },
      { max: 6, bonus: 8 },
      { max: 8, bonus: 3 }
    ],
    catch: 8,
    runOut: 10,
    stumping: 10
  },

  // Google Sheet: DKPL-2026 (script must be opened via Extensions → Apps Script on that file).
  apiBase: "https://script.google.com/macros/s/AKfycbyQW9O9WMyTECa-HNMGkolWjy4qzu40m4yII7Lrez-d-ZT9tEnzL26qRWUSez7JpHig/exec"
};
