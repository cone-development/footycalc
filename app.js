// ===== STORAGE =====
const DB_KEY = "footy_calc_state_v1";

function loadState() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed);
  } catch (e) {
    console.error("Load failed", e);
    return defaultState();
  }
}

function defaultState() {
  return {
    ratings: {},        // { leagueId: { teamId: ovr } } overrides
    seasons: {},         // { "leagueId__season": { fixtures: [...], generatedAt } }
    results: {},          // { "leagueId__season": { matchId: {home, away} } }
    players: [],           // custom players
    knockout: { built: false, matches: {} },
    activeLeague: "epl",
    activeSeason: "25/26"
  };
}

let STATE = loadState();

function saveState() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(STATE));
  } catch (e) {
    console.error("Save failed", e);
    toast("Save failed — storage might be full.");
  }
}

// ===== RATINGS =====
function getOvr(leagueId, teamId) {
  const override = STATE.ratings[leagueId] && STATE.ratings[leagueId][teamId];
  if (override != null) return override;
  const team = LEAGUES[leagueId].teams.find(t => t.id === teamId);
  return team ? team.ovr : 75;
}

function setOvr(leagueId, teamId, value) {
  if (!STATE.ratings[leagueId]) STATE.ratings[leagueId] = {};
  STATE.ratings[leagueId][teamId] = Math.max(40, Math.min(99, Math.round(value)));
  saveState();
}

// ===== FIXTURE GENERATION =====
// Balanced double round-robin (everyone plays everyone home+away), then
// lightly reordered so a weak team doesn't face 3+ strong teams (top-6 by OVR) in a row.
function generateFixtures(leagueId) {
  const teams = LEAGUES[leagueId].teams.map(t => t.id);
  const n = teams.length;
  const rounds = [];
  let arr = teams.slice();
  if (n % 2 !== 0) arr.push(null); // bye slot, shouldn't happen with 20
  const half = arr.length / 2;

  // Standard circle method for round-robin
  for (let r = 0; r < arr.length - 1; r++) {
    const roundMatches = [];
    for (let i = 0; i < half; i++) {
      const home = arr[i];
      const away = arr[arr.length - 1 - i];
      if (home != null && away != null) {
        // alternate home/away by round parity for fairness
        if (r % 2 === 0) roundMatches.push([home, away]);
        else roundMatches.push([away, home]);
      }
    }
    rounds.push(roundMatches);
    // rotate (keep first fixed)
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop());
    arr = [fixed, ...rest];
  }

  // Second half of season: reverse fixtures (swap home/away)
  const secondHalf = rounds.map(round => round.map(([h, a]) => [a, h]));
  const allRounds = rounds.concat(secondHalf);

  // Determine "top strength" set (top 6 by OVR) to check for 3+ in a row
  const strengthRank = teams
    .slice()
    .sort((a, b) => getOvr(leagueId, b) - getOvr(leagueId, a));
  const strongSet = new Set(strengthRank.slice(0, 6));

  // Light local reordering: for each team, if it faces 3+ strong opponents in
  // consecutive matchdays, try swapping that matchday with a nearby one (+-2)
  // for that team only is complex with round-robin structure, so instead we
  // do a simpler pass: shuffle the ORDER of matchdays (not the pairings)
  // using a greedy heuristic to minimize consecutive "strong opponent" streaks.
  const teamStreak = {};
  teams.forEach(t => (teamStreak[t] = 0));

  function streakScore(order) {
    // lower is better
    const streak = {};
    teams.forEach(t => (streak[t] = 0));
    let penalty = 0;
    for (const roundIdx of order) {
      const round = allRounds[roundIdx];
      const playedThisRound = new Set();
      for (const [h, a] of round) {
        const hStrong = strongSet.has(a);
        const aStrong = strongSet.has(h);
        streak[h] = hStrong ? streak[h] + 1 : 0;
        streak[a] = aStrong ? streak[a] + 1 : 0;
        if (streak[h] >= 3) penalty += streak[h];
        if (streak[a] >= 3) penalty += streak[a];
        playedThisRound.add(h);
        playedThisRound.add(a);
      }
    }
    return penalty;
  }

  let order = allRounds.map((_, i) => i);
  let bestScore = streakScore(order);
  // simple hill-climb: try swapping random pairs of matchdays, keep if improves
  for (let iter = 0; iter < 400 && bestScore > 0; iter++) {
    const i = Math.floor(Math.random() * order.length);
    const j = Math.floor(Math.random() * order.length);
    if (i === j) continue;
    const trial = order.slice();
    [trial[i], trial[j]] = [trial[j], trial[i]];
    const score = streakScore(trial);
    if (score <= bestScore) {
      order = trial;
      bestScore = score;
    }
  }

  const fixtures = [];
  let matchId = 1;
  order.forEach((roundIdx, matchdayNumber) => {
    allRounds[roundIdx].forEach(([home, away]) => {
      fixtures.push({
        id: "m" + matchId++,
        matchday: matchdayNumber + 1,
        home,
        away
      });
    });
  });

  return fixtures;
}

// Single round-robin for 4-team World Cup groups: each team plays each other
// once, 3 matchdays of 2 matches, standard "circle method" fixed at 4 teams.
function generateGroupFixtures(leagueId) {
  const teams = LEAGUES[leagueId].teams.map(t => t.id);
  let arr = teams.slice();
  const half = arr.length / 2;
  const fixtures = [];
  let matchId = 1;
  for (let r = 0; r < arr.length - 1; r++) {
    for (let i = 0; i < half; i++) {
      const home = arr[i];
      const away = arr[arr.length - 1 - i];
      const pair = r % 2 === 0 ? [home, away] : [away, home];
      fixtures.push({ id: "m" + matchId++, matchday: r + 1, home: pair[0], away: pair[1] });
    }
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop());
    arr = [fixed, ...rest];
  }
  return fixtures;
}

function seasonKey(leagueId, season) {
  return leagueId + "__" + season;
}

function ensureSeason(leagueId, season) {
  const key = seasonKey(leagueId, season);
  if (!STATE.seasons[key]) {
    const isGroup = LEAGUES[leagueId] && LEAGUES[leagueId].isWorldCupGroup;
    STATE.seasons[key] = {
      fixtures: isGroup ? generateGroupFixtures(leagueId) : generateFixtures(leagueId),
      generatedAt: Date.now()
    };
    STATE.results[key] = {};
    saveState();
  }
  return STATE.seasons[key];
}

function getFixtures(leagueId, season) {
  return ensureSeason(leagueId, season).fixtures;
}

function getResults(leagueId, season) {
  const key = seasonKey(leagueId, season);
  if (!STATE.results[key]) STATE.results[key] = {};
  return STATE.results[key];
}

function setResult(leagueId, season, matchId, homeGoals, awayGoals) {
  const results = getResults(leagueId, season);
  if (homeGoals === "" || awayGoals === "" || homeGoals == null || awayGoals == null) {
    delete results[matchId];
  } else {
    results[matchId] = { h: Math.max(0, parseInt(homeGoals) || 0), a: Math.max(0, parseInt(awayGoals) || 0) };
  }
  saveState();
}

function simulateResult(leagueId, homeId, awayId) {
  const homeOvr = getOvr(leagueId, homeId) + 3; // home advantage
  const awayOvr = getOvr(leagueId, awayId);
  const diff = homeOvr - awayOvr;
  // Base expected goals skewed by strength diff, home side favored slightly
  const homeExp = clamp(1.35 + diff * 0.045, 0.2, 4.2);
  const awayExp = clamp(1.1 - diff * 0.04, 0.2, 4.0);
  return { h: poissonSample(homeExp), a: poissonSample(awayExp) };
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function poissonSample(lambda) {
  // Knuth's algorithm
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return Math.min(k - 1, 9);
}

function simulateAllRemaining(leagueId, season) {
  const fixtures = getFixtures(leagueId, season);
  const results = getResults(leagueId, season);
  fixtures.forEach(f => {
    if (!results[f.id]) {
      results[f.id] = simulateResult(leagueId, f.home, f.away);
    }
  });
  saveState();
}

function clearResults(leagueId, season) {
  const key = seasonKey(leagueId, season);
  STATE.results[key] = {};
  saveState();
}

function regenerateFixtures(leagueId, season) {
  const key = seasonKey(leagueId, season);
  const isGroup = LEAGUES[leagueId] && LEAGUES[leagueId].isWorldCupGroup;
  STATE.seasons[key] = { fixtures: isGroup ? generateGroupFixtures(leagueId) : generateFixtures(leagueId), generatedAt: Date.now() };
  STATE.results[key] = {};
  saveState();
}

// ===== TABLE CALCULATION =====
function computeTable(leagueId, season) {
  const teams = LEAGUES[leagueId].teams;
  const fixtures = getFixtures(leagueId, season);
  const results = getResults(leagueId, season);

  const table = {};
  teams.forEach(t => {
    table[t.id] = {
      id: t.id, name: t.name, short: t.short,
      p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: []
    };
  });

  const sortedFixtures = fixtures.slice().sort((a, b) => a.matchday - b.matchday);

  sortedFixtures.forEach(f => {
    const res = results[f.id];
    if (!res) return;
    const home = table[f.home];
    const away = table[f.away];
    home.p++; away.p++;
    home.gf += res.h; home.ga += res.a;
    away.gf += res.a; away.ga += res.h;
    if (res.h > res.a) {
      home.w++; away.l++; home.pts += 3;
      home.form.push("W"); away.form.push("L");
    } else if (res.h < res.a) {
      away.w++; home.l++; away.pts += 3;
      home.form.push("L"); away.form.push("W");
    } else {
      home.d++; away.d++; home.pts += 1; away.pts += 1;
      home.form.push("D"); away.form.push("D");
    }
  });

  const list = Object.values(table).map(t => {
    t.gd = t.gf - t.ga;
    t.form = t.form.slice(-5);
    return t;
  });

  list.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.name.localeCompare(b.name);
  });

  list.forEach((t, i) => (t.pos = i + 1));
  return list;
}

function topScorersFromResults() {
  // Placeholder aggregate isn't tracked per-player from match results (no lineups),
  // so real "top scorers" comes from the user's custom Players feature instead.
  return [];
}

// ===== PLAYERS =====
function addPlayer(p) {
  STATE.players.push({
    id: "p" + Date.now() + Math.floor(Math.random() * 1000),
    name: p.name,
    club: p.club || "",
    position: p.position || "ST",
    ovr: p.ovr || 70,
    apps: p.apps || 0,
    goals: p.goals || 0,
    assists: p.assists || 0,
    cleanSheets: p.cleanSheets || 0,
    rating: p.rating || 6.5
  });
  saveState();
}

function updatePlayer(id, patch) {
  const p = STATE.players.find(x => x.id === id);
  if (!p) return;
  Object.assign(p, patch);
  saveState();
}

function deletePlayer(id) {
  STATE.players = STATE.players.filter(x => x.id !== id);
  saveState();
}

function leaderboard() {
  // Custom players + a pull of top real "in-form" players generated from current
  // league standings' top scorers... but since we don't simulate individual goal
  // scorers, the leaderboard = custom players ranked, with a note.
  return STATE.players.slice().sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    if (b.assists !== a.assists) return b.assists - a.assists;
    return b.rating - a.rating;
  });
}

function findTeamByName(leagueId, rawName) {
  const teams = LEAGUES[leagueId].teams;
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const target = norm(rawName);
  // exact normalized match first
  let hit = teams.find(t => norm(t.name) === target || norm(t.short) === target);
  if (hit) return hit;
  // common nickname / shorthand aliases
  const ALIASES = {
    manutd: "mun", manunited: "mun", manchesterunited: "mun",
    mancity: "mci", manchestercity: "mci",
    spurs: "tot", tottenham: "tot",
    wolves: "wol", wolverhampton: "wol",
    newcastle: "new", forest: "nfo", nottsforest: "nfo", nottinghamforest: "nfo",
    brighton: "bha", westham: "whu", palace: "cry", crystalpalace: "cry",
    villa: "avl", astonvilla: "avl", leeds: "lee", sunderland: "sun",
    bournemouth: "bou", brentford: "bre", burnley: "bur", everton: "eve",
    fulham: "ful", arsenal: "ars", chelsea: "che", liverpool: "liv"
  };
  if (ALIASES[target]) hit = teams.find(t => t.id === ALIASES[target]);
  if (hit) return hit;
  // loose substring match as a last resort
  hit = teams.find(t => norm(t.name).includes(target) || target.includes(norm(t.name)));
  return hit || null;
}

// Parses lines like "Arsenal 2-1 Chelsea" or "Arsenal 2 - 1 Chelsea".
// Returns { applied: [...], unmatched: [...], ambiguous: [...] }
function bulkImportResults(leagueId, season, text) {
  const fixtures = getFixtures(leagueId, season);
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const applied = [], unmatched = [], noFixture = [];

  lines.forEach(line => {
    const m = line.match(/^(.+?)\s+(\d+)\s*[-:]\s*(\d+)\s+(.+)$/);
    if (!m) { unmatched.push(line); return; }
    const [, homeRaw, hs, as, awayRaw] = m;
    const homeTeam = findTeamByName(leagueId, homeRaw.trim());
    const awayTeam = findTeamByName(leagueId, awayRaw.trim());
    if (!homeTeam || !awayTeam) { unmatched.push(line); return; }

    // find an unplayed fixture between these two teams (either home/away order),
    // preferring the correct order, earliest matchday first
    const results = getResults(leagueId, season);
    let candidates = fixtures.filter(f =>
      (f.home === homeTeam.id && f.away === awayTeam.id) ||
      (f.home === awayTeam.id && f.away === homeTeam.id)
    ).sort((a, b) => a.matchday - b.matchday);
    let exact = candidates.find(f => f.home === homeTeam.id && !results[f.id]);
    let fixture = exact || candidates.find(f => !results[f.id]);

    if (!fixture) { noFixture.push(line); return; }

    if (fixture.home === homeTeam.id) {
      setResult(leagueId, season, fixture.id, hs, as);
    } else {
      setResult(leagueId, season, fixture.id, as, hs);
    }
    applied.push({ line, matchday: fixture.matchday, home: homeTeam.name, away: awayTeam.name });
  });

  return { applied, unmatched, noFixture };
}

function toast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2400);
}
