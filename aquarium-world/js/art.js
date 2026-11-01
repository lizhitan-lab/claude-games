'use strict';
// ============ Sprite helpers ============
function makeSprite(rows, pal, outline = '#141420') {
  const h = rows.length, w = rows[0].length;
  const c = mkCanvas(w + 2, h + 2), g = c.getContext('2d');
  const filled = (x, y) => y >= 0 && y < h && x >= 0 && x < w && rows[y][x] !== '.' && !!pal[rows[y][x]];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (filled(x, y)) { g.fillStyle = pal[rows[y][x]]; g.fillRect(x + 1, y + 1, 1, 1); }
  if (outline) {
    g.fillStyle = outline;
    for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
      if (filled(x, y)) continue;
      if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) g.fillRect(x + 1, y + 1, 1, 1);
    }
  }
  return c;
}
function flipH(src) {
  const c = mkCanvas(src.width, src.height), g = c.getContext('2d');
  g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0); return c;
}

// ============ Characters ============
const CHAR = {
  boy: {
    down: ['................', '.....HHHHHH.....', '....HHHHHHHH....', '...HHHHHHHHHH...', '...HHSSSSSSHH...', '...HSSSSSSSSH...',
      '...SSESSSSESS...', '...SSESSSSESS...', '....SSSSSSSS....', '.....SSSSSS.....', '....CCCCCCCC....', '...SCCCCCCCCS...', '...SCCCCCCCCS...'],
    up: ['................', '.....HHHHHH.....', '....HHHHHHHH....', '...HHHHHHHHHH...', '...HHHHHHHHHH...', '...HHHHHHHHHH...',
      '...HHHHHHHHHH...', '...SHHHHHHHHS...', '....HHHHHHHH....', '.....SSSSSS.....', '....CCCCCCCC....', '...SCCCCCCCCS...', '...SCCCCCCCCS...'],
    left: ['................', '.....HHHHHH.....', '....HHHHHHHH....', '...HHHHHHHHHH...', '...HHSSSHHHHH...', '...HSSSSSHHHH...',
      '...SESSSSSHHH...', '...SESSSSSSHH...', '...SSSSSSSSH....', '.....SSSSSS.....', '.....CCCCCC.....', '.....CCCCCC.....', '.....SCCCCC.....'],
    legs: {
      down: [['....PPPPPPPP....', '....PPP..PPP....', '....BBB..BBB....'],
        ['....PPPPPPPP....', '....PPP..BBB....', '....BBB.........'],
        ['....PPPPPPPP....', '....BBB..PPP....', '.........BBB....']],
      left: [['.....PPPPPP.....', '......PPPP......', '......BBBB......'],
        ['.....PPPPPP.....', '.....PP..PP.....', '....BB....BB....'],
        ['.....PPPPPP.....', '......PP.PP.....', '.....BBB.BB.....']],
    },
  },
  girl: {
    down: ['................', '.....HHHHHH.RR..', '....HHHHHHHHRR..', '...HHHHHHHHHH...', '...HHSSSSSSHH...', '...HSSSSSSSSH...',
      '..HHSESSSSESHH..', '..HHSESSSSESHH..', '..HHSSSSSSSSHH..', '..HH.SSSSSS.HH..', '..H.CCCCCCCC.H..', '...SCCCCCCCCS...',
      '...SDDDDDDDDS...', '...DDDDDDDDDD...'],
    up: ['................', '.....HHHHHH.....', '....HHHHHHHH....', '...HHHHHHHHHH...', '...HHHHRRHHHH...', '...HHHHRRHHHH...',
      '..HHHHHHHHHHHH..', '..HHHHHHHHHHHH..', '..HHHHHHHHHHHH..', '..HHHHHHHHHHHH..', '..HHCCCCCCCCHH..', '...SCCCCCCCCS...',
      '...SDDDDDDDDS...', '...DDDDDDDDDD...'],
    left: ['................', '.....HHHHHH.....', '....HHHHHHHHR...', '...HHHHHHHHHRR..', '...HHSSSHHHHH...', '...HSSSSSHHHHH..',
      '...SESSSSSHHHH..', '...SESSSSSHHHH..', '...SSSSSSSHHHH..', '.....SSSSSHHH...', '.....CCCCCCH....', '.....CCCCCC.....',
      '....DDDDDDDD....', '....DDDDDDDD....'],
    legs: {
      down: [['.....SS..SS.....', '.....BB..BB.....'], ['.....SS..BB.....', '.....BB.........'], ['.....BB..SS.....', '..........BB....']],
      left: [['......SSSS......', '......BBBB......'], ['.....SS..SS.....', '....BB....BB....'], ['......SS.SS.....', '.....BB..BB.....']],
    },
  },
};
CHAR.boy.legs.up = CHAR.boy.legs.down; CHAR.girl.legs.up = CHAR.girl.legs.down;
const HATS = {
  cap: { down: ['................', '....AAAAAAAA....', '...AAAAAAAAAA...', '..AAAAAAAAAAAA..'], left: ['................', '....AAAAAAAA....', '...AAAAAAAAAA...', '.AAAAAAAAAAA....'] },
  straw: { down: ['................', '.....AAAAAA.....', '....AAAAAAAA....', '.AAAAAAAAAAAAAA.'], left: ['................', '.....AAAAAA.....', '....AAAAAAAA....', 'AAAAAAAAAAAAAA..'] },
  crown: { down: ['...A..A..A..A...', '...AAAAAAAAAA...', '...AGAAAGAAAGA..'.slice(0, 16), '................'], left: ['...A..A..A..A...', '...AAAAAAAAAA...', '...AAGAAAGAAA...', '................'] },
};
HATS.cap.up = HATS.cap.down; HATS.straw.up = HATS.straw.down; HATS.crown.up = HATS.crown.down;
const charCache = {};
function charSprites(type, col, hat) {
  const key = type + JSON.stringify(col) + (hat ? hat.type + hat.color : '');
  if (charCache[key]) return charCache[key];
  const def = CHAR[type];
  const pal = { H: col.hair, S: col.skin || '#f2c8a0', E: '#1a1a2a', C: col.shirt, P: col.pants || '#30406a', B: col.shoes || '#5a3420', D: col.dress || col.shirt, R: col.ribbon || '#40c0e0', A: hat ? hat.color : '#fff', G: '#e03050' };
  const out = {};
  for (const dir of ['down', 'up', 'left']) {
    out[dir] = [0, 1, 2].map(f => {
      let rows = def[dir].concat(def.legs[dir][f]);
      if (hat) {
        const hr = HATS[hat.type][dir];
        rows = rows.map((r, i) => {
          if (i >= hr.length) return r;
          let s = ''; for (let x = 0; x < 16; x++) s += hr[i][x] && hr[i][x] !== '.' ? hr[i][x] : r[x]; return s;
        });
      }
      return makeSprite(rows, pal);
    });
  }
  out.right = out.left.map(flipH);
  return (charCache[key] = out);
}
const WALKSEQ = [0, 1, 0, 2];
function playerColors() {
  const p = G.player, girl = p.gender === 'girl';
  const body = p.equip.body ? GEAR[p.equip.body].color : null;
  return girl ? { hair: '#b04060', shirt: body || '#f4f4f4', dress: body ? shade(body, -0.25) : '#e04878', ribbon: '#40c0e0', shoes: '#803040' }
    : { hair: '#4a2a18', shirt: body || '#3070d0', pants: '#2c3458', shoes: '#5a3420' };
}
function playerSprites() {
  const p = G.player;
  const h = p.equip.head ? { type: GEAR[p.equip.head].hat, color: GEAR[p.equip.head].color } : null;
  return charSprites(p.gender, playerColors(), h);
}

// ============ Tiles ============
const TL = { GRASS: 0, PATH: 1, TREE: 2, FLOWER: 3, WATER: 4, PLAZA: 5, BUSH: 6, SAND: 7 };
const SOLID_TILES = new Set([TL.TREE, TL.WATER, TL.BUSH]);
const CITY_THEME = { grass: '#58a844', dark: '#448a36', light: '#7cc458', tree: '#2c7434', treeL: '#4c9c44', trunk: '#6a4424', path: '#d4b484', pathD: '#ac8c5c', flower: ['#f86a7a', '#f8f070', '#ffffff'] };
const tilesetCache = new Map();
function tileset(th) {
  if (tilesetCache.has(th)) return tilesetCache.get(th);
  const mk = fn => { const c = mkCanvas(16, 16); fn(c.getContext('2d')); return c; };
  const grassFn = (seed) => g => {
    rect(0, 0, 16, 16, th.grass, g);
    const r = seeded(seed);
    for (let i = 0; i < 10; i++) { const x = Math.floor(r() * 16), y = Math.floor(r() * 15); rect(x, y, 1, 2, th.dark, g); }
    for (let i = 0; i < 5; i++) { const x = Math.floor(r() * 16), y = Math.floor(r() * 16); rect(x, y, 1, 1, th.light, g); }
  };
  const ts = {};
  ts.grass = [1, 2, 3].map(s => mk(grassFn(s * 31)));
  ts.flower = [7, 8].map(s => mk(g => {
    grassFn(s)(g); const r = seeded(s * 99);
    for (let i = 0; i < 3; i++) {
      const x = 2 + Math.floor(r() * 11), y = 2 + Math.floor(r() * 11), c = th.flower[Math.floor(r() * th.flower.length)];
      rect(x, y + 1, 1, 2, th.dark, g); rect(x - 1, y, 3, 1, c, g); rect(x, y - 1, 1, 3, c, g); rect(x, y, 1, 1, '#f8e040', g);
    }
  }));
  ts.path = mk(g => {
    rect(0, 0, 16, 16, th.path, g);
    const r = seeded(5);
    for (let i = 0; i < 6; i++) { const x = Math.floor(r() * 14), y = Math.floor(r() * 14); rect(x, y, 3, 2, th.pathD, g); rect(x, y, 2, 1, shade(th.path, 0.25), g); }
  });
  ts.plaza = mk(g => {
    rect(0, 0, 16, 16, '#b8b4c4', g);
    rect(0, 7, 16, 1, '#8c88a0', g); rect(0, 15, 16, 1, '#8c88a0', g); rect(7, 0, 1, 8, '#8c88a0', g); rect(15, 8, 1, 8, '#8c88a0', g);
    rect(1, 1, 5, 1, '#d4d0e0', g); rect(9, 9, 5, 1, '#d4d0e0', g);
  });
  ts.sand = mk(g => { rect(0, 0, 16, 16, '#e8d49a', g); const r = seeded(9); for (let i = 0; i < 8; i++) rect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1, '#c8b070', g); });
  ts.tree = mk(g => {
    grassFn(3)(g);
    rect(3, 13, 10, 2, th.dark, g);
    rect(7, 10, 2, 5, th.trunk, g);
    pellipse(8, 7, 6, 6, '#101c18', g); pellipse(8, 7, 5, 5, th.tree, g);
    pellipse(7, 5, 3, 3, th.treeL, g); rect(5, 3, 2, 1, shade(th.treeL, 0.3), g);
    rect(10, 9, 2, 1, shade(th.tree, -0.3), g); rect(4, 9, 1, 1, shade(th.tree, -0.3), g);
  });
  ts.bush = mk(g => {
    grassFn(4)(g);
    pellipse(8, 10, 6, 4, '#101c18', g); pellipse(8, 10, 5, 3, th.tree, g); pellipse(7, 9, 3, 2, th.treeL, g);
  });
  tilesetCache.set(th, ts);
  return ts;
}
function drawTile(field, ts, x, y, sx, sy) {
  const t = field.tile(x, y), hv = hash2(x, y);
  switch (t) {
    case TL.GRASS: ctx.drawImage(ts.grass[hv % 3], sx, sy); break;
    case TL.FLOWER: ctx.drawImage(ts.flower[hv % 2], sx, sy); break;
    case TL.PATH: ctx.drawImage(ts.path, sx, sy); break;
    case TL.PLAZA: ctx.drawImage(ts.plaza, sx, sy); break;
    case TL.SAND: ctx.drawImage(ts.sand, sx, sy); break;
    case TL.TREE: ctx.drawImage(ts.tree, sx, sy); break;
    case TL.BUSH: ctx.drawImage(ts.bush, sx, sy); break;
    case TL.WATER: drawWater(field, x, y, sx, sy); break;
  }
}
function drawWater(f, x, y, sx, sy) {
  rect(sx, sy, 16, 16, '#3a7ed4');
  const ph = (T / 12 + x * 3 + y * 5) | 0;
  rect(sx + (ph % 12), sy + 4 + (y % 2) * 6, 4, 1, '#6aa8ec');
  rect(sx + ((ph + 6) % 12), sy + 11 - (y % 2) * 6, 3, 1, '#5a98e0');
  const land = (dx, dy) => f.tile(x + dx, y + dy) !== TL.WATER;
  if (land(0, -1)) { rect(sx, sy, 16, 2, '#2a5a9a'); rect(sx, sy + 2, 16, 1, '#9ad0f8'); }
  if (land(0, 1)) rect(sx, sy + 15, 16, 1, '#bfe4ff');
  if (land(-1, 0)) rect(sx, sy, 1, 16, '#bfe4ff');
  if (land(1, 0)) rect(sx + 15, sy, 1, 16, '#bfe4ff');
}

// ============ Buildings ============
function makeBuilding(w, h, o) {
  const c = mkCanvas(w * 16, h * 16), g = c.getContext('2d');
  const roofH = (h - 2) * 16, cw = w * 16;
  // walls
  rect(2, roofH - 2, cw - 4, h * 16 - roofH + 2, o.wall, g);
  for (let y = roofH + 3; y < h * 16; y += 5) rect(2, y, cw - 4, 1, shade(o.wall, -0.12), g);
  rect(2, h * 16 - 2, cw - 4, 2, shade(o.wall, -0.35), g);
  // windows
  const win = wx => {
    rect(wx - 1, roofH + 5, 14, 12, '#3a2a20', g); rect(wx, roofH + 6, 12, 10, '#ffe08a', g);
    rect(wx, roofH + 6, 12, 3, '#fff4c0', g); rect(wx + 5, roofH + 6, 1, 10, '#3a2a20', g); rect(wx, roofH + 11, 12, 1, '#3a2a20', g);
    rect(wx - 2, roofH + 16, 16, 2, shade(o.wall, -0.4), g);
  };
  const doorX = Math.floor(w / 2) * 16;
  win(14); win(cw - 26);
  if (w >= 9) { win(doorX - 26); win(doorX + 30); }
  // door
  rect(doorX + 1, h * 16 - 17, 14, 17, '#2a1a10', g);
  rect(doorX + 2, h * 16 - 16, 12, 16, o.door || '#7a4a24', g);
  rect(doorX + 2, h * 16 - 16, 12, 2, shade(o.door || '#7a4a24', 0.25), g);
  rect(doorX + 7, h * 16 - 15, 1, 15, '#3a2210', g);
  rect(doorX + 10, h * 16 - 8, 2, 2, '#f0d060', g);
  // roof
  for (let y = 0; y < roofH; y++) {
    const inset = Math.max(0, Math.floor((roofH - y) / 3) - 4);
    const col = (y % 6 < 1) ? shade(o.roof, -0.3) : (y % 6 < 2 ? shade(o.roof, 0.18) : o.roof);
    rect(inset, y, cw - inset * 2, 1, col, g);
    if (y % 6 >= 2) for (let x = inset + ((y / 6 | 0) % 2) * 4; x < cw - inset; x += 8) rect(x, y, 1, 1, shade(o.roof, -0.2), g);
  }
  rect(0, roofH - 2, cw, 2, shade(o.roof, -0.45), g);
  rect(0, 0, cw, 1, shade(o.roof, -0.45), g);
  // chimney
  if (o.chimney) { rect(cw - 30, 0, 8, 10, '#8a6a5a', g); rect(cw - 31, 0, 10, 2, '#5a4a3a', g); }
  // sign
  if (o.sign) {
    const sw = tw(o.sign) + 10, sx = Math.round(cw / 2 - sw / 2), sy = roofH - 16;
    rect(sx - 1, sy - 1, sw + 2, 13, '#1a1010', g); rect(sx, sy, sw, 11, o.signCol || '#8a5a2a', g);
    rect(sx, sy, sw, 1, shade(o.signCol || '#8a5a2a', 0.3), g);
    text(o.sign, sx + 5, sy + 2, '#fff8e0', '#2a1a10', g);
  }
  if (o.icon) o.icon(g, 8, roofH - 30);
  return c;
}
const houseCache = {};
function makeHouse(level, theme) {
  const k = level + '_' + theme; if (houseCache[k]) return houseCache[k];
  const th = THEMES[theme];
  let c;
  if (level === 0) {
    c = mkCanvas(96, 64); const g = c.getContext('2d');
    // grass hut
    rect(14, 30, 68, 34, '#a07848', g);
    for (let x = 16; x < 82; x += 4) rect(x, 30, 1, 34, '#7a5830', g);
    for (let y = 0; y < 34; y++) {
      const ins = Math.max(0, 34 - y) * 0.9;
      rect(6 + ins, y, 84 - ins * 2, 1, y % 4 === 0 ? '#a08a3a' : '#d8be60', g);
    }
    rect(4, 32, 88, 2, '#7a6a2a', g);
    rect(41, 46, 14, 18, '#2a1a10', g); rect(42, 47, 12, 17, '#5a3a1a', g);
    rect(22, 40, 10, 8, '#2a1a10', g); rect(23, 41, 8, 6, '#ffe08a', g);
    rect(64, 40, 10, 8, '#2a1a10', g); rect(65, 41, 8, 6, '#ffe08a', g);
  } else {
    const roofs = [null, '#c84a3a', '#3a78c8', '#8a4ac8'], walls = [null, '#f4ecd8', '#f8e8c0', '#e8f0ff'];
    c = makeBuilding(6, 4, { roof: roofs[level], wall: walls[level], chimney: level === 1, door: level === 3 ? '#c8a030' : '#7a4a24' });
    const g = c.getContext('2d');
    if (level >= 2) { rect(0, 30, 4, 34, shade(walls[level], -0.2), g); rect(92, 30, 4, 34, shade(walls[level], -0.2), g); }
    if (level === 3) { // palace: gold trims + towers
      for (const tx of [0, 84]) {
        rect(tx, 2, 12, 30, '#d8d0f0', g); rect(tx, 2, 12, 2, '#f0c040', g);
        for (let i = 0; i < 12; i += 4) rect(tx + i, 0, 2, 2, '#f0c040', g);
        rect(tx + 4, 10, 4, 6, '#6040a0', g);
      }
      rect(44, 0, 8, 6, '#f0c040', g); rect(47, -1, 2, 2, '#ff60a0', g);
    }
  }
  return (houseCache[k] = c);
}

// ============ Fish sprites ============
const fishCache = {};
function genFish(sp, L, Ht, pal) {
  const tail = Math.max(3, Math.round(L * 0.22)), bodyL = L - tail;
  const top = 2, rows = Ht + 4;
  const g = Array.from({ length: rows }, () => Array(L).fill('.'));
  const cx = bodyL / 2, cy = top + Ht / 2, rx = bodyL / 2, ry = Ht / 2;
  let topRow = rows, botRow = 0;
  for (let y = 0; y < rows; y++) for (let x = 0; x < bodyL; x++) {
    const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
    // slightly pointed head for long fish
    if (nx * nx + ny * ny > 1) continue;
    topRow = Math.min(topRow, y); botRow = Math.max(botRow, y);
    let ch = y + 0.5 > cy + ry * 0.3 ? 'L' : 'B';
    const hv = hash2(x * 7 + L, y * 13);
    switch (sp.pat) {
      case 'stripes': if (x % 4 === 2 && x > 2 && x < bodyL - 1 && ch === 'B') ch = 'D'; break;
      case 'spots': if (hv % 5 === 0 && ch === 'B') ch = 'D'; break;
      case 'scales': if ((x + y) % 3 === 0 && x % 2 === 0 && ch === 'B') ch = 'D'; break;
      case 'rainbow': if (Math.abs(y + 0.5 - cy) < 1) ch = 'R'; else if (hv % 7 === 0 && ch === 'B') ch = 'D'; break;
      case 'koi': if (hash2(x >> 2, y >> 2) % 3 === 0) ch = 'W'; break;
      case 'koi2': if (hash2(x >> 2, (y >> 2) + 9) % 3 === 0) ch = 'D'; break;
      case 'shine': if (hv % 7 === 0) ch = 'W'; break;
      case 'plates': if (y === Math.round(cy - ry * 0.45) && x % 3 === 0) ch = 'W'; break;
      case 'blotch': if (hash2(x >> 1, (y >> 1) + 3) % 4 === 0 && ch === 'B') ch = 'D'; break;
      case 'stars': if (hv % 9 === 0) ch = 'Y'; break;
      case 'eyespot': if (Math.abs(x - (bodyL - 4)) <= 1 && Math.abs(y + 0.5 - cy) <= 1) ch = (x === bodyL - 4 && Math.round(cy - 0.5) === y) ? 'Y' : 'E'; break;
    }
    g[y][x] = ch;
  }
  for (let x = bodyL - 1; x < L; x++) {
    const k = (x - (bodyL - 1)) / tail, spread = 0.8 + k * ry * 1.25;
    for (let y = 0; y < rows; y++) {
      const dy = Math.abs(y + 0.5 - cy);
      if (dy <= spread && !(k > 0.65 && dy < spread * 0.35) && g[y][x] === '.') g[y][x] = 'F';
    }
  }
  const f0 = Math.round(cx - rx * 0.45), f1 = Math.round(cx + rx * 0.35);
  for (let x = f0; x <= f1; x++) {
    if (topRow - 1 >= 0) g[topRow - 1][x] = 'F';
    if (topRow - 2 >= 0 && x < (f0 + f1) / 2) g[topRow - 2][x] = 'F';
  }
  for (let x = Math.round(cx); x <= Math.round(cx) + 1; x++) if (botRow + 1 < rows) g[botRow + 1][x] = 'F';
  const ex = Math.max(1, Math.round(cx - rx * 0.62)), ey = Math.round(cy - ry * 0.3);
  if (g[ey] && g[ey][ex] !== '.') g[ey][ex] = 'E';
  if (sp.whisk && rows > ey + 3) { g[ey + 2][0] = 'D'; if (g[ey + 3]) g[ey + 3][0] = 'D'; }
  if (sp.lure) { g[0][1] = 'Q'; g[1][2] = 'D'; }
  return makeSprite(g.map(r => r.join('')), pal);
}
function fishPal(sp) {
  return { B: sp.col, L: sp.belly, D: shade(sp.col, -0.35), F: sp.fin, E: '#101018', W: '#ffffff', R: '#e86a90', Y: '#f8f080', Q: '#80ffe0' };
}
const BOOT_ROWS = ['.....BBBBB..', '.....BBBBB..', '.....BBBBB..', '.....BBDBB..', '.....BBBBB..', '..BBBBBBBB..', 'BBBBBBBBBB..', 'LLLLLLLLLL..'];
function fishSprite(id, flip = false) {
  const key = id + (flip ? 'R' : 'L');
  if (fishCache[key]) return fishCache[key];
  let c;
  if (flip) c = flipH(fishSprite(id));
  else if (id === 'boot') c = makeSprite(BOOT_ROWS.map(r => r.split('').reverse().join('')), { B: '#7a5030', D: '#4a2a18', L: '#3a2a20' });
  else { const sp = FISH[id]; c = genFish(sp, sp.len, sp.ht, fishPal(sp)); }
  return (fishCache[key] = c);
}
function miniFish(id, flip = false) {
  const key = 'm' + id + (flip ? 'R' : 'L');
  if (fishCache[key]) return fishCache[key];
  let c;
  if (flip) c = flipH(miniFish(id));
  else if (id === 'boot') c = makeSprite(['..BB', '..BB', 'BBBB'], { B: '#7a5030' });
  else {
    const sp = FISH[id];
    c = genFish(Object.assign({}, sp, { pat: sp.pat === 'koi' || sp.pat === 'shine' ? sp.pat : 'none', whisk: false, lure: false }),
      clamp(Math.round(sp.len * 0.45), 7, 13), clamp(Math.round(sp.ht * 0.5), 4, 6), fishPal(sp));
  }
  return (fishCache[key] = c);
}

// ============ Objects art ============
function drawTank(type, sx, sy, fish, seed = 0) {
  // 32x32 footprint
  const water = '#3c8ad8', waterD = '#2a6ab8';
  // stand
  rect(sx + 2, sy + 24, 28, 8, '#5a3a20'); rect(sx + 2, sy + 24, 28, 1, '#8a5a30'); rect(sx + 4, sy + 26, 10, 4, '#4a2a18'); rect(sx + 18, sy + 26, 10, 4, '#4a2a18');
  let gx, gy, gw, gh;
  if (type === 'bowl') {
    pellipse(sx + 16, sy + 15, 11, 9, '#cfeaff'); pellipse(sx + 16, sy + 16, 10, 8, water); rect(sx + 7, sy + 8, 18, 3, '#cfeaff');
    rect(sx + 9, sy + 6, 14, 2, '#e8f8ff'); rect(sx + 10, sy + 21, 12, 2, '#e8d49a');
    gx = sx + 8; gy = sy + 11; gw = 16; gh = 10;
  } else {
    const frame = type === 'grand' ? '#c89a30' : type === 'dome' ? '#80c0e0' : type === 'reef' ? '#506878' : '#3a4a5a';
    if (type === 'dome') { pellipse(sx + 16, sy + 10, 14, 9, '#cfeaff'); pellipse(sx + 16, sy + 10, 13, 8, water); }
    rect(sx + 1, sy + (type === 'dome' ? 9 : 4), 30, type === 'dome' ? 16 : 21, frame);
    rect(sx + 2, sy + (type === 'dome' ? 10 : 5), 28, type === 'dome' ? 14 : 19, water);
    rect(sx + 2, sy + 5, 28, 2, type === 'dome' ? water : '#6aa8ec');
    rect(sx + 2, sy + 21, 28, 3, '#e8d49a'); rect(sx + 2, sy + 21, 28, 1, '#c8b070');
    if (type === 'reef' || type === 'grand' || type === 'dome') {
      rect(sx + 5, sy + 15, 2, 6, '#f06080'); rect(sx + 4, sy + 16, 1, 2, '#f06080'); rect(sx + 7, sy + 17, 1, 2, '#f06080');
      rect(sx + 24, sy + 14, 2, 7, '#f0a040'); rect(sx + 26, sy + 16, 1, 2, '#f0a040');
    }
    rect(sx + 12, sy + 13, 1, 8, '#40a050'); rect(sx + 13, sy + 15, 1, 6, '#50c060');
    if (type === 'grand') { rect(sx, sy + 3, 32, 2, '#f0d060'); rect(sx + 14, sy + 1, 4, 2, '#f0d060'); }
    gx = sx + 3; gy = sy + 7; gw = 26; gh = 13;
  }
  fish.forEach((f, i) => {
    const sp = 0.012 + (i % 3) * 0.004, ph = T * sp + i * 1.7 + seed;
    const img = miniFish(f.id), fx = gx + (Math.sin(ph) + 1) / 2 * (gw - img.width + 2) - 1;
    const fy = gy + ((i * 5 + seed * 3) % Math.max(1, gh - img.height + 2)) + Math.round(Math.sin(ph * 2.3));
    ctx.drawImage(Math.cos(ph) > 0 ? miniFish(f.id, true) : img, Math.round(fx), Math.round(fy));
  });
  // glass shine + bubbles
  rect(gx + 1, gy, 1, 4, 'rgba(255,255,255,0.6)');
  const b = (T / 2 + seed * 13) % 16; rect(gx + gw - 4, gy + gh - b, 1, 1, '#cfeaff');
}
function drawDecor(id, sx, sy) {
  switch (id) {
    case 'coral':
      pellipse(sx + 16, sy + 26, 14, 4, '#e8d49a');
      [[8, '#f06080'], [14, '#f0a040'], [20, '#a060e0'], [25, '#f06080']].forEach(([x, c], i) => {
        const hgt = 12 + (i % 2) * 6; rect(sx + x, sy + 26 - hgt, 2, hgt, c); rect(sx + x - 2, sy + 26 - hgt + 3, 2, 2, c); rect(sx + x + 2, sy + 26 - hgt + 6, 2, 2, c);
      });
      break;
    case 'statue':
      rect(sx + 6, sy + 22, 20, 8, '#8a8698'); rect(sx + 6, sy + 22, 20, 2, '#b8b4c8');
      pellipse(sx + 15, sy + 12, 8, 5, '#a8a4b8'); rect(sx + 22, sy + 6, 3, 12, '#a8a4b8'); rect(sx + 24, sy + 4, 3, 4, '#a8a4b8');
      rect(sx + 10, sy + 10, 2, 2, '#4a4858'); rect(sx + 14, sy + 17, 2, 5, '#a8a4b8');
      break;
    case 'fountain':
      pellipse(sx + 16, sy + 22, 14, 7, '#9894a8'); pellipse(sx + 16, sy + 21, 12, 5, '#4a90e0');
      rect(sx + 14, sy + 8, 4, 14, '#b8b4c8'); pellipse(sx + 16, sy + 8, 5, 2, '#b8b4c8');
      for (let i = 0; i < 6; i++) { const t = (T / 3 + i * 5) % 30; rect(sx + 16 + (i % 2 ? 1 : -1) * t / 3, sy + 4 + Math.abs(t - 12) / 2, 1, 1, '#cfeaff'); }
      break;
    case 'lighthouse':
      rect(sx + 10, sy - 12, 12, 42, '#f4f4f4');
      for (let y = -6; y < 30; y += 12) rect(sx + 10, sy + y, 12, 6, '#e04848');
      rect(sx + 8, sy - 16, 16, 4, '#303040'); rect(sx + 11, sy - 22, 10, 6, (T >> 4) % 2 ? '#fff8a0' : '#c0a040'); rect(sx + 9, sy - 24, 14, 2, '#303040');
      rect(sx + 14, sy + 22, 4, 8, '#5a3a20');
      break;
    case 'castle':
      rect(sx + 2, sy + 10, 28, 20, '#a0e8f8'); rect(sx + 2, sy + 10, 28, 2, '#e0f8ff');
      for (const tx of [0, 12, 24]) { rect(sx + tx, sy - 6 + (tx === 12 ? -6 : 0), 8, 18 + (tx === 12 ? 6 : 0), '#7ad0f0'); rect(sx + tx + 2, sy - 10 + (tx === 12 ? -6 : 0), 4, 4, '#c0f4ff'); }
      rect(sx + 13, sy + 20, 6, 10, '#3a6a9a');
      if ((T >> 3) % 3 === 0) rect(sx + 4, sy + 2, 1, 1, '#fff');
      break;
    case 'arch':
      for (let a = 0; a <= 12; a++) { const ang = Math.PI * a / 12; rect(sx + 16 - Math.cos(ang) * 12 - 2, sy + 26 - Math.sin(ang) * 20, 5, 5, a % 2 ? '#f8c8d8' : '#f0a8b8'); }
      break;
  }
}
function drawPortal(sx, sy, w = 32) {
  const cx = sx + w / 2, cy = sy + 9;
  pellipse(cx, cy + 1, w / 2 - 1, 6, '#2a2050');
  for (let i = 0; i < 4; i++) {
    const r = ((T / 3 + i * 4) % 16) / 16;
    pring(cx, cy, (w / 2 - 2) * r, 5 * r, ['#80f0ff', '#c080ff', '#ffffff', '#60a0ff'][i]);
  }
  for (let i = 0; i < 3; i++) { const t = (T + i * 20) % 60; rect(cx - 8 + i * 8, cy - t / 4, 1, 2, '#c0f8ff'); }
}
function makeWheelCanvas(R, segs) {
  const S = R * 2 + 4, c = mkCanvas(S, S), g = c.getContext('2d');
  const n = segs.length;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = x + 0.5 - S / 2, dy = y + 0.5 - S / 2, r = Math.sqrt(dx * dx + dy * dy);
    if (r > R) continue;
    let col;
    if (r > R - 3) col = r > R - 1 ? '#3a2408' : '#f0c040';
    else if (r < R * 0.16) col = r < R * 0.16 - 2 ? '#f0c040' : '#3a2408';
    else {
      let a = Math.atan2(dy, dx); if (a < 0) a += Math.PI * 2;
      const f = a / (Math.PI * 2) * n, i = Math.floor(f), fr = f - i;
      col = (fr < 0.02 || fr > 0.98) ? '#f8f0d0' : segs[i].col;
    }
    g.fillStyle = col; g.fillRect(x, y, 1, 1);
  }
  return c;
}
function drawLamp(sx, sy) {
  rect(sx + 7, sy + 2, 2, 14, '#2a2a3a'); rect(sx + 5, sy + 14, 6, 2, '#2a2a3a');
  rect(sx + 4, sy - 6, 8, 8, '#2a2a3a'); rect(sx + 5, sy - 5, 6, 6, (T >> 5) % 8 ? '#ffe890' : '#fff4c0');
  rect(sx + 3, sy - 7, 10, 2, '#2a2a3a');
}
function drawSign(sx, sy) {
  rect(sx + 7, sy + 8, 2, 8, '#5a3a20');
  rect(sx + 2, sy + 1, 12, 9, '#2a1a10'); rect(sx + 3, sy + 2, 10, 7, '#b88a50');
  rect(sx + 5, sy + 4, 6, 1, '#6a4a28'); rect(sx + 5, sy + 6, 5, 1, '#6a4a28');
}
function drawPillar(sx, sy) {
  rect(sx + 3, sy - 12, 10, 28, '#9894a8'); rect(sx + 3, sy - 12, 10, 2, '#c8c4d8'); rect(sx + 1, sy - 14, 14, 3, '#b8b4c8');
  rect(sx + 3, sy + 12, 10, 4, '#6a6878'); rect(sx + 5, sy - 6, 2, 16, '#b0acc0');
}
function drawFlag(sx, sy, col) {
  rect(sx + 7, sy - 16, 2, 32, '#d0d0d8'); rect(sx + 6, sy - 18, 4, 2, '#f0c040');
  const wv = Math.floor(T / 10) % 2;
  rect(sx + 9, sy - 15 + wv, 12, 8, col); rect(sx + 9, sy - 15 + wv, 12, 1, shade(col, 0.3)); rect(sx + 19, sy - 13 + wv, 2, 4, shade(col, -0.25));
  rect(sx + 13, sy - 13 + wv, 3, 3, '#fff');
}
function drawPlot(sx, sy) {
  rect(sx + 2, sy + 4, 28, 26, '#8a6a48'); rect(sx + 3, sy + 5, 26, 24, '#a8865c');
  for (let i = 0; i < 5; i++) rect(sx + 5 + i * 5, sy + 8 + (i % 2) * 8, 2, 1, '#8a6a48');
  rect(sx + 15, sy + 12, 2, 8, '#f0e8c0'); rect(sx + 12, sy + 15, 8, 2, '#f0e8c0');
}
