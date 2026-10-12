"""Genera los íconos de la app (escudo neón) en web/icons/. Uso: python3 tools/make_icons.py"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parent.parent / 'web' / 'icons'
OUT.mkdir(parents=True, exist_ok=True)
BG = (5, 4, 15, 255)
CYAN, PURPLE, MAGENTA = (30, 232, 255), (163, 91, 255), (255, 61, 242)


def shield(size, scale):
    """Escudo con palomita, centrado; scale = fracción del lienzo que ocupa."""
    s = size * scale
    ox, oy = (size - s) / 2, (size - s) / 2
    p = lambda x, y: (ox + x * s / 24, oy + y * s / 24)
    outline = [p(12, 2), p(20, 5), p(20, 11), p(19.2, 14.6), p(17, 17.8), p(14.6, 20.2), p(12, 22), p(9.4, 20.2), p(7, 17.8), p(4.8, 14.6), p(4, 11), p(4, 5)]
    check = [p(8.6, 12), p(11, 14.4), p(15.6, 9.6)]
    return outline, check


def render(size, scale, path):
    img = Image.new('RGBA', (size, size), BG)
    glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    # halo de color
    for r, col in [(0.46, PURPLE + (90,)), (0.30, CYAN + (60,))]:
        c = size / 2
        g.ellipse([c - size * r, c - size * r, c + size * r, c + size * r], fill=col)
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.12))
    img.alpha_composite(glow)
    outline, check = shield(size, scale)
    w = max(3, int(size * 0.045))
    neon = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(neon)
    d.line(outline + [outline[0]], fill=CYAN + (255,), width=w, joint='curve')
    d.line(check, fill=MAGENTA + (255,), width=w, joint='curve')
    blur = neon.filter(ImageFilter.GaussianBlur(size * 0.025))
    img.alpha_composite(blur)
    img.alpha_composite(blur)
    img.alpha_composite(neon)
    img.convert('RGB').save(path, optimize=True)


render(192, 0.78, OUT / 'icon-192.png')
render(512, 0.78, OUT / 'icon-512.png')
render(512, 0.56, OUT / 'icon-maskable-512.png')   # zona segura para íconos recortados en Android
(OUT / 'favicon.svg').write_text(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#05040f"/>'
    '<path d="M12 2.8l7 2.6v5.4c0 4.4-3 7.9-7 9.7-4-1.8-7-5.3-7-9.7V5.4z" fill="none" stroke="#1ee8ff" stroke-width="1.8" stroke-linejoin="round"/>'
    '<path d="M9 12l2 2 4-4" fill="none" stroke="#ff3df2" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>\n', encoding='utf-8')
print('íconos en', OUT)
