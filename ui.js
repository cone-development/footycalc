let CURRENT_SCREEN = "table";

function el(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    if (k === "class") e.className = attrs[k];
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  kids.flat().forEach(k => {
    if (k == null) return;
    e.appendChild(typeof k === "string" || typeof k === "number" ? document.createTextNode(k) : k);
  });
  return e;
}

function render() {
  renderHeader();
  const body = document.getElementById("screen-body");
  body.innerHTML = "";
  if (CURRENT_SCREEN === "table") body.appendChild(renderTableScreen());
  else if (CURRENT_SCREEN === "fixtures") body.appendChild(renderFixturesScreen());
  else if (CURRENT_SCREEN === "ratings") body.appendChild(renderRatingsScreen());
  else if (CURRENT_SCREEN === "players") body.appendChild(renderPlayersScreen());
  renderNav();
}

function isWorldCupActive() {
  return STATE.activeLeague.startsWith("wc_");
}

function renderHeader() {
  const tabs = document.getElementById("league-tabs");
  tabs.innerHTML = "";
  Object.entries(LEAGUES).forEach(([id, lg]) => {
    if (lg.isWorldCupGroup) return; // groups shown in season-row instead
  });
  const CLUB_LEAGUES = Object.entries(LEAGUES).filter(([id, lg]) => !lg.isWorldCupGroup);
  CLUB_LEAGUES.forEach(([id, lg]) => {
    tabs.appendChild(el("button", {
      class: "league-tab" + (STATE.activeLeague === id ? " active" : ""),
      onclick: () => { STATE.activeLeague = id; saveState(); render(); }
    }, lg.name));
  });
  tabs.appendChild(el("button", {
    class: "league-tab" + (isWorldCupActive() ? " active" : ""),
    style: "border-color:var(--gold);",
    onclick: () => { STATE.activeLeague = "wc_" + WORLDCUP_GROUP_ORDER[0]; STATE.activeSeason = "2026"; saveState(); render(); }
  }, "🏆 World Cup 2026"));

  const seasons = document.getElementById("season-row");
  seasons.innerHTML = "";
  if (isWorldCupActive()) {
    WORLDCUP_GROUP_ORDER.forEach(letter => {
      const leagueId = "wc_" + letter;
      seasons.appendChild(el("button", {
        class: "season-pill" + (STATE.activeLeague === leagueId ? " active" : ""),
        onclick: () => { STATE.activeLeague = leagueId; saveState(); render(); }
      }, "Group " + letter));
    });
  } else {
    SEASONS.forEach(s => {
      seasons.appendChild(el("button", {
        class: "season-pill" + (STATE.activeSeason === s ? " active" : ""),
        onclick: () => { STATE.activeSeason = s; saveState(); render(); }
      }, s));
    });
  }
}

function renderNav() {
  const nav = document.getElementById("bottom-nav");
  nav.innerHTML = "";
  const items = [
    ["table", "📊", "Table"],
    ["fixtures", "⚽", "Fixtures"],
    ["ratings", "🎚️", "Ratings"],
    ["players", "🏆", "Players"]
  ];
  items.forEach(([id, ico, label]) => {
    nav.appendChild(el("button", {
      class: "nav-btn" + (CURRENT_SCREEN === id ? " active" : ""),
      onclick: () => { CURRENT_SCREEN = id; render(); }
    }, el("span", { class: "ico" }, ico), label));
  });
}

// ===== TABLE SCREEN =====
function renderTableScreen() {
  const wrap = el("div");
  const leagueId = STATE.activeLeague, season = STATE.activeSeason;
  const table = computeTable(leagueId, season);
  const played = table.reduce((s, t) => s + t.p, 0) / 2;

  wrap.appendChild(el("div", { class: "section-title" },
    LEAGUES[leagueId].name + " — " + season,
    el("span", { style: "font-family:var(--font-mono);font-size:11px;color:var(--chalk-dim);font-weight:400;" }, played + " played")
  ));

  const card = el("div", { class: "card" });
  const t = el("table", { class: "standings" });
  t.appendChild(el("thead", null, el("tr", null,
    el("th", null, "Club"), el("th", null, "P"), el("th", null, "W"),
    el("th", null, "D"), el("th", null, "L"), el("th", null, "GF"),
    el("th", null, "GA"), el("th", null, "GD"), el("th", null, "PTS"), el("th", null, "Form")
  )));
  const tbody = el("tbody");
  table.forEach(row => {
    const cls = row.pos <= 4 ? "zone-top" : row.pos >= 18 ? "zone-relegation" : "";
    tbody.appendChild(el("tr", { class: cls },
      el("td", null, el("div", { class: "team-name" }, el("span", { class: "pos" }, row.pos), row.short)),
      el("td", null, row.p), el("td", null, row.w), el("td", null, row.d), el("td", null, row.l),
      el("td", null, row.gf), el("td", null, row.ga), el("td", null, (row.gd > 0 ? "+" : "") + row.gd),
      el("td", { class: "pts-col" }, row.pts),
      el("td", null, el("div", { class: "form-dots" }, row.form.map(f => el("span", { class: "form-dot " + f }))))
    ));
  });
  t.appendChild(tbody);
  card.appendChild(t);
  wrap.appendChild(card);
  return wrap;
}

// ===== FIXTURES SCREEN =====
function renderFixturesScreen() {
  const wrap = el("div");
  const leagueId = STATE.activeLeague, season = STATE.activeSeason;
  const fixtures = getFixtures(leagueId, season);
  const results = getResults(leagueId, season);
  const teamMap = {};
  LEAGUES[leagueId].teams.forEach(t => (teamMap[t.id] = t));

  wrap.appendChild(el("div", { class: "section-title" }, "Fixtures — " + season));

  wrap.appendChild(el("div", { class: "btn-row" },
    el("button", {
      class: "btn gold",
      onclick: () => { simulateAllRemaining(leagueId, season); toast("Simulated remaining fixtures"); render(); }
    }, "Simulate rest of season"),
    el("button", {
      class: "btn ghost",
      onclick: () => { if (confirm("Clear all entered results for this season?")) { clearResults(leagueId, season); render(); } }
    }, "Clear results"),
    el("button", {
      class: "btn danger",
      onclick: () => { if (confirm("Regenerate fixtures? This wipes results too.")) { regenerateFixtures(leagueId, season); render(); } }
    }, "Regenerate fixtures")
  ));

  const byMatchday = {};
  fixtures.forEach(f => {
    if (!byMatchday[f.matchday]) byMatchday[f.matchday] = [];
    byMatchday[f.matchday].push(f);
  });

  Object.keys(byMatchday).sort((a, b) => a - b).forEach(md => {
    const group = el("div", { class: "matchday-group" });
    group.appendChild(el("div", { class: "matchday-label" }, "Matchday " + md));
    byMatchday[md].forEach(f => {
      const res = results[f.id];
      const home = teamMap[f.home], away = teamMap[f.away];
      const homeInput = el("input", { type: "number", min: "0", max: "20", value: res ? res.h : "", placeholder: "-" });
      const awayInput = el("input", { type: "number", min: "0", max: "20", value: res ? res.a : "", placeholder: "-" });
      const commit = () => setResult(leagueId, season, f.id, homeInput.value, awayInput.value);
      homeInput.addEventListener("change", () => { commit(); renderScoreOnly(); });
      awayInput.addEventListener("change", () => { commit(); renderScoreOnly(); });
      group.appendChild(el("div", { class: "fixture-row" },
        el("div", { class: "fixture-team home" }, home.short),
        el("div", { class: "score-inputs" }, homeInput, el("span", { class: "score-dash" }, "–"), awayInput),
        el("div", { class: "fixture-team away" }, away.short)
      ));
    });
    wrap.appendChild(group);
  });

  return wrap;
}

function renderScoreOnly() {
  // Lightweight refresh so typing a score doesn't require leaving the fixtures screen,
  // but table stays in sync when user switches tabs.
}

// ===== RATINGS SCREEN =====
function renderRatingsScreen() {
  const wrap = el("div");
  const leagueId = STATE.activeLeague;
  wrap.appendChild(el("div", { class: "section-title" }, LEAGUES[leagueId].name + " — Team Ratings"));
  wrap.appendChild(el("div", { style: "font-size:12px;color:var(--chalk-dim);margin-bottom:10px;" },
    "Adjust each club's overall strength. This is only used when simulating results — it never touches results you've entered yourself."));

  const teams = LEAGUES[leagueId].teams.slice().sort((a, b) => getOvr(leagueId, b.id) - getOvr(leagueId, a.id));
  teams.forEach(team => {
    const val = getOvr(leagueId, team.id);
    const valLabel = el("span", { class: "rval" }, String(val));
    const range = el("input", {
      type: "range", min: "40", max: "99", value: val,
      oninput: (e) => { valLabel.textContent = e.target.value; },
      onchange: (e) => { setOvr(leagueId, team.id, parseInt(e.target.value)); }
    });
    wrap.appendChild(el("div", { class: "rating-row" },
      el("span", { class: "rname" }, team.name), range, valLabel
    ));
  });
  return wrap;
}

// ===== PLAYERS SCREEN =====
function renderPlayersScreen() {
  const wrap = el("div");
  wrap.appendChild(el("div", { class: "section-title" }, "My Players"));

  wrap.appendChild(el("div", { class: "btn-row" },
    el("button", { class: "btn gold", onclick: openAddPlayerForm }, "+ Add player")
  ));

  const board = leaderboard();
  if (board.length === 0) {
    wrap.appendChild(el("div", { class: "empty" },
      el("div", { class: "big" }, "No players yet"),
      el("div", null, "Add your own players and track their goals, assists and ratings here.")
    ));
    return wrap;
  }

  const card = el("div", { class: "card" });
  card.appendChild(el("div", { style: "font-family:var(--font-mono);font-size:10px;color:var(--chalk-dim);text-transform:uppercase;margin-bottom:8px;" }, "Leaderboard — ranked by goals, then assists, then rating"));
  card.appendChild(el("div", { id: "player-list" }));
  wrap.appendChild(card);
  renderPlayerList(card.querySelector("#player-list"));
  return wrap;
}

function renderPlayerList(container) {
  container.innerHTML = "";
  leaderboard().forEach((p, i) => {
    container.appendChild(el("div", { class: "player-card" },
      el("div", { class: "player-ovr" }, String(p.ovr)),
      el("div", { class: "player-info" },
        el("div", { class: "pname" }, (i + 1) + ". " + p.name),
        el("div", { class: "pmeta" }, p.position + " · " + (p.club || "Free agent"))
      ),
      el("div", { class: "player-stats" },
        el("div", { class: "stat" }, el("span", { class: "n" }, p.goals), el("span", { class: "l" }, "Goals")),
        el("div", { class: "stat" }, el("span", { class: "n" }, p.assists), el("span", { class: "l" }, "Assists")),
        el("div", { class: "stat" }, el("span", { class: "n" }, p.rating.toFixed(1)), el("span", { class: "l" }, "Rating"))
      ),
      el("button", { class: "btn ghost", style: "padding:6px 8px;", onclick: () => openEditPlayerForm(p) }, "✎")
    ));
  });
}

function openAddPlayerForm() {
  openPlayerModal(null);
}

function openEditPlayerForm(p) {
  openPlayerModal(p);
}

function openPlayerModal(existing) {
  const overlay = el("div", {
    style: "position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100;display:flex;align-items:flex-end;"
  });
  const sheet = el("div", {
    style: "background:var(--card);width:100%;border-radius:14px 14px 0 0;padding:16px;max-height:85vh;overflow-y:auto;border-top:1px solid var(--line);"
  });

  const fName = mkInput("text", existing ? existing.name : "", "Name");
  const fClub = mkInput("text", existing ? existing.club : "", "Club");
  const fPos = mkSelect(["ST", "CF", "LW", "RW", "CAM", "CM", "CDM", "LB", "RB", "CB", "GK"], existing ? existing.position : "ST");
  const fOvr = mkInput("number", existing ? existing.ovr : 70, "OVR");
  const fApps = mkInput("number", existing ? existing.apps : 0, "Appearances");
  const fGoals = mkInput("number", existing ? existing.goals : 0, "Goals");
  const fAssists = mkInput("number", existing ? existing.assists : 0, "Assists");
  const fCS = mkInput("number", existing ? existing.cleanSheets : 0, "Clean sheets");
  const fRating = mkInput("number", existing ? existing.rating : 6.5, "Avg rating");
  fRating.step = "0.1";

  sheet.appendChild(el("div", { class: "section-title" }, existing ? "Edit player" : "Add player"));
  sheet.appendChild(el("div", { class: "form-grid" },
    field("Name", fName), field("Position", fPos),
    field("Club", fClub), field("OVR", fOvr)
  ));
  sheet.appendChild(el("div", { class: "form-grid" },
    field("Appearances", fApps), field("Goals", fGoals),
    field("Assists", fAssists), field("Clean sheets", fCS)
  ));
  sheet.appendChild(el("div", { class: "form-grid" }, field("Avg rating", fRating)));

  const actions = el("div", { class: "btn-row" },
    el("button", {
      class: "btn gold",
      onclick: () => {
        const data = {
          name: fName.value.trim() || "Unnamed Player",
          club: fClub.value.trim(),
          position: fPos.value,
          ovr: parseInt(fOvr.value) || 70,
          apps: parseInt(fApps.value) || 0,
          goals: parseInt(fGoals.value) || 0,
          assists: parseInt(fAssists.value) || 0,
          cleanSheets: parseInt(fCS.value) || 0,
          rating: parseFloat(fRating.value) || 6.5
        };
        if (existing) updatePlayer(existing.id, data);
        else addPlayer(data);
        document.body.removeChild(overlay);
        render();
      }
    }, existing ? "Save changes" : "Add player")
  );
  if (existing) {
    actions.appendChild(el("button", {
      class: "btn danger",
      onclick: () => {
        if (confirm("Delete " + existing.name + "?")) {
          deletePlayer(existing.id);
          document.body.removeChild(overlay);
          render();
        }
      }
    }, "Delete"));
  }
  actions.appendChild(el("button", { class: "btn ghost", onclick: () => document.body.removeChild(overlay) }, "Cancel"));
  sheet.appendChild(actions);

  overlay.appendChild(sheet);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) document.body.removeChild(overlay); });
  document.body.appendChild(overlay);
}

function mkInput(type, value, placeholder) {
  return el("input", { type, value, placeholder });
}
function mkSelect(options, selected) {
  const s = el("select", null, options.map(o => el("option", { value: o, selected: o === selected ? "selected" : null }, o)));
  return s;
}
function field(label, inputEl) {
  return el("div", { class: "form-field" }, el("label", null, label), inputEl);
}

document.addEventListener("DOMContentLoaded", render);
