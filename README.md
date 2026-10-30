# ⭐ BrightPlay – Fun Learning Games

BrightPlay is a colourful learning-games web app, similar in spirit to Wordwall. You can play and create three kinds of games:

| Game | What the player does |
|---|---|
| ❓ **Quiz** | Answers multiple-choice questions with four options. Each answer is marked right or wrong straight away, the score and streak are tracked, and a results page lists every answer. |
| 🧩 **Matching Pairs** | Taps a word or picture, then taps its match. The game times the player and counts mistakes and first-try matches. |
| 🔤 **Spelling** | Reads a clue or looks at a picture, then types the word. The player gets two tries plus optional hints and a “Hear the word” button, and the correct spelling is always shown at the end. |

It is a plain static website (HTML, CSS and JavaScript). There is **no server, no account and no build step**. Games are saved in the browser on your device, and the app works offline once it has been opened.

---

## ✨ Features

- **Home page**: bright hero area, game-type tiles, subject shortcuts and recently added games.
- **Game library**: colourful cards with a search box and filters for **subject, topic, game type and difficulty**. You can sort by newest, A–Z, subject (shown in groups) or difficulty.
- **9 sample games** across Maths, Science, Geography and English, with 3 of each game type.
- **Game creator**:
  - title, description, subject, topic, difficulty, card icon and card colour
  - add, duplicate, reorder and delete questions, pairs or words
  - pictures from **emoji** or **your own photos** (photos are resized automatically)
  - **Quick add from a list** for matching and spelling games, e.g. `cat = kitten`, one per line
  - options to shuffle questions or answers, show the number of letters, and allow “Hear the word”
  - **Preview** before saving, plus a warning if you try to leave with unsaved changes
- **Edit, duplicate, export or delete** any game from its card (✏️ or ⋯ buttons).
- **Scores**: best stars and number of plays appear on each card, with a 🏅 badge for a new personal best.
- **Backup page**: export all games or chosen games to a `.json` file, import a backup (drop a file on desktop), restore the sample games, or delete everything.
- Large touch targets, sound effects (with a mute button), confetti and a layout that adapts to iPad, iPhone and desktop.
- Installable as a home-screen app with its own icon, and works offline through a service worker.

---

## 📁 Project files

```
index.html              The app page
manifest.webmanifest    App name, colours and icons (for installing)
sw.js                   Service worker (offline support)
netlify.toml            Optional Netlify settings (no build needed)
css/styles.css          All styling
js/data.js              Subjects, game types and the sample games
js/storage.js           Saving to local storage, import and export
js/ui.js                Pop-ups, messages, sounds, confetti, file helpers
js/games.js             The Quiz, Matching and Spelling games
js/editor.js            The game creator / editor
js/app.js               Pages and navigation
icons/                  App icons (SVG + PNG, including the iPad/iPhone icon)
tests/smoke-test.js     Optional automated test (developers only)
```

---

## 🚀 Publishing the website (free) with Netlify

### Option A: drag and drop (easiest, no account setup beyond sign-up)
1. Unzip **BrightPlay.zip**. You will get a folder called `BrightPlay`.
2. Go to **https://app.netlify.com/drop** and sign up or log in. It is free.
3. Drag the whole **`BrightPlay` folder** onto the page.
4. After a few seconds Netlify shows a web address such as `https://shiny-star-12345.netlify.app`. Your app is live, and it uses **HTTPS** automatically.
5. Optional: in **Site configuration → Change site name** you can pick a friendlier address, e.g. `https://our-brightplay.netlify.app`.

To update the site later, open your site in Netlify, go to **Deploys**, and drag the updated folder onto the deploy area.

### Option B: from GitHub
1. Put these files in a GitHub repository.
2. In Netlify choose **Add new site → Import an existing project**, then pick the repository.
3. Leave the build command **empty** and set the publish directory to `.` (the `netlify.toml` file already does this). Then deploy.

### Other hosts
Any static host works: GitHub Pages, Cloudflare Pages, Vercel, or your school’s web space. Upload all the files and keep the folder structure. HTTPS is needed for offline mode and installing, and all of these hosts provide it.

> **Tip:** you can also open `index.html` straight from your computer to try it. Everything works except offline mode and installing, which need a real `https://` address.

---

## 📱 Using BrightPlay on an iPad (or iPhone)

1. Open **Safari** on the iPad and go to your Netlify address.
2. Tap the **Share** button (the square with an arrow pointing up). On iPadOS it is at the top right, next to the address bar.
3. Scroll down and tap **Add to Home Screen**.
4. Keep the name **BrightPlay** and tap **Add**.
5. A ⭐ **BrightPlay** icon appears on the Home Screen. Tap it to open the app full-screen, just like a normal app. It also works without internet once it has been opened once.

### Important things to know about saving on iPad
- Games are stored **on that device, inside that browser**. A game made on the iPad will not show up on a different iPad or computer until you **export and import** it.
- The Home Screen app and Safari keep **separate** storage. Choose one and stick with it. We recommend the Home Screen app.
- Apple may clear website data for sites you haven’t opened for several weeks. **Export a backup regularly** (Backup page → *Export all games*), especially after making new games.

### Exporting on iPad
Tap **Backup → ⬇️ Export all games**. The share sheet opens, so choose **Save to Files** (e.g. iCloud Drive), or AirDrop or email it to yourself.

### Importing on iPad
Tap **Backup → ⬆️ Choose backup file**, then pick the `.json` file from the Files app. If a game in the file is already on the device (same game ID), it is updated. New games are added, so nothing is duplicated.

---

## 🧑‍🏫 Making a game

1. Tap **Create** and choose **Quiz**, **Matching Pairs** or **Spelling**.
2. Fill in the **title**, **description**, **subject**, **topic** and **difficulty**, and choose an icon and colour.
3. Add your content:
   - **Quiz:** type the question and four answers, then tap the **✓** box next to the correct answer.
   - **Matching:** type a word (and/or add an emoji or photo) and its matching meaning. To add lots at once, use **📋 Quick add from a list** with `word = meaning` on each line.
   - **Spelling:** type the correct spelling and a clue and/or picture. Spaces are allowed (e.g. *ice cream*). Answers are not case-sensitive.
4. Tap **▶️ Preview** to try it, then **💾 Save game**. It now appears in the Library.

To change a game later, tap ✏️ on its card. To copy, export or delete it, tap ⋯.

---

## 🔧 For developers

- No frameworks and no build. Plain ES5-compatible JavaScript, so it runs on older iPads too.
- Data is kept in `localStorage`:
  - `brightplay.games.v1`: an array of games
  - `brightplay.scores.v1`: best scores
  - `brightplay.prefs.v1`: settings
- Backup file format:
  ```json
  { "app": "BrightPlay", "format": "brightplay-backup", "version": 1, "exportedAt": "…", "games": [ { "id": "…", "type": "quiz|match|spell", "title": "…", "items": [ … ] } ] }
  ```
- **After changing any file, raise `CACHE_VERSION` in `sw.js`** so installed copies download the update. They update the next time the app is opened online.
- Automated test, which covers all three games, creating, editing, preview, saving, deleting, importing and exporting, mobile layouts and offline mode:
  ```bash
  python3 -m http.server 8765
  npm i -D playwright && npx playwright install chromium
  node tests/smoke-test.js http://127.0.0.1:8765/
  ```
