#!/usr/bin/env python3
"""Build dist/aquarium-world.html: the whole game in one file (scripts and icons inlined).

Download it and open it in any browser - no internet or server needed.
Run: python3 build-standalone.py
"""
import base64, re, pathlib

root = pathlib.Path(__file__).parent / 'aquarium-world'
html = (root / 'index.html').read_text()

# drop installed-app links (they need a web server); inline the icons instead
html = re.sub(r'\s*<link rel="manifest"[^>]*>', '', html)
icon = base64.b64encode((root / 'icons/icon-192.png').read_bytes()).decode()
touch = base64.b64encode((root / 'icons/apple-touch-icon.png').read_bytes()).decode()
html = html.replace('href="icons/icon-192.png"', f'href="data:image/png;base64,{icon}"')
html = html.replace('href="icons/apple-touch-icon.png"', f'href="data:image/png;base64,{touch}"')

def inline(m):
    src = (root / m.group(1)).read_text()
    assert '</script' not in src, m.group(1)
    return f'<script>\n// ---- {m.group(1)} ----\n{src}\n</script>'
html = re.sub(r'<script src="([^"]+)"></script>', inline, html)
assert 'src="js/' not in html and 'icons/' not in html

out = pathlib.Path(__file__).parent / 'dist' / 'aquarium-world.html'
out.parent.mkdir(exist_ok=True)
out.write_text(html)
print(f'wrote {out} ({out.stat().st_size // 1024} KB)')
