// ===== KNOCKOUT BRACKET =====
// Note: this uses a simplified (not the official FIFA third-place slot table,
// which depends on exactly which 8 groups produce the qualifying thirds and
// is an 80-row lookup) but structurally valid draw: winners, the 8 best
// third-placed teams, and runners-up are paired avoiding same-group clashes.
// Round of 32 -> Round of 16 -> Quarter-finals -> Semi-finals -> Final.
// Extra time isn't modelled separately — a drawn full-time score prompts a
// penalty shootout entry to decide the winner, same as real knockout logic.

const KO_ROUNDS = ["R32", "R16", "QF", "SF", "F"];
const KO_ROUND_LABELS = { R32: "Round of 32", R16: "Round of 16", QF: "Quarter-finals", SF: "Semi-finals", F: "Final" };
const KO_ROUND_SIZE = { R32: 16, R16: 8, QF: 4, SF: 2, F: 1 };

function groupsPlayedCount(letter) {
  const results = getResults("wc_" + letter, "2026");
  return Object.keys(results).length;
}

function allGroupsComplete() {
  return WORLDCUP_GROUP_ORDER.every(letter => groupsPlayedCount(letter) >= 6);
}

function pairAvoidingSameGroup(list) {
  const items = list.slice();
  const pairs = [];
  while (items.length) {
    const a = items.shift();
    let idx = items.findIndex(b => b.group !== a.group);
    if (idx === -1) idx = 0;
    const b = items.splice(idx, 1)[0];
    pairs.push([a, b]);
  }
  return pairs;
}

function buildKnockout() {
  const winners = [], runnersUp = [], thirdsAll = [];
  WORLDCUP_GROUP_ORDER.forEach(letter => {
    const table = computeTable("wc_" + letter, "2026");
    winners.push({ group: letter, team: table[0] });
    runnersUp.push({ group: letter, team: table[1] });
    thirdsAll.push({ group: letter, team: table[2] });
  });
  const bestThirds = thirdsAll
    .slice()
    .sort((a, b) => b.team.pts - a.team.pts || b.team.gd - a.team.gd || b.team.gf - a.team.gf)
    .slice(0, 8);

  const pool = winners.concat(bestThirds, runnersUp);
  const pairs = pairAvoidingSameGroup(pool);

  const matches = {};
  pairs.forEach((pair, i) => {
    const id = "R32-" + (i + 1);
    matches[id] = makeMatch(id, "R32", pair[0], pair[1]);
  });
  ["R16", "QF", "SF", "F"].forEach(round => {
    for (let i = 0; i < KO_ROUND_SIZE[round]; i++) {
      const id = round + "-" + (i + 1);
      matches[id] = makeMatch(id, round, null, null);
    }
  });

  STATE.knockout = { built: true, builtAt: Date.now(), matches };
  saveState();
}

function makeMatch(id, round, a, b) {
  return {
    id, round,
    teamA: a ? { id: a.team.id, name: a.team.name, group: a.group } : null,
    teamB: b ? { id: b.team.id, name: b.team.name, group: b.group } : null,
    scoreA: null, scoreB: null,
    pensA: null, pensB: null,
    winnerId: null
  };
}

function getKnockout() {
  if (!STATE.knockout || !STATE.knockout.built) return null;
  return STATE.knockout;
}

function nextMatchRef(round, indexInRound) {
  // indexInRound is 0-based within current round
  const order = ["R32", "R16", "QF", "SF", "F"];
  const pos = order.indexOf(round);
  if (pos === -1 || pos === order.length - 1) return null;
  const nextRound = order[pos + 1];
  const nextIndex = Math.floor(indexInRound / 2);
  const slot = indexInRound % 2 === 0 ? "teamA" : "teamB";
  return { id: nextRound + "-" + (nextIndex + 1), slot };
}

function setKnockoutScore(matchId, scoreA, scoreB, pensA, pensB) {
  const ko = getKnockout();
  if (!ko) return;
  const m = ko.matches[matchId];
  if (!m) return;
  m.scoreA = scoreA === "" || scoreA == null ? null : Math.max(0, parseInt(scoreA) || 0);
  m.scoreB = scoreB === "" || scoreB == null ? null : Math.max(0, parseInt(scoreB) || 0);
  m.pensA = pensA === "" || pensA == null ? null : Math.max(0, parseInt(pensA) || 0);
  m.pensB = pensB === "" || pensB == null ? null : Math.max(0, parseInt(pensB) || 0);

  let winnerId = null;
  if (m.scoreA != null && m.scoreB != null) {
    if (m.scoreA > m.scoreB) winnerId = m.teamA.id;
    else if (m.scoreB > m.scoreA) winnerId = m.teamB.id;
    else if (m.pensA != null && m.pensB != null && m.pensA !== m.pensB) {
      winnerId = m.pensA > m.pensB ? m.teamA.id : m.teamB.id;
    }
  }
  m.winnerId = winnerId;

  // propagate to next round
  const [round, idxStr] = matchId.split("-");
  const idx = parseInt(idxStr) - 1;
  const ref = nextMatchRef(round, idx);
  if (ref) {
    const nextM = ko.matches[ref.id];
    if (nextM) {
      const winnerTeam = winnerId ? (winnerId === m.teamA.id ? m.teamA : m.teamB) : null;
      nextM[ref.slot] = winnerTeam;
      // if the feeder changes, downstream results relying on old team should reset
      if (!winnerTeam) {
        nextM.scoreA = nextM.scoreB = nextM.pensA = nextM.pensB = nextM.winnerId = null;
      }
    }
  }
  saveState();
}

function resetKnockout() {
  STATE.knockout = { built: false, matches: {} };
  saveState();
}

function matchesForRound(round) {
  const ko = getKnockout();
  if (!ko) return [];
  const list = [];
  for (let i = 1; i <= KO_ROUND_SIZE[round]; i++) {
    list.push(ko.matches[round + "-" + i]);
  }
  return list;
}
