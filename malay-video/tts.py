"""Generate narration WAVs for every scene with Google AI Studio (Gemini) TTS.

Key: env GEMINI_API_KEY, or a network secret injected by the proxy (header x-goog-api-key).
Usage: python3 tts.py [scene_id ...]
"""
import base64, json, os, sys, time, wave, urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.environ.get("TTS_MODEL", "gemini-2.5-flash-preview-tts")
VOICE = os.environ.get("TTS_VOICE", "Leda")  # youthful, bright
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"

STYLE = ("Read this aloud as a warm, cheerful, playful children's TV host talking to a "
         "9-year-old. Speak English clearly at a relaxed pace. Pronounce every Malay word "
         "with a natural Malaysian Malay accent, and when a word is broken into syllables, "
         "say each syllable slowly with a short pause between them. Text:\n\n")


def tts(text, out_path):
    body = {
        "contents": [{"parts": [{"text": STYLE + text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}},
        },
    }
    headers = {"Content-Type": "application/json"}
    key = os.environ.get("GEMINI_API_KEY")
    headers["x-goog-api-key"] = key or "proxy-injected"
    req = urllib.request.Request(URL, data=json.dumps(body).encode(), headers=headers)
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                data = json.load(r)
            break
        except urllib.error.HTTPError as e:
            msg = e.read().decode()[:400]
            if e.code in (429, 500, 503) and attempt < 4:
                time.sleep(15 * (attempt + 1)); continue
            raise SystemExit(f"TTS failed {e.code}: {msg}")
    b64 = data["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
    pcm = base64.b64decode(b64)
    with wave.open(out_path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm)
    print("ok", os.path.basename(out_path), round(len(pcm) / 48000, 1), "s")


def lines():
    d = json.load(open(os.path.join(HERE, "script.json")))
    out = {s["id"]: s["say"] for s in d["scenes"]}
    out["quiz_intro"] = "Quiz time! Look at the picture and shout out the Malay word. Ready?"
    out["quiz_ask"] = "What's the Malay word?"
    words = {s["id"]: s for s in d["scenes"]}
    for q in d["quiz"]:
        out["ans_" + q] = f"{words[q]['word']}! {words[q]['meaning']}!"
    return out


if __name__ == "__main__":
    os.makedirs(os.path.join(HERE, "audio"), exist_ok=True)
    todo = lines()
    only = sys.argv[1:]
    for sid, text in todo.items():
        if only and sid not in only:
            continue
        p = os.path.join(HERE, "audio", sid + ".wav")
        if os.path.exists(p) and not only:
            continue
        tts(text, p)
