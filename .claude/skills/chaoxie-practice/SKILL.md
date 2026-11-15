---
name: chaoxie-practice
description: Turn a child's Chinese 抄写 (copy-writing) or 生字/词语 homework into an interactive 描红 handwriting practice page on the iPad. Each word gets a stroke-order animation, one tracing pass, then is written N times without the outline, with strict stroke-order checking, then a 听写 dictation and a 错字本 mistake book. Use this whenever the user shares a photo or list of Chinese words to copy, practise or memorise (抄写, 描红, 生字表, 词语表, 听写 list, 默写, 写字 homework, "help my kid practise writing these characters"), even if they don't say 抄写 or ask for a page explicitly.
---

# 抄写 practice page

Builds a page where a child practises writing each word of a list on a tablet with a finger:
watch the stroke order → trace once (描红) → write it `repeats` times on their own (抄写)
→ optional 听写 of the whole list → characters written with 2+ wrong strokes go into a 错字本
for extra practice. Every line has pinyin (toggle) and read-aloud; English hints stay hidden behind a `?`.
Progress saves on the device, and to the viewer's private store when it runs as a claude.ai artifact.

Defaults this family chose: **trace 1 + write 3**, **dictation on**, **mistake book on**, and
**a new artifact link for each list**.

## 1. Get the words

Usually the user sends a **photo of the homework** (抄写本, worksheet, 生字表, a teacher's list in a
chat app). Read it carefully:

- Take the words in the order they appear. Keep multi-character words together (观察, not 观 + 察);
  single 生字 are fine as one-character words.
- If the sheet prints pinyin, copy it into `py` for that word. It is the teacher's reading and settles
  polyphones (长 cháng/zhǎng, 量 liáng/liàng, 得 de/dé) better than the automatic pinyin.
- If the sheet says how many times to copy (抄写三遍, 每个写5次), use that as `repeats`. Otherwise use 3.
- Skip instructions, page numbers, names, dates and example sentences that are not part of the list.
- Use the lesson heading (第3课 小蝌蚪找妈妈, 单元二 词语) for the title and subtitle when there is one.

**Handwriting, blurry or covered words.** A child who practises the wrong character learns the wrong
character, so a misread costs more than a question.
- If a character is covered or unclear but the sheet itself settles it (its printed pinyin, the lesson
  title, the same word elsewhere on the page), build with it and say plainly in your reply which
  character you filled in and from what, so the parent can correct it.
- If nothing on the sheet settles it, list the words you read with the doubtful ones marked and ask
  before building.
- When everything is clear, build straight away and show the word list in your reply so the parent
  can spot a slip.

If the user types the words, or names a textbook lesson you can read, use those instead.

## 2. Write the spec

Write a small JSON file (in the scratchpad or a temp folder, not the user's project):

```json
{
  "title": "抄写 · 第3课",
  "subtitle": "三年级华文 · 小蝌蚪找妈妈",
  "repeats": 3,
  "dictation": true,
  "words": [
    {"w": "观察", "py": "guān chá", "en": "observe"},
    {"w": "测量", "en": "measure"}
  ]
}
```

- `title`: a short name that tells lists apart in the gallery, e.g. `抄写 · 第3课` or `抄写 · 11月15日`.
- `en`: a 1–3 word English gloss for each word. The child reads English more easily than Chinese,
  so the hidden hint helps when they are stuck. Keep it short and child-friendly.
- Plain strings work too: `"words": ["观察", "测量"]`.

## 3. Build the page

```bash
python3 <skill-dir>/scripts/build_page.py --spec spec.json --out <out-dir> --standalone
```

It fetches stroke-order data for just these characters (jsDelivr, falling back to the npm package),
bundles everything, and prints a JSON summary with `page`, `files`, `standalone` and
`missing_characters`. A word whose characters have no stroke data is left out of the page, because the
writing pad cannot draw it; if `missing_characters` is not empty, tell the user which words were
dropped (rare: very unusual characters or a misread).

## 4. Publish

**With the Artifact tool** (claude.ai / Claude Code with artifacts), publish the built page as its own
artifact. A new list gets a new artifact, so pick a new `file_path` each time:

- `file_path`: the `page` from the summary (`<out-dir>/index.html`)
- `files`: the `files` map from the summary, as given (published path → local path)
- `capabilities`: `{"db": {}, "user": {}}`, which lets progress follow the child across devices
- `icon`: `writing`; `description`: one sentence such as "抄写 practice for 第3课: 8 words, trace once then write 3 times."

To fix a word in a list that was already published, rebuild into the same `<out-dir>` and publish the
same `file_path` again (or pass the artifact's `url` from a later conversation). The link stays the same.

**Without the Artifact tool**, send `standalone.html` as a file instead. It is one self-contained page
that also works offline once opened.

## 5. Reply

Keep it short and parent-friendly:
- the link (or the file),
- the words you used, in order, with any you were unsure of or had to drop,
- one line on what the child does: 描红 once, write each word 3 times, then 听写; wrong characters go to the 错字本.
- If the artifact is private and the child signs in with a different account, say it needs sharing from
  the page's Share menu.

## How the page behaves (for answering questions)

- **Strict stroke order**: a stroke out of order or in the wrong direction is a mistake. After 1 miss
  when tracing, 2 when copying, and 3 in dictation, the next stroke flashes as a hint.
- **👀 看笔顺** replays the animation (costs 2 mistakes outside tracing); **🔁 重写** restarts the character.
- **Scoring**: per written character, 0–1 mistakes = full marks, 2–3 = half; stars at 90% / 60%.
- **错字本**: any character written with 2+ mistakes (copying or dictation). Writing it with ≤1 mistake
  in 练习错字 removes it.
- Settings (⚙️): pinyin, sound, auto read-aloud, and a tap-twice reset.
- Read-aloud uses the device's own Chinese voice. On iPad: Settings → Accessibility → Spoken Content →
  Voices → Chinese (Tingting) for the clearest voice.

## Files

- `scripts/build_page.py`: builds the page from a spec
- `assets/chaoxie.js`, `assets/chaoxie.css`: the page (vanilla JS, no build step)
- `assets/lib/`: Hanzi Writer (MIT), pinyin-pro (MIT), and the Arphic licence for the stroke data
