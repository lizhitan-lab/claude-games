/* 科学技能训练营 — app logic */
(function () {
  'use strict';
  const C = window.CAMP;
  const HW = window.HanziWriter;
  const PYLIB = window.pinyinPro;

  /* ================= storage ================= */
  const KEY = 'kexue-camp-ch1-v1';
  function freshState() {
    return { v: 1, py: true, snd: true, auto: true, m: {}, best: {}, mistakes: {} };
  }
  let P;
  try {
    P = JSON.parse(localStorage.getItem(KEY));
  } catch (e) { P = null; }
  if (!P || P.v !== 1) P = freshState();
  function save() {
    P.t = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* storage unavailable: keep playing in memory */ }
    scheduleCloud();
  }

  /* Optional cloud save (only when running as a claude.ai artifact): the
     viewer's own private document, so progress follows them across devices. */
  let cloudRef = null, cloudTimer = 0, cloudBusy = false, cloudDirty = false;
  function scheduleCloud() {
    if (!cloudRef) return;
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(pushCloud, 1500);
  }
  function pushCloud() {
    if (!cloudRef) return;
    if (cloudBusy) { cloudDirty = true; return; }
    cloudBusy = true;
    cloudRef.set({ state: JSON.stringify(P), t: P.t || 0 })
      .catch(() => {})
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
      const ref = db.collection('data/users/' + uid).doc('camp-ch1');
      const snap = await ref.get();
      let remoteT = -1;
      if (snap.exists) {
        const d = snap.data() || {};
        remoteT = +d.t || 0;
        let remote = null;
        try { remote = JSON.parse(d.state); } catch (e) { remote = null; }
        if (remote && remote.v === 1 && remoteT > (P.t || 0) && !curKey) {
          P = remote;
          try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* ignore */ }
          applyPy();
          showHome();
        }
      }
      cloudRef = ref;
      if ((P.t || 0) > remoteT) pushCloud();
    } catch (e) { cloudRef = null; }
  }

  /* ================= helpers ================= */
  const $ = (s, el) => (el || document).querySelector(s);
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
  const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ================= pinyin ================= */
  if (PYLIB && PYLIB.customPinyin) {
    PYLIB.customPinyin({
      量筒: 'liáng tǒng', 测量: 'cè liáng', 量一量: 'liáng yī liáng', 数量: 'shù liàng', 读数: 'dú shù',
      长度: 'cháng dù', 弯月面: 'wān yuè miàn', 分量: 'fèn liàng', 渗水性: 'shèn shuǐ xìng',
      黏土: 'nián tǔ', 壤土: 'rǎng tǔ', 晾干: 'liàng gān', 干了: 'gān le', 快干: 'kuài gān',
      好香: 'hǎo xiāng', 笑眯眯: 'xiào mī mī', 皱起: 'zhòu qǐ', 一只: 'yī zhī', 几秒: 'jǐ miǎo',
      还可以: 'hái kě yǐ', 还有: 'hái yǒu', 还是: 'hái shì', 感觉: 'gǎn jué', 觉得: 'jué de',
      为了: 'wèi le', 因为: 'yīn wèi', 作为: 'zuò wéi', 成为: 'chéng wéi', 分为: 'fēn wéi',
      一种: 'yī zhǒng', 种类: 'zhǒng lèi', 种植: 'zhòng zhí', 地方: 'dì fang', 都是: 'dōu shì',
      仔细地: 'zǐ xì de', 慢慢地: 'màn màn de', 小心地: 'xiǎo xīn de', 安全地: 'ān quán de', 正确地: 'zhèng què de',
      重写: 'chóng xiě', 重新: 'chóng xīn', 得出: 'dé chū', 记得: 'jì de', 溶化得: 'róng huà de', 干得: 'gān de',
      磨损得: 'mó sǔn de', 画得: 'huà de', 按得: 'àn de', 少: 'shǎo', 更少: 'gèng shǎo', 长出来: 'zhǎng chū lái',
      看一看: 'kàn yī kàn', 闻一闻: 'wén yī wén', 想一想: 'xiǎng yī xiǎng', 读一读: 'dú yī dú', 听一听: 'tīng yī tīng',
      一样: 'yī yàng', 一个: 'yī gè', 一条: 'yī tiáo', 一根: 'yī gēn', 一双: 'yī shuāng', 一位: 'yī wèi', 一串: 'yī chuàn',
      写得: 'xiě de', 做得: 'zuò de', 地存放: 'de cún fàng', 只用: 'zhǐ yòng', 只改变: 'zhǐ gǎi biàn', 只让: 'zhǐ ràng', 只能: 'zhǐ néng',
      一些: 'yī xiē', 一下: 'yī xià', 一点: 'yī diǎn', 一定: 'yī dìng', 不一定: 'bù yī dìng', 一起: 'yī qǐ',
    });
  }
  const pyCache = new Map();
  function R(text) {
    text = String(text);
    if (pyCache.has(text)) return pyCache.get(text);
    let out;
    try {
      const arr = PYLIB.pinyin(text, { type: 'all', toneSandhi: true });
      out = arr.map((x) => (x.isZh ? `<ruby>${x.origin}<rt>${x.pinyin}</rt></ruby>` : esc(x.origin))).join('');
    } catch (e) { out = esc(text); }
    pyCache.set(text, out);
    return out;
  }
  function pyOf(text) {
    try { return PYLIB.pinyin(text, { toneSandhi: false }); } catch (e) { return ''; }
  }
  function applyPy() { document.body.classList.toggle('no-py', !P.py); }

  /* ================= sound ================= */
  let zhVoice = null;
  function pickVoice() {
    if (!window.speechSynthesis) return;
    const vs = speechSynthesis.getVoices() || [];
    zhVoice = vs.find((v) => /zh[-_]CN/i.test(v.lang) && /Ting|Li-mu|Yu-shu|婷婷/i.test(v.name))
      || vs.find((v) => /zh[-_]CN/i.test(v.lang))
      || vs.find((v) => /^zh/i.test(v.lang) && !/HK|TW/i.test(v.lang))
      || null;
  }
  if (window.speechSynthesis) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }
  function speak(text, rate) {
    if (!P.snd || !window.speechSynthesis || !text) return;
    const clean = String(text)
      .replace(/＿+/g, '，空格，')
      .replace(/[A-Za-z]{2,}/g, '')
      .replace(/\p{Extended_Pictographic}|️|‍/gu, '');
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = 'zh-CN';
      if (zhVoice) u.voice = zhVoice;
      u.rate = rate || 0.8;
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
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(actx.destination);
        o.start(t); o.stop(t + dur + 0.02);
        t += dur * 0.8;
      });
    } catch (e) { /* ignore */ }
  }
  const sGood = () => tone([660, 880, 1175], 0.12);
  const sBad = () => tone([300, 220], 0.16);
  const sStroke = () => tone([990], 0.05);

  /* ================= guide character: 芽芽博士 (Dr. Sprout) ================= */
  function guideSVG(mood) {
    const mouth = mood === 'sad'
      ? '<path d="M41 86 Q50 80 59 86" stroke="#2d2a32" stroke-width="3" fill="none" stroke-linecap="round"/>'
      : mood === 'wow'
        ? '<ellipse cx="50" cy="85" rx="6" ry="7" fill="#7a2e2e"/>'
        : '<path d="M38 81 Q50 94 62 81 Q50 87 38 81Z" fill="#7a2e2e" stroke="#2d2a32" stroke-width="2" stroke-linejoin="round"/>';
    return `<svg class="guide" viewBox="0 0 100 112" aria-label="芽芽博士">
      <path d="M50 26 C47 15 40 8 28 7 C31 18 39 24 50 26Z" fill="#5cb83c" stroke="#3f8f2a" stroke-width="2"/>
      <path d="M50 26 C54 13 63 7 76 9 C71 20 62 25 50 26Z" fill="#86d65a" stroke="#3f8f2a" stroke-width="2"/>
      <path d="M50 26 L50 33" stroke="#3f8f2a" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="50" cy="70" rx="38" ry="39" fill="#a6e27c" stroke="#5aa23c" stroke-width="3"/>
      <path d="M17 86 Q24 106 50 108 Q76 106 83 86 L83 100 Q70 111 50 111 Q30 111 17 100Z" fill="#ffffff" stroke="#cfd8dc" stroke-width="2"/>
      <path d="M44 99 L50 108 L56 99" fill="none" stroke="#cfd8dc" stroke-width="2"/>
      <rect x="15" y="44" width="70" height="6" rx="3" fill="#3d8fd6"/>
      <circle cx="37" cy="47" r="10" fill="#d4efff" stroke="#3d8fd6" stroke-width="3"/>
      <circle cx="63" cy="47" r="10" fill="#d4efff" stroke="#3d8fd6" stroke-width="3"/>
      <circle cx="34" cy="44" r="3" fill="#fff"/><circle cx="60" cy="44" r="3" fill="#fff"/>
      <circle cx="38" cy="68" r="8" fill="#fff"/><circle cx="62" cy="68" r="8" fill="#fff"/>
      <circle cx="39" cy="69" r="4.5" fill="#2d2a32"/><circle cx="63" cy="69" r="4.5" fill="#2d2a32"/>
      <circle cx="40.5" cy="67" r="1.6" fill="#fff"/><circle cx="64.5" cy="67" r="1.6" fill="#fff"/>
      <ellipse cx="25" cy="79" rx="6" ry="4" fill="#ff9fb0" opacity=".8"/><ellipse cx="75" cy="79" rx="6" ry="4" fill="#ff9fb0" opacity=".8"/>
      ${mouth}
    </svg>`;
  }

  /* ================= UI pieces ================= */
  const app = document.getElementById('app');
  let topTitle = '';
  let backFn = null;

  function topbar(title, back) {
    topTitle = title; backFn = back;
    const bar = h('div', { class: 'topbar' });
    bar.append(
      back ? h('button', { class: 'icon-btn', 'aria-label': '返回', onclick: () => { speechSynthesis && speechSynthesis.cancel(); back(); } }, '⬅️') : h('span', { class: 'icon-btn', style: 'visibility:hidden' }, ''),
      h('div', { class: 'title zh' }, R(title)),
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
    if (opts.test) b.append(h('div', { class: 'badge-test zh' }, R('考试练习')));
    b.append(h('div', { class: 'zh' }, opts.html || R(text)));
    const tools = h('div', { class: 'bubble-tools' });
    tools.append(h('button', { class: 'mini', 'aria-label': '朗读', onclick: () => speak(opts.say || text) }, '🔊'));
    let enEl = null;
    if (en) {
      enEl = h('div', { class: 'en' }, esc(en));
      tools.append(h('button', { class: 'mini', 'aria-label': 'English hint', onclick: () => enEl.classList.toggle('show') }, '?'));
    }
    b.append(tools);
    if (enEl) b.append(enEl);
    row.append(b);
    if (opts.autoSay !== false && P.auto) setTimeout(() => speak(opts.say || text), 120);
    return row;
  }

  function setMood(root, mood) {
    const g = root.querySelector('.guide');
    if (!g) return;
    const tmp = h('div', null, guideSVG(mood));
    const n = tmp.firstElementChild;
    n.classList.add('bounce');
    g.replaceWith(n);
  }

  function feedback(root, good, text, en) {
    const old = root.querySelector('.feedback');
    if (old) old.remove();
    const f = h('div', { class: 'feedback zh ' + (good ? 'good' : 'bad') });
    f.innerHTML = (good ? '✅ ' : '🤔 ') + R(text);
    if (en) {
      const enEl = h('div', { class: 'en' }, esc(en));
      const q = h('button', { class: 'mini', style: 'margin-left:8px', onclick: () => enEl.classList.toggle('show') }, '?');
      f.append(q, enEl);
    }
    root.append(f);
    f.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return f;
  }

  function nextBtn(root, label, fn) {
    const w = h('div', { class: 'next-wrap' });
    const b = h('button', { class: 'big-btn green zh' }, R(label || '继续') + ' ➡️');
    b.onclick = () => { b.disabled = true; fn(); };
    w.append(b);
    root.append(w);
    setTimeout(() => w.scrollIntoView({ behavior: 'smooth', block: 'end' }), 60);
    return b;
  }

  /* Multiple choice: opts = [[text, score], ...]; score 0 = wrong.
     cb(score, firstTry). maxScore used to decide "best". */
  function chooser(root, opts, cfg) {
    cfg = cfg || {};
    const box = h('div', { class: 'options ' + (cfg.cols || '') });
    let tries = 0, finished = false;
    const max = Math.max.apply(null, opts.map((o) => o[1]));
    opts.forEach((o) => {
      const btn = h('button', { class: 'opt' + (cfg.center ? ' center-t' : ''), 'data-t': o[0] });
      const t = h('span', { class: 't zh' }, cfg.render ? cfg.render(o) : R(o[0]));
      btn.append(t);
      if (cfg.say !== false) {
        const say = h('span', { class: 'say', role: 'button', 'aria-label': '朗读' }, '🔊');
        say.addEventListener('click', (e) => { e.stopPropagation(); speak(cfg.sayText ? cfg.sayText(o) : o[0]); });
        btn.append(say);
      }
      btn.onclick = () => {
        if (finished) return;
        tries++;
        if (o[1] > 0) {
          finished = true;
          btn.classList.add('good');
          box.querySelectorAll('.opt').forEach((x) => { if (x !== btn && !x.classList.contains('good')) x.classList.add('dim'); });
          sGood();
          setMood(root, 'happy');
          cfg.onPick(o[1], tries === 1, max, btn);
        } else {
          btn.classList.remove('bad'); void btn.offsetWidth; btn.classList.add('bad');
          sBad();
          setMood(root, 'sad');
          if (cfg.onWrong) cfg.onWrong(o, btn);
          else feedback(root, false, '再想一想！');
        }
      };
      box.append(btn);
    });
    root.append(box);
    return box;
  }

  function scene(emoji, story, en) {
    const s = h('div', { class: 'scene' });
    s.append(h('div', null, emoji));
    if (story) s.append(h('div', { class: 'story zh' }, R(story)));
    return s;
  }

  function confetti() {
    const c = h('div', { class: 'confetti' });
    const bits = ['⭐', '🎉', '✨', '🌟', '🎈', '🍀'];
    for (let i = 0; i < 26; i++) {
      const b = h('i', { style: `left:${Math.random() * 100}%;animation-delay:${Math.random() * 0.8}s;font-size:${20 + Math.random() * 20}px` }, pick(bits));
      c.append(b);
    }
    document.body.append(c);
    setTimeout(() => c.remove(), 3500);
  }

  function starsText(n) { return '⭐'.repeat(n) + '☆'.repeat(3 - n); }

  /* ================= settings ================= */
  function openSettings() {
    const m = h('div', { class: 'modal' });
    const card = h('div', { class: 'card' });
    const row = (label, key) => {
      const r = h('div', { class: 'toggle-row' });
      r.append(h('span', { class: 'zh' }, R(label)));
      const b = h('button', { class: 'icon-btn small' + (P[key] ? ' on' : '') }, P[key] ? '开' : '关');
      b.onclick = () => { P[key] = !P[key]; save(); b.textContent = P[key] ? '开' : '关'; b.classList.toggle('on', P[key]); applyPy(); if (key === 'py') rerender(); };
      r.append(b);
      return r;
    };
    card.append(h('h2', { class: 'zh', style: 'margin-top:0' }, R('设置')));
    card.append(row('拼音', 'py'), row('声音', 'snd'), row('自动朗读', 'auto'));
    const test = h('button', { class: 'big-btn secondary zh', style: 'margin-top:14px' }, '🔊 ' + R('试一试声音'));
    test.onclick = () => speak('你好！我是芽芽博士。我们一起学科学吧！');
    const reset = h('button', { class: 'big-btn secondary zh', style: 'margin-top:12px;color:#c0392b' }, '🗑️ ' + R('重新开始（删除所有记录）'));
    let armed = false;
    reset.onclick = () => {
      if (!armed) {
        armed = true;
        reset.innerHTML = '⚠️ ' + R('再按一次，确定删除');
        setTimeout(() => { armed = false; reset.innerHTML = '🗑️ ' + R('重新开始（删除所有记录）'); }, 4000);
        return;
      }
      const keep = { py: P.py, snd: P.snd, auto: P.auto };
      P = Object.assign(freshState(), keep); save(); m.remove(); showHome();
    };
    const close = h('button', { class: 'big-btn zh', style: 'margin-top:12px' }, R('好了'));
    close.onclick = () => m.remove();
    const note = h('p', { class: 'muted', style: 'font-size:13px;margin-bottom:0' }, 'Progress is saved on this device automatically.');
    card.append(test, reset, close, note);
    m.append(card);
    m.addEventListener('click', (e) => { if (e.target === m) m.remove(); });
    document.body.append(m);
  }

  let rerender = () => {};

  /* ================= missions ================= */
  const W = C.WORDS;
  function stationOf(word) {
    for (const sid in W) if (W[sid].some((x) => x.w === word)) return sid;
    return null;
  }
  function enOf(word) {
    for (const sid in W) { const f = W[sid].find((x) => x.w === word); if (f) return f.en; }
    return null;
  }
  const mc = (q) => ({ t: 'mc', q: q.q, en: q.en, why: q.why, scene: q.scene, test: !!q.test, opts: shuffle(q.o.map((x, i) => [x, i === 0 ? 1 : 0])) });
  const intro = (text, en, emoji) => ({ t: 'intro', text, en, emoji });

  function genGame(sid) {
    const Q = C.Q;
    let s = [];
    if (sid === 's1') {
      s.push(intro('欢迎来到技能小雷达！科学家用六种科学程序技能来探究世界：观察、分类、测量、推断、预测和沟通。看看图中的小朋友用了哪一种技能？',
        'Welcome! Scientists use six process skills: observe, classify, measure, infer, predict, communicate. Which skill is each child using?', '📡🔬🧒'));
      shuffle(C.SPOT.map((_, i) => i)).slice(0, 8).forEach((i) => s.push({ t: 'spot', i }));
      Q.s1.forEach((q) => s.push(mc(q)));
    } else if (sid === 's2') {
      s.push(intro('我们是分类高手！先观察水果的特征，再把它们分类。先按果皮的粗滑来分类吧！', 'Observe each fruit’s features, then sort them. First sort by skin: smooth or rough.', '🍍🍓🥝🍎'));
      const all8 = ['pineapple', 'strawberry', 'kiwi', 'redapple', 'greenapple', 'mango', 'lemon', 'banana'];
      s.push({ t: 'sort', rule: 'skin', items: shuffle(all8) });
      s.push({ t: 'sort', rule: 'taste', items: shuffle(all8) });
      s.push({ t: 'sort', rule: 'color', items: shuffle(['strawberry', 'redapple', 'cherry', 'greenapple', 'pear', 'lemon', 'banana']) });
      s.push(mc(Q.s2[0]));
      s.push({ t: 'dissolve' });
      s.push({ t: 'sort', rule: 'dis', items: shuffle(C.SUBSTANCES.map((x) => x.id)) });
      Q.s2.slice(1).forEach((q) => s.push(mc(q)));
    } else if (sid === 's3') {
      s.push(intro('来当小侦探！先观察，再根据经验作出推断。推断可以多过一个，选出最合理的推断吧！', 'Be a detective! First observe, then infer using your experience. Choose the most sensible inference.', '🕵️🔍'));
      const cs = shuffle(C.CASES.map((_, i) => i)).slice(0, 6);
      cs.forEach((i, k) => {
        s.push({ t: 'case', i });
        if (k === 1) s.push(mc(Q.s3[0]));
        if (k === 3) s.push(mc(Q.s3[1]));
      });
      s.push(mc(Q.s3[2]));
    } else if (sid === 's4') {
      s.push(intro('看看预测水晶球！预测就是根据观察、经验或资料，说出将会发生的事。先预测，再看看结果！', 'Prediction means saying what will happen, based on observation, experience or data. Predict first, then see!', '🔮✨'));
      C.PREDICT.forEach((_, i) => s.push({ t: 'predict', i, opts: shuffle(C.PREDICT[i].o) }));
      Q.s4.forEach((q) => s.push(mc(q)));
    } else if (sid === 's5') {
      s.push(intro('测量小能手！我们要使用合适的测量工具和正确的方法来测量。', 'Use the right measuring tool and the correct method.', '📏⏱️🌡️'));
      shuffle(C.TOOL_Q.map((_, i) => i)).forEach((i) => s.push({ t: 'tool', i, opts: shuffle(Object.keys(C.TOOLS)) }));
      s.push({ t: 'ruler', start: 0, len: rand(6, 12) });
      s.push({ t: 'ruler', start: 2, len: rand(5, 10) });
      s.push({ t: 'eye' });
      s.push({ t: 'cyl', ml: pick([25, 35, 45]) });
      s.push({ t: 'cyl', ml: pick([15, 20, 40]) });
      s.push({ t: 'stopwatch', d: rand(3, 6) });
      Q.s5.forEach((q) => s.push(mc(q)));
    } else if (sid === 's6') {
      s.push(intro('欢迎来到小小实验室！我们要做“会渗水的土壤”实验，比较沙土、壤土和黏土的渗水性。记得要正确和小心地使用科学用具哦！',
        'Welcome to the lab! We will compare how well sand, loam and clay let water through. Use the apparatus carefully!', '🧪🧤🪴'));
      s.push(mc(Q.s6[0]));
      s.push({ t: 'order', items: ['把滤纸折好', '把滤纸放进漏斗中', '把漏斗放在量筒上', '把土壤放进漏斗中', '慢慢倒入50毫升的水', '五分钟后，读取量筒的读数'] });
      s.push(mc(Q.s6[1]));
      s.push(mc(Q.s6[2]));
      s.push({ t: 'soil' });
      s.push({ t: 'cyl', ml: 40, label: '沙土' });
      Q.s6lab.forEach((q) => s.push(mc(q)));
      Q.s6after.forEach((q) => s.push(mc(q)));
    }
    s.push({ t: 'end' });
    return s;
  }

  function genWrite(sid) {
    const words = W[sid].map((x) => x.w);
    const s = [intro('写字关！每个词语先描红，再自己写。笔顺要正确哦！写错的字会放进错字本。',
      'Writing round! Trace each word, then write it yourself. Stroke order matters. Mistakes go into your mistake book.', '✍️📝')];
    words.forEach((w) => s.push({ t: 'learn', w }));
    s.push(intro('听写时间！听一听，然后写出词语。', 'Dictation! Listen, then write the word.', '👂✍️'));
    shuffle(words).forEach((w) => s.push({ t: 'dict', w }));
    s.push(intro('填一填！看句子，写出缺少的词语。', 'Fill in the blank: write the missing word.', '🧩✍️'));
    shuffle(words).slice(0, 4).forEach((w) => s.push({ t: 'fill', w }));
    (C.BUILD[sid] || []).forEach((_, i) => s.push({ t: 'build', sid, i }));
    s.push({ t: 'end' });
    return s;
  }

  function genFinal() {
    const all = [];
    for (const sid in W) W[sid].forEach((x) => all.push(x.w));
    const mistChars = Object.keys(P.mistakes);
    const weak = all.filter((w) => [...w].some((c) => mistChars.includes(c)));
    const rest = shuffle(all.filter((w) => !weak.includes(w)));
    const list = shuffle(weak).slice(0, 8).concat(rest).slice(0, 12);
    const s = [intro('听写大挑战！一共' + list.length + '个词语。听一听，然后写出来。加油！', 'Big dictation challenge! Listen and write each word.', '🏆✍️')];
    shuffle(list).forEach((w) => s.push({ t: 'dict', w }));
    s.push({ t: 'end' });
    return s;
  }

  function genReview() {
    const chars = Object.keys(P.mistakes).sort((a, b) => P.mistakes[b] - P.mistakes[a]).slice(0, 8);
    const s = [intro('练习错字！写对了的字会从错字本里拿走。', 'Practise your mistake characters. Ones you write well are removed from the book.', '📕✍️')];
    chars.forEach((c) => s.push({ t: 'learn', w: c, review: true }));
    s.push({ t: 'end' });
    return s;
  }

  const MISSION_NAMES = { game: '科学游戏', write: '写字关' };
  function missionTitle(key) {
    if (key === 'final') return '听写大挑战';
    if (key === 'review') return '练习错字';
    if (key === 'practice') return '写字练习';
    const [sid, kind] = key.split('.');
    const st = C.STATIONS.find((x) => x.id === sid);
    return st.n + ' · ' + MISSION_NAMES[kind];
  }

  function startMission(key, fresh, extra) {
    let m = P.m[key];
    if (fresh || !m || m.done) {
      let steps;
      if (key === 'final') steps = genFinal();
      else if (key === 'review') steps = genReview();
      else if (key === 'practice') steps = [{ t: 'learn', w: extra }, { t: 'end' }];
      else {
        const [sid, kind] = key.split('.');
        steps = kind === 'game' ? genGame(sid) : genWrite(sid);
      }
      m = P.m[key] = { steps, idx: 0, got: 0, total: 0, done: false, newMist: [] };
      save();
    }
    runMission(key);
  }

  let curKey = null;
  function runMission(key) {
    curKey = key;
    const m = P.m[key];
    const back = () => {
      if (key.includes('.')) showStation(key.split('.')[0]);
      else if (key === 'practice') showWords();
      else showHome();
    };
    app.innerHTML = '';
    app.append(topbar(missionTitle(key), back));
    const prog = h('div', { class: 'progress' }, `<i style="width:${Math.round((m.idx / (m.steps.length - 1)) * 100)}%"></i>`);
    app.append(prog);
    const main = h('main');
    app.append(main);
    const step = m.steps[m.idx];
    const api = {
      key, m,
      done(got, total) {
        m.got += got || 0; m.total += total || 0; m.idx++; save();
        window.scrollTo(0, 0);
        runMission(key);
      },
      back,
    };
    rerender = () => runMission(key);
    const fn = STEPS[step.t];
    fn(main, step, api);
    window.scrollTo(0, 0);
  }

  /* ================= step renderers ================= */
  const STEPS = {};

  STEPS.intro = (root, s, api) => {
    root.append(bubble(s.text, s.en));
    if (s.emoji) root.append(scene(s.emoji));
    nextBtn(root, '开始', () => api.done(0, 0));
  };

  STEPS.mc = (root, s, api) => {
    root.append(bubble(s.q, s.en, { test: s.test }));
    if (s.scene) root.append(scene(s.scene));
    chooser(root, s.opts, {
      onPick(score, first) {
        feedback(root, true, (first ? '答对了！' : '对了！') + (s.why || ''));
        nextBtn(root, '继续', () => api.done(first ? 1 : 0, 1));
      },
    });
  };

  /* ---- Station 1: skill spotter ---- */
  STEPS.spot = (root, s, api) => {
    const it = C.SPOT[s.i];
    root.append(bubble('他们用了哪一种科学程序技能？', 'Which science process skill are they using?'));
    root.append(scene(it.scene, it.t));
    const enEl = h('div', { class: 'en' }, esc(it.en));
    const hint = h('button', { class: 'mini', style: 'margin:-6px 0 12px' }, '? English');
    hint.onclick = () => enEl.classList.toggle('show');
    const say = h('button', { class: 'mini', style: 'margin:-6px 8px 12px 0' }, '🔊');
    say.onclick = () => speak(it.t);
    root.append(say, hint, enEl);
    chooser(root, C.SKILLS.map((k) => [k, k === it.a ? 1 : 0]), {
      cols: 'three', center: true,
      onPick(score, first) {
        feedback(root, true, it.a + '！' + it.why);
        nextBtn(root, '继续', () => api.done(first ? 1 : 0, 1));
      },
      onWrong(o) {
        feedback(root, false, '不是“' + o[0] + '”哦，再想一想！');
      },
    });
  };

  /* ---- Station 2: sorting ---- */
  const RULES = {
    skin: { bins: ['光滑', '粗糙'], feat: '果皮', key: (id) => C.FRUITS[id].skin, q: '按果皮的特征分类：光滑还是粗糙？先点水果，再点篮子。', en: 'Sort by skin: smooth or rough? Tap a fruit, then a basket.' },
    taste: { bins: ['甜', '酸'], feat: '味道', key: (id) => C.FRUITS[id].taste, q: '换一个特征！这次按味道分类：甜还是酸？', en: 'Change the feature! Now sort by taste: sweet or sour?' },
    color: { bins: ['红色', '绿色', '黄色'], feat: '颜色', key: (id) => C.FRUITS[id].color, q: '再换一个特征！按颜色分类。', en: 'Another feature! Sort by colour.' },
    dis: { bins: ['会溶解', '不会溶解'], feat: '', key: (id) => (C.SUBSTANCES.find((x) => x.id === id).dis ? '会溶解' : '不会溶解'), q: '根据实验结果，把物质分类：会溶解还是不会溶解？', en: 'Using your results, sort the substances: dissolves or does not dissolve?' },
  };
  function itemInfo(rule, id) {
    if (rule === 'dis') {
      const sb = C.SUBSTANCES.find((x) => x.id === id);
      return { name: sb.n, icon: `<span class="pile" style="display:block;width:40px;height:26px;margin:4px auto 6px;border-radius:50% 50% 8px 8px;background:${sb.color};border:1px solid rgba(0,0,0,.2)"></span>` };
    }
    const f = C.FRUITS[id];
    return { name: f.n, icon: `<span class="ie">${f.e}</span>` };
  }
  STEPS.sort = (root, s, api) => {
    const rule = RULES[s.rule];
    root.append(bubble(rule.q, rule.en));
    const tray = h('div', { class: 'tray' });
    const bins = h('div', { class: 'bins n' + rule.bins.length });
    let sel = null, firstTryOk = 0, left = s.items.length;
    const wrongOnce = new Set();
    s.items.forEach((id) => {
      const info = itemInfo(s.rule, id);
      const it = h('button', { class: 'item' }, info.icon + `<span class="in zh">${R(info.name)}</span>`);
      it.onclick = () => {
        if (sel) sel.classList.remove('sel');
        sel = it === sel ? null : it;
        if (sel) { sel.classList.add('sel'); sel.dataset.id = id; speak(info.name); }
      };
      it.dataset.id = id;
      tray.append(it);
    });
    rule.bins.forEach((b) => {
      const bin = h('button', { class: 'bin', 'data-t': b });
      bin.innerHTML = `<div class="bl zh">${R(b)}</div><div class="bi"></div>`;
      bin.onclick = () => {
        if (!sel) { feedback(root, false, '先点一个' + (s.rule === 'dis' ? '物质' : '水果') + '，再点篮子。'); return; }
        const id = sel.dataset.id;
        const info = itemInfo(s.rule, id);
        const right = rule.key(id);
        if (right === b) {
          sGood();
          if (!wrongOnce.has(id)) firstTryOk++;
          const chip = h('span', { class: 'item done', style: 'width:auto;padding:2px 6px;box-shadow:none' }, s.rule === 'dis' ? `<span class="in zh">${R(info.name)}</span>` : C.FRUITS[id].e);
          bin.querySelector('.bi').append(chip);
          sel.remove(); sel = null; left--;
          const fb = root.querySelector('.feedback'); if (fb) fb.remove();
          if (left === 0) {
            setMood(root, 'happy');
            feedback(root, true, s.rule === 'dis' ? '分类完成！糖、盐和咖啡粉会溶解；沙和胡椒粉不会溶解。' : '分类完成！你是分类高手！');
            confetti();
            nextBtn(root, '继续', () => api.done(firstTryOk / s.items.length, 1));
          }
        } else {
          sBad();
          wrongOnce.add(id);
          sel.classList.remove('sel'); sel = null;
          bin.classList.remove('bad'); void bin.offsetWidth; bin.classList.add('bad');
          const msg = s.rule === 'dis' ? `${info.name}${right === '会溶解' ? '会' : '不会'}溶解在水里哦！` : `${info.name}的${rule.feat}是${right}的哦！`;
          feedback(root, false, msg);
          speak(msg);
        }
      };
      bins.append(bin);
    });
    root.append(tray, bins);
  };

  /* ---- Station 2: dissolve lab ---- */
  STEPS.dissolve = (root, s, api) => {
    root.append(bubble('把物质放进水中搅拌，观察会发生什么事？点一点每一种物质。', 'Stir each substance into water. What happens? Tap each one.'));
    const jars = h('div', { class: 'jars' });
    const wrap = h('div', { class: 'svg-wrap' });
    wrap.innerHTML = `<svg viewBox="0 0 220 210" class="lab-svg" id="cup">
      <rect x="0" y="0" width="220" height="210" fill="#fffdf7"/>
      <path d="M55 40 L65 190 Q110 200 155 190 L165 40" fill="#eef8ff" stroke="#9cc7e6" stroke-width="4"/>
      <path id="water" d="M59 80 L65 188 Q110 197 155 188 L161 80 Z" fill="#cdeaff"/>
      <g id="parts"></g>
      <g id="spoon" style="transform-origin:110px 120px;transform-box:view-box"><line x1="150" y1="10" x2="112" y2="170" stroke="#9e9e9e" stroke-width="6" stroke-linecap="round"/><ellipse cx="112" cy="172" rx="10" ry="6" fill="#bdbdbd"/></g>
      <text id="restext" x="110" y="30" text-anchor="middle" font-size="18" font-weight="700" fill="#2d2a32"></text>
    </svg>`;
    const done = new Set();
    let busy = false;
    C.SUBSTANCES.forEach((sb) => {
      const j = h('button', { class: 'jar' });
      j.innerHTML = `<div class="pile" style="background:${sb.color}"></div><div class="zh">${R(sb.n)}</div><div class="res"></div>`;
      j.onclick = async () => {
        if (busy) return;
        busy = true;
        speak(sb.n);
        const svg = wrap.querySelector('svg');
        const parts = svg.querySelector('#parts');
        const water = svg.querySelector('#water');
        const spoon = svg.querySelector('#spoon');
        svg.querySelector('#restext').textContent = '';
        water.setAttribute('fill', '#cdeaff');
        parts.innerHTML = '';
        const ps = [];
        for (let i = 0; i < 18; i++) {
          const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          c.setAttribute('cx', 80 + Math.random() * 60); c.setAttribute('cy', 50 + Math.random() * 10); c.setAttribute('r', 3.5);
          c.setAttribute('fill', sb.color); c.setAttribute('stroke', 'rgba(0,0,0,.25)');
          c.style.transition = 'transform .7s ease-in, opacity 1.2s';
          parts.append(c); ps.push(c);
        }
        await wait(60);
        ps.forEach((c) => { c.style.transform = `translateY(${40 + Math.random() * 80}px)`; });
        await wait(700);
        spoon.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-14deg)' }, { transform: 'rotate(12deg)' }, { transform: 'rotate(-10deg)' }, { transform: 'rotate(0deg)' }], { duration: 1100 });
        ps.forEach((c) => { c.style.transition = 'transform 1.1s ease-in-out, opacity 1.2s'; c.style.transform = `translate(${(Math.random() - 0.5) * 30}px, ${40 + Math.random() * 80}px)`; });
        await wait(1100);
        if (sb.dis) {
          ps.forEach((c) => { c.style.opacity = 0; });
          if (sb.tint) water.setAttribute('fill', sb.tint);
        } else {
          ps.forEach((c) => { c.style.transition = 'transform 1.2s ease-in'; c.style.transform = `translate(${(Math.random() - 0.5) * 50}px, ${128 + Math.random() * 6}px)`; });
        }
        await wait(1200);
        const res = sb.dis ? '溶解了！' : '不溶解，沉在杯底。';
        svg.querySelector('#restext').textContent = sb.n + (sb.dis ? '：溶解了' : '：不溶解');
        j.querySelector('.res').innerHTML = R(sb.dis ? '溶解' : '不溶解');
        j.classList.add('tested');
        speak(sb.n + res);
        done.add(sb.id);
        busy = false;
        if (done.size === C.SUBSTANCES.length && !root.querySelector('.next-wrap')) {
          feedback(root, true, '你观察了五种物质！有些物质会溶解在水中，有些不会。');
          nextBtn(root, '继续', () => api.done(0, 0));
        }
      };
      jars.append(j);
    });
    root.append(jars, wrap);
  };

  /* ---- Station 3: detective ---- */
  STEPS.case = (root, s, api) => {
    const c = C.CASES[s.i];
    root.append(bubble('第一步：观察。你看到了什么？（观察是用感官直接看到的。）', 'Step 1: Observe. What do you actually see?'));
    root.append(scene(c.scene, c.t));
    const enEl = h('div', { class: 'en' }, esc(c.en));
    const hint = h('button', { class: 'mini', style: 'margin:-6px 0 12px' }, '? English');
    hint.onclick = () => enEl.classList.toggle('show');
    root.append(hint, enEl);
    let pts = 0;
    const obsBox = chooser(root, shuffle(c.obs), {
      onPick(score, first) {
        pts += first ? 1 : 0;
        feedback(root, true, '对！这是观察。');
        setTimeout(() => {
          const fb = root.querySelector('.feedback'); if (fb) fb.remove();
          obsBox.style.opacity = .55; obsBox.style.pointerEvents = 'none';
          const b2 = bubble('第二步：推断。你认为发生了什么事？选出最合理的推断。', 'Step 2: Infer. What do you think happened? Pick the most sensible inference.', {});
          b2.style.marginTop = '18px';
          root.append(b2);
          b2.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const sub = h('div');
          root.append(sub);
          chooser(sub, shuffle(c.inf), {
            render: (o) => R(o[0]),
            onPick(score2, first2, max) {
              const best = c.inf.find((x) => x[1] === 3)[0];
              pts += first2 ? score2 / 3 : 0;
              if (score2 === 3) feedback(sub, true, '最合理的推断！⭐⭐⭐ ' + c.why);
              else if (score2 === 2) feedback(sub, true, '这个推断也合理！⭐⭐ 最合理的推断是：“' + best + '” ' + c.why);
              else feedback(sub, true, '有可能，但不太合理。⭐ 最合理的推断是：“' + best + '”');
              nextBtn(sub, '继续', () => api.done(pts, 2));
            },
            onWrong() { feedback(sub, false, '这个推断不合理，再想一想！'); },
          });
        }, 900);
      },
      onWrong(o) {
        feedback(root, false, '“' + o[0] + '”不是你直接看到的，再想一想！');
      },
    });
  };

  /* ---- Station 4: predictions ---- */
  function predictVisual(p) {
    const wrap = h('div', { class: 'svg-wrap' });
    if (p.kind === 'cloth') {
      wrap.innerHTML = `<svg viewBox="0 0 400 210">
        <rect x="0" y="0" width="195" height="210" rx="14" fill="#bfe8ff"/>
        <circle cx="38" cy="36" r="18" fill="#ffd23f"/><g stroke="#ffd23f" stroke-width="3">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<line x1="${38 + 23 * Math.cos(a * Math.PI / 180)}" y1="${36 + 23 * Math.sin(a * Math.PI / 180)}" x2="${38 + 30 * Math.cos(a * Math.PI / 180)}" y2="${36 + 30 * Math.sin(a * Math.PI / 180)}"/>`).join('')}</g>
        <g stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"><path d="M120 40 Q140 34 160 40 Q170 44 180 38"/><path d="M110 58 Q135 52 160 58"/><path d="M125 76 Q150 70 178 76"/></g>
        <rect x="0" y="170" width="195" height="40" fill="#8bd06a"/>
        <line x1="40" y1="90" x2="160" y2="90" stroke="#777" stroke-width="5"/><line x1="100" y1="90" x2="100" y2="190" stroke="#777" stroke-width="6"/>
        <rect id="clM" x="70" y="92" width="60" height="58" rx="4" fill="#d94f78" style="transition:fill 2s"/>
        <g id="dM" fill="#5ab0ff" style="transition:opacity 2s"><ellipse cx="80" cy="160" rx="3" ry="5"/><ellipse cx="100" cy="166" rx="3" ry="5"/><ellipse cx="120" cy="158" rx="3" ry="5"/></g>
        <circle cx="25" cy="185" r="16" fill="#fff"/><text x="25" y="192" font-size="20" font-weight="800" text-anchor="middle">M</text>
        <rect x="205" y="0" width="195" height="210" rx="14" fill="#f7e7c6"/>
        <rect x="290" y="20" width="80" height="60" fill="#d6efff" stroke="#b58b55" stroke-width="6"/>
        <line x1="330" y1="20" x2="330" y2="80" stroke="#b58b55" stroke-width="4"/>
        <line x1="225" y1="100" x2="345" y2="100" stroke="#777" stroke-width="5"/>
        <rect id="clN" x="255" y="102" width="60" height="58" rx="4" fill="#d94f78" style="transition:fill 6s"/>
        <g id="dN" fill="#5ab0ff" style="transition:opacity 6s"><ellipse cx="265" cy="170" rx="3" ry="5"/><ellipse cx="285" cy="176" rx="3" ry="5"/><ellipse cx="305" cy="168" rx="3" ry="5"/></g>
        <circle cx="380" cy="185" r="16" fill="#fff"/><text x="380" y="192" font-size="20" font-weight="800" text-anchor="middle">N</text>
      </svg>`;
      wrap.reveal = () => {
        const svg = wrap.querySelector('svg');
        svg.querySelector('#clM').setAttribute('fill', '#ffd3df'); svg.querySelector('#clN').setAttribute('fill', '#ffd3df');
        svg.querySelector('#dM').style.opacity = 0; svg.querySelector('#dN').style.opacity = 0;
      };
    } else if (p.kind === 'ice') {
      wrap.innerHTML = `<svg viewBox="0 0 400 200">
        <g><path d="M40 50 L55 185 L165 185 L180 50Z" fill="#fff" stroke="#9cc7e6" stroke-width="4"/><path d="M45 80 L56 182 L164 182 L175 80Z" fill="#ffb3a7"/>
        <g stroke="#ff8a7a" stroke-width="3" fill="none"><path d="M80 40 Q72 28 80 16 Q88 4 80 -8"/><path d="M110 40 Q102 28 110 16 Q118 4 110 -8"/><path d="M140 40 Q132 28 140 16 Q148 4 140 -8"/></g>
        <rect id="iceH" x="90" y="88" width="40" height="40" rx="6" fill="#e9fbff" stroke="#8fd3ff" stroke-width="3" style="transform-box:fill-box;transform-origin:center;transition:transform 2s"/>
        <text x="110" y="200" text-anchor="middle" font-size="18" font-weight="700">热水</text></g>
        <g><path d="M220 50 L235 185 L345 185 L360 50Z" fill="#fff" stroke="#9cc7e6" stroke-width="4"/><path d="M225 80 L236 182 L344 182 L355 80Z" fill="#b3e0ff"/>
        <rect id="iceC" x="270" y="88" width="40" height="40" rx="6" fill="#e9fbff" stroke="#8fd3ff" stroke-width="3" style="transform-box:fill-box;transform-origin:center;transition:transform 6s"/>
        <text x="290" y="200" text-anchor="middle" font-size="18" font-weight="700">冷水</text></g>
      </svg>`;
      wrap.reveal = () => {
        wrap.querySelector('#iceH').style.transform = 'scale(0.05)';
        wrap.querySelector('#iceC').style.transform = 'scale(0.65)';
      };
    } else if (p.kind === 'cups') {
      wrap.innerHTML = `<svg viewBox="0 0 400 210">
        <circle cx="200" cy="34" r="22" fill="#ffd23f"/>
        <g stroke="#ffb800" stroke-width="3">${[0, 60, 120, 180, 240, 300].map((a) => `<line x1="${200 + 28 * Math.cos(a * Math.PI / 180)}" y1="${34 + 28 * Math.sin(a * Math.PI / 180)}" x2="${200 + 36 * Math.cos(a * Math.PI / 180)}" y2="${34 + 36 * Math.sin(a * Math.PI / 180)}"/>`).join('')}</g>
        <rect x="70" y="80" width="80" height="110" rx="10" fill="#2d2a32"/>
        <rect x="250" y="80" width="80" height="110" rx="10" fill="#ffffff" stroke="#cfcfcf" stroke-width="3"/>
        <text x="110" y="206" text-anchor="middle" font-size="16" font-weight="700">黑色</text>
        <text x="290" y="206" text-anchor="middle" font-size="16" font-weight="700">白色</text>
        <g id="temps" style="opacity:0;transition:opacity 1s">
          <rect x="72" y="58" width="76" height="28" rx="8" fill="#e5534b"/><text x="110" y="78" text-anchor="middle" font-size="18" font-weight="800" fill="#fff">40°C</text>
          <rect x="252" y="58" width="76" height="28" rx="8" fill="#5bc0eb"/><text x="290" y="78" text-anchor="middle" font-size="18" font-weight="800" fill="#fff">33°C</text>
        </g>
      </svg>`;
      wrap.reveal = () => { wrap.querySelector('#temps').style.opacity = 1; };
    } else if (p.kind === 'chart') {
      const years = [];
      for (let y = 2013; y <= p.year; y += 2) years.push(y);
      const val = (y) => Math.max(0, 650 - ((y - 2013) / 2) * 100);
      const n = years.length, W0 = 400, base = 200, bw = Math.min(60, (W0 - 40) / n - 10);
      const bars = years.map((y, i) => {
        const x = 30 + i * ((W0 - 40) / n);
        const v = val(y), hgt = (v / 700) * 160;
        const known = y <= 2017;
        const target = y === p.year;
        if (target) {
          return `<g><rect x="${x}" y="${base - 160}" width="${bw}" height="160" fill="none" stroke="#a77bdb" stroke-width="3" stroke-dasharray="6 5" rx="6"/>
            <text class="q" x="${x + bw / 2}" y="${base - 70}" text-anchor="middle" font-size="34" font-weight="800" fill="#a77bdb">?</text>
            <rect class="ans" x="${x}" y="${base - hgt}" width="${bw}" height="${hgt}" fill="#a77bdb" rx="6" style="opacity:0;transition:opacity 1s"/>
            <text class="ans" x="${x + bw / 2}" y="${base - hgt - 6}" text-anchor="middle" font-size="15" font-weight="700" style="opacity:0;transition:opacity 1s">${v}</text>
            <text x="${x + bw / 2}" y="${base + 20}" text-anchor="middle" font-size="14" font-weight="700">${y}</text></g>`;
        }
        return `<g><rect x="${x}" y="${base - hgt}" width="${bw}" height="${hgt}" fill="${known ? '#ff9f68' : '#ffd0b0'}" rx="6"/>
          <text x="${x + bw / 2}" y="${base - hgt - 6}" text-anchor="middle" font-size="15" font-weight="700">${v}</text>
          <text x="${x + bw / 2}" y="${base + 20}" text-anchor="middle" font-size="14" font-weight="700">${y}</text></g>`;
      }).join('');
      wrap.innerHTML = `<svg viewBox="0 0 400 230"><text x="10" y="18" font-size="15" font-weight="700" fill="#6f6a75">P动物的数量（只）</text><line x1="20" y1="${base}" x2="395" y2="${base}" stroke="#999" stroke-width="2"/>${bars}</svg>`;
      wrap.reveal = () => {
        wrap.querySelectorAll('.ans').forEach((e) => { e.style.opacity = 1; });
        const q = wrap.querySelector('.q'); if (q) q.style.opacity = 0;
      };
    } else {
      const sc = scene(p.scene);
      sc.reveal = () => {};
      return sc;
    }
    return wrap;
  }
  STEPS.predict = (root, s, api) => {
    const p = C.PREDICT[s.i];
    root.append(bubble(p.q, p.en, { test: p.test }));
    const vis = predictVisual(p);
    root.append(vis);
    chooser(root, s.opts, {
      onPick(score, first) {
        vis.reveal();
        feedback(root, true, (first ? '预测正确！' : '对了！') + p.why);
        nextBtn(root, '继续', () => api.done(first ? 1 : 0, 1));
      },
      onWrong() {
        feedback(root, false, '再想一想，根据你的经验或资料来预测。');
      },
    });
  };

  /* ---- Station 5: measuring ---- */
  function cylinderSVG(ml, label) {
    const y = (v) => 250 - v * 4;
    let ticks = '';
    for (let v = 0; v <= 50; v += 5) {
      const big = v % 10 === 0;
      ticks += `<line x1="72" y1="${y(v)}" x2="${big ? 96 : 86}" y2="${y(v)}" stroke="#2d2a32" stroke-width="${big ? 2.5 : 1.5}"/>`;
      if (big) ticks += `<text x="140" y="${y(v) + 5}" font-size="15" font-weight="700">${v}</text>`;
    }
    const wy = y(ml);
    return `<svg viewBox="0 0 200 290">
      ${label ? `<text x="100" y="20" text-anchor="middle" font-size="18" font-weight="800">${label}</text>` : ''}
      <text x="168" y="44" font-size="13" fill="#6f6a75">ml</text>
      <rect x="70" y="${y(ml) - 2}" width="60" height="${250 - wy + 2}" fill="#9fd8ff" opacity=".85"/>
      <path d="M71 ${wy - 4} Q100 ${wy + 6} 129 ${wy - 4}" stroke="#2b86c5" stroke-width="3" fill="#9fd8ff"/>
      <path d="M70 34 L70 252 M130 34 L130 252" stroke="#9cb8cc" stroke-width="4"/>
      <path d="M66 34 L74 34 M126 34 L136 30" stroke="#9cb8cc" stroke-width="4"/>
      ${ticks}
      <rect x="45" y="252" width="110" height="16" rx="5" fill="#9cb8cc"/>
    </svg>`;
  }

  STEPS.tool = (root, s, api) => {
    const t = C.TOOL_Q[s.i];
    root.append(bubble('要测量“' + t.t + '”，应该用什么工具？', 'To measure ' + t.en + ', which tool should you use?'));
    root.append(scene(t.scene));
    chooser(root, s.opts.map((k) => [k, k === t.a ? 1 : 0]), {
      cols: 'two', center: true,
      render: (o) => `<span style="font-size:40px;display:block;line-height:1.2">${C.TOOLS[o[0]].e}</span>${R(C.TOOLS[o[0]].n)}`,
      sayText: (o) => C.TOOLS[o[0]].n,
      onPick(score, first) {
        feedback(root, true, '对了！测量' + t.t + '要用' + C.TOOLS[t.a].n + '。');
        nextBtn(root, '继续', () => api.done(first ? 1 : 0, 1));
      },
    });
  };

  STEPS.ruler = (root, s, api) => {
    const end = s.start + s.len;
    root.append(bubble('读一读：这支铅笔有多长？', 'How long is this pencil?'));
    const X = (cm) => 20 + cm * 40;
    let ticks = '';
    for (let mm = 0; mm <= 150; mm++) {
      const x = 20 + mm * 4;
      const hgt = mm % 10 === 0 ? 24 : mm % 5 === 0 ? 16 : 9;
      ticks += `<line x1="${x}" y1="100" x2="${x}" y2="${100 + hgt}" stroke="#2d2a32" stroke-width="${mm % 10 === 0 ? 2 : 1}"/>`;
      if (mm % 10 === 0) ticks += `<text x="${x}" y="${140}" text-anchor="middle" font-size="15" font-weight="700">${mm / 10}</text>`;
    }
    const x0 = X(s.start), x1 = X(end);
    const wrap = h('div', { class: 'svg-wrap' });
    wrap.innerHTML = `<svg viewBox="0 0 640 165">
      <rect x="10" y="98" width="620" height="60" rx="6" fill="#ffe08a" stroke="#e0b84a" stroke-width="2"/>
      ${ticks}
      <text x="600" y="154" font-size="13" fill="#6f6a75">厘米</text>
      <line x1="${x0}" y1="40" x2="${x0}" y2="100" stroke="#e5534b" stroke-width="2" stroke-dasharray="5 4"/>
      <line x1="${x1}" y1="40" x2="${x1}" y2="100" stroke="#e5534b" stroke-width="2" stroke-dasharray="5 4"/>
      <rect x="${x0}" y="50" width="14" height="30" fill="#ff9fb0"/>
      <rect x="${x0 + 14}" y="50" width="8" height="30" fill="#c0c0c0"/>
      <rect x="${x0 + 22}" y="50" width="${x1 - x0 - 52}" height="30" fill="#ffc542"/>
      <rect x="${x0 + 22}" y="60" width="${x1 - x0 - 52}" height="10" fill="#ffb300"/>
      <polygon points="${x1 - 30},50 ${x1 - 30},80 ${x1},65" fill="#f5d6a8"/>
      <polygon points="${x1 - 10},60 ${x1 - 10},70 ${x1},65" fill="#2d2a32"/>
    </svg>`;
    root.append(wrap);
    const opts = shuffle([[s.len + ' 厘米', 1], [(s.start ? end : s.len + 1) + ' 厘米', 0], [(s.len - 1) + ' 厘米', 0]]);
    chooser(root, opts, {
      onPick(score, first) {
        const why = s.start ? `铅笔从${s.start}厘米开始，到${end}厘米结束：${end} − ${s.start} ＝ ${s.len}厘米。` : `铅笔从0开始，到${end}厘米结束，所以是${s.len}厘米。`;
        feedback(root, true, why);
        nextBtn(root, '继续', () => api.done(first ? 1 : 0, 1));
      },
      onWrong() {
        feedback(root, false, s.start ? '小心！铅笔不是从0开始的。' : '看看铅笔的头和尾在哪里。');
      },
    });
  };

  STEPS.eye = (root, s, api) => {
    root.append(bubble('读取量筒的读数时，眼睛应该在哪里？点一点正确的眼睛。', 'When reading a measuring cylinder, where should your eye be? Tap the right eye.', { test: true }));
    const wrap = h('div', { class: 'svg-wrap', style: 'position:relative;max-width:360px;margin:0 auto 14px' });
    wrap.innerHTML = cylinderSVG(30);
    const posts = [['high', '14%'], ['level', 'calc(' + ((130 - 7) / 290 * 100) + '% - 28px)'], ['low', '72%']];
    let tries = 0, finished = false;
    posts.forEach(([k, top]) => {
      const b = h('button', { class: 'eye-btn', style: `left:4%;top:${top}` }, '👁️');
      b.onclick = () => {
        if (finished) return;
        tries++;
        if (k === 'level') {
          finished = true;
          b.classList.add('good'); sGood(); setMood(root, 'happy');
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          const svg = wrap.querySelector('svg');
          line.setAttribute('x1', 0); line.setAttribute('x2', 200); line.setAttribute('y1', 130); line.setAttribute('y2', 130);
          line.setAttribute('stroke', '#3cb371'); line.setAttribute('stroke-width', 3); line.setAttribute('stroke-dasharray', '6 5');
          svg.append(line);
          feedback(root, true, '对了！视线要与弯月面平行，读数才准确。这里是30毫升。');
          nextBtn(root, '继续', () => api.done(tries === 1 ? 1 : 0, 1));
        } else {
          b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); sBad(); setMood(root, 'sad');
          feedback(root, false, k === 'high' ? '从上面往下看，读数会不准确。' : '从下面往上看，读数也不准确。');
        }
      };
      wrap.append(b);
    });
    root.append(wrap);
  };

  STEPS.cyl = (root, s, api) => {
    const q = s.label ? '读一读：' + s.label + '下面的量筒里有多少毫升的水？' : '读一读：量筒里有多少毫升的水？';
    root.append(bubble(q, 'Read the measuring cylinder: how many millilitres (ml) of water?', { test: true }));
    const wrap = h('div', { class: 'svg-wrap', style: 'max-width:300px;margin:0 auto 14px' });
    wrap.innerHTML = cylinderSVG(s.ml, s.label);
    root.append(wrap);
    const wrongs = shuffle([s.ml + 5, s.ml - 5, s.ml + 10, s.ml - 10].filter((v) => v > 0 && v <= 50)).slice(0, 2);
    chooser(root, shuffle([[s.ml + ' 毫升', 1]].concat(wrongs.map((v) => [v + ' 毫升', 0]))), {
      cols: 'three', center: true,
      onPick(score, first) {
        feedback(root, true, `对了！水面（弯月面）在${s.ml}毫升的位置。` + (s.label === '沙土' ? '沙土让最多的水渗过去。' : ''));
        nextBtn(root, '继续', () => api.done(first ? 1 : 0, 1));
      },
      onWrong() { feedback(root, false, '每一小格是5毫升。看看弯月面的最低点。'); },
    });
  };

  STEPS.stopwatch = (root, s, api) => {
    root.append(bubble('测量网球滚动的时间！按“开始”，网球就会滚动。网球停下来时，马上按“停止”。', 'Press Start: the ball rolls. Press Stop as soon as it stops!'));
    const track = h('div', { style: 'position:relative;height:70px;background:linear-gradient(#fff,#e8f6df);border-radius:18px;border:2px solid var(--line);margin-bottom:10px;overflow:hidden' });
    const ball = h('div', { style: 'position:absolute;left:8px;top:12px;font-size:40px;transition:none' }, '🎾');
    track.append(ball);
    const face = h('div', { class: 'stopwatch-face' }, '0.0 秒');
    const btn = h('button', { class: 'big-btn' }, '▶️ ' + R('开始'));
    root.append(track, face, btn);
    let state = 0, t0 = 0, raf = 0, stopped = 0;
    const tick = () => { const t = (performance.now() - t0) / 1000; face.textContent = t.toFixed(1) + ' 秒'; raf = requestAnimationFrame(tick); };
    btn.onclick = () => {
      if (state === 0) {
        state = 1; t0 = performance.now();
        ball.style.transition = `left ${s.d}s cubic-bezier(.25,.6,.4,1), transform ${s.d}s linear`;
        requestAnimationFrame(() => { ball.style.left = 'calc(100% - 56px)'; ball.style.transform = 'rotate(720deg)'; });
        btn.innerHTML = '⏹️ ' + R('停止');
        raf = requestAnimationFrame(tick);
      } else if (state === 1) {
        state = 2; cancelAnimationFrame(raf);
        stopped = (performance.now() - t0) / 1000;
        face.textContent = stopped.toFixed(1) + ' 秒';
        btn.remove();
        const diff = Math.abs(stopped - s.d);
        const note = diff < 0.6 ? '你按得很准！' : stopped < s.d ? '你按得早了一点。' : '你按得晚了一点。';
        const b2 = bubble(note + '网球大约滚了几秒？', 'About how many seconds did the ball roll?', { mood: 'happy' });
        root.append(b2);
        const wr = shuffle([s.d - 2, s.d + 2, s.d + 4].filter((v) => v > 0)).slice(0, 2);
        const sub = h('div'); root.append(sub);
        chooser(sub, shuffle([[s.d + ' 秒', 1]].concat(wr.map((v) => [v + ' 秒', 0]))), {
          cols: 'three', center: true,
          onPick(score, first) {
            feedback(sub, true, `网球滚了大约${s.d}秒。我们用秒表来测量时间。`);
            nextBtn(sub, '继续', () => api.done(first ? 1 : 0, 1));
          },
          onWrong() { feedback(sub, false, '看看秒表上的数字。'); },
        });
      }
    };
  };

  /* ---- Station 6: lab ---- */
  STEPS.order = (root, s, api) => {
    root.append(bubble('实验步骤是怎样的？按正确的顺序点一点。', 'Tap the experiment steps in the correct order.'));
    const list = h('div', { class: 'order-list' });
    let next = 0, mistakes = 0;
    shuffle(s.items.map((t, i) => [t, i])).forEach(([t, i]) => {
      const b = h('button', { class: 'order-item' }, `<span class="n">?</span><span class="zh">${R(t)}</span>`);
      b.onclick = () => {
        if (b.classList.contains('placed')) return;
        if (i === next) {
          sGood(); speak(t);
          b.classList.add('placed'); b.querySelector('.n').textContent = next + 1;
          next++;
          const fb = root.querySelector('.feedback'); if (fb) fb.remove();
          if (next === s.items.length) {
            [...list.children].sort((a, c) => +a.querySelector('.n').textContent - +c.querySelector('.n').textContent).forEach((e) => list.append(e));
            setMood(root, 'happy');
            feedback(root, true, '步骤完全正确！');
            nextBtn(root, '继续', () => api.done(mistakes === 0 ? 1 : mistakes <= 2 ? 0.5 : 0, 1));
          }
        } else {
          mistakes++; sBad();
          b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
          feedback(root, false, '这一步还没到哦！第' + (next + 1) + '步是什么？');
        }
      };
      list.append(b);
    });
    root.append(list);
  };

  STEPS.soil = (root, s, api) => {
    root.append(bubble('把相同分量的黏土、壤土和沙土放进漏斗。按一按，慢慢倒入50毫升的水！', 'Same amount of clay, loam and sand in each funnel. Tap to pour in 50 ml of water!'));
    const soils = [['黏土', '#a0522d', 10], ['壤土', '#5b3a1e', 25], ['沙土', '#e3c27a', 40]];
    const yv = (v) => 270 - v * 2.6;
    const wrap = h('div', { class: 'svg-wrap' });
    wrap.innerHTML = `<svg viewBox="0 0 420 300">${soils.map(([n, col], i) => {
      const cx = 70 + i * 140;
      let ticks = '';
      for (let v = 10; v <= 50; v += 10) ticks += `<line x1="${cx - 25}" y1="${yv(v)}" x2="${cx - 12}" y2="${yv(v)}" stroke="#2d2a32" stroke-width="1.5"/><text x="${cx + 30}" y="${yv(v) + 4}" font-size="11">${v}</text>`;
      return `<g>
        <rect class="w" data-v="${soils[i][2]}" x="${cx - 23}" y="270" width="46" height="0" fill="#9fd8ff"/>
        <path d="M${cx - 25} 120 L${cx - 25} 272 M${cx + 25} 120 L${cx + 25} 272" stroke="#9cb8cc" stroke-width="4"/>
        <rect x="${cx - 40}" y="272" width="80" height="10" rx="4" fill="#9cb8cc"/>
        ${ticks}
        <polygon points="${cx - 48},56 ${cx + 48},56 ${cx + 7},104 ${cx + 7},128 ${cx - 7},128 ${cx - 7},104" fill="#eef8ff" stroke="#9cc7e6" stroke-width="3"/>
        <polygon points="${cx - 38},64 ${cx + 38},64 ${cx + 12},94 ${cx - 12},94" fill="${col}"/>
        <g class="drip" style="opacity:0"><ellipse cx="${cx}" cy="140" rx="3" ry="5" fill="#5ab0ff"/></g>
        <text x="${cx}" y="297" text-anchor="middle" font-size="17" font-weight="800">${n}</text>
        <text class="val" x="${cx}" y="46" text-anchor="middle" font-size="15" font-weight="800" fill="#2b86c5"></text>
      </g>`;
    }).join('')}</svg>`;
    root.append(wrap);
    const btn = h('button', { class: 'big-btn' }, '💧 ' + R('倒入50毫升的水'));
    root.append(btn);
    btn.onclick = () => {
      btn.disabled = true;
      btn.innerHTML = '⏳ ' + R('等五分钟……');
      speak('等五分钟');
      const svg = wrap.querySelector('svg');
      svg.querySelectorAll('.drip').forEach((d) => {
        d.style.opacity = 1;
        d.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(60px)' }], { duration: 600, iterations: 4 });
      });
      const ws = [...svg.querySelectorAll('.w')];
      const t0 = performance.now(), D = 2600;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / D);
        ws.forEach((w) => {
          const v = +w.dataset.v * k;
          w.setAttribute('y', yv(v)); w.setAttribute('height', 270 - yv(v));
        });
        if (k < 1) requestAnimationFrame(step);
        else {
          svg.querySelectorAll('.drip').forEach((d) => { d.style.opacity = 0; });
          svg.querySelectorAll('.val').forEach((t, i) => { t.textContent = soils[i][2] + ' 毫升'; });
          btn.remove();
          feedback(root, true, '五分钟后：黏土下面有10毫升，壤土下面有25毫升，沙土下面有40毫升的水。量筒里的水越多，表示土壤的渗水性越强。');
          nextBtn(root, '继续', () => api.done(0, 0));
        }
      };
      requestAnimationFrame(step);
    };
  };

  /* ================= writing ================= */
  function tianzige(size) {
    const d = 'stroke="#f3a99e" stroke-width="1.5" stroke-dasharray="6 6"';
    return `<svg class="tzg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <line x1="0" y1="${size / 2}" x2="${size}" y2="${size / 2}" ${d}/>
      <line x1="${size / 2}" y1="0" x2="${size / 2}" y2="${size}" ${d}/>
      <line x1="0" y1="0" x2="${size}" y2="${size}" ${d}/>
      <line x1="${size}" y1="0" x2="0" y2="${size}" ${d}/>
    </svg>`;
  }
  function boxSize() {
    const vw = Math.min(window.innerWidth, 860) - 48;
    const vh = window.innerHeight * 0.5;
    return Math.floor(Math.max(220, Math.min(vw, vh, 460)));
  }

  /* Writes the chars of `phases` one by one.
     phases: [{ch, mode: 'trace'|'copy'|'dict'}], cb(results[{ch,mode,mistakes}]) */
  function writePad(root, word, phases, opts, cb) {
    const wrap = h('div', { class: 'write-wrap' });
    const tag = h('div', { class: 'mode-tag zh' });
    const strip = h('div', { class: 'word-strip' });
    const size = boxSize();
    const box = h('div', { class: 'grid-box', style: `width:${size + 8}px;height:${size + 8}px` });
    box.innerHTML = tianzige(size);
    const target = h('div', { class: 'hw' });
    box.append(target);
    const tools = h('div', { class: 'write-tools' });
    const bShow = h('button', { class: 'mini', style: 'height:48px;font-size:18px' }, '👀 ' + R('看笔顺'));
    const bRedo = h('button', { class: 'mini', style: 'height:48px;font-size:18px' }, '🔁 ' + R('重写'));
    const bSay = h('button', { class: 'mini', style: 'height:48px;font-size:18px' }, '🔊');
    tools.append(bShow, bRedo, bSay);
    const msg = h('div', { class: 'muted center zh', style: 'margin-top:8px;min-height:30px;font-weight:700' });
    wrap.append(tag, strip, box, tools, msg);
    root.append(wrap);

    const chars = [...word];
    const results = [];
    let pi = 0, writer = null, mistakes = 0, penalty = 0;

    function drawStrip(phase) {
      strip.innerHTML = '';
      chars.forEach((c, i) => {
        const done = results.some((r) => r.mode === phase.mode && r.idx === i);
        const cur = i === phase.idx;
        const showChar = phase.mode === 'trace' || done || (phase.mode === 'copy' && opts.showWordInCopy);
        const sl = h('div', { class: 'slot' + (cur ? ' cur' : '') + (done ? ' ok' : '') }, showChar ? c : (cur ? '✍️' : '？'));
        strip.append(sl);
      });
    }
    const MODE_LABEL = { trace: '第一步：描红（跟着灰色的字写）', copy: '第二步：自己写', dict: '听写：听一听，写出来', fill: '写出缺少的词语' };

    function startPhase() {
      const ph = phases[pi];
      tag.innerHTML = R(MODE_LABEL[opts.label || ph.mode] || '');
      drawStrip(ph);
      target.innerHTML = '';
      mistakes = 0; penalty = 0;
      msg.innerHTML = '';
      setTimeout(() => { const r = box.getBoundingClientRect(); if (r.bottom > window.innerHeight || r.top < 60) box.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, pi === 0 ? 350 : 50);
      writer = HW.create(target, ph.ch, {
        width: size, height: size, padding: Math.round(size * 0.06),
        showCharacter: false,
        showOutline: ph.mode === 'trace',
        strokeColor: '#2d2a32', outlineColor: '#d9d4cc', drawingColor: '#3a3a3a', highlightColor: '#ff9f68',
        drawingWidth: Math.max(10, Math.round(size / 26)),
        strokeAnimationSpeed: 1.1, delayBetweenStrokes: 280,
        showHintAfterMisses: ph.mode === 'trace' ? 1 : ph.mode === 'copy' ? 2 : 3,
        highlightOnComplete: true,
        charDataLoader: (c, done) => done(window.HANZI_DATA[c]),
        onLoadCharDataError: () => { msg.textContent = 'Missing stroke data for ' + ph.ch; },
      });
      if (ph.mode === 'trace') {
        msg.innerHTML = R('先看笔顺……');
        writer.animateCharacter({ onComplete: () => { msg.innerHTML = R('轮到你了！跟着笔顺写。'); quiz(); } });
        msg.dataset.st = 'anim';
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
          results.push({ ch: ph.ch, mode: ph.mode, idx: ph.idx, mistakes: total });
          msg.innerHTML = total <= 1 ? R('写得很好！') + ' ⭐' : total <= 3 ? R('不错！') : R('多练习几次就会了！');
          setTimeout(() => {
            pi++;
            if (pi < phases.length) startPhase();
            else {
              drawStrip({ mode: phases[phases.length - 1].mode, idx: -1 });
              cb(results);
            }
          }, 900);
        },
      });
    }
    bShow.onclick = () => {
      const ph = phases[pi];
      if (!writer || pi >= phases.length) return;
      if (ph.mode !== 'trace') penalty += 2;
      writer.cancelQuiz();
      writer.animateCharacter({ onComplete: () => { writer.hideCharacter(); quiz(); } });
    };
    bRedo.onclick = () => {
      if (!writer || pi >= phases.length) return;
      writer.cancelQuiz();
      quiz();
    };
    bSay.onclick = () => speak(opts.sayText || word);
    startPhase();
  }

  function recordWriting(api, results, isReview) {
    let got = 0, total = 0;
    results.forEach((r) => {
      if (r.mode === 'trace') return;
      total++;
      if (r.mistakes <= 1) got += 1; else if (r.mistakes <= 3) got += 0.5;
      if (isReview) {
        if (r.mistakes <= 1 && P.mistakes[r.ch]) { delete P.mistakes[r.ch]; }
      } else if (r.mistakes >= 2) {
        P.mistakes[r.ch] = (P.mistakes[r.ch] || 0) + 1;
        if (!api.m.newMist.includes(r.ch)) api.m.newMist.push(r.ch);
      }
    });
    return [got, total];
  }

  function wordHeader(root, w, en, hide) {
    const card = h('div', { class: 'card center' });
    if (hide) {
      card.innerHTML = `<div class="word-big zh">🔒 ${'？'.repeat([...w].length)}</div>`;
    } else {
      card.innerHTML = `<div class="word-big zh">${R(w)}</div>`;
    }
    const tools = h('div', { class: 'bubble-tools', style: 'justify-content:center' });
    tools.append(h('button', { class: 'mini', onclick: () => speak(w) }, '🔊 ' + R('听')));
    if (en) {
      const enEl = h('div', { class: 'en' }, esc(en));
      tools.append(h('button', { class: 'mini', onclick: () => enEl.classList.toggle('show') }, '?'));
      card.append(tools, enEl);
    } else card.append(tools);
    root.append(card);
    return card;
  }

  STEPS.learn = (root, s, api) => {
    const chars = [...s.w];
    root.append(bubble(s.review ? '练习这个字：先描红，再自己写。' : '学写词语“' + s.w + '”：先描红，再自己写。', 'Learn to write: trace first, then write on your own.', { say: s.review ? s.w : '学写词语，' + s.w }));
    wordHeader(root, s.w, enOf(s.w));
    const phases = chars.map((ch, idx) => ({ ch, idx, mode: 'trace' })).concat(chars.map((ch, idx) => ({ ch, idx, mode: 'copy' })));
    writePad(root, s.w, phases, {}, (res) => {
      const [got, total] = recordWriting(api, res, !!s.review);
      setMood(root, 'happy');
      feedback(root, true, got === total ? '写得真好！' : '完成了！继续加油！');
      nextBtn(root, '继续', () => api.done(got, total));
    });
  };

  STEPS.dict = (root, s, api) => {
    root.append(bubble('听写：听一听，写出这个词语。', 'Dictation: listen, then write the word.', { say: '听写。' + s.w }));
    const card = wordHeader(root, s.w, null, true);
    const chars = [...s.w];
    const phases = chars.map((ch, idx) => ({ ch, idx, mode: 'dict' }));
    writePad(root, s.w, phases, {}, (res) => {
      const [got, total] = recordWriting(api, res, false);
      card.querySelector('.word-big').innerHTML = R(s.w);
      const en = enOf(s.w);
      setMood(root, 'happy');
      feedback(root, true, '答案是“' + s.w + '”。' + (got === total ? '全对！' : '继续加油！'), en ? s.w + ' = ' + en : null);
      nextBtn(root, '继续', () => api.done(got, total));
    });
  };

  STEPS.fill = (root, s, api) => {
    const [sent, en] = C.FILL[s.w];
    const py = pyOf(s.w);
    const parts = sent.split('＿');
    const html = R(parts[0]) + `<span class="blank" style="min-width:${[...s.w].length * 1.3}em"><span class="bpy">${esc(py)}</span></span>` + R(parts[1] || '');
    root.append(bubble('读一读句子，写出缺少的词语。', 'Read the sentence and write the missing word.', { say: sent }));
    const card = h('div', { class: 'card' });
    const sentEl = h('div', { class: 'fill-sentence zh' }, html);
    const enEl = h('div', { class: 'en' }, esc(en));
    const tools = h('div', { class: 'bubble-tools', style: 'justify-content:center' });
    tools.append(h('button', { class: 'mini', onclick: () => speak(sent) }, '🔊'), h('button', { class: 'mini', onclick: () => enEl.classList.toggle('show') }, '?'));
    card.append(sentEl, tools, enEl);
    root.append(card);
    const phases = [...s.w].map((ch, idx) => ({ ch, idx, mode: 'copy' }));
    writePad(root, s.w, phases, { label: 'fill', sayText: sent }, (res) => {
      const [got, total] = recordWriting(api, res, false);
      sentEl.innerHTML = R(sent.replace('＿', s.w));
      setMood(root, 'happy');
      feedback(root, true, got === total ? '全对！' : '完成了！');
      nextBtn(root, '继续', () => api.done(got, total));
    });
  };

  STEPS.build = (root, s, api) => {
    const b = C.BUILD[s.sid][s.i];
    const answer = b.tiles.join('');
    root.append(bubble('连词成句：按正确的顺序点一点，组成一个句子。', 'Build the sentence: tap the word tiles in the right order.', { say: '连词成句' }));
    const tgt = h('div', { class: 'build-target' });
    const tiles = h('div', { class: 'tiles' });
    const enEl = h('div', { class: 'en' }, esc(b.en));
    const hint = h('button', { class: 'mini', style: 'margin-bottom:10px' }, '? English');
    hint.onclick = () => enEl.classList.toggle('show');
    root.append(tgt, hint, enEl, tiles);
    let placed = [], tries = 0, finished = false;
    const check = () => {
      if (placed.length !== b.tiles.length) return;
      tries++;
      if (placed.map((p) => p.t).join('') === answer) {
        finished = true; sGood(); setMood(root, 'happy');
        feedback(root, true, '句子正确！' + answer);
        speak(answer);
        nextBtn(root, '继续', () => api.done(tries === 1 ? 1 : 0, 1));
      } else {
        sBad(); setMood(root, 'sad');
        tgt.classList.remove('shake'); void tgt.offsetWidth; tgt.classList.add('shake');
        feedback(root, false, '顺序不对，再试一次！');
        setTimeout(() => { placed.slice().forEach((p) => p.el.click()); }, 700);
      }
    };
    shuffle(b.tiles.map((t, i) => ({ t, i }))).forEach((o) => {
      const src = h('button', { class: 'tile zh', 'data-t': o.t }, R(o.t));
      src.onclick = () => {
        if (finished || src.classList.contains('used')) return;
        speak(o.t);
        src.classList.add('used');
        const pl = h('button', { class: 'tile placed zh' }, R(o.t));
        const rec = { t: o.t, el: pl };
        pl.onclick = () => {
          if (finished) return;
          pl.remove(); src.classList.remove('used');
          placed = placed.filter((p) => p !== rec);
        };
        placed.push(rec);
        tgt.append(pl);
        check();
      };
      tiles.append(src);
    });
  };

  /* ---- mission end ---- */
  STEPS.end = (root, s, api) => {
    const m = api.m;
    const pct = m.total ? m.got / m.total : 1;
    const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
    m.done = true;
    P.best[api.key] = Math.max(P.best[api.key] || 0, stars);
    save();
    confetti(); sGood();
    const sum = h('div', { class: 'summary' });
    sum.innerHTML = guideSVG('happy').replace('class="guide"', 'class="guide" style="width:120px;height:134px"') +
      `<div class="stars-big">${starsText(stars)}</div><h2 class="zh">${R(stars === 3 ? '太棒了！' : stars === 2 ? '做得好！' : '完成了！继续加油！')}</h2>` +
      (m.total ? `<p class="zh" style="font-size:20px">${R('得分')}：${Math.round(m.got * 10) / 10} / ${m.total}</p>` : '');
    root.append(sum);
    speak(stars === 3 ? '太棒了！' : stars === 2 ? '做得好！' : '完成了！继续加油！');
    if (m.newMist && m.newMist.length) {
      const c = h('div', { class: 'card' });
      c.innerHTML = `<div class="zh" style="font-weight:800;margin-bottom:8px">📕 ${R('放进错字本的字')}：</div>`;
      const chips = h('div', { class: 'chips' });
      m.newMist.forEach((ch) => chips.append(h('span', { class: 'chip zh' }, R(ch))));
      c.append(chips);
      root.append(c);
    }
    const row = h('div', { class: 'row', style: 'margin-top:10px' });
    const again = h('button', { class: 'big-btn secondary zh' }, '🔁 ' + R('再玩一次'));
    again.onclick = () => startMission(api.key, true, api.key === 'practice' ? m.steps[0].w : undefined);
    const home = h('button', { class: 'big-btn zh' }, '🏕️ ' + R('回去'));
    home.onclick = api.back;
    row.append(again, home);
    root.append(row);
  };

  /* ================= screens ================= */
  function missionStatus(key) {
    const m = P.m[key];
    const best = P.best[key] || 0;
    if (m && !m.done && m.idx > 0) return { label: '继续', sub: `${m.idx}/${m.steps.length - 1}`, best };
    if (best) return { label: '再玩', sub: starsText(best), best };
    return { label: '开始', sub: '', best };
  }

  function showHome() {
    curKey = null;
    rerender = showHome;
    app.innerHTML = '';
    app.append(topbar('科学技能训练营', null));
    const main = h('main');
    app.append(main);
    const hero = h('div', { class: 'hero' });
    const ht = h('div');
    ht.innerHTML = `<h1 class="zh">${R('科学技能训练营')}</h1><div class="zh muted" style="font-size:18px">${R('三年级科学 · 第1课 科学技能')}</div>`;
    hero.append(ht);
    main.append(hero);
    main.append(bubble('你好！我是芽芽博士。选一个营地，一起学科学、写汉字吧！', 'Hi! I’m Dr. Sprout. Pick a camp station to learn science and practise writing!', { autoSay: false }));
    const map = h('div', { class: 'map' });
    C.STATIONS.forEach((st, i) => {
      const g = P.best[st.id + '.game'] || 0, w = P.best[st.id + '.write'] || 0;
      const card = h('button', { class: 'station-card' });
      card.innerHTML = `<div class="num" style="background:${st.color}">${st.e}</div>
        <div class="info"><div class="name zh">${i + 1}. ${R(st.n)}</div><div class="sub zh">${R(st.sub)}</div>
        <div class="st">🎮 ${starsText(g)} &nbsp; ✍️ ${starsText(w)}</div></div><div style="font-size:26px">➡️</div>`;
      card.onclick = () => showStation(st.id);
      map.append(card);
    });
    main.append(map);
    const ex = h('div', { class: 'extras' });
    const nm = Object.keys(P.mistakes).length;
    const mk = (e, n, c, fn) => { const b = h('button', { class: 'extra' }, `<span class="e">${e}</span><span class="zh">${R(n)}</span><div class="c zh">${c}</div>`); b.onclick = fn; return b; };
    ex.append(
      mk('🏆', '听写挑战', P.best.final ? starsText(P.best.final) : R('12个词语'), () => startMission('final', !(P.m.final && !P.m.final.done))),
      mk('📕', '错字本', nm ? nm + ' ' + R('个字') : R('空的'), showMistakes),
      mk('🗂️', '生词卡', '36 ' + R('个词语'), showWords),
    );
    main.append(ex);
  }

  function showStation(sid) {
    rerender = () => showStation(sid);
    const st = C.STATIONS.find((x) => x.id === sid);
    const idx = C.STATIONS.indexOf(st);
    app.innerHTML = '';
    app.append(topbar(st.n, showHome));
    const main = h('main');
    app.append(main);
    main.append(bubble('第' + (idx + 1) + '站：' + st.n + '。' + st.sub + '。先玩科学游戏，再闯写字关！', 'Play the science game, then do the writing round!'));
    const mk = (kind, e, n, s) => {
      const key = sid + '.' + kind;
      const ms = missionStatus(key);
      const b = h('button', { class: 'mission' });
      b.innerHTML = `<span class="e">${e}</span><div><div class="n zh">${R(n)}</div><div class="s zh">${R(s)}</div><div class="s">${ms.sub}</div></div><span class="go zh">${R(ms.label)}</span>`;
      b.onclick = () => startMission(key, ms.label === '再玩');
      return b;
    };
    main.append(mk('game', '🎮', '科学游戏', '玩一玩，学科学'), mk('write', '✍️', '写字关', '描红 · 自己写 · 听写 · 填空 · 连词成句'));
    const c = h('div', { class: 'card' });
    c.innerHTML = `<div class="zh" style="font-weight:800;margin-bottom:8px">${R('这一站要会写的词语')}：</div>`;
    const chips = h('div', { class: 'chips' });
    W[sid].forEach((x) => { const ch = h('button', { class: 'chip zh' }, R(x.w)); ch.onclick = () => speak(x.w); chips.append(ch); });
    c.append(chips);
    main.append(c);
  }

  function showWords() {
    rerender = showWords;
    app.innerHTML = '';
    app.append(topbar('生词卡', showHome));
    const main = h('main');
    app.append(main);
    main.append(bubble('点🔊听一听，点✍️练习写。', 'Tap 🔊 to listen, ✍️ to practise writing, ? for English.', { autoSay: false }));
    C.STATIONS.forEach((st) => {
      main.append(h('div', { class: 'section-title zh' }, st.e + ' ' + R(st.n)));
      const g = h('div', { class: 'wordgrid' });
      W[st.id].forEach((x) => {
        const c = h('div', { class: 'wcard' });
        c.innerHTML = `<div class="w zh">${R(x.w)}</div>`;
        const acts = h('div', { class: 'acts' });
        const enEl = h('div', { class: 'en' }, esc(x.en));
        acts.append(
          h('button', { class: 'mini', onclick: () => speak(x.w) }, '🔊'),
          h('button', { class: 'mini', onclick: () => startMission('practice', true, x.w) }, '✍️'),
          h('button', { class: 'mini', onclick: () => enEl.classList.toggle('show') }, '?'),
        );
        c.append(acts, enEl);
        g.append(c);
      });
      main.append(g);
    });
  }

  function showMistakes() {
    rerender = showMistakes;
    app.innerHTML = '';
    app.append(topbar('错字本', showHome));
    const main = h('main');
    app.append(main);
    const chars = Object.keys(P.mistakes).sort((a, b) => P.mistakes[b] - P.mistakes[a]);
    if (!chars.length) {
      main.append(bubble('错字本是空的。太棒了！写字时写错两笔或以上的字，会放进这里。', 'Your mistake book is empty! Characters with 2+ mistakes are added here.', { mood: 'happy' }));
      return;
    }
    main.append(bubble('这些字要多练习。写对了，它们就会离开错字本！', 'Practise these characters. Write them well and they leave the book!'));
    const g = h('div', { class: 'wordgrid' });
    chars.forEach((ch) => {
      const c = h('div', { class: 'wcard' });
      const word = Object.values(W).flat().find((x) => x.w.includes(ch));
      c.innerHTML = `<div class="w zh">${R(ch)}</div><div class="muted zh" style="font-size:15px">${word ? R(word.w) : ''} · ✖${P.mistakes[ch]}</div>`;
      const acts = h('div', { class: 'acts' });
      acts.append(h('button', { class: 'mini', onclick: () => speak(word ? word.w : ch) }, '🔊'));
      c.append(acts);
      g.append(c);
    });
    main.append(g);
    const b = h('button', { class: 'big-btn', style: 'margin-top:16px' }, '✍️ ' + R('开始练习错字'));
    b.onclick = () => startMission('review', true);
    main.append(b);
  }

  /* ================= boot ================= */
  applyPy();
  showHome();
  cloudInit();
  if ('serviceWorker' in navigator && !window.claude && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  window.__camp = { get P() { return P; }, startMission, runMission, showHome, R };
})();
