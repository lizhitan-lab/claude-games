'use strict';
// ============ Scene management ============
let scene = null, fade = null;
let newSlot = 0;
const AUTOSAVE_SCENES = ['city', 'home', 'lakemap', 'fishing'];
function setScene(s, ...args) {
  scene = s; if (s.enter) s.enter(...args);
  if (G && AUTOSAVE_SCENES.includes(s.id)) autosave();
}
// saves silently and shows a small "Saved" badge in the corner
let autosaveT = 0;
function autosave() {
  if (!G) return;
  if (scene && scene.saveLoc) scene.saveLoc();
  if (saveGame()) autosaveT = 110;
}
function drawAutosave() {
  if (autosaveT <= 0) return;
  autosaveT--;
  if (autosaveT > 100 || (autosaveT < 30 && (autosaveT >> 2) % 2)) return;
  drawWin(4, H - 22, 58, 18, 'dark');
  const r = (T >> 3) % 4; rect(10, H - 16, 6, 6, '#80e0ff'); rect(11 + (r % 2) * 3, H - 15 + (r >> 1) * 3, 1, 1, '#101028');
  text('Saved', 20, H - 17, '#b0ffb0');
}
function fadeTo(fn, sp = 0.07) { if (fade) return; fade = { a: 0, d: 1, fn, sp }; }

// ============ Title ============
const TitleScene = {
  id: 'title',
  enter() {
    playSong('title');
    const ids = Object.keys(FISH).filter(k => !FISH[k].junk);
    this.fish = Array.from({ length: 9 }, (_, i) => ({ id: pick(ids), x: rnd(0, W), y: 120 + i * 12 + rnd(-4, 4), vx: rnd(0.2, 0.7) * (Math.random() < 0.5 ? -1 : 1) }));
    this.bub = Array.from({ length: 24 }, () => ({ x: rnd(0, W), y: rnd(0, H), s: rnd(0.3, 0.9) }));
    this.buildMenu();
    onSlotsChanged = () => { if (scene === TitleScene) this.buildMenu(); };
  },
  buildMenu() {
    const cont = hasSave();
    const start = i => {
      if (!loadGame(i)) { toast('Could not load that save!', '#ffb0b0'); return; }
      const l = G.loc || {};
      fadeTo(() => l.scene === 'home' ? setScene(HomeScene, l.x, l.y, l.dir) : setScene(CityScene, l.x ?? 15, l.y ?? 3, l.dir || 'down'));
    };
    const sel = this.menu ? this.menu.sel : (cont ? 0 : 1);
    this.menu = new Menu({
      x: 110, y: 120, w: 100, lh: 14, rows: 5, sel,
      items: [
        { label: 'Continue', disabled: !cont, why: 'No saved game yet.', action: () => start(latestSlot()) },
        { label: 'New Game', action: () => pushUI(new SlotUI('new', i => { newSlot = i; fadeTo(() => setScene(CharSelectScene)); })) },
        { label: 'Load Game', disabled: !cont, why: 'No saved game yet.', action: () => pushUI(new SlotUI('load', start)) },
        { label: 'Backup', action: () => pushUI(new BackupUI(() => this.buildMenu())) },
        { label: soundLabel(), action: it => { cycleSound(); it.label = soundLabel(); } },
      ],
    });
  },
  update() { this.menu.update(); },
  tick() {
    for (const f of this.fish) { f.x += f.vx; if (f.x < -40) f.x = W + 30; if (f.x > W + 40) f.x = -30; }
    for (const b of this.bub) { b.y -= b.s; b.x += Math.sin((T + b.y) / 20) * 0.2; if (b.y < -4) { b.y = H + 4; b.x = rnd(0, W); } }
  },
  draw() {
    for (let y = 0; y < H; y += 4) rect(0, y, W, 4, mix('#1a6ab8', '#081838', y / H));
    for (let i = 0; i < 5; i++) { ctx.fillStyle = 'rgba(180,230,255,0.06)'; const x = (i * 80 + T * 0.1) % 400 - 60; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x + 90, H); ctx.lineTo(x + 40, H); ctx.fill(); }
    for (const f of this.fish) { const img = fishSprite(f.id, f.vx > 0); ctx.drawImage(img, Math.round(f.x), Math.round(f.y + Math.sin((T + f.y * 3) / 25) * 2)); }
    rect(0, H - 14, W, 14, '#c8b070'); rect(0, H - 14, W, 2, '#e8d49a');
    for (let x = 6; x < W; x += 22) for (let k = 0; k < 18; k += 2) rect(x + Math.round(Math.sin((T / 20) + k / 4 + x) * 2), H - 14 - k, 2, 2, '#2a8a4a');
    for (const b of this.bub) pring(b.x, b.y, 1.5, 1.5, 'rgba(220,240,255,0.7)');
    const bob = Math.round(Math.sin(T / 30) * 3);
    textBig('AQUARIUM', 160 - 26 * 3 + 6, 34 + bob, 3, '#7ae0ff', '#082040');
    textBig('WORLD', 160 - 16 * 3 + 4, 70 + bob, 3, '#ffe060', '#3a2008');
    textC('A pixel fishing adventure', 160, 108, '#c8e8ff');
    this.menu.draw(!ui.length);
    textC(saveStatusLine(), 160, 202, saveStatus === 'cloud' ? '#a8ffa8' : '#c8e8ff', '#081838');
    textC('Arrows/WASD move - Z/Enter OK - X back - Esc menu', 160, 214, '#8fb0e0', '#081838');
  },
};

// ============ Character select ============
const CharSelectScene = {
  id: 'charsel',
  enter() { this.sel = 0; playSong('title'); },
  update() {
    if (inp.pressed.left || inp.pressed.right) { this.sel = 1 - this.sel; sfx('blip'); }
    if (inp.pressed.a) {
      sfx('ok');
      const g = this.sel ? 'girl' : 'boy';
      pushUI(new NameEntry('Name your ' + g, g === 'boy' ? 'Kai' : 'Mia', 10, n => {
        newGame(g, n); curSlot = newSlot;
        fadeTo(() => setScene(WorldCreateScene));
      }));
    }
    if (inp.pressed.b) { sfx('cancel'); fadeTo(() => setScene(TitleScene)); }
  },
  tick() {},
  draw() {
    for (let y = 0; y < H; y += 4) rect(0, y, W, 4, mix('#2a4a9a', '#0a1430', y / H));
    textBig('CHOOSE YOUR ANGLER', 160 - 18 * 6 - 1, 18, 2, '#ffe890');
    const opts = [['boy', 'BOY', { hair: '#4a2a18', shirt: '#3070d0', pants: '#2c3458' }], ['girl', 'GIRL', { hair: '#b04060', shirt: '#f4f4f4', dress: '#e04878', ribbon: '#40c0e0', shoes: '#803040' }]];
    opts.forEach(([t, lab, col], i) => {
      const cx = 100 + i * 120, sel = this.sel === i;
      hit(cx - 50, 70, 100, 120, () => { if (this.sel === i) tapA(); else { this.sel = i; sfx('blip'); } });
      pellipse(cx, 160, 38, 9, sel ? '#f0c040' : '#3a4a7a'); pellipse(cx, 158, 36, 8, sel ? '#ffe890' : '#56679a');
      if (sel) for (let k = 0; k < 8; k++) { const a = T / 20 + k * 0.785; rect(cx + Math.cos(a) * 44, 110 + Math.sin(a) * 40, 2, 2, '#fff8c0'); }
      const s = charSprites(t, col), spr = sel ? s.down[WALKSEQ[(T >> 3) % 4]] : s.down[0];
      ctx.globalAlpha = sel ? 1 : 0.55;
      ctx.drawImage(spr, cx - 36, 84, spr.width * 4, spr.height * 4);
      ctx.globalAlpha = 1;
      textBig(lab, cx - tw(lab), 172, 2, sel ? '#ffe890' : '#8890b0');
      if (sel) drawCursor(cx - tw(lab) - 14, 177);
    });
    textC('Tap a character, then tap again to confirm', 160, 214, '#c8d0f0');
    btn(4, 4, 40, 16, 'Back', () => { inp.pressed.b = true; });
  },
};

// ============ World creation ============
const WorldCreateScene = {
  id: 'worldcreate',
  enter() {
    playSong('home');
    this.preview();
    say(['Every angler in Aquarium World owns a little world of their very own.', "Let's create yours! You can rename and customize it later at your house."], () => this.step1(), 'Guide');
  },
  preview() { this.field = buildHome(); this.field.place(10, 8, 'down'); this.field.noHud = true; },
  step1() { pushUI(new NameEntry('Name your world', G.world.name, 12, n => { G.world.name = n; this.preview(); this.step2(); })); },
  step2() { say('Choose a theme for ' + G.world.name + '.', () => themePicker(() => this.step3(), () => this.preview()), 'Guide'); },
  step3() { say('Now pick the color of your world flag.', () => flagPicker(() => this.step4(), () => this.preview()), 'Guide'); },
  step4() {
    ask('Create the world "' + G.world.name + '" (' + THEMES[G.world.theme].name + ')?', ['Create!', 'Start over'], k => {
      if (k !== 0) { this.step1(); return; }
      sfx('level');
      say(['Your world ' + G.world.name + ' has been created! It is small now, but you can grow it with aquariums, decorations and a bigger home.',
        'Now, a shimmering portal whisks you away to the bustling city of Aquarium World...'], () => {
        sfx('warp');
        fadeTo(() => setScene(CityScene, 15, 3, 'down'), 0.03);
      }, 'Guide');
    }, 'Guide');
  },
  update() {},
  tick() {},
  draw() {
    this.field.draw();
    drawWin(4, 4, 140, 18, 'dark'); text('Creating: ' + G.world.name, 10, 9, '#80e0ff');
  },
};

// ============ Main loop ============
try { const s = JSON.parse(localStorage.getItem('aquariumWorldSound')); if (s) { soundOn = s[0]; musicOn = s[1]; } } catch (e) {}
function frame() {
  musicTick();
  if (fade) {
    fade.a += fade.d * fade.sp;
    pendingTap = null;
    if (fade.d === 1 && fade.a >= 1) { fade.a = 1; ui.length = 0; closeNameInput(); fade.fn(); fade.d = -1; }
    else if (fade.d === -1 && fade.a <= 0) fade = null;
  } else {
    processTap(() => {
      const top = ui[ui.length - 1];
      if (top) { if (top.tapAnywhere) tapA(); }
      else if (scene.id === 'fishing') holdA();
      else if (scene.field) tapA(); // talk / interact with what you face
    });
    if (ui.length) ui[ui.length - 1].update();
    else scene.update();
  }
  if (scene.tick && (!ui.length || scene.id === 'fishing' || scene.id === 'title')) scene.tick();
  hits.length = 0;
  scene.draw();
  ui.forEach((u, i) => { if (i === ui.length - 1) hits.length = 0; u.draw(); }); // only the top window takes taps
  drawToasts();
  drawAutosave();
  overlaysEndFrame();
  if (fade) { ctx.fillStyle = `rgba(0,0,0,${clamp(fade.a, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
  inputEndFrame();
  T++;
}
let last = performance.now(), acc = 0;
function loop(now) {
  acc += Math.min(100, now - last); last = now;
  let n = 0;
  while (acc >= 1000 / 60 && n < 4) { frame(); acc -= 1000 / 60; n++; }
  requestAnimationFrame(loop);
}
initSaves();
// installed-app support: cache the game for offline play (only on a real web address, not inside claude.ai)
if ('serviceWorker' in navigator && window.top === window && !window.claude &&
    (location.protocol === 'https:' || location.hostname === 'localhost')) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) toast('Update installed! Reopen the game to play it.', '#b0ffb0');
  });
}
setScene(TitleScene);
requestAnimationFrame(loop);
