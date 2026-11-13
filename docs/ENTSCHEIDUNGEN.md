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
- Der Loop rechnet in festen Schritten von 0,1 s. Eine Pause über 2 s (Tab im Hintergrund, Rechner im Ruhezustand) zählt als Abwesenheit und bringt den Offline-Gewinn statt voller Einnahmen.
