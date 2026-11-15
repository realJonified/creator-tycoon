// Boss-Anzeige (Lebensbalken), Sieg mit Kiste, Niederlage, Hauskauf und Kanalknopf-Meldung.
import { h, setText } from '../../js/ui/dom.js';
import { fmt, eur } from '../../js/core/format.js';
import { W } from '../data/balance.js';

export function createBossHud() {
  const el = document.getElementById('bossHud');
  const boss = el.querySelector('.bar-boss i'), me = el.querySelector('.bar-me i'), bt = el.querySelector('.boss-hp'), mt = el.querySelector('.me-hp');
  const flash = document.getElementById('hurt');
  return {
    show(on) { el.hidden = !on; },
    render(f) {
      boss.style.width = (f.bossHp / W.bossHp) * 100 + '%';
      me.style.width = (f.playerHp / W.playerHp) * 100 + '%';
      setText(bt, `${Math.ceil(f.bossHp)} / ${W.bossHp}`);
      setText(mt, `${Math.ceil(f.playerHp)} / ${W.playerHp}`);
    },
    hurt() { flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on'); },
  };
}

// Sieg: Kiste antippen → Seltenheit wird enthüllt.
export function openChest(panels, ctx, onDone) {
  panels.open((box) => {
    const chest = h('button', { class: 'chest', type: 'button', 'data-autofocus': true, 'aria-label': 'Kiste öffnen' }, '🎁');
    const out = h('div', { class: 'chest-out' });
    chest.addEventListener('click', () => {
      if (chest.disabled) return;
      chest.disabled = true;
      chest.classList.add('shake');
      ctx.audio.play('event');
      setTimeout(() => {
        const r = ctx.openChest();
        chest.classList.remove('shake');
        chest.textContent = r.rarity.id === 'legendaer' ? '👑' : r.rarity.id === 'episch' ? '💜' : r.rarity.id === 'selten' ? '💙' : '📦';
        ctx.audio.play(r.rarity.id === 'legendaer' || r.rarity.id === 'episch' ? 'award' : 'good');
        out.replaceChildren(...[
          h('strong', { class: 'rarity', style: `color:${r.rarity.color}` }, r.rarity.name.toUpperCase()),
          h('p', null, `💰 +${eur(r.money)}${r.subs ? ` · 👥 +${fmt(r.subs)} Abos` : ''}`),
          r.charm && h('p', null, `${r.charm.icon} ${r.charm.name}: +${Math.round(r.charm.bonus * 100)} % Aufrufe für immer!`),
          h('button', { class: 'big-btn', type: 'button', onclick: () => { panels.close(); onDone(); } }, 'Zurück zur Insel'),
        ].filter(Boolean));
        out.querySelector('button').focus();
      }, ctx.reduced() ? 0 : 900);
    });
    box.append(h('h2', null, '🏆 Glitchgolem besiegt!'), h('p', { class: 'muted' }, 'Tippe die Kiste an, um sie zu öffnen.'), chest, out,
      h('p', { class: 'small muted' }, 'Chancen: Gewöhnlich 72 % · Selten 22 % · Episch 5 % · Legendär 1 %'));
  }, { dismissable: false, cls: 'center' });
}

export function openDefeat(panels, onDone) {
  panels.open(box => box.append(
    h('h2', null, '💥 Verloren'),
    h('p', null, 'Der Glitchgolem war diesmal stärker. Es gibt keine Belohnung. Beim nächsten Portal klappt es!'),
    h('p', { class: 'small muted' }, 'Tipp: Lauf in Kreisen, sobald ein roter Kreis unter dir erscheint.'),
    h('button', { class: 'big-btn', type: 'button', 'data-autofocus': true, onclick: () => { panels.close(); onDone(); } }, 'Zurück zum Kreisel'),
  ), { dismissable: false, cls: 'center' });
}

export function openBuyHouse(panels, ctx, house) {
  panels.open((box, close) => box.append(
    h('h2', null, `🏡 ${house.name}`),
    h('p', null, `${house.size} m² · mehr Platz und bessere Einrichtung · Aufrufe × 2,5`),
    h('p', { class: 'price' }, eur(house.price)),
    h('div', { class: 'menu-list' },
      h('button', { class: 'big-btn', type: 'button', 'data-autofocus': true, disabled: ctx.S.money < house.price, onclick: () => { close(); ctx.buyHouse(house); } }, ctx.S.money < house.price ? `Dir fehlen ${eur(house.price - ctx.S.money)}` : 'Kaufen'),
      h('button', { class: 'btn', type: 'button', onclick: close }, 'Abbrechen')),
  ), { cls: 'center' });
}

export function openButtonWon(panels, btn) {
  panels.open((box, close) => box.append(
    h('div', { class: 'plaque', style: `--c:${btn.color}` }, h('span', null, '★')),
    h('h2', null, btn.name + '!'),
    h('p', null, `Du hast ${fmt(btn.subs)} Abonnenten erreicht. Der Knopf hängt jetzt an der Wand in deinem Haus.`),
    h('p', { class: 'small muted' }, `+${Math.round(W.buttonBonus * 100)} % Aufrufe für immer`),
    h('button', { class: 'big-btn', type: 'button', 'data-autofocus': true, onclick: close }, 'Super!'),
  ), { cls: 'center' });
}
