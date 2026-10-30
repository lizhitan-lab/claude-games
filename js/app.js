/* BrightPlay – app shell, routing and pages */
(function () {
  var UI = BP.UI, esc = UI.esc, Store = BP.Store;
  var main = document.getElementById('main');
  var currentRoute = '', inEditor = false;
  var lib = { q: '', subject: '', type: '', difficulty: '', topic: '', sort: 'recent' };

  Store.init();

  /* ---------- Router ---------- */
  function parse() {
    var h = (location.hash || '#/').replace(/^#\/?/, '');
    var qi = h.indexOf('?');
    var path = qi > -1 ? h.slice(0, qi) : h;
    var query = {};
    if (qi > -1) h.slice(qi + 1).split('&').forEach(function (kv) {
      var p = kv.split('=');
      if (p[0]) query[decodeURIComponent(p[0])] = decodeURIComponent((p[1] || '').replace(/\+/g, ' '));
    });
    return { parts: path.split('/').filter(Boolean), query: query, raw: location.hash };
  }

  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }

  function onHash() {
    if (inEditor && BP.Editor.isDirty()) {
      var target = location.hash;
      // Put the editor's address back (replaceState does not fire hashchange)
      history.replaceState(null, '', currentRoute || '#/');
      UI.confirm('Leave without saving?', 'You have changes that have not been saved yet.', 'Leave', true).then(function (ok) {
        if (ok) { BP.Editor.clearDirty(); location.hash = target; }
      });
      return;
    }
    route();
  }

  function route() {
    var r = parse();
    if (BP.Player.isOpen() && r.parts[0] !== 'play') BP.Player.close(true);
    currentRoute = location.hash || '#/';
    inEditor = false;
    var page = r.parts[0] || 'home';
    var view = document.createElement('div');
    view.className = 'view view-' + page;
    main.innerHTML = '';
    main.appendChild(view);
    setNav(page === 'edit' ? 'create' : page === 'play' ? 'library' : page);
    if (page === 'home') renderHome(view);
    else if (page === 'library') renderLibrary(view, r.query);
    else if (page === 'create') renderCreate(view);
    else if (page === 'edit') renderEdit(view, r.parts[1], r.query);
    else if (page === 'backup') renderBackup(view);
    else if (page === 'play') renderPlay(view, r.parts[1]);
    else renderNotFound(view);
    window.scrollTo(0, 0);
  }

  function setNav(page) {
    UI.$$('[data-nav]').forEach(function (a) {
      var on = a.getAttribute('data-nav') === page;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var titles = { home: 'Home', library: 'Game Library', create: 'Create', backup: 'Backup' };
    document.title = 'BrightPlay' + (titles[page] ? ' – ' + titles[page] : '');
  }

  /* ---------- Shared bits ---------- */
  function gameCard(g, opts) {
    opts = opts || {};
    var t = BP.TYPES[g.type], s = UI.subject(g.subject), d = UI.difficulty(g.difficulty);
    var sc = Store.getScore(g.id);
    var count = g.items.length;
    var stars = '';
    if (sc && sc.bestStars) for (var i = 1; i <= 3; i++) stars += '<span class="' + (i <= sc.bestStars ? 'on' : '') + '">★</span>';
    return '<article class="game-card" style="--card:' + esc(g.color || t.color) + '" data-id="' + esc(g.id) + '">' +
      '<button type="button" class="card-hero" data-act="play" aria-label="Play ' + esc(g.title) + '">' +
      '<span class="card-icon" aria-hidden="true">' + esc(g.icon || t.icon) + '</span>' +
      '<span class="card-type"><span aria-hidden="true">' + t.icon + '</span> ' + esc(t.name) + '</span>' +
      (stars ? '<span class="card-stars" aria-label="Best ' + sc.bestStars + ' stars">' + stars + '</span>' : '') +
      '<span class="card-play" aria-hidden="true">▶</span>' +
      '</button>' +
      '<div class="card-body">' +
      '<h3 class="card-title">' + esc(g.title) + '</h3>' +
      '<div class="card-tags">' +
      '<span class="tag" style="--tag:' + s.color + '">' + s.icon + ' ' + esc(g.subject) + '</span>' +
      (g.topic ? '<span class="tag tag-topic">' + esc(g.topic) + '</span>' : '') +
      '<span class="tag tag-diff diff-' + esc(d.id) + '">' + d.icon + ' ' + d.label + '</span>' +
      '</div>' +
      (g.description ? '<p class="card-desc">' + esc(g.description) + '</p>' : '') +
      '<p class="card-meta">' + count + ' ' + t.itemName + (count === 1 ? '' : 's') + (g.sample ? ' · Sample' : '') + (sc ? ' · Played ' + sc.plays + '×' : '') + '</p>' +
      '</div>' +
      (opts.compact ? '' :
        '<div class="card-actions">' +
        '<button type="button" class="btn btn-primary btn-play" data-act="play">▶ Play</button>' +
        '<button type="button" class="tool" data-act="share" aria-label="Share ' + esc(g.title) + '" title="Share link">🔗</button>' +
        '<button type="button" class="tool" data-act="edit" aria-label="Edit ' + esc(g.title) + '" title="Edit">✏️</button>' +
        '<button type="button" class="tool" data-act="more" aria-label="More options for ' + esc(g.title) + '" title="More">⋯</button>' +
        '</div>') +
      '</article>';
  }

  function bindCards(container, refresh) {
    container.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      var card = e.target.closest('.game-card');
      if (!b || !card) return;
      var id = card.getAttribute('data-id');
      var act = b.getAttribute('data-act');
      if (act === 'play') go('#/play/' + encodeURIComponent(id));
      else if (act === 'edit') go('#/edit/' + encodeURIComponent(id));
      else if (act === 'more') moreMenu(id, refresh);
      else if (act === 'share') { var sg = Store.get(id); if (sg) BP.Share.share(sg); }
    });
  }

  function moreMenu(id, refresh) {
    var g = Store.get(id);
    if (!g) return;
    UI.modal({
      title: g.title, icon: g.icon,
      buttons: [
        { label: '✏️ Edit', value: 'edit', cls: 'btn-light' },
        { label: '🔗 Share link', value: 'share', cls: 'btn-light' },
        { label: '📄 Duplicate', value: 'dup', cls: 'btn-light' },
        { label: '⬇️ Export', value: 'export', cls: 'btn-light' },
        { label: '🗑️ Delete', value: 'delete', cls: 'btn-danger-light' },
        { label: '▶ Play', value: 'play', cls: 'btn-primary' }
      ]
    }).then(function (v) {
      if (v === 'play') go('#/play/' + encodeURIComponent(id));
      else if (v === 'edit') go('#/edit/' + encodeURIComponent(id));
      else if (v === 'share') BP.Share.share(g);
      else if (v === 'dup') {
        try { Store.duplicate(id); UI.toast('Copy created 📄', 'good'); refresh(); } catch (e) { UI.alert('Could not copy', e.message, '😟'); }
      } else if (v === 'export') exportGames([id], UI.slug(g.title));
      else if (v === 'delete') {
        UI.confirm('Delete "' + g.title + '"?', 'The game will be removed from this device. This cannot be undone.', 'Delete game', true).then(function (ok) {
          if (ok) { Store.remove(id); UI.toast('Game deleted 🗑️'); refresh(); }
        });
      }
    });
  }

  function exportGames(ids, name) {
    var data = Store.exportData(ids);
    if (!data.games.length) { UI.toast('There are no games to export yet.'); return; }
    var d = new Date();
    var stamp = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    UI.download('brightplay-' + (name || 'backup') + '-' + stamp + '.json', JSON.stringify(data, null, 2)).then(function () {
      UI.toast('Exported ' + data.games.length + ' game' + (data.games.length === 1 ? '' : 's') + ' ⬇️', 'good');
    });
  }

  function importFile(file, after) {
    if (!file) return;
    UI.readFileText(file).then(function (text) {
      var res = Store.importData(text);
      var parts = [];
      if (res.added) parts.push(res.added + ' new');
      if (res.updated) parts.push(res.updated + ' updated');
      if (res.skipped) parts.push(res.skipped + ' skipped');
      UI.alert('Import complete!', 'Games imported: ' + parts.join(', ') + '.', '🎉');
      if (after) after();
    }).catch(function (err) {
      UI.alert('Import failed', err.message || 'That file could not be imported.', '😟');
    });
  }

  /* ---------- Home ---------- */
  function renderHome(v) {
    var games = Store.all();
    var bySubject = {};
    games.forEach(function (g) { bySubject[g.subject] = (bySubject[g.subject] || 0) + 1; });
    var recent = games.slice().sort(function (a, b) { return (b.updatedAt || '').localeCompare(a.updatedAt || ''); }).slice(0, 6);
    v.innerHTML =
      '<section class="hero">' +
      '<div class="hero-text">' +
      '<h1>Learning is more fun with <span class="rainbow">BrightPlay!</span></h1>' +
      '<p>Play colourful quizzes, matching games and spelling challenges – or make your own in minutes.</p>' +
      '<div class="hero-actions">' +
      '<a class="btn btn-primary btn-xl" href="#/library">🎮 Play a game</a>' +
      '<a class="btn btn-sun btn-xl" href="#/create">✏️ Make a game</a>' +
      '</div>' +
      '</div>' +
      '<div class="hero-art" aria-hidden="true">' + heroSVG() + '</div>' +
      '</section>' +

      '<section class="section">' +
      '<h2 class="section-title">Pick a game type</h2>' +
      '<div class="type-tiles">' + Object.keys(BP.TYPES).map(function (k) {
        var t = BP.TYPES[k];
        var n = games.filter(function (g) { return g.type === k; }).length;
        return '<a class="type-tile" style="--tile:' + t.color + '" href="#/library?type=' + k + '">' +
          '<span class="type-ico" aria-hidden="true">' + t.icon + '</span>' +
          '<span class="type-name">' + esc(t.name) + '</span>' +
          '<span class="type-blurb">' + esc(t.blurb) + '</span>' +
          '<span class="type-count">' + n + ' game' + (n === 1 ? '' : 's') + '</span>' +
          '</a>';
      }).join('') + '</div>' +
      '</section>' +

      '<section class="section">' +
      '<h2 class="section-title">Explore by subject</h2>' +
      '<div class="subject-chips">' + BP.SUBJECTS.filter(function (s) { return bySubject[s.id]; }).map(function (s) {
        return '<a class="subject-chip" style="--chip:' + s.color + '" href="#/library?subject=' + encodeURIComponent(s.id) + '"><span aria-hidden="true">' + s.icon + '</span> ' + esc(s.id) + ' <b>' + bySubject[s.id] + '</b></a>';
      }).join('') + '</div>' +
      '</section>' +

      '<section class="section">' +
      '<div class="section-row"><h2 class="section-title">Recently added</h2><a class="link-more" href="#/library">See all ' + games.length + ' games ➜</a></div>' +
      (recent.length ? '<div class="card-grid">' + recent.map(function (g) { return gameCard(g); }).join('') + '</div>'
        : emptyState('No games yet', 'Make your first game or restore the sample games from the Backup page.')) +
      '</section>' +

      '<section class="section how">' +
      '<h2 class="section-title">How it works</h2>' +
      '<ol class="steps">' +
      '<li><span class="step-ico" aria-hidden="true">✏️</span><b>Create</b><span>Choose a quiz, matching or spelling game and type in your questions.</span></li>' +
      '<li><span class="step-ico" aria-hidden="true">👀</span><b>Preview</b><span>Try it out before you save it.</span></li>' +
      '<li><span class="step-ico" aria-hidden="true">🎮</span><b>Play</b><span>Launch it from the library – scores and stars are tracked.</span></li>' +
      '<li><span class="step-ico" aria-hidden="true">💾</span><b>Back up</b><span>Export your games to a file and import them on another device.</span></li>' +
      '</ol>' +
      '</section>';
    bindCards(v, function () { route(); });
  }

  function emptyState(title, text, action) {
    return '<div class="empty"><div class="empty-ico" aria-hidden="true">🔍</div><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p>' + (action || '') + '</div>';
  }

  /* ---------- Library ---------- */
  function renderLibrary(v, query) {
    ['q', 'subject', 'type', 'difficulty', 'topic'].forEach(function (k) { if (query[k] !== undefined) lib[k] = query[k]; });
    if (query.subject !== undefined || query.type !== undefined) {
      // Coming from a home-page shortcut: start with only that filter
      ['q', 'subject', 'type', 'difficulty', 'topic'].forEach(function (k) { lib[k] = query[k] || ''; });
    }
    var all = Store.all();
    var topics = {};
    all.forEach(function (g) { if (g.topic) topics[g.topic] = 1; });
    function opt(val, label, cur) { return '<option value="' + esc(val) + '"' + (val === cur ? ' selected' : '') + '>' + label + '</option>'; }
    v.innerHTML =
      '<div class="page-head page-head-row">' +
      '<h1>📚 Game Library</h1>' +
      '<a class="btn btn-primary" href="#/create">➕ New game</a>' +
      '</div>' +
      '<div class="filters panel">' +
      '<label class="search"><span aria-hidden="true">🔍</span><input type="search" id="libSearch" placeholder="Search games…" value="' + esc(lib.q) + '" aria-label="Search games" autocomplete="off" enterkeyhint="search"></label>' +
      '<div class="filter-row">' +
      '<select id="fSubject" aria-label="Subject">' + opt('', 'All subjects', lib.subject) + BP.SUBJECTS.map(function (s) { return opt(s.id, s.icon + ' ' + esc(s.id), lib.subject); }).join('') + '</select>' +
      '<select id="fTopic" aria-label="Topic">' + opt('', 'All topics', lib.topic) + Object.keys(topics).sort().map(function (t) { return opt(t, esc(t), lib.topic); }).join('') + '</select>' +
      '<select id="fType" aria-label="Game type">' + opt('', 'All game types', lib.type) + Object.keys(BP.TYPES).map(function (k) { return opt(k, BP.TYPES[k].icon + ' ' + esc(BP.TYPES[k].name), lib.type); }).join('') + '</select>' +
      '<select id="fDiff" aria-label="Difficulty">' + opt('', 'Any difficulty', lib.difficulty) + BP.DIFFICULTIES.map(function (d) { return opt(d.id, d.icon + ' ' + d.label, lib.difficulty); }).join('') + '</select>' +
      '<select id="fSort" aria-label="Sort by">' + opt('recent', 'Newest first', lib.sort) + opt('az', 'A to Z', lib.sort) + opt('subject', 'By subject', lib.sort) + opt('difficulty', 'By difficulty', lib.sort) + '</select>' +
      '</div>' +
      '</div>' +
      '<p class="result-count" id="libCount" aria-live="polite"></p>' +
      '<div id="libGrid"></div>';

    var grid = v.querySelector('#libGrid');
    function draw() {
      var q = lib.q.trim().toLowerCase();
      var list = Store.all().filter(function (g) {
        if (lib.subject && g.subject !== lib.subject) return false;
        if (lib.type && g.type !== lib.type) return false;
        if (lib.difficulty && g.difficulty !== lib.difficulty) return false;
        if (lib.topic && g.topic !== lib.topic) return false;
        if (q) {
          var hay = [g.title, g.description, g.subject, g.topic, BP.TYPES[g.type].name].join(' ').toLowerCase();
          return q.split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
        }
        return true;
      });
      var dOrder = { easy: 0, medium: 1, hard: 2 };
      list.sort(function (a, b) {
        if (lib.sort === 'az') return a.title.localeCompare(b.title);
        if (lib.sort === 'subject') return a.subject.localeCompare(b.subject) || a.title.localeCompare(b.title);
        if (lib.sort === 'difficulty') return dOrder[a.difficulty] - dOrder[b.difficulty] || a.title.localeCompare(b.title);
        return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      });
      var filtered = lib.q || lib.subject || lib.type || lib.difficulty || lib.topic;
      v.querySelector('#libCount').innerHTML = list.length + ' game' + (list.length === 1 ? '' : 's') + (filtered ? ' found · <button type="button" class="linkish" id="clearF">Clear filters</button>' : '');
      var clr = v.querySelector('#clearF');
      if (clr) clr.addEventListener('click', function () {
        lib.q = lib.subject = lib.type = lib.difficulty = lib.topic = '';
        history.replaceState(null, '', '#/library');
        currentRoute = '#/library';
        renderLibrary(v, {});
      });
      if (!list.length) {
        grid.innerHTML = all.length ? emptyState('No games match', 'Try a different search word or clear the filters.')
          : emptyState('Your library is empty', 'Create a new game, import a backup, or restore the sample games.', '<a class="btn btn-primary" href="#/create">➕ Create a game</a> <a class="btn btn-light" href="#/backup">💾 Backup & restore</a>');
        return;
      }
      if (lib.sort === 'subject') {
        var groups = {};
        list.forEach(function (g) { (groups[g.subject] = groups[g.subject] || []).push(g); });
        grid.innerHTML = Object.keys(groups).map(function (s) {
          var sub = UI.subject(s);
          return '<h2 class="group-title" style="--chip:' + sub.color + '"><span aria-hidden="true">' + sub.icon + '</span> ' + esc(s) + '</h2><div class="card-grid">' + groups[s].map(function (g) { return gameCard(g); }).join('') + '</div>';
        }).join('');
      } else {
        grid.innerHTML = '<div class="card-grid">' + list.map(function (g) { return gameCard(g); }).join('') + '</div>';
      }
    }
    var search = v.querySelector('#libSearch');
    search.addEventListener('input', function () { lib.q = search.value; draw(); });
    search.addEventListener('keydown', function (e) { if (e.key === 'Enter') search.blur(); });
    [['#fSubject', 'subject'], ['#fTopic', 'topic'], ['#fType', 'type'], ['#fDiff', 'difficulty'], ['#fSort', 'sort']].forEach(function (p) {
      v.querySelector(p[0]).addEventListener('change', function (e) { lib[p[1]] = e.target.value; draw(); });
    });
    bindCards(grid, draw);
    draw();
  }

  /* ---------- Create (choose type) ---------- */
  function renderCreate(v) {
    var mine = Store.all().filter(function (g) { return !g.sample; });
    v.innerHTML =
      '<div class="page-head"><h1>✏️ Create a game</h1><p class="lead">What kind of game would you like to make?</p></div>' +
      '<div class="type-tiles big">' + Object.keys(BP.TYPES).map(function (k) {
        var t = BP.TYPES[k];
        var ex = k === 'quiz' ? 'e.g. "What is 3 + 4?" with four answers' : k === 'match' ? 'e.g. 🐱 Cat ↔ Kitten' : 'e.g. 🍌 "A long yellow fruit" → banana';
        return '<a class="type-tile" style="--tile:' + t.color + '" href="#/edit/new?type=' + k + '">' +
          '<span class="type-ico" aria-hidden="true">' + t.icon + '</span>' +
          '<span class="type-name">' + esc(t.name) + '</span>' +
          '<span class="type-blurb">' + esc(t.blurb) + '</span>' +
          '<span class="type-example">' + esc(ex) + '</span>' +
          '<span class="btn btn-white">Start ➜</span>' +
          '</a>';
      }).join('') + '</div>' +
      '<section class="section">' +
      '<h2 class="section-title">My games</h2>' +
      (mine.length ? '<div class="card-grid">' + mine.map(function (g) { return gameCard(g); }).join('') + '</div>'
        : emptyState('You have not made any games yet', 'Pick a game type above to get started. Your games are saved on this device.')) +
      '</section>';
    bindCards(v, function () { route(); });
  }

  /* ---------- Edit ---------- */
  function renderEdit(v, id, query) {
    var game;
    if (id === 'new') {
      var type = BP.TYPES[query.type] ? query.type : 'quiz';
      game = BP.Editor.newGame(type);
    } else {
      game = Store.get(decodeURIComponent(id || ''));
      if (!game) { renderNotFound(v); return; }
    }
    inEditor = true;
    BP.Editor.mount(v, game, {
      onSaved: function (saved) {
        if (id === 'new') { history.replaceState(null, '', '#/edit/' + encodeURIComponent(saved.id)); currentRoute = location.hash; }
        UI.modal({
          title: 'Game saved!', icon: '🎉', message: '"' + saved.title + '" is now in your library.',
          buttons: [
            { label: '✏️ Keep editing', value: 'stay', cls: 'btn-light' },
            { label: '🔗 Share', value: 'share', cls: 'btn-light' },
            { label: '📚 Library', value: 'lib', cls: 'btn-light' },
            { label: '▶ Play now', value: 'play', cls: 'btn-primary' }
          ],
          cancelValue: 'stay'
        }).then(function (v2) {
          if (v2 === 'stay') { if (id === 'new') go('#/edit/' + encodeURIComponent(saved.id)); return; }
          if (v2 === 'share') { if (id === 'new') go('#/edit/' + encodeURIComponent(saved.id)); BP.Share.share(saved); return; }
          go(v2 === 'play' ? '#/play/' + encodeURIComponent(saved.id) : '#/library');
        });
      },
      onCancel: function () { go(id === 'new' ? '#/create' : '#/library'); },
      onDeleted: function () { inEditor = false; go('#/library'); }
    });
  }

  /* ---------- Play ---------- */
  function renderPlay(v, id) {
    var g = Store.get(decodeURIComponent(id || ''));
    if (!g) { renderNotFound(v); return; }
    renderLibrary(v, {});
    setNav('library');
    BP.Player.open(g, {
      onClose: function () {
        if (/^#\/play\//.test(location.hash)) {
          history.replaceState(null, '', '#/library');
          route();
        }
      }
    });
  }

  /* ---------- Backup ---------- */
  function renderBackup(v) {
    var games = Store.all();
    var mine = games.filter(function (g) { return !g.sample; }).length;
    v.innerHTML =
      '<div class="page-head"><h1>💾 Backup &amp; restore</h1><p class="lead">Your games are saved in this browser on this device. Export a backup file to keep them safe or move them to another device.</p></div>' +
      '<div class="backup-grid">' +
      '<section class="panel backup-card" style="--accent:#3a86ff">' +
      '<div class="backup-ico" aria-hidden="true">⬇️</div><h2>Export games</h2>' +
      '<p>Download all ' + games.length + ' games (' + mine + ' made by you) as a <b>.json</b> backup file.</p>' +
      '<button type="button" class="btn btn-primary btn-lg" id="btnExport">⬇️ Export all games</button>' +
      '<details class="pick"><summary>Choose which games to export</summary><div class="pick-list">' +
      games.map(function (g) { return '<label class="check"><input type="checkbox" value="' + esc(g.id) + '" checked><span>' + esc(g.icon) + ' ' + esc(g.title) + '</span></label>'; }).join('') +
      '</div><button type="button" class="btn btn-light" id="btnExportSel">⬇️ Export selected</button></details>' +
      '</section>' +
      '<section class="panel backup-card" style="--accent:#3bb273">' +
      '<div class="backup-ico" aria-hidden="true">⬆️</div><h2>Import games</h2>' +
      '<p>Load a BrightPlay backup file. Games with the same ID are updated; new games are added.</p>' +
      '<label class="btn btn-secondary btn-lg file-btn">⬆️ Choose backup file<input type="file" id="importInput" accept=".json,application/json,text/plain" hidden></label>' +
      '<div class="drop" id="drop">or drop a file here</div>' +
      '</section>' +
      '<section class="panel backup-card" style="--accent:#ff9f1c">' +
      '<div class="backup-ico" aria-hidden="true">✨</div><h2>Sample games</h2>' +
      '<p>Bring back the ' + BP.SAMPLE_GAMES.length + ' demonstration games if you deleted or changed them.</p>' +
      '<button type="button" class="btn btn-sun btn-lg" id="btnSamples">✨ Restore sample games</button>' +
      '</section>' +
      '<section class="panel backup-card" style="--accent:#ef476f">' +
      '<div class="backup-ico" aria-hidden="true">🧹</div><h2>Start fresh</h2>' +
      '<p>Delete every game and score from this device. Export a backup first!</p>' +
      '<button type="button" class="btn btn-danger btn-lg" id="btnClear">🗑️ Delete all games</button>' +
      '</section>' +
      '</div>' +
      '<p class="storage-note">Storage used: about ' + Store.usageKB() + ' KB. Browsers usually allow around 5,000 KB. Photos use the most space.</p>';

    v.querySelector('#btnExport').addEventListener('click', function () { exportGames(null, 'all-games'); });
    v.querySelector('#btnExportSel').addEventListener('click', function () {
      var ids = UI.$$('.pick-list input:checked', v).map(function (c) { return c.value; });
      if (!ids.length) { UI.toast('Tick at least one game.'); return; }
      exportGames(ids, 'selected');
    });
    var input = v.querySelector('#importInput');
    input.addEventListener('change', function () { importFile(input.files[0], function () { renderBackup(v); }); input.value = ''; });
    var drop = v.querySelector('#drop');
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (e) { var f = e.dataTransfer.files[0]; importFile(f, function () { renderBackup(v); }); });
    v.querySelector('#btnSamples').addEventListener('click', function () {
      var n = Store.restoreSamples();
      UI.toast(n ? 'Restored ' + n + ' sample game' + (n === 1 ? '' : 's') + ' ✨' : 'Sample games are up to date ✨', 'good');
      renderBackup(v);
    });
    v.querySelector('#btnClear').addEventListener('click', function () {
      UI.confirm('Delete ALL games?', 'Every game and score on this device will be removed. This cannot be undone.', 'Delete everything', true).then(function (ok) {
        if (!ok) return;
        Store.clearAll();
        UI.toast('All games deleted 🧹');
        renderBackup(v);
      });
    });
  }

  function renderNotFound(v) {
    v.innerHTML = emptyState('Page not found', 'That game or page could not be found. It may have been deleted.', '<a class="btn btn-primary" href="#/library">📚 Go to the library</a>');
  }

  /* ---------- Hero illustration ---------- */
  function heroSVG() {
    return '<svg viewBox="0 0 400 320" role="img" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><linearGradient id="hs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe066"/><stop offset="1" stop-color="#ffb703"/></linearGradient></defs>' +
      '<circle cx="200" cy="165" r="140" fill="#ffffff" opacity=".55"/>' +
      '<g class="float1"><rect x="40" y="40" width="80" height="80" rx="18" fill="#6c4cf5" transform="rotate(-12 80 80)"/><text x="80" y="96" font-size="46" text-anchor="middle" fill="#fff" font-weight="800" transform="rotate(-12 80 80)">?</text></g>' +
      '<g class="float2"><rect x="290" y="30" width="78" height="78" rx="18" fill="#2ec4b6" transform="rotate(10 329 69)"/><text x="329" y="86" font-size="40" text-anchor="middle" fill="#fff" font-weight="800" transform="rotate(10 329 69)">Aa</text></g>' +
      '<g class="float3"><rect x="300" y="210" width="76" height="76" rx="18" fill="#ff9f1c" transform="rotate(-8 338 248)"/><text x="338" y="264" font-size="40" text-anchor="middle" transform="rotate(-8 338 248)">🧩</text></g>' +
      '<g class="float2"><rect x="30" y="200" width="70" height="70" rx="18" fill="#ff5c93" transform="rotate(12 65 235)"/><text x="65" y="251" font-size="38" text-anchor="middle" fill="#fff" font-weight="800" transform="rotate(12 65 235)">★</text></g>' +
      '<g class="bob">' +
      '<path d="M200 52 L232 122 L308 128 L250 178 L268 252 L200 212 L132 252 L150 178 L92 128 L168 122 Z" fill="url(#hs)" stroke="#f4a300" stroke-width="8" stroke-linejoin="round"/>' +
      '<ellipse cx="176" cy="160" rx="9" ry="12" fill="#2b2d42"/><ellipse cx="224" cy="160" rx="9" ry="12" fill="#2b2d42"/>' +
      '<circle cx="179" cy="156" r="3" fill="#fff"/><circle cx="227" cy="156" r="3" fill="#fff"/>' +
      '<path d="M178 186 Q200 206 222 186" stroke="#2b2d42" stroke-width="6" fill="none" stroke-linecap="round"/>' +
      '<circle cx="158" cy="184" r="9" fill="#ff8fab" opacity=".7"/><circle cx="242" cy="184" r="9" fill="#ff8fab" opacity=".7"/>' +
      '</g>' +
      '<circle cx="140" cy="30" r="6" fill="#3a86ff"/><circle cx="260" cy="290" r="7" fill="#6c4cf5"/><circle cx="380" cy="160" r="5" fill="#ff5c93"/><circle cx="20" cy="150" r="6" fill="#3bb273"/>' +
      '</svg>';
  }

  /* ---------- Sound toggle ---------- */
  var st = document.getElementById('soundToggle');
  function paintSound() { var on = UI.soundOn(); st.textContent = on ? '🔊' : '🔇'; st.setAttribute('aria-label', on ? 'Sound on' : 'Sound off'); st.setAttribute('aria-pressed', on); }
  st.addEventListener('click', function () { Store.pref('sound', !UI.soundOn()); paintSound(); UI.sound('tap'); });
  paintSound();

  function start() {
    window.addEventListener('hashchange', onHash);
    window.addEventListener('beforeunload', function (e) {
      if (inEditor && BP.Editor.isDirty()) { e.preventDefault(); e.returnValue = ''; }
    });
    route();
  }
  // A host page can set BP.DEFER_START and call BP.App.start() itself (e.g. to show a shared game instead)
  if (!BP.DEFER_START) start();

  BP.App = { go: go, route: route, start: start };
})();
