// Eigene Grafik als SVG-Text: Häuser, Spielfigur, Hoverboards, Abzeichen, Startbild.
// Alles wird aus Daten gezeichnet, es gibt keine Bilddateien.

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Haus aus den Feldern in js/data/houses.js (wall, roof, roof_, floors, width, sky, ground, deco).
export function houseSVG(h, { size = 'normal' } = {}) {
  const W = 240, H = 180, groundY = 150;
  const bw = 60 + h.width * 34, fh = Math.min(24, 96 / h.floors), bh = fh * h.floors;
  const x = (W - bw) / 2, y = groundY - bh;
  const win = [];
  const cols = 1 + h.width * 2;
  for (let f = 0; f < h.floors; f++) {
    for (let c = 0; c < cols; c++) {
      const wx = x + 10 + c * ((bw - 20) / cols), wy = y + f * fh + fh * 0.25;
      if (f === h.floors - 1 && c === Math.floor(cols / 2)) continue; // Platz für die Tür
      win.push(`<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="${((bw - 20) / cols - 6).toFixed(1)}" height="${(fh * 0.5).toFixed(1)}" rx="2" fill="#fff7c2" stroke="rgba(0,0,0,.25)"/>`);
    }
  }
  let roof = '';
  if (h.roof_ === 'giebel') roof = `<polygon points="${x - 10},${y} ${W / 2},${y - 44} ${x + bw + 10},${y}" fill="${h.roof}"/>`;
  else if (h.roof_ === 'flach') roof = `<rect x="${x - 6}" y="${y - 8}" width="${bw + 12}" height="10" rx="2" fill="${h.roof}"/>`;
  else if (h.roof_ === 'kuppel') roof = `<path d="M${x} ${y} A ${bw / 2} ${bw / 2.6} 0 0 1 ${x + bw} ${y} Z" fill="${h.roof}" opacity=".9"/>`;
  else if (h.roof_ === 'turm') roof = `<rect x="${x - 6}" y="${y - 6}" width="${bw + 12}" height="8" fill="${h.roof}"/>`
    + `<rect x="${x - 4}" y="${y - 50}" width="22" height="46" fill="${h.wall}" stroke="rgba(0,0,0,.2)"/><polygon points="${x - 8},${y - 50} ${x + 7},${y - 74} ${x + 22},${y - 50}" fill="${h.roof}"/>`
    + `<rect x="${x + bw - 18}" y="${y - 50}" width="22" height="46" fill="${h.wall}" stroke="rgba(0,0,0,.2)"/><polygon points="${x + bw - 22},${y - 50} ${x + bw - 7},${y - 74} ${x + bw + 8},${y - 50}" fill="${h.roof}"/>`;
  const doorX = W / 2 - 9;
  const dark = ['#05060f', '#0b1026', '#1e1046', '#3b0d0d', '#1f6fa8', '#7c2d12'].includes(h.sky);
  const stars = dark ? [20, 60, 190, 215, 140].map((sx, i) => `<circle cx="${sx}" cy="${14 + (i * 23) % 50}" r="1.5" fill="#fff"/>`).join('') : '<circle cx="205" cy="30" r="14" fill="#ffe27a"/>';
  return `<svg class="house-svg ${size}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(h.name)}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" rx="14" fill="${h.sky}"/>${stars}
    <rect y="${groundY}" width="${W}" height="${H - groundY}" fill="${h.ground}"/>
    ${roof}
    <rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="3" fill="${h.wall}" stroke="rgba(0,0,0,.25)"/>
    ${win.join('')}
    <rect x="${doorX}" y="${groundY - 22}" width="18" height="22" rx="2" fill="#7a4b2a"/>
    <text x="${x + bw + 26}" y="${groundY - 2}" font-size="26" text-anchor="middle">${h.deco}</text>
  </svg>`;
}

// Eigene Spielfigur: runder Kopf mit Mütze und Kopfhörern. Auf Wunsch auf einem Hoverboard.
export function avatarSVG({ board = null, shirt = '#e5384f' } = {}) {
  const glow = board ? `<ellipse cx="50" cy="118" rx="34" ry="5" fill="${board.color}" opacity=".35"/>` : '';
  const deck = board ? `<rect x="18" y="104" width="64" height="9" rx="4.5" fill="${board.color}" stroke="rgba(0,0,0,.3)"/><circle cx="30" cy="114" r="2.5" fill="#7dd3fc"/><circle cx="70" cy="114" r="2.5" fill="#7dd3fc"/>` : '';
  const lift = board ? -8 : 0;
  return `<svg class="avatar-svg" viewBox="0 0 100 124" role="img" aria-label="Deine Spielfigur" xmlns="http://www.w3.org/2000/svg">
    ${glow}${deck}
    <g transform="translate(0 ${lift})">
      <rect x="38" y="84" width="9" height="26" rx="4" fill="#334155"/><rect x="53" y="84" width="9" height="26" rx="4" fill="#334155"/>
      <rect x="31" y="52" width="38" height="36" rx="12" fill="${shirt}"/>
      <rect x="22" y="56" width="9" height="26" rx="4.5" fill="${shirt}"/><rect x="69" y="56" width="9" height="26" rx="4.5" fill="${shirt}"/>
      <circle cx="50" cy="34" r="20" fill="#f6c89f"/>
      <path d="M30 30 Q50 6 70 30 L70 24 Q50 2 30 24 Z" fill="#2563eb"/><rect x="48" y="12" width="26" height="6" rx="3" fill="#1d4ed8"/>
      <circle cx="43" cy="36" r="2.4" fill="#1f2937"/><circle cx="57" cy="36" r="2.4" fill="#1f2937"/>
      <path d="M44 44 Q50 49 56 44" stroke="#1f2937" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M29 34 Q29 12 50 12 Q71 12 71 34" stroke="#111827" stroke-width="3" fill="none"/>
      <rect x="25" y="31" width="7" height="12" rx="3" fill="#111827"/><rect x="68" y="31" width="7" height="12" rx="3" fill="#111827"/>
    </g>
  </svg>`;
}

export function boardSVG(board, rarityColor = '#999') {
  return `<svg class="board-svg" viewBox="0 0 100 40" role="img" aria-label="${esc(board.name)}" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="34" rx="40" ry="4" fill="${rarityColor}" opacity=".45"/>
    <rect x="8" y="12" width="84" height="14" rx="7" fill="${board.color}" stroke="rgba(0,0,0,.35)"/>
    <rect x="16" y="15" width="68" height="3" rx="1.5" fill="rgba(255,255,255,.55)"/>
    <circle cx="24" cy="28" r="3.5" fill="#7dd3fc"/><circle cx="76" cy="28" r="3.5" fill="#7dd3fc"/>
  </svg>`;
}

// Goldenes Abzeichen: Zackenkreis, Band und das Emoji des Awards.
export function badgeSVG(award, { got = true } = {}) {
  const pts = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2, r = i % 2 ? 40 : 46;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`);
  }
  const gold = got ? 'url(#gold)' : '#9ca3af';
  return `<svg class="badge-svg${got ? '' : ' locked'}" viewBox="0 0 100 124" role="img" aria-label="${esc(award.name)}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".45" stop-color="#f5c542"/><stop offset="1" stop-color="#b7791f"/></linearGradient></defs>
    <polygon points="30,84 22,122 40,112 50,124 50,84" fill="${got ? '#d92f47' : '#6b7280'}"/>
    <polygon points="70,84 78,122 60,112 50,124 50,84" fill="${got ? '#b91c3a' : '#4b5563'}"/>
    <polygon points="${pts.join(' ')}" fill="${gold}" stroke="rgba(0,0,0,.25)"/>
    <circle cx="50" cy="50" r="31" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2"/>
    <text x="50" y="62" font-size="32" text-anchor="middle">${award.icon}</text>
  </svg>`;
}

// Startbild: Hügel, Bäume, Strasse mit Zebrastreifen, eine kleine Stadt.
export function titleSceneSVG() {
  const trees = [30, 80, 300, 350, 390].map((x, i) => `<g transform="translate(${x} ${118 - (i % 2) * 6})"><rect x="-3" y="10" width="6" height="16" fill="#7a4b2a"/><polygon points="0,-22 -16,12 16,12" fill="#2f9e44"/><polygon points="0,-34 -12,-4 12,-4" fill="#40c057"/></g>`).join('');
  const town = [[130, 70, '#f4a261'], [165, 54, '#e76f51'], [200, 80, '#2a9d8f'], [235, 62, '#e9c46a']].map(([x, h, c]) =>
    `<rect x="${x}" y="${130 - h}" width="30" height="${h}" fill="${c}" stroke="rgba(0,0,0,.2)"/><rect x="${x + 6}" y="${136 - h}" width="7" height="7" fill="#fff7c2"/><rect x="${x + 17}" y="${136 - h}" width="7" height="7" fill="#fff7c2"/>`).join('');
  const zebra = Array.from({ length: 9 }, (_, i) => `<rect x="${118 + i * 20}" y="160" width="12" height="22" fill="#fff" opacity=".9"/>`).join('');
  return `<svg class="title-svg" viewBox="0 0 420 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc6ff"/><stop offset="1" stop-color="#d7efff"/></linearGradient></defs>
    <rect width="420" height="200" fill="url(#sky)"/>
    <circle cx="360" cy="36" r="18" fill="#ffe27a"/>
    <path d="M0 120 Q70 70 150 112 T300 100 T420 108 V200 H0 Z" fill="#8fd27f"/>
    <path d="M0 132 Q100 104 210 128 T420 124 V200 H0 Z" fill="#69c05b"/>
    ${town}${trees}
    <rect y="148" width="420" height="52" fill="#4b5563"/>
    <rect y="148" width="420" height="4" fill="#facc15"/>${zebra}
  </svg>`;
}
