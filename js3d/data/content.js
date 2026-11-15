// Inhalte der 3D-Welt (Namen, Symbole, Farben). Alle Zahlen kommen aus js3d/data/balance.js.
// Neue Inhalte = eine neue Zeile hier plus ihre Zahlen dort. Eine id darf sich nie mehr ändern.
import { W } from './balance.js';

// Spiele für Videos (selbst erfunden). points = Punkte pro Buchstabe, pace = Tempo der Buchstaben.
export const GAMES = [
  { id: 'kugel', icon: '🟣', name: 'Kugelkönig', ...W.games.kugel },
  { id: 'moos', icon: '🌿', name: 'Moosmonster', ...W.games.moos },
  { id: 'toaster', icon: '🍞', name: 'Toaster-Tycoon', ...W.games.toaster },
  { id: 'kometen', icon: '☄️', name: 'Kometenkurier', ...W.games.kometen },
  { id: 'eulen', icon: '🦉', name: 'Eulenakademie', ...W.games.eulen },
  { id: 'magma', icon: '🌋', name: 'Magma-Minigolf', ...W.games.magma },
  { id: 'nebel', icon: '🌫️', name: 'Nebelpiraten', ...W.games.nebel },
];

// PC-Teile im Shop. Jeder Kauf hebt die Stufe um 1. Preis = base × growth ^ Stufe.
// quality = Qualitäts-Plus pro Stufe (Video besser), speed = Upload-Tempo × speed ^ Stufe.
export const PARTS = [
  { id: 'cpu', icon: '🧠', name: 'Prozessor', ...W.parts.cpu },
  { id: 'gpu', icon: '🎮', name: 'Grafikkarte', ...W.parts.gpu },
  { id: 'maus', icon: '🖱️', name: 'Maus', ...W.parts.maus },
  { id: 'tastatur', icon: '⌨️', name: 'Tastatur', ...W.parts.tastatur },
  { id: 'monitor', icon: '🖥️', name: 'Monitor', ...W.parts.monitor },
  { id: 'router', icon: '📶', name: 'WLAN-Router', ...W.parts.router },
];

// Häuser stehen seit Update 2 in js3d/data/maps.js (pro Map). HOUSES ist die Liste über alle Maps
// in globaler Reihenfolge: Index 0 = Wohnung, danach steigt der Hausbonus.
import { ALL_HOUSES } from './maps.js';
export const HOUSES = ALL_HOUSES;

// Häuser aus Version 1, die es auf Map 1 nicht mehr gibt (Map 1 hat seit Update 2 nur 5 Häuser).
// Wer sie besass, bekommt bei der Migration den Kaufpreis zurück.
export const REMOVED_V1_HOUSES = { wald: 5e8, hang: 5e9, teich: 5e10, glas: 5e11, burg: 5e12, himmel: 5e13, krone: 5e14 };

// Play-Buttons: Meilensteine nach Abonnenten. Eigenes Design (Stern im Rahmen), Farbe = Material.
export const BUTTONS = [
  { id: 'silber',   name: 'Silberner Kanalknopf',   subs: W.buttonSubs[0], color: '#d7dde4' },
  { id: 'gold',     name: 'Goldener Kanalknopf',    subs: W.buttonSubs[1], color: '#f2c14e' },
  { id: 'diamant',  name: 'Diamant-Kanalknopf',     subs: W.buttonSubs[2], color: '#a5f3fc' },
  { id: 'rubin',    name: 'Rubin-Kanalknopf',       subs: W.buttonSubs[3], color: '#e11d48' },
  { id: 'saphir',   name: 'Saphir-Kanalknopf',      subs: W.buttonSubs[4], color: '#2563eb' },
  { id: 'smaragd',  name: 'Smaragd-Kanalknopf',     subs: W.buttonSubs[5], color: '#10b981' },
  { id: 'stern',    name: 'Sternen-Kanalknopf',     subs: W.buttonSubs[6], color: '#fde047' },
  { id: 'galaxie',  name: 'Galaxie-Kanalknopf',     subs: W.buttonSubs[7], color: '#8b5cf6' },
  { id: 'kosmos',   name: 'Kosmos-Kanalknopf',      subs: W.buttonSubs[8], color: '#f472b6' },
];

// Boss-Kiste. odds = Wahrscheinlichkeit (Summe 1), videos = Geld im Wert von so vielen
// durchschnittlichen Videos, charm = Chance auf einen dauerhaften Glücksbringer.
export const RARITIES = [
  { id: 'gewoehnlich', name: 'Gewöhnlich', color: '#9ca3af', ...W.rarities.gewoehnlich },
  { id: 'selten',      name: 'Selten',     color: '#3b82f6', ...W.rarities.selten },
  { id: 'episch',      name: 'Episch',     color: '#a855f7', ...W.rarities.episch },
  { id: 'legendaer',   name: 'Legendär',   color: '#f59e0b', ...W.rarities.legendaer },
];

// Glücksbringer aus Boss-Kisten: dauerhafter Aufrufe-Bonus, stapelbar.
export const CHARMS = [
  { id: 'kleeblatt', icon: '🍀', name: 'Pixel-Kleeblatt', rarity: 'episch', bonus: W.charms.kleeblatt },
  { id: 'kristall',  icon: '🔮', name: 'Glitzerkristall', rarity: 'episch', bonus: W.charms.kristall },
  { id: 'krone',     icon: '👑', name: 'Golemkrone',      rarity: 'legendaer', bonus: W.charms.krone },
];
