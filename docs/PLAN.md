# Plan: Szenen-Umbau

## Dateistruktur
```
index.html            Hülle: HUD, Navigation, Szenen-Bühne, Overlays
css/base.css          Farben, Layout, Bausteine (Karten, Knöpfe, Navigation)
css/scenes.css        Stile der einzelnen Szenen
js/main.js            Start: lädt Spielstand, verbindet alles
js/core/              Logik ohne DOM (läuft auch in Node)
  store.js            Zustand + Ereignisse/Abos
  loop.js             Spiel-Loop mit festen Zeitschritten
  save.js             Speichern, Versionen, Migration, Export/Import
  format.js           Zahlenformat
  formulas.js         Formeln (Einnahmen, Kosten, Multiplikatoren)
  game.js             Spielzüge (Video, Kauf, Tick, Offline)
  events.js           Zufalls-Ereignisse
  prestige.js         Neuer Kanal, Ruhm, Boni
  goals.js            Tagesziele
  actions.js          Verbindet Spielzüge mit dem Store
  audio.js            Töne über Web Audio
  scenes.js           Szenen-Manager
js/data/              Alle Inhalte als Daten (eine Zeile = ein neuer Inhalt)
js/scenes/            Eine Datei pro Szene, index.js listet sie auf
js/ui/                Kleine DOM-Helfer, HUD, Navigation, Toast
tests/                Unit-Tests (node --test)
tools/                balance.js (Simulation), server.js (lokaler Server)
docs/                 Plan und Entscheidungen
```

## Szenen
| Szene | Zweck |
|---|---|
| titel | Start: Weiter, Neues Spiel, Offline-Bonus |
| tutorial | Drei kurze Schritte für neue Spieler |
| studio | Hauptszene: Video aufnehmen, Tagesziele, aktive Boni |
| shop | Ausrüstung und Team kaufen |
| awards | Awards-Regal mit Fortschritt |
| karriere | Neuer Kanal (Prestige), Ruhm-Boni, Statistik |
| einstellungen | Ton, Animationen, Export/Import, Neustart |
| Overlays | ereignis (Sponsor-Deal, Trend, Shitstorm …), viral, bestaetigen |

## Etappen
1. Struktur + Szenen-Manager, bestehendes Spiel läuft darin
2. Szenen aufteilen, Navigation
3. Speichern/Migration + Tests
4. Neue Inhalte (Prestige, Ereignisse, Tagesziele) + Balancing
5. Feinschliff (Ton, Animationen, Einstellungen, README)
