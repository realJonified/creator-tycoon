// Geräte im Shop. Jede Kategorie ist eine Leiter: man kauft immer die nächste Stufe.
// Stufe 0 hat man am Anfang. mult = Wirkung (wird mit den anderen Kategorien gleicher
// Wirkung multipliziert), house = nötiges Haus (Nummer ab 0). Faustregel für den Preis:
// etwa 0,4 × Preis des nötigen Hauses, damit Geräte nicht billiger sind als der Umzug. Neue Stufe = eine neue Zeile.
export const GEAR_CATS = [
  { id: 'pc',       icon: '🖥️', name: 'PC',          effect: 'record', tab: 'geraete', desc: 'mehr Punkte beim Aufnehmen' },
  { id: 'mikro',    icon: '🎙️', name: 'Mikrofon',    effect: 'record', tab: 'geraete', desc: 'mehr Punkte beim Aufnehmen' },
  { id: 'maus',     icon: '🖱️', name: 'Maus',        effect: 'cut',    tab: 'geraete', desc: 'jeder Tipper im Schnitt zählt mehr' },
  { id: 'tastatur', icon: '⌨️', name: 'Tastatur',    effect: 'cut',    tab: 'geraete', desc: 'jeder Tipper im Schnitt zählt mehr' },
  { id: 'router',   icon: '📶', name: 'Router',      effect: 'upload', tab: 'netz',    desc: 'schnellerer Upload' },
  { id: 'boxen',    icon: '📡', name: 'WLAN-Boxen',  effect: 'upload', tab: 'netz',    desc: 'schnellerer Upload' },
  { id: 'handy',    icon: '📱', name: 'Handy',       effect: 'views',  tab: 'handy',   desc: 'Kurzclips bringen mehr Aufrufe' },
];

export const GEAR = {
  pc: [
    { id: 'pc0', icon: '📟', name: 'Röhren-Rechner 2000', price: 0,      mult: 1,   house: 0 },
    { id: 'pc1', icon: '💻', name: 'Bürokiste Basic',     price: 1500,   mult: 1.6, house: 0 },
    { id: 'pc2', icon: '🖥️', name: 'Spielmaschine S',     price: 2e4,  mult: 2.5, house: 1 },
    { id: 'pc3', icon: '🖥️', name: 'Turbo-Tower',         price: 2e5,    mult: 4,   house: 2 },
    { id: 'pc4', icon: '🧊', name: 'Wasserkühl-Monster',  price: 2e7,    mult: 7,   house: 4 },
    { id: 'pc5', icon: '⚛️', name: 'Quanten-Kasten',      price: 2e10,    mult: 12,  house: 7 },
    { id: 'pc6', icon: '🌟', name: 'Sternen-Rechner',     price: 2e13,   mult: 22,  house: 10 },
    { id: 'pc7', icon: '⏳', name: 'Zeitmaschinen-PC',    price: 2e16,   mult: 40,  house: 13 },
  ],
  mikro: [
    { id: 'mi0', icon: '🎧', name: 'Headset mit Wackelkontakt', price: 0,   mult: 1,   house: 0 },
    { id: 'mi1', icon: '🎙️', name: 'Tischmikro Murmel',   price: 2500,   mult: 1.3, house: 0 },
    { id: 'mi2', icon: '🎙️', name: 'Studio-Mikro Echo',   price: 3e4,  mult: 1.8, house: 1 },
    { id: 'mi3', icon: '🎤', name: 'Röhren-Mikro Bariton', price: 3e6,   mult: 2.5, house: 3 },
    { id: 'mi4', icon: '🏅', name: 'Goldkapsel',          price: 3e8,  mult: 3.5, house: 5 },
    { id: 'mi5', icon: '💎', name: 'Kristall-Mikro',      price: 3e11,    mult: 5,   house: 8 },
  ],
  maus: [
    { id: 'ma0', icon: '🐭', name: 'Kugelmaus',           price: 0,      mult: 1,   house: 0 },
    { id: 'ma1', icon: '🖱️', name: 'Klickmaus',           price: 800,    mult: 1.4, house: 0 },
    { id: 'ma2', icon: '🖱️', name: 'Flitzmaus G',         price: 1.5e4,  mult: 2,   house: 1 },
    { id: 'ma3', icon: '🎯', name: 'Präzi-Pro',           price: 1.5e5,  mult: 3,   house: 2 },
    { id: 'ma4', icon: '🦅', name: 'Laser-Adler',         price: 1.5e7,    mult: 4.5, house: 4 },
    { id: 'ma5', icon: '🧠', name: 'Gedanken-Maus',       price: 1.5e10,  mult: 7,   house: 7 },
  ],
  tastatur: [
    { id: 'ta0', icon: '⌨️', name: 'Wackel-Tastatur',     price: 0,      mult: 1,   house: 0 },
    { id: 'ta1', icon: '⌨️', name: 'Gummitasten',         price: 1200,   mult: 1.4, house: 0 },
    { id: 'ta2', icon: '⌨️', name: 'Mecha-Klacker',       price: 2e4,  mult: 2,   house: 1 },
    { id: 'ta3', icon: '🌈', name: 'Regenbogen-Board',    price: 2e5,    mult: 3,   house: 2 },
    { id: 'ta4', icon: '🛡️', name: 'Titan-Tasten',        price: 2e8,    mult: 4.5, house: 5 },
    { id: 'ta5', icon: '💡', name: 'Licht-Tastatur',      price: 2e11,    mult: 7,   house: 8 },
  ],
  router: [
    { id: 'ro0', icon: '📠', name: 'Uralt-Modem',         price: 0,      mult: 1,   house: 0 },
    { id: 'ro1', icon: '📶', name: 'Plastik-Router',      price: 2000,   mult: 1.8, house: 0 },
    { id: 'ro2', icon: '📶', name: 'Doppelantenne',       price: 2.5e4,  mult: 3,   house: 1 },
    { id: 'ro3', icon: '🔆', name: 'Glasfaser-Box',       price: 2.5e5,    mult: 5,   house: 2 },
    { id: 'ro4', icon: '🕸️', name: 'Netzmeister',         price: 2.5e7,    mult: 8,   house: 4 },
    { id: 'ro5', icon: '🛰️', name: 'Satellitenschüssel',  price: 2.5e10,    mult: 14,  house: 7 },
    { id: 'ro6', icon: '⚡', name: 'Lichtleitung',        price: 2.5e13,   mult: 25,  house: 10 },
  ],
  boxen: [
    { id: 'bo0', icon: '🚫', name: 'Keine Boxen',         price: 0,      mult: 1,   house: 0 },
    { id: 'bo1', icon: '🔌', name: 'Steckdosen-Verstärker', price: 6000, mult: 1.4, house: 0 },
    { id: 'bo2', icon: '📡', name: 'Doppel-Booster',      price: 4e4,    mult: 2,   house: 1 },
    { id: 'bo3', icon: '🗼', name: 'Turm-Verstärker',     price: 4e6,    mult: 3,   house: 3 },
    { id: 'bo4', icon: '☁️', name: 'Wolkennetz',          price: 4e8,    mult: 4.5, house: 5 },
    { id: 'bo5', icon: '🪐', name: 'Orbit-Relais',        price: 4e12,    mult: 7,   house: 9 },
  ],
  handy: [
    { id: 'ha0', icon: '🚫', name: 'Kein Handy',          price: 0,      mult: 1,   house: 0 },
    { id: 'ha1', icon: '📞', name: 'Brikett B1',          price: 5e4,    mult: 1.4, house: 0 },
    { id: 'ha2', icon: '📱', name: 'Wischfon S',          price: 4e5,    mult: 2,   house: 2 },
    { id: 'ha3', icon: '📱', name: 'Glasfon Pro',         price: 4e7,  mult: 3,   house: 4 },
    { id: 'ha4', icon: '📲', name: 'Faltfon X',           price: 4e9,    mult: 4.5, house: 6 },
    { id: 'ha5', icon: '🔮', name: 'Holofon',             price: 4e12,   mult: 7,   house: 9 },
    { id: 'ha6', icon: '🧿', name: 'Gedankenfon',         price: 4e15,   mult: 11,  house: 12 },
  ],
};
