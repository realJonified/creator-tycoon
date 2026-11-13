// Awards: Meilensteine nach Abonnenten, aufsteigend sortiert. Neuer Award = eine neue Zeile.
// Jeder Award gibt BALANCE.awardBonus auf alle Einnahmen (oder einen eigenen Wert über "bonus").
// Die id darf sich nie ändern, sie steht in den Spielständen.
export const AWARDS = [
  { id: 'fans',       icon: '🌱', name: 'Erste Fans',    subs: 200 },
  { id: 'tausend',    icon: '🎉', name: 'Geheimtipp',    subs: 2500 },
  { id: 'aufsteiger', icon: '⭐', name: 'Aufsteiger',    subs: 25000 },
  { id: 'silber',     icon: '🥈', name: 'Silber-Award',  subs: 250000 },
  { id: 'gold',       icon: '🥇', name: 'Gold-Award',    subs: 2e6 },
  { id: 'diamant',    icon: '💎', name: 'Diamant-Award', subs: 1e7 },
  { id: 'rubin',      icon: '❤️‍🔥', name: 'Rubin-Award',   subs: 1e8 },
  { id: 'legende',    icon: '👑', name: 'Legende',       subs: 1e9 },
];
