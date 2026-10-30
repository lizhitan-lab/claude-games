/* BrightPlay – game players: Quiz, Matching Pairs, Spelling */
(function () {
  var UI = BP.UI, esc = UI.esc;
  var el = document.getElementById('player');
  var state = null;

  var PRAISE = ['Great job!', 'Brilliant!', 'Awesome!', 'Super star!', 'Well done!', 'Fantastic!', 'You got it!', 'Amazing!'];
  var OOPS = ['Not quite!', 'Oops!', 'Nice try!', 'Almost!'];
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  function norm(s) { return String(s || '').trim().replace(/\s+/g, ' ').toLowerCase(); }

  /* ---------- Shell ---------- */
  function open(game, opts) {
    close(true);
    opts = opts || {};
    var items = game.items.filter(function (it) {
      if (game.type === 'quiz') return it.q && it.answers.filter(Boolean).length >= 2 && it.answers[it.correct];
      if (game.type === 'match') return (it.left || it.emoji || it.image) && it.right;
      return it.word && it.word.trim();
    });
    if (!items.length) { UI.alert('Nothing to play yet', 'This game has no ' + BP.TYPES[game.type].itemName + 's. Add some in the editor first.', '🙈'); return; }
    state = { game: game, opts: opts, started: Date.now(), timer: null, done: false };
    el.hidden = false;
    el.style.setProperty('--game-color', game.color || BP.TYPES[game.type].color);
    document.body.classList.add('playing');
    el.innerHTML =
      '<div class="player-top">' +
      '<button type="button" class="icon-btn player-close" data-act="close" aria-label="Close game">✕</button>' +
      '<div class="player-title"><span aria-hidden="true">' + esc(game.icon) + '</span> ' + esc(game.title) +
      (opts.preview ? ' <span class="badge badge-preview">Preview</span>' : '') + '</div>' +
      '<div class="player-stats" id="pStats"></div>' +
      '</div>' +
      '<div class="progress" aria-hidden="true"><div class="progress-bar" id="pBar"></div></div>' +
      '<div class="player-body" id="pBody"></div>';
    el.querySelector('[data-act="close"]').addEventListener('click', requestClose);
    if (game.type === 'quiz') Quiz.start(game);
    else if (game.type === 'match') Match.start(game);
    else Spell.start(game);
    el.focus && el.focus();
  }

  function requestClose() {
    if (!state) return;
    if (state.done || state.opts.preview) { close(); return; }
    UI.confirm('Leave this game?', 'Your progress in this round will be lost.', 'Leave game').then(function (ok) { if (ok) close(); });
  }

  function close(silent) {
    if (!state) return;
    var s = state;
    clearInterval(s.timer);
    document.removeEventListener('keydown', onKey);
    if (UI.canSpeak()) try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    state = null;
    el.hidden = true;
    el.innerHTML = '';
    document.body.classList.remove('playing');
    if (!silent && s.opts.onClose) s.opts.onClose();
  }

  function body() { return document.getElementById('pBody'); }
  function setProgress(done, total) {
    var b = document.getElementById('pBar');
    if (b) b.style.width = Math.round(done / total * 100) + '%';
  }
  function setStats(html) { var s = document.getElementById('pStats'); if (s) s.innerHTML = html; }

  function onKey(e) { if (state && state.keyHandler) state.keyHandler(e); }
  document.addEventListener('keydown', function (e) {
    if (state && e.key === 'Escape' && !document.querySelector('.modal-backdrop')) requestClose();
  });

  function starsFor(pct) { return pct >= 90 ? 3 : pct >= 60 ? 2 : 1; }

  /* ---------- Results ---------- */
  function results(r) {
    state.done = true;
    clearInterval(state.timer);
    state.keyHandler = null;
    setProgress(1, 1);
    var pct = Math.round(r.percent);
    var stars = starsFor(pct);
    var best = null;
    if (!state.opts.preview && state.game.id) best = BP.Store.recordScore(state.game.id, { percent: pct, stars: stars });
    var msg = pct === 100 ? 'Perfect score!' : stars === 3 ? 'Superstar!' : stars === 2 ? 'Great work!' : 'Good try – keep practising!';
    var starHtml = '';
    for (var i = 1; i <= 3; i++) starHtml += '<span class="star ' + (i <= stars ? 'on' : '') + '" style="animation-delay:' + (i * 0.2) + 's">★</span>';
    body().innerHTML =
      '<div class="results">' +
      '<div class="stars" aria-label="' + stars + ' out of 3 stars">' + starHtml + '</div>' +
      '<h2 class="results-title">' + esc(msg) + '</h2>' +
      (best && best.isBest ? '<div class="badge badge-best">🏅 New personal best!</div>' : '') +
      '<div class="results-score"><span class="big">' + esc(r.scoreText) + '</span><span class="sub">' + esc(r.scoreLabel) + '</span></div>' +
      '<div class="results-stats">' + r.stats.map(function (s) {
        return '<div class="stat"><span class="stat-ico" aria-hidden="true">' + s[0] + '</span><span class="stat-val">' + esc(s[1]) + '</span><span class="stat-lbl">' + esc(s[2]) + '</span></div>';
      }).join('') + '</div>' +
      '<div class="results-actions">' +
      '<button type="button" class="btn btn-primary btn-lg" data-act="again">🔁 Play again</button>' +
      '<button type="button" class="btn btn-light btn-lg" data-act="exit">' + (state.opts.preview ? '✏️ Back to editor' : '📚 Choose another game') + '</button>' +
      '</div>' +
      (r.review && r.review.length ? '<h3 class="review-title">Your answers</h3><ol class="review">' + r.review.map(function (v) {
        return '<li class="' + (v.ok ? 'ok' : 'bad') + '"><span class="review-mark" aria-hidden="true">' + (v.ok ? '✅' : '❌') + '</span><div><div class="review-q">' + esc(v.q) + '</div>' +
          '<div class="review-a">' + (v.ok ? 'You answered: <b>' + esc(v.given) + '</b>' : (v.given ? 'You answered: <s>' + esc(v.given) + '</s> · ' : '') + 'Answer: <b>' + esc(v.answer) + '</b>') + '</div></div></li>';
      }).join('') + '</ol>' : '') +
      '</div>';
    body().querySelector('[data-act="again"]').addEventListener('click', function () { var g = state.game, o = state.opts; open(g, o); });
    body().querySelector('[data-act="exit"]').addEventListener('click', function () { close(); });
    UI.sound('win');
    if (stars >= 2) UI.confetti();
    body().querySelector('[data-act="again"]').focus();
  }

  /* =========================================================
     QUIZ
     ========================================================= */
  var Quiz = {
    start: function (game) {
      var s = state;
      var items = game.items.filter(function (it) { return it.q && it.answers.filter(Boolean).length >= 2 && it.answers[it.correct]; });
      s.items = game.settings.shuffle === false ? items : UI.shuffle(items);
      s.index = 0; s.score = 0; s.streak = 0; s.bestStreak = 0; s.review = [];
      document.addEventListener('keydown', onKey);
      Quiz.render();
    },
    stats: function () {
      setStats('<span class="pill">❓ ' + (state.index + 1) + '/' + state.items.length + '</span><span class="pill pill-score">⭐ ' + state.score + '</span>' +
        (state.streak >= 2 ? '<span class="pill pill-streak">🔥 ' + state.streak + '</span>' : ''));
    },
    render: function () {
      var s = state, it = s.items[s.index];
      setProgress(s.index, s.items.length);
      Quiz.stats();
      var order = [0, 1, 2, 3].filter(function (i) { return it.answers[i]; });
      if (s.game.settings.shuffleAnswers !== false) order = UI.shuffle(order);
      s.order = order; s.answered = false;
      var letters = ['A', 'B', 'C', 'D'];
      body().innerHTML =
        '<div class="quiz">' +
        '<div class="question-card">' + UI.pic(it, 'q-pic') + '<h2 class="question">' + esc(it.q) + '</h2></div>' +
        '<div class="answers">' + order.map(function (ai, k) {
          return '<button type="button" class="answer a' + k + '" data-ai="' + ai + '"><span class="answer-letter">' + letters[k] + '</span><span class="answer-text">' + esc(it.answers[ai]) + '</span></button>';
        }).join('') + '</div>' +
        '<div class="feedback" id="qFeedback" aria-live="assertive"></div>' +
        '</div>';
      UI.$$('.answer', body()).forEach(function (b) {
        b.addEventListener('click', function () { Quiz.answer(+b.getAttribute('data-ai'), b); });
      });
      s.keyHandler = function (e) {
        if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
        var n = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 }[String(e.key).toLowerCase()];
        if (!s.answered && n != null && n < order.length) { var btn = UI.$$('.answer', body())[n]; Quiz.answer(order[n], btn); }
      };
    },
    answer: function (ai, btn) {
      var s = state;
      if (!s || s.answered) return;
      s.answered = true;
      var it = s.items[s.index];
      var ok = ai === it.correct;
      UI.$$('.answer', body()).forEach(function (b) {
        b.disabled = true;
        var bi = +b.getAttribute('data-ai');
        if (bi === it.correct) b.classList.add('correct');
        else if (b !== btn) b.classList.add('dim');
      });
      if (ok) { s.score++; s.streak++; s.bestStreak = Math.max(s.bestStreak, s.streak); btn.classList.add('pop'); UI.sound('correct'); }
      else { s.streak = 0; btn.classList.add('wrong', 'shake'); UI.sound('wrong'); }
      s.review.push({ q: it.q, ok: ok, given: it.answers[ai], answer: it.answers[it.correct] });
      Quiz.stats();
      var last = s.index >= s.items.length - 1;
      var fb = document.getElementById('qFeedback');
      fb.className = 'feedback show ' + (ok ? 'good' : 'bad');
      fb.innerHTML = '<div class="feedback-msg">' + (ok ? '🎉 ' + pick(PRAISE) : '🙈 ' + pick(OOPS) + ' The answer is <b>' + esc(it.answers[it.correct]) + '</b>') + '</div>' +
        '<button type="button" class="btn btn-primary btn-lg" data-act="next">' + (last ? 'See results 🏁' : 'Next ➜') + '</button>';
      var next = fb.querySelector('[data-act="next"]');
      next.addEventListener('click', Quiz.next);
      next.focus({ preventScroll: true });
      setProgress(s.index + 1, s.items.length);
      s.keyHandler = function (e) { if (e.key === 'Enter' && document.activeElement !== next) { e.preventDefault(); Quiz.next(); } };
    },
    next: function () {
      var s = state;
      if (!s) return;
      if (s.index >= s.items.length - 1) {
        var total = s.items.length;
        results({
          percent: s.score / total * 100,
          scoreText: s.score + ' / ' + total, scoreLabel: 'correct answers',
          stats: [['⏱️', UI.formatTime(Date.now() - s.started), 'Time'], ['🔥', String(s.bestStreak), 'Best streak'], ['🎯', Math.round(s.score / total * 100) + '%', 'Accuracy']],
          review: s.review
        });
        return;
      }
      s.index++;
      Quiz.render();
    }
  };

  /* =========================================================
     MATCHING PAIRS
     ========================================================= */
  var PAIR_COLORS = ['#3bb273', '#3a86ff', '#9b5de5', '#ff9f1c', '#ff5c93', '#00a6d6', '#f4a300', '#6c4cf5', '#ef476f', '#2ec4b6'];
  var Match = {
    start: function (game) {
      var s = state;
      s.pairs = game.items.filter(function (it) { return (it.left || it.emoji || it.image) && it.right; })
        .map(function (it, i) { return { id: i, item: it }; });
      s.matched = 0; s.mistakes = 0; s.firstTry = 0; s.missed = {}; s.sel = null;
      var left = UI.shuffle(s.pairs), right = UI.shuffle(s.pairs);
      body().innerHTML =
        '<div class="match">' +
        '<p class="instructions">👆 Tap a card on the left, then tap its match on the right.</p>' +
        '<div class="match-grid">' +
        '<div class="match-col" id="mLeft">' + left.map(function (p) {
          var it = p.item, hasPic = it.image || it.emoji;
          return '<button type="button" class="tile tile-left' + (hasPic ? ' has-pic' : '') + '" data-side="L" data-id="' + p.id + '">' + UI.pic(it, 'tile-pic') + (it.left ? '<span class="tile-text">' + esc(it.left) + '</span>' : '') + '</button>';
        }).join('') + '</div>' +
        '<div class="match-col" id="mRight">' + right.map(function (p) {
          return '<button type="button" class="tile tile-right" data-side="R" data-id="' + p.id + '"><span class="tile-text">' + esc(p.item.right) + '</span></button>';
        }).join('') + '</div>' +
        '</div></div>';
      UI.$$('.tile', body()).forEach(function (t) { t.addEventListener('click', function () { Match.tap(t); }); });
      Match.stats();
      s.timer = setInterval(Match.stats, 1000);
      setProgress(0, s.pairs.length);
    },
    stats: function () {
      var s = state;
      if (!s) return;
      setStats('<span class="pill">⏱️ ' + UI.formatTime(Date.now() - s.started) + '</span><span class="pill pill-score">✅ ' + s.matched + '/' + s.pairs.length + '</span>' +
        '<span class="pill pill-miss">❌ ' + s.mistakes + '</span>');
    },
    tap: function (t) {
      var s = state;
      if (!s || t.classList.contains('matched') || s.locked) return;
      if (!s.sel) { s.sel = t; t.classList.add('selected'); UI.sound('tap'); return; }
      if (s.sel === t) { t.classList.remove('selected'); s.sel = null; return; }
      if (s.sel.getAttribute('data-side') === t.getAttribute('data-side')) {
        s.sel.classList.remove('selected'); s.sel = t; t.classList.add('selected'); UI.sound('tap'); return;
      }
      var a = s.sel, b = t;
      s.sel = null;
      a.classList.remove('selected');
      var id = a.getAttribute('data-id');
      if (id === b.getAttribute('data-id')) {
        var col = PAIR_COLORS[s.matched % PAIR_COLORS.length];
        [a, b].forEach(function (x) { x.classList.add('matched', 'pop'); x.style.setProperty('--pair', col); x.disabled = true; x.setAttribute('aria-label', 'Matched'); });
        s.matched++;
        if (!s.missed[id]) s.firstTry++;
        UI.sound('correct');
        setProgress(s.matched, s.pairs.length);
        Match.stats();
        if (s.matched === s.pairs.length) setTimeout(Match.finish, 700);
      } else {
        s.mistakes++;
        s.missed[id] = true; s.missed[b.getAttribute('data-id')] = true;
        s.locked = true;
        [a, b].forEach(function (x) { x.classList.add('wrong', 'shake'); });
        UI.sound('wrong');
        Match.stats();
        setTimeout(function () { [a, b].forEach(function (x) { x.classList.remove('wrong', 'shake'); }); if (state) state.locked = false; }, 650);
      }
    },
    finish: function () {
      var s = state;
      if (!s) return;
      var n = s.pairs.length;
      var pct = n / (n + s.mistakes) * 100;
      var points = Math.max(0, n * 10 - s.mistakes * 3);
      results({
        percent: pct,
        scoreText: points + ' pts', scoreLabel: 'You matched all ' + n + ' pairs',
        stats: [['⏱️', UI.formatTime(Date.now() - s.started), 'Time'], ['🎯', s.firstTry + '/' + n, 'First try'], ['❌', String(s.mistakes), 'Mistakes']],
        review: []
      });
    }
  };

  /* =========================================================
     SPELLING
     ========================================================= */
  var Spell = {
    start: function (game) {
      var s = state;
      var items = game.items.filter(function (it) { return it.word && it.word.trim(); });
      s.items = game.settings.shuffle === false ? items : UI.shuffle(items);
      s.index = 0; s.correct = 0; s.points = 0; s.review = [];
      document.addEventListener('keydown', onKey);
      s.keyHandler = null;
      Spell.render();
    },
    stats: function () {
      setStats('<span class="pill">🔤 ' + (state.index + 1) + '/' + state.items.length + '</span><span class="pill pill-score">⭐ ' + state.points + '</span>');
    },
    blanks: function () {
      var s = state, word = s.items[s.index].word.trim();
      var show = s.game.settings.showLength !== false;
      if (!show && !s.hints) return '';
      var html = '';
      for (var i = 0; i < word.length; i++) {
        var ch = word[i];
        if (ch === ' ') { html += '<span class="blank gap"></span>'; continue; }
        if (i < s.hints) html += '<span class="blank filled">' + esc(ch) + '</span>';
        else if (/[^\p{L}\p{N}]/u.test(ch)) html += '<span class="blank filled">' + esc(ch) + '</span>';
        else html += '<span class="blank"></span>';
      }
      return html;
    },
    render: function () {
      var s = state, it = s.items[s.index];
      s.attempts = 0; s.hints = 0; s.finished = false;
      setProgress(s.index, s.items.length);
      Spell.stats();
      var canSpeak = UI.canSpeak() && s.game.settings.allowSpeak !== false;
      body().innerHTML =
        '<div class="spell">' +
        '<div class="question-card">' + UI.pic(it, 'q-pic') +
        (it.clue ? '<h2 class="question">' + esc(it.clue) + '</h2>' : '<h2 class="question">Spell the word!</h2>') +
        '<div class="blanks" id="sBlanks" aria-hidden="true">' + Spell.blanks() + '</div>' +
        '</div>' +
        '<form class="spell-form" id="sForm" autocomplete="off">' +
        '<label for="sInput" class="sr-only">Type the spelling</label>' +
        '<input id="sInput" class="spell-input" type="text" inputmode="text" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" enterkeyhint="done" placeholder="Type the word here…">' +
        '<button type="submit" class="btn btn-primary btn-lg">Check ✔</button>' +
        '</form>' +
        '<div class="spell-tools">' +
        (canSpeak ? '<button type="button" class="btn btn-light" data-act="speak">🔊 Hear the word</button>' : '') +
        '<button type="button" class="btn btn-light" data-act="hint">💡 Hint</button>' +
        '<button type="button" class="btn btn-light" data-act="reveal">🙋 Show answer</button>' +
        '</div>' +
        '<div class="feedback" id="sFeedback" aria-live="assertive"></div>' +
        '</div>';
      var input = document.getElementById('sInput');
      document.getElementById('sForm').addEventListener('submit', function (e) { e.preventDefault(); Spell.check(); });
      var sp = body().querySelector('[data-act="speak"]');
      if (sp) sp.addEventListener('click', function () { UI.speak(it.word); });
      body().querySelector('[data-act="hint"]').addEventListener('click', Spell.hint);
      body().querySelector('[data-act="reveal"]').addEventListener('click', function () { Spell.end(false, input.value, true); });
      setTimeout(function () { if (input) input.focus({ preventScroll: true }); }, 50);
    },
    hint: function () {
      var s = state, word = s.items[s.index].word.trim();
      if (s.finished) return;
      if (s.hints >= word.length - 1) { UI.toast('No more hints – you can do it! 💪'); return; }
      s.hints++;
      document.getElementById('sBlanks').innerHTML = Spell.blanks();
      var input = document.getElementById('sInput');
      input.value = word.slice(0, s.hints);
      input.focus();
    },
    check: function () {
      var s = state;
      if (!s || s.finished) return;
      var input = document.getElementById('sInput');
      var given = input.value;
      if (!given.trim()) { UI.toast('Type your answer first ✏️'); input.focus(); return; }
      var it = s.items[s.index];
      if (norm(given) === norm(it.word)) { Spell.end(true, given); return; }
      s.attempts++;
      UI.sound('wrong');
      input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake', 'bad');
      if (s.attempts >= 2) { Spell.end(false, given); return; }
      var fb = document.getElementById('sFeedback');
      fb.className = 'feedback show bad';
      fb.innerHTML = '<div class="feedback-msg">🤔 ' + pick(OOPS) + ' Check your letters and try once more.</div>';
      input.select();
    },
    end: function (ok, given, revealed) {
      var s = state, it = s.items[s.index];
      if (s.finished) return;
      s.finished = true;
      var input = document.getElementById('sInput');
      input.disabled = true;
      UI.$$('.spell-tools .btn, #sForm .btn', body()).forEach(function (b) { if (b.getAttribute('data-act') !== 'speak') b.disabled = true; });
      var pts = 0;
      if (ok) {
        s.correct++;
        pts = Math.max(2, (s.attempts === 0 ? 10 : 5) - s.hints * 2);
        s.points += pts;
        input.classList.remove('bad'); input.classList.add('good');
        UI.sound('correct');
      } else if (!revealed) {
        UI.sound('wrong');
      }
      s.hints = it.word.trim().length;
      document.getElementById('sBlanks').innerHTML = Spell.blanks();
      document.getElementById('sBlanks').classList.add(ok ? 'good' : 'bad');
      s.review.push({ q: it.clue || it.emoji || 'Word ' + (s.index + 1), ok: ok, given: given.trim(), answer: it.word });
      Spell.stats();
      var last = s.index >= s.items.length - 1;
      var fb = document.getElementById('sFeedback');
      fb.className = 'feedback show ' + (ok ? 'good' : 'bad');
      fb.innerHTML = '<div class="feedback-msg">' + (ok ? '🎉 ' + pick(PRAISE) + ' +' + pts + ' points' : '📝 The correct spelling is <b class="answer-word">' + esc(it.word) + '</b>') + '</div>' +
        '<button type="button" class="btn btn-primary btn-lg" data-act="next">' + (last ? 'See results 🏁' : 'Next word ➜') + '</button>';
      var next = fb.querySelector('[data-act="next"]');
      next.addEventListener('click', Spell.next);
      next.focus({ preventScroll: true });
      setProgress(s.index + 1, s.items.length);
    },
    next: function () {
      var s = state;
      if (!s) return;
      if (s.index >= s.items.length - 1) {
        var total = s.items.length;
        results({
          percent: s.correct / total * 100,
          scoreText: s.correct + ' / ' + total, scoreLabel: 'words spelt correctly',
          stats: [['⭐', String(s.points), 'Points'], ['⏱️', UI.formatTime(Date.now() - s.started), 'Time'], ['🎯', Math.round(s.correct / total * 100) + '%', 'Accuracy']],
          review: s.review
        });
        return;
      }
      s.index++;
      Spell.render();
    }
  };

  BP.Player = { open: open, close: close, isOpen: function () { return !!state; } };
})();
