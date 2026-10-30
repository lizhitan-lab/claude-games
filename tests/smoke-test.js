/*
  BrightPlay end-to-end smoke test (optional – not needed to run the app).
  Usage:
    1. Serve the folder:  python3 -m http.server 8765
    2. Run:               node tests/smoke-test.js http://127.0.0.1:8765/ [screenshotDir]
  Requires Playwright (npm i -D playwright && npx playwright install chromium).
*/
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

const BASE = process.argv[2] || 'http://127.0.0.1:8765/';
const SHOTS = process.argv[3] || '';
let failures = 0;
function ok(cond, msg) {
  if (cond) console.log('  ✔ ' + msg);
  else { failures++; console.log('  ✘ ' + msg); }
}
async function shot(page, name) { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: false }); }

async function getGame(page, id) {
  return page.evaluate((id) => JSON.parse(localStorage.getItem('brightplay.games.v1')).find((g) => g.id === id), id);
}

async function playQuiz(page, id, wrongFirst) {
  const g = await getGame(page, id);
  for (let i = 0; i < g.items.length; i++) {
    const q = (await page.textContent('.question')).trim();
    const item = g.items.find((it) => it.q === q);
    const answer = wrongFirst && i === 0 ? item.answers[(item.correct + 1) % 4] : item.answers[item.correct];
    await page.click(`.answer:has(.answer-text:text-is("${answer}"))`);
    await page.waitForSelector('#qFeedback.show');
    await page.click('#qFeedback [data-act="next"]');
  }
  await page.waitForSelector('.results');
}

async function playMatch(page, withMistake) {
  if (withMistake) {
    const l = page.locator('.tile-left').first();
    const lid = await l.getAttribute('data-id');
    await l.click();
    await page.locator(`.tile-right:not([data-id="${lid}"])`).first().click();
    await page.waitForTimeout(700);
  }
  const lefts = await page.$$eval('.tile-left:not(.matched)', (els) => els.map((e) => e.dataset.id));
  for (const id of lefts) {
    await page.click(`.tile-left[data-id="${id}"]`);
    await page.click(`.tile-right[data-id="${id}"]`);
  }
  await page.waitForSelector('.results', { timeout: 5000 });
}

async function playSpell(page, id, mode) {
  const g = await getGame(page, id);
  for (let i = 0; i < g.items.length; i++) {
    const clue = (await page.textContent('.spell .question')).trim();
    const item = g.items.find((it) => (it.clue || 'Spell the word!') === clue);
    if (mode === 'mixed' && i === 0) {
      await page.fill('#sInput', 'zzz');
      await page.click('#sForm button[type="submit"]');
      await page.waitForSelector('#sFeedback.show');
      await page.fill('#sInput', 'yyy');
      await page.click('#sForm button[type="submit"]');
    } else if (mode === 'mixed' && i === 1) {
      await page.click('[data-act="hint"]');
      await page.fill('#sInput', item.word.toUpperCase());
      await page.press('#sInput', 'Enter');
    } else {
      await page.fill('#sInput', item.word);
      await page.press('#sInput', 'Enter');
    }
    await page.waitForSelector('#sFeedback [data-act="next"]');
    await page.click('#sFeedback [data-act="next"]');
  }
  await page.waitForSelector('.results');
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1180, height: 820 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  console.log('Home & library');
  await page.goto(BASE);
  await page.waitForSelector('.hero');
  ok((await page.$$('.type-tile')).length === 3, 'home shows 3 game types');
  await shot(page, 'desktop-home');
  await page.click('[data-nav="library"]');
  await page.waitForSelector('.game-card');
  ok((await page.$$('.game-card')).length === 9, '9 sample games in library');
  await page.fill('#libSearch', 'planet');
  ok((await page.$$('.game-card')).length === 1, 'search "planet" finds 1 game');
  await page.fill('#libSearch', '');
  await page.selectOption('#fSubject', 'English');
  ok((await page.$$('.game-card')).length === 3, 'subject filter English = 3');
  await page.selectOption('#fType', 'spell');
  ok((await page.$$('.game-card')).length === 2, 'English + spelling = 2');
  await page.click('#clearF');
  await page.selectOption('#fDiff', 'hard');
  ok((await page.$$('.game-card')).length === 2, 'difficulty hard = 2');
  await page.selectOption('#fDiff', '');
  await page.selectOption('#fTopic', 'Animals');
  ok((await page.$$('.game-card')).length === 2, 'topic Animals = 2');
  await page.selectOption('#fTopic', '');
  await page.selectOption('#fSort', 'subject');
  ok((await page.$$('.group-title')).length >= 4, 'sort by subject groups games');
  await page.selectOption('#fSort', 'recent');
  await shot(page, 'desktop-library');

  console.log('Quiz game');
  await page.click('.game-card[data-id="sample-planets"] [data-act="play"]');
  await page.waitForSelector('.quiz .answer');
  await shot(page, 'desktop-quiz');
  await playQuiz(page, 'sample-planets', true);
  const qScore = await page.textContent('.results-score .big');
  ok(qScore.trim() === '5 / 6', 'quiz score 5 / 6 after one wrong answer (' + qScore.trim() + ')');
  ok((await page.$$('.review li.bad')).length === 1, 'results review lists 1 wrong answer');
  await shot(page, 'desktop-quiz-results');
  await page.click('[data-act="again"]');
  await page.waitForSelector('.quiz .answer');
  await playQuiz(page, 'sample-planets', false);
  ok((await page.textContent('.results-score .big')).trim() === '6 / 6', 'replay gives 6 / 6');
  ok(!!(await page.$('.badge-best')), 'new personal best shown');
  await page.click('[data-act="exit"]');
  await page.waitForSelector('#player', { state: 'hidden' });
  ok(await page.$eval('.game-card[data-id="sample-planets"] .card-stars', (e) => e.querySelectorAll('.on').length === 3), 'library card shows 3 stars');

  console.log('Matching game');
  await page.click('.game-card[data-id="sample-animal-babies"] [data-act="play"]');
  await page.waitForSelector('.match .tile');
  await playMatch(page, true);
  ok(/1/.test(await page.textContent('.results-stats')), 'matching results show a mistake');
  ok((await page.textContent('.results-score .sub')).includes('6 pairs'), 'matched all 6 pairs');
  await shot(page, 'desktop-match-results');
  await page.click('[data-act="exit"]');

  console.log('Spelling game');
  await page.click('.game-card[data-id="sample-fruit-spelling"] [data-act="play"]');
  await page.waitForSelector('#sInput');
  await shot(page, 'desktop-spell');
  await playSpell(page, 'sample-fruit-spelling', 'mixed');
  const sScore = (await page.textContent('.results-score .big')).trim();
  ok(sScore === '5 / 6', 'spelling score 5 / 6 (' + sScore + ')');
  ok((await page.textContent('.review')).includes('yyy'), 'spelling review shows wrong attempt');
  await page.click('[data-act="exit"]');

  console.log('Create a quiz');
  await page.goto(BASE + '#/create');
  await page.click('a[href="#/edit/new?type=quiz"]');
  await page.waitForSelector('.editor');
  await page.click('[data-act="save"]');
  await page.waitForSelector('.error-list');
  ok((await page.textContent('.error-list')).includes('title'), 'validation asks for a title');
  await page.click('.modal .btn-primary');
  await page.fill('#fTitle', 'Test Colours Quiz');
  await page.fill('#fDesc', 'A quiz made by the smoke test');
  await page.selectOption('[data-g="subject"]', 'Art & Music');
  await page.fill('[data-g="topic"]', 'Colours');
  await page.click('[data-diff="medium"]');
  await page.click('[data-icon="🌈"]');
  await page.fill('textarea[data-i="0"][data-f="q"]', 'What colour is the sky?');
  for (const [i, a] of ['Green', 'Blue', 'Red', 'Purple'].entries()) await page.fill(`input[data-i="0"][data-a="${i}"]`, a);
  await page.click('[data-act="correct"][data-i="0"][data-a="1"]');
  await page.click('[data-act="add"]');
  await page.fill('textarea[data-i="1"][data-f="q"]', 'What colour is grass?');
  for (const [i, a] of ['Green', 'Pink', 'Black', 'White'].entries()) await page.fill(`input[data-i="1"][data-a="${i}"]`, a);
  await page.fill('input[data-i="1"][data-f="emoji"]', '🌱');
  // Upload a picture for question 2
  const png = path.join(os.tmpdir(), 'bp-test.png');
  fs.writeFileSync(png, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR4nGP8z8DwnwEJMDEgASwcAKQGAgFQ0KnfAAAAAElFTkSuQmCC', 'base64'));
  await page.setInputFiles('input[data-upload][data-i="1"]', png);
  await page.waitForSelector('[data-item="1"] img.pic-thumb');
  ok(true, 'picture upload shows thumbnail');
  await shot(page, 'desktop-editor');
  await page.click('[data-act="preview"]');
  await page.waitForSelector('.badge-preview');
  ok(true, 'preview opens');
  const previewQ = (await page.textContent('.question')).trim();
  await page.click(`.answer:has(.answer-text:text-is("${previewQ.includes('sky') ? 'Blue' : 'Green'}"))`);
  ok(await page.$eval('#qFeedback', (e) => e.classList.contains('good')), 'preview: correct answer marked correct');
  await page.click('.player-close');
  await page.waitForSelector('#player', { state: 'hidden' });
  ok(await page.inputValue('#fTitle') === 'Test Colours Quiz', 'editor keeps data after preview');
  // Dirty guard
  await page.click('[data-nav="home"]');
  await page.waitForSelector('.modal');
  ok((await page.textContent('.modal h2')).includes('Leave without saving'), 'unsaved-changes warning');
  await page.click('.modal .btn-light');
  ok(await page.$('.editor') !== null, 'stayed in editor after cancel');
  await page.click('[data-act="save"]');
  await page.waitForSelector('.modal h2:text("Game saved!")');
  await page.click('.modal .btn:text("Library")');
  await page.waitForSelector('.game-card');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('brightplay.games.v1')).find((g) => g.title === 'Test Colours Quiz'));
  ok(saved && saved.items.length === 2 && saved.items[0].correct === 1 && saved.difficulty === 'medium' && saved.subject === 'Art & Music' && saved.icon === '🌈', 'quiz saved to localStorage with all fields');
  ok(saved && /^data:image\/jpeg/.test(saved.items[1].image), 'uploaded picture saved');

  console.log('Persistence after reload');
  await page.reload();
  await page.waitForSelector('.game-card');
  ok(!!(await page.$(`.game-card[data-id="${saved.id}"]`)), 'saved game still there after reload');

  console.log('Edit game');
  await page.click(`.game-card[data-id="${saved.id}"] [data-act="edit"]`);
  await page.waitForSelector('.editor');
  await page.fill('#fTitle', 'Test Colours Quiz – edited');
  await page.click('[data-act="dup"][data-i="0"]');
  await page.click('[data-act="del"][data-i="2"]');
  await page.click('.modal .btn-danger');
  await page.click('[data-act="save"]');
  await page.waitForSelector('.modal h2:text("Game saved!")');
  await page.click('.modal .btn:text("Play now")');
  await page.waitForSelector('.quiz');
  const edited = await getGame(page, saved.id);
  ok(edited.title.endsWith('edited') && edited.items.length === 2 && edited.items[1].q === 'What colour is the sky?', 'edit (rename, duplicate, delete question) saved');
  await playQuiz(page, saved.id, false);
  ok((await page.textContent('.results-score .big')).trim() === '2 / 2', 'created quiz plays to 2 / 2');
  await page.click('[data-act="exit"]');

  console.log('Create matching game (quick add)');
  await page.goto(BASE + '#/edit/new?type=match');
  await page.waitForSelector('.editor');
  await page.fill('#fTitle', 'Test French Colours');
  await page.click('[data-act="bulk"]');
  await page.fill('#bulkText', 'rouge = red\nbleu = blue\nvert = green\njaune = yellow');
  await page.click('.modal .btn-primary');
  ok((await page.$$('.item-card')).length === 4, 'quick add created 4 pairs (blank rows removed)');
  await page.click('[data-act="save"]');
  await page.waitForSelector('.modal h2:text("Game saved!")');
  await page.click('.modal .btn:text("Play now")');
  await page.waitForSelector('.match .tile');
  await playMatch(page, false);
  ok((await page.textContent('.results-score .big')).trim() === '40 pts', 'matching game perfect score 40 pts');
  await page.click('[data-act="exit"]');

  console.log('Create spelling game');
  await page.goto(BASE + '#/edit/new?type=spell');
  await page.waitForSelector('.editor');
  await page.fill('#fTitle', 'Test Spelling');
  await page.fill('input[data-i="0"][data-f="word"]', 'rainbow');
  await page.fill('input[data-i="0"][data-f="clue"]', 'Colours in the sky after rain');
  await page.fill('input[data-i="1"][data-f="word"]', 'ice cream');
  await page.fill('input[data-i="1"][data-f="emoji"]', '🍦');
  await page.click('[data-act="save"]');
  await page.waitForSelector('.modal h2:text("Game saved!")');
  await page.click('.modal .btn:text("Play now")');
  await page.waitForSelector('#sInput');
  const spellId = await page.evaluate(() => JSON.parse(localStorage.getItem('brightplay.games.v1')).find((g) => g.title === 'Test Spelling').id);
  await playSpell(page, spellId, 'perfect');
  ok((await page.textContent('.results-score .big')).trim() === '2 / 2', 'created spelling game plays to 2 / 2 (multi-word answer)');
  await page.click('[data-act="exit"]');

  console.log('Export & import');
  await page.goto(BASE + '#/backup');
  await page.waitForSelector('#btnExport');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btnExport')]);
  const file = path.join(os.tmpdir(), 'bp-export.json');
  await dl.saveAs(file);
  const exported = JSON.parse(fs.readFileSync(file, 'utf8'));
  ok(exported.app === 'BrightPlay' && exported.games.length === 12, 'export contains 12 games (' + exported.games.length + ')');
  // Delete everything, then import
  await page.click('#btnClear');
  await page.click('.modal .btn-danger');
  ok(await page.evaluate(() => JSON.parse(localStorage.getItem('brightplay.games.v1')).length) === 0, 'delete all games works');
  await page.setInputFiles('#importInput', file);
  await page.waitForSelector('.modal h2:text("Import complete!")');
  ok((await page.textContent('.modal p')).includes('12 new'), 'import reports 12 new games');
  await page.click('.modal .btn-primary');
  await page.setInputFiles('#importInput', file);
  await page.waitForSelector('.modal h2:text("Import complete!")');
  ok((await page.textContent('.modal p')).includes('12 updated'), 're-import updates instead of duplicating');
  await page.click('.modal .btn-primary');
  const bad = path.join(os.tmpdir(), 'bp-bad.json');
  fs.writeFileSync(bad, 'not json');
  await page.setInputFiles('#importInput', bad);
  await page.waitForSelector('.modal h2:text("Import failed")');
  ok(true, 'invalid file shows friendly error');
  await page.click('.modal .btn-primary');
  // Single game export via the ⋯ menu
  await page.goto(BASE + '#/library');
  await page.click('.game-card[data-id="sample-shapes"] [data-act="more"]');
  const [dl2] = await Promise.all([page.waitForEvent('download'), page.click('.modal .btn:text("Export")')]);
  const one = JSON.parse(fs.readFileSync(await dl2.path(), 'utf8'));
  ok(one.games.length === 1 && one.games[0].id === 'sample-shapes', 'single-game export');

  console.log('Delete & restore samples');
  await page.click('.game-card[data-id="sample-shapes"] [data-act="more"]');
  await page.click('.modal .btn:text("Delete")');
  await page.click('.modal .btn-danger');
  await page.waitForTimeout(200);
  ok(!(await page.$('.game-card[data-id="sample-shapes"]')), 'game deleted from library');
  await page.goto(BASE + '#/backup');
  await page.click('#btnSamples');
  ok(!!(await getGame(page, 'sample-shapes')), 'restore samples brings it back');

  console.log('Mobile layouts');
  for (const [name, dev] of [['ipad', devices['iPad (gen 7)']], ['iphone', devices['iPhone 13']]]) {
    const ctx = await browser.newContext({ ...dev });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(name + ': ' + e.message));
    await p.goto(BASE);
    await p.waitForSelector('.hero');
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    ok(!overflow, name + ': no horizontal scrolling on home');
    await shot(p, name + '-home');
    await p.goto(BASE + '#/library');
    await p.waitForSelector('.game-card');
    await shot(p, name + '-library');
    await p.tap('.game-card[data-id="sample-times-tables"] [data-act="play"]');
    await p.waitForSelector('.answer');
    await shot(p, name + '-quiz');
    await p.tap('.player-close');
    await p.tap('.modal .btn-primary');
    await p.goto(BASE + '#/play/sample-shapes');
    await p.waitForSelector('.tile');
    await p.tap('.tile-left >> nth=0');
    await shot(p, name + '-match');
    await p.goto(BASE + '#/play/sample-animals-spelling');
    await p.waitForSelector('#sInput');
    await shot(p, name + '-spell');
    await p.goto(BASE + '#/edit/sample-planets');
    await p.waitForSelector('.editor');
    await shot(p, name + '-editor');
    const overflow2 = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    ok(!overflow2, name + ': no horizontal scrolling in editor');
    await ctx.close();
  }

  console.log('Offline (service worker)');
  const swCtx = await browser.newContext();
  const sw = await swCtx.newPage();
  await sw.goto(BASE);
  await sw.evaluate(() => navigator.serviceWorker.ready);
  await sw.reload();
  await sw.waitForSelector('.hero');
  await swCtx.setOffline(true);
  await sw.reload();
  ok(!!(await sw.waitForSelector('.hero', { timeout: 5000 }).catch(() => null)), 'app loads while offline');
  await swCtx.close();

  ok(errors.length === 0, 'no JavaScript errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
  console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed 🎉');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
