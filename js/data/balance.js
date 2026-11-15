// Alle Stellschrauben des Spiels an einem Ort. Nach Änderungen: node tools/balance.js
export const BALANCE = {
  // Aufnahme
  recordSeconds: 15,
  letterEvery: 0.6,         // Sekunden zwischen zwei Buchstaben (× Tempo des Themas)
  letterLife: 2.2,          // so lange bleibt ein Buchstabe stehen
  letterPoints: 10,         // Punkte pro Treffer (× Aufnahme-Stärke × Thema)
  comboStep: 0.05,          // +5 % pro Treffer in Folge …
  comboMax: 20,             // … höchstens +100 %
  // Schnitt
  cutSeconds: 10,
  cutNeed: 60,              // so viele Tipper ergeben mit Grundausstattung Qualität 1
  qualityCap: 2,            // mehr als doppelte Qualität geht nicht
  qualityBase: 0.4,         // auch ein ungeschnittenes Video bekommt etwas Aufrufe
  // Upload
  uploadSizeMB: 120,
  baseUploadMBs: 4,         // Grund-WLAN: 120 MB / 4 MB/s = 30 s
  minUploadSeconds: 0.8,
  // Aufrufe, Geld, Abos
  audienceLog: 0.5,         // Reichweite = 1 + log10(1 + Abos) × audienceLog
  moneyPerView: 3,
  subsPerView: 1.1,         // neue Abos = subsPerView × Aufrufe ^ subsExp
  subsExp: 0.45,            // < 1: grosse Kanäle wachsen langsamer
  houseMult: 2.6,           // Haus 1 bringt Aufrufe × 2,6 …
  houseMultStep: 0.06,      // … jedes weitere 0,06 mehr (Haus 19: × 3,68)
  awardBonus: 0.25,         // Aufrufe-Bonus pro Award, wenn der Award keinen eigenen nennt
  passiveViewsPerSub: 0.6,  // alte Videos laufen weiter: Aufrufe pro Abo und Sekunde
  // Juwelen
  startGems: 30,
  gemsPerVideo: 2,
  gemsPerfect: 2,           // zusätzlich bei Qualität ≥ 1
  gemsPerHouse: 25,         // beim Umzug
  // Offline
  offlineRate: 0.5,
  offlineMaxSeconds: 8 * 3600,
  offlineNoticeSeconds: 60,
  maxValue: 1e300,          // Obergrenze, damit nie "Infinity" im Spielstand landet
};
