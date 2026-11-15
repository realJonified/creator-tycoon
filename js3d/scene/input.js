// Steuerung: Tastatur (WASD/Pfeile, Shift = rennen, E = benutzen), Maus ziehen = umsehen, Mausrad = Zoom.
// Am Handy: virtueller Joystick links, Wischen rechts zum Umsehen, Knopf zum Benutzen.
export function createInput({ canvas, joystickEl, knobEl, onUse, onLook, onZoom, isBlocked }) {
  const keys = new Set();
  const move = { x: 0, y: 0 };
  let joy = null, look = null, run = false;

  addEventListener('keydown', e => {
    if (e.target.closest?.('input, textarea, select')) return;
    keys.add(e.code);
    if (e.code === 'KeyE' && !e.repeat && !isBlocked()) { e.preventDefault(); onUse(); }
  });
  addEventListener('keyup', e => keys.delete(e.code));
  addEventListener('blur', () => keys.clear());

  // Maus: ziehen zum Umsehen (kein Pointer-Lock nötig)
  let mouse = null;
  canvas.addEventListener('mousedown', e => { mouse = { x: e.clientX, y: e.clientY }; });
  addEventListener('mouseup', () => { mouse = null; });
  addEventListener('mousemove', e => {
    if (!mouse || isBlocked()) return;
    onLook(e.clientX - mouse.x, e.clientY - mouse.y);
    mouse = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('wheel', e => { e.preventDefault(); if (!isBlocked()) onZoom(Math.sign(e.deltaY)); }, { passive: false });
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  // Touch: linke Bildschirmhälfte = Joystick, rechte = umsehen
  const R = 52;
  canvas.addEventListener('touchstart', e => {
    for (const t of e.changedTouches) {
      if (t.clientX < innerWidth * 0.45 && !joy) {
        joy = { id: t.identifier, x: t.clientX, y: t.clientY };
        joystickEl.style.left = t.clientX - 70 + 'px'; joystickEl.style.top = t.clientY - 70 + 'px';
        joystickEl.classList.add('on');
      } else if (!look) look = { id: t.identifier, x: t.clientX, y: t.clientY };
    }
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchmove', e => {
    for (const t of e.changedTouches) {
      if (joy && t.identifier === joy.id) {
        let dx = t.clientX - joy.x, dy = t.clientY - joy.y;
        const d = Math.hypot(dx, dy);
        if (d > R) { dx *= R / d; dy *= R / d; }
        move.x = dx / R; move.y = -dy / R;
        run = d > R * 0.95;
        knobEl.style.transform = `translate(${dx}px, ${dy}px)`;
      } else if (look && t.identifier === look.id) {
        if (!isBlocked()) onLook((t.clientX - look.x) * 1.4, (t.clientY - look.y) * 1.4);
        look.x = t.clientX; look.y = t.clientY;
      }
    }
    e.preventDefault();
  }, { passive: false });
  const end = e => {
    for (const t of e.changedTouches) {
      if (joy && t.identifier === joy.id) { joy = null; move.x = move.y = 0; run = false; knobEl.style.transform = ''; joystickEl.classList.remove('on'); }
      if (look && t.identifier === look.id) look = null;
    }
  };
  canvas.addEventListener('touchend', end);
  canvas.addEventListener('touchcancel', end);

  return {
    read() {
      if (isBlocked()) return { x: 0, y: 0, run: false };
      if (joy) return { x: move.x, y: move.y, run };
      const x = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
      const y = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
      return { x, y, run: keys.has('ShiftLeft') || keys.has('ShiftRight') };
    },
    // Zum Testen: Tasten von aussen setzen
    press(code, on = true) { if (on) keys.add(code); else keys.delete(code); },
  };
}
