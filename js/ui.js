/* BrightPlay – shared UI helpers: modals, toasts, sounds, confetti, files */
(function () {
  var UI = {};

  UI.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  UI.$ = function (sel, root) { return (root || document).querySelector(sel); };
  UI.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  UI.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  UI.subject = function (id) {
    return BP.SUBJECTS.filter(function (s) { return s.id === id; })[0] || BP.SUBJECTS[BP.SUBJECTS.length - 1];
  };
  UI.difficulty = function (id) {
    return BP.DIFFICULTIES.filter(function (d) { return d.id === id; })[0] || BP.DIFFICULTIES[0];
  };

  /* Picture markup: uploaded image wins over emoji */
  UI.pic = function (item, cls) {
    if (item.image) return '<img class="' + (cls || 'pic') + '" src="' + UI.esc(item.image) + '" alt="">';
    if (item.emoji) return '<span class="' + (cls || 'pic') + ' pic-emoji" aria-hidden="true">' + UI.esc(item.emoji) + '</span>';
    return '';
  };

  UI.formatTime = function (ms) {
    var s = Math.round(ms / 1000);
    var m = Math.floor(s / 60);
    s = s % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  };

  /* ---------- Toasts ---------- */
  UI.toast = function (msg, kind) {
    var box = document.getElementById('toasts');
    var t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, 2600);
    setTimeout(function () { t.remove(); }, 3100);
  };

  /* ---------- Modal ---------- */
  UI.modal = function (opts) {
    return new Promise(function (resolve) {
      var root = document.getElementById('modalRoot');
      var wrap = document.createElement('div');
      wrap.className = 'modal-backdrop';
      var buttons = opts.buttons || [{ label: 'OK', value: true, cls: 'btn-primary' }];
      wrap.innerHTML =
        '<div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="modalTitle">' +
        (opts.icon ? '<div class="modal-icon" aria-hidden="true">' + opts.icon + '</div>' : '') +
        '<h2 id="modalTitle">' + UI.esc(opts.title || '') + '</h2>' +
        (opts.message ? '<p>' + UI.esc(opts.message) + '</p>' : '') +
        (opts.html || '') +
        '<div class="modal-actions">' +
        buttons.map(function (b, i) {
          return '<button type="button" class="btn ' + (b.cls || 'btn-light') + '" data-i="' + i + '">' + UI.esc(b.label) + '</button>';
        }).join('') +
        '</div></div>';
      var prevFocus = document.activeElement;
      function close(v) {
        document.removeEventListener('keydown', onKey);
        wrap.remove();
        if (prevFocus && prevFocus.focus) try { prevFocus.focus(); } catch (e) { /* ignore */ }
        resolve(v);
      }
      function onKey(e) { if (e.key === 'Escape') close(opts.cancelValue !== undefined ? opts.cancelValue : false); }
      wrap.addEventListener('click', function (e) {
        var b = e.target.closest('[data-i]');
        if (b) close(buttons[+b.getAttribute('data-i')].value);
        else if (e.target === wrap && opts.dismissable !== false) close(opts.cancelValue !== undefined ? opts.cancelValue : false);
      });
      document.addEventListener('keydown', onKey);
      root.appendChild(wrap);
      var focusBtn = wrap.querySelector('.modal-actions .btn:last-child');
      if (focusBtn) focusBtn.focus();
      if (opts.onOpen) opts.onOpen(wrap);
    });
  };

  UI.confirm = function (title, message, okLabel, danger) {
    return UI.modal({
      title: title, message: message, icon: danger ? '⚠️' : '🤔',
      buttons: [
        { label: 'Cancel', value: false, cls: 'btn-light' },
        { label: okLabel || 'OK', value: true, cls: danger ? 'btn-danger' : 'btn-primary' }
      ]
    });
  };

  UI.alert = function (title, message, icon) {
    return UI.modal({ title: title, message: message, icon: icon || 'ℹ️' });
  };

  /* ---------- Sound (Web Audio – no files needed) ---------- */
  var ctx = null;
  UI.soundOn = function () { return BP.Store.pref('sound') !== false; };
  function audio() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, start, dur, type, vol) {
    var a = audio();
    if (!a) return;
    var o = a.createOscillator();
    var g = a.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    var t = a.currentTime + start;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  UI.sound = function (name) {
    if (!UI.soundOn()) return;
    try {
      if (name === 'correct') { tone(660, 0, 0.15, 'triangle'); tone(990, 0.1, 0.25, 'triangle'); }
      else if (name === 'wrong') { tone(220, 0, 0.18, 'sawtooth', 0.08); tone(170, 0.15, 0.3, 'sawtooth', 0.08); }
      else if (name === 'tap') { tone(520, 0, 0.08, 'sine', 0.1); }
      else if (name === 'win') { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.12, 0.3, 'triangle'); }); }
    } catch (e) { /* ignore audio errors */ }
  };
  // iOS needs audio unlocked by a user gesture
  document.addEventListener('touchstart', function unlock() { audio(); document.removeEventListener('touchstart', unlock); }, { passive: true });

  /* ---------- Speech ---------- */
  UI.canSpeak = function () { return 'speechSynthesis' in window; };
  UI.speak = function (text) {
    if (!UI.canSpeak()) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.rate = 0.8;
      u.lang = document.documentElement.lang || 'en-GB';
      window.speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  };

  /* ---------- Confetti ---------- */
  UI.confetti = function () {
    var c = document.getElementById('confetti');
    if (!c || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    var x = c.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    c.style.display = 'block';
    var colors = BP.CARD_COLORS.concat(['#ffd23f']);
    var parts = [];
    for (var i = 0; i < 160; i++) {
      parts.push({
        x: Math.random() * c.width, y: -Math.random() * c.height * 0.5,
        w: (6 + Math.random() * 8) * dpr, h: (8 + Math.random() * 10) * dpr,
        vy: (2 + Math.random() * 4) * dpr, vx: (Math.random() - 0.5) * 3 * dpr,
        r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
        col: colors[i % colors.length]
      });
    }
    var start = performance.now();
    function frame(t) {
      x.clearRect(0, 0, c.width, c.height);
      parts.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.r += p.vr;
        x.save(); x.translate(p.x, p.y); x.rotate(p.r);
        x.fillStyle = p.col; x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        x.restore();
      });
      if (t - start < 3500) requestAnimationFrame(frame);
      else { x.clearRect(0, 0, c.width, c.height); c.style.display = 'none'; }
    }
    requestAnimationFrame(frame);
  };

  /* ---------- Files ---------- */
  UI.download = function (filename, text) {
    var blob = new Blob([text], { type: 'application/json' });
    // iPad/iPhone: offer the share sheet ("Save to Files") when available
    try {
      var file = new File([blob], filename, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] }) && /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document) {
        return navigator.share({ files: [file], title: filename }).catch(function (e) {
          if (e && e.name !== 'AbortError') UI.saveBlob(filename, blob);
        });
      }
    } catch (e) { /* fall through */ }
    UI.saveBlob(filename, blob);
    return Promise.resolve();
  };
  UI.saveBlob = function (filename, blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
  };

  UI.readFileText = function (file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(new Error('Could not read that file.')); };
      r.readAsText(file);
    });
  };

  /* Resize an uploaded picture so it fits comfortably in local storage */
  UI.resizeImage = function (file, max) {
    max = max || 360;
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) { reject(new Error('Please choose a picture file.')); return; }
      var r = new FileReader();
      r.onerror = function () { reject(new Error('Could not read that picture.')); };
      r.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('That picture could not be opened.')); };
        img.onload = function () {
          var s = Math.min(1, max / Math.max(img.width, img.height));
          var cv = document.createElement('canvas');
          cv.width = Math.max(1, Math.round(img.width * s));
          cv.height = Math.max(1, Math.round(img.height * s));
          var cx = cv.getContext('2d');
          cx.fillStyle = '#ffffff';
          cx.fillRect(0, 0, cv.width, cv.height);
          cx.drawImage(img, 0, 0, cv.width, cv.height);
          resolve(cv.toDataURL('image/jpeg', 0.8));
        };
        img.src = r.result;
      };
      r.readAsDataURL(file);
    });
  };

  UI.slug = function (s) {
    return (String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'game').slice(0, 40);
  };

  BP.UI = UI;
})();
