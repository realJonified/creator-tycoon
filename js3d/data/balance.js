// Alle Stellschrauben der 3D-Welt an einem Ort.
export const W = {
  // Video: Aufnahme
  recordSeconds: 15,
  letterEvery: 0.7,       // Sekunden zwischen Buchstaben (× Tempo des Spiels)
  letterLife: 2.2,        // so lange bleibt ein Buchstabe stehen
  letterPoints: 10,
  comboStep: 0.05,        // +5 % pro Treffer in Folge …
  comboMax: 20,           // … höchstens +100 %
  // Video: Schnitt
  cutSeconds: 10,
  cutNeed: 60,            // so viele Tipper ergeben Qualität 100 %
  qualityCap: 2,
  qualityBase: 0.4,
  // Video: Upload
  uploadMB: 100,
  baseMBs: 2.5,           // schlechtes WLAN: 100 MB / 2,5 MB/s = 40 s
  minUploadSeconds: 1,
  // Wirtschaft
  audienceLog: 0.5,       // Reichweite = 1 + log10(1 + Abos) × audienceLog
  moneyPerView: 3,
  subsPerView: 1.1,       // neue Abos = subsPerView × Aufrufe ^ subsExp
  subsExp: 0.45,
  passiveViewsPerSub: 0.3, // alte Videos: Aufrufe pro Abo und Sekunde (nur Geld)
  buttonBonus: 0.25,      // Aufrufe-Bonus pro Play-Button
  offlineRate: 0.5,
  offlineMaxSeconds: 8 * 3600,
  // Portal und Boss
  portalEvery: 300,       // alle 5 Minuten …
  portalOpen: 60,         // … für 60 Sekunden offen
  bossHp: 150,
  playerHp: 100,
  shotEvery: 0.35,        // die Waffe schiesst automatisch
  shotDamage: 3,
  attackEvery: 2.6,       // der Boss greift alle paar Sekunden an
  attackWarn: 1.1,        // so lange ist der Zielkreis vorher zu sehen
  attackRadius: 3.2,
  attackDamage: 34,       // drei Treffer und man verliert
  arenaRadius: 17,
  maxValue: 1e300,
};
