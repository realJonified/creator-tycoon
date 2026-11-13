# 🎬 Creator Tycoon

Ein Idle-Spiel im Browser: Nimm Videos auf, verdiene Geld 💰 und sammle Abonnenten 👥.

## 👉 [Jetzt spielen!](https://realjonified.github.io/creator-tycoon/)

## So spielst du
- **Video aufnehmen** bringt Geld und Abos. Mit etwas Glück geht ein Video viral (×10).
- **Ausrüstung** macht jedes Video wertvoller, das **Team** verdient von allein.
- **Abonnenten** erhöhen alle Einnahmen, **Awards** geben je +25 %.
- **Ereignisse** tauchen als Knopf auf: Sponsor-Deal, Trend-Thema, Gemeinschafts-Video, Shitstorm.
- **Tagesziele**: drei pro Tag. Jedes bringt Geld, alle drei zusammen 10 Minuten lang ×2.
- **Neuer Kanal**: Ab 2 Mio. Abos kannst du neu anfangen und bekommst Ruhm ⭐ für dauerhafte Boni.
- Der Spielstand wird automatisch gespeichert. Offline verdienst du bis zu 8 Stunden mit 50 % weiter.
- Tastatur: `1`–`5` wechselt die Szene, `Esc` schliesst ein Fenster.

## Szenen
| Szene | Datei | Zweck |
|---|---|---|
| Titel | `js/scenes/titel.js` | Weiter, Neues Spiel, Anzeige des Offline-Gewinns |
| Tutorial | `js/scenes/tutorial.js` | Drei kurze Schritte für neue Spieler |
| Studio | `js/scenes/studio.js` | Hauptszene: Video aufnehmen, aktive Boni, Tagesziele |
| Shop | `js/scenes/shop.js` | Ausrüstung und Team kaufen (×1, ×10, Max) |
| Awards | `js/scenes/awards.js` | Awards-Regal mit Fortschritt |
| Karriere | `js/scenes/karriere.js` | Neuer Kanal, Ruhm-Boni, Statistik |
| Optionen | `js/scenes/einstellungen.js` | Ton, Animationen, Export/Import, Neustart |
| Overlays | `js/scenes/overlay-*.js` | Ereignis, viraler Hit, Rückfrage |

## Ordnerstruktur
```
index.html          Hülle: Kopfzeile, Navigation, Szenen-Bühne, Overlays
css/                base.css (Farben, Layout, Bausteine), scenes.css (Szenen)
js/main.js          Start: lädt den Spielstand und verbindet alles
js/core/            Logik ohne DOM, läuft auch in Node
  store.js            Zustand mit Ereignissen und Abos
  loop.js             Loop mit festen Zeitschritten
  save.js             Speichern, Version, Migration, Export/Import
  format.js           Zahlenformat
  formulas.js         Formeln (Einnahmen, Kosten, Multiplikatoren)
  game.js             Spielzüge (Video, Kauf, Tick, Offline-Gewinn)
  events.js           Ereignisse
  prestige.js         Neuer Kanal und Ruhm
  goals.js            Tagesziele
  actions.js          führt Spielzüge aus und meldet sie über den Store
  audio.js            Töne über Web Audio
  scenes.js           Szenen-Manager
js/data/            Alle Inhalte als Daten
js/scenes/          Eine Datei pro Szene, index.js listet sie auf
js/ui/              DOM-Helfer, Kopfzeile und Navigation, Meldungen
tests/              Unit-Tests
tools/              balance.js (Simulation), server.js (lokaler Server)
docs/               PLAN.md, ENTSCHEIDUNGEN.md
```
Es gibt keinen Build-Schritt und keine Abhängigkeiten. Der Browser lädt die ES-Module direkt, deshalb läuft das Spiel auf GitHub Pages so, wie es im Repo liegt.

## Neue Inhalte hinzufügen
Alle Inhalte stehen in `js/data/`. Eine neue Zeile genügt, Oberfläche und Tests übernehmen sie von selbst.

| Was | Datei | Beispiel |
|---|---|---|
| Ausrüstung | `equipment.js` | `{ id: 'drohne', icon: '🚁', name: 'Drohne', add: 50000, base: 4e9 }` |
| Team | `team.js` | `{ id: 'sender', icon: '📡', name: 'Eigener Sender', rate: 600000, base: 3e11 }` |
| Award | `awards.js` | `{ id: 'mythos', icon: '🌟', name: 'Mythos', subs: 1e10 }` |
| Ereignis | `events.js` | Eintrag mit `choices` und Wirkungen, die Wirkungen sind oben in der Datei erklärt |
| Tagesziel | `goals.js` | `{ id: 'ruhm', icon: '⭐', stat: 'events', text: 'Mach bei {n} Ereignissen mit', target: 5 }` |
| Ruhm-Bonus | `prestige.js` | `{ id: 'x', icon: '✨', name: '…', effect: 'money', per: 0.1, max: 10, cost: 3, costStep: 2, desc: '…' }` |
| Stellschrauben | `balance.js` | Alle Zahlen des Balancings |

Wichtig: Eine `id` darf sich nie mehr ändern, sie steht in den Spielständen. Starte nach Änderungen `node --test` und `node tools/balance.js`.

## Neue Szene hinzufügen
1. Lege eine Datei in `js/scenes/` an:
```js
import { h } from '../ui/dom.js';

export default {
  id: 'statistik', title: 'Statistik', icon: '📊',
  nav: true, order: 6,           // erscheint in der Navigation (weglassen für Szenen ohne Navigation)
  create(ctx) {                  // ctx: S (Zustand), game, scenes, audio, toast, store, persist …
    let text;
    return {
      mount(el, params) { el.append(h('h1', null, 'Statistik'), text = h('p')); },
      render() { text.textContent = `${ctx.S.videos} Videos`; },   // etwa 10× pro Sekunde
      update(dt) {},             // optional: fester Zeitschritt
      unmount() {},              // optional: aufräumen
    };
  },
};
```
2. Trage sie in `js/scenes/index.js` ein (Import und ein Eintrag in `SCENES`).

Wechseln: `ctx.scenes.go('statistik')`. Ein Overlay ist eine Szene ohne `nav`, geöffnet mit `ctx.scenes.openOverlay('id', { … })`. Mit `modal: false` blockiert es nichts.

## Lokal testen
Du brauchst nur [Node.js](https://nodejs.org) (ab Version 20), sonst nichts.

```bash
node tools/server.js
```
Danach läuft das Spiel auf http://localhost:8123. Eine Datei per Doppelklick zu öffnen reicht nicht, weil Browser ES-Module nur über einen Server laden.

```bash
node --test
```
Führt die Unit-Tests aus (Zahlenformat, Formeln, Kosten, Spielzüge, Loop, Speichern/Migration, Ereignisse, Prestige, Tagesziele, Balancing).

```bash
node tools/balance.js
```
Simuliert einen kaufenden Spieler und zeigt, wann Awards und der neue Kanal erreicht werden. Optionen: `--klicks=3`, `--minuten=180`, `--seed=7`, `--ohne-ereignisse`, `--verlauf`.

In der Browser-Konsole gibt es `creatorTycoon` zum Ausprobieren, zum Beispiel `creatorTycoon.S.money = 1e6`.

## Balancing
Das erste Balancing war zu schnell: Die Simulation holte alle acht Awards in unter 4 Minuten. Jetzt gilt für einen Spieler mit 2 Videos pro Sekunde:

| Meilenstein | Abos | Zeit |
|---|---|---|
| Erste Fans | 200 | 1 min |
| Geheimtipp | 2.500 | 3 min |
| Aufsteiger | 25.000 | 8 min |
| Silber-Award | 250.000 | 20 min |
| Gold-Award, neuer Kanal möglich | 2 Mio. | 38 min |
| Diamant-Award | 10 Mio. | 1 h |
| Rubin-Award | 100 Mio. | 1 h 52 min |
| Zweiter Kanal bis zum nächsten Neustart | 2 Mio. | 29 min |

Wer 4 Videos pro Sekunde schafft, ist nach 18 Minuten beim neuen Kanal, mit 1 Video pro Sekunde dauert es 66 Minuten.

Die Zahlen dahinter (alle in `js/data/balance.js`):
- **Abo-Bonus** = 1 + √Abos ÷ 400 (vorher ÷ 40). Bei 2 Mio. Abos ist das ×4,5 statt ×36. Das war der Hauptgrund für das Davonlaufen.
- **Abos pro Video** = 10 % des Basiswerts (vorher 50 %), **pro Aufruf des Teams** 0,05 (vorher 0,4).
- **Preise**: Jede höhere Stufe von Ausrüstung und Team kostet etwa doppelt so viel wie vorher, damit jede Stufe ein Ziel für mehrere Minuten ist.
- **Ruhm** = 3 × (Abos ÷ 2 Mio.)^0,35, abgerundet. Bei 2 Mio. Abos sind das 3, bei 10 Mio. 5, bei 100 Mio. 11. Länger warten lohnt sich also, aber immer weniger.
- Jeder Ruhm-Punkt gibt 5 % Einnahmen. Dazu kommen die Boni, die man mit Ruhm kauft.

Ein Test (`tests/content.test.js`) prüft, dass der erste Award nach 1 bis 2 Minuten und der neue Kanal nach 30 bis 60 Minuten kommt. Wer Zahlen ändert, merkt es sofort.

## Spielstand
Der Spielstand liegt im Browser unter `creatorTycoonSave_v2` und trägt eine Versionsnummer. Stände der ersten Version (`creatorTycoonSave_v1`) werden beim Start automatisch übernommen: Geld, Abos, Videos, Ausrüstung, Team und Awards bleiben erhalten. Für eine neue Version erhöhst du `VERSION` in `js/core/game.js` und ergänzt eine Migration in `js/core/save.js`.
