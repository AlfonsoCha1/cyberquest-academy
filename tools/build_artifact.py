"""Arma un solo HTML (dist/cyberquest.html) con todo adentro, para publicarlo como página en Claude.
En esa versión no hay service worker ni sincronización (Claude no deja llamar servidores externos).
Uso: python3 tools/build_artifact.py"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
web = root / 'web'
src = (web / 'index.html').read_text(encoding='utf-8')
css = (web / 'style.css').read_text(encoding='utf-8')
cfg = re.search(r"webUrl:\s*'([^']*)'", (web / 'config.js').read_text(encoding='utf-8'))
artifact_cfg = "window.CQ_CONFIG = { apiUrl: '', webUrl: '%s', artifact: true };" % (cfg.group(1) if cfg else '')

out = src
# Claude agrega su propio <!doctype>, <head> y <body>: quitamos los nuestros y lo que solo sirve en la web
for pat in [r'<!doctype html>\s*', r'</?html[^>]*>\s*', r'</?head>\s*', r'</?body>\s*', r'<meta charset[^>]*>\s*', r'<meta name="viewport"[^>]*>\s*',
            r'<link rel="manifest"[^>]*>\s*', r'<link rel="icon"[^>]*>\s*', r'<link rel="apple-touch-icon"[^>]*>\s*', r'<meta name="theme-color"[^>]*>\s*']:
    out = re.sub(pat, '', out, flags=re.I)
out = out.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '\n</style>')

def inline(m):
    name = m.group(1)
    js = artifact_cfg if name == 'config.js' else (web / name).read_text(encoding='utf-8')
    js = re.sub(r'</(script)', r'<\\/\1', js, flags=re.I)  # "</script" dentro de textos rompería la página
    return f'<script>/* {name} */\n{js}\n</script>'

out = re.sub(r'<script src="([\w.-]+\.js)"></script>', inline, out)
(root / 'dist').mkdir(exist_ok=True)
(root / 'dist' / 'cyberquest.html').write_text(out, encoding='utf-8')
print('dist/cyberquest.html', len(out.encode('utf-8')) // 1024, 'KB')
