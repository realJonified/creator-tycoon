# 🏡 Vlogvilla

Ein Video-Creator-Simulator im Browser: Starte im Gartenhäuschen mit einem alten Rechner, mach Videos, sammle Abonnenten und zieh um, bis du im Sternenschloss wohnst.

## 👉 [Jetzt spielen!](https://realjonified.github.io/creator-tycoon/)

## So spielst du
1. **Thema wählen:** Acht Fantasie-Spiele, von *Schleimrennen* bis *Robo-Fussball*. Jedes hat eigene Zuschauer und wird ab einer bestimmten Abo-Zahl frei.
2. **Aufnehmen:** Buchstaben erscheinen auf dem Bildschirm. Tippe sie an (oder drück sie auf der Tastatur), bevor sie verschwinden. Treffer in Folge zählen mehr.
3. **Schneiden:** Tippe so schnell du kannst. Dabei kommen Schnitte, Effekte, Musik und mehr dazu, bis zu 200 % Qualität.
4. **Hochladen:** Wie lange das dauert, hängt von deinem WLAN ab. Am Anfang dauert es 30 Sekunden, mit Router und WLAN-Boxen geht es schneller.

Aus Punkten, Qualität und Thema entstehen Aufrufe, Geld 💰, Abos 👥 und Juwelen 💎.

- **Shop:** PCs, Mikrofone, Mäuse, Tastaturen, Router, WLAN-Boxen und Handys. Bessere Geräte brauchen ein grösseres Haus.
- **Häuser:** 20 Stück. Das erste ist gratis, das zweite kostet 50.000 €, jedes weitere 10-mal so viel. Jedes Haus bringt mehr Aufrufe.
- **Kisten:** Mit Juwelen öffnest du Kisten mit Hoverboards (ein Bonus pro ausgerüstetem Board) und PC-Teilen (stärker als Shop-Geräte). Es gibt vier Seltenheiten, von gewöhnlich bis legendär.
- **Awards:** Goldene Abzeichen bei 100.000, 1 Mio., 10 Mio., 100 Mio., 500 Mio., 1 Mrd., 50 Mrd., 500 Mrd. und 1 Billion Abos. Jeder gibt dauerhaft mehr Aufrufe und Juwelen.
- Alte Videos bringen nebenbei Geld, auch offline (bis 8 Stunden, 50 %).
- Tastatur: `1`–`6` wechselt die Szene (nicht während eines Videos), `Esc` schliesst ein Fenster.

## Szenen
| Szene | Datei | Zweck |
|---|---|---|
| Start | `js/scenes/titel.js` | Startbild, Spielen, Neues Spiel, Offline-Gewinn |
| Tutorial | `js/scenes/tutorial.js` | Vier kurze Schritte |
| Haus | `js/scenes/haus.js` | Dein Haus, deine Figur, dein Setup, nächster Umzug |
| Video | `js/scenes/video.js` | Thema → Aufnahme → Schnitt → Upload → Ergebnis |
| Shop | `js/scenes/shop.js` | Geräte, WLAN, Handy, Häuser |
| Kisten | `js/scenes/kisten.js` | Kisten öffnen, Hoverboards ausrüsten, PC-Teile |
| Awards | `js/scenes/awards.js` | Goldene Abzeichen und Fortschritt |
| Optionen | `js/scenes/einstellungen.js` | Ton, Animationen, Export/Import, Neustart |
| Overlays | `js/scenes/overlay-*.js` | Award freigeschaltet, Rückfrage |

## Ordnerstruktur
```
index.html          Hülle: Kopfzeile, Navigation, Szenen-Bühne, Overlays
css/                base.css (Farben, Layout, Bausteine), scenes.css (Szenen)
js/main.js          Start: lädt den Spielstand und verbindet alles
js/core/            Logik ohne DOM, läuft auch in Node
  store.js            Zustand mit Ereignissen und Abos
  loop.js             Loop mit festen Zeitschritten
  save.js             Speichern, Version, Migration, Export/Import
  format.js           Zahlenformat (Tsd., Mio., Mrd., Bio., Brd., Trill. …)
  formulas.js         alle Formeln (Aufrufe, Geld, Abos, Upload, Boni)
  video.js            Aufnahme und Schnitt
  crates.js           Kisten öffnen
  game.js             Spielzüge (Video auswerten, kaufen, umziehen, Zeit)
  actions.js          führt Spielzüge aus und meldet sie über den Store
  audio.js            Töne über Web Audio
  scenes.js           Szenen-Manager
js/data/            Alle Inhalte als Daten
js/scenes/          Eine Datei pro Szene, index.js listet sie auf
js/ui/              DOM-Helfer, Grafik (art.js), Kopfzeile, Meldungen
tests/              Unit-Tests
tools/              balance.js (Simulation), server.js (lokaler Server)
docs/               ENTSCHEIDUNGEN.md
```

## Neue Inhalte hinzufügen
Alle Inhalte stehen in `js/data/`, eine Zeile reicht. Die `id` darf sich danach nie mehr ändern, weil sie im Spielstand steht.

| Was | Datei | Beispiel |
|---|---|---|
| Thema | `topics.js` | `{ id: 'pilze', icon: '🍄', name: 'Pilzpost', audience: 'Rätselfans', points: 20, pace: 0.55, money: 1.4, subs: 1.6, minSubs: 1e9 }` |
| Haus | `houses.js` | Farben, Stockwerke, Dachform und Deko, das Bild entsteht daraus |
| Gerät | `gear.js` | `{ id: 'pc8', icon: '🌌', name: 'Galaxie-Rechner', price: 2e19, mult: 70, house: 16 }` |
| Hoverboard | `crates.js` | `{ id: 'regen', name: 'Regenbogen', rarity: 'episch', color: '#f0abfc', bonus: { type: 'money', value: 0.8 } }` |
| PC-Teil | `crates.js` | `{ id: 'cpu5', slot: 'cpu', name: '…', rarity: 'legendaer', bonus: 4 }` |
| Kiste | `crates.js` | Kosten, Inhalt (`board`/`part`) und Wahrscheinlichkeiten |
| Award | `awards.js` | `{ id: 'x', icon: '🌠', name: 'Goldene …', subs: 1e13, bonus: 0.5, gems: 600 }` |
| Zahlen | `balance.js` | alle Stellschrauben |

Danach `node --test` und `node tools/balance.js` starten.

## Neue Szene hinzufügen
1. Lege eine Datei in `js/scenes/` an:
```js
import { h } from '../ui/dom.js';

export default {
  id: 'statistik', title: 'Statistik', icon: '📊',
  nav: true, order: 7,          // erscheint in der Navigation
  create(ctx) {                 // ctx: S (Zustand), game, scenes, audio, toast, persist …
    let text;
    return {
      mount(el, params) { el.append(h('h1', null, 'Statistik'), text = h('p')); },
      render() { text.textContent = `${ctx.S.videos} Videos`; },
      update(dt) {},            // optional, fester Zeitschritt (0,1 s)
      unmount() {},             // optional
    };
  },
};
```
2. Trage sie in `js/scenes/index.js` ein.

Wechseln mit `ctx.scenes.go('statistik')`, Overlays mit `ctx.scenes.openOverlay('id', { … })`.

## Lokal testen
Du brauchst nur [Node.js](https://nodejs.org) ab Version 20.

```bash
node tools/server.js
```
Danach läuft das Spiel auf http://localhost:8123. Per Doppelklick geht es nicht, weil Browser ES-Module nur über einen Server laden.

```bash
node --test
```
Unit-Tests für Formeln, Kosten, Video-Ablauf, Kisten-Wahrscheinlichkeiten, Speichern/Migration und Balancing.

```bash
node tools/balance.js
```
Simuliert einen Spieler und zeigt, wann Häuser und Awards erreicht werden. Optionen: `--stunden=50`, `--treffer=0.7`, `--tipps=4`, `--seed=3`.

In der Browser-Konsole gibt es `vlogvilla` zum Ausprobieren, zum Beispiel `vlogvilla.S.gems = 1000`.

## Balancing
Ein simulierter Spieler (85 % Treffer, 6 Tipper/s, kauft sinnvoll, öffnet alle Kisten) erreicht:

| Meilenstein | Zeit |
|---|---|
| 2. Haus (50.000 €) | 6 min |
| 4. Haus (5 Mio. €) | 15 min |
| 100.000 Abos | 42 min |
| 1 Mio. Abos | 1 h 5 min |
| 10 Mio. Abos | 1 h 36 min |
| 10. Haus (5 Bio. €) | 1 h 21 min |
| 1 Mrd. Abos | 2 h 51 min |
| 50 Mrd. Abos | 8 h 15 min |
| 1 Billion Abos | 37 h |
| 20. Haus (50 Trd. €) | 45 h |

Die wichtigsten Formeln (alle Zahlen in `js/data/balance.js`):
- **Aufrufe** = Punkte × (0,4 + Qualität) × Reichweite × Bonus. Reichweite = 1 + 0,5 × log10(Abos), Bonus = Häuser × Handy × Awards × Hoverboard.
- **Geld** = Aufrufe × 3 € × Thema × Hoverboard.
- **Neue Abos** = 1,1 × Aufrufe^0,45 × Thema × Hoverboard. Wegen des Exponenten unter 1 wachsen grosse Kanäle langsamer.
- **Häuser:** Haus 1 bringt × 2,6, jedes weitere 0,06 mehr. Bei 10-mal teureren Häusern wird jeder Umzug länger, bleibt aber erreichbar.

Ein Test (`tests/balance.test.js`) prüft die Ziele: erstes Haus nach 2 bis 10 Minuten, 100.000 Abos nach 30 bis 60 Minuten, danach länger werdende Abstände.

## Spielstand
Der Spielstand liegt im Browser unter `vlogvillaSave_v3`. Spielstände der alten Versionen (`creatorTycoonSave_v1`, `_v2`) werden beim Start automatisch übernommen. Geld, Abos und Videos bleiben, alte Ausrüstung wird zu Juwelen. Für eine neue Version erhöhst du `VERSION` in `js/core/game.js` und ergänzt eine Migration in `js/core/save.js`.
