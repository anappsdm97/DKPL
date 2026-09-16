/**
 * Data layer: browser storage today, Google Sheets as soon as config.apiBase is set.
 * Points table, statistics and MVP are always derived from match data, never typed in.
 */
(function () {
  const DKPL = (window.DKPL = window.DKPL || {});
  const cfg = window.DKPL_CONFIG;

  const KEYS = { teams: "dkpl.teams", players: "dkpl.players", matches: "dkpl.matches" };

  function read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.warn("DKPL storage read failed", err);
      return [];
    }
  }

  const syncTimers = {};

  function write(key, rows) {
    localStorage.setItem(key, JSON.stringify(rows));
    localStorage.setItem("dkpl.updatedAt", String(Date.now()));
    window.dispatchEvent(new CustomEvent("dkpl-data-changed", { detail: { key: key } }));
    if (!DKPL.api || !DKPL.api.enabled()) return;

    // Rapid scoring taps would otherwise fire a request per ball.
    clearTimeout(syncTimers[key]);
    syncTimers[key] = setTimeout(function () {
      DKPL.api
        .push(key.split(".")[1], read(key))
        .then(function () {
          localStorage.removeItem("dkpl.syncError");
        })
        .catch(function (err) {
          var msg = err && err.message ? err.message : String(err);
          localStorage.setItem("dkpl.syncError", msg);
          console.warn("DKPL sync failed", err);
          if (DKPL.ui && DKPL.ui.toast) {
            DKPL.ui.toast("Google Sheet sync failed — use Admin → Sync everything now");
          }
        });
    }, 1500);
  }

  let idCounter = 0;

  function newId(prefix) {
    idCounter += 1;
    return (
      prefix +
      Date.now().toString(36) +
      idCounter.toString(36) +
      Math.floor(Math.random() * 1679616).toString(36)
    );
  }

  function upsert(key, row, prefix) {
    const rows = read(key);
    if (!row.id) row.id = newId(prefix);
    const index = rows.findIndex(function (r) {
      return r.id === row.id;
    });
    if (index >= 0) rows[index] = Object.assign({}, rows[index], row);
    else rows.push(row);
    write(key, rows);
    return row;
  }

  function remove(key, id) {
    write(
      key,
      read(key).filter(function (r) {
        return r.id !== id;
      })
    );
  }

  const store = {
    teams: function () {
      return read(KEYS.teams);
    },
    players: function () {
      return read(KEYS.players);
    },
    matches: function () {
      return read(KEYS.matches);
    },

    saveTeam: function (team) {
      return upsert(KEYS.teams, team, "T");
    },
    deleteTeam: function (id) {
      remove(KEYS.teams, id);
      read(KEYS.players)
        .filter(function (p) {
          return p.teamId === id;
        })
        .forEach(function (p) {
          remove(KEYS.players, p.id);
        });
    },
    savePlayer: function (player) {
      return upsert(KEYS.players, player, "P");
    },
    deletePlayer: function (id) {
      remove(KEYS.players, id);
    },
    saveMatch: function (match) {
      return upsert(KEYS.matches, match, "M");
    },
    deleteMatch: function (id) {
      remove(KEYS.matches, id);
    },

    teamById: function (id) {
      return (
        store.teams().find(function (t) {
          return t.id === id;
        }) || null
      );
    },
    playerById: function (id) {
      return (
        store.players().find(function (p) {
          return p.id === id;
        }) || null
      );
    },
    teamName: function (id) {
      const t = store.teamById(id);
      return t ? t.name : "-";
    },
    playerName: function (id) {
      const p = store.playerById(id);
      return p ? p.name : "-";
    },
    squad: function (teamId) {
      return store.players().filter(function (p) {
        return p.teamId === teamId;
      });
    },
    matchById: function (id) {
      return (
        store.matches().find(function (m) {
          return m.id === id;
        }) || null
      );
    },

    liveMatch: function () {
      return (
        store.matches().find(function (m) {
          return m.status === "Live";
        }) || null
      );
    },
    upcomingMatches: function () {
      return store.matches().filter(function (m) {
        return m.status === "Upcoming";
      });
    },
    completedMatches: function () {
      return store.matches().filter(function (m) {
        return m.status === "Completed";
      });
    },

    /** Wickets available to an innings: squad size minus the not-out batter. */
    maxWickets: function (teamId) {
      const size = store.squad(teamId).length;
      return Math.max(1, (size || 11) - 1);
    },

    inningsState: function (match, index) {
      const inn = match.innings && match.innings[index];
      if (!inn) return null;
      return DKPL.engine.computeInnings(inn, match.overs, store.maxWickets(inn.battingTeamId));
    },

    pointsTable: function () {
      const rows = {};
      store.teams().forEach(function (t) {
        rows[t.id] = {
          teamId: t.id,
          name: t.name,
          logo: t.logo || "",
          played: 0,
          won: 0,
          lost: 0,
          tied: 0,
          points: 0,
          forRuns: 0,
          forOvers: 0,
          againstRuns: 0,
          againstOvers: 0,
          nrr: 0
        };
      });

      store.completedMatches().forEach(function (m) {
        if (!m.innings || m.innings.length < 2) return;
        const a = store.inningsState(m, 0);
        const b = store.inningsState(m, 1);
        const teamA = m.innings[0].battingTeamId;
        const teamB = m.innings[1].battingTeamId;
        if (!rows[teamA] || !rows[teamB]) return;

        // All out means the full quota counts against you for NRR.
        const oversA = a.allOut ? m.overs : a.oversFloat;
        const oversB = b.allOut ? m.overs : b.oversFloat;

        rows[teamA].played += 1;
        rows[teamB].played += 1;
        rows[teamA].forRuns += a.runs;
        rows[teamA].forOvers += oversA;
        rows[teamA].againstRuns += b.runs;
        rows[teamA].againstOvers += oversB;
        rows[teamB].forRuns += b.runs;
        rows[teamB].forOvers += oversB;
        rows[teamB].againstRuns += a.runs;
        rows[teamB].againstOvers += oversA;

        if (m.result && m.result.winnerId && rows[m.result.winnerId]) {
          const loserId = m.result.winnerId === teamA ? teamB : teamA;
          rows[m.result.winnerId].won += 1;
          rows[m.result.winnerId].points += 2;
          rows[loserId].lost += 1;
        } else {
          rows[teamA].tied += 1;
          rows[teamB].tied += 1;
          rows[teamA].points += 1;
          rows[teamB].points += 1;
        }
      });

      return Object.keys(rows)
        .map(function (id) {
          const r = rows[id];
          const scored = r.forOvers ? r.forRuns / r.forOvers : 0;
          const conceded = r.againstOvers ? r.againstRuns / r.againstOvers : 0;
          r.nrr = Number((scored - conceded).toFixed(3));
          return r;
        })
        .sort(function (x, y) {
          return y.points - x.points || y.nrr - x.nrr || x.name.localeCompare(y.name);
        });
    },

    /** Career totals across every completed match, plus MVP points. */
    playerStats: function () {
      const rows = {};
      store.players().forEach(function (p) {
        rows[p.id] = {
          playerId: p.id,
          name: p.name,
          teamId: p.teamId,
          teamName: store.teamName(p.teamId),
          photo: p.photo || "",
          matches: 0,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          highest: 0,
          wickets: 0,
          runsConceded: 0,
          ballsBowled: 0,
          maidens: 0,
          bestWickets: 0,
          bestRuns: 0,
          catches: 0,
          runOuts: 0,
          stumpings: 0,
          mvp: 0
        };
      });

      store.completedMatches().forEach(function (m) {
        const seen = {};
        (m.innings || []).forEach(function (inn) {
          const state = DKPL.engine.computeInnings(inn, m.overs, store.maxWickets(inn.battingTeamId));

          Object.keys(state.bat).forEach(function (id) {
            const r = rows[id];
            if (!r) return;
            const s = state.bat[id];
            r.runs += s.runs;
            r.balls += s.balls;
            r.fours += s.fours;
            r.sixes += s.sixes;
            if (s.runs > r.highest) r.highest = s.runs;
            seen[id] = true;
          });

          Object.keys(state.bowl).forEach(function (id) {
            const r = rows[id];
            if (!r) return;
            const s = state.bowl[id];
            r.wickets += s.wickets;
            r.runsConceded += s.runs;
            r.ballsBowled += s.balls;
            r.maidens += s.maidens;
            if (s.wickets > r.bestWickets || (s.wickets === r.bestWickets && s.wickets > 0 && s.runs < r.bestRuns)) {
              r.bestWickets = s.wickets;
              r.bestRuns = s.runs;
            }
            seen[id] = true;
          });

          Object.keys(state.field).forEach(function (id) {
            const r = rows[id];
            if (!r) return;
            const s = state.field[id];
            r.catches += s.catches;
            r.runOuts += s.runOuts;
            r.stumpings += s.stumpings;
            seen[id] = true;
          });
        });

        DKPL.engine
          .matchMvp(m, m.overs, 10)
          .forEach(function (entry) {
            if (rows[entry.playerId]) rows[entry.playerId].mvp += entry.points;
          });

        Object.keys(seen).forEach(function (id) {
          if (rows[id]) rows[id].matches += 1;
        });
      });

      return Object.keys(rows).map(function (id) {
        return rows[id];
      });
    },

    leaderboards: function () {
      const all = store.playerStats();
      function top(field, filter) {
        return all
          .filter(filter || function () { return true; })
          .sort(function (a, b) {
            return b[field] - a[field];
          })
          .slice(0, 5);
      }
      return {
        mostRuns: top("runs", function (p) { return p.runs > 0; }),
        mostWickets: top("wickets", function (p) { return p.wickets > 0; }),
        highestScore: top("highest", function (p) { return p.highest > 0; }),
        bestBowling: all
          .filter(function (p) { return p.bestWickets > 0; })
          .sort(function (a, b) {
            return b.bestWickets - a.bestWickets || a.bestRuns - b.bestRuns;
          })
          .slice(0, 5),
        mvp: top("mvp", function (p) { return p.mvp > 0; })
      };
    },

    /** Round robin: every team plays every other team once (6 teams = 15 matches). */
    generateLeague: function (venue) {
      const teams = store.teams();
      const existing = store.matches();
      const created = [];
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const clash = existing.some(function (m) {
            return (
              m.stage === "League" &&
              ((m.teamA === teams[i].id && m.teamB === teams[j].id) ||
                (m.teamA === teams[j].id && m.teamB === teams[i].id))
            );
          });
          if (clash) continue;
          created.push(
            store.saveMatch({
              stage: "League",
              teamA: teams[i].id,
              teamB: teams[j].id,
              overs: cfg.oversOptions[cfg.oversOptions.length - 1],
              venue: venue || cfg.venueDefault,
              date: "",
              status: "Upcoming",
              innings: [],
              result: null
            })
          );
        }
      }
      return created;
    },

    /** Pull from Sheets when configured; never wipe local data with an empty remote copy. */
    ready: async function () {
      if (!DKPL.api || !DKPL.api.enabled()) return false;
      try {
        const remote = await DKPL.api.pull();
        if (!remote) return false;

        function merge(key, remoteRows) {
          const local = read(key);
          const incoming = remoteRows || [];
          if (!incoming.length && local.length) return;
          localStorage.setItem(key, JSON.stringify(incoming.length ? incoming : local));
        }

        merge(KEYS.teams, remote.teams);
        merge(KEYS.players, remote.players);
        merge(KEYS.matches, remote.matches);
        window.dispatchEvent(new CustomEvent("dkpl-data-changed", { detail: { key: "pull" } }));
        return true;
      } catch (err) {
        console.warn("DKPL remote load failed, using local data", err);
        return false;
      }
    },

    isEmpty: function () {
      return store.teams().length === 0;
    },

    clearAll: function () {
      [KEYS.teams, KEYS.players, KEYS.matches].forEach(function (k) {
        write(k, []);
      });
    },

    seedSample: function () {
      store.clearAll();
      const names = [
        ["Titans", "TTN", "#0f766e"],
        ["Warriors", "WAR", "#b45309"],
        ["Strikers", "STR", "#1d4ed8"],
        ["Royals", "ROY", "#7c3aed"],
        ["Knights", "KNI", "#be123c"],
        ["Blasters", "BLA", "#15803d"]
      ];
      const roles = ["Batter", "Bowler", "All-rounder", "Wicketkeeper"];
      names.forEach(function (n, ti) {
        const team = store.saveTeam({ name: n[0], short: n[1], colour: n[2], captain: "", logo: "" });
        for (let i = 1; i <= 8; i++) {
          const player = store.savePlayer({
            teamId: team.id,
            name: n[1] + " Player " + i,
            role: roles[i % roles.length],
            photo: ""
          });
          if (i === 1) store.saveTeam({ id: team.id, captain: player.name });
        }
      });
      store.generateLeague(cfg.venueDefault);
    }
  };

  DKPL.store = store;
})();
