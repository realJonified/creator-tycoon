// Alle Stellschrauben des Spiels an einem Ort. Nach Änderungen: node tools/balance.js
export const BALANCE = {
  // Abos erhöhen die Einnahmen: Faktor = 1 + Wurzel(Abos) / subDivisor
  subDivisor: 40,
  awardBonus: 0.25,        // Einnahmen-Bonus pro Award (wenn der Award keinen eigenen nennt)
  equipGrowth: 1.5,        // Preisanstieg pro Ausrüstungs-Stufe
  teamGrowth: 1.15,        // Preisanstieg pro Team-Mitglied
  clickSubs: 0.5,          // Abos pro Video = Basiswert × clickSubs (mindestens 1)
  viewSubs: 0.4,           // Abos pro Aufruf des Teams
  viralChance: 0.02,
  viralMult: 10,
  offlineRate: 0.5,
  offlineMaxSeconds: 8 * 3600,
  offlineNoticeSeconds: 60, // ab hier wird der Offline-Gewinn angezeigt
  eventMinSeconds: 45,
  eventMaxSeconds: 120,
  eventTtlSeconds: 15,      // so lange bleibt ein Ereignis anklickbar
  prestigeMinSubs: 1e6,     // ab so vielen Abos lohnt sich ein neuer Kanal
  fameBase: 3,              // Ruhm bei genau prestigeMinSubs
  fameExponent: 0.35,       // Ruhm = fameBase × (Abos / prestigeMinSubs) ^ fameExponent
  famePassive: 0.05,        // Einnahmen-Bonus pro jemals verdientem Ruhm-Punkt
  startMoneyBase: 500,
  startMoneyFactor: 6,
  goalRewardSeconds: 300,   // Tagesziel-Belohnung = Einnahmen von so vielen Sekunden …
  goalRewardClicks: 100,    // … oder von so vielen Videos (der grössere Wert zählt)
  goalRewardMin: 100,
  goalBonusMult: 2,
  goalBonusSeconds: 600,
  maxValue: 1e300,          // Obergrenze, damit nie "Infinity" im Spielstand landet
};
