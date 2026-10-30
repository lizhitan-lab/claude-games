/* BrightPlay – local storage, import and export */
(function () {
  var GAMES_KEY = 'brightplay.games.v1';
  var SCORES_KEY = 'brightplay.scores.v1';
  var PREFS_KEY = 'brightplay.prefs.v1';
  var SEEDED_KEY = 'brightplay.seeded.v1';

  var memory = {}; // fallback when localStorage is blocked (e.g. some private modes)

  function rawGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return memory[key] || null; }
  }
  function rawSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      memory[key] = value;
      if (e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014)) {
        var err = new Error('Storage is full. Try removing some pictures or deleting old games, then export a backup.');
        err.quota = true;
        throw err;
      }
    }
  }
  function readJSON(key, fallback) {
    var raw = rawGet(key);
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function uid() {
    return 'g-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function now() { return new Date().toISOString(); }

  function sampleCopies() {
    var t = now();
    return BP.SAMPLE_GAMES.map(function (g) {
      var c = clone(g);
      c.sample = true;
      c.createdAt = t;
      c.updatedAt = t;
      return c;
    });
  }

  var Store = {
    init: function () {
      if (!rawGet(SEEDED_KEY)) {
        var existing = readJSON(GAMES_KEY, []);
        var ids = existing.map(function (g) { return g.id; });
        sampleCopies().forEach(function (s) { if (ids.indexOf(s.id) === -1) existing.push(s); });
        rawSet(GAMES_KEY, JSON.stringify(existing));
        rawSet(SEEDED_KEY, '1');
      }
    },

    all: function () {
      var list = readJSON(GAMES_KEY, []);
      return Array.isArray(list) ? list.filter(Store.isValidGame) : [];
    },

    get: function (id) {
      return Store.all().filter(function (g) { return g.id === id; })[0] || null;
    },

    saveAll: function (list) {
      rawSet(GAMES_KEY, JSON.stringify(list));
    },

    save: function (game) {
      var list = Store.all();
      var g = Store.normalise(clone(game));
      if (!g.id) g.id = uid();
      g.updatedAt = now();
      var idx = -1;
      list.forEach(function (x, i) { if (x.id === g.id) idx = i; });
      if (idx === -1) {
        g.createdAt = g.createdAt || now();
        list.unshift(g);
      } else {
        g.createdAt = list[idx].createdAt || g.createdAt || now();
        list[idx] = g;
      }
      Store.saveAll(list);
      return g;
    },

    remove: function (id) {
      Store.saveAll(Store.all().filter(function (g) { return g.id !== id; }));
      var scores = readJSON(SCORES_KEY, {});
      delete scores[id];
      rawSet(SCORES_KEY, JSON.stringify(scores));
    },

    duplicate: function (id) {
      var g = Store.get(id);
      if (!g) return null;
      var c = clone(g);
      c.id = uid();
      c.title = g.title + ' (copy)';
      c.sample = false;
      c.createdAt = now();
      return Store.save(c);
    },

    restoreSamples: function () {
      var list = Store.all();
      var count = 0;
      sampleCopies().forEach(function (s) {
        var idx = -1;
        list.forEach(function (x, i) { if (x.id === s.id) idx = i; });
        if (idx === -1) { list.push(s); count++; } else if (list[idx].sample) { list[idx] = s; }
      });
      Store.saveAll(list);
      return count;
    },

    clearAll: function () {
      Store.saveAll([]);
      rawSet(SCORES_KEY, '{}');
    },

    /* ---------- validation / normalising ---------- */
    isValidGame: function (g) {
      return g && typeof g === 'object' && typeof g.title === 'string' && BP.TYPES[g.type] && Array.isArray(g.items);
    },

    normalise: function (g) {
      var str = function (v) { return v == null ? '' : String(v); };
      var out = {
        id: str(g.id),
        type: g.type,
        title: str(g.title).trim() || 'Untitled game',
        description: str(g.description).trim(),
        subject: str(g.subject) || 'General',
        topic: str(g.topic).trim(),
        difficulty: ['easy', 'medium', 'hard'].indexOf(g.difficulty) > -1 ? g.difficulty : 'easy',
        icon: str(g.icon) || BP.TYPES[g.type].icon,
        color: /^#[0-9a-f]{3,8}$/i.test(str(g.color)) ? g.color : BP.TYPES[g.type].color,
        settings: g.settings && typeof g.settings === 'object' ? g.settings : {},
        sample: !!g.sample,
        createdAt: g.createdAt || '',
        updatedAt: g.updatedAt || '',
        items: []
      };
      var safeImg = function (v) { v = str(v); return /^data:image\//.test(v) || /^https:\/\//.test(v) ? v : ''; };
      (g.items || []).forEach(function (it) {
        if (!it || typeof it !== 'object') return;
        if (g.type === 'quiz') {
          var answers = (Array.isArray(it.answers) ? it.answers : []).slice(0, 4).map(str);
          while (answers.length < 4) answers.push('');
          var c = parseInt(it.correct, 10);
          out.items.push({ q: str(it.q), emoji: str(it.emoji), image: safeImg(it.image), answers: answers, correct: c >= 0 && c < 4 ? c : 0 });
        } else if (g.type === 'match') {
          out.items.push({ left: str(it.left), emoji: str(it.emoji), image: safeImg(it.image), right: str(it.right) });
        } else if (g.type === 'spell') {
          out.items.push({ word: str(it.word), clue: str(it.clue), emoji: str(it.emoji), image: safeImg(it.image) });
        }
      });
      return out;
    },

    /* ---------- scores ---------- */
    getScore: function (id) { return readJSON(SCORES_KEY, {})[id] || null; },
    recordScore: function (id, result) {
      var scores = readJSON(SCORES_KEY, {});
      var prev = scores[id] || { plays: 0, bestPercent: 0 };
      var entry = {
        plays: (prev.plays || 0) + 1,
        bestPercent: Math.max(prev.bestPercent || 0, result.percent),
        bestStars: Math.max(prev.bestStars || 0, result.stars),
        lastPlayed: now()
      };
      scores[id] = entry;
      try { rawSet(SCORES_KEY, JSON.stringify(scores)); } catch (e) { /* scores are optional */ }
      return { entry: entry, isBest: result.percent > (prev.bestPercent || 0) && prev.plays > 0 };
    },

    /* ---------- preferences ---------- */
    pref: function (name, value) {
      var prefs = readJSON(PREFS_KEY, {});
      if (arguments.length === 1) return prefs[name];
      prefs[name] = value;
      try { rawSet(PREFS_KEY, JSON.stringify(prefs)); } catch (e) { /* ignore */ }
    },

    /* ---------- backup ---------- */
    exportData: function (ids) {
      var games = Store.all();
      if (ids) games = games.filter(function (g) { return ids.indexOf(g.id) > -1; });
      return {
        app: 'BrightPlay',
        format: 'brightplay-backup',
        version: 1,
        exportedAt: now(),
        games: games
      };
    },

    /* Returns {added, updated, skipped}. Throws an Error with a friendly message on bad files. */
    importData: function (text) {
      var data;
      try { data = JSON.parse(text); } catch (e) { throw new Error('That file is not a valid BrightPlay backup (it is not JSON).'); }
      var games = Array.isArray(data) ? data : (data && Array.isArray(data.games) ? data.games : (data && data.type && data.items ? [data] : null));
      if (!games) throw new Error('No games were found in that file.');
      var list = Store.all();
      var res = { added: 0, updated: 0, skipped: 0 };
      games.forEach(function (raw) {
        if (!Store.isValidGame(raw)) { res.skipped++; return; }
        var g = Store.normalise(raw);
        if (!g.items.length) { res.skipped++; return; }
        if (!g.id) g.id = uid();
        g.updatedAt = g.updatedAt || now();
        g.createdAt = g.createdAt || now();
        var idx = -1;
        list.forEach(function (x, i) { if (x.id === g.id) idx = i; });
        if (idx === -1) { list.unshift(g); res.added++; } else { list[idx] = g; res.updated++; }
      });
      if (!res.added && !res.updated) throw new Error('No usable games were found in that file.');
      Store.saveAll(list);
      return res;
    },

    usageKB: function () {
      var total = 0;
      [GAMES_KEY, SCORES_KEY, PREFS_KEY].forEach(function (k) { total += (rawGet(k) || '').length; });
      return Math.round(total * 2 / 1024); // UTF-16
    },

    uid: uid,
    clone: clone
  };

  BP.Store = Store;
})();
