/* BrightPlay – share a game by link (play-only) */
(function () {
  var UI = BP.UI, esc = UI.esc;

  /* ---------- encoding: game -> compact text that fits in a link ---------- */
  function b64urlFromBytes(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function bytesFromB64url(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    var bin = atob(str), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function pipe(bytes, Stream) {
    var stream = new Blob([bytes]).stream().pipeThrough(new Stream('deflate-raw'));
    return new Response(stream).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  var canZip = typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';

  /* The playable part of a game only: no scores, no ids, no uploaded photos (too big for a link) */
  function playable(game, keepImages) {
    var g = BP.Store.normalise(BP.Store.clone(game));
    var out = { type: g.type, title: g.title, description: g.description, subject: g.subject, topic: g.topic, difficulty: g.difficulty, icon: g.icon, color: g.color, settings: g.settings, items: g.items };
    if (!keepImages) out.items.forEach(function (it) { it.image = ''; });
    return out;
  }
  function hasPhotos(game) { return game.items.some(function (it) { return !!it.image; }); }

  function encode(game) {
    var bytes = new TextEncoder().encode(JSON.stringify(playable(game, false)));
    if (!canZip) return Promise.resolve('j.' + b64urlFromBytes(bytes));
    return pipe(bytes, CompressionStream).then(function (z) { return 'z.' + b64urlFromBytes(z); });
  }

  function decode(code) {
    return Promise.resolve().then(function () {
      var m = /^([zj])\.([A-Za-z0-9_-]+)$/.exec(String(code || '').trim());
      if (!m) throw new Error('bad');
      var bytes = bytesFromB64url(m[2]);
      if (m[1] === 'j') return bytes;
      if (!canZip) throw new Error('This browser is too old to open game links. Please update it and try again.');
      return pipe(bytes, DecompressionStream);
    }).then(function (bytes) {
      var raw = JSON.parse(new TextDecoder().decode(bytes));
      if (!BP.Store.isValidGame(raw)) throw new Error('bad');
      var g = BP.Store.normalise(raw);
      g.id = '';
      if (!g.items.length) throw new Error('bad');
      return g;
    }).catch(function (e) {
      if (e && e.message && e.message !== 'bad' && /browser/.test(e.message)) throw e;
      throw new Error('This game link is broken or incomplete. Ask for the link again and make sure you copy all of it.');
    });
  }

  /* ---------- providers: how a link is made ---------- */
  // Default (the website): everything is packed into the link itself, so no server is needed.
  var provider = {
    photos: false,
    create: function (game) {
      return encode(game).then(function (code) {
        var base = location.href.split('#')[0].replace(/[^/]*$/, '');
        return { url: base + 'play.html#' + code };
      });
    }
  };

  /* ---------- the Share dialog ---------- */
  function share(game) {
    UI.modal({
      title: 'Share "' + game.title + '"', icon: '🔗',
      message: 'Making your link…',
      buttons: [{ label: 'Close', value: false, cls: 'btn-light' }],
      onOpen: function (w) {
        provider.create(game).then(function (res) {
          var url = res.url;
          var notes = ['People who open this link can play this game only. They cannot see your other games or make changes.'];
          if (!provider.photos && hasPhotos(game)) notes.push('Uploaded photos are not included in links. Emoji pictures are.');
          notes.push(provider.updates ? 'If you edit the game, tap Share again to update what the link shows.' : 'If you edit the game later, share it again to get a new link.');
          if (res.note) notes.push(res.note);
          var p = w.querySelector('.modal p');
          if (p) p.remove();
          var box = document.createElement('div');
          box.className = 'share-box';
          box.innerHTML =
            '<label class="sr-only" for="shareLink">Game link</label>' +
            '<input id="shareLink" class="share-link" type="text" readonly value="' + esc(url) + '">' +
            '<div class="share-actions">' +
            '<button type="button" class="btn btn-primary" id="shareCopy">📋 Copy link</button>' +
            (navigator.share && !provider.noNativeShare ? '<button type="button" class="btn btn-secondary" id="shareSend">📤 Send…</button>' : '') +
            '</div>' +
            '<ul class="share-notes">' + notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>';
          w.querySelector('.modal-actions').before(box);
          var input = box.querySelector('#shareLink');
          input.addEventListener('focus', function () { input.select(); });
          box.querySelector('#shareCopy').addEventListener('click', function () {
            var done = function () { UI.toast('Link copied ✅', 'good'); };
            try {
              navigator.clipboard.writeText(url).then(done, function () { input.select(); try { document.execCommand('copy'); done(); } catch (e) { UI.toast('Select the link and copy it'); } });
            } catch (e) { input.select(); try { document.execCommand('copy'); done(); } catch (e2) { UI.toast('Select the link and copy it'); } }
          });
          var send = box.querySelector('#shareSend');
          if (send) send.addEventListener('click', function () {
            navigator.share({ title: game.title + ' – BrightPlay', text: 'Play "' + game.title + '" on BrightPlay!', url: url }).catch(function () { /* cancelled */ });
          });
        }).catch(function (err) {
          var p = w.querySelector('.modal p');
          if (p) p.textContent = (err && err.message) || 'The link could not be made. Please try again.';
        });
      }
    });
  }

  BP.Share = {
    share: share,
    encode: encode,
    decode: decode,
    playable: playable,
    setProvider: function (p) { provider = p; }
  };
})();
