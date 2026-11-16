# Entscheidungen

Eine Zeile pro Annahme, die ich ohne Rückfrage getroffen habe.

## Update 3 (Branch welt-v3)
- `welt-v3` baut auf `welt-v2` auf (Update 2 war beim Start noch nicht in `main` gemergt).

### Etappe 1: Hoverboard-Grundfunktion
- Die Fahrphysik ist reine Logik in `js3d/core/board.js` (ohne three.js, in Node getestet):
  - Das Board hat eine Richtung und eine Geschwindigkeit. Es dreht sich höchstens mit seiner Wendigkeit (rad/s) zur gewünschten Richtung und beschleunigt in seine eigene Richtung. Seitliches Rutschen baut sich schnell ab (`grip`).
  - Ohne Eingabe bremst die Reibung bis zum Stillstand. Das Höchsttempo hängt vom Joystick ab (halb gedrückt = halbes Tempo).
  - Wände: Die vorhandene Kollision (`physics.js`) schiebt das Board heraus. Der Anteil der Geschwindigkeit in die Wand hinein fällt weg, mit etwas Abprallen. Die Bewegung läuft in Schritten von höchstens 0,2 Einheiten, deshalb rutscht man auch bei hohem Tempo nicht durch dünne Wände (Test mit Tempo 200).
- Alle Zahlen stehen in `js3d/data/balance.js` (`W.board`, `W.boards`). Das erste Board „Kieselgleiter“ fährt 14 Einheiten/s (gehen 6, rennen 10).
- Das erste Board bekommt jeder geschenkt, neue Spieler und alte Spielstände. Stufe 1 soll das Board ohne Shop testbar machen. Kaufbare und seltene Boards kommen in Etappe 2.
- Spielstand Version 3: `boards` (Besitz) und `board` (ausgerüstet, `null` = keins). Die Migration 2 → 3 gibt das erste Board und zeigt einmal einen Hinweis. Ob man gerade fährt, wird nicht gespeichert: Nach dem Laden steht man immer zu Fuss da.
- Auf- und Absteigen mit H oder dem runden Knopf unten rechts (am Handy grösser, ohne Tastenhinweis). Beim Absteigen schwebt das Board noch 3 Sekunden an der Stelle und schrumpft dann weg. H holt es sofort zurück unter die Füsse.
- Ebenen: Sprungpads, Tauchsteg und Auftauchen funktionieren auch auf dem Board, man bleibt dabei stehen. Die Ebenen sind flach, echte Schrägen gibt es nicht. Die „Rampen“ sind deshalb die Sprungpads. Unter Wasser fährt das Board mit 55 % Tempo und Beschleunigung (gemessen: 7,7 statt 14). In Häusern, in der Arena und beim Map-Wechsel steigt man automatisch ab.
- Das Board ändert nichts an Geld oder Abos (Test: Einnahmen mit und ohne Board gleich).
- Modell aus einfachen Formen: flach gedrückte Kapsel als Deck, leuchtender Rand, Griffband, zwei leuchtende Schwebepolster und ein Lichtschein am Boden. Es schwebt mit leichtem Wippen und neigt sich in Kurven, die Figur lehnt mit. Pro Board-Art gibt es genau ein Modell. Es hängt an der Szene, nicht an der Map, und übersteht deshalb jeden Map-Wechsel ohne Neubau.
- **Messung** (Map 1, 1280 × 800, `kanalbucht.engine.benchmark(120)`, RTX 5080):

  | Stufe | ohne Board | mit Board |
  |---|---|---|
  | Niedrig | 48 Draw-Calls, 15.800 Dreiecke, 0,89 ms | 53 Draw-Calls, 17.000 Dreiecke, 0,84 ms |
  | Mittel | 85 Draw-Calls, 38.900 Dreiecke, 1,27 ms | 92 Draw-Calls, 40.700 Dreiecke, 1,08 ms |
  | Hoch | 99 Draw-Calls, 127.500 Dreiecke, 2,03 ms | 106 Draw-Calls, 129.300 Dreiecke, 1,22 ms |

  Das Board kostet 5 bis 7 Draw-Calls (mit Schatten) und etwa 1.500 Dreiecke. Die Zeitunterschiede liegen im Messrauschen dieser schnellen Grafikkarte. Dass „mit Board“ schneller wirkt, ist Zufall. Es gibt noch keine Spur. Sie kommt in Etappe 2 und ist bei Niedrig aus.

### Etappe 2: Mehrere Boards, Shop, Kisten
- Acht Boards in vier Seltenheiten, je Seltenheit eines aus dem Shop und eines nur aus Boss-Kisten. Bei Gewöhnlich ist das zweite das geschenkte erste Board.

  | Board | Seltenheit | Bezug | Tempo | Wendigkeit | Spur |
  |---|---|---|---|---|---|
  | Kieselgleiter | Gewöhnlich | geschenkt | 14 | 3,0 | keine |
  | Brisenbrett | Gewöhnlich | 25 Tsd. € | 15 | 3,3 | keine |
  | Korallenkufe | Selten | 2,5 Mio. € | 17 | 3,6 | Leuchtspur |
  | Polarpfeil | Selten | Kiste | 17 | 4,2 | Leuchtspur |
  | Nordlicht | Episch | 500 Mio. € | 20 | 4,0 | Funken |
  | Funkenflug | Episch | Kiste | 20 | 4,4 | Funken |
  | Sonnenwind | Legendär | 50 Mrd. € | 23 | 4,6 | Sterne |
  | Sternenstaub | Legendär | Kiste | 24 | 4,9 | Sterne |

- Preise, Fahrwerte und Kisten-Chancen stehen in `js3d/data/balance.js` (`boards`, `boardPrices`, `rarities.*.board`), Namen und Farben in `content.js`.
- Die Shop-Preise liegen ungefähr bei dem Geld, das man zur jeweiligen Zeit hat: 25 Tsd. nach etwa 20 Minuten, 2,5 Mio. vor Haus 4, 500 Mio. nach Map 1, 50 Mrd. auf dem Weg zur Billion. Ein Board kostet also spürbar Geld, das dann für Häuser fehlt. Das Balancing-Skript kauft keine Boards, weil sie kein Geld bringen. Die Zeiten dort gelten für Spieler ohne Board-Käufe.
- Kisten: Bei Selten 15 %, Episch 40 %, Legendär 60 % Chance auf ein Kisten-Board dieser Seltenheit, nur eines, das man noch nicht hat. Pro Bosssieg sind das im Schnitt 3,3 % (Selten), 2 % (Episch) und 0,6 % (Legendär). Ein Board aus der Kiste wird nicht automatisch ausgerüstet. Gekaufte schon, weil man sie gerade bewusst gewählt hat. Gewöhnliche Kisten würfeln nicht nach einem Board, deshalb ändert sich die Zufallsfolge nur bei seltenen Kisten. Die Balancing-Ziele sind weiter erfüllt (Test).
- Aussehen: Je seltener, desto mehr Schmuck. Selten hat Mittelstreifen und Heckflossen, Episch zusätzlich Seitenleuchten und grössere Polster, Legendär einen schwebenden, drehenden Ring und pulsierendes Leuchten. Pro Board werden die Formen zu zwei Meshes zusammengefügt (Deck matt, Leuchtteile unbeleuchtet), dazu der Lichtschein und bei Legendär der Ring. Das sind weniger Draw-Calls als in Etappe 1.
- Spur: Es gibt EIN Partikelsystem für alle Boards mit höchstens 120 Teilchen (`W.trailMax`). Es braucht einen Draw-Call. Teilchen entstehen nur beim Fahren, mehr bei höherem Tempo. Bei Grafik Niedrig ist die Spur aus. Additive Teilchen waren vor hellem Gras kaum zu sehen, deshalb haben sie jetzt normale Deckkraft (RGBA pro Teilchen) und einen hellen Kern.
- Shop: Der Bitbazar hat zwei Reiter, PC-Teile und Hoverboards. Jedes Board zeigt Vorschaufarben, Seltenheit, Spur und Balken für Tempo, Antrieb und Wendigkeit. Kauft man während der Fahrt ein anderes Board oder rüstet es aus, wechselt das Modell sofort.
- **Messung** (Map 1, 1280 × 800, fahrend, RTX 5080):

  | Stufe | zu Fuss | Kieselgleiter | Sternenstaub (mit Spur) |
  |---|---|---|---|
  | Niedrig | 48 Calls, 0,94 ms | 49 Calls, 1,09 ms | 50 Calls, 0,56 ms (Spur aus) |
  | Mittel | 85 Calls, 0,78 ms | 88 Calls, 0,79 ms | 90 Calls, 0,80 ms, 37 Teilchen |
  | Hoch | 99 Calls, 1,25 ms | 102 Calls, 1,23 ms | 104 Calls, 1,22 ms, 34 Teilchen |

  Ein Board kostet jetzt 1 bis 5 Draw-Calls (mit Schatten und Spur) und höchstens 1.700 Dreiecke. Die Zeitunterschiede sind wieder Messrauschen.

### Etappe 3: Versteckter Entwickler-Modus
- Ein Test- und Entwicklerwerkzeug für das eigene Einzelspieler-Spiel. Es gibt keine Online-Funktionen, also keine Auswirkung auf andere Spieler. So steht es auch als Kommentar im Code (`js3d/core/admin.js`, `js3d/ui/admin-ui.js`).
- Geste: 20 Tipps auf den Titel, höchstens 1 s zwischen zwei Tipps (genau 1,0 s zählt noch, mehr setzt den Zähler zurück). Gezählt wird beim Herunterdrücken (`pointerdown`), damit schnelles Tippen am Handy nicht verzögert wird. „Titel im Hauptmenü“ ist der Schriftzug „Kanalbucht“ auf dem Startbildschirm und die Überschrift „Menü“ im Pausenmenü. Beide zählen in denselben Zähler.
- Keine Rückmeldung: kein Ton, keine Meldung, keine Änderung an der Oberfläche. Im Browser geprüft: Das HTML des Menüs ist nach 20 Klicks identisch. Damit schnelles Klicken den Titel nicht blau markiert, sind die beiden Titel nicht markierbar und leuchten beim Tippen nicht auf.
- Der Bereich „Entwickler“ in den Einstellungen wird nur gebaut, wenn der Modus an ist. Ist er aus, gibt es kein verstecktes Element im Dokument. Das Wort „Admin“ kommt nur im Code vor. Ein Test durchsucht die Texte der Oberfläche danach.
- Der Modus lebt nur im Arbeitsspeicher, nicht im Spielstand und nicht im Browser-Speicher. Nach dem Neuladen ist er aus. Gesetzte Werte bleiben wie normaler Fortschritt im Spielstand.
- Zurücksetzen: Beim ersten Einschalten in einer Sitzung merkt sich das Spiel Geld, Abos, Kanalknöpfe, Maps, Häuser und Boards.
  - „Entwicklerdaten zurücksetzen“ stellt diesen Stand wieder her und schaltet „Bosskampf überspringen“ und „Zeit × 10“ aus.
  - „Freischaltungen zurücksetzen“ stellt nur Maps, Häuser und Boards wieder her, Geld und Abos bleiben.
  - Nach dem Neuladen ist dieser Merker weg. Dann gibt es nichts mehr zurückzusetzen, die Werte sind normaler Fortschritt.
  - Liegt man nach dem Zurücksetzen auf einer wieder gesperrten Map, reist das Spiel in die Kanalbucht.
- Grosse Zahlen: Eingabe als Zahl plus Einheit (Tsd. bis Dezilliarde, 10^63). Die Eingabe wird mit BigInt exakt eingelesen und angezeigt, z. B. „100'000 Trilliarden = 100 Quadr. € (100'000'000'000'000'000'000'000'000)“. Erst danach wird sie zur normalen Zahl (double). Das Spiel rechnet weiter mit doubles: Begründung siehe Etappe 5 von Update 2, Obergrenze 1e300. Erlaubt sind Apostroph, Leerzeichen und Punkte als Tausendertrenner, das Komma als Dezimalzeichen und `e` (z. B. `3e9`). Beträge unter 1 € fallen weg.
- Die Anzeige (`js/core/format.js`) kennt jetzt Kurzformen bis „Dezd.“ (10^63), darüber kommt die wissenschaftliche Schreibweise. Vorher war ab 10^36 Schluss. Das gilt auch für Klassik, dort ändert sich nur die Anzeige sehr grosser Zahlen.
- Abos setzen vergibt sofort alle Kanalknöpfe, deren Schwelle erreicht ist, mit der normalen Meldung. Senkt man die Abos, bleiben verdiente Knöpfe (wie im normalen Spiel). Weg gehen sie nur mit „Entwicklerdaten zurücksetzen“. Neue Video-Spiele hängen direkt an den Abos und sind sofort frei.
- „Alles freischalten“: alle fertigen Maps (Frostgipfel ist noch ein Gerüst und bleibt zu), alle Häuser darauf und alle 8 Boards.
- „Bosskampf überspringen“: Das Boss-Portal öffnet direkt die Kiste und zählt als Sieg. „Zeit × 10“ beschleunigt nur Einnahmen, Spielzeit und Portal-Countdown, nicht das Laufen.

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

### Etappe 3: NPC-YouTuber
- Pro fertiger Map gibt es 7 (Map 1) bzw. 8 (Map 2) NPCs, definiert in `maps.js` unter `npcPaths`: Name, Farben, Abos am Anfang, Wachstum pro Spielstunde, Tempo und Weg. Alle Namen sind erfunden (Muschelmia, Brezel-Bruno, Wellenwanda, Kapitän Klick …).
- Abozahlen: Map 1 von 830 bis 210.000, Map 2 von 4,2 Mio. bis 870 Mio. Sie wachsen um 0,5–5 % pro Spielstunde und werden aus der gespeicherten Spielzeit berechnet. Es braucht also kein neues Feld im Spielstand, und die Zahl springt nach dem Neuladen nicht zurück.
- Wege: Wegpunkte als Schleife (Rundwege per Kreis-Hilfsfunktion), gerade Strecken, 1,2 s Pause an jedem Wegpunkt, kein Pathfinding. NPCs gehen durch Hindernisse hindurch und blockieren den Spieler nicht.
- Grafik: Alle NPCs einer Map teilen sich 8 InstancedMeshes (Beine, Körper, Arme, Kopf, Haare, Augen), also 8 Draw-Calls unabhängig von der Anzahl. Animation nur durch Bein- und Armschwung, beim Reden winkt der rechte Arm.
- Namensschilder: ein gemeinsamer Canvas-Atlas (eine Zeile pro NPC). Jedes Schild ist ein Ausschnitt mit derselben Bildquelle (eine GPU-Textur). Der Atlas wird alle 10 s Spielzeit neu gezeichnet. Schilder sind nur bis 32 m sichtbar.
- NPCs ausserhalb der Sichtweite (höchstens 70 m bzw. 45 % der Kamera-Sichtweite) werden ausgeblendet und bewegen sich nicht. Im Haus und in der Arena ist die ganze Map samt NPCs unsichtbar und pausiert.
- Reden: In der Nähe (unter 3,2 m) erscheint „Mit … reden“ (E oder Knopf). Der NPC bleibt 3,5 s stehen, dreht sich zum Spieler, winkt und sagt einen von 10 Sätzen in einer Sprechblase. Es gibt nur eine Sprechblase pro Map.
- Draw-Calls mit NPCs: Map 1 etwa 52, Map 2 etwa 53 (vorher 39 bzw. 44).

### Etappe 4: Grafikstufe „Hoch“
- Niedrig und Mittel sind unverändert wie in Version 1 (Lambert-Materialien, kein Tonemapping, keine Nachbearbeitung). „Hoch“ schaltet zur Laufzeit um, ohne die Map neu zu laden:
  - Materialien: Lambert wird zu MeshStandard (Rauigkeit 0,86, Wasser 0,08). Beim Zurückschalten kommen die Originale wieder (`userData.lowMat`). Geteilte Materialien bleiben geteilt (Cache).
  - Per Code erzeugte Oberflächen: eine 128 × 128-Rauschtextur, aufgetragen über die Weltposition (die zusammengefügten Meshes haben keine Texturkoordinaten). Böden werden fleckig (Gras, Sand), Wände bekommen Putzkorn, braune Flächen Holzmaserung. Figuren (Spieler, NPCs) bleiben glatt, sonst bekam die Haut Maserung.
  - Licht: Umgebungslicht aus einer per PMREM gerenderten Himmelskugel. Es wird nur neu berechnet, wenn sich die Himmelsfarben ändern (nicht jedes Bild beim Tauchen). Sonne 3,4, Himmelslicht 0,9.
  - Weiche Schatten per VSM (Radius 6, 2048 px). Niedrig/Mittel bleiben bei PCF.
  - Wasser: glatt und spiegelnd, mit wandernden Wellen in der Normalen.
  - Nachbearbeitung (eigene kleine Pipeline, ohne three.js-Zusatzmodule): HDR-Bild mit 4× MSAA, Umgebungsverdeckung aus der Tiefe (10 Proben, halbe Auflösung, weichgezeichnet), leichtes Bloom (halbe Auflösung), Neutral-Tonemapping. ACES wirkte zu blass, Neutral hält die Farben kräftig.
  - Mehr Details, nur in Hoch sichtbar: Fensterbänke mit Blumenkästen, Fensterläden, Eckleisten, Vordach mit Lampe, Dachrinne und rund 2.000 Grasbüschel pro Map (je ein Mesh). Sie werden immer mitgebaut, kosten in Niedrig/Mittel aber keinen Draw-Call.
- Vorschlag beim ersten Start („Automatisch“): Handy Niedrig, PC mit mindestens 4 Kernen und MSAA-fähiger Grafik Hoch, sonst Mittel. Beim ersten Spielen erscheint ein Hinweis, auf welche Stufe gestellt wurde.
- Automatische Herabstufung (`js3d/core/quality.js`): Hoch → Mittel unter 50 FPS, Mittel → Niedrig unter 45 FPS (PC) bzw. 28 FPS (Handy), jeweils gemittelt über 3 Sekunden. Hochgeschaltet wird nie automatisch. Im Spiel geprüft: Bei vorgespielten 20 FPS ging es nach 5,6 s auf Mittel und nach 10,6 s auf Niedrig.
- Die Debug-Anzeige zählt Draw-Calls und Dreiecke jetzt über alle Durchgänge eines Bildes (Schatten, Szene, Nachbearbeitung).
- **Messung** (Renderzeit pro Bild mit Warten auf die GPU, `kanalbucht.engine.benchmark()`, 1280 × 800, Pixel-Ratio 1, NVIDIA RTX 5080):

  | Map | Stufe | ms/Bild | mögliche FPS | Draw-Calls | Dreiecke |
  |---|---|---|---|---|---|
  | Kanalbucht | Niedrig | 0,98 | ~1.020 | 48 | 15.800 |
  | Kanalbucht | Mittel | 1,36 | ~730 | 86 | 38.900 |
  | Kanalbucht | Hoch | 3,39 | ~300 | 100 | 127.500 |
  | Wolkenlagune | Niedrig | 0,58 | ~1.730 | 43 | 13.400 |
  | Wolkenlagune | Mittel | 0,77 | ~1.300 | 76 | 28.200 |
  | Wolkenlagune | Hoch | 1,34 | ~740 | 90 | 107.800 |

  Die Grafikkarte ist sehr stark, die absoluten Zahlen sagen über normale PCs und Handys wenig. Aussagekräftig ist das Verhältnis: Hoch kostet auf Map 1 etwa 2,5-mal so viel wie Mittel und 3,5-mal so viel wie Niedrig. Die im Test-Browser angezeigten FPS (10–50) kommen vom Hintergrundfenster und sind nicht verwertbar. Auf einem echten Handy und einem normalen PC habe ich nicht gemessen.

### Etappe 5: Balancing
- **Eine Zahlen-Datei:** Alle Zahlen der 3D-Welt stehen jetzt in `js3d/data/balance.js` (Wirtschaft, Map-Freischaltung, Hauspreise, PC-Teile, Spiele, Play-Buttons, Kiste, Glücksbringer, Boss, Video). `content.js` und `maps.js` enthalten nur noch Namen, Symbole und Orte und holen die Zahlen von dort.
- Das Skript heisst `tools/balance-welt.js`, weil `tools/balance.js` schon die Simulation des 2D-Spiels (Klassik) ist. Es benutzt dieselbe Spiellogik wie das Spiel (`js3d/core/*`), nicht eine Nachbildung. Die Ziele stehen oben im Skript (`TARGETS`), das Spielermodell darunter (`PLAYER`).
- **Erste Messung** mit den Zahlen aus Version 1: Map 1 nach 56 Minuten, die 1 Billion erst 37 Stunden danach. Beides lag ausserhalb der Ziele.
- **PC-Teile wirken jetzt multiplikativ** (Video × (1 + Qualität) pro Stufe). Vorher wurden die Boni addiert, deshalb waren Teile spät fast wertlos und die Lücke bis zur Billion riesig. Die multiplikative Fassung kann davonlaufen: Bringt eine Kaufrunde aller sechs Teile mehr, als ihre Preise steigen, finanziert sich jede Runde selbst (beim ersten Versuch war alles in 10 Minuten gekauft). Darum sind die Qualitätswerte klein (zusammen etwa × 1,42 pro Runde bei Preisen × 1,5 bis × 1,6). In der Datei steht dazu eine Warnung.
- Weitere angepasste Zahlen: Geld pro Aufruf 0,035 (Map 1 sonst zu schnell), passive Aufrufe 0,1 pro Abo und Sekunde (sonst trägt das passive Geld allein bis zur Billion), Mindestgeld aus der Kiste 20.000 € (hilft am Anfang, später zählt der Videowert).
- Annahmen im Spielermodell: 85 % getroffene Buchstaben, 6 Tipper/s, 8 s Wege und Auswahl pro Video, 85 % gewonnene Bosskämpfe mit je 45 s. Gekauft wird zuerst das nächste Haus, dann die nächste Map, PC-Teile nur, wenn das günstigste unter 4 % des nächsten Ziels kostet.
- **Ergebnis** (Seed 1):

  | Meilenstein | aktiver Spieler | oft offline: aktiv | oft offline: echte Zeit |
  |---|---|---|---|
  | Erstes Haus (50.000 €) | 24 min | – | – |
  | Map 1 komplett | 3 h 48 min | 3 h | 24 h |
  | Map 2 freigeschaltet (1 Bio. €) | 7 h 41 min | 6 h 15 min | 54 h 15 min |
  | Abstand Map 1 → Map 2 | 3 h 53 min | 3 h 15 min | – |

  Der Gelegenheitsspieler spielt 20 Minuten und ist dann 3 Stunden weg (Offline-Einnahmen 50 %, höchstens 8 h). Er braucht weniger aktive Zeit, aber über zwei Tage echte Zeit. Mit den Startwerten 1 bis 5 lag Map 1 zwischen 3 h 42 min und 4 h 15 min, der Abstand zur Billion zwischen 3 h 24 min und 4 h 8 min. Der Test `tests/balance-welt.test.js` prüft die Ziele mit drei Startwerten.
- Auf Map 2 wird es am Ende schnell: Alle 7 Häuser sind etwa 4 Stunden nach dem Freischalten gekauft, weil jedes Haus × 2,5 Aufrufe bringt. Für Map 3 (Frostgipfel, 10 Billiarden) braucht es eigene Zahlen, wenn sie gebaut wird. Das Skript zeigt das dann sofort.
- **Grosse Zahlen:** Geld und Abos bleiben normale JavaScript-Zahlen (double, bis etwa 1e308, Obergrenze 1e300). BigInt wäre exakt, passt aber nicht zu Multiplikatoren mit Kommazahlen und hätte einen Umbau des ganzen Spiels bedeutet. Ab 2^53 (etwa 9 Billiarden) sind Doubles nicht mehr auf den Euro genau. Damit dabei nichts schiefgeht, gibt es `js3d/core/num.js`:
  - `canAfford` erlaubt eine relative Abweichung von 1e-14 (bei 1 Billion sind das 0,01 €), damit 999.999.999.999,9999 € für einen Preis von 1 Billion reichen. 1e-12 war zu grosszügig (1 € bei 1 Billion).
  - `spend` setzt einen winzigen Rest auf 0 und wird nie negativ. `addClamped` hält Werte unter der Obergrenze.
  - Die Anzeige rundet auf Tsd., Mio., Mrd. und Bio. Alles ist in `tests/num.test.js` getestet.
- **Abschluss-Check** (Grafik Hoch, nach 10, 20 und 30 Map-Wechseln): Geometrien 41, Texturen 18, Shader-Programme 28, Szenen-Objekte 8, alles gleichbleibend. Der JS-Speicher pendelt zwischen 21 und 42 MB und fällt nach der Speicherbereinigung wieder auf 21 MB. Die Konsole blieb ohne Fehler. Klassik ist über das Startmenü erreichbar, und von dort führt ein Knopf zurück in die 3D-Welt.

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
