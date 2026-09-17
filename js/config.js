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

  /** Official player guidelines (English summary of the Kannada DKPL rules). */
  tournamentRules: {
    intro:
      "Every registered player must read and follow these rules. " +
      "This page is the English summary for DKPL 2026; the Kannada version signed at registration remains the official reference.",
    sections: [
      {
        title: "Registration, conduct & responsibility",
        items: [
          "All registered players must obey DKPL tournament rules and any updates announced by the organisers.",
          "After registration, each player is placed on a team through the auction. Once the auction assigns you to a team, you may not move to another team.",
          "Players must accept and follow the decisions of the owner and captain of the team that selects them at the auction.",
          "DKPL is run to strengthen friendship and harmony among the youth of Doddakittadahalli, support the village, and provide fair, enjoyable cricket.",
          "Indecent, abusive, or undisciplined behaviour during the tournament may lead to strict disciplinary action, including suspension from matches.",
          "Registration fees will be refunded to any player who is not picked by a team in the auction.",
          "The DKPL franchise and management are not responsible for accidents, injuries, or other mishaps involving players during the tournament. Each player takes part at their own risk and should know their physical limits.",
          "Only players on a team's official squad in the portal may play. Guest or unregistered players may not take the field unless the organising committee gives written approval before the match.",
          "On match day, decisions by umpires and captains (toss, line-ups, and on-field disputes) are final for that match unless the committee later reviews them in writing.",
          "The organising committee may reschedule matches for weather, ground conditions, or safety. Changes will be shared on this website when possible."
        ]
      },
      {
        title: "Dress code",
        items: [
          "A dress code applies to every player for every match.",
          "The official team jersey and team trousers (pants) are compulsory. Players who are not in full team kit may be refused entry to the field at the umpires' or committee's discretion."
        ]
      },
      {
        title: "Injuries, substitutes & squad availability",
        items: [
          "There are no substitute fielders and no runners for batters. If a batter is injured, they must retire hurt or continue without a runner, in line with the laws of cricket and the umpires' decision.",
          "If some players are unavailable, the team must still play with whoever is present (for example with nine or ten players on the field).",
          "If more than three registered squad members are unavailable for a match, that team is not eligible to play. The opposing team will be awarded the match and the league points for that fixture."
        ]
      },
      {
        title: "Innings time, penalties & tied matches",
        items: [
          "Each innings is limited to forty minutes of playing time, as timed by the umpires.",
          "If an innings goes beyond forty minutes, a five-run penalty applies to the team that caused the delay, as decided by the umpires. If the delay is due to the bowling or fielding side (for example slow over rate), the penalty is charged against the fielding team. If the delay is due to the batting side (for example time-wasting between overs), the penalty is charged against the batting team.",
          "If a match ends with scores level, a Super Over will be played to decide the winner unless the committee specifies otherwise for a particular fixture."
        ]
      },
      {
        title: "Using the match scorer",
        items: [
          "Normal ball: tap the runs (0–6).",
          "Wide: tap WD once, then tap WD again for a wide only (1 run), or tap 1–4 for a wide plus bye runs (team total = 1 wide + byes; byes are not credited to a batter).",
          "No ball: tap NB once, then tap NB again for a no ball only (1 run), or tap 0–6 for runs off the bat (team total = 1 no ball + those runs; the batter gets the runs off the bat and the ball counts as faced).",
          "Run out on a normal ball: tap OUT → Run Out → runs on that ball → who is out → fielder. Do not tap the run number first as a separate ball.",
          "Run out on a wide: tap WD (wide armed), then OUT → Run Out → choose bye runs on that wide (0–4; the wide run is added automatically) → who is out → fielder.",
          "Run out on a no ball: tap NB, then OUT → Run Out → runs off the bat on that no ball → who is out → fielder.",
          "If you tap the wrong thing, use UNDO and enter the ball again."
        ]
      },
      {
        title: "2026 season format",
        items: [
          "Six teams play a round-robin league of fifteen matches. Each fixture is played over 6, 8, or 10 overs as shown on the schedule.",
          "League points: two points for a win and zero for a loss. Net run rate (NRR) is used to separate teams level on points.",
          "The top four teams on the league table qualify for the playoffs: Qualifier 1, Eliminator, Qualifier 2, and the Final (see the Playoffs tab on this site).",
          "MVP points are calculated automatically from batting, bowling, and fielding in each match; see the Statistics page for rankings."
        ]
      }
    ]
  },

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
