'use strict';
// ============ Overhead field (city / home) ============
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
function makeEntity(tx, ty, dir, sprites) {
  return { tx, ty, ox: tx, oy: ty, x: tx * TS, y: ty * TS, dir, moving: false, walkT: 0, sprites };
}
function stepEntity(e, speed) {
  if (!e.moving) return false;
  const gx = e.tx * TS, gy = e.ty * TS;
  e.x += clamp(gx - e.x, -speed, speed); e.y += clamp(gy - e.y, -speed, speed);
  e.walkT += speed / 2;
  if (e.x === gx && e.y === gy) { e.moving = false; e.ox = e.tx; e.oy = e.ty; return true; }
  return false;
}
function entSprite(e) {
  const f = e.moving || e.walkHold > 0 ? WALKSEQ[Math.floor(e.walkT / 4) % 4] : 0;
  return e.sprites[e.dir][f];
}

class Field {
  constructor(id, w, h, theme) {
    Object.assign(this, { id, w, h, theme, tiles: new Array(w * h).fill(TL.GRASS), objs: [], npcs: [], triggers: {}, song: 'town' });
  }
  tile(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? TL.TREE : this.tiles[y * this.w + x]; }
  set(x, y, t) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.tiles[y * this.w + x] = t; }
  fill(x0, y0, x1, y1, t) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, t); }
  objAt(x, y) { return this.objs.find(o => x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h); }
  solidAt(x, y, self) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return true;
    if (SOLID_TILES.has(this.tile(x, y))) return true;
    for (const o of this.objs) if (o.solid && x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h && !(o.door && o.door[0] === x && o.door[1] === y)) return true;
    const ents = this.npcs.concat(this.player ? [this.player] : []);
    for (const n of ents) if (n !== self && ((n.tx === x && n.ty === y) || (n.ox === x && n.oy === y))) return true;
    return false;
  }
  place(tx, ty, dir) { this.player = makeEntity(tx, ty, dir, playerSprites()); }
  refreshPlayer() { if (this.player) this.player.sprites = playerSprites(); }
  saveLoc() { const p = this.player; G.loc = { scene: this.id, x: p.tx, y: p.ty, dir: p.dir }; }
  update() {
    const p = this.player;
    if (p.moving) {
      if (stepEntity(p, inp.held.b ? 4 : 2)) {
        const tr = this.triggers[p.tx + ',' + p.ty];
        if (tr) { tr(); return; }
      } else return;
    }
    let d = null;
    for (const k of ['up', 'down', 'left', 'right']) if (inp.held[k]) { d = k; break; }
    if (d) {
      p.dir = d;
      const [dx, dy] = DIRS[d], nx = p.tx + dx, ny = p.ty + dy;
      if (!this.solidAt(nx, ny, p)) { p.ox = p.tx; p.oy = p.ty; p.tx = nx; p.ty = ny; p.moving = true; stepEntity(p, inp.held.b ? 4 : 2); }
      else { p.walkHold = 0; if (inp.pressed[d]) sfx('bump'); }
    }
    if (inp.pressed.a) this.interact();
    if (inp.pressed.menu) { sfx('ok'); pushUI(new MainMenu()); }
  }
  tickNPCs() {
    for (const n of this.npcs) {
      if (n.moving) { stepEntity(n, 1); continue; }
      if (--n.wait > 0) continue;
      n.wait = irnd(60, 200);
      if (n.still) continue;
      const d = pick(Object.keys(DIRS)), [dx, dy] = DIRS[d], nx = n.tx + dx, ny = n.ty + dy;
      n.dir = d;
      if (Math.abs(nx - n.hx) <= n.r && Math.abs(ny - n.hy) <= n.r && !this.solidAt(nx, ny, n) && !this.triggers[nx + ',' + ny]) {
        n.ox = n.tx; n.oy = n.ty; n.tx = nx; n.ty = ny; n.moving = true;
      }
    }
  }
  interact() {
    const p = this.player, [dx, dy] = DIRS[p.dir], fx = p.tx + dx, fy = p.ty + dy;
    const n = this.npcs.find(n => n.tx === fx && n.ty === fy);
    if (n) {
      n.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[p.dir];
      const lines = typeof n.lines === 'function' ? n.lines() : n.lines;
      say(Array.isArray(lines) ? [pick(lines)] : lines, null, n.name);
      return;
    }
    const o = this.objAt(fx, fy);
    if (o && o.interact) o.interact();
  }
  addNPC(name, tx, ty, type, col, lines, r = 2, hat) {
    if (SOLID_TILES.has(this.tile(tx, ty))) this.set(tx, ty, TL.GRASS);
    const n = makeEntity(tx, ty, 'down', charSprites(type, col, hat));
    Object.assign(n, { name, lines, hx: tx, hy: ty, r, wait: irnd(10, 120), still: r === 0 });
    this.npcs.push(n); return n;
  }
  draw() {
    const p = this.player, mw = this.w * TS, mh = this.h * TS;
    const camX = mw <= W ? (mw - W) / 2 : clamp(Math.round(p.x + 8 - W / 2), 0, mw - W);
    const camY = mh <= H ? (mh - H) / 2 : clamp(Math.round(p.y + 8 - H / 2), 0, mh - H);
    rect(0, 0, W, H, '#101820');
    const ts = tileset(this.theme);
    const x0 = Math.floor(camX / TS), y0 = Math.floor(camY / TS);
    for (let y = y0; y <= y0 + H / TS + 1; y++) for (let x = x0; x <= x0 + W / TS + 1; x++) {
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) continue;
      drawTile(this, ts, x, y, x * TS - camX, y * TS - camY);
    }
    const list = [];
    for (const o of this.objs) list.push({ y: (o.y + o.h) * TS + (o.z || 0), d: () => o.draw(o.x * TS - camX, o.y * TS - camY) });
    for (const e of this.npcs.concat([p])) list.push({ y: e.y + 16.5, d: () => { const s = entSprite(e); ctx.drawImage(s, Math.round(e.x - camX) - 1, Math.round(e.y - camY) - 3); } });
    list.sort((a, b) => a.y - b.y).forEach(o => o.d());
    if (this.overlay) this.overlay(camX, camY);
    // HUD
    if (!ui.length && !this.noHud) {
      drawWin(4, 4, 92, 30, 'dark');
      text('$', 10, 10, '#ffd040'); text(fmt(G.player.ac) + ' AC', 20, 10, '#ffe890');
      text('Lv ' + G.player.level, 10, 21, '#c8d0f0'); textR('Day ' + G.day, 90, 21, '#c8d0f0');
      if (this.label) { drawWin(W - tw(this.label) - 20, 4, tw(this.label) + 16, 18, 'dark'); text(this.label, W - tw(this.label) - 12, 9, '#80e0ff'); }
      text('ESC: Menu', W - 58, H - 10, 'rgba(255,255,255,0.55)', null);
    }
  }
}

// ---------------- City ----------------
let cityField = null;
function buildCity() {
  const f = new Field('city', 32, 24, CITY_THEME);
  f.label = 'Aquarium World';
  f.song = 'town';
  // borders
  for (let x = 0; x < f.w; x++) { f.set(x, 0, TL.TREE); f.set(x, f.h - 1, TL.TREE); }
  for (let y = 0; y < f.h; y++) { f.set(0, y, TL.TREE); f.set(f.w - 1, y, TL.TREE); }
  // roads
  f.fill(15, 1, 16, 23, TL.PATH);
  f.fill(1, 11, 30, 12, TL.PATH);
  f.fill(12, 8, 19, 15, TL.PLAZA);
  f.fill(6, 8, 6, 10, TL.PATH); f.fill(25, 8, 25, 10, TL.PATH);
  f.fill(6, 20, 25, 21, TL.PATH); f.fill(6, 20, 6, 21, TL.PATH);
  f.fill(11, 3, 13, 5, TL.WATER); f.fill(18, 3, 20, 5, TL.WATER);
  f.set(13, 5, TL.GRASS); f.set(18, 5, TL.GRASS);
  // shops
  const shops = [
    ['tackle', 3, 3, { roof: '#c04838', wall: '#e8d8b8', sign: 'BAIT & TACKLE', signCol: '#7a3a20' }],
    ['tanks', 22, 3, { roof: '#3a7ac8', wall: '#e0eef8', sign: 'TANKS', signCol: '#204a8a' }],
    ['market', 3, 15, { roof: '#3a9a6a', wall: '#f0e8d0', sign: 'FISH MARKET', signCol: '#205a3a' }],
    ['outfitter', 22, 15, { roof: '#8a4ab0', wall: '#e8dcc8', sign: 'OUTFITTERS', signCol: '#4a2a6a' }],
  ];
  for (const [kind, x, y, o] of shops) {
    const img = makeBuilding(7, 5, Object.assign({ chimney: kind === 'tackle' || kind === 'market' }, o));
    const door = [x + 3, y + 4];
    f.objs.push({ x, y, w: 7, h: 5, solid: true, door, draw: (sx, sy) => ctx.drawImage(img, sx, sy) });
    f.triggers[door[0] + ',' + door[1]] = () => enterShop(kind, door);
  }
  // prize wheel
  if (!smallWheel) smallWheel = makeWheelCanvas(13, WHEEL_SEGS);
  f.objs.push({
    x: 15, y: 11, w: 2, h: 1, solid: true, z: -1,
    draw: (sx, sy) => {
      rect(sx + 4, sy + 10, 24, 6, '#5a3a20'); rect(sx + 4, sy + 10, 24, 1, '#8a5a30');
      rect(sx + 14, sy - 4, 4, 14, '#7a5a30');
      ctx.save(); ctx.translate(sx + 16, sy - 8); ctx.rotate(T / 60); ctx.drawImage(smallWheel, -smallWheel.width / 2, -smallWheel.height / 2); ctx.restore();
      rect(sx + 14, sy - 26, 5, 4, '#ff4040');
    },
    interact: () => pushUI(new WheelUI()),
  });
  f.objs.push({ x: 15, y: 10, w: 2, h: 1, solid: true, draw: () => {}, interact: () => pushUI(new WheelUI()) });
  // portal home
  f.objs.push({ x: 15, y: 1, w: 2, h: 1, solid: false, z: -40, draw: (sx, sy) => drawPortal(sx, sy + 1) });
  f.triggers['15,1'] = f.triggers['16,1'] = () => ask('Travel through the portal back to ' + G.world.name + '?', ['Go home', 'Stay'], k => { if (k === 0) warpTo('home'); });
  // gate
  f.set(14, 23, TL.GRASS); f.set(17, 23, TL.GRASS);
  f.objs.push({ x: 14, y: 23, w: 1, h: 1, solid: true, draw: (sx, sy) => drawPillar(sx, sy) });
  f.objs.push({ x: 17, y: 23, w: 1, h: 1, solid: true, draw: (sx, sy) => drawPillar(sx, sy) });
  f.triggers['15,23'] = f.triggers['16,23'] = () => fadeTo(() => setScene(LakeMapScene));
  // lamps & signs
  for (const [x, y] of [[12, 8], [19, 8], [12, 15], [19, 15]]) f.objs.push({ x, y, w: 1, h: 1, solid: true, draw: (sx, sy) => drawLamp(sx, sy) });
  const sign = (x, y, msg) => f.objs.push({ x, y, w: 1, h: 1, solid: true, draw: (sx, sy) => drawSign(sx, sy), interact: () => say(msg) });
  sign(14, 2, 'HOME PORTAL - Step in to return to your own world.');
  sign(14, 22, 'SOUTH GATE - The lakes lie beyond. Willow Pond, Crystal Lake, Misty Marsh and Moonfall Lake.');
  sign(17, 13, 'PRIZE WHEEL - $100 AC per spin. Jackpot: 1000 AC!');
  // flowers + trees (seeded)
  const r = seeded(42);
  const near = (x, y, d) => {
    for (let yy = y - d; yy <= y + d; yy++) for (let xx = x - d; xx <= x + d; xx++) {
      const t = f.tile(xx, yy); if (t === TL.PATH || t === TL.PLAZA || t === TL.WATER) return true;
      if (f.objAt(xx, yy)) return true;
    }
    return false;
  };
  for (let y = 1; y < f.h - 1; y++) for (let x = 1; x < f.w - 1; x++) {
    if (f.tile(x, y) !== TL.GRASS || f.objAt(x, y)) continue;
    const v = r();
    if (!near(x, y, 1) && v < 0.3) f.set(x, y, v < 0.08 ? TL.BUSH : TL.TREE);
    else if (v > 0.86) f.set(x, y, TL.FLOWER);
  }
  // NPCs
  f.addNPC('Mayor Finn', 13, 13, 'boy', { hair: '#e0e0e0', shirt: '#7a3a8a', pants: '#3a2a4a' }, [
    'The Prize Wheel in our plaza has made many a lucky angler rich!',
    'Aquarium World thrives thanks to anglers like you. Keep fishing!',
    'Sell your catch at the Fish Market, then spend it on gear. That is the angler life!'], 2);
  f.addNPC('Pip', 8, 12, 'boy', { hair: '#f0a020', shirt: '#40a040' }, [
    'When a fish bites, hold the button to lift the green bar. Keep the fish inside it!',
    'If the fish leaves the green bar, the catch meter drains. Do not let it hit zero!',
    'Bigger rods give you a bigger green bar. Way easier!'], 3);
  f.addNPC('Coral', 22, 12, 'girl', { hair: '#f070a0', shirt: '#f0f0f0', dress: '#40a0d0' }, [
    'The Fish Market pays 50% extra for the Fish of the Day!',
    'Better bait attracts bigger and rarer fish. Golden Lures are legendary.',
    'Have you put fish in your aquariums yet? Visitors pay to see them every day!'], 3);
  f.addNPC('Old Salt', 27, 10, 'boy', { hair: '#a0a0a0', shirt: '#3a5a8a', pants: '#2a2a3a' }, [
    'Rare fish show up more for lucky anglers. Hats and charms help with that.',
    'Cast far into deep water and you might hook something special...',
    'In my day we caught Marsh Leviathans with a bamboo stick! ...Well, almost.'], 2, { type: 'cap', color: '#28366a' });
  f.addNPC('Guard Rolf', 17, 22, 'boy', { hair: '#3a2a1a', shirt: '#8a8a9a', pants: '#3a3a4a' }, [
    'Through this gate lie the four lakes. Willow Pond is best for beginners.',
    'Moonfall Lake is no place for rookies. Train up before you go!',
    'Stay safe out there, angler.'], 0);
  f.addNPC('Nina', 9, 21, 'girl', { hair: '#5a3a2a', shirt: '#e8d040', dress: '#c06030' }, [
    'Your level matters! Higher level anglers react faster and reel stronger.',
    'Outfitters sells armor that makes the catch meter drain slower.',
    'I saw someone catch a Golden Koi at Willow Pond once. It shimmered like the sun!'], 3);
  f.addNPC('Tad', 17, 18, 'boy', { hair: '#202020', shirt: '#e04040' }, [
    'You can save anytime from the menu. Press ESC!',
    'The portal at the north end of town goes straight to your own world.',
    'A Fiberglass Rod is a cheap and great first upgrade!'], 2);
  return f;
}
function enterShop(kind, door) {
  sfx('door');
  const f = scene;
  autosave();
  pushUI(new ShopUI(kind, () => {
    sfx('door');
    f.player.tx = f.player.ox = door[0]; f.player.ty = f.player.oy = door[1] + 1;
    f.player.x = door[0] * TS; f.player.y = (door[1] + 1) * TS; f.player.dir = 'down'; f.player.moving = false;
    playSong('town');
    autosave();
  }));
}

// ---------------- Home world ----------------
const TANK_PLOTS = [[2, 5], [5, 5], [13, 5], [16, 5], [2, 9], [5, 9], [13, 9], [16, 9]];
const DECOR_SPOTS = [[1, 1], [4, 1], [14, 1], [17, 1], [2, 12], [16, 12]];
function buildHome() {
  const w = G.world, th = THEMES[w.theme];
  const f = new Field('home', 20, 15, th);
  f.label = w.name; f.song = 'home';
  for (let x = 0; x < f.w; x++) { f.set(x, 0, TL.TREE); f.set(x, f.h - 1, TL.TREE); }
  for (let y = 0; y < f.h; y++) { f.set(0, y, TL.TREE); f.set(f.w - 1, y, TL.TREE); }
  f.fill(10, 5, 10, 13, TL.PATH); f.fill(2, 8, 17, 8, TL.PATH);
  const r = seeded(7 + w.theme);
  for (let y = 1; y < f.h - 1; y++) for (let x = 1; x < f.w - 1; x++) if (f.tile(x, y) === TL.GRASS && r() < 0.12) f.set(x, y, TL.FLOWER);
  // house
  const himg = makeHouse(w.house, w.theme);
  f.objs.push({ x: 7, y: 1, w: 6, h: 4, solid: true, door: [10, 4], draw: (sx, sy) => ctx.drawImage(himg, sx, sy) });
  f.triggers['10,4'] = () => houseMenu();
  // portal
  f.objs.push({ x: 10, y: 13, w: 1, h: 1, solid: false, z: -40, draw: (sx, sy) => drawPortal(sx - 8, sy + 1) });
  f.triggers['10,13'] = () => ask('Travel through the portal to Aquarium World city?', ['Go', 'Stay'], k => { if (k === 0) warpTo('city'); });
  // flag & sign
  const flagCol = FLAG_COLORS[w.flag][1];
  f.objs.push({ x: 13, y: 3, w: 1, h: 1, solid: true, draw: (sx, sy) => drawFlag(sx, sy, flagCol) });
  f.objs.push({ x: 11, y: 6, w: 1, h: 1, solid: true, draw: (sx, sy) => drawSign(sx, sy), interact: () => worldInfo() });
  // tank plots
  TANK_PLOTS.forEach(([x, y], i) => {
    const t = w.tanks[i];
    f.objs.push({
      x, y, w: 2, h: 2, solid: true,
      draw: (sx, sy) => t ? drawTank(t.type, sx, sy, t.fish, i) : drawPlot(sx, sy),
      interact: () => t ? pushUI(new TankUI(i)) : say('An empty plot. Buy aquariums at the Tank Emporium in the city and they will appear here!'),
    });
  });
  // decor
  for (const id of w.decor) {
    const [x, y] = DECOR_SPOTS[DECOR[id].spot];
    f.objs.push({ x, y, w: 2, h: 2, solid: true, draw: (sx, sy) => drawDecor(id, sx, sy), interact: () => say('Your ' + DECOR[id].name + '. Visitors love it!') });
  }
  // visitors
  const inc = dailyIncome();
  const nVis = Math.min(6, Math.floor(inc / 20));
  const spots = [[4, 7], [15, 7], [8, 10], [12, 11], [3, 11], [17, 11]];
  const vlines = () => {
    const fish = w.tanks.flatMap(t => t.fish);
    const best = fish.sort((a, b) => b.value - a.value)[0];
    return [
      best ? 'Wow, look at that ' + FISH[best.id].name + '! Worth the ticket!' : 'Nice place you have here!',
      'What a lovely world. I will tell my friends about ' + w.name + '!',
      w.tanks.length ? 'I could watch these aquariums all day.' : 'Where are the aquariums?',
      'Ticket price is fair, I say!'];
  };
  for (let i = 0; i < nVis; i++) {
    const [x, y] = spots[i];
    const girl = i % 2 === 1;
    f.addNPC('Visitor', x, y, girl ? 'girl' : 'boy', { hair: pick(['#2a1a10', '#e0b040', '#b04030', '#4a4a4a', '#f0f0f0']), shirt: pick(['#e04848', '#40a0e0', '#60c060', '#e0a020', '#a060d0']), dress: pick(['#3070c0', '#c04070', '#40a060']) }, vlines, 2);
  }
  return f;
}
function houseMenu() {
  const f = HomeScene.field;
  const out = () => { const p = f.player; p.tx = p.ox = 10; p.ty = p.oy = 5; p.x = 160; p.y = 80; p.dir = 'down'; };
  sfx('door');
  pushUI(new MenuUI({
    x: 100, y: 60, w: 130, lh: 14, rows: 6, title: HOUSES[G.world.house].name,
    items: [
      { label: 'Rest & Save', action: () => { popUI(); out(); G.loc = { scene: 'home', x: 10, y: 5, dir: 'down' }; saveGame(); sfx('level'); say('You rest a while... You feel refreshed! (Saved to Slot ' + (curSlot + 1) + ')'); } },
      { label: 'World info', action: () => { popUI(); out(); worldInfo(); } },
      { label: 'Rename world', action: () => { popUI(); out(); pushUI(new NameEntry('Rename your world', G.world.name, 12, n => { G.world.name = n; rebuildHome(); toast('World renamed to ' + n); })); } },
      { label: 'Change theme', action: () => { popUI(); out(); themePicker(() => rebuildHome()); } },
      { label: 'Change flag', action: () => { popUI(); out(); flagPicker(() => rebuildHome()); } },
      { label: 'Leave', action: () => { popUI(); out(); } },
    ],
    onCancel: () => { popUI(); out(); },
  }));
}
function rebuildHome() {
  const p = HomeScene.field.player; const f = buildHome(); f.player = p; f.refreshPlayer(); HomeScene.field = f;
}
function themePicker(done, preview) {
  const orig = G.world.theme;
  const m = pushUI(new MenuUI({
    x: 180, y: 40, w: 130, lh: 14, rows: 4, title: 'World theme', sel: orig,
    items: THEMES.map((t, i) => ({ label: t.name, action: () => { G.world.theme = i; popUI(m); done(); } })),
    onMove: (it, i) => { G.world.theme = i; preview ? preview() : rebuildHome(); },
    onCancel: () => { G.world.theme = orig; popUI(m); preview ? preview() : rebuildHome(); done(true); },
  }));
}
function flagPicker(done, preview) {
  const orig = G.world.flag;
  const m = pushUI(new MenuUI({
    x: 180, y: 40, w: 130, lh: 14, rows: 6, title: 'Flag color', sel: orig,
    items: FLAG_COLORS.map(([n, c], i) => ({ label: n, color: c, action: () => { G.world.flag = i; popUI(m); done(); } })),
    onMove: (it, i) => { G.world.flag = i; preview ? preview() : rebuildHome(); },
    onCancel: () => { G.world.flag = orig; popUI(m); preview ? preview() : rebuildHome(); done(true); },
  }));
}
function worldInfo() {
  const w = G.world, fish = w.tanks.reduce((a, t) => a + t.fish.length, 0);
  say([w.name + ' - ' + THEMES[w.theme].name + '. Home: ' + HOUSES[w.house].name + '. Aquariums: ' + w.tanks.length + '/' + MAX_TANKS + ', fish on display: ' + fish + '. Decorations: ' + w.decor.length + '/' + Object.keys(DECOR).length + '.',
    'Visitors pay about $' + dailyIncome() + ' AC per day. Each fishing trip is one day. Display valuable fish in big tanks to earn more!']);
}
class TankUI {
  constructor(i) { this.i = i; this.build(0); }
  get tank() { return G.world.tanks[this.i]; }
  build(sel) {
    const t = this.tank, def = TANKS[t.type];
    const items = t.fish.map((f, k) => ({
      label: (f.rare ? '*' : '') + FISH[f.id].name, right: f.size + 'cm', color: f.rare ? '#ffe890' : '#fff',
      action: () => ask('Move the ' + FISH[f.id].name + ' back to your cooler?', ['Yes', 'No'], a => {
        if (a !== 0) return;
        if (G.cooler.length >= MAX_COOLER) { toast('Your cooler is full!', '#ffb0b0'); return; }
        t.fish.splice(k, 1); G.cooler.push(f); sfx('splash'); this.build(this.menu.sel);
      }),
    }));
    if (t.fish.length < def.cap) items.push({ label: '+ Add a fish', color: '#a8ffa8', action: () => this.add() });
    items.push({ label: 'Done', action: () => popUI(this) });
    this.menu = new Menu({ x: 8, y: 112, w: 180, rows: 9, items, sel: Math.min(sel, items.length - 1), title: def.name + ' ' + t.fish.length + '/' + def.cap, onCancel: () => popUI(this) });
  }
  add() {
    if (!G.cooler.length) { say('Your cooler is empty. Go catch some fish first!'); return; }
    const t = this.tank;
    const list = G.cooler.slice().sort((a, b) => b.value - a.value);
    const m = pushUI(new MenuUI({
      x: 120, y: 30, w: 190, rows: 12, title: 'Pick a fish',
      items: list.map(f => ({
        label: (f.rare ? '*' : '') + FISH[f.id].name, right: '$' + f.value, color: f.rare ? '#ffe890' : '#fff',
        action: () => { G.cooler.splice(G.cooler.indexOf(f), 1); t.fish.push(f); sfx('splash'); popUI(m); this.build(this.menu.sel); toast(FISH[f.id].name + ' added!', '#b0ffb0'); },
      })),
      onCancel: () => popUI(m),
    }));
  }
  update() { this.menu.update(); }
  draw() {
    drawWin(8, 8, 180, 100, 'dark');
    ctx.save(); ctx.translate(50, 10); ctx.scale(3, 3); drawTank(this.tank.type, 0, 0, this.tank.fish, this.i); ctx.restore();
    this.menu.draw(ui[ui.length - 1] === this);
    drawWin(192, 8, 122, 100);
    text('Daily visitors', 200, 16, '#a8b8f0'); text('$' + Math.round(tankIncome(this.tank)) + ' AC/day', 200, 28, '#ffe890');
    text('Bonus x' + TANKS[this.tank.type].mult, 200, 44);
    wrap('Fish on display earn ticket money every day but cannot be sold.', 19).forEach((l, i) => text(l, 200, 60 + i * 10, '#c8d0f0'));
  }
}

// ---------------- Scenes ----------------
const CityScene = {
  id: 'city',
  enter(x = 15, y = 3, dir = 'down') {
    if (!cityField) cityField = buildCity();
    cityField.place(x, y, dir); this.field = cityField; playSong('town');
    G.loc = { scene: 'city', x, y, dir };
    if (!G.flags.intro) {
      G.flags.intro = true; G.player.ac += 1000; // granted now so an autosave can't lose it
      setTimeout(() => cityIntro(), 0);
    }
  },
  update() { this.field.update(); },
  tick() { this.field.tickNPCs(); },
  draw() { this.field.draw(); },
  saveLoc() { this.field.saveLoc(); },
  get player() { return this.field.player; },
};
function cityIntro() {
  const n = G.player.name;
  say(['Welcome to Aquarium World, ' + n + '! I am Mayor Finn.',
    'Every new angler receives a gift from the city: 1,000 Aquarium Credits (AC)! Spend them wisely.'], () => {
    sfx('coin'); toast('+1,000 AC!', '#ffe890');
    say(['There are four shops in town: Bait & Tackle (rods and bait), the Tank Emporium (aquariums for your world), the Fish Market (sell your catch) and the Outfitters (clothes, armor and weapons).',
      'The Prize Wheel in the plaza costs 100 AC a spin. The South Gate leads to the lakes. The portal up north takes you home.',
      'Press ESC (or MENU) anytime to save, check items or warp home. Good luck, angler!'], null, 'Mayor Finn');
  }, 'Mayor Finn');
}
const HomeScene = {
  id: 'home',
  enter(x = 10, y = 12, dir = 'up') {
    this.field = buildHome(); this.field.place(x, y, dir); playSong('home');
    G.loc = { scene: 'home', x, y, dir };
    const days = Math.min(7, G.day - G.lastCollect), inc = dailyIncome();
    if (days > 0 && inc > 0) {
      G.lastCollect = G.day;
      const amt = inc * days;
      G.player.ac += amt; G.stats.earned += amt; // paid now so the arrival autosave includes it
      setTimeout(() => say('Welcome home! While you were away, visitors came to see your world. You earned $' + fmt(amt) + ' AC in ticket sales! (' + days + ' day' + (days > 1 ? 's' : '') + ')', () => sfx('coin')), 0);
    } else if (days > 0) G.lastCollect = G.day;
  },
  update() { this.field.update(); },
  tick() { this.field.tickNPCs(); },
  draw() { this.field.draw(); },
  saveLoc() { this.field.saveLoc(); },
};
function warpTo(where) {
  sfx('warp');
  fadeTo(() => {
    if (where === 'home') setScene(HomeScene, 10, 12, 'up');
    else setScene(CityScene, 15, 2, 'down');
  }, 0.04);
}
