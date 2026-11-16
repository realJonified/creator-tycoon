// ALLE Zahlen der 3D-Welt an einem Ort: Wirtschaft, Preise, Kiste, Boss, Video.
// Die Inhaltsdateien (content.js, maps.js) holen ihre Zahlen von hier. Nach Änderungen:
//   node tools/balance-welt.js     (Simulation, zeigt ob die Ziele stimmen)
//   node --test                    (u. a. Test der Balancing-Ziele)
export const W = {
  // ---------- Video: Aufnahme ----------
  recordSeconds: 15,
  letterEvery: 0.7,       // Sekunden zwischen Buchstaben (× Tempo des Spiels)
  letterLife: 2.2,        // so lange bleibt ein Buchstabe stehen
  letterPoints: 10,
  comboStep: 0.05,        // +5 % pro Treffer in Folge …
  comboMax: 20,           // … höchstens +100 %
  // ---------- Video: Schnitt ----------
  cutSeconds: 10,
  cutNeed: 60,            // so viele Tipper ergeben Qualität 100 %
  qualityCap: 2,
  qualityBase: 0.4,
  // ---------- Video: Upload ----------
  uploadMB: 100,
  baseMBs: 2.5,           // schlechtes WLAN: 100 MB / 2,5 MB/s = 40 s
  minUploadSeconds: 1,

  // ---------- Wirtschaft ----------
  audienceLog: 0.5,       // Reichweite = 1 + log10(1 + Abos) × audienceLog
  moneyPerView: 0.035,    // abgestimmt mit tools/balance-welt.js (Map 1 in ~4 h, 1 Bio. ~4 h danach)
  subsPerView: 1.1,       // neue Abos = subsPerView × Aufrufe ^ subsExp
  subsExp: 0.45,
  passiveViewsPerSub: 0.1, // alte Videos: Aufrufe pro Abo und Sekunde (nur Geld)
  buttonBonus: 0.25,      // Aufrufe-Bonus pro Play-Button
  houseMult: 2.5,         // jedes Haus (globale Reihenfolge über alle Maps): Aufrufe × houseMult
  offlineRate: 0.5,
  offlineMaxSeconds: 8 * 3600,
  // Ungefährer Wert eines normalen Videos (für die Kiste): so viele Treffer mit dieser mittleren Serie
  typicalHits: 18,
  typicalCombo: 1.5,
  chestMinMoney: 20000,   // Mindestgeld aus der Kiste: hilft am Anfang, später zählt der Videowert

  // ---------- Maps und Häuser ----------
  mapUnlock: { bucht: 0, lagune: 1e12, frost: 1e16 },
  housePrices: {
    bucht: [0, 5e4, 5e5, 5e6, 5e7],
    lagune: [2e12, 2e13, 2e14, 2e15, 2e16, 2e17, 2e18],
  },

  // ---------- Shop: PC-Teile ----------
  // Preis = base × growth ^ Stufe. quality: Video × (1 + quality) pro Stufe (multiplikativ), cut = Schnitt-Tempo,
  // speed = Upload × speed ^ Stufe. Achtung: Bringt eine Runde aller Teile mehr als ihre Preise steigen, läuft
  // die Wirtschaft davon (Produkt der (1 + quality) muss deutlich unter growth bleiben).
  parts: {
    cpu:      { base: 900,  growth: 1.55, quality: 0.076 },
    gpu:      { base: 1500, growth: 1.6,  quality: 0.105 },
    maus:     { base: 250,  growth: 1.5,  quality: 0.03, cut: 0.15 },
    tastatur: { base: 350,  growth: 1.5,  quality: 0.03, cut: 0.15 },
    monitor:  { base: 1100, growth: 1.55, quality: 0.059 },
    router:   { base: 600,  growth: 1.6,  quality: 0,    speed: 1.35 },
  },

  // ---------- Spiele (Themen für Videos) ----------
  games: {
    kugel:   { points: 1,   pace: 1,    money: 1,   subs: 1,   minSubs: 0 },
    moos:    { points: 1.3, pace: 0.95, money: 1.2, subs: 0.9, minSubs: 200 },
    toaster: { points: 1.8, pace: 0.9,  money: 0.9, subs: 1.5, minSubs: 3000 },
    kometen: { points: 3,   pace: 0.82, money: 1.3, subs: 1.2, minSubs: 50000 },
    eulen:   { points: 5,   pace: 0.75, money: 1.2, subs: 1.5, minSubs: 1e6 },
    magma:   { points: 9,   pace: 0.68, money: 1.5, subs: 1.4, minSubs: 3e7 },
    nebel:   { points: 16,  pace: 0.62, money: 1.6, subs: 1.6, minSubs: 1e9 },
  },

  // ---------- Play-Buttons (Abo-Meilensteine) ----------
  buttonSubs: [1e5, 1e6, 1e7, 1e8, 5e8, 1e9, 5e10, 5e11, 1e12],

  // ---------- Boss-Kiste ----------
  // odds = Wahrscheinlichkeit (Summe 1), videos = Geld im Wert so vieler normaler Videos,
  // subs = Anteil der eigenen Abos dazu, charm = Chance auf einen Glücksbringer,
  // board = Chance auf ein Kisten-Board dieser Seltenheit (nur eines, das man noch nicht hat)
  rarities: {
    gewoehnlich: { odds: 0.72, videos: 2,  subs: 0,    charm: 0, board: 0 },
    selten:      { odds: 0.22, videos: 6,  subs: 0.01, charm: 0, board: 0.15 },
    episch:      { odds: 0.05, videos: 20, subs: 0.03, charm: 1, board: 0.4 },
    legendaer:   { odds: 0.01, videos: 80, subs: 0.1,  charm: 1, board: 0.6 },
  },
  charms: { kleeblatt: 0.1, kristall: 0.1, krone: 0.5 }, // Aufrufe-Bonus pro Stück

  // ---------- Portal und Boss ----------
  portalEvery: 300,       // alle 5 Minuten …
  portalOpen: 60,         // … für 60 Sekunden offen
  bossHp: 150,
  playerHp: 100,
  shotEvery: 0.35,        // die Waffe schiesst automatisch
  shotDamage: 3,
  attackEvery: 2.6,       // der Boss greift alle paar Sekunden an
  attackWarn: 1.1,        // so lange ist der Zielkreis vorher zu sehen
  attackRadius: 3.2,
  attackDamage: 34,       // drei Treffer und man verliert
  arenaRadius: 17,

  // ---------- Hoverboards (Update 3) ----------
  // Ein Board verkürzt nur Wege, es bringt kein Geld. Zum Vergleich: gehen 6, rennen 10 Einheiten/s.
  board: {
    hover: 0.38,          // so hoch schwebt das Deck über dem Boden
    friction: 1.4,        // Abbremsen ohne Eingabe (pro Sekunde, exponentiell)
    grip: 4.5,            // wie schnell die Fahrt in Blickrichtung des Boards einschwenkt (weniger = mehr Rutschen)
    bounce: 0.25,         // Abprallen an Wänden (0 = kleben, 1 = voll zurück)
    maxLean: 0.32,        // Neigung in Kurven (rad)
    underwater: 0.55,     // unter Wasser: Tempo und Beschleunigung × diesen Faktor
    parkSeconds: 3,       // nach dem Absteigen schwebt das Board noch so lange an der Stelle
  },
  // Pro Board: speed = Höchsttempo, accel = Beschleunigung, turn = Wendigkeit (rad/s)
  boards: {
    kiesel:       { speed: 14, accel: 16, turn: 3.0 },  // gewöhnlich, hat jeder
    brise:        { speed: 15, accel: 18, turn: 3.3 },  // gewöhnlich, Shop
    koralle:      { speed: 17, accel: 21, turn: 3.6 },  // selten, Shop
    polar:        { speed: 17, accel: 20, turn: 4.2 },  // selten, nur Kiste (wendiger)
    nordlicht:    { speed: 20, accel: 25, turn: 4.0 },  // episch, Shop
    funkenflug:   { speed: 20, accel: 27, turn: 4.4 },  // episch, nur Kiste
    sonnenwind:   { speed: 23, accel: 30, turn: 4.6 },  // legendär, Shop
    sternenstaub: { speed: 24, accel: 33, turn: 4.9 },  // legendär, nur Kiste
  },
  // Shop-Preise (teurer je Seltenheit). Boards ohne Preis gibt es nur aus Boss-Kisten.
  boardPrices: { brise: 25e3, koralle: 2.5e6, nordlicht: 5e8, sonnenwind: 5e10 },
  // Spur hinter dem Board: höchstens so viele Teilchen gleichzeitig (bei Grafik Niedrig keine Spur)
  trailMax: 120,

  maxValue: 1e300,        // Obergrenze, damit nie "Infinity" im Spielstand landet
};
