// ===== LEAGUE & TEAM DATA =====
// Default OVR strength ratings are starting points only — editable in-app (Team Ratings screen).
// Fixtures are generated (round-robin, strength-balanced), not scraped real-world schedules.

const LEAGUES = {
  epl: {
    name: "Premier League",
    country: "England",
    color: "#3d195b",
    teams: [
      { id: "ars", name: "Arsenal", short: "ARS", ovr: 87 },
      { id: "avl", name: "Aston Villa", short: "AVL", ovr: 80 },
      { id: "bou", name: "Bournemouth", short: "BOU", ovr: 76 },
      { id: "bre", name: "Brentford", short: "BRE", ovr: 77 },
      { id: "bha", name: "Brighton", short: "BHA", ovr: 79 },
      { id: "bur", name: "Burnley", short: "BUR", ovr: 72 },
      { id: "che", name: "Chelsea", short: "CHE", ovr: 84 },
      { id: "cry", name: "Crystal Palace", short: "CRY", ovr: 78 },
      { id: "eve", name: "Everton", short: "EVE", ovr: 76 },
      { id: "ful", name: "Fulham", short: "FUL", ovr: 77 },
      { id: "lee", name: "Leeds United", short: "LEE", ovr: 73 },
      { id: "liv", name: "Liverpool", short: "LIV", ovr: 88 },
      { id: "mci", name: "Manchester City", short: "MCI", ovr: 89 },
      { id: "mun", name: "Manchester United", short: "MUN", ovr: 82 },
      { id: "new", name: "Newcastle United", short: "NEW", ovr: 83 },
      { id: "nfo", name: "Nottingham Forest", short: "NFO", ovr: 78 },
      { id: "sun", name: "Sunderland", short: "SUN", ovr: 73 },
      { id: "tot", name: "Tottenham Hotspur", short: "TOT", ovr: 81 },
      { id: "whu", name: "West Ham United", short: "WHU", ovr: 77 },
      { id: "wol", name: "Wolverhampton", short: "WOL", ovr: 75 }
    ]
  },
  laliga: {
    name: "La Liga",
    country: "Spain",
    color: "#ee8707",
    teams: [
      { id: "rma", name: "Real Madrid", short: "RMA", ovr: 89 },
      { id: "fcb", name: "Barcelona", short: "BAR", ovr: 88 },
      { id: "atm", name: "Atletico Madrid", short: "ATM", ovr: 84 },
      { id: "ath", name: "Athletic Bilbao", short: "ATH", ovr: 80 },
      { id: "vil", name: "Villarreal", short: "VIL", ovr: 79 },
      { id: "bet", name: "Real Betis", short: "BET", ovr: 78 },
      { id: "rso", name: "Real Sociedad", short: "RSO", ovr: 78 },
      { id: "sev", name: "Sevilla", short: "SEV", ovr: 76 },
      { id: "val", name: "Valencia", short: "VAL", ovr: 76 },
      { id: "cel", name: "Celta Vigo", short: "CEL", ovr: 75 },
      { id: "osa", name: "Osasuna", short: "OSA", ovr: 74 },
      { id: "gir", name: "Girona", short: "GIR", ovr: 75 },
      { id: "ray", name: "Rayo Vallecano", short: "RAY", ovr: 75 },
      { id: "get", name: "Getafe", short: "GET", ovr: 73 },
      { id: "mal", name: "Mallorca", short: "MAL", ovr: 73 },
      { id: "ala", name: "Alaves", short: "ALA", ovr: 72 },
      { id: "esp", name: "Espanyol", short: "ESP", ovr: 72 },
      { id: "lev", name: "Levante", short: "LEV", ovr: 70 },
      { id: "elc", name: "Elche", short: "ELC", ovr: 70 },
      { id: "ovi", name: "Real Oviedo", short: "OVI", ovr: 69 }
    ]
  },
  seriea: {
    name: "Serie A",
    country: "Italy",
    color: "#0068a8",
    teams: [
      { id: "int", name: "Inter Milan", short: "INT", ovr: 87 },
      { id: "mil", name: "AC Milan", short: "MIL", ovr: 83 },
      { id: "juv", name: "Juventus", short: "JUV", ovr: 82 },
      { id: "nap", name: "Napoli", short: "NAP", ovr: 85 },
      { id: "rom", name: "Roma", short: "ROM", ovr: 80 },
      { id: "laz", name: "Lazio", short: "LAZ", ovr: 79 },
      { id: "ata", name: "Atalanta", short: "ATA", ovr: 81 },
      { id: "fio", name: "Fiorentina", short: "FIO", ovr: 77 },
      { id: "bol", name: "Bologna", short: "BOL", ovr: 78 },
      { id: "tor", name: "Torino", short: "TOR", ovr: 74 },
      { id: "udi", name: "Udinese", short: "UDI", ovr: 73 },
      { id: "gen", name: "Genoa", short: "GEN", ovr: 73 },
      { id: "cag", name: "Cagliari", short: "CAG", ovr: 72 },
      { id: "ver", name: "Hellas Verona", short: "VER", ovr: 71 },
      { id: "par", name: "Parma", short: "PAR", ovr: 72 },
      { id: "com", name: "Como", short: "COM", ovr: 74 },
      { id: "lec", name: "Lecce", short: "LEC", ovr: 70 },
      { id: "cre", name: "Cremonese", short: "CRE", ovr: 69 },
      { id: "sas", name: "Sassuolo", short: "SAS", ovr: 71 },
      { id: "pis", name: "Pisa", short: "PIS", ovr: 68 }
    ]
  },
  ligue1: {
    name: "Ligue 1",
    country: "France",
    color: "#dae025",
    teams: [
      { id: "psg", name: "Paris Saint-Germain", short: "PSG", ovr: 88 },
      { id: "mar", name: "Marseille", short: "MAR", ovr: 80 },
      { id: "mon", name: "Monaco", short: "MON", ovr: 80 },
      { id: "lil", name: "Lille", short: "LIL", ovr: 78 },
      { id: "lyo", name: "Lyon", short: "LYO", ovr: 78 },
      { id: "nic", name: "Nice", short: "NIC", ovr: 76 },
      { id: "len", name: "Lens", short: "LEN", ovr: 76 },
      { id: "ren", name: "Rennes", short: "REN", ovr: 76 },
      { id: "str", name: "Strasbourg", short: "STR", ovr: 74 },
      { id: "tou", name: "Toulouse", short: "TOU", ovr: 73 },
      { id: "nan", name: "Nantes", short: "NAN", ovr: 72 },
      { id: "bre1", name: "Brest", short: "BRE", ovr: 73 },
      { id: "rei", name: "Reims", short: "REI", ovr: 72 },
      { id: "ang", name: "Angers", short: "ANG", ovr: 70 },
      { id: "auх", name: "Auxerre", short: "AUX", ovr: 71 },
      { id: "hav", name: "Le Havre", short: "HAV", ovr: 70 },
      { id: "met", name: "Metz", short: "MET", ovr: 69 },
      { id: "pfc", name: "Paris FC", short: "PFC", ovr: 72 },
      { id: "lor", name: "Lorient", short: "LOR", ovr: 70 },
      { id: "pau", name: "Pau FC", short: "PAU", ovr: 67 }
    ]
  },
  bundesliga: {
    name: "Bundesliga",
    country: "Germany",
    color: "#d20515",
    teams: [
      { id: "fcb2", name: "Bayern Munich", short: "FCB", ovr: 89 },
      { id: "bvb", name: "Borussia Dortmund", short: "BVB", ovr: 82 },
      { id: "b04", name: "Bayer Leverkusen", short: "B04", ovr: 83 },
      { id: "rbl", name: "RB Leipzig", short: "RBL", ovr: 81 },
      { id: "sge", name: "Eintracht Frankfurt", short: "SGE", ovr: 78 },
      { id: "vfb", name: "VfB Stuttgart", short: "VFB", ovr: 79 },
      { id: "bmg", name: "Borussia Mönchengladbach", short: "BMG", ovr: 75 },
      { id: "wob", name: "VfL Wolfsburg", short: "WOB", ovr: 75 },
      { id: "scf", name: "SC Freiburg", short: "SCF", ovr: 77 },
      { id: "m05", name: "Mainz 05", short: "M05", ovr: 74 },
      { id: "tsg", name: "TSG Hoffenheim", short: "TSG", ovr: 74 },
      { id: "svw", name: "Werder Bremen", short: "SVW", ovr: 74 },
      { id: "fca", name: "FC Augsburg", short: "FCA", ovr: 72 },
      { id: "stp", name: "FC St. Pauli", short: "STP", ovr: 70 },
      { id: "fch", name: "1. FC Heidenheim", short: "FCH", ovr: 70 },
      { id: "fcu", name: "Union Berlin", short: "FCU", ovr: 74 },
      { id: "koe", name: "1. FC Köln", short: "KOE", ovr: 71 },
      { id: "hsv", name: "Hamburger SV", short: "HSV", ovr: 71 },
      { id: "kie", name: "Holstein Kiel", short: "KIE", ovr: 68 },
      { id: "boc", name: "VfL Bochum", short: "BOC", ovr: 69 }
    ]
  }
};

const SEASONS = ["23/24", "24/25", "25/26", "26/27"];

// ===== WORLD CUP 2026 =====
// Official final draw (Dec 5, 2025), 12 groups of 4. Per request: Bosnia and
// Herzegovina (Group B) replaced with Serbia.
const WORLDCUP_RAW_GROUPS = {
  A: [["mex", "Mexico", 78], ["kor", "South Korea", 74], ["rsa", "South Africa", 68], ["cze", "Czechia", 73]],
  B: [["can", "Canada", 74], ["sui", "Switzerland", 79], ["qat", "Qatar", 68], ["srb", "Serbia", 76]],
  C: [["bra", "Brazil", 87], ["mar", "Morocco", 80], ["sco", "Scotland", 75], ["hai", "Haiti", 63]],
  D: [["usa", "USA", 78], ["par", "Paraguay", 71], ["aus", "Australia", 72], ["tur", "Turkiye", 78]],
  E: [["ger", "Germany", 85], ["ecu", "Ecuador", 73], ["civ", "Ivory Coast", 76], ["cuw", "Curacao", 62]],
  F: [["ned", "Netherlands", 84], ["jpn", "Japan", 79], ["tun", "Tunisia", 70], ["swe", "Sweden", 75]],
  G: [["bel", "Belgium", 81], ["irn", "Iran", 72], ["egy", "Egypt", 73], ["nzl", "New Zealand", 65]],
  H: [["esp", "Spain", 88], ["uru", "Uruguay", 79], ["ksa", "Saudi Arabia", 68], ["cpv", "Cape Verde", 64]],
  I: [["fra", "France", 87], ["sen", "Senegal", 76], ["nor", "Norway", 77], ["irq", "Iraq", 64]],
  J: [["arg", "Argentina", 89], ["aut", "Austria", 76], ["alg", "Algeria", 73], ["jor", "Jordan", 63]],
  K: [["por", "Portugal", 86], ["col", "Colombia", 79], ["uzb", "Uzbekistan", 68], ["cod", "DR Congo", 65]],
  L: [["eng", "England", 85], ["cro", "Croatia", 79], ["pan", "Panama", 68], ["gha", "Ghana", 71]]
};

const WORLDCUP_GROUP_ORDER = Object.keys(WORLDCUP_RAW_GROUPS);

Object.entries(WORLDCUP_RAW_GROUPS).forEach(([letter, teams]) => {
  LEAGUES["wc_" + letter] = {
    name: "World Cup — Group " + letter,
    country: "FIFA World Cup 2026",
    color: "#d7a83d",
    isWorldCupGroup: true,
    groupLetter: letter,
    teams: teams.map(([id, name, ovr]) => ({ id, name, short: id.toUpperCase(), ovr }))
  };
});

