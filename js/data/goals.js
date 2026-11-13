// Tagesziele: jeden Tag werden drei davon ausgewählt. Neues Ziel = eine neue Zeile.
// stat   = Zähler aus S.stats, der mitgezählt wird
// text   = {n} wird durch das Ziel ersetzt
// target = feste Zahl, ODER incomeSeconds/incomeClicks/min (Ziel passt sich deinen Einnahmen an)
export const GOALS = [
  { id: 'videos', icon: '🎬', stat: 'videos',    text: 'Nimm {n} Videos auf',          target: 150 },
  { id: 'kaeufe', icon: '🛒', stat: 'purchases', text: 'Kaufe {n} Dinge im Shop',      target: 15 },
  { id: 'events', icon: '🎲', stat: 'events',    text: 'Mach bei {n} Ereignissen mit', target: 3 },
  { id: 'virals', icon: '🔥', stat: 'virals',    text: 'Lande {n} virale Hits',        target: 3 },
  { id: 'geld',   icon: '💰', stat: 'earned',    text: 'Verdiene {n} €',               incomeSeconds: 900, incomeClicks: 300, min: 500 },
];
export const GOALS_PER_DAY = 3;
