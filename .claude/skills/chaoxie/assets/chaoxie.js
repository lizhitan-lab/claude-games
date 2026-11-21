/* 抄写练习 — trace once, write N times, then dictation + mistake book.
 * Reads its word list from window.CHAOXIE (written by build_page.py):
 *   { id, title, subtitle, repeats, dictation, words: [{ w, py?, en? }], pyFix: {word: pinyin} }
 */
(function () {
  'use strict';
  const S = window.CHAOXIE;
  const HW = window.HanziWriter;
  const PYLIB = window.pinyinPro;
  const REPEATS = Math.max(1, Math.min(10, S.repeats || 3));
  const WORDS = S.words.map((x) => (typeof x === 'string' ? { w: x } : x));

  /* ================= storage (device + optional private cloud copy) ================= */
  const KEY = 'chaoxie-' + S.id;
  const fresh = () => ({ v: 1, py: true, snd: true, auto: true, m: {}, best: {}, mistakes: {}, t: 0, sel: null, wdone: {} });
  let P;
  try { P = JSON.parse(localStorage.getItem(KEY)); } catch (e) { P = null; }
  if (!P || P.v !== 1) P = fresh();
  if (!P.wdone) P.wdone = {};
  let cloudRef = null, cloudTimer = 0, cloudBusy = false, cloudDirty = false;
  function save() {
    P.t = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* keep going in memory */ }
    if (cloudRef) { clearTimeout(cloudTimer); cloudTimer = setTimeout(pushCloud, 1500); }
  }
  function pushCloud() {
    if (!cloudRef) return;
    if (cloudBusy) { cloudDirty = true; return; }
    cloudBusy = true;
    cloudRef.set({ state: JSON.stringify(P), t: P.t || 0 }).catch(() => {})
      .finally(() => { cloudBusy = false; if (cloudDirty) { cloudDirty = false; pushCloud(); } });
  }
  async function cloudInit() {
    const cl = window.claude;
    if (!cl || typeof cl.use !== 'function') return;
    try {
      const [db, user] = await Promise.all([cl.use('db'), cl.use('user')]);
      if (!db || !user) return;
      const uid = await user.id();
      if (!uid) return;
      const ref = db.collection('data/users/' + uid).doc(('cx-' + S.id).slice(0, 120));
      const snap = await ref.get();
      let remoteT = -1;
      if (snap.exists) {
        const d = snap.data() || {};
        remoteT = +d.t || 0;
        let r = null;
        try { r = JSON.parse(d.state); } catch (e) { r = null; }
        if (r && r.v === 1 && remoteT > (P.t || 0) && !curKey) {
          P = r;
          try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* ignore */ }
          applyPy(); showHome();
        }
      }
      cloudRef = ref;
      if ((P.t || 0) > remoteT) pushCloud();
    } catch (e) { cloudRef = null; }
  }

  /* ================= helpers ================= */
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function h(tag, attrs, html) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'class') el.className = attrs[k];
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), attrs[k]);
      else el.setAttribute(k, attrs[k]);
    }
    if (html != null) el.innerHTML = html;
    return el;
  }
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const isHan = (c) => /\p{Script=Han}/u.test(c);
  const hanOf = (w) => [...w].filter(isHan);

  /* ================= pinyin ================= */
  const fix = Object.assign({}, S.pyFix || {});
  WORDS.forEach((x) => { if (x.py) fix[x.w] = x.py; });
  if (PYLIB && PYLIB.customPinyin && Object.keys(fix).length) {
    try { PYLIB.customPinyin(fix); } catch (e) { /* ignore */ }
  }
  const pyCache = new Map();
  function R(text) {
    text = String(text);
    if (pyCache.has(text)) return pyCache.get(text);
    let out;
    try {
      out = PYLIB.pinyin(text, { type: 'all' })
        .map((x) => (x.isZh ? `<ruby>${x.origin}<rt>${x.pinyin}</rt></ruby>` : esc(x.origin))).join('');
    } catch (e) { out = esc(text); }
    pyCache.set(text, out);
    return out;
  }
  function applyPy() { document.body.classList.toggle('no-py', !P.py); }

  /* ================= sound ================= */
  let zhVoice = null;
  function pickVoice() {
    if (!window.speechSynthesis) return;
    const vs = speechSynthesis.getVoices() || [];
    zhVoice = vs.find((v) => /zh[-_]CN/i.test(v.lang) && /Ting|Li-mu|Yu-shu/i.test(v.name))
      || vs.find((v) => /zh[-_]CN/i.test(v.lang)) || vs.find((v) => /^zh/i.test(v.lang)) || null;
  }
  if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(text) {
    if (!P.snd || !window.speechSynthesis || !text) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).replace(/\p{Extended_Pictographic}|️/gu, ''));
      u.lang = 'zh-CN'; if (zhVoice) u.voice = zhVoice; u.rate = 0.8;
      speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }
  let actx = null;
  function tone(freqs, dur) {
    if (!P.snd) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      let t = actx.currentTime;
      freqs.forEach((f) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
        t += dur * 0.8;
      });
    } catch (e) { /* ignore */ }
  }
  const sGood = () => tone([660, 880, 1175], 0.12);
  const sBad = () => tone([300, 220], 0.16);
  const sStroke = () => tone([990], 0.05);

  /* ================= guide: 芽芽博士 ================= */
  function guideSVG(mood) {
    const mouth = mood === 'sad'
      ? '<path d="M41 86 Q50 80 59 86" stroke="#2d2a32" stroke-width="3" fill="none" stroke-linecap="round"/>'
      : '<path d="M38 81 Q50 94 62 81 Q50 87 38 81Z" fill="#7a2e2e" stroke="#2d2a32" stroke-width="2" stroke-linejoin="round"/>';
    return `<svg class="guide" viewBox="0 0 100 112" aria-label="芽芽博士">
      <path d="M50 26 C47 15 40 8 28 7 C31 18 39 24 50 26Z" fill="#5cb83c" stroke="#3f8f2a" stroke-width="2"/>
      <path d="M50 26 C54 13 63 7 76 9 C71 20 62 25 50 26Z" fill="#86d65a" stroke="#3f8f2a" stroke-width="2"/>
      <path d="M50 26 L50 33" stroke="#3f8f2a" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="50" cy="70" rx="38" ry="39" fill="#a6e27c" stroke="#5aa23c" stroke-width="3"/>
      <path d="M17 86 Q24 106 50 108 Q76 106 83 86 L83 100 Q70 111 50 111 Q30 111 17 100Z" fill="#ffffff" stroke="#cfd8dc" stroke-width="2"/>
      <rect x="15" y="44" width="70" height="6" rx="3" fill="#3d8fd6"/>
      <circle cx="37" cy="47" r="10" fill="#d4efff" stroke="#3d8fd6" stroke-width="3"/>
      <circle cx="63" cy="47" r="10" fill="#d4efff" stroke="#3d8fd6" stroke-width="3"/>
      <circle cx="38" cy="68" r="8" fill="#fff"/><circle cx="62" cy="68" r="8" fill="#fff"/>
      <circle cx="39" cy="69" r="4.5" fill="#2d2a32"/><circle cx="63" cy="69" r="4.5" fill="#2d2a32"/>
      <circle cx="40.5" cy="67" r="1.6" fill="#fff"/><circle cx="64.5" cy="67" r="1.6" fill="#fff"/>
      <ellipse cx="25" cy="79" rx="6" ry="4" fill="#ff9fb0" opacity=".8"/><ellipse cx="75" cy="79" rx="6" ry="4" fill="#ff9fb0" opacity=".8"/>
      ${mouth}</svg>`;
  }

  /* ================= shared UI ================= */
  const app = document.getElementById('app');
  let curKey = null, rerender = () => {};

  function topbar(title, back, extra) {
    const bar = h('div', { class: 'topbar' });
    bar.append(
      back ? h('button', { class: 'icon-btn', 'aria-label': '返回', onclick: () => { if (window.speechSynthesis) speechSynthesis.cancel(); back(); } }, '⬅️') : h('span', { class: 'icon-btn ghost' }, ''),
      h('div', { class: 'title zh' }, R(title)),
      ...(extra ? [extra] : []),
      h('button', { class: 'icon-btn small' + (P.py ? ' on' : ''), 'aria-label': '拼音', onclick: (e) => { P.py = !P.py; save(); applyPy(); e.currentTarget.classList.toggle('on', P.py); } }, 'pīn'),
      h('button', { class: 'icon-btn', 'aria-label': '设置', onclick: openSettings }, '⚙️'),
    );
    return bar;
  }
  function bubble(text, en, opts) {
    opts = opts || {};
    const row = h('div', { class: 'guide-row' });
    row.innerHTML = guideSVG(opts.mood);
    const b = h('div', { class: 'bubble' });
    b.append(h('div', { class: 'zh' }, R(text)));
    const tools = h('div', { class: 'bubble-tools' });
    tools.append(h('button', { class: 'mini', 'aria-label': '朗读', onclick: () => speak(opts.say || text) }, '🔊'));
    let enEl = null;
    if (en) {
      enEl = h('div', { class: 'en' }, esc(en));
      tools.append(h('button', { class: 'mini', 'aria-label': 'English hint', onclick: () => enEl.classList.toggle('show') }, '?'));
    }
    b.append(tools); if (enEl) b.append(enEl);
    row.append(b);
    if (opts.autoSay !== false && P.auto) setTimeout(() => speak(opts.say || text), 120);
    return row;
  }
  function setMood(root, mood) {
    const g = root.querySelector('.guide'); if (!g) return;
    const n = h('div', null, guideSVG(mood)).firstElementChild; n.classList.add('bounce'); g.replaceWith(n);
  }
  function feedback(root, good, text, en) {
    const old = root.querySelector('.feedback'); if (old) old.remove();
    const f = h('div', { class: 'feedback zh ' + (good ? 'good' : 'bad') }, (good ? '✅ ' : '🤔 ') + R(text));
    if (en) {
      const enEl = h('div', { class: 'en' }, esc(en));
      f.append(h('button', { class: 'mini', style: 'margin-left:8px', onclick: () => enEl.classList.toggle('show') }, '?'), enEl);
    }
    root.append(f);
    return f;
  }
  function nextBtn(root, label, fn) {
    const w = h('div', { class: 'next-wrap' });
    const b = h('button', { class: 'big-btn green zh' }, R(label || '继续') + ' ➡️');
    b.onclick = () => { b.disabled = true; fn(); };
    w.append(b); root.append(w);
    setTimeout(() => w.scrollIntoView({ behavior: 'smooth', block: 'end' }), 60);
  }
  function confetti() {
    const c = h('div', { class: 'confetti' });
    const bits = ['⭐', '🎉', '✨', '🌟', '🎈'];
    for (let i = 0; i < 24; i++) c.append(h('i', { style: `left:${Math.random() * 100}%;animation-delay:${Math.random() * 0.8}s` }, bits[i % bits.length]));
    document.body.append(c); setTimeout(() => c.remove(), 3500);
  }
  const starsText = (n) => '⭐'.repeat(n) + '☆'.repeat(3 - n);
  const enOf = (w) => { const f = WORDS.find((x) => x.w === w); return f && f.en; };

  function openSettings() {
    const m = h('div', { class: 'modal' });
    const card = h('div', { class: 'card' });
    const row = (label, key) => {
      const r = h('div', { class: 'toggle-row' });
      r.append(h('span', { class: 'zh' }, R(label)));
      const b = h('button', { class: 'icon-btn small' + (P[key] ? ' on' : '') }, P[key] ? '开' : '关');
      b.onclick = () => { P[key] = !P[key]; save(); b.textContent = P[key] ? '开' : '关'; b.classList.toggle('on', P[key]); applyPy(); };
      r.append(b); return r;
    };
    card.append(h('h2', { class: 'zh', style: 'margin-top:0' }, R('设置')), row('拼音', 'py'), row('声音', 'snd'), row('自动朗读', 'auto'));
    const test = h('button', { class: 'big-btn secondary zh', style: 'margin-top:14px' }, '🔊 ' + R('试一试声音'));
    test.onclick = () => speak('你好！我们一起来抄写吧！');
    const reset = h('button', { class: 'big-btn secondary zh danger', style: 'margin-top:12px' }, '🗑️ ' + R('重新开始'));
    let armed = false;
    reset.onclick = () => {
      if (!armed) { armed = true; reset.innerHTML = '⚠️ ' + R('再按一次，确定删除记录'); setTimeout(() => { armed = false; reset.innerHTML = '🗑️ ' + R('重新开始'); }, 4000); return; }
      const keep = { py: P.py, snd: P.snd, auto: P.auto };
      P = Object.assign(fresh(), keep); save(); m.remove(); showHome();
    };
    const close = h('button', { class: 'big-btn zh', style: 'margin-top:12px' }, R('好了'));
    close.onclick = () => m.remove();
    card.append(test, reset, close);
    m.append(card);
    m.addEventListener('click', (e) => { if (e.target === m) m.remove(); });
    document.body.append(m);
  }

  /* ================= writing pad ================= */
  function tianzige(size) {
    const d = 'stroke="#f3a99e" stroke-width="1.5" stroke-dasharray="6 6"';
    return `<svg class="tzg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <line x1="0" y1="${size / 2}" x2="${size}" y2="${size / 2}" ${d}/><line x1="${size / 2}" y1="0" x2="${size / 2}" y2="${size}" ${d}/>
      <line x1="0" y1="0" x2="${size}" y2="${size}" ${d}/><line x1="${size}" y1="0" x2="0" y2="${size}" ${d}/></svg>`;
  }
  function boxSize() {
    const vw = Math.min(window.innerWidth, 860) - 48;
    return Math.floor(Math.max(220, Math.min(vw, window.innerHeight * 0.5, 460)));
  }
  /* phases: [{ch, idx, mode: 'trace'|'copy'|'dict', round}] → cb(results) */
  function writePad(root, word, phases, cb) {
    const wrap = h('div', { class: 'write-wrap' });
    const tag = h('div', { class: 'mode-tag zh' });
    const strip = h('div', { class: 'word-strip' });
    const size = boxSize();
    const box = h('div', { class: 'grid-box', style: `width:${size + 8}px;height:${size + 8}px` });
    box.innerHTML = tianzige(size);
    const target = h('div', { class: 'hw' }); box.append(target);
    const tools = h('div', { class: 'write-tools' });
    const bShow = h('button', { class: 'mini big' }, '👀 ' + R('看笔顺'));
    const bRedo = h('button', { class: 'mini big' }, '🔁 ' + R('重写'));
    const bSay = h('button', { class: 'mini big', 'aria-label': '朗读' }, '🔊');
    const bSkip = h('button', { class: 'mini big' }, '⏭ ' + R('跳过这个字'));
    tools.append(bShow, bRedo, bSay, bSkip);
    const msg = h('div', { class: 'muted center zh pad-msg' });
    wrap.append(tag, strip, box, tools, msg);
    root.append(wrap);

    const chars = hanOf(word);
    const results = [];
    let pi = 0, writer = null, mistakes = 0, penalty = 0, dead = false;
    function advance() {
      if (dead) return;
      pi++;
      if (pi < phases.length) start(); else cb(results);
    }
    const LABEL = (ph) => ph.mode === 'trace' ? '描红：跟着灰色的字写'
      : ph.mode === 'dict' ? '听写：写出你听到的词语'
        : `抄写：第${ph.round}遍（共${REPEATS}遍）`;
    function drawStrip(ph) {
      strip.innerHTML = '';
      chars.forEach((c, i) => {
        const done = results.some((r) => r.mode === ph.mode && r.round === ph.round && r.idx === i);
        const cur = i === ph.idx;
        const show = ph.mode !== 'dict' || done;
        strip.append(h('div', { class: 'slot' + (cur ? ' cur' : '') + (done ? ' ok' : '') }, show ? c : (cur ? '✍️' : '？')));
      });
    }
    function start() {
      const ph = phases[pi];
      tag.innerHTML = R(LABEL(ph));
      drawStrip(ph);
      target.innerHTML = ''; mistakes = 0; penalty = 0; msg.innerHTML = '';
      setTimeout(() => { const r = box.getBoundingClientRect(); if (r.bottom > window.innerHeight || r.top < 60) box.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, pi === 0 ? 350 : 50);
      writer = HW.create(target, ph.ch, {
        width: size, height: size, padding: Math.round(size * 0.06),
        showCharacter: false, showOutline: ph.mode === 'trace',
        strokeColor: '#2d2a32', outlineColor: '#d9d4cc', drawingColor: '#3a3a3a', highlightColor: '#ff9f68',
        drawingWidth: Math.max(10, Math.round(size / 26)),
        strokeAnimationSpeed: 1.1, delayBetweenStrokes: 280,
        showHintAfterMisses: ph.mode === 'trace' ? 1 : ph.mode === 'copy' ? 2 : 3,
        highlightOnComplete: true,
        charDataLoader: (c, done) => done(window.HANZI_DATA[c]),
      });
      if (ph.mode === 'trace') {
        msg.innerHTML = R('先看笔顺……'); msg.dataset.st = 'anim';
        const mine = writer;
        writer.animateCharacter({ onComplete: () => { if (dead || writer !== mine) return; msg.innerHTML = R('轮到你了！跟着笔顺写。'); quiz(); } });
      } else {
        msg.innerHTML = R(ph.mode === 'dict' ? '写出你听到的字。' : '不看字，自己写！');
        quiz();
      }
    }
    function quiz() {
      const ph = phases[pi];
      msg.dataset.st = 'quiz';
      writer.quiz({
        leniency: 1.1,
        onMistake: () => { mistakes++; sBad(); },
        onCorrectStroke: () => sStroke(),
        onComplete: () => {
          sGood();
          const total = mistakes + penalty;
          results.push({ ch: ph.ch, mode: ph.mode, idx: ph.idx, round: ph.round, mistakes: total });
          msg.innerHTML = total <= 1 ? R('写得很好！') + ' ⭐' : total <= 3 ? R('不错！') : R('多练习几次就会了！');
          setTimeout(advance, 900);
        },
      });
    }
    bShow.onclick = () => {
      if (!writer || pi >= phases.length) return;
      if (phases[pi].mode !== 'trace') penalty += 2;
      writer.cancelQuiz();
      const mine = writer;
      writer.animateCharacter({ onComplete: () => { if (dead || writer !== mine) return; writer.hideCharacter(); quiz(); } });
    };
    bSkip.onclick = () => {
      if (!writer || pi >= phases.length || dead) return;
      const ph = phases[pi];
      try { writer.cancelQuiz(); } catch (e) { /* ignore */ }
      writer = null;
      results.push({ ch: ph.ch, mode: ph.mode, idx: ph.idx, round: ph.round, mistakes: 0, skipped: true });
      msg.innerHTML = R('跳过了');
      setTimeout(advance, 250);
    };
    bRedo.onclick = () => { if (!writer || pi >= phases.length) return; writer.cancelQuiz(); quiz(); };
    bSay.onclick = () => speak(word);
    start();
    return { kill() { dead = true; try { if (writer) writer.cancelQuiz(); } catch (e) { /* ignore */ } } };
  }
  /* Score non-trace characters and keep the mistake book up to date. */
  function record(m, results, isReview) {
    let got = 0, total = 0;
    results.forEach((r) => {
      if (r.mode === 'trace' || r.skipped) return;
      total++;
      if (r.mistakes <= 1) got += 1; else if (r.mistakes <= 3) got += 0.5;
      if (isReview) { if (r.mistakes <= 1) delete P.mistakes[r.ch]; }
      else if (r.mistakes >= 2) {
        P.mistakes[r.ch] = (P.mistakes[r.ch] || 0) + 1;
        if (!m.newMist.includes(r.ch)) m.newMist.push(r.ch);
      }
    });
    return [got, total];
  }

  /* ================= missions ================= */
  const NAMES = { copy: '抄写', dict: '听写', review: '练习错字' };
  function selected() {
    const all = WORDS.map((x) => x.w);
    const set = Array.isArray(P.sel) ? P.sel : all;
    return all.filter((w) => set.includes(w));
  }
  function genSteps(key, only) {
    const list = only || selected();
    if (key === 'copy') return list.map((w) => ({ t: 'copy', w })).concat([{ t: 'end' }]);
    if (key === 'dict') return shuffle(list).map((w) => ({ t: 'dict', w })).concat([{ t: 'end' }]);
    const chars = Object.keys(P.mistakes).sort((a, b) => P.mistakes[b] - P.mistakes[a]).slice(0, 10);
    return chars.map((c) => ({ t: 'copy', w: c, review: true })).concat([{ t: 'end' }]);
  }
  function startMission(key, freshRun, only) {
    let m = P.m[key];
    if (freshRun || !m || m.done) { m = P.m[key] = { steps: genSteps(key, only), idx: 0, got: 0, total: 0, done: false, newMist: [], doneSteps: [] }; save(); }
    if (!m.doneSteps) m.doneSteps = [];
    runMission(key);
  }
  /* Next step that is not finished yet, looking after `from` first, then from the start. */
  function nextOpen(m, from) {
    const last = m.steps.length - 1;
    for (let j = from + 1; j < last; j++) if (!m.doneSteps.includes(j)) return j;
    for (let j = 0; j < from && j < last; j++) if (!m.doneSteps.includes(j)) return j;
    return last;
  }
  let curPad = null;
  function killPad() { if (curPad) { curPad.kill(); curPad = null; } }
  function openSteps(key) {
    const m = P.m[key];
    const md = h('div', { class: 'modal' });
    const card = h('div', { class: 'card steplist' });
    card.append(h('h2', { class: 'zh', style: 'margin-top:0' }, R(key === 'dict' ? '选一题' : '选一个词')));
    const list = h('div', { class: 'steps' });
    m.steps.forEach((st, j) => {
      if (st.t === 'end') return;
      const done = m.doneSteps.includes(j), cur = j === m.idx;
      const label = st.t === 'dict' && !done ? '第' + (j + 1) + '题' : st.w;
      const b = h('button', { class: 'step-item' + (done ? ' done' : '') + (cur ? ' cur' : '') },
        `<span class="zh">${R(label)}</span><span class="st">${done ? '✅' : cur ? '▶️' : ''}</span>`);
      b.onclick = () => { md.remove(); killPad(); m.idx = j; save(); runMission(key); };
      list.append(b);
    });
    const fin = h('button', { class: 'big-btn secondary zh', style: 'margin-top:12px' }, '🏁 ' + R('结束，看成绩'));
    fin.onclick = () => { md.remove(); killPad(); m.idx = m.steps.length - 1; save(); runMission(key); };
    const close = h('button', { class: 'big-btn zh', style: 'margin-top:10px' }, R('关闭'));
    close.onclick = () => md.remove();
    card.append(list, fin, close);
    md.append(card);
    md.addEventListener('click', (e) => { if (e.target === md) md.remove(); });
    document.body.append(md);
  }
  function runMission(key) {
    curKey = key;
    const m = P.m[key];
    app.innerHTML = '';
    killPad();
    const listBtn = h('button', { class: 'icon-btn', 'aria-label': '选词' }, '📋');
    listBtn.onclick = () => openSteps(key);
    app.append(topbar(NAMES[key], () => { killPad(); showHome(); }, m.steps[m.idx].t === 'end' ? null : listBtn));
    app.append(h('div', { class: 'progress' }, `<i style="width:${Math.round((m.doneSteps.length / Math.max(1, m.steps.length - 1)) * 100)}%"></i>`));
    const main = h('main'); app.append(main);
    const step = m.steps[m.idx];
    const api = {
      key, m,
      done(got, total) {
        m.got += got || 0; m.total += total || 0;
        if (!m.doneSteps.includes(m.idx)) m.doneSteps.push(m.idx);
        m.idx = nextOpen(m, m.idx); save(); runMission(key);
      },
      skip() { killPad(); m.idx = nextOpen(m, m.idx); save(); runMission(key); },
    };
    rerender = () => runMission(key);
    STEPS[step.t](main, step, api);
    window.scrollTo(0, 0);
  }

  function wordCard(root, w, hide) {
    const card = h('div', { class: 'card center' });
    card.innerHTML = `<div class="word-big zh">${hide ? '🔒 ' + '？'.repeat(hanOf(w).length) : R(w)}</div>`;
    const tools = h('div', { class: 'bubble-tools center-row' });
    tools.append(h('button', { class: 'mini', onclick: () => speak(w) }, '🔊 ' + R('听')));
    const en = enOf(w);
    let enEl = null;
    if (en) { enEl = h('div', { class: 'en' }, esc(en)); tools.append(h('button', { class: 'mini', onclick: () => enEl.classList.toggle('show') }, '?')); }
    card.append(tools); if (enEl) card.append(enEl);
    root.append(card);
    return card;
  }

  function skipRow(root, label, api) {
    const row = h('div', { class: 'skip-row' });
    const b = h('button', { class: 'mini big zh' }, R(label));
    b.onclick = () => api.skip();
    row.append(b);
    root.append(row);
  }

  const STEPS = {};
  STEPS.copy = (root, s, api) => {
    const chars = hanOf(s.w);
    root.append(bubble(s.review ? '练习这个字：先描红，再写' + REPEATS + '遍。' : '抄写“' + s.w + '”：先描红，再写' + REPEATS + '遍。',
      'Trace it once, then write it ' + REPEATS + ' times without the grey outline.', { say: s.review ? s.w : '抄写，' + s.w }));
    wordCard(root, s.w);
    skipRow(root, '⏩ 下一个词', api);
    const phases = chars.map((ch, idx) => ({ ch, idx, mode: 'trace', round: 0 }));
    for (let r = 1; r <= REPEATS; r++) chars.forEach((ch, idx) => phases.push({ ch, idx, mode: 'copy', round: r }));
    curPad = writePad(root, s.w, phases, (res) => {
      curPad = null;
      const [got, total] = record(api.m, res, !!s.review);
      if (!s.review && total) {
        const pct = got / total;
        P.wdone[s.w] = Math.max(P.wdone[s.w] || 0, pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1);
      }
      setMood(root, 'happy');
      feedback(root, true, got === total ? '写得真好！' : '完成了！继续加油！');
      nextBtn(root, '继续', () => api.done(got, total));
    });
  };
  STEPS.dict = (root, s, api) => {
    root.append(bubble('听写：听一听，写出这个词语。', 'Dictation: listen, then write the word.', { say: '听写。' + s.w }));
    const card = wordCard(root, s.w, true);
    skipRow(root, '⏩ 下一题', api);
    const phases = hanOf(s.w).map((ch, idx) => ({ ch, idx, mode: 'dict', round: 0 }));
    curPad = writePad(root, s.w, phases, (res) => {
      curPad = null;
      const [got, total] = record(api.m, res, false);
      card.querySelector('.word-big').innerHTML = R(s.w);
      setMood(root, 'happy');
      feedback(root, true, '答案是“' + s.w + '”。' + (got === total ? '全对！' : '继续加油！'), enOf(s.w) ? s.w + ' = ' + enOf(s.w) : null);
      nextBtn(root, '继续', () => api.done(got, total));
    });
  };
  STEPS.end = (root, s, api) => {
    const m = api.m;
    const pct = m.total ? m.got / m.total : 1;
    const stars = !m.total ? 0 : pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
    m.done = true;
    if (stars) P.best[api.key] = Math.max(P.best[api.key] || 0, stars);
    save(); if (stars) { confetti(); sGood(); }
    const word = !stars ? '这次都跳过了，下次写一写吧！' : stars === 3 ? '太棒了！' : stars === 2 ? '做得好！' : '完成了！继续加油！';
    const sum = h('div', { class: 'summary' });
    sum.innerHTML = guideSVG('happy').replace('class="guide"', 'class="guide guide-lg"') +
      (stars ? `<div class="stars-big">${starsText(stars)}</div>` : '') + `<h2 class="zh">${R(word)}</h2>` +
      (m.total ? `<p class="zh score">${R('得分')}：${Math.round(m.got * 10) / 10} / ${m.total}</p>` : '');
    root.append(sum);
    speak(word);
    if (m.newMist.length) {
      const c = h('div', { class: 'card' }, `<div class="zh card-h">📕 ${R('放进错字本的字')}：</div>`);
      const chips = h('div', { class: 'chips' });
      m.newMist.forEach((ch) => chips.append(h('span', { class: 'chip zh' }, R(ch))));
      c.append(chips); root.append(c);
    }
    const row = h('div', { class: 'row' });
    const again = h('button', { class: 'big-btn secondary zh' }, '🔁 ' + R('再来一次'));
    again.onclick = () => startMission(api.key, true);
    const home = h('button', { class: 'big-btn zh' }, '🏠 ' + R('回去'));
    home.onclick = showHome;
    row.append(again, home); root.append(row);
  };

  /* ================= home ================= */
  function status(key) {
    const m = P.m[key], best = P.best[key] || 0;
    if (m && !m.done && (m.doneSteps || []).length > 0) return { label: '继续', sub: `${m.doneSteps.length}/${m.steps.length - 1}`, again: false };
    if (best) return { label: '再来', sub: starsText(best), again: true };
    return { label: '开始', sub: '', again: false };
  }
  function showHome() {
    curKey = null; rerender = showHome;
    app.innerHTML = '';
    app.append(topbar(S.title || '抄写练习', null));
    const main = h('main'); app.append(main);
    const hero = h('div', { class: 'hero' });
    hero.innerHTML = `<h1 class="zh">${R(S.title || '抄写练习')}</h1>` + (S.subtitle ? `<div class="zh muted sub">${R(S.subtitle)}</div>` : '');
    main.append(hero);
    main.append(bubble('点词语来选择要抄写的词，不用按顺序。也可以点 ✍️ 只写一个词。',
      'Tap words to choose which ones to practise, in any order. Tap ✍️ to write just one word.', { autoSay: false }));
    const sel = selected();
    const pick = h('div', { class: 'card' });
    pick.append(h('div', { class: 'zh card-h' }, R('选择词语') + ` <span class="muted">(${sel.length}/${WORDS.length})</span>`));
    const tools = h('div', { class: 'sel-tools' });
    const setSel = (list) => { P.sel = list; save(); showHome(); };
    tools.append(
      h('button', { class: 'mini zh', onclick: () => setSel(WORDS.map((x) => x.w)) }, R('全选')),
      h('button', { class: 'mini zh', onclick: () => setSel(WORDS.map((x) => x.w).filter((w) => !P.wdone[w])) }, R('没写过的')),
      h('button', { class: 'mini zh', onclick: () => setSel([]) }, R('清空')),
    );
    pick.append(tools);
    const grid = h('div', { class: 'pickgrid' });
    WORDS.forEach((x) => {
      const on = sel.includes(x.w);
      const done = P.wdone[x.w];
      const card = h('div', { class: 'wpick' + (on ? ' on' : ''), role: 'button', 'aria-pressed': on ? 'true' : 'false' });
      card.innerHTML = `<span class="tick">${on ? '☑️' : '⬜'}</span><div class="w zh">${R(x.w)}</div><div class="small muted">${done ? '✅ ' + starsText(done) : R('还没写')}</div>`;
      card.onclick = () => { const cur = selected(); setSel(on ? cur.filter((w) => w !== x.w) : cur.concat([x.w])); };
      const acts = h('div', { class: 'acts' });
      const say = h('button', { class: 'mini', 'aria-label': '朗读' }, '🔊');
      say.onclick = (e) => { e.stopPropagation(); speak(x.w); };
      const one = h('button', { class: 'mini', 'aria-label': '只写这个词' }, '✍️');
      one.onclick = (e) => { e.stopPropagation(); startMission('copy', true, [x.w]); };
      acts.append(say, one);
      card.append(acts);
      grid.append(card);
    });
    pick.append(grid);
    main.append(pick);
    const mk = (key, e, n, sub) => {
      const m = P.m[key];
      const resume = m && !m.done && (m.doneSteps || []).length > 0;
      if (resume) {
        const r = h('button', { class: 'mission' });
        r.innerHTML = `<span class="e">⏯️</span><div class="mi"><div class="n zh">${R('继续上次的' + NAMES[key])}</div><div class="s">${m.doneSteps.length}/${m.steps.length - 1}</div></div><span class="go zh">${R('继续')}</span>`;
        r.onclick = () => startMission(key, false);
        main.append(r);
      }
      const b = h('button', { class: 'mission' });
      b.disabled = !sel.length;
      b.innerHTML = `<span class="e">${e}</span><div class="mi"><div class="n zh">${R(n)}（${sel.length}）</div><div class="s zh">${R(sub)}</div><div class="s">${P.best[key] ? starsText(P.best[key]) : ''}</div></div><span class="go zh">${R('开始')}</span>`;
      b.onclick = () => startMission(key, true);
      main.append(b);
    };
    mk('copy', '✍️', '抄写选中的词', '描红一遍 · 自己写' + REPEATS + '遍');
    if (S.dictation !== false) mk('dict', '👂', '听写选中的词', '听一听，写出来');
    const nm = Object.keys(P.mistakes).length;
    const mb = h('button', { class: 'mission' });
    mb.innerHTML = `<span class="e">📕</span><div class="mi"><div class="n zh">${R('错字本')}</div><div class="s zh">${nm ? nm + ' ' + R('个字要多练习') : R('空的，太棒了！')}</div></div><span class="go zh">${R(nm ? '练习' : '查看')}</span>`;
    mb.onclick = showMistakes;
    main.append(mb);
  }
  function showMistakes() {
    rerender = showMistakes;
    app.innerHTML = '';
    app.append(topbar('错字本', showHome));
    const main = h('main'); app.append(main);
    const chars = Object.keys(P.mistakes).sort((a, b) => P.mistakes[b] - P.mistakes[a]);
    if (!chars.length) { main.append(bubble('错字本是空的。写字时写错两笔或以上的字，会放进这里。', 'Empty! Characters with 2+ wrong strokes are added here.', { mood: 'happy' })); return; }
    main.append(bubble('这些字要多练习。写对了，它们就会离开错字本！', 'Practise these. Write them well and they leave the book!'));
    const g = h('div', { class: 'wordgrid' });
    chars.forEach((ch) => {
      const word = WORDS.find((x) => x.w.includes(ch));
      const c = h('div', { class: 'wcard' }, `<div class="w zh">${R(ch)}</div><div class="muted zh small">${word ? R(word.w) : ''} · ✖${P.mistakes[ch]}</div>`);
      c.append(h('button', { class: 'mini', onclick: () => speak(word ? word.w : ch) }, '🔊'));
      g.append(c);
    });
    main.append(g);
    const b = h('button', { class: 'big-btn', style: 'margin-top:16px' }, '✍️ ' + R('开始练习错字'));
    b.onclick = () => startMission('review', true);
    main.append(b);
  }

  applyPy();
  showHome();
  cloudInit();
  window.__chaoxie = { get P() { return P; }, startMission, runMission };
})();
