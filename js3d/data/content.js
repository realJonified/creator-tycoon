// Inhalte der 3D-Welt. Neue Inhalte = eine neue Zeile. Eine id darf sich nie mehr ändern.

// Spiele für Videos (selbst erfunden). points = Punkte pro Buchstabe, pace = Tempo der Buchstaben.
export const GAMES = [
  { id: 'kugel',   icon: '🟣', name: 'Kugelkönig',        points: 1,   pace: 1,    money: 1,   subs: 1,   minSubs: 0 },
  { id: 'moos',    icon: '🌿', name: 'Moosmonster',       points: 1.3, pace: 0.95, money: 1.2, subs: 0.9, minSubs: 200 },
  { id: 'toaster', icon: '🍞', name: 'Toaster-Tycoon',    points: 1.8, pace: 0.9,  money: 0.9, subs: 1.5, minSubs: 3000 },
  { id: 'kometen', icon: '☄️', name: 'Kometenkurier',     points: 3,   pace: 0.82, money: 1.3, subs: 1.2, minSubs: 50000 },
  { id: 'eulen',   icon: '🦉', name: 'Eulenakademie',     points: 5,   pace: 0.75, money: 1.2, subs: 1.5, minSubs: 1e6 },
  { id: 'magma',   icon: '🌋', name: 'Magma-Minigolf',    points: 9,   pace: 0.68, money: 1.5, subs: 1.4, minSubs: 3e7 },
  { id: 'nebel',   icon: '🌫️', name: 'Nebelpiraten',      points: 16,  pace: 0.62, money: 1.6, subs: 1.6, minSubs: 1e9 },
];

// PC-Teile im Shop. Jeder Kauf hebt die Stufe um 1. Preis = base × growth ^ Stufe.
// quality = Qualitäts-Plus pro Stufe (Video besser), speed = Upload-Tempo × speed ^ Stufe.
export const PARTS = [
  { id: 'cpu',      icon: '🧠', name: 'Prozessor',   base: 900,  growth: 1.55, quality: 0.18 },
  { id: 'gpu',      icon: '🎮', name: 'Grafikkarte', base: 1500, growth: 1.6,  quality: 0.25 },
  { id: 'maus',     icon: '🖱️', name: 'Maus',        base: 250,  growth: 1.5,  quality: 0.07, cut: 0.15 },
  { id: 'tastatur', icon: '⌨️', name: 'Tastatur',    base: 350,  growth: 1.5,  quality: 0.07, cut: 0.15 },
  { id: 'monitor',  icon: '🖥️', name: 'Monitor',     base: 1100, growth: 1.55, quality: 0.14 },
  { id: 'router',   icon: '📶', name: 'WLAN-Router', base: 600,  growth: 1.6,  quality: 0,    speed: 1.35 },
];

// Häuser: die Wohnung ist kostenlos, dann 50.000 € und jedes weitere × 10.
// size = Quadratmeter, x/z/rot = Lage in der Welt, wall/roof = Farben, floors = Stockwerke.
export const HOUSES = [
  { id: 'wohnung',  name: 'Kleine Wohnung',   size: 50,    price: 0,      x: 0,   z: -38, rot: 0,            wall: '#e9d8b4', roof: '#8a5a44', floors: 3, kind: 'block' },
  { id: 'strand1',  name: 'Strandhütte',      size: 75,    price: 5e4,    x: -58, z: -26, rot: Math.PI / 2,  wall: '#fff4e0', roof: '#2fb3c6', floors: 1, kind: 'haus' },
  { id: 'strand2',  name: 'Dünenhaus',        size: 110,   price: 5e5,    x: -60, z: -6,  rot: Math.PI / 2,  wall: '#ffe3c2', roof: '#e2725b', floors: 1, kind: 'haus' },
  { id: 'strand3',  name: 'Muschelvilla',     size: 160,   price: 5e6,    x: -60, z: 14,  rot: Math.PI / 2,  wall: '#ffffff', roof: '#4c9be8', floors: 2, kind: 'haus' },
  { id: 'strand4',  name: 'Leuchtturmhaus',   size: 230,   price: 5e7,    x: -56, z: 34,  rot: Math.PI / 2,  wall: '#f3f0ea', roof: '#d1495b', floors: 2, kind: 'turm' },
  { id: 'wald',     name: 'Waldhaus',         size: 330,   price: 5e8,    x: -30, z: 52,  rot: Math.PI,      wall: '#a9744f', roof: '#3f6b3a', floors: 2, kind: 'haus' },
  { id: 'hang',     name: 'Hangvilla',        size: 480,   price: 5e9,    x: 6,   z: 58,  rot: Math.PI,      wall: '#f4ead2', roof: '#6b4a8f', floors: 2, kind: 'villa' },
  { id: 'teich',    name: 'Teichloft',        size: 700,   price: 5e10,   x: 36,  z: 46,  rot: Math.PI,      wall: '#8fb8c9', roof: '#30475e', floors: 3, kind: 'block' },
  { id: 'glas',     name: 'Glaspalast',       size: 1000,  price: 5e11,   x: 56,  z: -34, rot: -Math.PI / 2, wall: '#bfe8f5', roof: '#3fa7c9', floors: 3, kind: 'villa' },
  { id: 'burg',     name: 'Burg Bucht',       size: 1500,  price: 5e12,   x: 34,  z: -54, rot: 0,            wall: '#b5aea6', roof: '#7f1d1d', floors: 3, kind: 'turm' },
  { id: 'himmel',   name: 'Himmelsturm',      size: 2200,  price: 5e13,   x: -32, z: -50, rot: 0,            wall: '#d6dde8', roof: '#f2b134', floors: 6, kind: 'block' },
  { id: 'krone',    name: 'Kronenschloss',    size: 3300,  price: 5e14,   x: -6,  z: -62, rot: 0,            wall: '#fff3cf', roof: '#e0a400', floors: 4, kind: 'turm' },
];

// Play-Buttons: Meilensteine nach Abonnenten. Eigenes Design (Stern im Rahmen), Farbe = Material.
export const BUTTONS = [
  { id: 'silber',   name: 'Silberner Kanalknopf',   subs: 1e5,  color: '#d7dde4' },
  { id: 'gold',     name: 'Goldener Kanalknopf',    subs: 1e6,  color: '#f2c14e' },
  { id: 'diamant',  name: 'Diamant-Kanalknopf',     subs: 1e7,  color: '#a5f3fc' },
  { id: 'rubin',    name: 'Rubin-Kanalknopf',       subs: 1e8,  color: '#e11d48' },
  { id: 'saphir',   name: 'Saphir-Kanalknopf',      subs: 5e8,  color: '#2563eb' },
  { id: 'smaragd',  name: 'Smaragd-Kanalknopf',     subs: 1e9,  color: '#10b981' },
  { id: 'stern',    name: 'Sternen-Kanalknopf',     subs: 5e10, color: '#fde047' },
  { id: 'galaxie',  name: 'Galaxie-Kanalknopf',     subs: 5e11, color: '#8b5cf6' },
  { id: 'kosmos',   name: 'Kosmos-Kanalknopf',      subs: 1e12, color: '#f472b6' },
];

// Boss-Kiste. odds = Wahrscheinlichkeit (Summe 1), videos = Geld im Wert von so vielen
// durchschnittlichen Videos, charm = Chance auf einen dauerhaften Glücksbringer.
export const RARITIES = [
  { id: 'gewoehnlich', name: 'Gewöhnlich', color: '#9ca3af', odds: 0.72, videos: 2,   subs: 0,    charm: 0 },
  { id: 'selten',      name: 'Selten',     color: '#3b82f6', odds: 0.22, videos: 6,   subs: 0.01, charm: 0 },
  { id: 'episch',      name: 'Episch',     color: '#a855f7', odds: 0.05, videos: 20,  subs: 0.03, charm: 1 },
  { id: 'legendaer',   name: 'Legendär',   color: '#f59e0b', odds: 0.01, videos: 80,  subs: 0.1,  charm: 1 },
];

// Glücksbringer aus Boss-Kisten: dauerhafter Aufrufe-Bonus, stapelbar.
export const CHARMS = [
  { id: 'kleeblatt', icon: '🍀', name: 'Pixel-Kleeblatt', rarity: 'episch',    bonus: 0.1 },
  { id: 'kristall',  icon: '🔮', name: 'Glitzerkristall', rarity: 'episch',    bonus: 0.1 },
  { id: 'krone',     icon: '👑', name: 'Golemkrone',      rarity: 'legendaer', bonus: 0.5 },
];
