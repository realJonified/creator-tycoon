// Video-Themen: selbst erfundene Fantasie-Spiele. Neues Thema = eine neue Zeile.
// points  = Punkte pro Buchstabe        pace  = Abstand der Buchstaben (kleiner = schneller)
// money   = Geld pro Aufruf             subs  = Abos pro Aufruf
// minSubs = ab so vielen Abos spielbar  audience = wer zuschaut (nur Anzeige)
export const TOPICS = [
  { id: 'schleim',  icon: '🟢', name: 'Schleimrennen',     audience: 'Kinder',            points: 1,   pace: 1,    money: 1,   subs: 1,   minSubs: 0 },
  { id: 'piraten',  icon: '🏴‍☠️', name: 'Pixelpiraten',      audience: 'Abenteuer-Fans',    points: 1.3, pace: 1,    money: 1.2, subs: 0.8, minSubs: 100 },
  { id: 'baeckerei', icon: '👻', name: 'Geisterbäckerei',   audience: 'Gemütliche Zocker', points: 1,   pace: 1,    money: 0.8, subs: 1.6, minSubs: 1000 },
  { id: 'turmbau',  icon: '🏗️', name: 'Turmbau-Chaos',     audience: 'Bastler',           points: 2,   pace: 0.85, money: 1,   subs: 1,   minSubs: 10000 },
  { id: 'drachen',  icon: '🐉', name: 'Drachenfarm',       audience: 'Sammler',           points: 3,   pace: 0.8,  money: 1.3, subs: 1.2, minSubs: 100000 },
  { id: 'taxi',     icon: '🚀', name: 'Weltraum-Taxi',     audience: 'Rennfahrer',        points: 5,   pace: 0.7,  money: 1.5, subs: 1,   minSubs: 1e6 },
  { id: 'nudeln',   icon: '🍜', name: 'Ninja-Nudeln',      audience: 'Profis',            points: 8,   pace: 0.65, money: 1.2, subs: 1.5, minSubs: 1e7 },
  { id: 'robo',     icon: '🤖', name: 'Robo-Fussball',     audience: 'Alle',              points: 14,  pace: 0.6,  money: 1.5, subs: 1.5, minSubs: 1e8 },
];
