# Aquarium World

A pixel-art fishing RPG that runs in the browser. Open `index.html` in any modern browser; there is no build step and nothing to install.

## Story / loop
1. **Choose your angler**: a boy or a girl, then name them.
2. **Create your world**: name it, then pick a theme (Kelp Meadow, Coral Isle, Moonlit Bay, Sakura Grove) and a flag color.
3. **Aquarium World city**: Mayor Finn gives you **1,000 AC** (Aquarium Credits). You walk the town top-down and talk to the NPCs for tips.
   - **Bait & Tackle**: rods and bait
   - **Tank Emporium**: aquariums, decorations and home upgrades for your world
   - **Fish Market**: sell your catch (the *Fish of the Day* pays x1.5)
   - **Angler Outfitters**: clothes (focus), armor (stamina) and weapons (power)
   - **Prize Wheel** (plaza): 100 AC per spin, with a 1,000 AC jackpot and a Lucky Charm
   - **Home Portal** (north) takes you back to your world. The **South Gate** leads to the lakes.
4. **Lakes**: Willow Pond (Lv 1), Crystal Lake (Lv 5), Misty Marsh (Lv 10) and Moonfall Lake (Lv 15). Each has 4 species plus one rare fish.
5. **Your world**: put fish into aquariums. Each fishing trip counts as one day, and visitors pay ticket money every day based on the fish on display, the tank type, your decorations and your home.

## Fishing
- **Cast**: press A (or tap the screen) to start the power meter, then again to cast. A longer cast reaches deeper water, where fish are bigger and rare fish are more likely.
- **Wait**: don't react to *nibbles*. If you press too early, the fish gets spooked.
- **Bite**: when **!** appears, press A. At Willow Pond and Crystal Lake you have 4-5 seconds; at Misty Marsh and Moonfall Lake about 3 seconds. The small bar under the **!** shows the time left.
- **Reel**: tap A to make the green bar hop up (holding lifts it gently) and keep the fish inside it. The catch meter fills while the fish is in the bar and drains slowly while it is outside.
- How hard a catch is depends on the fish's difficulty, your level, your rod (power and bar size), your gear stats and your bait. Better bait brings faster bites, bigger fish and more rares.

## Controls
| Action | Keyboard | Touch |
|---|---|---|
| Move | Arrows / WASD | D-pad |
| Confirm / interact / reel | Z, Enter, Space | A |
| Cancel (hold to run) | X, Backspace, Shift | B |
| Menu (save, items, equip, warp home) | Esc, M, Tab | MENU |

On phones and tablets you can also tap the game screen directly: tap any menu item, tap a character or lake to pick it (tap again to confirm), tap the screen to advance dialog and to cast and reel, and tap the name box to type with the phone keyboard. The d-pad works by sliding your finger between arrows.

### Play from a single downloaded file
`dist/aquarium-world.html` is the whole game in one file, built with `python3 build-standalone.py`. Copy it to a device and open it in a browser; it needs no internet or server, and each device keeps its own saves.
- **PC/Mac:** double-click the file (Chrome, Edge, Firefox or Safari). To update, replace the file with the new one; saves stay in the browser.
- **Android:** open the file from the Files app in Chrome. If the title screen says *Saving is blocked here*, that browser won't save for local files; use **Backup** to keep your progress in a save file.
- **iPhone/iPad:** Apple doesn't let downloaded web pages run games from the Files app. Use a hosted link instead (below).

### Install it as an app (independent save on every device)
The game is hosted on **Cloudflare Pages**, which gives it a fixed web address and republishes it on every push. One-time setup in the Cloudflare dashboard:
1. **Workers & Pages → Create → Pages → Connect to Git**, then authorize GitHub and pick `claude-games`.
2. Set **Production branch** to `main` (or the branch you deploy from).
3. Leave **Framework preset** at *None*. Set **Build command** to `bash cloudflare-build.sh` and **Build output directory** to `aquarium-world`.
4. **Save and Deploy.** The game is then live at `https://<project-name>.pages.dev`.

Always share the production `pages.dev` address. Preview deployments of other branches get different addresses, and each address keeps its own saves.

Once hosted, it works as an installable app:
- **iPhone/iPad:** open the link in Safari, tap Share, then *Add to Home Screen*.
- **Android:** open the link in Chrome, then choose *Install app* or *Add to Home screen* from the menu.

The app runs full screen, works offline once it has loaded, and updates itself in the background; reopen it after an update to get the new version. Each device keeps its own saves in its own storage, so devices never affect each other, and updates never touch saves.

On iPhone, an app added to the Home Screen has separate storage from Safari. To bring a game you started in Safari, use **Backup** to save it to a file, then load that file in the Home Screen app.

### Backup (save files)
**Backup** on the title screen saves any slot to a `.json` file (on phones this opens the share sheet, so you can choose *Save to Files*) and loads a file back into any slot. Use it to keep a safe copy or to move a game to another device.

### Saving
There are **3 save slots**. From the title screen, *Continue* loads your most recent save, *Load Game* lets you choose a slot, and *New Game* asks which slot to start in, checking first before it replaces a slot that's in use. The game saves automatically every time you move between areas (city, home, the lake map, a lake) and when you enter or leave a shop. A small "Saved" badge flashes in the corner when it does. You can also save to any slot from the menu, or rest in your house.

When the game runs as a claude.ai artifact, each slot is stored in your claude.ai account (the artifact's private per-player database), so saves survive page updates, cleared browser data and switching devices. A copy is also kept in the browser's localStorage, which is all the plain `index.html` file uses. Saves from older versions of the game move into Slot 1 automatically.

## Code layout
- `js/engine.js`: canvas, bitmap font, input and window drawing
- `js/audio.js`: 16-bit style synth (instruments, reverb and echo, drums), the arranged songs and sound effects
- `js/data.js`: rods, bait, gear, tanks, decorations, fish, lakes, save state
- `js/art.js`: procedural pixel art with 16-bit shading and coloured outlines (characters, tiles, buildings, fish, tanks)
- `js/ui.js`: menus, dialogs, shops and the prize wheel
- `js/field.js`: the overhead city and home world, NPCs
- `js/fishing.js`: the lake map, gear select and the fishing minigame (layered lakes with perspective-scrolling water)
- `js/main.js`: title, character select, world creation and the main loop
