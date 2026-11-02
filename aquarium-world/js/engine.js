'use strict';
// ============ Core / utils ============
const W = 320, H = 240, TS = 16;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
let T = 0; // global frame counter

const rnd = (a, b) => a + Math.random() * (b - a);
const irnd = (a, b) => Math.floor(rnd(a, b + 1));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function mkCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d').imageSmoothingEnabled = false;
  return c;
}
function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) >>> 0;
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}
function shade(hex, amt) { // amt -1..1
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}
function fmt(n) { return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

function rect(x, y, w, h, c, g = ctx) { g.fillStyle = c; g.fillRect(x, y, w, h); }
function pline(x0, y0, x1, y1, c, g = ctx, th = 1) { // pixel line
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy; g.fillStyle = c;
  for (let i = 0; i < 2000; i++) {
    g.fillRect(x0, y0, th, th);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
function pellipse(cx, cy, rx, ry, c, g = ctx) { // filled pixel ellipse
  g.fillStyle = c;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.0001))));
    g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
  }
}
function pring(cx, cy, rx, ry, c, g = ctx) {
  g.fillStyle = c;
  const n = Math.max(12, Math.round((rx + ry) * 3));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    g.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1);
  }
}

// ============ Bitmap font (5x7) ============
const GLYPHS = {
  A: '0E11111F111111', B: '1E11111E11111E', C: '0E11101010110E', D: '1C12111111121C', E: '1F10101E10101F',
  F: '1F10101E101010', G: '0E11101711110F', H: '1111111F111111', I: '0E04040404040E', J: '0702020202120C',
  K: '11121418141211', L: '1010101010101F', M: '111B1515111111', N: '11111915131111', O: '0E11111111110E',
  P: '1E11111E101010', Q: '0E11111115120D', R: '1E11111E141211', S: '0F10100E01011E', T: '1F040404040404',
  U: '1111111111110E', V: '11111111110A04', W: '1111111515150A', X: '11110A040A1111', Y: '1111110A040404',
  Z: '1F01020408101F',
  a: '00000E010F110F', b: '1010161911111E', c: '00000E1010110E', d: '01010D1311110F', e: '00000E111F100E',
  f: '0609081C080808', g: '000F11110F010E', h: '10101619111111', i: '04000C0404040E', j: '0200060202120C',
  k: '10101214181412', l: '0C04040404040E', m: '00001A15151111', n: '00001619111111', o: '00000E1111110E',
  p: '00001E111E1010', q: '00000D130F0101', r: '00001619101010', s: '00000E100E011E', t: '08081C08080906',
  u: '0000111111130D', v: '00001111110A04', w: '0000111115150A', x: '0000110A040A11', y: '000011110F010E',
  z: '00001F0204081F',
  '0': '0E11131519110E', '1': '040C040404040E', '2': '0E11010204081F', '3': '1F02040201110E', '4': '02060A121F0202',
  '5': '1F101E0101110E', '6': '0608101E11110E', '7': '1F010204080808', '8': '0E11110E11110E', '9': '0E11110F01020C',
  ' ': '00000000000000', '.': '00000000000C0C', ',': '000000000C0408', '!': '04040404040004', '?': '0E110102040004',
  ':': '000C0C000C0C00', ';': '000C0C000C0408', '-': '0000001F000000', '+': '0004041F040400', "'": '0C040800000000',
  '"': '0A0A0A00000000', '/': '00010204081000', '(': '02040808080402', ')': '08040202020408', '%': '18190204081303',
  '>': '08040201020408', '<': '02040810080402', '*': '0004150E150400', '#': '0A0A1F0A1F0A0A', '=': '00001F001F0000',
  '&': '0C12140815120D', '_': '0000000000001F', '^': '040E1504040400', '|': '00040404150E04',
  '~': '000A1F1F0E0400', // heart
  '$': '0E1F1B1B1F0E00', // coin
};
const FONT_CHARS = Object.keys(GLYPHS);
const charIndex = {};
const fontAtlas = mkCanvas(FONT_CHARS.length * 6, 8);
(() => {
  const g = fontAtlas.getContext('2d'); g.fillStyle = '#fff';
  FONT_CHARS.forEach((ch, i) => {
    charIndex[ch] = i;
    const s = GLYPHS[ch];
    for (let r = 0; r < 7; r++) {
      const b = parseInt(s.substr(r * 2, 2), 16);
      for (let c = 0; c < 5; c++) if (b & (16 >> c)) g.fillRect(i * 6 + c, r, 1, 1);
    }
  });
})();
const tintCache = {};
function fontFor(color) {
  let c = tintCache[color];
  if (!c) {
    c = mkCanvas(fontAtlas.width, 8);
    const g = c.getContext('2d');
    g.drawImage(fontAtlas, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color; g.fillRect(0, 0, c.width, 8);
    tintCache[color] = c;
  }
  return c;
}
function drawRaw(str, x, y, color, g) {
  const f = fontFor(color);
  for (let i = 0; i < str.length; i++) {
    if (str[i] === ' ') continue;
    let idx = charIndex[str[i]];
    if (idx === undefined) idx = charIndex['?'];
    g.drawImage(f, idx * 6, 0, 5, 7, x + i * 6, y, 5, 7);
  }
}
function text(str, x, y, color = '#fff', shadow = '#101028', g = ctx) {
  str = String(str); x = Math.round(x); y = Math.round(y);
  if (shadow) drawRaw(str, x + 1, y + 1, shadow, g);
  drawRaw(str, x, y, color, g);
}
const tw = s => String(s).length * 6 - 1;
function textR(str, xr, y, c, s, g) { text(str, xr - tw(str), y, c, s, g); }
function textC(str, cx, y, c, s, g) { text(str, Math.round(cx - tw(str) / 2), y, c, s, g); }
// big title text with a vertical colour gradient, a thick outline and a moving shine
const logoCache = {};
function textLogo(str, x, y, scale, top, bottom, outline, shine = -1) {
  const k = str + top + bottom + outline;
  let base = logoCache[k];
  const w = str.length * 6 + 2, h = 9;
  if (!base) {
    base = mkCanvas(w, h); const g = base.getContext('2d');
    for (const [ox, oy] of [[0, 0], [2, 0], [0, 2], [2, 2], [1, 0], [0, 1], [2, 1], [1, 2]]) drawRaw(str, ox, oy, outline, g);
    const f = mkCanvas(w, h), fg = f.getContext('2d');
    drawRaw(str, 1, 1, '#ffffff', fg);
    const grad = mkCanvas(w, h), gg = grad.getContext('2d'); // paint the gradient once, then mask it to the letters
    for (let yy = 0; yy < h; yy++) { gg.fillStyle = yy <= 1 ? shade(top, 0.5) : mix(top, bottom, (yy - 1) / 6); gg.fillRect(0, yy, w, 1); }
    fg.globalCompositeOperation = 'source-in'; fg.drawImage(grad, 0, 0);
    g.drawImage(f, 0, 0);
    logoCache[k] = base;
  }
  const t = mkCanvas(w, h), tg = t.getContext('2d');
  tg.drawImage(base, 0, 0);
  if (shine >= 0) { // diagonal glint sweeping across the letters
    const m = mkCanvas(w, h), mg = m.getContext('2d');
    const band = mkCanvas(w, h), bg2 = band.getContext('2d'); bg2.fillStyle = 'rgba(255,255,255,0.85)';
    for (let yy = 0; yy < h; yy++) bg2.fillRect(Math.round(shine - yy), yy, 3, 1);
    drawRaw(str, 1, 1, '#ffffff', mg); mg.globalCompositeOperation = 'source-in'; mg.drawImage(band, 0, 0);
    tg.drawImage(m, 0, 0);
  }
  ctx.drawImage(t, Math.round(x), Math.round(y), w * scale, h * scale);
}
function textBig(str, x, y, scale, color, outline = '#101028', g = ctx) {
  str = String(str);
  const t = mkCanvas(str.length * 6 + 2, 9), tg = t.getContext('2d');
  for (const [ox, oy] of [[0, 0], [2, 0], [0, 2], [2, 2], [1, 0], [0, 1], [2, 1], [1, 2]]) drawRaw(str, ox, oy, outline, tg);
  drawRaw(str, 1, 1, color, tg);
  g.drawImage(t, Math.round(x), Math.round(y), t.width * scale, t.height * scale);
}
function wrap(str, max) {
  const out = [];
  for (const para of String(str).split('\n')) {
    let line = '';
    for (const w of para.split(' ')) {
      if (!line.length) line = w;
      else if ((line + ' ' + w).length <= max) line += ' ' + w;
      else { out.push(line); line = w; }
    }
    out.push(line);
  }
  return out;
}

// ============ Input ============
const inp = { held: {}, pressed: {}, holdT: {} };
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'a', Enter: 'a', Space: 'a', KeyJ: 'a', KeyX: 'b', Backspace: 'b', KeyK: 'b', ShiftLeft: 'b', ShiftRight: 'b',
  Escape: 'menu', KeyM: 'menu', Tab: 'menu',
};
let textHandler = null; // set by name-entry UI
function vpress(k) { if (!inp.held[k]) { inp.pressed[k] = true; inp.holdT[k] = 0; } inp.held[k] = true; }
function vrelease(k) { inp.held[k] = false; }
const nameInput = document.getElementById('nameInput');
addEventListener('keydown', e => {
  audioUnlock();
  if (document.activeElement === nameInput) return; // the name box handles its own typing
  if (textHandler && textHandler(e)) { e.preventDefault(); return; }
  const k = KEYMAP[e.code];
  if (k) { e.preventDefault(); if (!e.repeat) vpress(k); }
});
addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) vrelease(k); });
addEventListener('blur', () => { for (const k in inp.held) inp.held[k] = false; });
inp.rep = k => !!inp.pressed[k] || (inp.held[k] && inp.holdT[k] > 16 && inp.holdT[k] % 4 === 0);
function inputEndFrame() {
  inp.pressed = {};
  for (const k in inp.held) if (inp.held[k]) inp.holdT[k] = (inp.holdT[k] || 0) + 1;
}
// touch
(() => {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch) document.body.classList.add('touch');
  // d-pad: one surface, so sliding a finger between arrows changes direction
  const dp = document.getElementById('dpad'), arrows = {};
  dp.querySelectorAll('.tb').forEach(el => { arrows[el.dataset.d] = el; });
  let dpDir = null, dpId = null;
  const dpSet = d => {
    if (dpDir === d) return;
    if (dpDir) { vrelease(dpDir); arrows[dpDir].classList.remove('on'); }
    dpDir = d;
    if (d) { vpress(d); arrows[d].classList.add('on'); }
  };
  const dpAt = e => {
    const r = dp.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < 10) return null;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  };
  dp.addEventListener('pointerdown', e => { e.preventDefault(); audioUnlock(); dpId = e.pointerId; try { dp.setPointerCapture(e.pointerId); } catch (_) {} dpSet(dpAt(e)); });
  dp.addEventListener('pointermove', e => { if (e.pointerId === dpId) dpSet(dpAt(e)); });
  const dpOff = e => { if (e.pointerId === dpId) { dpId = null; dpSet(null); } };
  dp.addEventListener('pointerup', dpOff); dp.addEventListener('pointercancel', dpOff);
  document.querySelectorAll('#touch > .tb').forEach(el => {
    const k = el.dataset.k;
    const on = e => { e.preventDefault(); audioUnlock(); el.classList.add('on'); vpress(k); };
    const off = e => { e.preventDefault(); el.classList.remove('on'); vrelease(k); };
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('pointerleave', off);
  });
})();
// ---- tapping the game screen ----
// UIs register tap areas while drawing (game coordinates); the next frame's tap is matched against them.
let hits = [], pendingTap = null, canvasHoldA = false, canvasDown = false;
function hit(x, y, w, h, fn) { hits.push({ x, y, w, h, fn }); }
cv.addEventListener('pointerdown', e => {
  e.preventDefault(); audioUnlock(); canvasDown = true;
  const r = cv.getBoundingClientRect();
  pendingTap = { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
});
const canvasUp = () => { canvasDown = false; if (canvasHoldA) { canvasHoldA = false; vrelease('a'); } };
cv.addEventListener('pointerup', canvasUp); cv.addEventListener('pointercancel', canvasUp); cv.addEventListener('pointerleave', canvasUp);
function tapA() { inp.pressed.a = true; }
function holdA() { vpress('a'); if (canvasDown) canvasHoldA = true; else vrelease('a'); } // a tap already lifted still counts as one press
function processTap(fallback) {
  if (!pendingTap) return;
  const t = pendingTap; pendingTap = null;
  for (let i = hits.length - 1; i >= 0; i--) {
    const h = hits[i];
    if (t.x >= h.x && t.x < h.x + h.w && t.y >= h.y && t.y < h.y + h.h) { h.fn(t); return; }
  }
  if (fallback) fallback(t);
}
// Real HTML controls laid over a drawn button, for things browsers only allow from a genuine
// tap/click (file picker, share sheet). Call overlayAt() each frame while the button is shown.
const overlayUsed = new Set();
function overlayAt(el, x, y, w, h) {
  const cr = cv.getBoundingClientRect(), sx = cr.width / W, sy = cr.height / H;
  Object.assign(el.style, { display: 'block', left: cr.left + x * sx + 'px', top: cr.top + y * sy + 'px', width: w * sx + 'px', height: h * sy + 'px' });
  overlayUsed.add(el);
}
function overlaysEndFrame() {
  for (const el of document.querySelectorAll('.overlay')) if (!overlayUsed.has(el)) el.style.display = 'none';
  overlayUsed.clear();
}
function resize() {
  const touch = document.body.classList.contains('touch');
  const availH = innerHeight - (touch ? 160 : 30);
  const s = Math.min((innerWidth - 32) / W, availH / H);
  const sc = s >= 1 ? Math.floor(s) : s;
  cv.style.width = W * sc + 'px';
  cv.style.height = H * sc + 'px';
}
addEventListener('resize', resize); resize();

// ============ Windows ============
function drawWin(x, y, w, h, style = 'blue') {
  x = Math.round(x); y = Math.round(y);
  const top = style === 'dark' ? '#283048' : style === 'gold' ? '#7a5a20' : '#4868c8';
  const bot = style === 'dark' ? '#0c1020' : style === 'gold' ? '#3a2408' : '#141c60';
  const steps = Math.max(1, Math.floor((h - 4) / 3));
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    rect(x + 2, y + 2 + i * 3, w - 4, i === steps - 1 ? h - 4 - i * 3 : 3, mix(top, bot, t));
  }
  rect(x + 1, y, w - 2, 1, '#0a0a14'); rect(x + 1, y + h - 1, w - 2, 1, '#0a0a14');
  rect(x, y + 1, 1, h - 2, '#0a0a14'); rect(x + w - 1, y + 1, 1, h - 2, '#0a0a14');
  rect(x + 1, y + 1, w - 2, 1, '#f0f0f8'); rect(x + 1, y + 1, 1, h - 2, '#f0f0f8');
  rect(x + 1, y + h - 2, w - 2, 1, '#9aa0b8'); rect(x + w - 2, y + 1, 1, h - 2, '#9aa0b8');
}
const mixCache = {};
function mix(a, b, t) {
  const k = a + b + t.toFixed(2);
  if (mixCache[k]) return mixCache[k];
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map(s => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t));
  return (mixCache[k] = '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''));
}
function drawCursor(x, y) { // pointing hand-ish arrow
  const b = Math.floor(T / 8) % 2;
  x = Math.round(x) - b;
  rect(x, y, 2, 7, '#101028'); rect(x + 2, y + 1, 2, 5, '#101028'); rect(x + 4, y + 2, 2, 3, '#101028'); rect(x + 6, y + 3, 1, 1, '#101028');
  rect(x, y + 1, 2, 5, '#fff'); rect(x + 2, y + 2, 2, 3, '#fff'); rect(x + 4, y + 3, 2, 1, '#fff');
}
function bar(x, y, w, h, frac, c, bg = '#101028') {
  rect(x, y, w, h, bg); rect(x, y, Math.round(w * clamp(frac, 0, 1)), h, c);
}
