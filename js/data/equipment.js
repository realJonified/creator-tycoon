// Ausrüstung: macht jedes Video wertvoller. Neue Ausrüstung = eine neue Zeile.
// add  = Basiswert pro Video je Stufe, base = Preis der ersten Stufe.
// Die id darf sich nie ändern, sie steht in den Spielständen.
export const EQUIPMENT = [
  { id: 'cam',    icon: '📷', name: 'Bessere Kamera', add: 1,    base: 15 },
  { id: 'mic',    icon: '🎙️', name: 'Mikrofon',       add: 6,    base: 300 },
  { id: 'light',  icon: '💡', name: 'Ringlicht',      add: 35,   base: 7500 },
  { id: 'pc',     icon: '🖥️', name: 'Schnitt-PC',     add: 200,  base: 200000 },
  { id: 'green',  icon: '🟩', name: 'Greenscreen',    add: 1200, base: 6e6 },
  { id: 'studio', icon: '🏢', name: 'Eigenes Studio', add: 8000, base: 1.5e8 },
];
