# Entscheidungen

Eine Zeile pro Annahme, die ich ohne Rückfrage getroffen habe.

## Allgemein
- Der Name ist **Vlogvilla**, weil das Spiel ums Umziehen in immer grössere Häuser geht. Alle Namen von Spielen, Geräten, Häusern, Boards und Awards sind selbst erfunden.
- Grafik nur als SVG, CSS und Emoji, die direkt im Code erzeugt werden (`js/ui/art.js`). Es gibt keine Bilddateien, Fonts oder CDNs.
- `package.json` enthält nur `"type": "module"` und Skripte. Es gibt keine Abhängigkeiten und keinen Build.
- Szenen werden in `js/scenes/index.js` eingetragen, weil ein Browser ohne Build keine Ordner durchsuchen kann.
- Die Logik in `js/core` fasst das DOM nicht an, damit Tests und Balancing-Skript denselben Code benutzen wie das Spiel.
- Der Loop rechnet in festen Schritten von 0,1 s. Eine Pause über 2 s zählt als Abwesenheit (Offline-Gewinn).

## Aus dem Szenen-Umbau entfernt
- Prestige („Neuer Kanal“), Zufalls-Ereignisse, Tagesziele und das Team gehören nicht zum neuen Spielplan und sind weggefallen. Ihren Platz nehmen Häuser, Kisten und der Video-Ablauf ein.

## Spielablauf
- Ein Video dauert 15 s Aufnahme + 10 s Schnitt + Upload (anfangs 30 s, mit bestem WLAN unter 1 s).
- Buchstaben kann man antippen oder am PC auf der Tastatur drücken. Treffer in Folge geben bis zu +100 %.
- Die Schnitt-Qualität geht bis 200 %. Mit Grundausstattung schafft man 100 % mit 60 Tippern, bessere Maus, Tastatur und Speicher-Teile machen jeden Tipper wertvoller.
- Wer die Video-Szene mitten in einem Video verlässt, verwirft dieses Video. In der Video-Szene schalten die Zifferntasten deshalb nicht die Szene um.
- Neue Abos kommen nur durch Videos. Alte Videos bringen nebenbei Geld (passiv und offline mit 50 %, höchstens 8 h), aber keine Abos.
- Geräte sind Leitern: Man kauft immer die nächste Stufe. Bessere Stufen brauchen ein bestimmtes Haus („Platz für bessere Ausstattung“).
- Gerätepreise liegen bei etwa 0,4 × Preis des Hauses, das sie freischaltet. Sonst wären Geräte im Vergleich zum Umzug fast gratis gewesen.
- Die „Boxen“ aus der Aufgabe sind WLAN-Verstärker, eine zweite Leiter neben dem Router. Beide beschleunigen den Upload.
- Handy: Stufe 0 ist „Kein Handy“, das erste Handy kostet 50.000 €. Handys vervielfachen die Aufrufe (Kurzclips).
- Hoverboards: Man rüstet eines aus, und nur dessen Bonus zählt. Das erste gefundene Board wird automatisch ausgerüstet.
- PC-Teile: Pro Steckplatz zählt das beste Teil. Schwächere Teile und Doppelte bringen Juwelen zurück.
- Kisten haben feste Wahrscheinlichkeiten: Zuerst wird die Seltenheit gewürfelt, dann gleichmässig ein Gegenstand dieser Seltenheit.
- Juwelen gibt es pro Video (2), für perfekten Schnitt (+2), beim Umzug (25) und für jeden Award (50 bis 500). Zum Start gibt es 30.
- Awards gelten für den Kanal und geben einen dauerhaften Aufrufe-Bonus. Beim Freischalten erscheint ein Overlay mit Animation, mehrere nacheinander.

## Balancing
- Die erste Fassung lief nach 46 Minuten davon (alle 20 Häuser in 8 Minuten). Ursachen und Abhilfe:
  - Reichweite wuchs mit der Wurzel der Abos und schaukelte sich mit dem Hausbonus hoch. Jetzt wächst sie mit dem Logarithmus.
  - Das passive Geld rechnete den Hausbonus ein zweites Mal ein (die Abos enthalten ihn schon). Jetzt nur noch Abos × fester Satz.
  - Neue Abos wachsen mit Aufrufe^0,45 statt linear, damit grosse Kanäle spürbar langsamer wachsen.
  - Award-Boni, PC-Teile und Juwelen beim Umzug waren zu stark und sind gedämpft.
- Jedes Haus bringt etwas mehr als das vorige (× 2,6, dann je + 0,06), weil sonst die × 10 teureren späten Häuser praktisch unerreichbar würden.
- Als „Spieler“ gilt in der Simulation jemand mit 85 % getroffenen Buchstaben, 6 Tippern pro Sekunde und 4 s Bedenkzeit pro Video, der das Haus kauft, sobald es geht, sonst das günstigste Gerät, und alle Juwelen in Kisten steckt.

## Spielstand
- Neuer Schlüssel `vlogvillaSave_v3`. Die alten Schlüssel `creatorTycoonSave_v1` und `_v2` werden nur gelesen und bleiben als Sicherung liegen.
- Aus v1 und v2 bleiben Geld, Abos, Videos und Statistik. Alte Ausrüstung, das Team und Ruhm gibt es nicht mehr: Als Ausgleich gibt es 5 Juwelen pro gekaufter Stufe/Person und 20 pro Ruhm-Punkt (zusammen höchstens 1.000).
- Alte Awards werden nicht übernommen, weil die Schwellen andere sind. Wer genug Abos mitbringt, bekommt die neuen Awards beim ersten Laden gutgeschrieben.
- Abos aus alten Versionen waren billiger zu bekommen. Im neuen Spiel bringen sie viel passives Geld (ein v1-Stand mit 150.000 Abos verdient in 2 h offline etwa 1 Mrd. €). Das ist ein bewusster Startvorteil für Umsteiger, weil die Vorgabe „nichts verlieren“ lautet.
- Der Export beginnt mit `VV:`. Der Import nimmt auch alte `CT:`-Texte und rohes JSON an.
