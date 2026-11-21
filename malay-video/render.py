"""Build the Malay lesson video from img/*.png + audio/*.wav.

python3 render.py            -> out/malay_lesson.mp4
python3 render.py --preview  -> uses silent placeholder audio when a wav is missing
"""
import json, os, subprocess, sys, wave, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 1920, 1080, 30
SR = 44100
PREVIEW = "--preview" in sys.argv
BUILD = os.path.join(HERE, "build"); os.makedirs(BUILD, exist_ok=True)
OUT = os.path.join(HERE, "out"); os.makedirs(OUT, exist_ok=True)
FONT = os.path.join(HERE, "fonts", "Fredoka.ttf")

C_RED, C_INK, C_CREAM, C_YEL, C_TEAL = "#E8452C", "#3B2A1A", "#FFF8E7", "#FFC83D", "#1FA39A"


def font(size, weight="Bold"):
    f = ImageFont.truetype(FONT, size)
    try:
        f.set_variation_by_name(weight)
    except Exception:
        pass
    return f


def fit(draw, text, max_w, size, weight="Bold", min_size=40):
    while size > min_size:
        f = font(size, weight)
        if draw.textlength(text, font=f) <= max_w:
            return f
        size -= 4
    return font(min_size, weight)


def rounded_card(img, box, fill, outline="white", width=8, radius=48, shadow=True):
    x0, y0, x1, y1 = box
    if shadow:
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle((x0 + 8, y0 + 14, x1 + 8, y1 + 14), radius, fill=(0, 0, 0, 90))
        img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)))
    ImageDraw.Draw(img).rounded_rectangle(box, radius, fill=fill, outline=outline, width=width)


def centered(d, cx, y, text, f, fill, stroke=0, stroke_fill="white"):
    w = d.textlength(text, font=f)
    d.text((cx - w / 2, y), text, font=f, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill)


# ---------- overlays (transparent PNG drawn over the zooming picture) ----------

def overlay_word(word, meaning, idx, total, chapter):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    # badge top-left
    rounded_card(im, (40, 36, 470, 120), C_TEAL, radius=42, width=6)
    centered(d, 255, 50, f"New word {idx} / {total}", font(46, "SemiBold"), "white")
    # bottom card
    cw = 1500; x0 = (W - cw) // 2; y0, y1 = 760, 1040
    rounded_card(im, (x0, y0, x0 + cw, y1), C_CREAM, outline=C_YEL, width=10)
    f1 = fit(d, word, cw - 120, 132)
    centered(d, W // 2, y0 + 22, word, f1, C_RED, stroke=4, stroke_fill="white")
    f2 = fit(d, meaning, cw - 120, 64, "Medium", 36)
    centered(d, W // 2, y0 + 190, meaning, f2, C_INK)
    return im


def overlay_title(big, small, band_color=C_RED):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    cw = 1300; x0 = (W - cw) // 2
    rounded_card(im, (x0, 330, x0 + cw, 750), band_color, outline="white", width=12, radius=70)
    centered(d, W // 2, 370, big, fit(d, big, cw - 100, 170), "white", stroke=6, stroke_fill=C_INK)
    centered(d, W // 2, 590, small, fit(d, small, cw - 100, 96, "SemiBold"), C_YEL, stroke=3, stroke_fill=C_INK)
    return im


def overlay_banner(text, sub=None, color=C_TEAL):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    cw = 1250; x0 = (W - cw) // 2
    rounded_card(im, (x0, 40, x0 + cw, 200), color, radius=60, width=10)
    centered(d, W // 2, 58, text, fit(d, text, cw - 80, 110), "white", stroke=4, stroke_fill=C_INK)
    if sub:
        rounded_card(im, (W // 2 - 170, 760, W // 2 + 170, 1010), C_YEL, radius=125, width=10)
        centered(d, W // 2, 770, sub, font(200), C_RED, stroke=5)
    return im


def overlay_recap(words):
    im = Image.new("RGBA", (W, H), (255, 248, 231, 235)); d = ImageDraw.Draw(im)
    centered(d, W // 2, 30, "15 Malay words I learned today!", font(84), C_RED, stroke=3)
    col_w = 900
    for i, (w, m) in enumerate(words):
        col, row = divmod(i, 8)
        x = 70 + col * (col_w + 40); y = 170 + row * 108
        d.rounded_rectangle((x, y, x + col_w, y + 92), 30, fill="white", outline=C_YEL, width=5)
        d.text((x + 24, y + 14), f"{i+1}.", font=font(48), fill=C_TEAL)
        fw = fit(d, w, 430, 50, "Bold", 26)
        d.text((x + 100, y + 16), w, font=fw, fill=C_RED)
        fm = fit(d, m, col_w - 560, 38, "Medium", 22)
        d.text((x + 540, y + 26), m, font=fm, fill=C_INK)
    return im


# ---------- audio ----------

def read_wav(path):
    with wave.open(path) as w:
        sr, n, ch = w.getframerate(), w.getnframes(), w.getnchannels()
        a = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768
    if ch == 2:
        a = a.reshape(-1, 2).mean(1)
    if sr != SR:
        a = np.interp(np.linspace(0, len(a) - 1, int(len(a) * SR / sr)), np.arange(len(a)), a)
    return a


def voice(name, est_text=""):
    p = os.path.join(HERE, "audio", name + ".wav")
    if os.path.exists(p):
        return read_wav(p)
    if not PREVIEW:
        raise SystemExit(f"missing audio/{name}.wav (run tts.py, or use --preview)")
    secs = max(1.5, len(est_text.split()) / 2.4)
    return np.zeros(int(secs * SR), np.float32)


def chime(kind="ding"):
    t = np.linspace(0, 0.9, int(0.9 * SR), False)
    notes = {"ding": [1046.5, 1568.0], "tada": [784, 988, 1175, 1568], "tick": [880]}[kind]
    out = np.zeros_like(t)
    for i, f in enumerate(notes):
        st = int(i * 0.08 * SR)
        tt = t[: len(t) - st]
        out[st:] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 6) * 0.25
    if kind == "tick":
        out = out[: int(0.25 * SR)]
    return out


def music(total_s):
    """Gentle, original ukulele-ish loop in C major pentatonic, 96 bpm."""
    beat = 60 / 96
    prog = [[261.6, 329.6, 392.0], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [196.0, 246.9, 293.7]]
    mel = [523.3, 587.3, 659.3, 784.0, 659.3, 587.3, 523.3, 440.0]
    n = int(total_s * SR); out = np.zeros(n, np.float32)

    def pluck(f, dur, amp):
        t = np.arange(int(dur * SR)) / SR
        return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 4) * amp

    def put(pos, s):
        i = int(pos * SR); j = min(n, i + len(s)); out[i:j] += s[: j - i]

    step = 0; pos = 0.0
    while pos < total_s:
        chord = prog[(step // 8) % 4]
        f = chord[step % 3] if step % 2 == 0 else chord[(step + 1) % 3] * 2
        put(pos, pluck(f, beat * 1.5, 0.12))
        if step % 4 == 0:
            put(pos, pluck(chord[0] / 2, beat * 3, 0.10))
        if step % 16 in (2, 6, 10):
            put(pos, pluck(mel[(step // 2) % 8], beat * 1.2, 0.06))
        step += 1; pos += beat / 2
    return out


# ---------- segments ----------

class Seg:
    def __init__(self, bg, ov, audio, zoom=True):
        self.bg, self.ov, self.audio, self.zoom = bg, ov, audio, zoom


def pad(a, lead=0.5, tail=0.9):
    return np.concatenate([np.zeros(int(lead * SR)), a, np.zeros(int(tail * SR))]).astype(np.float32)


def build_segments():
    d = json.load(open(os.path.join(HERE, "script.json")))
    sc = {s["id"]: s for s in d["scenes"]}
    word_ids = [s["id"] for s in d["scenes"] if s["id"][:2].isdigit() and s["id"] not in ("00_intro", "99_outro")]
    segs = []
    img = lambda i: os.path.join(HERE, "img", i + ".png")
    for s in d["scenes"]:
        sid = s["id"]
        a = voice(sid, s["say"])
        if sid == "00_intro":
            ov = overlay_title("Sang Kancil's", "Malay Adventure!", C_TEAL)
            segs.append(Seg(img(sid), ov, pad(np.concatenate([chime("tada"), np.zeros(int(0.3 * SR))]), 0.2, 1.6)))
            segs.append(Seg(img(sid), None, pad(a)))
        elif sid == "99_outro":
            # quiz first, then recap, then goodbye
            segs += quiz_segments(d, sc, img)
            words = [(sc[w]["word"], sc[w]["meaning"]) for w in word_ids]
            segs.append(Seg(img("99_outro"), overlay_recap(words), pad(chime("tada"), 0.3, 9.0), zoom=False))
            segs.append(Seg(img(sid), overlay_title("Jumpa lagi!", "See you again!", C_RED), pad(a, 0.5, 2.0)))
        elif sid.startswith("c"):
            ov = overlay_title(s["word"], s["meaning"])
            segs.append(Seg(img(sid), ov, pad(mix_at(a, chime("ding"), 0), 0.3, 0.8)))
        else:
            idx = word_ids.index(sid) + 1
            ov = overlay_word(s["word"], s["meaning"], idx, len(word_ids), s["chapter"])
            segs.append(Seg(img(sid), ov, pad(mix_at(np.concatenate([np.zeros(int(0.4 * SR)), a]), chime("ding"), 0), 0.3, 1.2)))
    return segs


def mix_at(a, b, at_s):
    i = int(at_s * SR); n = max(len(a), i + len(b))
    out = np.zeros(n, np.float32); out[: len(a)] += a; out[i : i + len(b)] += b
    return out


def quiz_segments(d, sc, img):
    segs = [Seg(img("c3"), overlay_title("Quiz Time!", "Shout out the Malay word!", C_TEAL),
                pad(voice("quiz_intro", "Quiz time! Look at the picture and shout out the Malay word. Ready?"), 0.3, 0.8))]
    ask = voice("quiz_ask", "What's the Malay word?")
    for q in d["quiz"]:
        segs.append(Seg(img(q), overlay_banner("What's the Malay word?"), pad(ask, 0.3, 0.3), zoom=False))
        for n in "321":
            segs.append(Seg(img(q), overlay_banner("What's the Malay word?", n), pad(chime("tick"), 0, 0.75), zoom=False))
        s = sc[q]
        segs.append(Seg(img(q), answer_overlay(s["word"], s["meaning"]),
                        pad(mix_at(np.concatenate([np.zeros(int(0.35 * SR)), voice("ans_" + q, s["word"] + " " + s["meaning"])]), chime("tada"), 0), 0.1, 1.0)))
    return segs


def answer_overlay(word, meaning):
    im = overlay_word(word, meaning, 0, 0, "")
    d = ImageDraw.Draw(im)
    # replace the "New word" badge with a "Correct!" badge
    d.rectangle((30, 26, 490, 140), fill=(0, 0, 0, 0))
    rounded_card(im, (40, 36, 400, 120), "#3DBE5A", radius=42, width=6)
    centered(d, 220, 48, "Answer!", font(54), "white")
    return im


# ---------- render ----------

def render_seg(i, seg):
    dur = len(seg.audio) / SR
    frames = int(math.ceil(dur * FPS))
    wav = os.path.join(BUILD, f"s{i:03d}.wav")
    a16 = (np.clip(seg.audio, -1, 1) * 32767).astype(np.int16)
    with wave.open(wav, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(a16.tobytes())
    ov = os.path.join(BUILD, f"o{i:03d}.png")
    (seg.ov or Image.new("RGBA", (W, H), (0, 0, 0, 0))).save(ov)
    if seg.zoom:
        z = f"zoompan=z='1+0.06*on/{frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s={W}x{H}:fps={FPS}"
        bgf = f"[0:v]scale=3840:2160,{z}[bg]"
    else:
        bgf = f"[0:v]scale={W}:{H},fps={FPS}[bg]"
    out = os.path.join(BUILD, f"s{i:03d}.mp4")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-framerate", str(FPS), "-i", seg.bg,
           "-i", ov, "-i", wav, "-filter_complex", f"{bgf};[bg][1:v]overlay=0:0,format=yuv420p[v]",
           "-map", "[v]", "-map", "2:a", "-frames:v", str(frames), "-c:v", "libx264", "-preset", "medium",
           "-crf", "20", "-c:a", "aac", "-b:a", "192k", "-ar", str(SR), "-shortest", out]
    subprocess.run(cmd, check=True)
    return out, frames / FPS


def main():
    segs = build_segments()
    files, total = [], 0.0
    for i, s in enumerate(segs):
        f, dur = render_seg(i, s); files.append(f); total += dur
        print(f"seg {i:02d} {dur:5.1f}s", flush=True)
    lst = os.path.join(BUILD, "list.txt")
    open(lst, "w").write("".join(f"file '{f}'\n" for f in files))
    joined = os.path.join(BUILD, "joined.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", joined], check=True)
    finish(joined, total)


def finish(joined, total):
    m = music(total + 1)
    fade = int(3 * SR); m[-fade:] *= np.linspace(1, 0, fade)
    mw = os.path.join(BUILD, "music.wav")
    with wave.open(mw, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(m, -1, 1) * 32767).astype(np.int16).tobytes())
    final = os.path.join(OUT, "malay_lesson_preview.mp4" if PREVIEW else "malay_lesson.mp4")
    # music ducks under the voice via sidechain compression
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", joined, "-i", mw, "-filter_complex",
                    "[1:a]volume=0.55[m];[0:a]asplit=2[v1][v2];[m][v2]sidechaincompress=threshold=0.02:ratio=8:attack=20:release=400[md];"
                    "[v1][md]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5[a]",
                    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", final], check=True)
    print("done", final, f"{total/60:.1f} min")


if __name__ == "__main__":
    if "--mix-only" in sys.argv:
        j = os.path.join(BUILD, "joined.mp4")
        dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", j]))
        finish(j, dur)
    else:
        main()
