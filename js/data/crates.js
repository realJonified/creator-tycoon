// Kisten, Hoverboards und PC-Teile. Kisten öffnet man mit Juwelen 💎.

// Seltenheiten: Reihenfolge = aufsteigend. refund = Juwelen zurück für Doppelte.
export const RARITIES = [
  { id: 'gewoehnlich', name: 'Gewöhnlich', color: '#9ca3af', refund: 4 },
  { id: 'selten',      name: 'Selten',     color: '#3b82f6', refund: 10 },
  { id: 'episch',      name: 'Episch',     color: '#a855f7', refund: 25 },
  { id: 'legendaer',   name: 'Legendär',   color: '#f59e0b', refund: 80 },
];

// odds = Wahrscheinlichkeit je Seltenheit (Summe 1). pool = was drin sein kann.
export const CRATES = [
  { id: 'board', icon: '🛹', name: 'Hoverboard-Kiste', cost: 30,  pool: ['board'],         odds: { gewoehnlich: 0.6,  selten: 0.28, episch: 0.1,  legendaer: 0.02 } },
  { id: 'teile', icon: '🔧', name: 'PC-Teile-Kiste',   cost: 45,  pool: ['part'],          odds: { gewoehnlich: 0.6,  selten: 0.28, episch: 0.1,  legendaer: 0.02 } },
  { id: 'gold',  icon: '👑', name: 'Goldkiste',        cost: 150, pool: ['board', 'part'], odds: { gewoehnlich: 0.25, selten: 0.4,  episch: 0.25, legendaer: 0.1 } },
];

// Hoverboards: eines kann man ausrüsten. bonus.type: money | subs | views | upload
export const BOARDS = [
  { id: 'brett',    name: 'Holzbrett-Gleiter',  rarity: 'gewoehnlich', color: '#c08552', bonus: { type: 'money',  value: 0.1 } },
  { id: 'minz',     name: 'Minzflitzer',        rarity: 'gewoehnlich', color: '#6ee7b7', bonus: { type: 'subs',   value: 0.1 } },
  { id: 'wolke',    name: 'Wölkchen',           rarity: 'gewoehnlich', color: '#e0f2fe', bonus: { type: 'upload', value: 0.15 } },
  { id: 'kaktus',   name: 'Kaktus-Kurver',      rarity: 'gewoehnlich', color: '#65a30d', bonus: { type: 'views',  value: 0.1 } },
  { id: 'blitz',    name: 'Blitzbrett',         rarity: 'selten',      color: '#facc15', bonus: { type: 'upload', value: 0.4 } },
  { id: 'welle',    name: 'Wellenreiter',       rarity: 'selten',      color: '#38bdf8', bonus: { type: 'subs',   value: 0.3 } },
  { id: 'kirsch',   name: 'Kirschblüte',        rarity: 'selten',      color: '#f9a8d4', bonus: { type: 'money',  value: 0.3 } },
  { id: 'neon',     name: 'Neon-Nachtfalter',   rarity: 'episch',      color: '#c084fc', bonus: { type: 'views',  value: 0.75 } },
  { id: 'lava',     name: 'Lavagleiter',        rarity: 'episch',      color: '#f97316', bonus: { type: 'money',  value: 0.8 } },
  { id: 'polar',    name: 'Polarlicht',         rarity: 'episch',      color: '#5eead4', bonus: { type: 'subs',   value: 0.75 } },
  { id: 'phoenix',  name: 'Phönixschweif',      rarity: 'legendaer',   color: '#fb923c', bonus: { type: 'views',  value: 2 } },
  { id: 'galaxis',  name: 'Galaxis-Surfer',     rarity: 'legendaer',   color: '#818cf8', bonus: { type: 'subs',   value: 2 } },
];

// PC-Teile: pro Steckplatz zählt das beste Teil. Sie wirken stärker als gekaufte Geräte.
export const SLOTS = [
  { id: 'cpu', icon: '🧠', name: 'Prozessor',   effect: 'record' },
  { id: 'gpu', icon: '🎮', name: 'Grafikkarte', effect: 'record' },
  { id: 'ram', icon: '🧩', name: 'Speicher',    effect: 'cut' },
  { id: 'ssd', icon: '💾', name: 'Festplatte',  effect: 'upload' },
];

// bonus = +Anteil auf die Wirkung des Steckplatzes (1 = +100 %)
export const PARTS = [
  { id: 'cpu1', slot: 'cpu', name: 'Rechenkern Kiesel',  rarity: 'gewoehnlich', bonus: 0.2 },
  { id: 'cpu2', slot: 'cpu', name: 'Rechenkern Blitz',   rarity: 'selten',      bonus: 0.5 },
  { id: 'cpu3', slot: 'cpu', name: 'Rechenkern Vulkan',  rarity: 'episch',      bonus: 1.2 },
  { id: 'cpu4', slot: 'cpu', name: 'Rechenkern Supernova', rarity: 'legendaer', bonus: 3 },
  { id: 'gpu1', slot: 'gpu', name: 'Pixelpumpe 1',       rarity: 'gewoehnlich', bonus: 0.2 },
  { id: 'gpu2', slot: 'gpu', name: 'Pixelpumpe Turbo',   rarity: 'selten',      bonus: 0.5 },
  { id: 'gpu3', slot: 'gpu', name: 'Farbwerfer Ultra',   rarity: 'episch',      bonus: 1.2 },
  { id: 'gpu4', slot: 'gpu', name: 'Regenbogen-Reaktor', rarity: 'legendaer',   bonus: 3 },
  { id: 'ram1', slot: 'ram', name: 'Merkriegel 4',       rarity: 'gewoehnlich', bonus: 0.2 },
  { id: 'ram2', slot: 'ram', name: 'Merkriegel 16',      rarity: 'selten',      bonus: 0.5 },
  { id: 'ram3', slot: 'ram', name: 'Gedächtnispalast',   rarity: 'episch',      bonus: 1.2 },
  { id: 'ram4', slot: 'ram', name: 'Elefantengedächtnis', rarity: 'legendaer',  bonus: 3 },
  { id: 'ssd1', slot: 'ssd', name: 'Datenkiste',         rarity: 'gewoehnlich', bonus: 0.2 },
  { id: 'ssd2', slot: 'ssd', name: 'Flitzspeicher',      rarity: 'selten',      bonus: 0.5 },
  { id: 'ssd3', slot: 'ssd', name: 'Warp-Laufwerk',      rarity: 'episch',      bonus: 1.2 },
  { id: 'ssd4', slot: 'ssd', name: 'Lichtspeicher',      rarity: 'legendaer',   bonus: 3 },
];
