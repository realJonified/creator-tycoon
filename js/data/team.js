// Team: verdient automatisch. Neues Team-Mitglied = eine neue Zeile.
// rate = Aufrufe pro Sekunde je Person, base = Preis der ersten Person.
// Die id darf sich nie ändern, sie steht in den Spielständen.
export const TEAM = [
  { id: 'cut',    icon: '✂️', name: 'Cutter',               rate: 0.5,   base: 25 },
  { id: 'thumb',  icon: '🖼️', name: 'Vorschaubild-Designer', rate: 4,     base: 600 },
  { id: 'social', icon: '📱', name: 'Social-Media-Manager', rate: 25,    base: 15000 },
  { id: 'camop',  icon: '🎥', name: 'Kamerateam',           rate: 150,   base: 350000 },
  { id: 'agency', icon: '📈', name: 'Marketing-Agentur',    rate: 1000,  base: 1e7 },
  { id: 'empire', icon: '🌍', name: 'Medien-Imperium',      rate: 8000,  base: 3e8 },
  { id: 'ai',     icon: '🤖', name: 'KI-Content-Fabrik',    rate: 70000, base: 1e10 },
];
