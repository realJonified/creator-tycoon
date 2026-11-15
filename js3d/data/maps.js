// Maps (Welten). Eine neue Map = ein neuer Eintrag hier plus eine Bau-Funktion in js3d/scene/maps/.
// Es ist immer nur EINE Map geladen. Geld, Abos und PC-Teile gelten auf allen Maps,
// gekaufte Häuser werden pro Map gespeichert. ids dürfen sich nie mehr ändern (Spielstand!).
//
// Felder:
//   id, name, icon, theme      Anzeige auf der Weltkarte
//   unlock                     Freischaltpreis in € (Map 1: 0). Maps werden der Reihe nach freigeschaltet.
//   ready                      false = Map ist angelegt, aber noch nicht gebaut ("Kommt bald")
//   build                      Name der Bau-Funktion in js3d/scene/maps/index.js
//   spawn, portal, walkRadius  Startpunkt, Portal (Weltkarte), begehbarer Radius
//   sky                        Himmel- und Lichtstimmung
//   houses                     Häuser: Position, Preis, Grösse, Typ, Farben (Reihenfolge = Kaufreihenfolge)
//   npcPaths                   Wege der NPC-YouTuber (Wegpunkte), folgt in Etappe 3
export const MAPS = [
  {
    id: 'bucht', name: 'Kanalbucht', icon: '🏝️', theme: 'Sonnige Insel mit Strand',
    unlock: 0, ready: true, build: 'bucht',
    spawn: { x: 0, z: 19, yaw: 0 }, portal: { x: 0, z: 2.2 }, walkRadius: 78.5,
    sky: { top: '#5fa8ff', bottom: '#ffd9b0', hemiSky: '#cfe6ff', hemiGround: '#6f8f4a', sun: '#ffe0b5' },
    houses: [
      { id: 'wohnung', name: 'Kleine Wohnung', size: 50,  price: 0,   x: 0,   z: -38, rot: 0,           wall: '#e9d8b4', roof: '#8a5a44', floors: 3, kind: 'block' },
      { id: 'strand1', name: 'Strandhütte',    size: 75,  price: 5e4, x: -58, z: -26, rot: Math.PI / 2, wall: '#fff4e0', roof: '#2fb3c6', floors: 1, kind: 'haus' },
      { id: 'strand2', name: 'Dünenhaus',      size: 110, price: 5e5, x: -60, z: -6,  rot: Math.PI / 2, wall: '#ffe3c2', roof: '#e2725b', floors: 1, kind: 'haus' },
      { id: 'strand3', name: 'Muschelvilla',   size: 160, price: 5e6, x: -60, z: 14,  rot: Math.PI / 2, wall: '#ffffff', roof: '#4c9be8', floors: 2, kind: 'haus' },
      { id: 'strand4', name: 'Leuchtturmhaus', size: 230, price: 5e7, x: -56, z: 34,  rot: Math.PI / 2, wall: '#f3f0ea', roof: '#d1495b', floors: 2, kind: 'turm' },
    ],
    npcPaths: [],
  },
  {
    // Ringinsel um eine Lagune. Mitte = Wasser. Zonen: Boden (Ring), Himmel (schwebende Insel, per
    // Sprungpad), Meeresgrund (per Tauchsteg). Häuser mit zone stehen auf dieser Ebene.
    id: 'lagune', name: 'Wolkenlagune', icon: '🫧', theme: 'Lagune mit Himmels- und Unterwasserhaus',
    unlock: 1e12, ready: true, build: 'lagune',
    spawn: { x: 0, z: 52, yaw: 0 }, portal: { x: 0, z: 58 }, walkRadius: 70,
    lagoonRadius: 24,
    sky: { top: '#6fbcff', bottom: '#c9f1ff', hemiSky: '#e3f6ff', hemiGround: '#4f9bb5', sun: '#fff1d6' },
    zones: {
      sky:   { y: 16, x: 40, z: -40, r: 13, label: 'Wolkeninsel' },
      under: { y: -7, x: 0,  z: 0,   r: 21, label: 'Lagunengrund' },
    },
    houses: [
      { id: 'pfahl',   name: 'Pfahlhaus',        size: 330,  price: 2e12, x: -40, z: 34,  rot: Math.PI * 0.75,  wall: '#d8b98c', roof: '#7a4b2a', floors: 1, kind: 'haus' },
      { id: 'riff',    name: 'Riffvilla',        size: 480,  price: 2e13, x: -54, z: 4,   rot: Math.PI / 2,     wall: '#fdf6e3', roof: '#ff7f6e', floors: 2, kind: 'villa' },
      { id: 'duene',   name: 'Dünenturm',        size: 700,  price: 2e14, x: -40, z: -38, rot: Math.PI * 0.25,  wall: '#f5e6c8', roof: '#2a9d8f', floors: 2, kind: 'turm' },
      { id: 'wolken',  name: 'Wolkenhaus',       size: 1000, price: 2e15, x: 43,  z: -43, rot: Math.PI * 0.25,  wall: '#ffffff', roof: '#8ecae6', floors: 2, kind: 'haus', zone: 'sky' },
      { id: 'kuppel',  name: 'Tiefseekuppel',    size: 1500, price: 2e16, x: 0,   z: -8,  rot: 0,               wall: '#9fe7f5', roof: '#1d7fa3', floors: 1, kind: 'kuppel', zone: 'under' },
      { id: 'segel',   name: 'Segelloft',        size: 2200, price: 2e17, x: 54,  z: 6,   rot: -Math.PI / 2,    wall: '#e6eef5', roof: '#264653', floors: 3, kind: 'block' },
      { id: 'palast',  name: 'Lagunenpalast',    size: 3300, price: 2e18, x: 38,  z: 38,  rot: -Math.PI * 0.75, wall: '#fff3cf', roof: '#e9c46a', floors: 3, kind: 'villa' },
    ],
    npcPaths: [],
  },
  {
    id: 'frost', name: 'Frostgipfel', icon: '🏔️', theme: 'Verschneite Berge (Gerüst)',
    unlock: 1e16, ready: false, build: 'frost',
    spawn: { x: 0, z: 10, yaw: 0 }, portal: { x: 0, z: 0 }, walkRadius: 40,
    sky: { top: '#9fb8d8', bottom: '#eef4fb', hemiSky: '#f1f6ff', hemiGround: '#b8c4d4', sun: '#ffffff' },
    houses: [],
    npcPaths: [],
  },
];

export const findMap = id => MAPS.find(m => m.id === id) || null;
export const mapIndex = id => MAPS.findIndex(m => m.id === id);

// Alle Häuser über alle Maps, in globaler Reihenfolge (für den Hausbonus und die Innenräume).
export const ALL_HOUSES = MAPS.flatMap(m => m.houses.map(h => ({ ...h, map: m.id })));
