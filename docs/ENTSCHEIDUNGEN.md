# Entscheidungen

Eine Zeile pro Annahme, die ich ohne Rückfrage getroffen habe.

- `package.json` enthält nur `"type": "module"` und das Test-Skript, damit Node die ES-Module lädt. Es gibt keine Abhängigkeiten und keinen Build.
- Szenen werden in `js/scenes/index.js` eingetragen (eine Zeile), weil ein Browser ohne Build keine Ordner durchsuchen kann.
- Die Logik in `js/core` fasst das DOM nicht an, damit Tests und Balancing-Skript denselben Code wie das Spiel benutzen.
- Der neue Spielstand liegt unter `creatorTycoonSave_v2`. Der alte v1-Eintrag wird nur gelesen und bleibt als Sicherung im Browser liegen.
- Awards stehen ab v2 mit ihrer id im Spielstand statt mit ihrer Position, damit neue Awards alte Stände nicht verschieben.
- Wer einen v1-Spielstand mitbringt, überspringt das Tutorial.
- Ein unlesbarer Spielstand wird unter `…_defekt` beiseitegelegt und nicht stillschweigend überschrieben.
- Der Export ist Base64 mit dem Vorsatz `CT:`. Der Import nimmt auch rohes JSON und alte v1-Stände an.
- Ein Tab im Hintergrund zählt wie ein geschlossenes Spiel (Offline-Gewinn). Vorher verdiente ein versteckter Tab gar nichts.
- Das alte Balancing war viel zu schnell (alle 8 Awards in unter 4 Minuten). Ich habe Abo-Bonus, Abo-Zuwachs und die Preise der höheren Stufen angepasst statt nur die Award-Schwellen zu verschieben.
- Als "vernünftiger Spieler" gilt in der Simulation jemand mit 2 Videos pro Sekunde, der immer das kauft, was sich am schnellsten bezahlt macht, und bei Ereignissen die erste (sichere) Wahl nimmt.
- Der Award "1.000 Abos" heisst jetzt "Geheimtipp", weil seine Schwelle nicht mehr 1.000 ist. Die id bleibt, alte Spielstände behalten ihn.
- Awards gehören zum Kanal und beginnen bei einem neuen Kanal von vorn. Dauerhaft sind nur Ruhm, Ruhm-Boni und die Statistik.
- Ruhm wirkt doppelt: jeder verdiente Punkt gibt 5 % Einnahmen, und man kann die Punkte für Boni ausgeben.
- Ereignisse erscheinen als Knopf, der 15 Sekunden bleibt, statt das Spiel mit einem Fenster zu unterbrechen. Erst ein Klick öffnet das Overlay, und solange es offen ist, läuft die Zeit des Ereignisses nicht ab.
- Der virale Hit ist ein Hinweis, der nichts blockiert, weil er mitten im schnellen Klicken auftaucht.
- Tagesziele wechseln um Mitternacht nach der Uhr des Geräts. Die Belohnung richtet sich nach den Einnahmen beim Abholen.
- Auf dem Titelbild und im Tutorial steht das Spiel still.
- Liefert der Browser keine Bild-Takte, obwohl die Seite als sichtbar gilt (verdecktes Fenster), hält ein Ersatz-Takt das Spiel am Laufen.
- Der Loop rechnet in festen Schritten von 0,1 s. Eine Pause über 2 s (Tab im Hintergrund, Rechner im Ruhezustand) zählt als Abwesenheit und bringt den Offline-Gewinn statt voller Einnahmen.
