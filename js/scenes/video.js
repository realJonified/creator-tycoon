// Video machen: Thema wählen → Aufnahme (Buchstaben antippen) → Schnitt (schnell tippen) → Upload → Ergebnis.
// Die Logik steckt in js/core/video.js, diese Szene zeichnet nur und reicht Eingaben weiter.
import { h, setText, progressBar } from '../ui/dom.js';
import { fmt, eur, fmtTime } from '../core/format.js';
import { startRecording, stepRecording, hitLetter, hitChar, startCut, tapCut, stepCut, CUT_STEPS } from '../core/video.js';
import { uploadSeconds, uploadSpeed, gearItem, topicUnlocked, videoOutcome, findTopic } from '../core/formulas.js';
import { TOPICS } from '../data/topics.js';
import { BALANCE as B } from '../data/balance.js';

const STEP_NAMES = ['Thema', 'Aufnahme', 'Schnitt', 'Upload'];

export default {
  id: 'video', title: 'Video', icon: '🎬', nav: true, order: 2,

  create(ctx) {
    let stage = 'wahl', rec = null, cut = null, upload = null, topic = null;
    let steps, body, timer, info;           // gemeinsame Elemente
    let screen, letterEls = new Map();      // Aufnahme
    let qualityBar, chips, tapBtn;           // Schnitt
    let upBar, upText;                       // Upload
    const S = () => ctx.S;

    function setSteps(active) {
      steps.replaceChildren(...STEP_NAMES.map((name, i) =>
        h('span', { class: 'step' + (i === active ? ' on' : i < active ? ' done' : '') }, `${i < active ? '✓' : i + 1} ${name}`)));
    }

    // ---------- 1. Thema wählen ----------
    function showChoice() {
      stage = 'wahl'; rec = cut = upload = null;
      setSteps(0);
      setText(timer, '');
      setText(info, 'Wähle ein Spiel für dein nächstes Video. Jedes Spiel hat eigene Zuschauer.');
      body.replaceChildren(h('div', { class: 'topics' }, TOPICS.map(t => {
        const open = topicUnlocked(S(), t);
        return h('button', {
          class: 'topic' + (t.id === S().lastTopic ? ' last' : ''), type: 'button', disabled: !open,
          onclick: () => startRec(t.id),
          'aria-label': open ? `${t.name} aufnehmen` : `${t.name}, ab ${fmt(t.minSubs)} Abos`,
        },
        h('span', { class: 'topic-icon', 'aria-hidden': 'true' }, t.icon),
        h('strong', null, t.name),
        h('small', null, open ? t.audience : `🔒 ab ${fmt(t.minSubs)} Abos`),
        open && h('small', { class: 'topic-stats' }, `Punkte ×${String(t.points).replace('.', ',')} · Geld ×${String(t.money).replace('.', ',')} · Abos ×${String(t.subs).replace('.', ',')}`));
      })));
      (body.querySelector('.topic.last:not(:disabled)') || body.querySelector('.topic:not(:disabled)'))?.focus({ preventScroll: true });
    }

    // ---------- 2. Aufnahme ----------
    function startRec(topicId) {
      topic = findTopic(topicId);
      rec = startRecording(topicId);
      stage = 'aufnahme';
      letterEls = new Map();
      setSteps(1);
      setText(info, 'Tippe die Buchstaben an, bevor sie verschwinden. Am PC kannst du sie auch auf der Tastatur drücken.');
      screen = h('div', { class: 'screen rec', role: 'group', 'aria-label': 'Aufnahme-Bildschirm' },
        h('div', { class: 'screen-top' }, h('span', { class: 'rec-dot' }, '● REC'), h('span', { id: 'recPoints' }, '0 Punkte')),
        h('div', { class: 'screen-topic', 'aria-hidden': 'true' }, topic.icon));
      body.replaceChildren(screen);
      ctx.audio.play('nav');
    }

    function drawLetter(l) {
      const btn = h('button', {
        class: 'letter', type: 'button', style: `left:${l.x}%;top:${l.y}%`, 'aria-label': `Buchstabe ${l.char}`,
        onpointerdown: e => { e.preventDefault(); onHit(l.id, btn); },
        onclick: e => { if (e.detail === 0) onHit(l.id, btn); }, // Tastatur (Enter/Leertaste)
      }, l.char);
      letterEls.set(l.id, btn);
      screen.append(btn);
    }

    function popText(x, y, text, cls = '') {
      if (!ctx.animations()) return;
      const el = h('div', { class: 'pop ' + cls, 'aria-hidden': 'true', style: `left:${x}%;top:${y}%` }, text);
      screen.append(el);
      setTimeout(() => el.remove(), 700);
    }

    function onHit(id, btn) {
      if (stage !== 'aufnahme') return;
      const l = rec.letters.find(x => x.id === id);
      const pts = hitLetter(S(), rec, id);
      if (!pts) return;
      ctx.audio.play('click');
      btn?.remove();
      letterEls.delete(id);
      if (l) popText(l.x, l.y, '+' + fmt(pts), rec.combo >= 5 ? 'combo' : '');
      renderRec();
    }

    function onKey(e) {
      if (stage !== 'aufnahme' || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      const before = rec.letters.find(l => l.char === e.key.toUpperCase());
      const r = hitChar(S(), rec, e.key);
      if (!r || !r.points) return;
      e.preventDefault();
      ctx.audio.play('click');
      letterEls.get(r.id)?.remove();
      letterEls.delete(r.id);
      if (before) popText(before.x, before.y, '+' + fmt(r.points));
      renderRec();
    }

    function renderRec() {
      setText(timer, `⏱ ${Math.ceil(rec.left)} s`);
      const p = screen.querySelector('#recPoints');
      if (p) setText(p, `${fmt(rec.points)} Punkte · ${rec.hits} Treffer${rec.combo >= 3 ? ` · Serie ${rec.combo}` : ''}`);
    }

    // ---------- 3. Schnitt ----------
    function startCutting() {
      stage = 'schnitt';
      cut = startCut();
      setSteps(2);
      setText(info, 'Tippe so schnell du kannst! Jeder Tipper fügt Schnitte, Effekte und Musik hinzu.');
      qualityBar = progressBar('Qualität');
      chips = h('div', { class: 'chips center' }, CUT_STEPS.map(s => h('span', { class: 'chip empty', 'data-at': s.at }, `${s.icon} ${s.label}`)));
      tapBtn = h('button', {
        class: 'tap-area', type: 'button', 'aria-label': 'Schneiden: so oft wie möglich tippen',
        onpointerdown: e => { e.preventDefault(); onTap(); },
        onclick: e => { if (e.detail === 0) onTap(); },
      }, h('span', { class: 'tap-icon', 'aria-hidden': 'true' }, '✂️'), h('strong', null, 'TIPPEN!'), h('small', { id: 'tapCount' }, '0 Tipper'));
      body.replaceChildren(h('div', { class: 'screen cut' }, tapBtn), h('div', { class: 'quality-row' }, h('span', { id: 'qText' }, 'Qualität 0 %'), qualityBar.el), chips);
      tapBtn.focus({ preventScroll: true });
    }

    function onTap() {
      if (stage !== 'schnitt') return;
      const unlocked = tapCut(S(), cut);
      if (unlocked) { ctx.audio.play('good'); ctx.toast(`${unlocked.icon} ${unlocked.label} hinzugefügt!`); }
      else if (cut.taps % 3 === 0) ctx.audio.play('click');
      if (ctx.animations()) { tapBtn.classList.remove('hit'); void tapBtn.offsetWidth; tapBtn.classList.add('hit'); }
      renderCut();
    }

    function renderCut() {
      setText(timer, `⏱ ${Math.ceil(cut.left)} s`);
      setText(body.querySelector('#tapCount'), `${cut.taps} Tipper`);
      setText(body.querySelector('#qText'), `Qualität ${Math.round(cut.quality * 100)} %`);
      qualityBar.set(cut.quality / B.qualityCap);
      for (const c of chips.children) c.classList.toggle('empty', cut.quality < Number(c.dataset.at));
    }

    // ---------- 4. Upload ----------
    function showUpload() {
      stage = 'upload-bereit';
      setSteps(3);
      setText(timer, '');
      const router = gearItem(S(), 'router'), boxen = gearItem(S(), 'boxen');
      setText(info, `WLAN: ${router.icon} ${router.name}${boxen.price ? ` + ${boxen.icon} ${boxen.name}` : ''} · ${fmt(uploadSpeed(S()))} MB/s`);
      upBar = progressBar('Upload-Fortschritt');
      upText = h('p', { class: 'center muted' }, `Dein Video ist ${B.uploadSizeMB} MB gross. Geschätzte Dauer: ${fmtTime(uploadSeconds(S()))}`);
      const preview = videoOutcome(S(), { points: rec.points, quality: cut.quality, topic });
      body.replaceChildren(
        h('div', { class: 'screen upload' },
          h('div', { class: 'thumb', 'aria-hidden': 'true' }, topic.icon),
          h('strong', null, `${topic.name}: Folge ${S().videos + 1}`),
          h('small', null, `${fmt(rec.points)} Punkte · Qualität ${Math.round(cut.quality * 100)} % · erwartet ca. ${fmt(preview.views)} Aufrufe`)),
        upText, upBar.el,
        h('div', { class: 'center', style: 'margin-top: 12px' },
          h('button', { class: 'btn play big', type: 'button', id: 'upBtn', 'data-autofocus': true, onclick: startUpload }, '⬆️ Hochladen')),
      );
      body.querySelector('#upBtn').focus({ preventScroll: true });
    }

    function startUpload() {
      if (stage !== 'upload-bereit') return;
      stage = 'upload';
      upload = { total: uploadSeconds(S()), done: 0 };
      body.querySelector('#upBtn').disabled = true;
      setText(body.querySelector('#upBtn'), '⏳ Lädt hoch …');
      ctx.audio.play('nav');
    }

    function renderUpload() {
      const p = Math.min(1, upload.done / upload.total);
      upBar.set(p);
      setText(upText, `${Math.floor(p * 100)} % · ${fmt(p * B.uploadSizeMB)} von ${B.uploadSizeMB} MB · noch ${fmtTime(Math.ceil(upload.total - upload.done))}`);
    }

    // ---------- 5. Ergebnis ----------
    function finish() {
      const r = ctx.game.finishVideo({ topic, points: rec.points, quality: cut.quality });
      stage = 'fertig';
      ctx.audio.play('award');
      ctx.persist();
      setSteps(4);
      setText(timer, '');
      setText(info, r.perfect ? '🌟 Perfekter Schnitt! Extra-Juwelen für dich.' : 'Tipp: Mehr Tipper im Schnitt bringen mehr Qualität und Juwelen.');
      body.replaceChildren(h('div', { class: 'result' },
        h('div', { class: 'result-icon', 'aria-hidden': 'true' }, '🎉'),
        h('h2', null, 'Video ist online!'),
        h('div', { class: 'result-grid' },
          h('div', null, h('small', null, 'Aufrufe'), h('strong', null, '👀 ' + fmt(r.views))),
          h('div', null, h('small', null, 'Geld'), h('strong', { class: 'money' }, '💰 +' + eur(r.money))),
          h('div', null, h('small', null, 'Abos'), h('strong', { class: 'subs' }, '👥 +' + fmt(r.subs))),
          h('div', null, h('small', null, 'Juwelen'), h('strong', { class: 'gems' }, '💎 +' + r.gems))),
        h('div', { class: 'row center-row' },
          h('button', { class: 'btn play big', type: 'button', 'data-autofocus': true, onclick: showChoice }, '🎬 Nächstes Video'),
          h('button', { class: 'btn', type: 'button', onclick: () => ctx.scenes.go('haus') }, '🏠 Zum Haus')),
      ));
      body.querySelector('[data-autofocus]').focus({ preventScroll: true });
    }

    return {
      mount(el) {
        el.append(h('div', { class: 'card video-card' },
          h('div', { class: 'row between' }, steps = h('div', { class: 'steps' }), timer = h('strong', { class: 'timer' })),
          info = h('p', { class: 'muted small', style: 'margin: 10px 0' }),
          body = h('div', { class: 'video-body' })));
        document.addEventListener('keydown', onKey);
        showChoice();
      },
      unmount() { document.removeEventListener('keydown', onKey); },

      update(dt) {
        if (stage === 'aufnahme') {
          for (const e of stepRecording(rec, dt)) {
            if (e.type === 'spawn') drawLetter(e.letter);
            else if (e.type === 'miss') { letterEls.get(e.letter.id)?.remove(); letterEls.delete(e.letter.id); }
            else if (e.type === 'end') { screen.querySelectorAll('.letter').forEach(b => b.remove()); ctx.audio.play('good'); startCutting(); return; }
          }
          renderRec();
        } else if (stage === 'schnitt') {
          if (stepCut(cut, dt)) { showUpload(); return; }
          renderCut();
        } else if (stage === 'upload') {
          upload.done += dt;
          renderUpload();
          if (upload.done >= upload.total) finish();
        }
      },
    };
  },
};

