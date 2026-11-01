'use strict';
// ============ UI stack ============
const ui = [];
function pushUI(u) { ui.push(u); return u; }
function popUI(u) { const i = u ? ui.lastIndexOf(u) : ui.length - 1; if (i >= 0) ui.splice(i, 1); }
const toasts = [];
function toast(msg, col = '#fff') { toasts.push({ msg, t: 150, col }); if (toasts.length > 3) toasts.shift(); }
function drawToasts() {
  toasts.forEach((t, i) => {
    t.t--;
    const w = tw(t.msg) + 16, x = W / 2 - w / 2, y = 6 + i * 20;
    drawWin(x, y, w, 18, 'dark'); textC(t.msg, W / 2, y + 6, t.col);
  });
  for (let i = toasts.length - 1; i >= 0; i--) if (toasts[i].t <= 0) toasts.splice(i, 1);
}

// ============ Menu ============
class Menu {
  constructor(o) {
    Object.assign(this, { x: 8, y: 8, w: 120, items: [], sel: 0, top: 0, rows: 8, lh: 12, title: null, onCancel: null, onMove: null, style: 'blue', active: true }, o);
    if (this.sel >= this.items.length) this.sel = Math.max(0, this.items.length - 1);
    this.skip(1); this.fixScroll();
  }
  get h() { return Math.min(this.rows, this.items.length) * this.lh + 12 + (this.title ? 12 : 0) - (this.lh - 10); }
  cur() { return this.items[this.sel]; }
  skip(d) { const n = this.items.length; let k = 0; while (n && this.items[this.sel].sep && k++ < n) this.sel = (this.sel + d + n) % n; }
  fixScroll() { if (this.sel < this.top) this.top = this.sel; if (this.sel >= this.top + this.rows) this.top = this.sel - this.rows + 1; if (this.top > 0 && this.items[this.top - 1] && this.items[this.top - 1].sep && this.sel - this.top + 1 < this.rows) this.top--; }
  update() {
    const n = this.items.length;
    if (n) {
      let d = 0;
      if (inp.rep('down')) d = 1; else if (inp.rep('up')) d = -1;
      if (d) { this.sel = (this.sel + d + n) % n; this.skip(d); this.fixScroll(); sfx('blip'); this.onMove && this.onMove(this.cur(), this.sel); }
      if (inp.pressed.a) {
        const it = this.cur();
        if (it.disabled) { sfx('err'); if (it.why) toast(it.why, '#ffb0b0'); }
        else if (it.action) { sfx('ok'); it.action(it, this.sel); }
        return;
      }
    }
    if ((inp.pressed.b || inp.pressed.menu) && this.onCancel) { sfx('cancel'); this.onCancel(); }
  }
  draw(isTop = true) {
    const { x, y, w } = this, h = this.h;
    drawWin(x, y, w, h, this.style);
    let ty = y + 7;
    if (this.title) { text(this.title, x + 8, ty, '#ffe890'); ty += 12; }
    for (let i = this.top; i < Math.min(this.items.length, this.top + this.rows); i++) {
      const it = this.items[i];
      if (it.sep) {
        rect(x + 8, ty + 3, w - 16, 1, '#8090d0');
        const lw = tw(it.label) + 6; rect(x + w / 2 - lw / 2, ty, lw, 8, mix('#4868c8', '#141c60', clamp((ty - y) / h, 0, 1)));
        textC(it.label, x + w / 2, ty, '#a8b8f0');
      } else {
        const c = it.disabled ? '#8890b0' : (it.color || '#fff');
        text(it.label, x + 16, ty, c);
        if (it.right != null) textR(it.right, x + w - 8, ty, it.rc || (it.disabled ? '#8890b0' : '#d8e0ff'));
        if (isTop && this.active) { const k = i; hit(x, ty - Math.floor((this.lh - 7) / 2), w, this.lh, () => { this.sel = k; this.onMove && this.onMove(this.cur(), k); tapA(); }); }
        if (i === this.sel && this.active && isTop) drawCursor(x + 6, ty);
        else if (i === this.sel && this.active) rect(x + 7, ty + 3, 3, 2, '#c0c8e0');
      }
      ty += this.lh;
    }
    if (this.top > 0) { text('^', x + w - 12, y + 2, '#ffe890'); if (isTop) hit(x + w - 24, y - 6, 28, 16, () => this.scroll(-1)); }
    if (this.top + this.rows < this.items.length) { text('|', x + w - 12, y + h - 9, '#ffe890'); if (isTop) hit(x + w - 24, y + h - 12, 28, 16, () => this.scroll(1)); }
  }
  scroll(d) {
    const n = this.items.length;
    this.top = clamp(this.top + d * Math.max(1, this.rows - 1), 0, Math.max(0, n - this.rows));
    this.sel = clamp(this.sel, this.top, Math.min(n - 1, this.top + this.rows - 1));
    this.skip(d >= 0 ? 1 : -1); sfx('blip'); this.onMove && this.onMove(this.cur(), this.sel);
  }
}
// generic wrapper so a bare Menu can be pushed on the stack
class MenuUI {
  constructor(o, drawExtra) { this.menu = new Menu(o); this.extra = drawExtra; }
  update() { this.menu.update(); }
  draw() { this.menu.draw(ui[ui.length - 1] === this); if (this.extra) this.extra(this.menu); }
}

// ============ Dialog ============
class Dialog {
  constructor(msgs, cb, speaker) {
    this.pages = [];
    for (const m of msgs) { const ls = wrap(m, 47); for (let i = 0; i < ls.length; i += 3) this.pages.push(ls.slice(i, i + 3)); }
    this.pi = 0; this.ch = 0; this.cb = cb; this.speaker = speaker; this.tapAnywhere = true;
  }
  get total() { return this.pages[this.pi].join('').length; }
  update() {
    if (this.ch < this.total) {
      this.ch += 1.5;
      if (inp.pressed.a || inp.pressed.b) this.ch = this.total;
    } else if (inp.pressed.a || inp.pressed.b) {
      this.pi++; this.ch = 0; sfx('blip');
      if (this.pi >= this.pages.length) { popUI(this); if (this.cb) this.cb(); }
    }
  }
  draw() { drawDialogBox(this.pages[Math.min(this.pi, this.pages.length - 1)], this.ch, this.speaker, this.ch >= this.total); }
}
function drawDialogBox(lines, ch, speaker, done) {
  const x = 6, y = 172, w = 308, h = 62;
  if (speaker) { drawWin(x + 4, y - 15, tw(speaker) + 16, 18); text(speaker, x + 12, y - 10, '#ffe890'); }
  drawWin(x, y, w, h);
  let left = ch;
  lines.forEach((l, i) => {
    const s = l.slice(0, Math.max(0, Math.floor(left))); left -= l.length;
    text(s, x + 10, y + 10 + i * 14);
  });
  if (done && (T >> 4) % 2) { rect(x + w - 16, y + h - 12, 7, 2, '#fff'); rect(x + w - 15, y + h - 10, 5, 1, '#fff'); rect(x + w - 14, y + h - 9, 3, 1, '#fff'); }
}
function closeNameInput() {
  textHandler = null; nameInput.oninput = nameInput.onkeydown = null;
  nameInput.blur(); nameInput.style.display = 'none';
}
// a small labelled button that can be tapped
function btn(x, y, w, h, label, fn, col = '#fff') {
  drawWin(x, y, w, h, 'dark'); textC(label, x + w / 2, y + Math.round(h / 2) - 4, col);
  hit(x, y, w, h, fn);
}
function say(msgs, cb, speaker) { return pushUI(new Dialog(Array.isArray(msgs) ? msgs : [msgs], cb, speaker)); }

class Ask {
  constructor(q, opts, cb, speaker) {
    this.lines = wrap(q, 47).slice(0, 3); this.ch = 0; this.speaker = speaker; this.cb = cb;
    const w = Math.max(...opts.map(o => tw(o))) + 30;
    this.menu = new Menu({
      x: 314 - w, y: 0, w, lh: 12, rows: 6,
      items: opts.map((o, i) => ({ label: o, action: () => { popUI(this); cb && cb(i); } })),
      onCancel: () => { popUI(this); cb && cb(opts.length - 1); },
    });
    this.menu.y = 170 - this.menu.h;
  }
  get total() { return this.lines.join('').length; }
  get tapAnywhere() { return this.ch < this.total; }
  update() {
    if (this.ch < this.total) { this.ch += 2; if (inp.pressed.a) this.ch = this.total; return; }
    this.menu.update();
  }
  draw() { drawDialogBox(this.lines, this.ch, this.speaker, false); if (this.ch >= this.total) this.menu.draw(ui[ui.length - 1] === this); }
}
function ask(q, opts, cb, speaker) { return pushUI(new Ask(q, opts, cb, speaker)); }

// ============ Name entry ============
class NameEntry {
  constructor(title, def, max, cb) {
    this.title = title; this.name = def; this.max = max; this.cb = cb;
    this.grid = ['ABCDEFGHIJKLM', 'NOPQRSTUVWXYZ', 'abcdefghijklm', 'nopqrstuvwxyz', "0123456789-'!"];
    this.r = 0; this.c = 0;
    nameInput.value = def; nameInput.maxLength = max; nameInput.style.display = 'block';
    nameInput.oninput = () => {
      const v = [...nameInput.value].filter(ch => charIndex[ch] !== undefined).join('').slice(0, max);
      if (v !== nameInput.value) nameInput.value = v;
      this.name = v;
    };
    nameInput.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); this.done(); } };
    if (document.body.classList.contains('touch')) { try { nameInput.focus(); } catch (e) {} }
    textHandler = e => {
      if (e.key === 'Enter') { this.done(); return true; }
      if (e.key === 'Backspace') { this.name = this.name.slice(0, -1); sfx('cancel'); return true; }
      if (e.key.length === 1 && (charIndex[e.key] !== undefined) && !e.ctrlKey && !e.metaKey) {
        if (this.name.length < this.max) { this.name += e.key; sfx('blip'); } return true;
      }
      return false;
    };
  }
  done() {
    const n = this.name.trim();
    if (!n.length) { sfx('err'); toast('Please enter a name!'); return; }
    sfx('ok'); closeNameInput(); popUI(this); this.cb(n);
  }
  update() {
    if (document.activeElement !== nameInput && nameInput.value !== this.name) nameInput.value = this.name;
    const rows = this.grid.length + 1;
    if (inp.rep('down')) { this.r = (this.r + 1) % rows; sfx('blip'); }
    if (inp.rep('up')) { this.r = (this.r - 1 + rows) % rows; sfx('blip'); }
    const cols = this.r < this.grid.length ? 13 : 3;
    if (this.r === this.grid.length) this.c = Math.min(this.c, 2);
    if (inp.rep('right')) { this.c = (this.c + 1) % cols; sfx('blip'); }
    if (inp.rep('left')) { this.c = (this.c - 1 + cols) % cols; sfx('blip'); }
    if (this.r === this.grid.length) this.c = Math.min(this.c, 2);
    if (inp.pressed.a) {
      if (this.r < this.grid.length) { if (this.name.length < this.max) { this.name += this.grid[this.r][this.c]; sfx('blip'); } else sfx('err'); }
      else if (this.c === 0) { if (this.name.length < this.max) this.name += ' '; }
      else if (this.c === 1) { this.name = this.name.slice(0, -1); sfx('cancel'); }
      else this.done();
    }
    if (inp.pressed.b) { this.name = this.name.slice(0, -1); sfx('cancel'); }
  }
  draw() {
    drawWin(30, 24, 260, 196);
    textC(this.title, 160, 34, '#ffe890');
    rect(70, 50, 180, 18, '#0c1238');
    // lay the real text box over the name field so tapping it opens the phone keyboard
    const cr = cv.getBoundingClientRect(), sx = cr.width / W, sy = cr.height / H;
    Object.assign(nameInput.style, { left: cr.left + 70 * sx + 'px', top: cr.top + 50 * sy + 'px', width: 180 * sx + 'px', height: 18 * sy + 'px' });
    if (document.activeElement === nameInput) { rect(70, 50, 180, 1, '#ffe890'); rect(70, 67, 180, 1, '#ffe890'); }
    const s = this.name + ((T >> 4) % 2 && this.name.length < this.max ? '_' : ' ');
    textC(s, 160, 56);
    for (let i = 0; i < this.max; i++) rect(160 - this.max * 3 + i * 6, 65, 5, 1, '#6a78c0');
    this.grid.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        const x = 52 + c * 17, y = 82 + r * 18;
        text(row[c], x, y, r === this.r && c === this.c ? '#ffe890' : '#fff');
        { const rr = r, cc = c; hit(x - 6, y - 5, 17, 18, () => { this.r = rr; this.c = cc; tapA(); }); }
        if (r === this.r && c === this.c) drawCursor(x - 9, y);
      }
    });
    ['SPACE', 'DEL', 'DONE'].forEach((l, i) => {
      const x = 62 + i * 76, y = 178;
      text(l, x, y, this.r === this.grid.length && this.c === i ? '#ffe890' : '#c8d0f0');
      hit(x - 12, y - 6, 60, 20, () => { this.r = this.grid.length; this.c = i; tapA(); });
      if (this.r === this.grid.length && this.c === i) drawCursor(x - 9, y);
    });
    textC(document.body.classList.contains('touch') ? 'Tap the box above to use your keyboard' : 'Type on keyboard or pick letters. Enter = done', 160, 202, '#8898d0', null);
  }
}

// ============ Main menu ============
function soundLabel() { return soundOn ? (musicOn ? 'Sound:All' : 'Sound:SFX') : 'Sound:Off'; }
function cycleSound() {
  if (soundOn && musicOn) musicOn = false; else if (soundOn) soundOn = false; else { soundOn = true; musicOn = true; }
  try { localStorage.setItem('aquariumWorldSound', JSON.stringify([soundOn, musicOn])); } catch (e) {}
}
function doSave(i = curSlot) {
  if (scene && scene.saveLoc) scene.saveLoc();
  if (saveGame(i)) { sfx('coin'); toast('Saved to Slot ' + (i + 1) + '!', '#b0ffb0'); } else { sfx('err'); toast('Save failed!', '#ffb0b0'); }
}
function saveStatusLine() {
  if (saveStatus === 'blocked') return 'Saving is blocked here: use Backup!';
  return saveStatus === 'cloud' ? 'Saves are kept in your claude.ai account'
    : saveStatus === 'checking' ? 'Connecting to your saves...' : 'Saves are kept in this browser only';
}
// ============ Save files (backup / move between devices) ============
const fileInput = document.getElementById('fileInput'), exportBtn = document.getElementById('exportBtn');
function exportSlot(i) {
  const s = slots[i];
  if (!s) { sfx('err'); toast('Slot ' + (i + 1) + ' is empty.', '#ffb0b0'); return; }
  const json = JSON.stringify({ game: 'aquarium-world', version: 1, exportedAt: Date.now(), save: s });
  const name = 'aquarium-world-slot' + (i + 1) + '-' + String(s.player.name).replace(/[^A-Za-z0-9_-]/g, '') + '.json';
  if (window.claude && typeof window.claude.use === 'function') { // inside claude.ai: downloads go through the viewer
    claude.use('downloads').then(dl => {
      if (!dl) { toast('Saving files is not available here.', '#ffb0b0'); return; }
      dl.save({ filename: name, data: json }).then(() => toast('Save file ready!', '#b0ffb0'), () => toast('Save file cancelled.'));
    });
    return;
  }
  const file = new File([json], name, { type: 'application/json' });
  const touch = document.body.classList.contains('touch');
  if (touch && navigator.canShare && navigator.canShare({ files: [file] })) { // phones: share sheet -> "Save to Files"
    navigator.share({ files: [file], title: 'Aquarium World save' }).then(() => toast('Save file shared!', '#b0ffb0'), () => {});
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  toast('Save file downloaded!', '#b0ffb0');
}
function importIntoSlot(i, file, done) {
  const r = new FileReader();
  r.onload = () => {
    let s = null;
    try { const d = JSON.parse(r.result); s = d && d.save ? d.save : d; } catch (e) {}
    if (!s || !s.player || !s.world || !s.player.name) { sfx('err'); toast("That file isn't an Aquarium World save.", '#ffb0b0'); return; }
    const put = () => {
      s.savedAt = Date.now(); slots[i] = s;
      const json = JSON.stringify(s); lsSet(slotKey(i), json); cloudWrite(i, json);
      sfx('coin'); toast(s.player.name + ' loaded into Slot ' + (i + 1) + '!', '#b0ffb0'); done && done();
    };
    const m = slotSummary(slots[i]);
    if (m) ask('Replace ' + m.name + ' (Lv ' + m.level + ') in Slot ' + (i + 1) + ' with ' + s.player.name + ' (Lv ' + s.player.level + ')?', ['Replace', 'Cancel'], k => { if (k === 0) put(); });
    else put();
  };
  r.readAsText(file);
}
class BackupUI {
  constructor(onDone) {
    this.onDone = onDone; this.slot = Math.max(0, latestSlot()); this.build(this.slot);
    exportBtn.onclick = () => { sfx('ok'); exportSlot(this.slot); };
    fileInput.onchange = () => { const f = fileInput.files && fileInput.files[0]; fileInput.value = ''; if (f) importIntoSlot(this.slot, f, () => { this.build(this.menu.sel); this.onDone && this.onDone(); }); };
  }
  close() { exportBtn.onclick = fileInput.onchange = null; popUI(this); this.onDone && this.onDone(); }
  build(sel) {
    const items = slots.map((s, i) => {
      const m = slotSummary(s);
      return { label: (this.slot === i ? '> ' : '  ') + 'Slot ' + (i + 1) + '  ' + (m ? m.name + ' Lv' + m.level : '- empty -'), right: m ? 'Day ' + m.day : '', action: () => { this.slot = i; this.build(i); } };
    });
    items.push({ label: 'Save slot ' + (this.slot + 1) + ' to a file', color: '#a8ffa8', action: () => exportSlot(this.slot) });
    items.push({ label: 'Load a file into slot ' + (this.slot + 1), color: '#a8ffa8', action: () => fileInput.click() });
    items.push({ label: 'Back', action: () => this.close() });
    this.menu = new Menu({ x: 30, y: 24, w: 260, rows: 6, lh: 15, title: 'Backup saves', items, sel: Math.min(sel, items.length - 1), onCancel: () => this.close() });
  }
  update() { this.menu.update(); }
  draw() {
    ctx.fillStyle = 'rgba(0,0,20,0.6)'; ctx.fillRect(0, 0, W, H);
    const top = ui[ui.length - 1] === this;
    this.menu.draw(top);
    if (top) { // the two file rows are real buttons underneath, so taps open the picker / share sheet
      const rowY = k => this.menu.y + 7 + 12 + (k - this.menu.top) * this.menu.lh - 4;
      overlayAt(exportBtn, this.menu.x, rowY(3), this.menu.w, this.menu.lh);
      overlayAt(fileInput, this.menu.x, rowY(4), this.menu.w, this.menu.lh);
    }
    const y = this.menu.y + this.menu.h + 6;
    drawWin(30, y, 260, 64);
    wrap('Save a slot to a file to keep a backup or move it to another device. Load the file there to continue playing.', 41)
      .forEach((l, i) => text(l, 40, y + 9 + i * 12, '#c8d0f0'));
  }
}

// pick a save slot. mode: 'load' | 'new' | 'save'
class SlotUI {
  constructor(mode, cb) {
    this.mode = mode; this.cb = cb;
    const empty = slots.findIndex(x => !x);
    this.build(mode === 'load' ? Math.max(0, latestSlot()) : mode === 'new' ? Math.max(0, empty) : curSlot);
    this.prevHook = onSlotsChanged;
    onSlotsChanged = () => { this.prevHook(); this.build(this.menu.sel); };
  }
  close() { onSlotsChanged = this.prevHook; popUI(this); }
  build(sel) {
    const title = { load: 'Load which slot?', new: 'Start in which slot?', save: 'Save to which slot?' }[this.mode];
    const items = slots.map((s, i) => {
      const m = slotSummary(s);
      return {
        label: 'Slot ' + (i + 1) + '  ' + (m ? m.name + ' Lv' + m.level : '- empty -'),
        right: m ? 'Day ' + m.day : '', color: m ? '#fff' : '#a8b0d0',
        disabled: this.mode === 'load' && !m, why: 'This slot is empty.',
        action: () => {
          const go = () => { this.close(); this.cb(i); };
          if (this.mode !== 'load' && m && !(this.mode === 'save' && i === curSlot))
            ask('Slot ' + (i + 1) + ' has ' + m.name + ' (Lv ' + m.level + '). Replace it?', ['Replace', 'Cancel'], k => { if (k === 0) go(); });
          else go();
        },
      };
    });
    items.push({ label: 'Back', action: () => this.close() });
    this.menu = new Menu({ x: 30, y: 30, w: 260, rows: 4, lh: 16, title, items, sel: Math.min(sel, items.length - 1), onCancel: () => this.close() });
  }
  update() { this.menu.update(); }
  draw() {
    ctx.fillStyle = 'rgba(0,0,20,0.55)'; ctx.fillRect(0, 0, W, H);
    this.menu.draw(ui[ui.length - 1] === this);
    const i = this.menu.sel, m = i < SLOT_COUNT ? slotSummary(slots[i]) : null;
    const y = this.menu.y + this.menu.h + 6;
    drawWin(30, y, 260, 74);
    if (m) {
      text(m.name + '   Lv ' + m.level + '   Day ' + m.day, 40, y + 10, '#ffe890');
      text('$ ' + fmt(m.ac) + ' AC   Fish caught ' + m.caught, 40, y + 24);
      text('At: ' + m.where, 40, y + 38, '#80e0ff');
      if (m.when) text('Saved ' + m.when + (i === curSlot && G ? '  (current)' : ''), 40, y + 52, '#a8b8f0');
    } else if (i < SLOT_COUNT) textC(this.mode === 'load' ? 'Nothing saved here yet.' : 'A fresh slot for a new adventure.', 160, y + 30, '#a8b0d0');
    textC(saveStatusLine(), 160, y + 82, saveStatus === 'cloud' ? '#a8ffa8' : saveStatus === 'blocked' ? '#ff9090' : '#c8d0f0', '#101028');
  }
}
class MainMenu {
  constructor() {
    const where = scene.id;
    const it = [
      { label: 'Items', action: () => pushUI(new ItemsUI()) },
      { label: 'Equip', action: () => pushUI(new EquipUI()) },
      { label: 'Cooler', action: () => pushUI(new CoolerUI()) },
      { label: 'Fish Log', action: () => pushUI(new LogUI()) },
      { label: 'Save', action: () => pushUI(new SlotUI('save', i => doSave(i))) },
      { label: where === 'home' ? 'To City' : 'Go Home', action: () => { popUI(this); if (where === 'fishing') G.day++; warpTo(where === 'home' ? 'city' : 'home'); } },
      { label: soundLabel(), action: i => { cycleSound(); i.label = soundLabel(); } },
      { label: 'Title', action: () => ask('Return to the title screen? Unsaved progress will be lost.', ['Yes', 'No'], k => { if (k === 0) { ui.length = 0; fadeTo(() => setScene(TitleScene)); } }) },
      { label: 'Close', action: () => popUI(this) },
    ];
    this.menu = new Menu({ x: 226, y: 8, w: 88, lh: 15, rows: 12, items: it, onCancel: () => popUI(this) });
  }
  update() { this.menu.update(); }
  draw() {
    drawStatusPanel(6, 8, 216, 224);
    this.menu.draw(ui[ui.length - 1] === this);
    drawWin(226, 164, 88, 68);
    text('DAY', 234, 172, '#a8b8f0'); textR(G.day, 306, 172);
    text('$', 234, 186, '#ffd040'); textR(fmt(G.player.ac), 306, 186, '#ffe890');
    text('FISH', 234, 200, '#a8b8f0'); textR(G.cooler.length + '/' + MAX_COOLER, 306, 200);
    text(scene.id === 'home' ? 'HOME' : scene.id === 'city' ? 'CITY' : 'LAKES', 234, 214, '#80e0ff');
  }
}
function drawStatusPanel(x, y, w, h) {
  const p = G.player, st = stats();
  drawWin(x, y, w, h);
  rect(x + 8, y + 8, 60, 60, '#0c1238');
  const spr = playerSprites().down[WALKSEQ[(T >> 4) % 4]];
  ctx.drawImage(spr, x + 11, y + 10, spr.width * 3, spr.height * 3);
  text(p.name, x + 76, y + 10, '#ffe890');
  text('Lv ' + p.level, x + 76, y + 24);
  const need = xpNeed(p.level);
  text('XP', x + 76, y + 38, '#a8b8f0'); bar(x + 94, y + 39, 80, 5, p.level >= MAX_LEVEL ? 1 : p.xp / need, '#60e0a0');
  textR(p.level >= MAX_LEVEL ? 'MAX' : p.xp + '/' + need, x + w - 8, y + 48, '#c8d0f0');
  text('$ ' + fmt(p.ac) + ' AC', x + 76, y + 58, '#ffe890');
  let yy = y + 80;
  const line = (a, b, c = '#fff') => { text(a, x + 10, yy, '#a8b8f0'); text(b, x + 64, yy, c); yy += 12; };
  line('Rod', RODS[p.rod].name);
  line('Bait', p.bait && p.baits[p.bait] > 0 ? BAITS[p.bait].name + ' x' + p.baits[p.bait] : 'None');
  for (const [s, n] of SLOTS) line(n, p.equip[s] ? GEAR[p.equip[s]].name : '-', p.equip[s] ? '#fff' : '#8890b0');
  yy += 4;
  const sx = [['POWER', st.power + RODS[p.rod].power], ['FOCUS', st.focus], ['STAMINA', st.stamina], ['LUCK', st.luck]];
  sx.forEach(([n, v], i) => { const cx = x + 10 + (i % 2) * 104, cy = yy + Math.floor(i / 2) * 12; text(n, cx, cy, '#a8b8f0'); textR(v, cx + 92, cy); });
  yy += 30;
  const found = Object.keys(G.log).length, all = Object.keys(FISH).length;
  text('Species ' + found + '/' + all, x + 10, yy, '#c8d0f0'); textR('Caught ' + G.stats.caught, x + w - 10, yy, '#c8d0f0');
  yy += 12;
  text('World: ' + G.world.name, x + 10, yy, '#80e0ff');
}

class ItemsUI {
  constructor() { this.build(0); }
  build(sel) {
    const p = G.player, it = [{ label: 'RODS', sep: true }];
    for (const id of p.rods) it.push({ label: RODS[id].name, right: p.rod === id ? 'E' : '', rc: '#80ff80', id, kind: 'rod', action: () => { p.rod = id; toast(RODS[id].name + ' ready!'); this.build(this.menu.sel); } });
    it.push({ label: 'BAIT', sep: true });
    const baits = Object.keys(BAITS).filter(b => p.baits[b] > 0);
    for (const id of baits) it.push({ label: BAITS[id].name, right: (p.bait === id ? 'E ' : '') + 'x' + p.baits[id], id, kind: 'bait', action: () => { p.bait = id; toast(BAITS[id].name + ' selected!'); this.build(this.menu.sel); } });
    if (!baits.length) it.push({ label: '(no bait)', disabled: true });
    this.menu = new Menu({ x: 8, y: 8, w: 200, rows: 13, items: it, sel, onCancel: () => popUI(this), title: 'ITEMS' });
  }
  update() { this.menu.update(); }
  draw() {
    this.menu.draw(ui[ui.length - 1] === this);
    const c = this.menu.cur(); drawWin(212, 8, 102, 140);
    if (c && c.id) {
      const d = c.kind === 'rod' ? RODS[c.id] : BAITS[c.id];
      wrap(d.desc, 15).forEach((l, i) => text(l, 220, 18 + i * 11));
      if (c.kind === 'rod') { text('POWER ' + d.power, 220, 110, '#a8ffa8'); text('BAR   +' + d.zone, 220, 122, '#a8ffa8'); }
      else { text('BITE x' + (1 / d.bite).toFixed(1), 220, 110, '#a8ffa8'); text('RARE +' + (d.rare * 100).toFixed(1) + '%', 220, 122, '#a8ffa8'); }
    }
    text('A: set default', 216, 154, '#8898d0');
  }
}

class EquipUI {
  constructor() { this.build(0); }
  build(sel) {
    const p = G.player;
    this.menu = new Menu({
      x: 8, y: 8, w: 200, rows: 4, lh: 14, title: 'EQUIP', sel, onCancel: () => popUI(this),
      items: SLOTS.map(([s, n]) => ({ label: n, right: p.equip[s] ? GEAR[p.equip[s]].name : '-', action: () => this.choose(s) })),
    });
  }
  choose(slot) {
    const p = G.player, owned = p.gear.filter(g => GEAR[g].slot === slot);
    if (!owned.length) { toast('No gear for this slot. Visit the Outfitters!', '#ffb0b0'); return; }
    const items = owned.map(g => ({ label: GEAR[g].name, right: p.equip[slot] === g ? 'E' : '', id: g, action: () => { p.equip[slot] = g; sfx('coin'); popUI(sub); this.build(this.menu.sel); } }));
    items.push({ label: '(Remove)', action: () => { p.equip[slot] = null; popUI(sub); this.build(this.menu.sel); } });
    const sub = pushUI(new MenuUI({ x: 40, y: 90, w: 160, rows: 6, items, title: 'Choose', onCancel: () => popUI(sub) }, m => {
      const c = m.cur(); if (!c.id) return; drawGearInfo(c.id, 212, 90);
    }));
  }
  update() { this.menu.update(); }
  draw() {
    this.menu.draw(ui[ui.length - 1] === this);
    const st = stats(); drawWin(212, 8, 102, 76);
    [['POWER', st.power], ['FOCUS', st.focus], ['STAMINA', st.stamina], ['LUCK', st.luck]].forEach(([n, v], i) => { text(n, 220, 18 + i * 14, '#a8b8f0'); textR(v, 306, 18 + i * 14); });
  }
}
function gearStatStr(g) {
  return ['power', 'focus', 'stamina', 'luck'].filter(k => g[k]).map(k => k.slice(0, 3).toUpperCase() + '+' + g[k]);
}
function drawGearInfo(id, x, y) {
  const g = GEAR[id]; drawWin(x, y, 102, 110);
  wrap(g.desc, 15).forEach((l, i) => text(l, x + 8, y + 8 + i * 11));
  gearStatStr(g).forEach((s, i) => text(s, x + 8, y + 60 + i * 11, '#a8ffa8'));
}

class CoolerUI {
  constructor() {
    const items = G.cooler.slice().sort((a, b) => b.value - a.value).map(f => ({ label: (f.rare ? '*' : '') + FISH[f.id].name, right: f.size + 'cm', f, color: f.rare ? '#ffe890' : '#fff' }));
    if (!items.length) items.push({ label: '(empty - go fishing!)', disabled: true });
    this.menu = new Menu({ x: 8, y: 8, w: 200, rows: 15, items, title: 'COOLER ' + G.cooler.length + '/' + MAX_COOLER, onCancel: () => popUI(this) });
  }
  update() { this.menu.update(); }
  draw() {
    this.menu.draw(ui[ui.length - 1] === this);
    const c = this.menu.cur();
    drawWin(212, 8, 102, 120);
    if (c && c.f) {
      const img = fishSprite(c.f.id), s = img.width > 40 ? 2 : 3;
      ctx.drawImage(img, 263 - img.width * s / 2, 40 - img.height * s / 2, img.width * s, img.height * s);
      text(c.f.size + ' cm', 220, 76); text('$ ' + sellPrice(c.f) + ' AC', 220, 90, '#ffe890');
      if (c.f.rare) text('RARE!', 220, 104, '#ff90c0');
    }
    const tot = G.cooler.reduce((a, f) => a + sellPrice(f), 0);
    drawWin(212, 132, 102, 34); text('Total value', 220, 140, '#a8b8f0'); text('$ ' + fmt(tot), 220, 152, '#ffe890');
  }
}

class LogUI {
  constructor() { this.li = 0; this.build(); }
  build() {
    const L = LAKES[this.li];
    const ids = L.fish.concat([L.rare]);
    const items = ids.map(id => {
      const e = G.log[id];
      return { label: e ? FISH[id].name : '??????', right: e ? 'x' + e.n + ' ' + e.best + 'cm' : '', id: e ? id : null, color: FISH[id].rare ? '#ffe890' : '#fff' };
    });
    this.menu = new Menu({ x: 8, y: 30, w: 200, rows: 6, lh: 14, items, onCancel: () => popUI(this) });
  }
  update() {
    if (inp.rep('right')) { this.li = (this.li + 1) % LAKES.length; sfx('blip'); this.build(); }
    if (inp.rep('left')) { this.li = (this.li + LAKES.length - 1) % LAKES.length; sfx('blip'); this.build(); }
    this.menu.update();
  }
  draw() {
    drawWin(8, 8, 306, 20); textC('< ' + LAKES[this.li].name + ' >', 160, 14, '#ffe890');
    hit(8, 4, 153, 26, () => { this.li = (this.li + LAKES.length - 1) % LAKES.length; sfx('blip'); this.build(); });
    hit(161, 4, 153, 26, () => { this.li = (this.li + 1) % LAKES.length; sfx('blip'); this.build(); });
    this.menu.draw(ui[ui.length - 1] === this);
    drawWin(212, 30, 102, 100);
    const c = this.menu.cur();
    if (c && c.id) {
      const img = fishSprite(c.id), s = img.width > 40 ? 2 : 3;
      ctx.drawImage(img, 263 - img.width * s / 2, 64 - img.height * s / 2, img.width * s, img.height * s);
      text('Base $' + FISH[c.id].val, 220, 98, '#ffe890'); text('Diff ' + '*'.repeat(Math.ceil(FISH[c.id].d / 2)), 220, 110, '#ff9090');
    } else textC('???', 263, 70, '#8890b0');
    const found = Object.keys(G.log).filter(k => !FISH[k].junk).length, all = Object.keys(FISH).filter(k => !FISH[k].junk).length;
    drawWin(8, 136, 306, 22); textC('Species discovered: ' + found + ' / ' + all, 160, 143, '#c8d0f0');
  }
}

// ============ Quantity picker ============
class QtyUI {
  constructor(name, price, max, cb) { Object.assign(this, { name, price, max, cb, q: 1 }); }
  update() {
    let d = 0;
    if (inp.rep('right')) d = 1; if (inp.rep('left')) d = -1; if (inp.rep('up')) d = 10; if (inp.rep('down')) d = -10;
    if (d) { this.q = clamp(this.q + d, 1, this.max); sfx('blip'); }
    if (inp.pressed.a) { popUI(this); this.cb(this.q); }
    if (inp.pressed.b || inp.pressed.menu) { sfx('cancel'); popUI(this); }
  }
  add(d) { this.q = clamp(this.q + d, 1, this.max); sfx('blip'); }
  draw() {
    drawWin(56, 60, 208, 104);
    textC('Buy how many ' + this.name + '?', 160, 70, '#ffe890');
    btn(64, 86, 34, 18, '-10', () => this.add(-10)); btn(100, 86, 26, 18, '-1', () => this.add(-1));
    btn(194, 86, 26, 18, '+1', () => this.add(1)); btn(222, 86, 34, 18, '+10', () => this.add(10));
    textC(String(this.q), 160, 92);
    textC('Total: $' + fmt(this.q * this.price) + ' AC', 160, 112, '#ffe890');
    btn(84, 128, 70, 20, 'Buy', () => tapA(), '#a8ffa8'); btn(166, 128, 70, 20, 'Cancel', () => { sfx('cancel'); popUI(this); });
    textC('L/R: 1   U/D: 10', 160, 152, '#8898d0', null);
  }
}

// ============ Shops ============
function buy(price) {
  if (G.player.ac < price) { sfx('err'); toast("You can't afford that!", '#ffb0b0'); return false; }
  G.player.ac -= price; sfx('coin'); return true;
}
const SHOPS = {
  tackle: {
    name: 'Hook, Line & Sinker', keeper: { type: 'boy', col: { hair: '#d0d0d0', shirt: '#a04030', pants: '#3a3020' } }, keeperName: 'Old Gil',
    greet: "Ahoy! Rods and bait, the finest in town!", wall: '#6a4a3a', song: 'shop',
    items(s) {
      const p = G.player, it = [{ label: 'RODS', sep: true }];
      for (const id in RODS) {
        if (id === 'bamboo') continue;
        const r = RODS[id], own = p.rods.includes(id);
        it.push({
          label: r.name, right: own ? 'OWNED' : '$' + fmt(r.price), rc: own ? '#80ff80' : null,
          info: () => [r.desc, '', 'POWER ' + r.power, 'BAR +' + r.zone],
          action: () => {
            if (own) { p.rod = id; s.say('Using your ' + r.name + ' now.'); return; }
            ask('Buy the ' + r.name + ' for $' + fmt(r.price) + ' AC?', ['Buy', 'No'], k => {
              if (k === 0 && buy(r.price)) { p.rods.push(id); p.rod = id; s.say('A fine choice! It is ready to use.'); s.rebuild(); }
            });
          },
        });
      }
      it.push({ label: 'BAIT', sep: true });
      for (const id in BAITS) {
        const b = BAITS[id];
        it.push({
          label: b.name, right: '$' + b.price, info: () => [b.desc, '', 'Have: ' + (p.baits[id] || 0), 'BITE x' + (1 / b.bite).toFixed(1), 'RARE +' + (b.rare * 100).toFixed(1) + '%'],
          action: () => {
            const max = Math.min(99, Math.floor(p.ac / b.price));
            if (max < 1) { sfx('err'); toast("You can't afford that!", '#ffb0b0'); return; }
            pushUI(new QtyUI(b.name, b.price, max, q => {
              if (buy(q * b.price)) { p.baits[id] = (p.baits[id] || 0) + q; if (!p.bait || !p.baits[p.bait]) p.bait = id; s.say('Here you go, ' + q + ' ' + b.name + '! Tight lines!'); s.rebuild(); }
            }));
          },
        });
      }
      return it;
    },
  },
  tanks: {
    name: 'Tank Emporium', keeper: { type: 'girl', col: { hair: '#40a0e0', shirt: '#f0f0f0', dress: '#3070c0' } }, keeperName: 'Marina',
    greet: 'Welcome! Make your world sparkle with aquariums!', wall: '#2a5a7a', song: 'shop',
    items(s) {
      const w = G.world, it = [{ label: 'AQUARIUMS', sep: true }];
      for (const id in TANKS) {
        const t = TANKS[id];
        it.push({
          label: t.name, right: '$' + fmt(t.price), tank: id, info: () => [t.desc, '', 'Plots used: ' + w.tanks.length + '/' + MAX_TANKS],
          action: () => {
            if (w.tanks.length >= MAX_TANKS) { sfx('err'); s.say('Your world has no free plots left!'); return; }
            ask('Buy a ' + t.name + ' for $' + fmt(t.price) + ' AC?', ['Buy', 'No'], k => {
              if (k === 0 && buy(t.price)) { w.tanks.push({ type: id, fish: [] }); s.say('Delivered to your world! Fill it with fish at home.'); s.rebuild(); }
            });
          },
        });
      }
      it.push({ label: 'DECOR', sep: true });
      for (const id in DECOR) {
        const d = DECOR[id], own = w.decor.includes(id);
        it.push({
          label: d.name, right: own ? 'PLACED' : '$' + fmt(d.price), rc: own ? '#80ff80' : null, disabled: own, decor: id, info: () => [d.desc],
          action: () => ask('Buy the ' + d.name + ' for $' + fmt(d.price) + ' AC?', ['Buy', 'No'], k => {
            if (k === 0 && buy(d.price)) { w.decor.push(id); s.say('It will look lovely in ' + w.name + '!'); s.rebuild(); }
          }),
        });
      }
      it.push({ label: 'HOME', sep: true });
      const nx = w.house + 1;
      if (nx < HOUSES.length) {
        const h = HOUSES[nx];
        it.push({
          label: h.name, right: '$' + fmt(h.price), info: () => [h.desc, '', 'Current: ' + HOUSES[w.house].name],
          action: () => ask('Upgrade your home to a ' + h.name + ' for $' + fmt(h.price) + ' AC?', ['Upgrade', 'No'], k => {
            if (k === 0 && buy(h.price)) { w.house = nx; s.say('Our builders are on it! Your ' + h.name + ' is ready.'); s.rebuild(); }
          }),
        });
      } else it.push({ label: 'Home fully upgraded', disabled: true });
      return it;
    },
  },
  market: {
    name: 'Fish Market', keeper: { type: 'boy', col: { hair: '#202020', shirt: '#f0f0f0', pants: '#2a5a8a' } }, keeperName: 'Mr. Scales',
    greet: "Fresh catch? I'll pay top coin!", wall: '#4a6a5a', song: 'shop',
    items(s) {
      const fod = fishOfTheDay(), it = [];
      const tot = G.cooler.reduce((a, f) => a + sellPrice(f), 0);
      it.push({
        label: 'Sell ALL fish', right: '$' + fmt(tot), disabled: !G.cooler.length, why: 'Your cooler is empty.',
        info: () => ['Sell everything in your cooler.', '', 'Fish of the Day:', FISH[fod].name + ' (x1.5)'],
        action: () => ask('Sell all ' + G.cooler.length + ' fish for $' + fmt(tot) + ' AC?', ['Sell', 'No'], k => {
          if (k === 0) { G.player.ac += tot; G.stats.earned += tot; G.cooler = []; sfx('coin'); s.say('Pleasure doing business! $' + fmt(tot) + ' AC for you.'); s.rebuild(); }
        }),
      });
      it.push({ label: 'YOUR COOLER', sep: true });
      G.cooler.map((f, i) => ({ f, i })).sort((a, b) => sellPrice(b.f) - sellPrice(a.f)).forEach(({ f }) => {
        const pr = sellPrice(f);
        it.push({
          label: (f.rare ? '*' : '') + FISH[f.id].name, right: '$' + fmt(pr), color: f.id === fod ? '#a8ffa8' : f.rare ? '#ffe890' : '#fff', fish: f,
          info: () => [f.size + ' cm', f.rare ? 'RARE FIND!' : '', f.id === fod ? 'Fish of the Day! x1.5' : ''],
          action: () => {
            const i = G.cooler.indexOf(f); if (i < 0) return;
            G.cooler.splice(i, 1); G.player.ac += pr; G.stats.earned += pr; sfx('coin');
            s.say(f.rare ? 'Wow, a ' + FISH[f.id].name + '! Here is $' + fmt(pr) + '!' : 'Sold for $' + fmt(pr) + ' AC.'); s.rebuild();
          },
        });
      });
      if (!G.cooler.length) it.push({ label: '(cooler is empty)', disabled: true });
      return it;
    },
  },
  outfitter: {
    name: 'Angler Outfitters', keeper: { type: 'girl', col: { hair: '#e8c040', shirt: '#8a3030', dress: '#4a3a30' } }, keeperName: 'Brenna',
    greet: 'Gear up, angler! Power, focus and luck await.', wall: '#5a3a5a', song: 'shop',
    items(s) {
      const p = G.player, it = [];
      for (const [slot, sn] of SLOTS) {
        if (slot === 'charm') continue;
        it.push({ label: sn.toUpperCase() + (slot === 'head' ? ' (CLOTHES)' : slot === 'body' ? ' (ARMOR)' : ''), sep: true });
        for (const id in GEAR) {
          const g = GEAR[id]; if (g.slot !== slot || g.noShop) continue;
          const own = p.gear.includes(id), eq = p.equip[slot] === id;
          it.push({
            label: g.name, right: eq ? 'EQUIP' : own ? 'OWNED' : '$' + fmt(g.price), rc: own ? '#80ff80' : null, gear: id,
            info: () => [g.desc, ''].concat(gearStatStr(g)).concat(p.equip[slot] && !eq ? ['', 'Now: ' + GEAR[p.equip[slot]].name] : []),
            action: () => {
              if (own) { p.equip[slot] = eq ? null : id; s.say(eq ? 'Took off the ' + g.name + '.' : 'Equipped the ' + g.name + '!'); s.rebuild(); return; }
              ask('Buy the ' + g.name + ' for $' + fmt(g.price) + ' AC?', ['Buy', 'No'], k => {
                if (k === 0 && buy(g.price)) { p.gear.push(id); p.equip[slot] = id; s.say('Looking sharp! I equipped it for you.'); s.rebuild(); }
              });
            },
          });
        }
      }
      return it;
    },
  },
};
class ShopUI {
  constructor(kind, onClose) {
    this.kind = kind; this.def = SHOPS[kind]; this.onClose = onClose;
    this.msg = this.def.greet; this.msgT = 0;
    this.keeper = charSprites(this.def.keeper.type, this.def.keeper.col);
    playSong('shop'); this.rebuild(0);
  }
  say(m) { this.msg = m; this.msgT = 0; }
  rebuild(sel) {
    if (sel === undefined) sel = this.menu ? this.menu.sel : 0;
    const items = this.def.items(this);
    items.push({ label: 'Leave', action: () => this.close() });
    this.menu = new Menu({ x: 6, y: 112, w: 196, rows: 9, lh: 12, items, sel: Math.min(sel, items.length - 1), onCancel: () => this.close() });
  }
  close() { popUI(this); if (this.onClose) this.onClose(); }
  update() { this.msgT += 1.5; this.menu.update(); }
  draw() {
    drawShopBackdrop(this);
    drawWin(4, 4, 150, 20); text(this.def.name, 12, 10, '#ffe890');
    drawWin(222, 4, 94, 20); textR('$ ' + fmt(G.player.ac), 308, 10, '#ffe890');
    // speech bubble
    const lines = wrap(this.msg, 21).slice(0, 4);
    drawWin(180, 28, 136, 14 + lines.length * 11, 'dark');
    let left = this.msgT;
    lines.forEach((l, i) => { text(l.slice(0, Math.max(0, left)), 187, 35 + i * 11); left -= l.length; });
    this.menu.draw(ui[ui.length - 1] === this);
    drawWin(206, 112, 110, 124);
    const c = this.menu.cur();
    if (c && c.info) {
      let y = 120;
      if (c.tank) { ctx.save(); ctx.translate(242, y); drawTank(c.tank, 0, 0, []); ctx.restore(); y += 36; }
      if (c.decor) { ctx.save(); ctx.translate(244, y + 12); drawDecor(c.decor, 0, 0); ctx.restore(); y += 46; }
      if (c.fish) { const img = fishSprite(c.fish.id); const s2 = img.width > 34 ? 2 : 3; ctx.drawImage(img, 261 - img.width * s2 / 2, y, img.width * s2, img.height * s2); y += img.height * s2 + 4; }
      for (const raw of c.info()) for (const l of wrap(raw, 16)) { if (y > 226) break; text(l, 214, y, raw.startsWith('POW') || /\+/.test(raw) ? '#a8ffa8' : '#fff'); y += 11; }
    }
  }
}
function drawShopBackdrop(s) {
  const wall = s.def.wall;
  rect(0, 0, W, 112, wall);
  for (let x = 0; x < W; x += 16) rect(x, 0, 1, 80, shade(wall, -0.15));
  rect(0, 76, W, 4, shade(wall, -0.35));
  // floor
  for (let y = 80; y < 112; y += 6) rect(0, y, W, 6, (y / 6) % 2 ? '#8a6040' : '#7a5236');
  // shelves
  for (const sy of [22, 50]) { rect(10, sy + 14, 110, 3, '#4a2e1a'); rect(200, sy + 14, 0, 0, '#000'); }
  const k = s.kind;
  for (let i = 0; i < 6; i++) {
    const x = 16 + i * 17;
    if (k === 'tackle') { rect(x + 4, 6, 1, 30, ['#c8a050', '#e0e0e8', '#404048', '#a0c8e0', '#f0c040', '#c8a050'][i]); rect(x + 1, 52, 10, 12, '#cfeaff'); rect(x + 2, 56, 8, 8, Object.values(BAITS)[i].color); rect(x, 50, 12, 2, '#6a4a2a'); }
    if (k === 'tanks') { rect(x, 20, 14, 16, '#cfeaff'); rect(x + 1, 22, 12, 13, '#3c8ad8'); rect(x + 3, 26, 4, 2, ['#f0a020', '#e04848', '#60e0a0'][i % 3]); rect(x + 1, 48, 12, 16, '#a8a4b8'); rect(x + 4, 52, 6, 6, ['#f06080', '#f0a040', '#a060e0'][i % 3]); }
    if (k === 'market') { const ids = ['bluegill', 'perch', 'trout', 'carp', 'salmon', 'loach']; const img = fishSprite(ids[i]); ctx.drawImage(img, x - 2, 26 - img.height / 2); rect(x - 3, 58, 16, 6, '#e0f0ff'); ctx.drawImage(miniFish(ids[(i + 2) % 6]), x, 52); }
    if (k === 'outfitter') {
      rect(x + 1, 18, 12, 4, Object.values(GEAR)[i % 4].color); rect(x - 1, 22, 16, 2, Object.values(GEAR)[i % 4].color);
      rect(x + 1, 44, 12, 20, Object.values(GEAR)[4 + (i % 4)].color); rect(x - 1, 46, 2, 10, Object.values(GEAR)[4 + (i % 4)].color); rect(x + 13, 46, 2, 10, Object.values(GEAR)[4 + (i % 4)].color);
    }
  }
  // keeper behind counter
  const spr = s.keeper.down[0];
  ctx.drawImage(spr, 120, 30, spr.width * 3, spr.height * 3);
  rect(96, 74, 120, 30, '#6a3e22'); rect(96, 74, 120, 4, '#9a6a3a'); rect(96, 102, 120, 2, '#3a2010');
  text(s.def.keeperName, 102, 88, '#ffe8c0', '#2a1408');
  rect(184, 64, 12, 10, '#ffd040'); rect(186, 62, 8, 2, '#ffd040'); // cash box
}

// ============ Prize Wheel ============
const WHEEL_SEGS = [
  { label: '50', col: '#d84040', w: 20, desc: '50 AC', give: () => { G.player.ac += 50; return 'You won 50 AC!'; } },
  { label: 'WORM', col: '#3068d8', w: 18, desc: '10 Worms', give: () => { G.player.baits.worm = (G.player.baits.worm || 0) + 10; return 'You won 10 Worms!'; } },
  { label: '300', col: '#38a848', w: 8, desc: '300 AC', give: () => { G.player.ac += 300; return 'You won 300 AC!'; } },
  { label: 'MISS', col: '#4a4a5a', w: 26, desc: 'Nothing...', give: () => 'Aww, a miss! Better luck next spin.' },
  { label: 'GLOW', col: '#8848c8', w: 9, desc: '2 Glow Bait', give: () => { G.player.baits.glow = (G.player.baits.glow || 0) + 2; return 'You won 2 Glow Bait!'; } },
  { label: '100', col: '#e87828', w: 15, desc: '100 AC', give: () => { G.player.ac += 100; return 'You won 100 AC! Your money back.'; } },
  { label: '1000', col: '#e8b820', w: 2, desc: '1000 AC!!', give: () => { G.player.ac += 1000; return 'JACKPOT!!! You won 1000 AC!'; } },
  { label: 'CHARM', col: '#28a8a8', w: 2, desc: 'Lucky Charm', give: () => {
      const p = G.player;
      if (p.gear.includes('charm')) { p.ac += 500; return 'Lucky Charm! You already own one, so take 500 AC!'; }
      p.gear.push('charm'); if (!p.equip.charm) p.equip.charm = 'charm'; return 'You won the LUCKY CHARM! (LUCK +3, equipped)';
    } },
];
const SPIN_COST = 100;
let bigWheel = null, smallWheel = null;
class WheelUI {
  constructor(onClose) {
    if (!bigWheel) bigWheel = makeWheelCanvas(64, WHEEL_SEGS);
    this.a = -Math.PI / 2; this.state = 'idle'; this.onClose = onClose;
    this.msg = 'Spin the Prize Wheel for $' + SPIN_COST + ' AC? Press A to spin!';
  }
  update() {
    if (this.state === 'idle') {
      if (inp.pressed.a) {
        if (G.player.ac < SPIN_COST) { sfx('err'); this.msg = "You don't have enough AC to spin."; return; }
        G.player.ac -= SPIN_COST; G.stats.spins++; sfx('coin');
        const tot = WHEEL_SEGS.reduce((a, s) => a + s.w, 0);
        let r = Math.random() * tot, idx = 0;
        while (r >= WHEEL_SEGS[idx].w) { r -= WHEEL_SEGS[idx].w; idx++; }
        const n = WHEEL_SEGS.length, seg = Math.PI * 2 / n;
        const want = (idx + 0.5 + rnd(-0.32, 0.32)) * seg;
        let af = -Math.PI / 2 - want;
        while (af < this.a + Math.PI * 2 * 6) af += Math.PI * 2;
        this.spin = { a0: this.a, af, t: 0, dur: 220, idx, last: 0 };
        this.state = 'spin'; this.msg = 'Round and round it goes...';
      }
      if (inp.pressed.b || inp.pressed.menu) { sfx('cancel'); popUI(this); this.onClose && this.onClose(); }
    } else if (this.state === 'spin') {
      const s = this.spin; s.t++;
      const k = s.t / s.dur, e = 1 - Math.pow(1 - k, 3);
      this.a = s.a0 + (s.af - s.a0) * e;
      const segN = Math.floor(this.a / (Math.PI / 4));
      if (segN !== s.last) { s.last = segN; sfx('tick'); }
      if (s.t >= s.dur) {
        this.state = 'result';
        const seg = WHEEL_SEGS[s.idx];
        this.msg = seg.give(); this.win = s.idx;
        sfx(seg.label === 'MISS' ? 'fail' : seg.label === '1000' || seg.label === 'CHARM' ? 'rare' : 'catch');
      }
    } else if (inp.pressed.a || inp.pressed.b) { this.state = 'idle'; this.win = null; this.msg = 'Spin again for $' + SPIN_COST + ' AC?'; }
  }
  draw() {
    ctx.fillStyle = 'rgba(0,0,20,0.6)'; ctx.fillRect(0, 0, W, H);
    drawWin(6, 6, 196, 188, 'gold');
    textC('PRIZE WHEEL', 104, 13, '#ffe890');
    const cx = 104, cy = 106;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(this.a); ctx.drawImage(bigWheel, -bigWheel.width / 2, -bigWheel.height / 2); ctx.restore();
    WHEEL_SEGS.forEach((s, i) => {
      const a = this.a + (i + 0.5) / WHEEL_SEGS.length * Math.PI * 2;
      textC(s.label, cx + Math.cos(a) * 40, cy + Math.sin(a) * 40 - 3, '#fff', '#101028');
    });
    // pointer
    for (let i = 0; i < 7; i++) rect(cx - 6 + i, cy - 72 + i, 13 - i * 2, 1, i === 0 ? '#101028' : '#ff4040');
    rect(cx - 7, cy - 73, 15, 1, '#101028');
    drawWin(206, 6, 108, 188);
    text('PRIZES', 216, 14, '#ffe890');
    WHEEL_SEGS.forEach((s, i) => {
      rect(214, 30 + i * 14, 6, 6, s.col);
      text(s.desc, 224, 29 + i * 14, this.win === i && (T >> 3) % 2 ? '#ffe890' : '#fff');
    });
    text('Cost $' + SPIN_COST, 216, 132, '#ffb0b0');
    text('You  $' + fmt(G.player.ac), 216, 145, '#ffe890');
    hit(6, 20, 196, 174, () => tapA());
    btn(212, 160, 46, 20, 'Spin', () => tapA(), '#a8ffa8');
    btn(262, 160, 46, 20, 'Leave', () => { inp.pressed.b = true; });
    drawDialogBox(wrap(this.msg, 47).slice(0, 3), 999, null, this.state !== 'spin');
  }
}
