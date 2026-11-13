// Zufalls-Ereignisse. Neues Ereignis = ein neuer Eintrag.
// weight  = wie oft es im Vergleich zu den anderen kommt
// minSubs = erst ab so vielen Abos
// choices = Knöpfe. Entweder feste "effects" oder ein Risiko: chance + win + lose.
// Wirkungen:
//   { type: 'money', seconds, clicks, min }  Geld = Einnahmen von x Sekunden oder x Videos (das Grössere)
//   { type: 'subs',  seconds, clicks, min }  dasselbe für Abos
//   { type: 'moneyPct', pct }                Geld prozentual ändern (−0.25 = ein Viertel weg)
//   { type: 'subsPct',  pct }                Abos prozentual ändern
//   { type: 'buff', id, icon, label, target: 'money' | 'subs' | 'all', mult, duration }
export const EVENTS = [
  {
    id: 'sponsor', icon: '🤝', title: 'Sponsor-Deal', weight: 4, minSubs: 0,
    text: 'Eine Firma möchte in deinem nächsten Video vorkommen.',
    choices: [
      { label: 'Deal annehmen', hint: 'Sofort Geld und 30 s lang 3× Einnahmen', effects: [
        { type: 'money', seconds: 60, clicks: 30, min: 50 },
        { type: 'buff', id: 'sponsor', icon: '🤝', label: 'Sponsor', target: 'money', mult: 3, duration: 30 },
      ] },
      { label: 'Ablehnen', effects: [] },
    ],
  },
  {
    id: 'trend', icon: '📈', title: 'Trend-Thema', weight: 3, minSubs: 0,
    text: 'Ein Thema geht gerade durch die Decke. Wer jetzt Videos dazu macht, gewinnt viele Fans.',
    choices: [
      { label: 'Auf den Trend springen', hint: '45 s lang 3× neue Abos', effects: [
        { type: 'buff', id: 'trend', icon: '📈', label: 'Trend', target: 'subs', mult: 3, duration: 45 },
      ] },
      { label: 'Nicht mein Ding', effects: [] },
    ],
  },
  {
    id: 'collab', icon: '🎤', title: 'Gemeinschafts-Video', weight: 2, minSubs: 500,
    text: 'Ein grösserer Kanal lädt dich zu einem gemeinsamen Video ein. Die Produktion kostet dich Geld.',
    choices: [
      { label: 'Mitmachen', hint: 'Kostet 25 % deines Geldes, bringt viele Abos', effects: [
        { type: 'moneyPct', pct: -0.25 },
        { type: 'subs', seconds: 240, clicks: 80, min: 50 },
      ] },
      { label: 'Absagen', effects: [] },
    ],
  },
  {
    id: 'shitstorm', icon: '🌩️', title: 'Shitstorm', weight: 2, minSubs: 1000,
    text: 'Ein altes Video von dir wird gerade heftig kritisiert. Wie reagierst du?',
    choices: [
      { label: 'Entschuldigen', hint: 'Sicher: du verlierst 3 % deiner Abos', effects: [{ type: 'subsPct', pct: -0.03 }] },
      { label: 'Mit Humor kontern', hint: 'Riskant: 60 % Chance auf +12 % Abos, sonst −12 %', chance: 0.6,
        win: [{ type: 'subsPct', pct: 0.12 }], winText: 'Das Netz lacht mit dir!',
        lose: [{ type: 'subsPct', pct: -0.12 }], loseText: 'Das ging nach hinten los.' },
    ],
  },
];
