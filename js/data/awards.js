// Awards: Meilensteine nach Abonnenten, aufsteigend sortiert. Neuer Award = eine neue Zeile.
// Jeder Award gibt BALANCE.awardBonus auf alle Einnahmen (oder einen eigenen Wert über "bonus").
// Die id darf sich nie ändern, sie steht in den Spielständen.
export const AWARDS = [
  { id: 'fans',       icon: '🌱', name: 'Erste Fans',    subs: 100 },
  { id: 'tausend',    icon: '🎉', name: '1.000 Abos',    subs: 1000 },
  { id: 'aufsteiger', icon: '⭐', name: 'Aufsteiger',    subs: 10000 },
  { id: 'silber',     icon: '🥈', name: 'Silber-Award',  subs: 100000 },
  { id: 'gold',       icon: '🥇', name: 'Gold-Award',    subs: 1e6 },
  { id: 'diamant',    icon: '💎', name: 'Diamant-Award', subs: 1e7 },
  { id: 'rubin',      icon: '❤️‍🔥', name: 'Rubin-Award',   subs: 5e7 },
  { id: 'legende',    icon: '👑', name: 'Legende',       subs: 1e8 },
];
