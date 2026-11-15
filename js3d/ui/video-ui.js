// Video-Minispiel am PC: Spiel wählen → Buchstaben drücken → Schnitt → Upload → Ergebnis.
import { h, setText, progressBar } from '../../js/ui/dom.js';
import { fmt, eur, fmtTime } from '../../js/core/format.js';
import { startRecording, stepRecording, hitLetter, hitChar, startCut, tapCut, stepCut, CUT_PIECES } from '../core/video.js';
import { uploadSeconds, uploadSpeed, gameUnlocked, videoOutcome, partLevel } from '../core/economy.js';
import { GAMES } from '../data/content.js';
import { W } from '../data/balance.js';

export function openVideo(panels, ctx) {
  let stage = 'wahl', rec, cut, up, game, body, head, screen, letterEls = new Map(), bar, info;
  const S = () => ctx.S;

  function setHead(step, text) {
    head.replaceChildren(...['Spiel', 'Aufnahme', 'Schnitt', 'Upload'].map((n, i) =>
      h('span', { class: 'step' + (i === step ? ' on' : i < step ? ' done' : '') }, `${i < step ? '✓' : i + 1} ${n}`)));
    setText(info, text);
  }

  function choose() {
    stage = 'wahl';
    setHead(0, 'Welches Spiel nimmst du heute auf?');
    body.replaceChildren(h('div', { class: 'games' }, GAMES.map(g => {
      const open = gameUnlocked(S(), g);
      return h('button', { class: 'game' + (g.id === S().lastGame ? ' last' : ''), type: 'button', disabled: !open, onclick: () => record(g) },
        h('span', { class: 'game-icon', 'aria-hidden': 'true' }, g.icon), h('strong', null, g.name),
        h('small', null, open ? `Punkte ×${String(g.points).replace('.', ',')} · Geld ×${String(g.money).replace('.', ',')}` : `🔒 ab ${fmt(g.minSubs)} Abos`));
    })));
    (body.querySelector('.game.last:not(:disabled)') || body.querySelector('.game:not(:disabled)'))?.focus();
  }

  function record(g) {
    game = g; rec = startRecording(g.id); stage = 'aufnahme'; letterEls = new Map();
    setHead(1, 'Drück die Buchstaben (Tastatur oder antippen), bevor sie verschwinden!');
    screen = h('div', { class: 'vscreen' }, h('div', { class: 'vtop' }, h('span', { class: 'rec' }, '● REC'), h('span', { id: 'vp' }, '0 Punkte')), h('div', { class: 'vbg', 'aria-hidden': 'true' }, g.icon));
    body.replaceChildren(screen);
  }

  function hit(id, el) {
    const l = rec.letters.find(x => x.id === id);
    const pts = hitLetter(rec, id);
    if (!pts) return;
    ctx.audio.play('click');
    (el || letterEls.get(id))?.remove(); letterEls.delete(id);
    if (l) pop(l, pts);
  }
  function pop(l, pts) {
    const p = h('div', { class: 'vpop', style: `left:${l.x}%;top:${l.y}%` }, '+' + fmt(pts));
    screen.append(p); setTimeout(() => p.remove(), 650);
  }
  function onKey(e) {
    if (stage === 'aufnahme' && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      const r = hitChar(rec, e.key);
      if (r?.points) { e.preventDefault(); ctx.audio.play('click'); letterEls.get(r.id)?.remove(); letterEls.delete(r.id); pop(r.letter, r.points); }
    } else if (stage === 'schnitt' && (e.code === 'Space' || e.code === 'Enter') && !e.repeat) { e.preventDefault(); tap(); }
  }

  function cutting() {
    stage = 'schnitt'; cut = startCut();
    setHead(2, 'Tippe oder klicke so schnell du kannst (am PC auch Leertaste).');
    bar = progressBar('Qualität');
    const tapBtn = h('button', { class: 'tap', type: 'button', onpointerdown: e => { e.preventDefault(); tap(); } }, h('span', { class: 'tap-ico' }, '✂️'), h('strong', null, 'TIPPEN!'), h('small', { id: 'vt' }, '0'));
    body.replaceChildren(h('div', { class: 'vscreen cut' }, tapBtn), h('p', { class: 'qline', id: 'vq' }, 'Qualität 0 %'), bar.el,
      h('div', { class: 'pieces' }, CUT_PIECES.map(p => h('span', { class: 'piece', 'data-at': p.at }, `${p.icon} ${p.label}`))));
  }
  function tap() {
    if (stage !== 'schnitt') return;
    const piece = tapCut(S(), cut);
    if (piece) { ctx.audio.play('good'); ctx.toast(`${piece.icon} ${piece.label} eingefügt`); }
    renderCut();
  }
  function renderCut() {
    setText(body.querySelector('#vt'), `${cut.taps} Tipper · noch ${Math.ceil(cut.left)} s`);
    setText(body.querySelector('#vq'), `Qualität ${Math.round(cut.quality * 100)} %`);
    bar.set(cut.quality / W.qualityCap);
    body.querySelectorAll('.piece').forEach(p => p.classList.toggle('on', cut.quality >= Number(p.dataset.at)));
  }

  function upload() {
    stage = 'upload-bereit';
    setHead(3, `WLAN-Router Stufe ${partLevel(S(), 'router')} · ${fmt(uploadSpeed(S()))} MB/s · ca. ${fmtTime(Math.ceil(uploadSeconds(S())))}`);
    bar = progressBar('Upload');
    const est = videoOutcome(S(), { points: rec.points, quality: cut.quality, game });
    body.replaceChildren(
      h('div', { class: 'vscreen upload' }, h('div', { class: 'thumb' }, game.icon), h('strong', null, `${game.name} · Folge ${S().videos + 1}`),
        h('small', null, `${fmt(rec.points)} Punkte · Qualität ${Math.round(cut.quality * 100)} % · erwartet ~${fmt(est.views)} Aufrufe`)),
      h('p', { class: 'qline', id: 'vu' }, `${W.uploadMB} MB bereit`), bar.el,
      h('button', { class: 'big-btn', type: 'button', id: 'upb', 'data-autofocus': true, onclick: () => { if (stage !== 'upload-bereit') return; stage = 'upload'; up = { t: 0, total: uploadSeconds(S()) }; body.querySelector('#upb').disabled = true; setText(body.querySelector('#upb'), '⏳ Lädt hoch …'); } }, '⬆️ Hochladen'));
    body.querySelector('#upb').focus();
  }

  function result() {
    const r = ctx.finishVideo({ points: rec.points, quality: cut.quality, game });
    stage = 'fertig';
    setHead(4, 'Dein Video ist online!');
    body.replaceChildren(h('div', { class: 'result' },
      h('div', { class: 'res-grid' },
        h('div', null, h('small', null, 'Aufrufe'), h('strong', null, '👀 ' + fmt(r.views))),
        h('div', null, h('small', null, 'Geld'), h('strong', { class: 'money' }, '+' + eur(r.money))),
        h('div', null, h('small', null, 'Abos'), h('strong', { class: 'subs' }, '+' + fmt(r.subs)))),
      h('div', { class: 'menu-list' },
        h('button', { class: 'big-btn', type: 'button', 'data-autofocus': true, onclick: choose }, '🎬 Noch ein Video'),
        h('button', { class: 'btn', type: 'button', onclick: () => panels.close() }, 'Zurück ins Zimmer'))));
    body.querySelector('[data-autofocus]').focus();
  }

  panels.open((box, close) => {
    box.append(
      h('div', { class: 'panel-head' }, head = h('div', { class: 'steps' }), h('button', { class: 'x', type: 'button', 'aria-label': 'Schliessen', onclick: close }, '✕')),
      info = h('p', { class: 'small muted' }),
      body = h('div', { class: 'vbody' }));
    addEventListener('keydown', onKey);
    choose();
  }, {
    cls: 'wide video',
    onClose: () => removeEventListener('keydown', onKey),
    update(dt) {
      if (stage === 'aufnahme') {
        for (const e of stepRecording(rec, dt)) {
          if (e.type === 'spawn') {
            const l = e.letter;
            const el = h('button', { class: 'vletter', type: 'button', style: `left:${l.x}%;top:${l.y}%`, onpointerdown: ev => { ev.preventDefault(); hit(l.id, el); } }, l.char);
            letterEls.set(l.id, el); screen.append(el);
          } else if (e.type === 'miss') { letterEls.get(e.letter.id)?.remove(); letterEls.delete(e.letter.id); }
          else if (e.type === 'end') { ctx.audio.play('good'); cutting(); return; }
        }
        setText(screen.querySelector('#vp'), `${fmt(rec.points)} Punkte · ${rec.hits} Treffer · ${Math.ceil(rec.left)} s`);
      } else if (stage === 'schnitt') {
        if (stepCut(cut, dt)) { upload(); return; }
        renderCut();
      } else if (stage === 'upload') {
        up.t += dt;
        const p = Math.min(1, up.t / up.total);
        bar.set(p);
        setText(body.querySelector('#vu'), `${Math.floor(p * 100)} % · ${fmt(p * W.uploadMB)} von ${W.uploadMB} MB`);
        if (p >= 1) result();
      }
    },
  });
}
