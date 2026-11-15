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
    id: 'lagune', name: 'Wolkenlagune', icon: '🫧', theme: 'Lagune mit Himmels- und Unterwasserhaus',
    unlock: 1e12, ready: false, build: 'baustelle',
    spawn: { x: 0, z: 10, yaw: 0 }, portal: { x: 0, z: 0 }, walkRadius: 40,
    sky: { top: '#7cc4ff', bottom: '#c9f1ff', hemiSky: '#dff4ff', hemiGround: '#5a9bb0', sun: '#fff1d6' },
    houses: [],
    npcPaths: [],
  },
  {
    id: 'frost', name: 'Frostgipfel', icon: '🏔️', theme: 'Verschneite Berge (Gerüst)',
    unlock: 1e16, ready: false, build: 'baustelle',
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
