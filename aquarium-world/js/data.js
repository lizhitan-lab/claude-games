'use strict';
// ============ Game data ============
const RODS = {
  bamboo: { name: 'Bamboo Rod', price: 0, power: 1, zone: 0, color: '#c8a050', desc: 'A trusty starter rod. Nothing fancy.' },
  fiber: { name: 'Fiberglass Rod', price: 400, power: 2, zone: 7, color: '#e0e0e8', desc: 'Light and flexible. Bigger catch bar.' },
  carbon: { name: 'Carbon Rod', price: 1500, power: 4, zone: 13, color: '#404048', desc: 'Strong carbon fiber. Reels in faster.' },
  titan: { name: 'Titanium Rod', price: 4500, power: 6, zone: 20, color: '#a0c8e0', desc: 'Pro-grade rod for tough, wild fish.' },
  leviathan: { name: 'Leviathan Rod', price: 12000, power: 9, zone: 30, color: '#f0c040', desc: 'Legendary rod said to tame any beast.' },
};
const BAITS = {
  worm: { name: 'Worm', price: 5, bite: 1.0, tier: 0, rare: 0, color: '#d07080', desc: 'Cheap and reliable. Small fish love it.' },
  cricket: { name: 'Cricket', price: 12, bite: 0.88, tier: 1, rare: 0.005, color: '#605030', desc: 'Lively bait. Slightly faster bites.' },
  shrimp: { name: 'Shrimp', price: 25, bite: 0.76, tier: 2, rare: 0.012, color: '#f09060', desc: 'Attracts bigger, pickier fish.' },
  minnow: { name: 'Minnow Lure', price: 60, bite: 0.66, tier: 3, rare: 0.022, color: '#c0d0e0', desc: 'Predators cannot resist a minnow.' },
  glow: { name: 'Glow Bait', price: 150, bite: 0.56, tier: 4, rare: 0.04, color: '#80ffc0', desc: 'Glows in deep water. Rare fish notice.' },
  golden: { name: 'Golden Lure', price: 500, bite: 0.46, tier: 5, rare: 0.08, color: '#ffd040', desc: 'Shimmering lure. Legends whisper of it.' },
};
const NO_BAIT = { name: 'No Bait', bite: 1.8, tier: -1, rare: -0.01, desc: 'Fish rarely bite a bare hook.' };

const GEAR = {
  strawhat: { name: 'Straw Hat', slot: 'head', price: 200, focus: 1, color: '#e8c860', hat: 'straw', desc: 'Keeps the sun off. Helps you focus.' },
  sailor: { name: 'Sailor Cap', slot: 'head', price: 800, focus: 2, luck: 1, color: '#f4f4f8', hat: 'cap', desc: 'A crisp cap worn by old sea dogs.' },
  captain: { name: 'Captain Hat', slot: 'head', price: 3000, focus: 4, luck: 2, color: '#28366a', hat: 'cap', desc: 'Commands respect from fish and folk.' },
  crown: { name: 'Crown of Tides', slot: 'head', price: 10000, focus: 6, luck: 4, color: '#f0d040', hat: 'crown', desc: 'A royal crown that hums with the tide.' },
  vest: { name: 'Fishing Vest', slot: 'body', price: 300, stamina: 1, color: '#5a9a4a', desc: 'Many pockets. Line slips less.' },
  leather: { name: 'Leather Armor', slot: 'body', price: 1000, stamina: 2, power: 1, color: '#9a6232', desc: 'Sturdy leather for long fights.' },
  scale: { name: 'Scale Mail', slot: 'body', price: 3500, stamina: 4, power: 2, color: '#3a96a8', desc: 'Forged from shed dragonfish scales.' },
  abyssal: { name: 'Abyssal Plate', slot: 'body', price: 11000, stamina: 6, power: 3, color: '#4a2e86', desc: 'Armor from the deepest trench.' },
  knife: { name: 'Fish Knife', slot: 'weapon', price: 250, power: 1, desc: 'A sharp knife. Cuts line tension.' },
  harpoon: { name: 'Harpoon', slot: 'weapon', price: 1200, power: 2, luck: 1, desc: 'Lends power to every pull.' },
  trident: { name: 'Trident', slot: 'weapon', price: 4500, power: 4, luck: 2, desc: 'Three prongs, three times the might.' },
  spear: { name: "Poseidon's Spear", slot: 'weapon', price: 14000, power: 6, luck: 4, desc: 'Wielded by the ocean king himself.' },
  charm: { name: 'Lucky Charm', slot: 'charm', price: 0, luck: 3, noShop: true, desc: 'A clover charm from the Prize Wheel.' },
};
const SLOTS = [['head', 'Head'], ['body', 'Body'], ['weapon', 'Weapon'], ['charm', 'Charm']];

const TANKS = {
  bowl: { name: 'Fish Bowl', price: 300, cap: 2, mult: 1.0, desc: 'A cozy bowl. Holds 2 fish.' },
  glass: { name: 'Glass Tank', price: 900, cap: 4, mult: 1.2, desc: 'Classic tank. Holds 4 fish. x1.2 visitors.' },
  reef: { name: 'Reef Tank', price: 2500, cap: 6, mult: 1.5, desc: 'Living coral! Holds 6 fish. x1.5 visitors.' },
  grand: { name: 'Grand Aquarium', price: 7000, cap: 10, mult: 2.0, desc: 'A showpiece. Holds 10 fish. x2 visitors.' },
  dome: { name: 'Ocean Dome', price: 20000, cap: 16, mult: 3.0, desc: 'A glass dome sea. Holds 16 fish. x3!' },
};
const MAX_TANKS = 8;
const DECOR = {
  coral: { name: 'Coral Garden', price: 500, bonus: 4, spot: 4, desc: 'Colorful coral. +4 AC a day.' },
  statue: { name: 'Fish Statue', price: 1500, bonus: 10, spot: 1, desc: 'A proud stone fish. +10 AC a day.' },
  fountain: { name: 'Fountain', price: 3500, bonus: 22, spot: 2, desc: 'Splashing fountain. +22 AC a day.' },
  lighthouse: { name: 'Lighthouse', price: 8000, bonus: 45, spot: 3, desc: 'Guides visitors in. +45 AC a day.' },
  castle: { name: 'Crystal Castle', price: 16000, bonus: 90, spot: 0, desc: 'A sparkling castle. +90 AC a day.' },
  arch: { name: 'Shell Arch', price: 1000, bonus: 7, spot: 5, desc: 'A seashell archway. +7 AC a day.' },
};
const HOUSES = [
  { name: 'Grass Hut', price: 0, bonus: 0 },
  { name: 'Cozy Cottage', price: 2000, bonus: 8, desc: 'Upgrade your hut to a cottage. +8 AC a day.' },
  { name: 'Seaside Villa', price: 6500, bonus: 25, desc: 'A breezy villa. +25 AC a day.' },
  { name: 'Coral Palace', price: 18000, bonus: 70, desc: 'A palace fit for a fish king. +70 AC a day.' },
];
const THEMES = [
  { name: 'Kelp Meadow', grass: '#4fa45a', dark: '#3c8648', light: '#74c070', tree: '#2a7a4a', treeL: '#48a060', trunk: '#6a4424', path: '#cdb486', pathD: '#a88e60', flower: ['#f0f070', '#f8f8f8'] },
  { name: 'Coral Isle', grass: '#e8d092', dark: '#cdb070', light: '#f8e6b4', tree: '#d8506c', treeL: '#f28aa0', trunk: '#8a5a30', path: '#f4ecd8', pathD: '#d0c4a8', flower: ['#ff7088', '#60c8f0'] },
  { name: 'Moonlit Bay', grass: '#3c4c8e', dark: '#2c3872', light: '#5868b0', tree: '#1e2a5e', treeL: '#4a62a8', trunk: '#3a3050', path: '#8c90b8', pathD: '#6a6e98', flower: ['#f8f0a0', '#a0e8ff'] },
  { name: 'Sakura Grove', grass: '#76b45a', dark: '#5c9448', light: '#98d078', tree: '#e488aa', treeL: '#f8c0d6', trunk: '#6a4030', path: '#d8c09a', pathD: '#b49a70', flower: ['#ffb0d0', '#ffffff'] },
];
const FLAG_COLORS = [['Ocean Blue', '#3070e0'], ['Coral Red', '#e04848'], ['Kelp Green', '#40b050'], ['Sun Gold', '#f0c030'], ['Royal Purple', '#9050d0'], ['Pearl White', '#f0f0f0']];

// Fish species. d = difficulty (1-10). w = spawn weight. beh = movement behaviour.
// shape: len/ht (sprite px), col/belly/fin colours, pat pattern
const FISH = {
  boot: { name: 'Old Boot', min: 25, max: 32, val: 2, d: 0.5, beh: 'smooth', junk: true, desc: 'Someone lost this... a long time ago.' },
  // Willow Pond
  bluegill: { name: 'Bluegill', min: 12, max: 24, val: 12, d: 1, w: 40, beh: 'smooth', len: 16, ht: 11, col: '#4a7ab8', belly: '#f0b048', fin: '#2a4a88', pat: 'stripes' },
  perch: { name: 'Yellow Perch', min: 15, max: 32, val: 20, d: 2, w: 32, beh: 'smooth', len: 18, ht: 9, col: '#d0b830', belly: '#f8ecb0', fin: '#e07030', pat: 'stripes' },
  carp: { name: 'Common Carp', min: 30, max: 75, val: 34, d: 3, w: 22, beh: 'sinker', len: 22, ht: 11, col: '#a8823a', belly: '#e8d090', fin: '#7a5420', pat: 'scales' },
  catfish: { name: 'Channel Catfish', min: 40, max: 95, val: 52, d: 4, w: 14, beh: 'sinker', len: 24, ht: 9, col: '#6e7084', belly: '#d8d8e0', fin: '#4a4c5e', pat: 'spots', whisk: true },
  koi: { name: 'Golden Koi', min: 45, max: 85, val: 480, d: 6, beh: 'dart', rare: true, len: 22, ht: 11, col: '#f4a420', belly: '#fff0c0', fin: '#f8f8f8', pat: 'koi' },
  // Crystal Lake
  trout: { name: 'Rainbow Trout', min: 30, max: 62, val: 46, d: 3, w: 36, beh: 'smooth', len: 22, ht: 9, col: '#7aa074', belly: '#f0f0e0', fin: '#5a8058', pat: 'rainbow' },
  pike: { name: 'Northern Pike', min: 50, max: 115, val: 78, d: 5, w: 26, beh: 'dart', len: 28, ht: 8, col: '#5a8a50', belly: '#e0e8c0', fin: '#a07040', pat: 'spots' },
  salmon: { name: 'Silver Salmon', min: 50, max: 92, val: 95, d: 5, w: 20, beh: 'floater', len: 24, ht: 10, col: '#a8b8c8', belly: '#f8d8d8', fin: '#7088a0', pat: 'spots' },
  sturgeon: { name: 'Lake Sturgeon', min: 80, max: 190, val: 145, d: 6, w: 12, beh: 'sinker', len: 30, ht: 9, col: '#6a6058', belly: '#c8c0b0', fin: '#4a4038', pat: 'plates' },
  arowana: { name: 'Crystal Arowana', min: 60, max: 115, val: 950, d: 8, beh: 'dart', rare: true, len: 28, ht: 10, col: '#b0f0ff', belly: '#ffffff', fin: '#60c0f0', pat: 'shine' },
  // Misty Marsh
  loach: { name: 'Mud Loach', min: 15, max: 32, val: 55, d: 3, w: 34, beh: 'sinker', len: 22, ht: 7, col: '#7a6a40', belly: '#c8b880', fin: '#5a4a28', pat: 'spots', whisk: true },
  gar: { name: 'Longnose Gar', min: 60, max: 155, val: 125, d: 6, w: 26, beh: 'dart', len: 30, ht: 7, col: '#6a8048', belly: '#d8d8a8', fin: '#4a5830', pat: 'spots' },
  snakehead: { name: 'Snakehead', min: 40, max: 105, val: 175, d: 7, w: 20, beh: 'dart', len: 28, ht: 9, col: '#4a5038', belly: '#a8a888', fin: '#2e3424', pat: 'blotch' },
  bowfin: { name: 'Bowfin', min: 40, max: 92, val: 200, d: 7, w: 14, beh: 'floater', len: 26, ht: 10, col: '#5a6a38', belly: '#c8d0a0', fin: '#304020', pat: 'eyespot' },
  leviathan: { name: 'Marsh Leviathan', min: 150, max: 320, val: 1650, d: 9, beh: 'wild', rare: true, len: 32, ht: 12, col: '#2a4a30', belly: '#7aa070', fin: '#a03028', pat: 'blotch' },
  // Moonfall Lake
  starfin: { name: 'Starfin', min: 20, max: 42, val: 165, d: 6, w: 34, beh: 'dart', len: 18, ht: 10, col: '#28306a', belly: '#4858a0', fin: '#f0e070', pat: 'stars' },
  ghostpike: { name: 'Ghost Pike', min: 70, max: 145, val: 290, d: 8, w: 26, beh: 'dart', len: 28, ht: 8, col: '#d8e0f0', belly: '#ffffff', fin: '#a0b0d0', pat: 'none' },
  lunarkoi: { name: 'Lunar Koi', min: 40, max: 92, val: 390, d: 8, w: 20, beh: 'floater', len: 22, ht: 11, col: '#c8c0e8', belly: '#f8f0ff', fin: '#8070c0', pat: 'koi2' },
  angler: { name: 'Abyss Angler', min: 50, max: 125, val: 500, d: 9, w: 12, beh: 'sinker', len: 22, ht: 13, col: '#202030', belly: '#383850', fin: '#101018', pat: 'none', lure: true },
  dragonfish: { name: 'Celestial Dragonfish', min: 150, max: 320, val: 4400, d: 10, beh: 'wild', rare: true, len: 32, ht: 11, col: '#f0c040', belly: '#fff4c0', fin: '#a050f0', pat: 'shine' },
};
const LAKES = [
  { id: 'willow', name: 'Willow Pond', lv: 1, fish: ['bluegill', 'perch', 'carp', 'catfish'], rare: 'koi', mx: 74, my: 150, water: '#3a9a9a', desc: 'A calm pond shaded by willows. Great for beginners.' },
  { id: 'crystal', name: 'Crystal Lake', lv: 5, fish: ['trout', 'pike', 'salmon', 'sturgeon'], rare: 'arowana', mx: 248, my: 146, water: '#3a90e0', desc: 'Clear mountain water fed by glaciers.' },
  { id: 'marsh', name: 'Misty Marsh', lv: 10, fish: ['loach', 'gar', 'snakehead', 'bowfin'], rare: 'leviathan', mx: 78, my: 62, water: '#5a7a48', desc: 'Murky, foggy waters. Fierce fish lurk here.' },
  { id: 'moonfall', name: 'Moonfall Lake', lv: 15, fish: ['starfin', 'ghostpike', 'lunarkoi', 'angler'], rare: 'dragonfish', mx: 244, my: 54, water: '#4a3a9a', desc: 'A lake where the moon fell. Only for experts.' },
];

const MAX_COOLER = 40;
const SAVE_KEY = 'aquariumWorldSave_v1';
const MAX_LEVEL = 40;

// ============ State ============
let G = null;
function newGame(gender, name) {
  G = {
    v: 1,
    player: {
      gender, name, level: 1, xp: 0, ac: 0,
      rods: ['bamboo'], rod: 'bamboo', baits: { worm: 10 }, bait: 'worm',
      gear: [], equip: { head: null, body: null, weapon: null, charm: null },
    },
    world: { name: 'Coralia', theme: 0, flag: 0, house: 0, tanks: [], decor: [] },
    cooler: [], log: {}, day: 1, lastCollect: 1, flags: {},
    stats: { caught: 0, earned: 0, spins: 0 },
    loc: { scene: 'city', x: 15, y: 4, dir: 'down' },
  };
}
// ============ Save slots ============
// Each slot is kept twice: in the player's private cloud area of the artifact's database
// (survives page updates, other devices, cleared browsers) and in this browser's storage
// (works offline / in the plain HTML file). Whichever copy is newer wins.
const SLOT_COUNT = 3;
let curSlot = 0;
const slots = new Array(SLOT_COUNT).fill(null);     // parsed save data per slot
let cloud = null, cloudUid = null;                  // set once the database answers
let saveStatus = 'local';                           // 'checking' | 'cloud' | 'local'
const slotKey = i => 'aquariumWorld_slot' + (i + 1);
function lsGet(k) { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function lsSet(k, json) { try { localStorage.setItem(k, json); return true; } catch (e) { return false; } }
let onSlotsChanged = () => {};
function initSaves() {
  // ask the browser not to clear this site's storage when space runs low
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  for (let i = 0; i < SLOT_COUNT; i++) slots[i] = lsGet(slotKey(i));
  const old = lsGet(SAVE_KEY); // single save from earlier versions -> slot 1
  if (old && !slots[0]) { old.savedAt = old.savedAt || 1; slots[0] = old; lsSet(slotKey(0), JSON.stringify(old)); }
  if (!(window.claude && typeof window.claude.use === 'function')) return;
  saveStatus = 'checking';
  (async () => {
    const giveUp = new Promise(r => setTimeout(() => r(null), 10000));
    try {
      const got = await Promise.race([Promise.all([claude.use('db'), claude.use('user')]), giveUp]);
      const db = got && got[0], user = got && got[1];
      const uid = db && user ? await user.id() : null;
      if (!uid) { saveStatus = 'local'; onSlotsChanged(); return; }
      const docs = await Promise.all(slots.map((_, i) => db.doc('data/users/' + uid + '/slot' + (i + 1)).get()));
      cloud = db; cloudUid = uid; saveStatus = 'cloud';
      docs.forEach((d, i) => {
        const body = d.exists ? d.data() : null;
        let remote = null;
        try { remote = body && typeof body.json === 'string' ? JSON.parse(body.json) : null; } catch (e) {}
        const local = slots[i];
        if (remote && (!local || (remote.savedAt || 0) >= (local.savedAt || 0))) { slots[i] = remote; lsSet(slotKey(i), body.json); }
        else if (local) cloudWrite(i, JSON.stringify(local)); // upload saves made before cloud was available
      });
    } catch (e) { saveStatus = cloud ? 'cloud' : 'local'; }
    onSlotsChanged();
  })();
}
const pending = {}, inflight = {};
function cloudWrite(i, json) {
  if (!cloud) return;
  pending[i] = json;
  if (inflight[i]) return; // the running write picks up the newest copy when it finishes
  inflight[i] = true;
  (async () => {
    while (pending[i]) {
      const j = pending[i]; pending[i] = null;
      const ref = cloud.doc('data/users/' + cloudUid + '/slot' + (i + 1));
      try { await ref.set({ json: j, savedAt: Date.now() }); }
      catch (e) {
        if (e && e.code === 'unavailable') { await new Promise(r => setTimeout(r, 800 + Math.random() * 800)); try { await ref.set({ json: j, savedAt: Date.now() }); } catch (e2) {} }
        else if (e && (e.code === 'invalid_argument' || e.code === 'revoked' || e.code === 'not_granted')) { cloud = null; saveStatus = 'local'; break; }
      }
    }
    inflight[i] = false;
  })();
}
function hasSave() { return slots.some(Boolean); }
function latestSlot() { let b = -1; slots.forEach((s, i) => { if (s && (b < 0 || (s.savedAt || 0) > (slots[b].savedAt || 0))) b = i; }); return b; }
function saveGame(i = curSlot) {
  if (!G) return false;
  curSlot = i; G.savedAt = Date.now();
  const json = JSON.stringify(G);
  slots[i] = JSON.parse(json);
  const ok = lsSet(slotKey(i), json);
  cloudWrite(i, json);
  return ok || !!cloud;
}
function loadGame(i = latestSlot()) {
  if (i < 0 || !slots[i]) return false;
  G = JSON.parse(JSON.stringify(slots[i])); curSlot = i;
  G.flags = G.flags || {}; G.stats = G.stats || { caught: 0, earned: 0, spins: 0 }; G.log = G.log || {};
  return true;
}
function slotSummary(s) {
  if (!s) return null;
  const where = s.loc && s.loc.scene === 'home' ? (s.world && s.world.name || 'Home') : 'Aquarium World';
  let when = '';
  if (s.savedAt > 1) {
    const d = new Date(s.savedAt), p2 = n => String(n).padStart(2, '0');
    when = 'JanFebMarAprMayJunJulAugSepOctNovDec'.substr(d.getMonth() * 3, 3) + ' ' + d.getDate() + ', ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
  }
  return { name: s.player.name, level: s.player.level, day: s.day, ac: s.player.ac, where, when, caught: (s.stats && s.stats.caught) || 0 };
}
function stats() {
  const s = { power: 0, focus: 0, stamina: 0, luck: 0 };
  for (const slot in G.player.equip) {
    const id = G.player.equip[slot]; if (!id) continue;
    const g = GEAR[id]; for (const k in s) s[k] += g[k] || 0;
  }
  return s;
}
const xpNeed = lv => Math.floor(22 * Math.pow(lv, 1.55));
function addXP(n) { // returns levels gained
  const p = G.player; let ups = 0; p.xp += n;
  while (p.level < MAX_LEVEL && p.xp >= xpNeed(p.level)) { p.xp -= xpNeed(p.level); p.level++; ups++; }
  if (p.level >= MAX_LEVEL) p.xp = 0;
  return ups;
}
function curBait() { const p = G.player; return p.bait && p.baits[p.bait] > 0 ? BAITS[p.bait] : NO_BAIT; }
function tankIncome(t) {
  const sum = t.fish.reduce((a, f) => a + f.value, 0);
  return sum * 0.06 * TANKS[t.type].mult;
}
function dailyIncome() {
  let inc = 0;
  for (const t of G.world.tanks) inc += tankIncome(t);
  for (const d of G.world.decor) inc += DECOR[d].bonus;
  inc += HOUSES[G.world.house].bonus;
  // set bonus: display every species of a lake
  return Math.round(inc);
}
function fishOfTheDay() {
  const ids = Object.keys(FISH).filter(k => !FISH[k].junk && !FISH[k].rare);
  return ids[hash2(G.day, 77) % ids.length];
}
function sellPrice(f) { return f.id === fishOfTheDay() ? Math.round(f.value * 1.5) : f.value; }
