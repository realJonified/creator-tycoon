// Auszeichnungen für Abo-Meilensteine, aufsteigend. Neuer Award = eine neue Zeile.
// Jeder Award: Aufrufe × (1 + bonus) und einmalig gems Juwelen. Die id darf sich nie ändern.
export const AWARDS = [
  { id: 'funke',     icon: '✨', name: 'Goldener Funke',        subs: 1e5,  bonus: 0.25, gems: 50 },
  { id: 'stern',     icon: '⭐', name: 'Goldener Stern',        subs: 1e6,  bonus: 0.25, gems: 80 },
  { id: 'krone',     icon: '👑', name: 'Goldene Krone',         subs: 1e7,  bonus: 0.25, gems: 120 },
  { id: 'komet',     icon: '☄️', name: 'Goldener Komet',        subs: 1e8,  bonus: 0.25, gems: 160 },
  { id: 'sonne',     icon: '☀️', name: 'Goldene Sonne',         subs: 5e8,  bonus: 0.25, gems: 200 },
  { id: 'galaxie',   icon: '🌌', name: 'Goldene Galaxie',       subs: 1e9,  bonus: 0.3, gems: 250 },
  { id: 'nova',      icon: '💥', name: 'Goldene Nova',          subs: 5e10, bonus: 0.35, gems: 300 },
  { id: 'kosmos',    icon: '🪐', name: 'Goldener Kosmos',       subs: 5e11, bonus: 0.35, gems: 400 },
  { id: 'unendlich', icon: '♾️', name: 'Goldene Unendlichkeit', subs: 1e12, bonus: 0.5, gems: 500 },
];
