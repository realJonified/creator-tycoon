// Ruhm-Boni: bleiben nach "Neuer Kanal" erhalten. Neuer Bonus = eine neue Zeile.
// effect: money | subs | startMoney | offline | viral  ·  per = Wirkung je Stufe
// Preis der nächsten Stufe = cost + Stufe × costStep (in Ruhm-Punkten)
export const PERKS = [
  { id: 'einnahmen', icon: '💶', name: 'Werbe-Profi',   effect: 'money',      per: 0.15, max: 25, cost: 1, costStep: 1, desc: '+15 % Einnahmen pro Stufe' },
  { id: 'fans',      icon: '🧲', name: 'Fan-Magnet',    effect: 'subs',       per: 0.15, max: 25, cost: 1, costStep: 1, desc: '+15 % neue Abos pro Stufe' },
  { id: 'start',     icon: '💼', name: 'Startkapital',  effect: 'startMoney', per: 1,    max: 8,  cost: 1, costStep: 1, desc: 'Ein neuer Kanal startet mit Geld (500 €, pro Stufe × 6)' },
  { id: 'offline',   icon: '🌙', name: 'Nachtschicht',  effect: 'offline',    per: 0.1,  max: 5,  cost: 2, costStep: 1, desc: '+10 % Offline-Gewinn pro Stufe' },
  { id: 'viral',     icon: '🍀', name: 'Glückssträhne', effect: 'viral',      per: 0.01, max: 5,  cost: 2, costStep: 2, desc: '+1 % Chance auf virale Videos pro Stufe' },
];
