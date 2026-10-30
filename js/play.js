/* BrightPlay – play-only screen for shared game links */
(function () {
  var UI = BP.UI, esc = UI.esc;

  function show(container, game) {
    var t = BP.TYPES[game.type], s = UI.subject(game.subject), d = UI.difficulty(game.difficulty);
    var n = game.items.length;
    document.title = game.title + ' – BrightPlay';
    container.innerHTML =
      '<section class="share-intro" style="--card:' + esc(game.color || t.color) + '">' +
      '<div class="share-hero"><span class="card-icon" aria-hidden="true">' + esc(game.icon || t.icon) + '</span></div>' +
      '<div class="share-body">' +
      '<span class="card-type-inline"><span aria-hidden="true">' + t.icon + '</span> ' + esc(t.name) + '</span>' +
      '<h1>' + esc(game.title) + '</h1>' +
      (game.description ? '<p class="lead">' + esc(game.description) + '</p>' : '') +
      '<div class="card-tags">' +
      '<span class="tag" style="--tag:' + s.color + '">' + s.icon + ' ' + esc(game.subject) + '</span>' +
      (game.topic ? '<span class="tag tag-topic">' + esc(game.topic) + '</span>' : '') +
      '<span class="tag tag-diff diff-' + esc(d.id) + '">' + d.icon + ' ' + d.label + '</span>' +
      '<span class="tag tag-topic">' + n + ' ' + t.itemName + (n === 1 ? '' : 's') + '</span>' +
      '</div>' +
      '<p class="share-how">' + esc(howTo(game.type)) + '</p>' +
      '<button type="button" class="btn btn-primary btn-xl share-play" id="sharePlay">▶ Play</button>' +
      '</div>' +
      '</section>';
    var btn = container.querySelector('#sharePlay');
    function play() {
      BP.Player.open(game, { shared: true, onClose: function () { btn.focus(); } });
    }
    btn.addEventListener('click', play);
    btn.focus();
  }

  function howTo(type) {
    if (type === 'quiz') return 'Read each question and tap the right answer out of four.';
    if (type === 'match') return 'Tap a card on the left, then tap the card that matches it on the right.';
    return 'Look at the clue or picture, then type the word with the correct spelling.';
  }

  function message(container, icon, title, text) {
    container.innerHTML = '<div class="empty"><div class="empty-ico" aria-hidden="true">' + icon + '</div><h1>' + esc(title) + '</h1><p>' + esc(text) + '</p></div>';
  }

  BP.PlayOnly = { show: show, message: message };
})();
