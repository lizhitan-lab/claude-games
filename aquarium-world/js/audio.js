'use strict';
// ============ 16-bit style audio ============
// A small sample-style synth in the spirit of SNES sound: soft instruments with envelopes,
// a stereo reverb plus a feedback "echo" (the SPC700's signature), drums, and songs written
// as chords + melody, with bass, arpeggios and pads generated from the chords.
let AC = null, soundOn = true, musicOn = true;
const AU = {};
function audioUnlock() {
  if (!AC) {
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; return; }
    buildGraph();
  }
  if (AC.state === 'suspended') AC.resume();
}
function buildGraph() {
  const comp = AC.createDynamicsCompressor();
  comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.2;
  const master = AC.createGain(); master.gain.value = 0.9;
  comp.connect(master); master.connect(AC.destination);
  // reverb: synthetic stereo impulse (decaying noise)
  const len = Math.floor(AC.sampleRate * 2.2), ir = AC.createBuffer(2, len, AC.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
  const conv = AC.createConvolver(); conv.buffer = ir;
  const revOut = AC.createGain(); revOut.gain.value = 0.32; conv.connect(revOut); revOut.connect(comp);
  // echo: delay with filtered feedback
  const delay = AC.createDelay(1); delay.delayTime.value = 0.24;
  const fb = AC.createGain(); fb.gain.value = 0.32;
  const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
  delay.connect(lp); lp.connect(fb); fb.connect(delay);
  const echoOut = AC.createGain(); echoOut.gain.value = 0.5; lp.connect(echoOut); echoOut.connect(comp);
  const bus = (vol, rev, echo) => {
    const g = AC.createGain(); g.gain.value = vol; g.connect(comp);
    const r = AC.createGain(); r.gain.value = rev; g.connect(r); r.connect(conv);
    const e = AC.createGain(); e.gain.value = echo; g.connect(e); e.connect(delay);
    return g;
  };
  AU.music = bus(0.42, 0.55, 0.22);
  AU.sfx = bus(0.75, 0.3, 0.08);
  const nl = AC.sampleRate; AU.noise = AC.createBuffer(1, nl, AC.sampleRate);
  const nd = AU.noise.getChannelData(0); for (let i = 0; i < nl; i++) nd[i] = Math.random() * 2 - 1;
}
const midi = n => 440 * Math.pow(2, (n - 69) / 12);

// ---- building blocks ----
function osc(type, f, t, end, out, gain = 1, detune = 0) {
  const o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (detune) o.detune.value = detune;
  let node = o;
  if (gain !== 1) { const g = AC.createGain(); g.gain.value = gain; o.connect(g); node = g; }
  node.connect(out); o.start(t); o.stop(end + 0.05);
  return o;
}
function envGain(out, t, a, peak, hold, rel, sustain = 1) {
  const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.setTargetAtTime(peak * sustain, t + a, Math.max(0.01, hold / 3));
  g.gain.setTargetAtTime(0.0001, t + a + hold, rel / 4);
  g.connect(out); return g;
}
function filt(type, f, out, q = 0.7) { const b = AC.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; b.connect(out); return b; }
function noiseSrc(t, dur, out) { const s = AC.createBufferSource(); s.buffer = AU.noise; s.loop = true; s.connect(out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05); return s; }
function vibrato(o, t, f, depth, rate = 5.5, delay = 0.18) {
  const l = AC.createOscillator(), g = AC.createGain(); l.frequency.value = rate;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(f * depth, t + delay + 0.2);
  l.connect(g); g.connect(o.frequency); l.start(t); l.stop(t + 4);
}

// ---- instruments: (time, midi note, duration s, velocity 0..1, output) ----
const INST = {
  flute(t, n, d, v, out) {
    const f = midi(n), e = envGain(filt('lowpass', 3200, out), t, 0.05, v * 0.32, d, 0.18, 0.85);
    const o = osc('triangle', f, t, t + d + 0.3, e); osc('sine', f * 2, t, t + d + 0.3, e, 0.12);
    vibrato(o, t, f, 0.007);
    const br = AC.createGain(); br.gain.setValueAtTime(v * 0.02, t); br.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    br.connect(out); noiseSrc(t, 0.1, filt('bandpass', f * 2, br, 2));
  },
  brass(t, n, d, v, out) {
    const f = midi(n), lp = filt('lowpass', 500, out, 1.5);
    lp.frequency.setValueAtTime(400, t); lp.frequency.linearRampToValueAtTime(2600, t + 0.06); lp.frequency.setTargetAtTime(1500, t + 0.08, 0.15);
    const e = envGain(lp, t, 0.04, v * 0.2, d, 0.15, 0.8);
    const o = osc('sawtooth', f, t, t + d + 0.3, e); osc('sawtooth', f, t, t + d + 0.3, e, 0.6, 9);
    vibrato(o, t, f, 0.005, 5, 0.25);
  },
  strings(t, n, d, v, out) {
    const f = midi(n), e = envGain(filt('lowpass', 1500, out, 0.5), t, 0.22, v * 0.1, d, 0.5, 0.9);
    osc('sawtooth', f, t, t + d + 0.6, e, 1, -8); osc('sawtooth', f, t, t + d + 0.6, e, 1, 8); osc('triangle', f / 2, t, t + d + 0.6, e, 0.6);
  },
  harp(t, n, d, v, out) {
    const f = midi(n), dec = Math.max(1.2, d), g = AC.createGain();
    g.gain.setValueAtTime(v * 0.34, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dec); g.connect(out);
    osc('sine', f, t, t + dec, g); osc('triangle', f * 2, t, t + dec, g, 0.18); osc('sine', f * 3, t, t + 0.25, g, 0.08);
  },
  marimba(t, n, d, v, out) {
    const f = midi(n), g = AC.createGain();
    g.gain.setValueAtTime(v * 0.42, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); g.connect(out);
    osc('sine', f, t, t + 0.5, g);
    const h = AC.createGain(); h.gain.setValueAtTime(v * 0.18, t); h.gain.exponentialRampToValueAtTime(0.0001, t + 0.06); h.connect(out);
    osc('sine', f * 4, t, t + 0.08, h);
  },
  pluck(t, n, d, v, out) {
    const f = midi(n), lp = filt('lowpass', 3000, out, 1);
    lp.frequency.setValueAtTime(3500, t); lp.frequency.exponentialRampToValueAtTime(700, t + 0.25);
    const g = AC.createGain(); g.gain.setValueAtTime(v * 0.22, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7); g.connect(lp);
    osc('triangle', f, t, t + 0.7, g); osc('square', f, t, t + 0.7, g, 0.25);
  },
  piano(t, n, d, v, out) {
    const f = midi(n), g = AC.createGain(), dec = Math.max(0.8, d * 1.5);
    g.gain.setValueAtTime(v * 0.3, t); g.gain.exponentialRampToValueAtTime(v * 0.12, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    g.connect(filt('lowpass', 2800, out));
    osc('triangle', f, t, t + dec, g); osc('sine', f * 2, t, t + dec, g, 0.3); osc('square', f, t, t + 0.2, g, 0.06, 4);
  },
  bell(t, n, d, v, out) {
    const f = midi(n), g = AC.createGain();
    g.gain.setValueAtTime(v * 0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4); g.connect(out);
    osc('sine', f, t, t + 1.4, g); osc('sine', f * 2.76, t, t + 0.6, g, 0.35); osc('sine', f * 5.4, t, t + 0.25, g, 0.15);
  },
  bass(t, n, d, v, out) {
    const f = midi(n), lp = filt('lowpass', 900, out, 2);
    lp.frequency.setValueAtTime(1100, t); lp.frequency.exponentialRampToValueAtTime(380, t + 0.25);
    const e = envGain(lp, t, 0.008, v * 0.5, Math.min(d, 0.5), 0.08, 0.55);
    osc('triangle', f, t, t + d + 0.2, e); osc('sawtooth', f, t, t + d + 0.2, e, 0.35);
  },
  kick(t, v, out) {
    const o = AC.createOscillator(), g = AC.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    g.gain.setValueAtTime(v * 0.9, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.3);
  },
  snare(t, v, out) {
    const g = AC.createGain(); g.gain.setValueAtTime(v * 0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); g.connect(out);
    noiseSrc(t, 0.2, filt('bandpass', 2200, g, 0.8));
    const tg = AC.createGain(); tg.gain.setValueAtTime(v * 0.3, t); tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.08); tg.connect(out);
    osc('triangle', 190, t, t + 0.1, tg);
  },
  hat(t, v, out, open) {
    const g = AC.createGain(), len = open ? 0.25 : 0.045;
    g.gain.setValueAtTime(v * 0.22, t); g.gain.exponentialRampToValueAtTime(0.0001, t + len); g.connect(out);
    noiseSrc(t, len + 0.02, filt('highpass', 7500, g));
  },
};

// ---- songs ----
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function parseNote(s) { // "C#5" -> midi
  const m = /^([A-G])([#b]?)(\d)$/.exec(s); if (!m) return null;
  return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
function chordTones(sym) { // "F#m7" -> [root, third, fifth(, seventh)] as pitch classes
  const m = /^([A-G])([#b]?)(.*)$/.exec(sym); let r = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const q = m[3];
  const iv = q === 'm' ? [0, 3, 7] : q === 'm7' ? [0, 3, 7, 10] : q === '7' ? [0, 4, 7, 10] : q === 'maj7' ? [0, 4, 7, 11]
    : q === 'sus4' ? [0, 5, 7] : q === 'dim' ? [0, 3, 6] : [0, 4, 7];
  return iv.map(i => r + i);
}
const SONG_DEFS = {
  title: { bpm: 92, lead: 'flute', lead2: 'harp', pad: 'strings', arp: 'harp', arpStyle: 'up8', bass: 'bass', bassStyle: 'long', drums: ['k.......s.......', '....h.......h...'],
    chords: ['C', 'Am', 'F', 'G', 'C', 'Em', 'F G', 'C'],
    mel: 'E5:4 G5:4 C6:6 B5:2 | A5:8 E5:4 C5:4 | F5:4 A5:4 C6:4 A5:4 | G5:6 F5:2 E5:4 D5:4 | E5:4 G5:4 C6:6 D6:2 | E6:6 D6:2 B5:8 | C6:4 A5:4 B5:4 D6:4 | C6:12 -:4' },
  town: { bpm: 118, swing: 0.12, lead: 'marimba', lead2: 'flute', arp: 'pluck', arpStyle: 'off', bass: 'bass', bassStyle: 'pump', drums: ['k...s..kk...s...', 'h.h.h.h.h.h.h.hh'],
    chords: ['F', 'Dm', 'Bb', 'C', 'F', 'Dm', 'Gm C', 'F'],
    mel: 'C5:2 F5:2 A5:2 F5:2 C6:4 A5:4 | D5:2 F5:2 A5:2 D6:2 C6:4 A5:4 | Bb5:4 A5:2 G5:2 F5:4 D5:4 | E5:2 G5:2 C6:4 Bb5:4 G5:4 | A5:2 C6:2 A5:2 F5:2 C6:4 F6:4 | E6:2 D6:2 C6:2 A5:2 D6:8 | Bb5:4 G5:4 E5:4 G5:4 | F5:12 -:4' },
  home: { bpm: 78, lead: 'harp', pad: 'strings', arp: 'harp', arpStyle: 'broken', bass: 'bass', bassStyle: 'long', drums: null,
    chords: ['G', 'Em', 'C', 'D', 'G', 'Bm', 'C D', 'G'],
    mel: 'B4:4 D5:4 G5:8 | E5:4 G5:4 B5:8 | C6:6 B5:2 A5:4 G5:4 | F#5:8 A5:4 D5:4 | G5:4 B5:4 D6:8 | F#5:4 D5:4 B4:8 | E5:4 G5:4 F#5:4 A5:4 | G5:16' },
  map: { bpm: 132, lead: 'brass', lead2: 'flute', pad: 'strings', arp: 'pluck', arpStyle: 'up8', bass: 'bass', bassStyle: 'drive', drums: ['k..ks...k..ks.ss', 'h.h.h.h.h.h.h.h.'],
    chords: ['D', 'Bm', 'G', 'A', 'D', 'F#m', 'G A', 'D'],
    mel: 'D5:3 A4:1 D5:2 F#5:2 A5:6 F#5:2 | B5:4 A5:2 F#5:2 D5:8 | G5:3 B5:1 D6:4 B5:4 G5:4 | A5:6 G5:2 F#5:4 E5:4 | D5:3 A4:1 D5:2 F#5:2 A5:6 D6:2 | C#6:4 A5:4 F#5:8 | G5:4 B5:4 A5:4 C#6:4 | D6:12 -:4' },
  fish: { bpm: 90, lead: 'flute', arp: 'pluck', arpStyle: 'broken', bass: 'bass', bassStyle: 'long', pad: 'strings', drums: ['k.......k.......', '....h.......h..h'],
    chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E'],
    mel: 'E5:6 A5:2 C6:8 | A5:4 G5:4 F5:8 | E5:6 G5:2 C6:4 B5:4 | D5:12 -:4 | E5:6 A5:2 C6:4 E6:4 | D6:4 C6:4 A5:8 | B5:4 G5:4 D5:4 G5:4 | G#5:12 -:4' },
  shop: { bpm: 112, swing: 0.16, lead: 'piano', lead2: 'marimba', arp: 'piano', arpStyle: 'off', bass: 'bass', bassStyle: 'walk', drums: ['k...s...k.k.s...', 'h.hhh.hhh.hhh.hh'],
    chords: ['C', 'A7', 'Dm', 'G7', 'C', 'A7', 'Dm G7', 'C'],
    mel: 'G5:3 E5:1 G5:2 C6:2 E6:4 C6:4 | C#6:2 E6:2 A5:4 G5:4 E5:4 | F5:2 A5:2 D6:4 C6:2 A5:2 F5:4 | G5:2 B5:2 D6:2 F6:2 E6:4 D6:4 | E6:3 C6:1 G5:2 E5:2 G5:4 C6:4 | A5:2 C#6:2 E6:4 G6:4 E6:4 | F6:4 D6:4 B5:4 G5:4 | C6:12 -:4' },
};
// compile a song into per-step events: {step, kind, inst, note, len, vel}
function compileSong(def) {
  const ev = [], bars = def.chords.length, steps = bars * 16;
  const add = (step, inst, note, len, vel) => ev.push({ step, inst, note, len, vel });
  // melody (lead2 doubles an octave down, quieter, from the second half)
  let pos = 0;
  def.mel.split('|').forEach((bar, bi) => {
    let p = 0;
    bar.trim().split(/\s+/).forEach(tok => {
      const [n, l] = tok.split(':'), len = +l;
      if (n !== '-') {
        const m = parseNote(n);
        add(bi * 16 + p, def.lead, m, len, 0.9);
        if (def.lead2 && bi >= bars / 2) add(bi * 16 + p, def.lead2, m - 12, len, 0.45);
      }
      p += len;
    });
    if (p !== 16) console.warn('song bar length', bi, p);
  });
  // harmony from chords (a bar may hold two chords: "Gm C")
  def.chords.forEach((cs, bi) => {
    const parts = cs.split(' '), each = 16 / parts.length;
    parts.forEach((sym, ci) => {
      const tones = chordTones(sym), root = tones[0], s0 = bi * 16 + ci * each;
      const bassRoot = 36 + ((root % 12) + 12) % 12, fifth = bassRoot + 7;
      if (def.bass) {
        const B = def.bassStyle;
        if (B === 'long') { add(s0, def.bass, bassRoot, each, 0.8); }
        else if (B === 'pump') { for (const [o, n] of [[0, bassRoot], [6, bassRoot], [8, fifth], [12, bassRoot + 12]]) if (o < each) add(s0 + o, def.bass, n, 2, 0.8); }
        else if (B === 'drive') { for (let o = 0; o < each; o += 2) add(s0 + o, def.bass, o % 8 === 6 ? fifth : bassRoot, 2, o % 4 ? 0.6 : 0.85); }
        else if (B === 'walk') { const w = [bassRoot, bassRoot + (tones[1] - root), fifth, bassRoot + 9]; for (let o = 0, k = 0; o < each; o += 4, k++) add(s0 + o, def.bass, w[k % 4], 4, 0.8); }
      }
      if (def.pad) for (const t of tones.slice(0, 3)) add(s0, def.pad, 60 + ((t % 12) + 12) % 12 - (t % 12 > 7 ? 12 : 0), each, 0.6);
      if (def.arp) {
        const ch = tones.slice(0, 3).map(t => 60 + ((t % 12) + 12) % 12);
        if (def.arpStyle === 'up8') { const seq = ch.concat(ch.map(x => x + 12)); for (let o = 0, k = 0; o < each; o += 2, k++) add(s0 + o, def.arp, seq[k % seq.length], 2, 0.5); }
        else if (def.arpStyle === 'broken') { const seq = [ch[0], ch[2], ch[1] + 12, ch[2]]; for (let o = 0, k = 0; o < each; o += 2, k++) add(s0 + o, def.arp, seq[k % 4] - 12, 3, 0.5); }
        else if (def.arpStyle === 'off') { for (let o = 2; o < each; o += 4) for (const n of ch) add(s0 + o, def.arp, n, 1, 0.38); }
      }
    });
  });
  if (def.drums) for (let s = 0; s < steps; s++) for (const line of def.drums) {
    const c = line[s % 16]; if (c !== '.') ev.push({ step: s, drum: c, vel: s % 4 === 0 ? 0.9 : 0.6 });
  }
  ev.sort((a, b) => a.step - b.step);
  return { ev, steps, stepDur: 60 / def.bpm / 4, swing: def.swing || 0 };
}
const SONGS = {};
for (const k in SONG_DEFS) SONGS[k] = compileSong(SONG_DEFS[k]);

let curSong = null, songStep = 0, songIdx = 0, nextStepT = 0;
function playSong(name) { if (curSong === name) return; curSong = name; songStep = 0; songIdx = 0; nextStepT = 0; }
function musicTick() {
  if (!AC || !AU.music || !musicOn || !curSong) return;
  const S = SONGS[curSong];
  if (nextStepT < AC.currentTime) nextStepT = AC.currentTime + 0.05;
  while (nextStepT < AC.currentTime + 0.15) {
    const st = songStep % S.steps;
    if (st === 0) songIdx = 0;
    const t = nextStepT + (st % 4 === 2 ? S.swing * S.stepDur * 2 : 0);
    while (songIdx < S.ev.length && S.ev[songIdx].step === st) {
      const e = S.ev[songIdx++];
      try {
        if (e.drum) {
          if (e.drum === 'k') INST.kick(t, e.vel * 0.8, AU.music);
          else if (e.drum === 's') INST.snare(t, e.vel * 0.7, AU.music);
          else if (e.drum === 'h' || e.drum === 'o') INST.hat(t, e.vel * 0.6, AU.music, e.drum === 'o');
        } else INST[e.inst](t, e.note, e.len * S.stepDur * 0.95, e.vel, AU.music);
      } catch (err) {}
    }
    nextStepT += S.stepDur; songStep++;
  }
}

// ---- sound effects ----
function sNote(inst, n, when, d, v) { INST[inst](AC.currentTime + when, n, d, v, AU.sfx); }
function sNoise(when, dur, type, f, v, f2) {
  const t = AC.currentTime + when, g = AC.createGain();
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); g.connect(AU.sfx);
  const fl = filt(type, f, g, 1); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
  noiseSrc(t, dur, fl);
}
const SFX = {
  blip: () => sNote('marimba', 88, 0, 0.05, 0.35),
  ok: () => { sNote('marimba', 84, 0, 0.05, 0.4); sNote('marimba', 91, 0.05, 0.05, 0.4); },
  cancel: () => { sNote('marimba', 79, 0, 0.05, 0.4); sNote('marimba', 72, 0.05, 0.05, 0.35); },
  err: () => { sNote('brass', 43, 0, 0.12, 0.6); sNote('brass', 42, 0.13, 0.12, 0.6); },
  coin: () => { sNote('bell', 88, 0, 0.1, 0.5); sNote('bell', 95, 0.07, 0.3, 0.5); },
  cast: () => sNoise(0, 0.35, 'bandpass', 600, 0.5, 3000),
  splash: () => { sNoise(0, 0.5, 'lowpass', 2500, 0.7, 300); sNote('bass', 40, 0, 0.1, 0.5); sNoise(0.08, 0.3, 'highpass', 4000, 0.15); },
  nibble: () => sNote('marimba', 81, 0, 0.04, 0.25),
  bite: () => { sNote('bell', 91, 0, 0.1, 0.6); sNote('bell', 96, 0.09, 0.2, 0.6); },
  catch: () => [72, 76, 79, 84].forEach((n, i) => { sNote('brass', n, i * 0.09, i === 3 ? 0.5 : 0.08, 0.6); }),
  rare: () => { [72, 76, 79, 84, 88, 91].forEach((n, i) => sNote('brass', n, i * 0.08, i === 5 ? 0.7 : 0.07, 0.6)); [96, 100, 103].forEach((n, i) => sNote('bell', n, 0.5 + i * 0.08, 0.3, 0.35)); },
  fail: () => [67, 64, 60].forEach((n, i) => sNote('flute', n, i * 0.14, 0.13, 0.7)),
  level: () => { [72, 76, 79, 84, 79, 84, 88].forEach((n, i) => sNote('brass', n, i * 0.08, i === 6 ? 0.6 : 0.07, 0.6)); [60, 64, 67].forEach(n => sNote('strings', n, 0.5, 0.6, 0.8)); },
  tick: () => INST.hat(AC.currentTime, 0.7, AU.sfx),
  reel: () => sNoise(0, 0.025, 'bandpass', 1800 + Math.random() * 400, 0.25),
  warp: () => { [60, 64, 67, 72, 76, 79, 84, 88].forEach((n, i) => sNote('harp', n, i * 0.05, 0.3, 0.4)); sNoise(0, 0.8, 'bandpass', 400, 0.2, 4000); },
  door: () => { sNote('bass', 45, 0, 0.08, 0.6); sNote('pluck', 64, 0.06, 0.1, 0.4); },
  bump: () => sNote('bass', 38, 0, 0.05, 0.4),
};
function sfx(n) { if (soundOn && AC && AU.sfx && SFX[n]) { try { SFX[n](); } catch (e) {} } }
