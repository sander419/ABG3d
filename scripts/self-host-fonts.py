"""Self-host IBM Plex Sans/Mono: fetch Google's CSS, download woff2, emit local @font-face."""
import os
import re
import sys
import urllib.request

REPO = sys.argv[1] if len(sys.argv) > 1 else r'C:\Users\glina\abg3d-bundle'
# Шрифты кладём в public/: Vite копирует эту папку в корень dist как есть,
# а index.html подключает их одним <link href="/fonts/fonts.css"> без Google Fonts.
FONT_DIR = os.path.join(REPO, 'public', 'fonts')

CSS_URL = (
    'https://fonts.googleapis.com/css2'
    '?family=IBM+Plex+Mono:wght@400;500;600'
    '&family=IBM+Plex+Sans:wght@400;500;600;700'
    '&display=swap'
)
UA = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
)
KEEP_SUBSETS = {'cyrillic', 'cyrillic-ext', 'latin', 'latin-ext'}


def fetch(url, ua=UA):
    req = urllib.request.Request(url, headers={'User-Agent': ua})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def main():
    css = fetch(CSS_URL).decode('utf-8')
    os.makedirs(FONT_DIR, exist_ok=True)

    # Google emits:  /* subset */\n@font-face { ... }
    blocks = []
    pattern = re.compile(r'/\*\s*([a-z\-]+)\s*\*/\s*@font-face\s*\{(.*?)\}', re.S)
    for subset, body in pattern.findall(css):
        if subset not in KEEP_SUBSETS:
            continue
        family = re.search(r"font-family:\s*'([^']+)'", body).group(1)
        weight = re.search(r'font-weight:\s*(\d+)', body).group(1)
        style = re.search(r'font-style:\s*(\w+)', body).group(1)
        src = re.search(r'url\((https://[^)]+\.woff2)\)', body).group(1)
        urange = re.search(r'unicode-range:\s*([^;]+);', body).group(1).strip()
        blocks.append({'subset': subset, 'family': family, 'weight': weight,
                       'style': style, 'url': src, 'range': urange})

    if not blocks:
        print('NO BLOCKS PARSED — check Google CSS response')
        print(css[:800])
        return 1

    out_lines = [
        '/* IBM Plex Sans / Mono — self-hosted (без fonts.googleapis.com).',
        '   Источник: Google Fonts CSS API, отдаётся только то, что реально нужно странице:',
        '   подмножества cyrillic / cyrillic-ext / latin / latin-ext.',
        '   Файлы сгенерированы scripts/self-host-fonts.py, руками не править. */',
        '',
    ]
    total = 0
    seen = {}
    for b in blocks:
        slug = re.sub(r'[^a-z0-9]+', '-', b['family'].lower()).strip('-')
        name = '%s-%s-%s.woff2' % (slug, b['weight'], b['subset'])
        path = os.path.join(FONT_DIR, name)
        if b['url'] not in seen:
            data = fetch(b['url'])
            with open(path, 'wb') as fh:
                fh.write(data)
            seen[b['url']] = (name, len(data))
            total += len(data)
        name, size = seen[b['url']]
        out_lines.append('@font-face {')
        out_lines.append("  font-family: '%s';" % b['family'])
        out_lines.append('  font-style: %s;' % b['style'])
        out_lines.append('  font-weight: %s;' % b['weight'])
        out_lines.append("  font-display: swap;")
        out_lines.append("  src: url('./%s') format('woff2');" % name)
        out_lines.append('  unicode-range: %s;' % b['range'])
        out_lines.append('}')
        out_lines.append('')

    css_path = os.path.join(FONT_DIR, 'fonts.css')
    with open(css_path, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write('\n'.join(out_lines))

    print('faces: %d, unique files: %d, total bytes: %d (%.1f KB)'
          % (len(blocks), len(seen), total, total / 1024))
    for name, size in sorted(seen.values()):
        print('  %-46s %7d' % (name, size))
    print('css:', css_path, os.path.getsize(css_path), 'bytes')
    return 0


sys.exit(main())
