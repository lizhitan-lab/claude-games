# 科学技能训练营 · Science Skills Camp

An offline Chinese science + handwriting game for 三年级科学 (KSSR SJKC Year 3), **Chapter 1: 科学技能**.
Designed for iPad first (works on iPhone too). Every Chinese line has pinyin (toggle **pīn**) and can be read aloud (🔊);
a hidden **?** button shows a one-line English hint. Progress is saved automatically on the device.

## Six stations (each = 🎮 science game + ✍️ writing round)

| # | Station | Science skill practised | Words to write |
|---|---------|------------------------|----------------|
| 1 | 📡 技能小雷达 | Spot which of the 6 process skills a child is using | 观察 分类 测量 推断 预测 沟通 |
| 2 | 🧺 分类高手 | Sort fruits by skin / taste / colour; dissolve lab (sand, sugar, coffee, salt, pepper) | 特征 光滑 粗糙 颜色 味道 溶解 |
| 3 | 🕵️ 小侦探 | Observe first, then pick the most sensible inference (⭐⭐⭐ / ⭐⭐) | 经验 空气 天气 原因 表情 现象 |
| 4 | 🔮 预测水晶球 | Predict, then watch the result (handkerchief, ice, black/white cups, P-animal chart, shoe, torch, banana) | 变化 温度 数量 结果 资料 记录 |
| 5 | 📏 测量小能手 | Choose tools, read a ruler (incl. not starting at 0), eye level on a measuring cylinder, stopwatch | 长度 时间 量筒 读数 工具 秒表 |
| 6 | 🧪 小小实验室 | “会渗水的土壤” experiment: step order, fair test, safety, reading results, cleaning & storing | 土壤 渗水 漏斗 手套 清洗 安全 |

Questions marked **考试练习** follow the 课后测试站 exam style.

### Writing round
1. **描红** – trace with stroke-order animation first (strict stroke order is checked)
2. **自己写** – write without the outline (hint after 2 wrong strokes)
3. **听写** – dictation of all 6 words
4. **填空** – write the missing word in a sentence
5. **连词成句** – build a sentence from word tiles (bonus)

Characters written with 2+ wrong strokes go into the **📕 错字本** (mistake book). Writing them well in
“练习错字” removes them. **🏆 听写挑战** is a 12-word dictation that puts mistake-book words first.

## Playing on the iPad / iPhone
The game must be served over **https** once; after that it works offline.
1. Host this folder (e.g. GitHub Pages on a public repo, or any static host).
2. Open it in **Safari** → Share → **Add to Home Screen**.
3. Open it once from the Home Screen while online so it caches; afterwards it works with no internet.

Read-aloud uses the device’s built-in Chinese voice. On iPhone/iPad: Settings → Accessibility → Spoken Content →
Voices → Chinese → download a voice (e.g. Tingting) for the best offline speech.

Local test: `cd science-camp && python3 -m http.server 8000`, then open http://localhost:8000.

## Files
- `index.html`, `style.css`, `app.js` – the game
- `data.js` – all content (questions, words, sentences) — edit here to change words or questions
- `lib/` – [Hanzi Writer](https://hanziwriter.org) (MIT), [pinyin-pro](https://github.com/zh-lx/pinyin-pro) (MIT),
  and stroke data from hanzi-writer-data / Make Me a Hanzi (Arphic Public License, see `lib/ARPHICPL.TXT`)
- `sw.js`, `manifest.webmanifest`, `icons/` – offline install support

When changing any file, bump `VERSION` in `sw.js` so devices pick up the update.
