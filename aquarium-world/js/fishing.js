'use strict';
// ============ Lake map ============
let mapBg = null;
function makeMapBg() {
  const c = mkCanvas(W, H), g = c.getContext('2d');
  rect(0, 0, W, H, '#5aa848', g);
  const r = seeded(11);
  for (let i = 0; i < 900; i++) rect(Math.floor(r() * W), Math.floor(r() * H), 1, 2, r() < 0.5 ? '#4a9038' : '#78c060', g);
  // north mountains + dark moon area
  for (let x = 0; x < W; x++) {
    const h = 20 + Math.sin(x * 0.05) * 8 + Math.sin(x * 0.13 + 1) * 5;
    rect(x, 0, 1, h, '#6a7088', g); rect(x, 0, 1, Math.max(0, h - 14), '#e8ecf8', g);
  }
  // marsh tint
  pellipse(78, 66, 60, 34, '#6a8a50', g);
  // moonfall dark glade
  pellipse(244, 58, 62, 34, '#3a3a6a', g);
  for (let i = 0; i < 30; i++) rect(190 + Math.floor(r() * 110), 30 + Math.floor(r() * 56), 1, 1, '#f0f0ff', g);
  // paths
  const city = [160, 210];
  for (const L of LAKES) {
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const t = i / n, mx = (city[0] + L.mx) / 2 + (L.my < 100 ? (L.mx < 160 ? 30 : -30) : 0);
      const x = (1 - t) * (1 - t) * city[0] + 2 * (1 - t) * t * mx + t * t * L.mx;
      const y = (1 - t) * (1 - t) * city[1] + 2 * (1 - t) * t * ((city[1] + L.my) / 2) + t * t * L.my;
      rect(Math.round(x) - 1, Math.round(y) - 1, 3, 3, '#c8a870', g);
    }
  }
  // trees
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(r() * W), y = 30 + Math.floor(r() * 150);
    let ok = true;
    for (const L of LAKES) if (Math.hypot(x - L.mx, (y - L.my) * 1.4) < 46) ok = false;
    if (Math.hypot(x - 160, y - 200) < 30) ok = false;
    if (!ok) continue;
    rect(x, y + 3, 2, 3, '#6a4424', g); pellipse(x + 1, y, 4, 4, '#2c6a34', g); pellipse(x, y - 1, 2, 2, '#4c9c44', g);
  }
  // city icon
  rect(140, 198, 40, 24, '#c8b4a0', g);
  const roofs = ['#c04838', '#3a7ac8', '#3a9a6a', '#8a4ab0'];
  for (let i = 0; i < 4; i++) { rect(142 + i * 10, 194, 8, 6, roofs[i], g); rect(143 + i * 10, 200, 6, 6, '#e8dcc8', g); }
  rect(156, 208, 8, 14, '#5a3a20', g);
  return c;
}
const LakeMapScene = {
  id: 'lakemap', sel: 0,
  enter() { playSong('map'); if (!mapBg) mapBg = makeMapBg(); G.loc = { scene: 'city', x: 15, y: 22, dir: 'up' }; },
  saveLoc() { G.loc = { scene: 'city', x: 15, y: 22, dir: 'up' }; },
  update() {
    const n = LAKES.length;
    if (inp.rep('right') || inp.rep('down')) { this.sel = (this.sel + 1) % n; sfx('blip'); }
    if (inp.rep('left') || inp.rep('up')) { this.sel = (this.sel + n - 1) % n; sfx('blip'); }
    if (inp.pressed.a) { sfx('ok'); const li = this.sel; pushUI(new GearSelect(() => fadeTo(() => setScene(FishingScene, li)))); }
    if (inp.pressed.b) { sfx('cancel'); fadeTo(() => setScene(CityScene, 15, 22, 'up')); }
    if (inp.pressed.menu) { sfx('ok'); pushUI(new MainMenu()); }
  },
  tick() {},
  draw() {
    ctx.drawImage(mapBg, 0, 0);
    LAKES.forEach((L, i) => {
      pellipse(L.mx, L.my, 34, 20, '#e0cc90');
      pellipse(L.mx, L.my, 31, 17, L.water);
      for (let k = 0; k < 4; k++) rect(L.mx - 20 + ((T / 4 + k * 13) % 36), L.my - 8 + k * 5, 5, 1, shade(L.water, 0.35));
      if (L.id === 'willow') for (const dx of [-36, 34]) { rect(L.mx + dx, L.my - 4, 2, 8, '#6a4424'); pellipse(L.mx + dx + 1, L.my - 8, 6, 5, '#5a9a3a'); for (let j = -5; j <= 5; j += 2) rect(L.mx + dx + j, L.my - 6, 1, 8, '#4a8a30'); }
      if (L.id === 'marsh') for (let j = 0; j < 12; j++) rect(L.mx - 30 + j * 5, L.my + 12 + (j % 3), 1, 6, '#3a5a2a');
      if (L.id === 'moonfall') pellipse(L.mx + 6, L.my - 2, 4, 3, '#e8e0ff');
      if (L.id === 'crystal') for (let j = 0; j < 3; j++) { rect(L.mx - 12 + j * 10, L.my - 4 + j * 3, 2, 2, '#ffffff'); }
      const sel = i === this.sel;
      hit(L.mx - 40, L.my - 38, 80, 64, () => { if (this.sel === i) tapA(); else { this.sel = i; sfx('blip'); } });
      const lab = L.name; const lw = tw(lab) + 8;
      drawWin(L.mx - lw / 2 - 2, L.my - 36, lw + 4, 15, sel ? 'gold' : 'dark');
      textC(lab, L.mx, L.my - 32, sel ? '#ffe890' : '#c8d0f0');
      if (G.player.level < L.lv) textC('Lv' + L.lv + '+', L.mx, L.my + 22, '#ffb0b0');
    });
    const L = LAKES[this.sel];
    const spr = playerSprites().down[WALKSEQ[(T >> 3) % 4]];
    ctx.drawImage(spr, L.mx - 9, L.my + 6 - Math.abs(Math.sin(T / 8)) * 2);
    // info
    drawWin(4, 184, 312, 52);
    text(L.name, 12, 192, '#ffe890'); textR('Recommended Lv ' + L.lv, 308, 192, G.player.level >= L.lv ? '#a8ffa8' : '#ffb0b0');
    text(L.desc, 12, 204, '#c8d0f0');
    const ids = L.fish.concat([L.rare]);
    ids.forEach((id, k) => {
      const x = 12 + k * 60, known = !!G.log[id];
      if (known) ctx.drawImage(miniFish(id), x, 216); else text('?', x + 3, 218, '#8890b0');
      text(known ? FISH[id].name.split(' ').pop().slice(0, 7) : (FISH[id].rare ? 'RARE' : '???'), x + 16, 218, known ? '#fff' : FISH[id].rare ? '#ffb0e0' : '#8890b0');
    });
    text('Tap a lake twice (or A) to fish here', 8, 4, '#ffffff', '#101028');
    btn(262, 0, 56, 16, 'City', () => { inp.pressed.b = true; });
  },
};

// ============ Gear select ============
class GearSelect {
  constructor(onStart, title = 'Choose your gear') {
    const p = G.player;
    this.onStart = onStart; this.title = title; this.row = 0;
    this.rods = p.rods.slice();
    this.baits = Object.keys(BAITS).filter(b => p.baits[b] > 0).concat([null]);
    this.ri = Math.max(0, this.rods.indexOf(p.rod));
    this.bi = Math.max(0, this.baits.indexOf(p.bait && p.baits[p.bait] > 0 ? p.bait : null));
  }
  update() {
    if (inp.rep('down')) { this.row = (this.row + 1) % 4; sfx('blip'); }
    if (inp.rep('up')) { this.row = (this.row + 3) % 4; sfx('blip'); }
    const d = inp.rep('right') ? 1 : inp.rep('left') ? -1 : 0;
    if (d && this.row === 0) { this.ri = (this.ri + d + this.rods.length) % this.rods.length; sfx('blip'); }
    if (d && this.row === 1) { this.bi = (this.bi + d + this.baits.length) % this.baits.length; sfx('blip'); }
    if (inp.pressed.a) {
      if (this.row === 2) { sfx('ok'); const p = G.player; p.rod = this.rods[this.ri]; p.bait = this.baits[this.bi]; popUI(this); this.onStart(); }
      else if (this.row === 3) { sfx('cancel'); popUI(this); }
      else this.row++;
    }
    if (inp.pressed.b || inp.pressed.menu) { sfx('cancel'); popUI(this); }
  }
  draw() {
    const x = 30, y = 36, p = G.player, st = stats();
    drawWin(x, y, 260, 150);
    textC(this.title, 160, y + 8, '#ffe890');
    const rod = RODS[this.rods[this.ri]], bid = this.baits[this.bi], bait = bid ? BAITS[bid] : NO_BAIT;
    const rows = [['Rod', '< ' + rod.name + ' >'], ['Bait', '< ' + bait.name + (bid ? ' x' + p.baits[bid] : '') + ' >'], ['Start fishing!', ''], ['Cancel', '']];
    rows.forEach(([a, b], i) => {
      const yy = y + 26 + i * 16;
      text(a, x + 22, yy, i === 2 ? '#a8ffa8' : '#fff'); if (b) text(b, x + 70, yy, '#ffe890');
      if (i === this.row) drawCursor(x + 10, yy);
      if (i < 2) {
        hit(x, yy - 4, 130, 16, () => { this.row = i; inp.pressed.left = true; });
        hit(x + 130, yy - 4, 130, 16, () => { this.row = i; inp.pressed.right = true; });
      } else hit(x, yy - 4, 260, 16, () => { this.row = i; tapA(); });
    });
    rect(x + 10, y + 92, 240, 1, '#8090d0');
    text('POWER ' + (rod.power + st.power), x + 14, y + 100, '#a8ffa8'); text('BAR +' + rod.zone, x + 100, y + 100, '#a8ffa8');
    text('BITE x' + (1 / bait.bite).toFixed(1), x + 14, y + 112, '#a8ffa8'); text('RARE +' + Math.max(0, bait.rare * 100).toFixed(1) + '%', x + 100, y + 112, '#a8ffa8');
    text(wrap(this.row === 1 ? bait.desc : rod.desc, 40)[0], x + 14, y + 126, '#c8d0f0');
    text('Tap < > or L/R to change', x + 14, y + 138, '#8898d0');
  }
}

// ============ Lake backdrops ============
const LAKE_ART = {
  willow: { sky: ['#78c0f0', '#d0f0ff'], far: '#5a9a6a', near: '#3e7e42', water: ['#5ab0b0', '#226a74'], hi: '#a0e0e0', dock: '#9a6a3a' },
  crystal: { sky: ['#3a8ae8', '#d8f0ff'], far: '#8a98b8', near: '#2a5a3a', water: ['#60b0f0', '#1a4aa0'], hi: '#c0e8ff', dock: '#a87a4a' },
  marsh: { sky: ['#7a8a74', '#c8d0b8'], far: '#5a6a50', near: '#34442a', water: ['#6a8a50', '#2a3a20'], hi: '#a0b888', dock: '#6a5a3a' },
  moonfall: { sky: ['#0a0628', '#40307a'], far: '#2a2058', near: '#181238', water: ['#4a3aa0', '#120c40'], hi: '#a090ff', dock: '#5a4a6a' },
};
const backdrops = {};
function lakeBackdrop(L) {
  if (backdrops[L.id]) return backdrops[L.id];
  const a = LAKE_ART[L.id], c = mkCanvas(W, H), g = c.getContext('2d'), r = seeded(L.id.length * 97);
  for (let y = 0; y < 104; y += 4) rect(0, y, W, 4, mix(a.sky[0], a.sky[1], y / 104), g);
  if (L.id === 'moonfall') {
    for (let i = 0; i < 80; i++) rect(Math.floor(r() * W), Math.floor(r() * 90), 1, 1, r() < 0.3 ? '#fff8c0' : '#c0c8ff', g);
    pellipse(250, 34, 16, 16, '#f0ecff', g); pellipse(244, 30, 4, 3, '#d0c8f0', g); pellipse(256, 40, 3, 2, '#d0c8f0', g);
  } else if (L.id === 'marsh') {
    pellipse(70, 34, 12, 12, '#e8ecd8', g);
  } else pellipse(64, 30, 12, 12, '#fff4b0', g);
  // far mountains
  for (let x = 0; x < W; x++) {
    const hh = L.id === 'crystal' ? 36 + Math.abs(((x * 0.7) % 60) - 30) * 1.2 + Math.sin(x * 0.1) * 4 : 20 + Math.sin(x * 0.035) * 9 + Math.sin(x * 0.11) * 4;
    rect(x, 104 - hh, 1, hh, a.far, g);
    if (L.id === 'crystal') rect(x, 104 - hh, 1, Math.max(0, hh - 46), '#ffffff', g);
  }
  // tree line
  for (let x = -4; x < W + 8; x += 7) {
    const hh = 8 + Math.floor(r() * 8);
    if (L.id === 'crystal') { for (let k = 0; k < hh; k++) rect(x + 3 - Math.floor(k / 3), 104 - hh + k, 1 + Math.floor(k / 3) * 2, 1, a.near, g); }
    else pellipse(x + 3, 104 - hh / 2, 5, hh / 2, a.near, g);
  }
  rect(0, 100, W, 4, a.near, g);
  // water
  for (let y = 104; y < H; y += 3) rect(0, y, W, 3, mix(a.water[0], a.water[1], Math.pow((y - 104) / 136, 0.7)), g);
  for (let i = 0; i < 40; i++) rect(Math.floor(r() * W), 105 + Math.floor(r() * 12), 6 + Math.floor(r() * 10), 1, shade(a.water[0], 0.15), g);
  if (L.id === 'willow') for (const wx of [190, 290]) {
    rect(wx, 74, 3, 28, '#5a3a20', g); pellipse(wx + 1, 74, 16, 9, '#4a8a3a', g);
    for (let j = -15; j <= 16; j += 2) rect(wx + j, 74, 1, 14 + Math.abs(j) % 7, '#3a7a2a', g);
  }
  if (L.id === 'marsh') for (let i = 0; i < 40; i++) { const x = 150 + Math.floor(r() * 170), hh = 10 + Math.floor(r() * 18); rect(x, 240 - hh, 1, hh, '#2a3a1a', g); rect(x, 240 - hh, 2, 4, '#6a4a2a', g); }
  // dock
  rect(0, 118, 78, 10, a.dock, g);
  for (let x = 0; x < 78; x += 9) rect(x, 118, 1, 10, shade(a.dock, -0.35), g);
  rect(0, 118, 78, 1, shade(a.dock, 0.3), g); rect(0, 128, 78, 2, shade(a.dock, -0.5), g);
  for (const px of [6, 40, 72]) rect(px, 130, 4, 40, shade(a.dock, -0.4), g);
  return (backdrops[L.id] = c);
}

// ============ Fishing ============
function pickFish(L, bait, dist) {
  const st = stats(), p = G.player;
  let rc = 0.02 + st.luck * 0.006 + bait.rare + dist * 0.02 + p.level * 0.001;
  if (bait.tier < 0) rc *= 0.3;
  if (Math.random() < rc) return L.rare;
  const opts = L.fish.map(id => {
    const sp = FISH[id];
    let w = sp.w * Math.pow(1 + 0.22 * Math.max(0, bait.tier), sp.d / 3) * (1 + dist * (sp.d / 10));
    if (bait.tier < 0 && sp.d > 2) w *= 0.4;
    return [id, w];
  });
  opts.push(['boot', bait.tier < 0 ? 12 : 6 / (1 + bait.tier)]);
  let tot = opts.reduce((a, o) => a + o[1], 0), r = Math.random() * tot;
  for (const [id, w] of opts) { if ((r -= w) < 0) return id; }
  return opts[0][0];
}
function makeFish(id, dist) {
  const sp = FISH[id], st = stats();
  const t = clamp(Math.pow(Math.random(), clamp(1.25 - st.luck * 0.03 - dist * 0.3, 0.5, 2)), 0, 1);
  const size = Math.round((sp.min + (sp.max - sp.min) * t) * 10) / 10;
  return { id, size, value: Math.max(1, Math.round(sp.val * (0.75 + 0.6 * t))), rare: !!sp.rare, t };
}
const BAR_H = 150;
const FishingScene = {
  id: 'fishing',
  enter(li) {
    this.L = LAKES[li]; this.art = LAKE_ART[this.L.id]; this.bd = lakeBackdrop(this.L);
    this.state = 'ready'; this.bob = null; this.rip = []; this.parts = [];
    this.shadows = Array.from({ length: 6 }, () => ({ x: rnd(100, 320), y: rnd(132, 230), vx: rnd(-0.4, 0.4), s: rnd(0.7, 1.3) }));
    this.trip = 0; playSong('fish');
    if (G.player.level + 2 < this.L.lv) setTimeout(() => toast('These fish look tough for your level...', '#ffb0b0'), 400);
  },
  saveLoc() { G.loc = { scene: 'city', x: 15, y: 22, dir: 'up' }; },
  tip() {
    if (this.state === 'reel') { const b = this.bob; return { x: 92 + (b.x - 92) * 0.08, y: 74 + Math.sin(T * 0.6) * 2 }; }
    if (this.state === 'charge') return { x: 50 + (1 - this.pow) * 4, y: 64 + this.pow * 6 };
    return { x: 94, y: 66 };
  },
  say(m, t = 90) { this.state = 'msg'; this.msg = m; this.mt = t; },
  update() {
    const p = G.player;
    switch (this.state) {
      case 'ready':
        if (inp.pressed.a) { this.state = 'charge'; this.pow = 0; this.pdir = 1; sfx('blip'); }
        else if (inp.pressed.b || inp.pressed.menu) this.pause();
        break;
      case 'charge':
        this.pow += this.pdir * 0.022;
        if (this.pow >= 1) { this.pow = 1; this.pdir = -1; } if (this.pow <= 0) { this.pow = 0; this.pdir = 1; }
        if (inp.pressed.a) this.cast();
        else if (inp.pressed.b) { this.state = 'ready'; sfx('cancel'); }
        break;
      case 'cast': {
        this.ct++;
        const k = Math.min(1, this.ct / 28), t0 = this.castFrom, t1 = this.target;
        this.bob = { x: t0.x + (t1.x - t0.x) * k, y: t0.y + (t1.y - t0.y) * k - Math.sin(k * Math.PI) * 50 };
        if (k >= 1) {
          this.state = 'wait'; this.wt = 0; this.nib = 0; this.bob = { x: t1.x, y: t1.y };
          this.ripple(t1.x, t1.y, 3); sfx('splash');
          const lakeSlow = 1 + LAKES.indexOf(this.L) * 0.08;
          this.biteAt = Math.round(rnd(80, 280) * this.bait.bite * lakeSlow);
          const nn = irnd(0, 1 + LAKES.indexOf(this.L)); this.nibs = [];
          for (let i = 0; i < nn; i++) this.nibs.push(irnd(30, Math.max(31, this.biteAt - 30)));
          this.nibs.sort((a, b) => a - b);
        }
        break;
      }
      case 'wait':
        this.wt++;
        if (this.nib > 0) this.nib--;
        if (this.nibs.length && this.wt >= this.nibs[0]) { this.nibs.shift(); this.nib = 16; sfx('nibble'); this.ripple(this.bob.x, this.bob.y, 1); }
        if (inp.pressed.a) {
          if (this.nib > 0) { sfx('fail'); this.say('Too early! The nibble was a trick - you spooked the fish.'); }
          else { sfx('cancel'); this.say('You reeled in your line.', 40); }
          break;
        }
        if (this.wt >= this.biteAt) {
          this.fishId = pickFish(this.L, this.bait, this.dist);
          const st = stats(), d = FISH[this.fishId].d;
          this.state = 'bite'; this.bt = 0;
          // Willow Pond and Crystal Lake: 4-5 s to react. Harder lakes: about 3-3.5 s.
          this.win = LAKES.indexOf(this.L) <= 1
            ? Math.round(clamp(240 + p.level * 3 + st.focus * 4, 240, 300))
            : Math.round(clamp(24 + p.level * 0.8 + st.focus * 2 - d * 0.9, 14, 60) + 150);
          sfx('bite'); this.ripple(this.bob.x, this.bob.y, 2);
        }
        break;
      case 'bite':
        this.bt++;
        if (inp.pressed.a) this.startReel();
        else if (this.bt > this.win) { sfx('fail'); this.say('Too slow... the fish stole your bait!'); }
        break;
      case 'reel': this.reel(); break;
      case 'msg':
        if (--this.mt <= 0 || (inp.pressed.a && this.mt < 70)) { this.state = 'ready'; this.bob = null; }
        break;
    }
  },
  tick() {
    for (const s of this.shadows) { s.x += s.vx; if (s.x < 90 || s.x > 330) s.vx *= -1; if (Math.random() < 0.005) s.vx = rnd(-0.4, 0.4); }
    for (const r of this.rip) r.t++;
    this.rip = this.rip.filter(r => r.t < 40);
    for (const q of this.parts) { q.x += q.vx; q.y += q.vy; q.vy += 0.15; q.t--; }
    this.parts = this.parts.filter(q => q.t > 0);
  },
  ripple(x, y, n) { for (let i = 0; i < n; i++) this.rip.push({ x, y, t: -i * 8 }); for (let i = 0; i < n * 4; i++) this.parts.push({ x, y, vx: rnd(-1, 1), vy: rnd(-2.5, -1), t: 25 }); },
  cast() {
    const p = G.player;
    this.baitId = p.bait && p.baits[p.bait] > 0 ? p.bait : null;
    this.bait = this.baitId ? BAITS[this.baitId] : NO_BAIT;
    if (this.baitId) { p.baits[this.baitId]--; }
    this.dist = this.pow;
    this.castFrom = this.tip();
    this.target = { x: 112 + this.pow * 186, y: 214 - this.pow * 84 };
    this.state = 'cast'; this.ct = 0; sfx('cast');
  },
  startReel() {
    const p = G.player, st = stats(), rod = RODS[p.rod], sp = FISH[this.fishId], d = sp.d;
    const power = rod.power + st.power;
    this.r = {
      zh: clamp(44 + rod.zone + st.focus * 2 + p.level * 0.8, 40, 120), zy: 0, vz: 0,
      fy: BAR_H * 0.6, fv: 0, tgt: BAR_H * 0.5, tt: 30, prog: 35,
      spd: Math.max(0.35, 0.45 + d * 0.19 - power * 0.04 - p.level * 0.02),
      gain: 0.6 + power * 0.03,
      drain: Math.max(0.07, 0.11 + d * 0.022 - st.stamina * 0.015),
      beh: sp.beh, d,
    };
    this.r.zy = BAR_H - this.r.zh;
    this.state = 'reel'; sfx('ok');
  },
  reel() {
    const r = this.r, FH = BAR_H - 8;
    if (--r.tt <= 0) {
      switch (r.beh) {
        case 'sinker': r.tgt = FH * rnd(0.35, 1); r.tt = irnd(40, 100); break;
        case 'floater': r.tgt = FH * rnd(0, 0.65); r.tt = irnd(40, 100); break;
        case 'dart': r.tgt = Math.random() < 0.55 ? (r.fy < FH / 2 ? rnd(FH * 0.6, FH) : rnd(0, FH * 0.4)) : rnd(0, FH); r.tt = irnd(25, 75); break;
        case 'wild': r.tgt = rnd(0, FH); r.tt = irnd(12, 45); break;
        default: r.tgt = rnd(0, FH); r.tt = irnd(50, 110);
      }
      r.tt = Math.round(r.tt / (1 + r.d * 0.05));
    }
    const want = clamp((r.tgt - r.fy) * 0.08, -r.spd, r.spd);
    r.fv += (want - r.fv) * 0.18;
    r.fy = clamp(r.fy + r.fv + (r.beh === 'wild' || r.beh === 'dart' ? rnd(-0.4, 0.4) * r.d * 0.05 : 0), 0, FH);
    // each tap gives the bar a hop upward; holding lifts it gently; it sinks slowly otherwise
    if (inp.pressed.a) r.vz = Math.min(r.vz, 0) - 2.4;
    else if (inp.held.a) r.vz -= 0.2;
    r.vz += 0.13; r.vz *= 0.95;
    r.vz = clamp(r.vz, -4, 2.5); r.zy += r.vz;
    if (r.zy < 0) { r.zy = 0; r.vz = 0; }
    if (r.zy > BAR_H - r.zh) { r.zy = BAR_H - r.zh; r.vz = -r.vz * 0.35; if (Math.abs(r.vz) < 0.4) r.vz = 0; }
    const fc = r.fy + 4;
    r.inZone = fc >= r.zy && fc <= r.zy + r.zh;
    r.prog += r.inZone ? r.gain : -r.drain;
    if (r.inZone && T % 5 === 0) sfx('reel');
    if (T % 10 === 0) this.ripple(this.bob.x + rnd(-4, 4), this.bob.y, 1);
    if (r.prog >= 100) this.caught();
    else if (r.prog <= 0) { sfx('fail'); this.say('The line went slack... it got away!'); }
  },
  caught() {
    const id = this.fishId, sp = FISH[id], f = makeFish(id, this.dist);
    const xp = sp.junk ? 1 : Math.round((4 + sp.d * 5) * (sp.rare ? 3 : 1) * (0.85 + 0.3 * f.t));
    delete f.t;
    const isNew = !G.log[id];
    const e = G.log[id] || (G.log[id] = { n: 0, best: 0 });
    e.n++; e.best = Math.max(e.best, f.size);
    G.stats.caught++; this.trip++;
    let kept = true;
    if (G.cooler.length >= MAX_COOLER) kept = false; else G.cooler.push(f);
    const ups = addXP(xp);
    sfx(sp.rare ? 'rare' : sp.junk ? 'cancel' : 'catch');
    if (ups) setTimeout(() => sfx('level'), 700);
    this.state = 'card'; this.bob = null;
    pushUI(new CatchCard(f, xp, ups, isNew, kept, () => { this.state = 'ready'; }));
  },
  pause() {
    sfx('ok');
    const m = pushUI(new MenuUI({
      x: 100, y: 50, w: 120, lh: 14, rows: 8, title: this.L.name,
      items: [
        { label: 'Keep fishing', action: () => popUI(m) },
        { label: 'Change gear', action: () => { popUI(m); pushUI(new GearSelect(() => toast('Gear changed!'), 'Change gear')); } },
        { label: 'Status', action: () => pushUI(new MainMenu()) },
        { label: 'Save game', action: () => pushUI(new SlotUI('save', i => doSave(i))) },
        { label: 'Leave lake', action: () => { popUI(m); this.leave(() => setScene(LakeMapScene)); } },
        { label: 'Warp home', action: () => { popUI(m); this.leave(() => setScene(HomeScene, 10, 12, 'up')); sfx('warp'); } },
      ],
      onCancel: () => popUI(m),
    }));
  },
  leave(go) {
    G.day++;
    fadeTo(go);
    if (this.trip) setTimeout(() => toast('Day ' + G.day + ' begins. ' + this.trip + ' fish caught last trip!'), 600);
  },
  draw() {
    ctx.drawImage(this.bd, 0, 0);
    const a = this.art;
    // shimmer
    for (let k = 0; k < 26; k++) {
      const y = 108 + ((k * 37) % 130), sp = 0.15 + (k % 5) * 0.06;
      const x = ((k * 53 + T * sp) % 360) - 20;
      rect(x, y, 4 + (k % 4) * 3, 1, a.hi);
    }
    if (this.L.id === 'marsh') for (let k = 0; k < 4; k++) { ctx.fillStyle = 'rgba(220,230,210,0.12)'; ctx.fillRect(((T * 0.2 * (k + 1)) % 480) - 160, 92 + k * 26, 160, 10); }
    if (this.L.id === 'moonfall') for (let k = 0; k < 8; k++) if ((T + k * 13) % 40 < 20) rect(240 + Math.sin(k * 3) * 14, 120 + k * 12, 3, 1, '#f0ecff');
    // shadows
    for (const s of this.shadows) { ctx.fillStyle = 'rgba(0,0,30,0.22)'; pellipse(s.x, s.y, 7 * s.s, 2 * s.s, 'rgba(0,0,30,0.22)'); rect(s.x + (s.vx > 0 ? -9 : 7) * s.s, s.y - 1, 2, 3, 'rgba(0,0,30,0.22)'); }
    // ripples & splash
    for (const r of this.rip) if (r.t > 0) pring(r.x, r.y + 2, r.t * 0.5 + 2, r.t * 0.18 + 1, `rgba(255,255,255,${0.8 - r.t / 50})`);
    for (const q of this.parts) rect(q.x, q.y, 1, 1, '#e8f8ff');
    // player
    const ps = playerSprites();
    const fr = this.state === 'reel' ? WALKSEQ[(T >> 2) % 4] : 0;
    const spr = ps.right[fr];
    ctx.drawImage(spr, 30, 84, spr.width * 2, spr.height * 2);
    const tip = this.tip();
    pline(60, 108, tip.x, tip.y, '#2a1a10', ctx, 2);
    pline(60, 108, tip.x, tip.y, RODS[G.player.rod].color);
    // line + bobber
    if (this.bob) {
      const b = this.bob; let by = b.y;
      if (this.state === 'wait') by += Math.sin(T / 12) + (this.nib > 0 ? (this.nib > 8 ? 2 : 1) : 0);
      if (this.state === 'bite') by += 3;
      let bx = b.x;
      if (this.state === 'reel') { bx += rnd(-1.5, 1.5); by += rnd(-1, 2); }
      const n = 24;
      for (let i = 0; i <= n; i++) {
        const t = i / n, sag = this.state === 'cast' ? 0 : Math.sin(t * Math.PI) * (this.state === 'reel' ? 2 : 10);
        rect(tip.x + (bx - tip.x) * t, tip.y + (by - tip.y) * t + sag, 1, 1, 'rgba(240,240,255,0.8)');
      }
      if (this.state === 'bite') {
        rect(bx - 2, by - 1, 5, 2, '#e83030');
        const jy = by - 20 - Math.abs(Math.sin(T / 3)) * 3;
        drawWin(bx - 7, jy - 3, 15, 15, 'gold'); text('!', bx - 2, jy + 1, '#ff5050');
        bar(bx - 12, jy + 14, 25, 3, 1 - this.bt / this.win, '#ffe060');
      } else if (this.state === 'reel') {
        pellipse(bx, by + 3, 6, 2, 'rgba(0,0,30,0.35)');
      } else {
        rect(bx - 2, by - 3, 5, 3, '#e83030'); rect(bx - 2, by, 5, 2, '#f8f8f8'); rect(bx, by - 5, 1, 2, '#303030');
      }
    }
    // HUD
    const p = G.player;
    drawWin(4, 4, 150, 42, 'dark');
    text(this.L.name, 12, 10, '#ffe890');
    const bname = p.bait && p.baits[p.bait] > 0 ? BAITS[p.bait].name + ' x' + p.baits[p.bait] : 'No bait';
    text(RODS[p.rod].name, 12, 21, '#c8d0f0'); text(bname, 12, 32, p.bait && p.baits[p.bait] > 0 ? '#c8d0f0' : '#ffb0b0');
    drawWin(244, 4, 72, 30, 'dark');
    text('Lv ' + p.level, 250, 10); textR(G.cooler.length + '/' + MAX_COOLER, 310, 10, G.cooler.length >= MAX_COOLER ? '#ff8080' : '#c8d0f0');
    bar(250, 23, 60, 3, p.level >= MAX_LEVEL ? 1 : p.xp / xpNeed(p.level), '#60e0a0');
    // power meter
    if (this.state === 'charge') {
      drawWin(16, 52, 72, 18, 'dark');
      const pw = this.pow, col = pw > 0.85 ? '#ff6060' : pw > 0.5 ? '#ffd040' : '#60e060';
      bar(22, 58, 60, 6, pw, col, '#202040');
      rect(22 + 51, 57, 1, 8, '#fff');
    }
    if (this.state === 'reel') this.drawBar();
    // message
    let m = '';
    switch (this.state) {
      case 'ready': m = 'A: Cast your line     B: Menu'; break;
      case 'charge': m = 'Press A to cast! Farther = deeper, rarer fish.'; break;
      case 'cast': m = 'Whoosh!'; break;
      case 'wait': m = this.nib > 0 ? '...a nibble? Wait for it...' : 'Waiting for a bite...   (A: reel in)'; break;
      case 'bite': m = '!!! A BITE !!!  Press A NOW!'; break;
      case 'reel': m = 'TAP A to lift the green bar. Keep the fish inside it!'; break;
      case 'msg': m = this.msg; break;
    }
    if (m && !ui.length) {
      const ls = wrap(m, 48);
      drawWin(4, H - 10 - ls.length * 11, 312, 8 + ls.length * 11);
      ls.forEach((l, i) => text(l, 12, H - 6 - ls.length * 11 + i * 11, this.state === 'bite' ? '#ffe890' : '#fff'));
    }
  },
  drawBar() {
    const r = this.r, x = 270, y = 34;
    drawWin(x, y, 42, BAR_H + 14, 'dark');
    const tx = x + 8, ty = y + 7;
    rect(tx, ty, 16, BAR_H, '#1a3a6a');
    for (let i = 0; i < BAR_H; i += 10) rect(tx, ty + i, 16, 1, '#24467a');
    const zc = r.inZone ? '#50e070' : '#3aa050';
    rect(tx + 1, ty + r.zy, 14, r.zh, zc); rect(tx + 1, ty + r.zy, 14, 1, '#c0ffc8'); rect(tx + 1, ty + r.zy + r.zh - 1, 14, 1, '#2a7a3a');
    // fish icon
    const fy = ty + r.fy, fx = tx + 3 + Math.round(Math.sin(T / 4));
    const fc = FISH[this.fishId].rare ? ((T >> 2) % 2 ? '#ffe040' : '#ff80c0') : '#ffd060';
    rect(fx, fy + 2, 7, 4, '#101028'); rect(fx + 1, fy + 2, 5, 4, fc); rect(fx + 7, fy + 1, 2, 6, fc); rect(fx + 2, fy + 3, 1, 1, '#101028');
    // progress
    const px = x + 30;
    rect(px, ty, 5, BAR_H, '#202040');
    const ph = Math.round(BAR_H * clamp(r.prog, 0, 100) / 100);
    rect(px, ty + BAR_H - ph, 5, ph, r.prog > 66 ? '#60e060' : r.prog > 33 ? '#f0d040' : '#f05050');
  },
};

// ============ Catch card ============
class CatchCard {
  constructor(f, xp, ups, isNew, kept, cb) { Object.assign(this, { f, xp, ups, isNew, kept, cb, age: 0, tapAnywhere: true }); }
  update() { this.age++; if (this.age > 25 && (inp.pressed.a || inp.pressed.b)) { sfx('ok'); popUI(this); this.cb(); } }
  draw() {
    const sp = FISH[this.f.id], x = 30, y = 26, w = 260, h = 186;
    drawWin(x, y, w, h, this.f.rare ? 'gold' : 'blue');
    const title = sp.junk ? 'You fished up...' : this.f.rare ? '*** RARE CATCH! ***' : 'You caught a fish!';
    textC(title, 160, y + 8, this.f.rare ? ((T >> 3) % 2 ? '#ffe890' : '#ff90d0') : '#ffe890');
    // sparkle bg
    rect(x + 60, y + 22, 140, 64, '#0c1238');
    for (let i = 0; i < 10; i++) { const a = T / 30 + i * 0.63; if ((T + i * 7) % 30 < 15) rect(160 + Math.cos(a) * 60, y + 54 + Math.sin(a) * 26, 1, 1, '#fff8c0'); }
    const img = fishSprite(this.f.id), s = Math.min(4, Math.floor(130 / img.width), Math.floor(58 / img.height));
    const bob = Math.round(Math.sin(this.age / 10) * 2);
    ctx.drawImage(img, 160 - img.width * s / 2, y + 54 - img.height * s / 2 + bob, img.width * s, img.height * s);
    textC(sp.name, 160, y + 94, this.f.rare ? '#ffe890' : '#fff');
    if (this.isNew && !sp.junk) { const nx = 160 + tw(sp.name) / 2 + 6; rect(nx, y + 92, 26, 11, '#e04848'); text('NEW', nx + 4, y + 94, '#fff', null); }
    text('Size', x + 40, y + 112, '#a8b8f0'); textR(this.f.size + ' cm', x + w - 40, y + 112);
    text('Value', x + 40, y + 125, '#a8b8f0'); textR('$' + fmt(this.f.value) + ' AC', x + w - 40, y + 125, '#ffe890');
    text('XP', x + 40, y + 138, '#a8b8f0'); textR('+' + this.xp, x + w - 40, y + 138, '#a8ffa8');
    if (this.ups) textC('LEVEL UP! You are now Lv ' + G.player.level + '!', 160, y + 154, (T >> 3) % 2 ? '#ffe890' : '#a8ffa8');
    else if (!this.kept) textC('Cooler full! You let it go...', 160, y + 154, '#ffb0b0');
    else if (sp.junk) textC(sp.desc, 160, y + 154, '#c8d0f0');
    if (this.age > 25) textC('Press A or tap', 160, y + 170, '#8898d0');
  }
}
