/* BrightPlay – game creator / editor */
(function () {
  var UI = BP.UI, esc = UI.esc, Store = BP.Store;
  var draft = null, root = null, dirty = false, isNew = true, hooks = {};

  function blankItem(type) {
    if (type === 'quiz') return { q: '', emoji: '', image: '', answers: ['', '', '', ''], correct: 0 };
    if (type === 'match') return { left: '', emoji: '', image: '', right: '' };
    return { word: '', clue: '', emoji: '', image: '' };
  }

  function newGame(type) {
    var t = BP.TYPES[type];
    var n = type === 'match' ? 3 : type === 'spell' ? 2 : 1;
    var items = [];
    for (var i = 0; i < n; i++) items.push(blankItem(type));
    return {
      id: '', type: type, title: '', description: '', subject: 'General', topic: '', difficulty: 'easy',
      icon: t.icon, color: t.color,
      settings: type === 'quiz' ? { shuffle: true, shuffleAnswers: true } : type === 'match' ? { shuffle: true } : { shuffle: true, showLength: true, allowSpeak: true },
      items: items
    };
  }

  /* ---------- mount ---------- */
  function mount(container, game, opts) {
    root = container;
    hooks = opts || {};
    isNew = !game.id;
    draft = Store.clone(game);
    draft.settings = draft.settings || {};
    dirty = false;
    render();
  }

  function markDirty() { dirty = true; }

  function render() {
    var t = BP.TYPES[draft.type];
    var topics = {};
    Store.all().forEach(function (g) { if (g.topic) topics[g.topic] = 1; });
    root.innerHTML =
      '<div class="editor" style="--type-color:' + t.color + '">' +
      '<div class="page-head">' +
      '<div class="type-badge" style="background:' + t.color + '"><span aria-hidden="true">' + t.icon + '</span> ' + esc(t.name) + '</div>' +
      '<h1>' + (isNew ? 'Create a new ' + esc(t.name.toLowerCase()) + ' game' : 'Edit game') + '</h1>' +
      '</div>' +

      '<section class="panel">' +
      '<h2 class="panel-title">1. Game details</h2>' +
      '<div class="form-grid">' +
      field('Title', '<input type="text" id="fTitle" data-g="title" maxlength="80" placeholder="e.g. Space Explorers Quiz" value="' + esc(draft.title) + '" required>', 'full') +
      field('Description', '<textarea id="fDesc" data-g="description" rows="2" maxlength="240" placeholder="What is this game about?">' + esc(draft.description) + '</textarea>', 'full') +
      field('Subject', '<select data-g="subject">' + BP.SUBJECTS.map(function (s) {
        return '<option value="' + esc(s.id) + '"' + (s.id === draft.subject ? ' selected' : '') + '>' + s.icon + ' ' + esc(s.id) + '</option>';
      }).join('') + '</select>') +
      field('Topic', '<input type="text" data-g="topic" list="topicList" maxlength="60" placeholder="e.g. Fractions, Animals" value="' + esc(draft.topic) + '">' +
        '<datalist id="topicList">' + Object.keys(topics).sort().map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>') +
      '</div>' +
      '<div class="field"><span class="label">Difficulty</span><div class="segmented" role="radiogroup" aria-label="Difficulty">' +
      BP.DIFFICULTIES.map(function (d) {
        return '<button type="button" role="radio" aria-checked="' + (draft.difficulty === d.id) + '" class="seg' + (draft.difficulty === d.id ? ' on' : '') + '" data-diff="' + d.id + '">' + d.icon + ' ' + d.label + '</button>';
      }).join('') + '</div></div>' +
      '<div class="field"><span class="label">Card icon</span><div class="icon-grid">' +
      BP.ICONS.map(function (ic) {
        return '<button type="button" class="icon-choice' + (draft.icon === ic ? ' on' : '') + '" data-icon="' + ic + '" aria-label="Icon ' + ic + '">' + ic + '</button>';
      }).join('') +
      '<input type="text" class="icon-custom" data-g="icon" maxlength="8" value="' + esc(draft.icon) + '" aria-label="Custom icon (type or paste an emoji)" title="Type or paste any emoji">' +
      '</div></div>' +
      '<div class="field"><span class="label">Card colour</span><div class="swatches">' +
      BP.CARD_COLORS.map(function (c) {
        return '<button type="button" class="swatch' + (draft.color === c ? ' on' : '') + '" data-color="' + c + '" style="background:' + c + '" aria-label="Colour ' + c + '"></button>';
      }).join('') + '</div></div>' +
      '<div class="field"><span class="label">Options</span><div class="checks">' + settingsHtml() + '</div></div>' +
      '</section>' +

      '<section class="panel">' +
      '<div class="panel-row"><h2 class="panel-title">2. ' + esc(cap(t.itemName)) + 's <span class="count" id="itemCount">' + draft.items.length + '</span></h2>' +
      (draft.type !== 'quiz' ? '<button type="button" class="btn btn-light" data-act="bulk">📋 Quick add from a list</button>' : '') +
      '</div>' +
      '<div id="items" class="items">' + draft.items.map(itemHtml).join('') + '</div>' +
      '<button type="button" class="btn btn-add btn-lg" data-act="add">➕ Add ' + esc(t.itemName) + '</button>' +
      '</section>' +

      '<div class="editor-bar">' +
      '<button type="button" class="btn btn-light" data-act="cancel" aria-label="Cancel">✕<span class="lbl"> Cancel</span></button>' +
      (!isNew ? '<button type="button" class="btn btn-danger-light" data-act="delete" aria-label="Delete game">🗑️<span class="lbl"> Delete</span></button>' : '') +
      '<span class="spacer"></span>' +
      '<button type="button" class="btn btn-secondary" data-act="preview">▶️ Preview</button>' +
      '<button type="button" class="btn btn-primary" data-act="save">💾 Save<span class="lbl"> game</span></button>' +
      '</div>' +
      '</div>';
    bind();
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function field(label, inner, cls) {
    return '<label class="field ' + (cls || '') + '"><span class="label">' + esc(label) + '</span>' + inner + '</label>';
  }

  function check(key, label, def) {
    var on = draft.settings[key] === undefined ? def : !!draft.settings[key];
    return '<label class="check"><input type="checkbox" data-set="' + key + '"' + (on ? ' checked' : '') + '><span>' + esc(label) + '</span></label>';
  }

  function settingsHtml() {
    if (draft.type === 'quiz') return check('shuffle', 'Shuffle question order', true) + check('shuffleAnswers', 'Shuffle answer order', true);
    if (draft.type === 'match') return check('shuffle', 'Shuffle cards', true);
    return check('shuffle', 'Shuffle word order', true) + check('showLength', 'Show number of letters', true) + check('allowSpeak', 'Allow "Hear the word"', true);
  }

  function picHtml(it, i) {
    return '<div class="pic-row">' +
      '<div class="pic-preview" aria-hidden="true">' + (UI.pic(it, 'pic-thumb') || '<span class="pic-empty">🖼️</span>') + '</div>' +
      '<div class="pic-controls">' +
      '<span class="label small">Picture (optional)</span>' +
      '<div class="pic-buttons">' +
      '<input type="text" class="emoji-input" data-i="' + i + '" data-f="emoji" maxlength="12" placeholder="Emoji" value="' + esc(it.emoji) + '" aria-label="Emoji picture">' +
      '<label class="btn btn-light btn-sm file-btn">📷 Upload<input type="file" accept="image/*" data-i="' + i + '" data-upload="1" hidden></label>' +
      (it.image ? '<button type="button" class="btn btn-light btn-sm" data-act="rmimg" data-i="' + i + '">✕ Remove photo</button>' : '') +
      '</div></div></div>';
  }

  function itemTools(i) {
    var n = draft.items.length;
    return '<div class="item-tools">' +
      '<button type="button" class="tool" data-act="up" data-i="' + i + '" aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '>⬆️</button>' +
      '<button type="button" class="tool" data-act="down" data-i="' + i + '" aria-label="Move down"' + (i === n - 1 ? ' disabled' : '') + '>⬇️</button>' +
      '<button type="button" class="tool" data-act="dup" data-i="' + i + '" aria-label="Duplicate">📄</button>' +
      '<button type="button" class="tool tool-del" data-act="del" data-i="' + i + '" aria-label="Delete">🗑️</button>' +
      '</div>';
  }

  function itemHtml(it, i) {
    var head = '<div class="item-head"><span class="item-num">' + (i + 1) + '</span>' + itemTools(i) + '</div>';
    if (draft.type === 'quiz') {
      return '<div class="item-card" data-item="' + i + '">' + head +
        '<label class="field full"><span class="label">Question</span><textarea rows="2" data-i="' + i + '" data-f="q" maxlength="300" placeholder="Type your question…">' + esc(it.q) + '</textarea></label>' +
        picHtml(it, i) +
        '<span class="label">Answers <small>(tap ✓ to choose the correct one)</small></span>' +
        '<div class="answer-edit">' + [0, 1, 2, 3].map(function (a) {
          var on = it.correct === a;
          return '<div class="answer-row a' + a + (on ? ' is-correct' : '') + '">' +
            '<button type="button" class="correct-toggle" data-act="correct" data-i="' + i + '" data-a="' + a + '" aria-pressed="' + on + '" aria-label="Mark answer ' + (a + 1) + ' as correct">' + (on ? '✓' : '') + '</button>' +
            '<input type="text" data-i="' + i + '" data-a="' + a + '" maxlength="120" placeholder="Answer ' + (a + 1) + '" value="' + esc(it.answers[a]) + '">' +
            '</div>';
        }).join('') + '</div></div>';
    }
    if (draft.type === 'match') {
      return '<div class="item-card" data-item="' + i + '">' + head +
        '<div class="pair-edit">' +
        '<div class="pair-side"><label class="field"><span class="label">Word / prompt</span><input type="text" data-i="' + i + '" data-f="left" maxlength="80" placeholder="e.g. Cat" value="' + esc(it.left) + '"></label>' + picHtml(it, i) + '</div>' +
        '<div class="pair-link" aria-hidden="true">🔗</div>' +
        '<div class="pair-side"><label class="field"><span class="label">Matching meaning / answer</span><input type="text" data-i="' + i + '" data-f="right" maxlength="100" placeholder="e.g. Kitten" value="' + esc(it.right) + '"></label></div>' +
        '</div></div>';
    }
    return '<div class="item-card" data-item="' + i + '">' + head +
      '<div class="form-grid">' +
      '<label class="field"><span class="label">Correct spelling</span><input type="text" data-i="' + i + '" data-f="word" maxlength="40" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="e.g. elephant" value="' + esc(it.word) + '"></label>' +
      '<label class="field"><span class="label">Clue or definition</span><input type="text" data-i="' + i + '" data-f="clue" maxlength="200" placeholder="e.g. A huge grey animal with a trunk" value="' + esc(it.clue) + '"></label>' +
      '</div>' + picHtml(it, i) + '</div>';
  }

  function rerenderItems(focusIndex) {
    var box = root.querySelector('#items');
    box.innerHTML = draft.items.map(itemHtml).join('');
    root.querySelector('#itemCount').textContent = draft.items.length;
    if (focusIndex != null) {
      var card = box.querySelector('[data-item="' + focusIndex + '"]');
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        var f = card.querySelector('textarea, input[type="text"]');
        if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 250);
      }
    }
  }

  function rerenderItem(i) {
    var card = root.querySelector('[data-item="' + i + '"]');
    if (!card) return;
    var tmp = document.createElement('div');
    tmp.innerHTML = itemHtml(draft.items[i], i);
    card.replaceWith(tmp.firstChild);
  }

  /* ---------- events ---------- */
  function bind() {
    root.addEventListener('input', onInput);
    root.addEventListener('change', onChange);
    root.addEventListener('click', onClick);
  }

  function onInput(e) {
    var t = e.target;
    if (t.hasAttribute('data-g')) {
      draft[t.getAttribute('data-g')] = t.value;
      if (t.getAttribute('data-g') === 'icon') UI.$$('.icon-choice', root).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-icon') === t.value); });
      markDirty();
      t.classList.remove('invalid');
      return;
    }
    if (t.hasAttribute('data-i') && !t.hasAttribute('data-upload')) {
      var it = draft.items[+t.getAttribute('data-i')];
      if (t.hasAttribute('data-a')) it.answers[+t.getAttribute('data-a')] = t.value;
      else it[t.getAttribute('data-f')] = t.value;
      if (t.getAttribute('data-f') === 'emoji') {
        var prev = t.closest('.pic-row').querySelector('.pic-preview');
        prev.innerHTML = UI.pic(it, 'pic-thumb') || '<span class="pic-empty">🖼️</span>';
      }
      t.classList.remove('invalid');
      markDirty();
    }
  }

  function onChange(e) {
    var t = e.target;
    if (t.hasAttribute('data-set')) { draft.settings[t.getAttribute('data-set')] = t.checked; markDirty(); return; }
    if (t.hasAttribute('data-g') && t.tagName === 'SELECT') { draft[t.getAttribute('data-g')] = t.value; markDirty(); return; }
    if (t.hasAttribute('data-upload')) {
      var i = +t.getAttribute('data-i');
      var file = t.files && t.files[0];
      if (!file) return;
      UI.resizeImage(file, 360).then(function (url) {
        draft.items[i].image = url;
        markDirty();
        rerenderItem(i);
        UI.toast('Picture added 📷', 'good');
      }).catch(function (err) { UI.alert('Picture problem', err.message, '📷'); });
    }
  }

  function onClick(e) {
    var b = e.target.closest('button');
    if (!b || !root.contains(b)) return;
    if (b.hasAttribute('data-diff')) {
      draft.difficulty = b.getAttribute('data-diff');
      UI.$$('[data-diff]', root).forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); });
      markDirty(); return;
    }
    if (b.hasAttribute('data-icon')) {
      draft.icon = b.getAttribute('data-icon');
      UI.$$('.icon-choice', root).forEach(function (x) { x.classList.toggle('on', x === b); });
      root.querySelector('.icon-custom').value = draft.icon;
      markDirty(); return;
    }
    if (b.hasAttribute('data-color')) {
      draft.color = b.getAttribute('data-color');
      UI.$$('.swatch', root).forEach(function (x) { x.classList.toggle('on', x === b); });
      markDirty(); return;
    }
    var act = b.getAttribute('data-act');
    var i = b.hasAttribute('data-i') ? +b.getAttribute('data-i') : -1;
    switch (act) {
      case 'add':
        draft.items.push(blankItem(draft.type)); markDirty(); rerenderItems(draft.items.length - 1); break;
      case 'del':
        if (draft.items.length <= 1) { UI.toast('A game needs at least one ' + BP.TYPES[draft.type].itemName + '.'); break; }
        var it = draft.items[i];
        var empty = draft.type === 'quiz' ? !it.q && !it.answers.join('') : draft.type === 'match' ? !it.left && !it.right : !it.word && !it.clue;
        var doDel = function () { draft.items.splice(i, 1); markDirty(); rerenderItems(); };
        if (empty) doDel();
        else UI.confirm('Delete this ' + BP.TYPES[draft.type].itemName + '?', 'This cannot be undone.', 'Delete', true).then(function (ok) { if (ok) doDel(); });
        break;
      case 'up':
        if (i > 0) { var x = draft.items.splice(i, 1)[0]; draft.items.splice(i - 1, 0, x); markDirty(); rerenderItems(); }
        break;
      case 'down':
        if (i < draft.items.length - 1) { var y = draft.items.splice(i, 1)[0]; draft.items.splice(i + 1, 0, y); markDirty(); rerenderItems(); }
        break;
      case 'dup':
        draft.items.splice(i + 1, 0, Store.clone(draft.items[i])); markDirty(); rerenderItems(i + 1); break;
      case 'correct':
        draft.items[i].correct = +b.getAttribute('data-a'); markDirty(); rerenderItem(i); break;
      case 'rmimg':
        draft.items[i].image = ''; markDirty(); rerenderItem(i); break;
      case 'bulk': bulkAdd(); break;
      case 'preview': preview(); break;
      case 'save': save(); break;
      case 'cancel': if (hooks.onCancel) hooks.onCancel(); break;
      case 'delete':
        UI.confirm('Delete "' + (draft.title || 'this game') + '"?', 'The game will be removed from this device. This cannot be undone.', 'Delete game', true).then(function (ok) {
          if (!ok) return;
          Store.remove(draft.id);
          dirty = false;
          UI.toast('Game deleted 🗑️');
          if (hooks.onDeleted) hooks.onDeleted();
        });
        break;
    }
  }

  /* ---------- quick add ---------- */
  function bulkAdd() {
    var isMatch = draft.type === 'match';
    UI.modal({
      title: 'Quick add from a list', icon: '📋',
      message: isMatch ? 'Type one pair per line, with an = sign between the word and its match.' : 'Type one word per line. Optionally add = and a clue.',
      html: '<textarea id="bulkText" class="bulk-text" rows="7" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="' +
        (isMatch ? 'cat = kitten&#10;dog = puppy&#10;cow = calf' : 'apple = A crunchy red or green fruit&#10;banana = A long yellow fruit&#10;cherry') + '"></textarea>',
      buttons: [{ label: 'Cancel', value: false }, { label: 'Add to game', value: true, cls: 'btn-primary' }],
      dismissable: false,
      onOpen: function (w) { setTimeout(function () { w.querySelector('#bulkText').focus(); }, 50); }
    }).then(function () { /* value handled below */ });
    // Read the textarea before the modal is removed
    var modal = document.querySelector('.modal-backdrop:last-child');
    var addBtn = modal.querySelector('.btn-primary');
    addBtn.addEventListener('click', function () {
      var text = modal.querySelector('#bulkText').value;
      var added = 0;
      var newItems = [];
      text.split(/\r?\n/).forEach(function (line) {
        line = line.trim();
        if (!line) return;
        var parts = line.split(/\s*(?:=|\t|\|)\s*/);
        var a = (parts.shift() || '').trim(), b = parts.join(' ').trim();
        if (isMatch) { if (!a || !b) return; newItems.push({ left: a, emoji: '', image: '', right: b }); }
        else { if (!a) return; newItems.push({ word: a, clue: b, emoji: '', image: '' }); }
        added++;
      });
      if (!added) { UI.toast(isMatch ? 'No pairs found – use "word = match" on each line.' : 'No words found.'); return; }
      // Drop untouched blank rows before adding
      draft.items = draft.items.filter(function (it) { return isMatch ? (it.left || it.right || it.image || it.emoji) : (it.word || it.clue || it.image || it.emoji); }).concat(newItems);
      markDirty();
      rerenderItems();
      UI.toast('Added ' + added + ' ' + BP.TYPES[draft.type].itemName + (added === 1 ? '' : 's') + ' ✅', 'good');
    }, true);
  }

  /* ---------- validation ---------- */
  function validate() {
    var errs = [];
    var firstBad = null;
    function bad(sel, msg) {
      errs.push(msg);
      var f = root.querySelector(sel);
      if (f) { f.classList.add('invalid'); if (!firstBad) firstBad = f; }
    }
    UI.$$('.invalid', root).forEach(function (x) { x.classList.remove('invalid'); });
    if (!draft.title.trim()) bad('#fTitle', 'Give your game a title.');
    draft.items.forEach(function (it, i) {
      var n = i + 1;
      var p = '[data-i="' + i + '"]';
      if (draft.type === 'quiz') {
        if (!it.q.trim()) bad('textarea' + p, 'Question ' + n + ' needs some question text.');
        var filled = it.answers.filter(function (a) { return a.trim(); }).length;
        it.answers.forEach(function (a, ai) { if (!a.trim()) bad('input' + p + '[data-a="' + ai + '"]', ''); });
        if (filled < 4) errs.push('Question ' + n + ' needs all four answers filled in.');
      } else if (draft.type === 'match') {
        if (!it.left.trim() && !it.emoji && !it.image) bad('input' + p + '[data-f="left"]', 'Pair ' + n + ' needs a word or a picture.');
        if (!it.right.trim()) bad('input' + p + '[data-f="right"]', 'Pair ' + n + ' needs a matching answer.');
      } else {
        if (!it.word.trim()) bad('input' + p + '[data-f="word"]', 'Word ' + n + ' needs the correct spelling.');
        if (!it.clue.trim() && !it.emoji && !it.image) bad('input' + p + '[data-f="clue"]', 'Word ' + n + ' needs a clue or a picture.');
      }
    });
    if (draft.type === 'match' && draft.items.length < 2) errs.push('Matching games need at least 2 pairs.');
    if (draft.type === 'match') {
      var seen = {};
      draft.items.forEach(function (it, i) {
        var k = it.right.trim().toLowerCase();
        if (k && seen[k]) errs.push('Pairs ' + seen[k] + ' and ' + (i + 1) + ' have the same answer "' + it.right.trim() + '". Each answer must be different.');
        else if (k) seen[k] = i + 1;
      });
    }
    errs = errs.filter(Boolean);
    return { ok: !errs.length, errors: errs, first: firstBad };
  }

  function showErrors(v) {
    var list = v.errors.slice(0, 6);
    if (v.errors.length > 6) list.push('…and ' + (v.errors.length - 6) + ' more.');
    UI.modal({
      title: 'Almost there!', icon: '📝',
      message: 'Please fix these things first:',
      html: '<ul class="error-list">' + list.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul>',
      buttons: [{ label: 'OK, fix it', value: true, cls: 'btn-primary' }]
    }).then(function () {
      if (v.first) { v.first.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(function () { v.first.focus({ preventScroll: true }); }, 300); }
    });
  }

  function preview() {
    var v = validate();
    if (!v.ok) { showErrors(v); return; }
    var g = Store.normalise(Store.clone(draft));
    BP.Player.open(g, { preview: true });
  }

  function save() {
    var v = validate();
    if (!v.ok) { showErrors(v); return; }
    try {
      draft.sample = false;
      var saved = Store.save(draft);
      draft.id = saved.id;
      dirty = false;
      UI.toast('Game saved! 🎉', 'good');
      if (hooks.onSaved) hooks.onSaved(saved);
    } catch (err) {
      UI.alert('Could not save', err.message || 'Something went wrong while saving.', '😟');
    }
  }

  BP.Editor = {
    mount: mount,
    newGame: newGame,
    isDirty: function () { return dirty; },
    clearDirty: function () { dirty = false; },
    unmount: function () { root = null; draft = null; dirty = false; }
  };
})();
