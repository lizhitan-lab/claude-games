#!/usr/bin/env python3
"""Build a 抄写 (copy-writing) practice page from a word list.

Usage:
    python3 build_page.py --spec spec.json --out OUT_DIR [--standalone]

spec.json:
    {
      "title": "抄写 · 第3课",            # page name (short)
      "subtitle": "三年级华文 · 11月15日",  # optional line under the title
      "repeats": 3,                       # times to write each word after tracing (default 3)
      "dictation": true,                  # add a 听写 round (default true)
      "words": ["观察", {"w": "测量", "py": "cè liáng", "en": "measure"}]
    }

Writes into OUT_DIR:
    index.html          page content for the Artifact tool (no <html>/<head>; the tool wraps it)
    chaoxie.js, chaoxie.css, spec.js, lib/*.js
    standalone.html     (with --standalone) one self-contained file that also works offline
Prints a JSON summary: the files map to publish, the word list, and any characters
whose stroke data could not be found.
"""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tarfile
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'assets')
DATA_VER = '2.0.1'
CACHE = os.environ.get('CHAOXIE_CACHE', os.path.join(os.path.expanduser('~'), '.cache', 'chaoxie-strokes'))
HAN = re.compile(r'[㐀-䶿一-鿿豈-﫿\U00020000-\U0002ebef]')


def clean_words(raw):
    out, seen = [], set()
    for item in raw:
        obj = {'w': item} if isinstance(item, str) else dict(item)
        w = ''.join(HAN.findall(str(obj.get('w', ''))))
        if not w or w in seen:
            continue
        seen.add(w)
        obj['w'] = w
        out.append({k: v for k, v in obj.items() if k in ('w', 'py', 'en') and v})
    return out


def fetch_url(url):
    """Try urllib first, then curl (some sandboxes only let curl through the proxy)."""
    try:
        with urllib.request.urlopen(url, timeout=20) as r:
            return r.read().decode('utf8')
    except Exception:
        pass
    try:
        r = subprocess.run(['curl', '-sSf', '--max-time', '20', url], capture_output=True, text=True)
        if r.returncode == 0 and r.stdout.strip():
            return r.stdout
    except Exception:
        pass
    return None


def npm_package_dir():
    """Fallback source: the whole hanzi-writer-data package from the npm registry."""
    pkg = os.path.join(CACHE, 'npm', 'package')
    if os.path.isdir(pkg):
        return pkg
    os.makedirs(os.path.join(CACHE, 'npm'), exist_ok=True)
    try:
        r = subprocess.run(['npm', 'pack', f'hanzi-writer-data@{DATA_VER}', '--silent'],
                           cwd=os.path.join(CACHE, 'npm'), capture_output=True, text=True, timeout=180)
        tgz = r.stdout.strip().splitlines()[-1] if r.stdout.strip() else ''
        tgz = os.path.join(CACHE, 'npm', tgz)
        if not os.path.isfile(tgz):
            return None
        with tarfile.open(tgz) as t:
            members = [m for m in t.getmembers() if m.name.startswith('package/') and m.isfile()
                       and '..' not in m.name and m.name.endswith('.json')]
            t.extractall(os.path.join(CACHE, 'npm'), members=members)
        os.remove(tgz)
        return pkg if os.path.isdir(pkg) else None
    except Exception:
        return None


def stroke_data(ch):
    os.makedirs(CACHE, exist_ok=True)
    cached = os.path.join(CACHE, f'{ord(ch):x}.json')
    if os.path.isfile(cached):
        with open(cached, encoding='utf8') as f:
            return json.load(f)
    text = fetch_url(f'https://cdn.jsdelivr.net/npm/hanzi-writer-data@{DATA_VER}/{urllib.parse.quote(ch)}.json')
    if text is None:
        pkg = npm_package_dir()
        p = os.path.join(pkg, f'{ch}.json') if pkg else None
        if p and os.path.isfile(p):
            with open(p, encoding='utf8') as f:
                text = f.read()
    if text is None:
        return None
    try:
        d = json.loads(text)
        d = {'strokes': d['strokes'], 'medians': d['medians'], 'radStrokes': d.get('radStrokes', [])}
    except Exception:
        return None
    with open(cached, 'w', encoding='utf8') as f:
        json.dump(d, f, ensure_ascii=False)
    return d


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--spec', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--standalone', action='store_true')
    a = ap.parse_args()

    with open(a.spec, encoding='utf8') as f:
        spec = json.load(f)
    words = clean_words(spec.get('words', []))
    if not words:
        sys.exit('No Chinese words found in spec["words"].')

    chars = []
    for w in words:
        for c in w['w']:
            if c not in chars:
                chars.append(c)
    data, missing = {}, []
    for c in chars:
        d = stroke_data(c)
        if d:
            data[c] = d
        else:
            missing.append(c)
    if missing:
        # A word we cannot draw would freeze the page; leave it out and report it.
        words = [w for w in words if not any(c in missing for c in w['w'])]
        data = {c: v for c, v in data.items() if any(c in w['w'] for w in words)}
    if not words:
        sys.exit('Stroke data unavailable for every character: ' + ''.join(missing))

    title = (spec.get('title') or '抄写练习').strip()
    ident = spec.get('id') or hashlib.sha1((title + '|' + ','.join(w['w'] for w in words)).encode('utf8')).hexdigest()[:10]
    page_spec = {
        'id': ident, 'title': title, 'subtitle': spec.get('subtitle', ''),
        'repeats': int(spec.get('repeats', 3) or 3), 'dictation': spec.get('dictation', True) is not False,
        'words': words, 'pyFix': spec.get('pyFix', {}),
    }

    out = os.path.abspath(a.out)
    os.makedirs(os.path.join(out, 'lib'), exist_ok=True)
    for name in ('chaoxie.js', 'chaoxie.css'):
        shutil.copy(os.path.join(ASSETS, name), os.path.join(out, name))
    for name in ('hanzi-writer.min.js', 'pinyin-pro.js', 'ARPHICPL.TXT', 'pinyin-pro.LICENSE'):
        shutil.copy(os.path.join(ASSETS, 'lib', name), os.path.join(out, 'lib', name))
    with open(os.path.join(out, 'lib', 'hanzi-data.js'), 'w', encoding='utf8') as f:
        f.write('/* Stroke data: hanzi-writer-data (Make Me a Hanzi), Arphic Public License */\nwindow.HANZI_DATA='
                + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
    with open(os.path.join(out, 'spec.js'), 'w', encoding='utf8') as f:
        f.write('window.CHAOXIE=' + json.dumps(page_spec, ensure_ascii=False, indent=1) + ';\n')

    esc_title = title.replace('&', '&amp;').replace('<', '&lt;')
    scripts = ['lib/pinyin-pro.js', 'lib/hanzi-writer.min.js', 'lib/hanzi-data.js', 'spec.js', 'chaoxie.js']
    with open(os.path.join(out, 'index.html'), 'w', encoding='utf8') as f:
        f.write(f'<title>{esc_title}</title>\n<link rel="stylesheet" href="chaoxie.css">\n'
                '<div id="app"></div>\n' + ''.join(f'<script src="{s}"></script>\n' for s in scripts))

    if a.standalone:
        def read(p):
            with open(os.path.join(out, p), encoding='utf8') as fh:
                return fh.read()
        body = ''.join('<script>\n' + read(s).replace('</script', '<\\/script') + '\n</script>\n' for s in scripts)
        with open(os.path.join(out, 'standalone.html'), 'w', encoding='utf8') as f:
            f.write('<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8">\n'
                    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
                    f'<title>{esc_title}</title>\n<style>\n{read("chaoxie.css")}\n</style></head>\n'
                    f'<body><div id="app"></div>\n{body}</body></html>\n')

    files = {p: os.path.join(out, p) for p in ['chaoxie.js', 'chaoxie.css', 'spec.js'] + [s for s in scripts if s.startswith('lib/')]}
    print(json.dumps({
        'page': os.path.join(out, 'index.html'),
        'files': files,
        'standalone': os.path.join(out, 'standalone.html') if a.standalone else None,
        'title': title, 'id': ident, 'words': [w['w'] for w in words],
        'characters': len(data), 'missing_characters': missing,
    }, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
