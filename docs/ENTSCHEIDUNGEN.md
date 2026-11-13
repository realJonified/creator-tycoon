# Entscheidungen

Eine Zeile pro Annahme, die ich ohne Rückfrage getroffen habe.

- `package.json` enthält nur `"type": "module"` und das Test-Skript, damit Node die ES-Module lädt. Es gibt keine Abhängigkeiten und keinen Build.
- Szenen werden in `js/scenes/index.js` eingetragen (eine Zeile), weil ein Browser ohne Build keine Ordner durchsuchen kann.
- Die Logik in `js/core` fasst das DOM nicht an, damit Tests und Balancing-Skript denselben Code wie das Spiel benutzen.
- Der Loop rechnet in festen Schritten von 0,1 s. Eine Pause über 2 s (Tab im Hintergrund, Rechner im Ruhezustand) zählt als Abwesenheit und bringt den Offline-Gewinn statt voller Einnahmen.
