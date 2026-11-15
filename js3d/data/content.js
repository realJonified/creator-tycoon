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

// Häuser stehen seit Update 2 in js3d/data/maps.js (pro Map). HOUSES ist die Liste über alle Maps
// in globaler Reihenfolge: Index 0 = Wohnung, danach steigt der Hausbonus.
import { ALL_HOUSES } from './maps.js';
export const HOUSES = ALL_HOUSES;

// Häuser aus Version 1, die es auf Map 1 nicht mehr gibt (Map 1 hat seit Update 2 nur 5 Häuser).
// Wer sie besass, bekommt bei der Migration den Kaufpreis zurück.
export const REMOVED_V1_HOUSES = { wald: 5e8, hang: 5e9, teich: 5e10, glas: 5e11, burg: 5e12, himmel: 5e13, krone: 5e14 };

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
