# Entscheidungen

Eine Zeile pro Annahme, die ich ohne Rückfrage getroffen habe.

## Update 2 (Branch welt-v2)

### Etappe 1: Map-System
- Maps stehen in `js3d/data/maps.js` (nicht in `js/data`, weil alle Daten der 3D-Welt in `js3d/data` liegen). Jede Map nennt eine Bau-Funktion aus `js3d/scene/maps/index.js`. Map 1 ist die bisherige Insel (`buildBucht` in `world.js`), noch nicht fertige Maps nutzen die Baustellen-Karte `baustelle.js`.
- Map 1 hat laut Vorgabe nur noch die ersten 5 Häuser (bis Leuchtturmhaus, 50 Mio. €). Die Häuser 6–12 aus Version 1 (Waldhaus bis Kronenschloss) gibt es dort nicht mehr. Wer sie besass, bekommt bei der Migration den vollen Kaufpreis als Geld zurück und sieht beim Start einen Hinweis. Annahme: lieber Geld zurück als eine Map 1, die für alte Spieler anders aussieht.
- Häuser-ids sind über alle Maps eindeutig. Der Hausbonus (× 2,5 pro Stufe) richtet sich nach dem besten gekauften Haus in der globalen Reihenfolge aller Maps.
- Maps werden der Reihe nach freigeschaltet: Map 2 für 1 Billion €, Map 3 ist ein Gerüst (`ready: false`, Platzhalterpreis 10 Brd. €, wird im Balancing festgelegt).
- Das Portal öffnet jetzt die Weltkarte. Damit der Bosskampf aus Version 1 bleibt, steht oben ein „Boss-Portal betreten“-Knopf, solange das Boss-Portal offen ist (alle 5 Minuten für 60 s, wie bisher). Das geht von jeder Map aus, denn jede Map hat ein Portal.
- Spielstand: gleicher Schlüssel `kanalbuchtSave_v1`, aber Version 2 im Feld `v`. Neue Felder: `maps` (freigeschaltet), `map` (aktuell) und `houses` als `{ mapId: [ids] }`. Ein Spielstand ohne Versionsfeld gilt als Version 1.
- Karten-Verwalter (`js3d/core/maps.js`): immer genau eine Map, Wechsel in einer Warteschlange (der Test hat gezeigt, dass gleichzeitige Wechsel sonst zwei Maps hinterlassen). Entsorgen über `disposeObject` (Geometrien, Materialien, Texturen, auch Shader-Uniform-Texturen). Geteilte Materialien sind mit `userData.shared` markiert und bleiben bestehen.
- Der Ladebildschirm wartet auf höchstens zwei Bild-Takte zu je 60 ms. Ohne diese Grenze blieb er in einem Hintergrund-Tab hängen.
- Speichertest (10 Wechsel Kanalbucht ↔ Baustelle im Browser): Die GPU-Ressourcen bleiben exakt gleich, Kanalbucht immer 38 Geometrien, 3 Texturen, 16 Shader-Programme, Baustelle 23/2/12. Der JS-Heap stieg von 12 auf etwa 30 MB und blieb in den letzten vier Wechseln flach (28/31/31/30 MB). Wann der Browser aufräumt, lässt sich von der Seite aus nicht erzwingen.

### Etappe 2: Map 2 „Wolkenlagune“ und Gerüst für Map 3
- Map 2 ist eine Ringinsel um eine Lagune. Freischalten kostet 1 Billion €. Sie hat 7 Häuser (Map 1: 5), Preise vorläufig 2 Bio. € bis 2 Trill. € (× 10 pro Haus, liegen über dem Freischaltpreis). Die Feinabstimmung folgt in Etappe 5.
- Ebenen („Zonen“) pro Map: Boden, Wolkeninsel (16 m hoch) und Lagunengrund (7 m tief). Jede Ebene hat eigene Grenzen und Hindernisse, Auslöser und Häuser gehören zu einer Ebene. Die aktuelle Ebene wird mit der Position gespeichert.
- Zugang zur Wolkeninsel per Sprungpad (Bogenflug 1,3 s), zurück per Sprungpad auf der Insel. Zugang zum Lagunengrund per Tauchsteg (Absinken 1,6 s), zurück über den Auftauch-Ring. Benutzt wird beides mit E bzw. dem Knopf, damit man nicht aus Versehen springt.
- Unterwasser-Effekt: blauer, dichter Nebel (1–32 m), kein Himmel, 140 aufsteigende Blasen als Partikel mit per Code erzeugter runder Textur (16 × 16 Pixel), durchsichtige Wasseroberfläche (von oben sieht man die Kuppel). Im Haus und in der Arena wird der Nebel zurückgesetzt.
- Das Wolkenhaus nutzt ein kleineres Hausmodell, weil es auf der schwebenden Insel sonst keinen Platz hätte. Die Tiefseekuppel ist ein eigenes Modell (Glaskuppel mit Schleuse).
- Map 3 „Frostgipfel“ ist als Gerüst angelegt: Datensatz mit Farben und Preis (`ready: false`) und Bau-Funktion `frost.js`, die bis zum Ausbau die Baustelle in Frost-Farben zeigt.
- Die Kamera-Kollision gilt jetzt auf jeder Ebene (vorher nur am Boden).
- Speichertest mit echter Map 2 (10 Wechsel Kanalbucht ↔ Wolkenlagune): Geometrien bleiben bei 38/35, Texturen bei 3/9, Shader-Programme bei 15, Objekte in der Szene bei 8. Der JS-Heap pendelte zwischen 11 und 28 MB und lag am Ende bei 16 MB.
- Für die Unit-Tests gibt es eine kleine Canvas-Attrappe. So laufen die echten Bau-Funktionen aller Maps in Node und lassen sich auf vollständiges Entsorgen prüfen.

## 3D-Welt „Kanalbucht“ (Branch welt-v1)
- Der Branch `welt-v1` baut auf `ausbau` (Vlogvilla) auf, weil das der neueste Stand war. „Klassik“ ist deshalb Vlogvilla, nicht die allererste Version.
- Die 3D-Welt liegt auf `index.html`, das 2D-Spiel auf `klassik.html`. Beide verlinken sich gegenseitig (Startbild und Menü).
- three.js r170 als eine einzige Datei `vendor/three.module.min.js` (MIT, Lizenz liegt daneben). r170, weil es noch ohne Zusatzdateien auskommt. Es gibt keine weiteren Abhängigkeiten.
- Die 3D-Welt speichert unter eigenem Schlüssel `kanalbuchtSave_v1` mit Versionsnummer. Beim ersten Start übernimmt sie Geld, Abos und Videos aus dem neuesten 2D-Spielstand (`vlogvillaSave_v3`, sonst `creatorTycoonSave_v2`, sonst `creatorTycoonSave_v1`). Die 2D-Stände bleiben unberührt, Klassik spielt mit ihrem eigenen Stand weiter.
- Die Kamera ist in der dritten Person, weil man so Figur, Häuser und die Angriffe des Bosses besser sieht. Umsehen geht mit gedrückter Maustaste statt Pointer-Lock, das funktioniert überall ohne Rückfrage des Browsers.
- Innenräume sind Puppenhaus-Ansichten: Wände sind nach innen gerichtete Flächen, von draussen unsichtbar. Es gibt kein Dach, so verdeckt nichts die Kamera.
- Statische Teile (Boden, Häuser, Shop, Portal) sind zu wenigen Meshes mit Vertexfarben zusammengefügt. Bäume, Palmen, Laternen, Steine und Blumen sind Instanzen. Auf der Insel sind es rund 40 Draw-Calls und 34.000 Dreiecke.
- Grafikstufen: Niedrig (Pixel-Ratio 1, keine Echtzeit-Schatten, nur ein runder Schatten unter der Figur, Sicht 120 m, ohne Blumen und Wolken), Mittel (1,25, Schatten 1024, 180 m), Hoch (1,5, Schatten 2048, 260 m). „Automatisch“ startet am PC mit Mittel und am Handy mit Niedrig und schaltet herunter, wenn 3 Sekunden lang weniger als 45 FPS (PC) bzw. 28 FPS (Handy) laufen. Hochschalten tut sie nie.
- Kantenglättung (Antialias) ist am Handy aus, weil sie dort am meisten kostet. Sie lässt sich nur beim Start festlegen.
- Liefert der Browser keine Bild-Takte, obwohl die Seite sichtbar ist, hält ein Ersatz-Takt (alle 100 ms) das Spiel am Laufen. Ein wirklich versteckter Tab bleibt stehen und bekommt beim Zurückkommen den Offline-Gewinn.
- Die Tageszeit ist fester Nachmittag (Sonne von Südwesten, warmer Horizont). Die Arena hat eigene, violette Farben.
- Häuser kauft man der Reihe nach an ihrer Haustür. Jedes Haus bringt Aufrufe × 2,5 und eine grössere, besser eingerichtete Wohnung (50 m² bis 3.300 m², ab 1.000 m² wächst der Raum nicht mehr mit, damit er überschaubar bleibt).
- PC-Teile haben keine Höchststufe: Preis = Grundpreis × Wachstum ^ Stufe. Der WLAN-Router gehört auch in den Shop, weil der Upload vom WLAN abhängt.
- Portal: 5 Minuten Countdown, dann 60 Sekunden offen. Der Countdown läuft nur, solange gespielt wird (nicht offline).
- Boss „Glitchgolem“: 150 Leben, die Waffe macht alle 0,35 s 3 Schaden (Sieg nach gut 17 s), alle 2,6 s erscheint ein Zielkreis unter der Figur (jeder dritte Angriff mit zwei zusätzlichen Kreisen). Er schlägt nach 1,1 s ein. Drei Treffer, und man verliert.
- Kiste: Gewöhnlich 72 %, Selten 22 %, Episch 5 %, Legendär 1 %. Die Belohnung ist Geld im Wert von 2/6/20/80 normalen Videos, ab Selten gibt es Abos dazu, ab Episch einen dauerhaften Glücksbringer (+10 % bzw. +50 % Aufrufe).
- Play-Buttons heissen „Kanalknöpfe“: Platten mit Stern-Emblem in eigenen Farben (Silber bis Kosmos). Sie hängen an der Ostwand im Haus und geben je +25 % Aufrufe.
- Wer mit einem grossen 2D-Spielstand kommt (z. B. 1 Mrd. € aus Vlogvilla), kann sofort viele Häuser kaufen. Das ist so gewollt, weil „nichts geht verloren“ gilt.
- Für die 3D-Welt gibt es kein Balancing-Skript, nur Unit-Tests. Die Zahlen sind von Vlogvilla übernommen und angepasst, aber nicht über Stunden simuliert.

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
