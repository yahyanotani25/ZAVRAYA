"""Hand-built props, icons and effects."""
import math
import numpy as np
import skia
from .core import *

OUT = 0xFF141414

def shp(c, path, color, lw=4.0, ink=OUT):
    c.drawPath(path, fill(color))
    if lw: c.drawPath(path, stroke(ink, lw, join='round'))

# ============================================================================= effects
def shake(t, t0, amp=14.0, dur=0.35, freq=34.0):
    """Camera shake offset after an impact at t0."""
    x = t - t0
    if x < 0 or x > dur: return (0.0, 0.0)
    k = (1 - x / dur) ** 2
    return (amp * k * math.sin(x * freq * 2.1 + 1.3), amp * k * math.cos(x * freq * 1.7))

def poof(c, x, y, r, k, color=0xFFF1EEE6, n=9, seed=0, ink=True):
    """Cartoon smoke burst: k 0..1 (grows, thins, vanishes)."""
    if k <= 0 or k >= 1: return
    grow = ease_out(k, 2.5); fade = 1 - ease_io(seg(k, 0.38, 0.86), 2)
    for i in range(n):
        a = 2 * math.pi * (i + 0.37 * rnd(i, seed)) / n
        d = r * (0.25 + 0.85 * grow) * (0.75 + 0.5 * rnd(i, seed + 3))
        rr = r * (0.42 + 0.3 * rnd(i, seed + 5)) * (1 - 0.55 * k) * (0.6 + 0.4 * math.sin(math.pi * min(1, k * 1.6)))
        px, py = x + d * math.cos(a), y + d * math.sin(a) * 0.8 - r * 0.25 * grow
        b = blob(px, py, rr, rr * 0.92, seed=i + seed, amp=0.09, n=9)
        c.drawPath(b, fill(color, fade))
        if ink: c.drawPath(b, stroke(OUT, max(1.5, r * 0.035), fade))
    core = r * (0.5 - 0.5 * k) * min(1.0, k / 0.1)
    if core > 2:
        c.drawPath(blob(x, y - r * 0.1, core, core * 0.9, seed, 0.08, 10), fill(color, fade))

def burst(c, x, y, r0, r1, k, n=12, color=OUT, w=6.0, seed=0):
    """Radial impact lines: k 0..1."""
    if k <= 0 or k >= 1: return
    a_in = lerp(r0, r1, ease_out(k, 3)); a_out = lerp(r0, r1 * 1.25, ease_out(min(1, k * 1.5), 3))
    al = 1 - ease_in(seg(k, 0.6, 1), 2)
    for i in range(n):
        a = 2 * math.pi * (i + 0.3 * rnd(i, seed)) / n
        l0, l1 = a_in * (0.9 + 0.2 * rnd(i, seed + 2)), a_out * (0.9 + 0.3 * rnd(i, seed + 4))
        if l1 > l0:
            c.drawLine(x + l0 * math.cos(a), y + l0 * math.sin(a), x + l1 * math.cos(a), y + l1 * math.sin(a), stroke(color, w * (1 - 0.5 * k), al))

def star(cx, cy, r_out, r_in, n=5, rot=-90):
    pts = []
    for i in range(n * 2):
        a = math.radians(rot + i * 180 / n); r = r_out if i % 2 == 0 else r_in
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return poly(pts)

def spiky(cx, cy, r_out, r_in, n=11, seed=0, rot=0.0):
    """Comic 'POW' burst shape."""
    pts = []
    for i in range(n * 2):
        a = rot + math.pi * i / n
        r = (r_out * (0.86 + 0.28 * rnd(i, seed))) if i % 2 == 0 else (r_in * (0.9 + 0.2 * rnd(i, seed + 1)))
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return poly(pts)

def bolt(c, x0, y0, x1, y1, seed=0, w=7.0, color=0xFFFFE23A, jag=0.22, a=1.0):
    """Jagged lightning bolt between two points."""
    n = 5; pts = [(x0, y0)]
    dx, dy = x1 - x0, y1 - y0; L = math.hypot(dx, dy) or 1
    for i in range(1, n):
        k = i / n; off = (rnd(i, seed) - 0.5) * 2 * jag * L * (1 if i % 2 else -1) * 0.6
        pts.append((x0 + dx * k - dy / L * off, y0 + dy * k + dx / L * off))
    pts.append((x1, y1))
    p = poly(pts, closed=False)
    c.drawPath(p, stroke(OUT, w + 5, a, join='miter')); c.drawPath(p, stroke(color, w, a, join='miter'))

def speed_lines(c, t, x0, x1, y0, y1, n=14, color=0xFFFFFFFF, a=0.6, speed=2600.0, seed=0, w=5.0, length=320.0, direction=-1):
    span = (x1 - x0) + length * 2
    for i in range(n):
        y = lerp(y0, y1, rnd(i, seed))
        ph = (rnd(i, seed + 9) * span + t * speed * (0.7 + 0.6 * rnd(i, seed + 4))) % span
        x = (x1 + length - ph) if direction < 0 else (x0 - length + ph)
        ln = length * (0.5 + rnd(i, seed + 2))
        c.drawLine(x, y, x + ln, y, stroke(color, w * (0.5 + rnd(i, seed + 6)), a * (0.4 + 0.6 * rnd(i, seed + 8)), cap='round'))

def qmark(c, x, y, size, k, color=OUT, rot=0.0, ch="?"):
    """Popping '?' (k = pop progress, may overshoot)."""
    if k <= 0: return
    with xf(c, x, y, k, rot):
        text(c, ch, 0, size * 0.36, "Bangers", size, color, outline=0xFFFFFFFF, ow=size * 0.12)

def sweat(c, x, y, t, s=1.0, n=3, seed=0):
    """Little flying sweat drops beside a head."""
    for i in range(n):
        ph = (t * 1.6 + i / n + rnd(i, seed) * 0.3) % 1.0
        ang = math.radians(-150 + i * 28 + rnd(i, seed + 2) * 14)
        d = (26 + 46 * ph) * s
        px, py = x + d * math.cos(ang), y + d * math.sin(ang) + 30 * s * ph * ph
        al = 1 - ease_in(seg(ph, 0.6, 1.0), 2)
        with xf(c, px, py, s * (0.9 - 0.3 * ph), math.degrees(ang) + 90):
            dp = P(('M', 0, -11), ('C', 7, -2, 7, 7, 0, 8), ('C', -7, 7, -7, -2, 0, -11), ('Z',))
            c.drawPath(dp, fill(0xFF8FD8F5, al)); c.drawPath(dp, stroke(OUT, 2.4, al))

def arrow(c, x0, y0, x1, y1, w=8.0, color=0xFFE3242B, head=30.0, bend=0.18, k=1.0, ink=True, seed=2):
    """Hand-drawn curved arrow that draws on with k."""
    if k <= 0: return
    dx, dy = x1 - x0, y1 - y0
    cx, cy = (x0 + x1) / 2 - dy * bend, (y0 + y1) / 2 + dx * bend
    full = P(('M', x0, y0), ('Q', cx, cy, x1, y1))
    pm = skia.PathMeasure(full, False); L = pm.getLength()
    part = skia.Path(); pm.getSegment(0, L * clamp(k), part, True)
    part = rough(part, 1.6, 80, seed, 10)
    pos, tan = pm.getPosTan(L * clamp(k))
    a = math.atan2(tan.y(), tan.x())
    hd = poly([(pos.x() + head * 0.5 * math.cos(a), pos.y() + head * 0.5 * math.sin(a)),
               (pos.x() - head * math.cos(a - 0.5), pos.y() - head * math.sin(a - 0.5)),
               (pos.x() - head * math.cos(a + 0.5), pos.y() - head * math.sin(a + 0.5))])
    if ink:
        c.drawPath(part, stroke(OUT, w + 6)); c.drawPath(hd, stroke(OUT, 6, join='round'))
    c.drawPath(part, stroke(color, w)); c.drawPath(hd, fill(color))

def slam(t, t0, dur=0.16, from_s=2.6):
    """(scale, alpha) for text that slams onto the screen at t0."""
    if t < t0: return (0.0, 0.0)
    k = seg(t, t0, t0 + dur)
    s = lerp(from_s, 1.0, ease_in(k, 2.2))
    s *= 1 + 0.07 * settle(t, t0 + dur, 30, 9) if t > t0 + dur else 1
    return (s, min(1.0, k * 2.5))

def label(c, s, x, y, size=54, color=OUT, bg=0xFFFFFFFF, pad=(22, 10), rot=0.0, k=1.0, fnt="Bangers", ink=OUT, lw=5.0, track=1.5, r=14):
    """Sticker-style name tag centred on (x, y); k = pop scale."""
    if k <= 0: return
    w = text_w(s, fnt, size, track)
    with xf(c, x, y, k, rot):
        box = rrect(-w / 2 - pad[0], -size * 0.5 - pad[1], w + pad[0] * 2, size + pad[1] * 2, r)
        c.save(); c.translate(5, 7); c.drawPath(box, fill(0xFF000000, 0.22)); c.restore()
        c.drawPath(box, fill(bg)); c.drawPath(box, stroke(ink, lw))
        text(c, s, 0, size * 0.36, fnt, size, color, track=track)

def bubble(c, x, y, w, h, tail=None, k=1.0, lw=5.0, seed=1, base=None):
    """Speech bubble centred on (x, y) with a tail pointing at `tail`."""
    if k <= 0: return
    with xf(c, x, y, k):
        body = rrect(-w / 2, -h / 2, w, h, min(w, h) * 0.42)
        if tail:
            tx, ty = tail[0] - x, tail[1] - y
            bx = base if base is not None else clamp(tx * 0.35, -w * 0.3, w * 0.3); sg = 1 if ty > 0 else -1
            tp = P(('M', bx - 34, sg * (h / 2 - 6)), ('L', tx, ty), ('L', bx + 34, sg * (h / 2 - 6)), ('Z',))
            body.addPath(tp)
            body = skia.Op(rrect(-w / 2, -h / 2, w, h, min(w, h) * 0.42), tp, skia.PathOp.kUnion_PathOp)
        c.save(); c.translate(6, 8); c.drawPath(body, fill(0xFF000000, 0.2)); c.restore()
        c.drawPath(body, fill(0xFFFFFFFF)); c.drawPath(body, stroke(OUT, lw, join='round'))

def iris(c, cx, cy, r):
    """Black frame with a circular hole (classic cartoon close)."""
    p = skia.Path(); p.addRect(skia.Rect.MakeWH(W, H))
    if r > 0.5: p.addCircle(cx, cy, r, skia.PathDirection.kCCW)
    p.setFillType(skia.PathFillType.kEvenOdd)
    c.drawPath(p, fill(0xFF000000))

def vignette(c, a=0.35, inner=0.55):
    p = skia.Paint(AntiAlias=True)
    p.setShader(rad_grad(W / 2, H / 2, math.hypot(W, H) / 2, [0x00000000, 0x00000000, col(0xFF000000, a)], [0.0, inner, 1.0]))
    c.drawRect(skia.Rect.MakeWH(W, H), p)

_grain = {}
def film_fx(c, t, strength=1.0, seed=0, scratches=True, flicker=True):
    """Old film stock: grain, vertical scratches, dust and a gentle flicker (changes on twos)."""
    f = int(t * FPS / 2)
    if 'tiles' not in _grain:
        rng = np.random.default_rng(7); tiles = []
        for i in range(6):
            n = rng.normal(0, 1, (270, 480)).astype(np.float32)
            a = np.clip(np.abs(n) * 46, 0, 150).astype(np.uint8)
            rgba = np.zeros((270, 480, 4), np.uint8)
            v = np.where(n > 0, 255, 0).astype(np.uint8)
            rgba[..., 0] = rgba[..., 1] = rgba[..., 2] = v; rgba[..., 3] = a
            # skia wants premultiplied for unpremul=False images; keep simple straight alpha
            tiles.append(skia.Image.fromarray(rgba, colorType=skia.kRGBA_8888_ColorType, alphaType=skia.kUnpremul_AlphaType))
        _grain['tiles'] = tiles
    im = _grain['tiles'][f % 6]
    p = skia.Paint(); p.setAlphaf(0.20 * strength)
    c.drawImageRect(im, skia.Rect.MakeWH(480, 270), skia.Rect.MakeWH(W, H), skia.SamplingOptions(skia.FilterMode.kLinear), p)
    if flicker:
        fl = 0.045 * strength * (rnd(f, seed + 1) - 0.4)
        c.drawRect(skia.Rect.MakeWH(W, H), fill(0xFFFFFFFF if fl > 0 else 0xFF000000, abs(fl)))
    if scratches:
        for i in range(3):
            if rnd(f * 3 + i, seed + 5) < 0.42:
                x = rnd(f // 3 + i * 17, seed + 6) * W + wiggle(t, 9, 5, i)
                c.drawLine(x, 0, x + (rnd(f + i, seed) - 0.5) * 14, H, stroke(0xFFFFFFFF if i else 0xFF1A1A1A, 1.6, 0.32 * strength))
        for i in range(5):
            if rnd(f * 5 + i, seed + 8) < 0.30:
                x, y = rnd(f * 7 + i, seed + 9) * W, rnd(f * 11 + i, seed + 10) * H
                c.drawPath(blob(x, y, 3 + 6 * rnd(f + i, 3), 2 + 4 * rnd(f + i, 4), i, 0.3, 7), fill(0xFF111111, 0.55 * strength))

# ============================================================================= list icons (drawn around the origin, ~±110)
def icon_sim(c, t=0.0):
    c.drawRoundRect(skia.Rect.MakeLTRB(-104, 70, 104, 86), 6, 6, fill(0xFF2B2D33)); c.drawRoundRect(skia.Rect.MakeLTRB(-104, 70, 104, 86), 6, 6, stroke(OUT, 4))
    for x in (-88, 86): c.drawLine(x, 86, x, 96, stroke(OUT, 8))
    # curved monitor showing a track
    scr = rrect(18, -92, 88, 78, 9)
    shp(c, scr, 0xFF15171C, 4.5)
    c.save(); c.clipPath(rrect(24, -86, 76, 66, 5), True)
    c.drawRect(skia.Rect.MakeLTRB(20, -90, 110, -50), fill(0xFF7EC8F2)); c.drawRect(skia.Rect.MakeLTRB(20, -52, 110, -10), fill(0xFF5DAA4B))
    c.drawPath(P(('M', 56, -52), ('L', 68, -52), ('L', 104, -18), ('L', 22, -18), ('Z',)), fill(0xFF55585E))
    for i in range(4):
        y0 = -50 + i * 8.5; x0 = 55 - i * 8.6
        c.drawPath(P(('M', x0, y0), ('L', x0 - 4, y0 + 5), ('L', x0 - 9, y0 + 5), ('L', x0 - 5, y0), ('Z',)), fill(0xFFE3242B if i % 2 == 0 else 0xFFFFFFFF))
    c.drawLine(62, -50, 63, -20, stroke(0xFFFFFFFF, 2, 0.8))
    c.restore()
    c.drawLine(62, -14, 62, 70, stroke(OUT, 12)); c.drawLine(62, -14, 62, 70, stroke(0xFF3A3D44, 6))
    # seat
    seat = P(('M', -92, -34), ('Q', -100, -40, -84, -44), ('Q', -66, -40, -62, -22), ('L', -50, 40), ('L', -10, 40), ('Q', 2, 42, 0, 54), ('L', -2, 66),
             ('L', -78, 66), ('Q', -84, 20, -92, -34), ('Z',))
    shp(c, seat, 0xFFE3242B, 4.5)
    c.drawPath(P(('M', -76, -30), ('Q', -66, 10, -60, 50)), stroke(0xFFA5121B, 5))
    # driver (helmet) + arms + wheel
    c.drawLine(-52, 6, 6, -4, stroke(OUT, 7))
    c.drawLine(-54, 8, -56, 44, stroke(OUT, 7)); c.drawLine(-56, 44, -12, 40, stroke(OUT, 7)); c.drawLine(-12, 40, 30, 62, stroke(OUT, 7))
    hel = blob(-58, -30, 25, 24, 3, 0.03, 12)
    shp(c, hel, 0xFFFFC906, 4.5)
    c.drawPath(P(('M', -52, -40), ('L', -33, -36), ('L', -34, -24), ('L', -50, -24), ('Z',)), fill(0xFF15171C))
    wob = wiggle(t, 2.2, 9, 3)
    with xf(c, 10, -6, 1, -14 + wob):
        w_ = rrect(-9, -26, 18, 52, 8); shp(c, w_, 0xFF22242A, 4)
    c.drawLine(12, -2, 58, 14, stroke(OUT, 8))

def icon_telemetry(c, k=1.0, t=0.0):
    mon = rrect(-104, -78, 208, 132, 12)
    shp(c, mon, 0xFF15171C, 5)
    scr = rrect(-94, -68, 188, 112, 6)
    c.drawPath(scr, fill(0xFF0E2238))
    c.save(); c.clipPath(scr, True)
    for i in range(1, 8): c.drawLine(-94 + i * 23.5, -68, -94 + i * 23.5, 44, stroke(0xFF1E3D5C, 1.5))
    for i in range(1, 5): c.drawLine(-94, -68 + i * 22.4, 94, -68 + i * 22.4, stroke(0xFF1E3D5C, 1.5))
    c.clipRect(skia.Rect.MakeLTRB(-94, -70, -94 + 188 * clamp(k), 46))
    sp = [(-94, -10), (-70, -44), (-48, -50), (-36, -14), (-24, -8), (-6, -38), (14, -54), (30, -52), (40, -20), (52, -10), (70, -40), (94, -56)]
    c.drawPath(spline(sp), stroke(0xFFFFD23A, 4.5))
    th = [(-94, 10), (-52, 10), (-48, 34), (-30, 34), (-26, 10), (26, 10), (30, 34), (46, 34), (50, 10), (94, 10)]
    c.drawPath(poly(th, False), stroke(0xFF39D98A, 3.6, join='miter'))
    br = [(-94, 38), (-46, 38), (-42, 20), (-34, 38), (32, 38), (36, 18), (44, 38), (94, 38)]
    c.drawPath(poly(br, False), stroke(0xFFFF4B55, 3.6, join='miter'))
    c.restore()
    if 0 < k < 1: c.drawLine(-94 + 188 * k, -66, -94 + 188 * k, 42, stroke(0xFFFFFFFF, 2.5, 0.8))
    c.drawPath(scr, stroke(OUT, 3))
    c.drawLine(0, 54, 0, 78, stroke(OUT, 14)); c.drawLine(0, 56, 0, 76, stroke(0xFF3A3D44, 7))
    c.drawRoundRect(skia.Rect.MakeLTRB(-46, 76, 46, 88), 5, 5, fill(0xFF2B2D33)); c.drawRoundRect(skia.Rect.MakeLTRB(-46, 76, 46, 88), 5, 5, stroke(OUT, 4))

def _eng_head(c, x, y, hair, t, seed):
    bob = wiggle(t, 1.3, 2.5, seed)
    c.drawLine(x, y + 22 + bob, x, y + 56, stroke(OUT, 6))
    hd = blob(x, y + bob, 23, 22, seed, 0.04, 12)
    shp(c, hd, 0xFFFFFFFF, 4)
    hp = P(('M', x - 22, y - 8 + bob), ('Q', x - 16, y - 30 + bob, x + 4, y - 26 + bob), ('Q', x + 22, y - 26 + bob, x + 22, y - 8 + bob), ('Q', x, y - 18 + bob, x - 22, y - 8 + bob), ('Z',))
    shp(c, hp, hair, 3.4)
    for dx in (-7, 7): c.drawLine(x + dx, y - 2 + bob, x + dx, y + 6 + bob, stroke(OUT, 3.4))
    # headset
    c.drawPath(P(('M', x - 25, y + 2 + bob), ('Q', x, y - 44 + bob, x + 25, y + 2 + bob)), stroke(OUT, 5))
    for dx in (-25, 25):
        c.drawRoundRect(skia.Rect.MakeLTRB(x + dx - 7, y - 6 + bob, x + dx + 7, y + 12 + bob), 5, 5, fill(0xFFE3242B)); c.drawRoundRect(skia.Rect.MakeLTRB(x + dx - 7, y - 6 + bob, x + dx + 7, y + 12 + bob), 5, 5, stroke(OUT, 3))
    c.drawPath(P(('M', x - 25, y + 10 + bob), ('Q', x - 22, y + 20 + bob, x - 8, y + 17 + bob)), stroke(OUT, 3))

def icon_engineers(c, t=0.0):
    c.drawRoundRect(skia.Rect.MakeLTRB(-108, -92, 108, -74), 6, 6, fill(0xFF2B2D33)); c.drawRoundRect(skia.Rect.MakeLTRB(-108, -92, 108, -74), 6, 6, stroke(OUT, 4))
    c.drawRect(skia.Rect.MakeLTRB(-104, -80, 104, -76), fill(0xFFE3242B))
    for x in (-100, 100): c.drawLine(x, -74, x, 40, stroke(OUT, 9)); c.drawLine(x, -72, x, 40, stroke(0xFF4A4D55, 4))
    for i, (x, hair) in enumerate(((-62, 0xFF6B4423), (0, 0xFFE6DDB8), (62, 0xFF2A2A2E))):
        _eng_head(c, x, -22, hair, t, 4 + i)
    desk = rrect(-108, 38, 216, 46, 8)
    shp(c, desk, 0xFF3A3D44, 4.5)
    for i, x in enumerate((-62, 0, 62)):
        m = rrect(x - 26, 14, 52, 34, 4); shp(c, m, 0xFF0E2238, 3.4)
        colr = (0xFFFFD23A, 0xFF39D98A, 0xFFFF4B55)[i]
        c.drawPath(spline([(x - 20, 36), (x - 10, 24 + i * 3), (x, 34 - i * 2), (x + 10, 22 + i * 2), (x + 20, 30)]), stroke(colr, 2.6))

def icon_cell(c):
    tub = P(('M', 104, 44), ('L', 102, 8), ('Q', 70, -18, 34, -26), ('L', 26, -8), ('L', -34, -8), ('L', -42, -30), ('Q', -52, -74, -70, -78),
            ('Q', -90, -74, -94, -40), ('L', -102, 44), ('Q', 0, 56, 104, 44), ('Z',))
    c.drawPath(tub, fill(0xFF2A2C31))
    c.save(); c.clipPath(tub, True)
    for i in range(-30, 40):                                                     # carbon weave
        c.drawLine(i * 9, -90, i * 9 + 60, 70, stroke(0xFF3B3E45, 2)); c.drawLine(i * 9, -90, i * 9 - 60, 70, stroke(0xFF1E2024, 2))
    c.drawPath(P(('M', -92, -44), ('Q', -74, -76, -52, -60)), stroke(0xFF5B5F68, 5))
    c.restore()
    c.drawPath(tub, stroke(OUT, 5, join='round'))
    # driver's helmet poking out
    hel = blob(-4, -30, 23, 22, 2, 0.03, 12); shp(c, hel, 0xFFFFC906, 4)
    c.drawPath(P(('M', 0, -40), ('L', 18, -36), ('L', 18, -24), ('L', 2, -24), ('Z',)), fill(0xFF15171C))
    c.drawPath(P(('M', 26, -8), ('L', -34, -8)), stroke(OUT, 5))
    # shield + tick
    with xf(c, 62, 14, 1.0):
        sh = P(('M', 0, -22), ('L', 20, -15), ('Q', 21, 10, 0, 24), ('Q', -21, 10, -20, -15), ('Z',)); shp(c, sh, 0xFF39D98A, 4)
        c.drawPath(P(('M', -9, 0), ('L', -2, 8), ('L', 10, -8)), stroke(0xFFFFFFFF, 5.5))

def icon_halo(c):
    def tube(path, w):
        c.drawPath(path, stroke(OUT, w + 9)); c.drawPath(path, stroke(0xFFA7ADB5, w))
    back = P(('M', -86, -40), ('Q', -40, -76, 0, -76), ('Q', 40, -76, 86, -40))
    tube(back, 15)
    ring = P(('M', -86, -40), ('Q', -74, 6, 0, 14), ('Q', 74, 6, 86, -40))
    tube(ring, 19)
    tube(P(('M', 0, 14), ('L', 0, 70)), 19)
    c.drawPath(P(('M', -78, -30), ('Q', -64, 0, -6, 6)), stroke(0xFFDDE1E6, 4))
    c.drawLine(-4, 22, -4, 64, stroke(0xFFDDE1E6, 4))
    for x in (-86, 86):
        c.drawCircle(x, -40, 12, fill(0xFF6E737B)); c.drawCircle(x, -40, 12, stroke(OUT, 4))
    c.drawRoundRect(skia.Rect.MakeLTRB(-22, 64, 22, 84), 6, 6, fill(0xFF6E737B)); c.drawRoundRect(skia.Rect.MakeLTRB(-22, 64, 22, 84), 6, 6, stroke(OUT, 4))

def icon_hans(c):
    torso = P(('M', -70, 88), ('Q', -72, 44, -30, 36), ('L', 34, 36), ('Q', 74, 44, 72, 88), ('Z',))
    shp(c, torso, 0xFF2456B8, 4.5)
    c.drawLine(0, 38, 0, 88, stroke(0xFF173C86, 4))
    # the device: yoke over the shoulders with a tall collar behind the helmet
    yoke = P(('M', 44, 84), ('L', 30, 40), ('Q', 14, 26, -24, 22), ('L', -30, -40), ('Q', -44, -50, -56, -40), ('L', -56, 30), ('Q', -52, 46, -30, 50),
             ('L', 6, 56), ('L', 20, 86), ('Z',))
    shp(c, yoke, 0xFF2A2C31, 4.5)
    c.drawPath(P(('M', -48, -34), ('L', -48, 30)), stroke(0xFF4A4E57, 4))
    hel = blob(4, -22, 50, 47, 5, 0.025, 14); shp(c, hel, 0xFFE3242B, 5)
    vis = P(('M', 16, -40), ('Q', 46, -40, 54, -20), ('Q', 54, -8, 48, -2), ('L', 18, -6), ('Q', 8, -22, 16, -40), ('Z',)); shp(c, vis, 0xFF15171C, 4)
    c.drawLine(24, -32, 40, -30, stroke(0xFFFFFFFF, 3.5, 0.7))
    c.drawPath(P(('M', -40, -12), ('Q', 0, 6, 46, 6)), stroke(0xFFFFFFFF, 6))
    for y0 in (-30, -8):                                                          # tethers
        c.drawLine(-44, y0, -20, y0 + 6, stroke(OUT, 8)); c.drawLine(-44, y0, -20, y0 + 6, stroke(0xFFFFC906, 4))
    c.drawCircle(-20, -14, 6, fill(0xFFB9BCC2)); c.drawCircle(-20, -14, 6, stroke(OUT, 3))

def icon_medical(c, t=0.0):
    soft_shadow(c, 0, 70, 100, 9, 0.22)
    body = P(('M', -106, 44), ('Q', -110, 8, -96, 2), ('L', -72, -4), ('Q', -52, -44, -24, -46), ('L', 40, -46), ('Q', 62, -42, 78, -6), ('L', 100, 4),
             ('Q', 110, 12, 108, 44), ('Q', 0, 52, -106, 44), ('Z',))
    shp(c, body, 0xFFF4F4F1, 5)
    c.save(); c.clipPath(body, True)
    c.drawRect(skia.Rect.MakeLTRB(-120, 18, 120, 32), fill(0xFFE3242B)); c.drawRect(skia.Rect.MakeLTRB(-120, 32, 120, 40), fill(0xFFFFC906))
    c.restore()
    win = P(('M', -64, -6), ('Q', -48, -38, -24, -38), ('L', 36, -38), ('Q', 54, -34, 66, -6), ('Z',)); shp(c, win, 0xFF24303D, 4)
    c.drawLine(4, -38, 4, -6, stroke(OUT, 5)); c.drawLine(-30, -30, -44, -12, stroke(0xFFFFFFFF, 3, 0.5))
    c.drawPath(body, stroke(OUT, 5, join='round'))
    # cross on the door
    c.drawRect(skia.Rect.MakeLTRB(-12, 0, -2, 28), fill(0xFFE3242B)); c.drawRect(skia.Rect.MakeLTRB(-21, 9, 7, 19), fill(0xFFE3242B))
    # light bar
    on = int(t * 6) % 2 == 0
    lb = rrect(-18, -60, 40, 15, 5); shp(c, lb, 0xFF2B2D33, 3.6)
    c.drawRect(skia.Rect.MakeLTRB(-14, -57, 1, -48), fill(0xFFFFB020 if on else 0xFF8A5A10)); c.drawRect(skia.Rect.MakeLTRB(3, -57, 18, -48), fill(0xFF8A5A10 if on else 0xFFFFB020))
    gx = -7 if on else 10
    p = fill(0xFFFFD060, 0.55); p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 9)); c.drawCircle(gx, -54, 20, p)
    for x in (-62, 62):
        c.drawCircle(x, 44, 24, fill(0xFF1B1B1D)); c.drawCircle(x, 44, 24, stroke(OUT, 4))
        c.drawCircle(x, 44, 12, fill(0xFFB9BCC2)); c.drawCircle(x, 44, 12, stroke(OUT, 3)); c.drawCircle(x, 44, 3.5, fill(0xFF6E737B))

# ============================================================================= props
def sack(c, bulge=0.0, open_=1.0):
    """Burlap sack, mouth at the top (origin = ground centre). bulge 0..1 fattens it."""
    b = bulge
    body = P(('M', -78 - 22 * b, -6), ('Q', -112 - 30 * b, -70 - 20 * b, -70 - 12 * b, -150 - 26 * b), ('Q', -52, -182 - 26 * b, -46, -196 - 28 * b),
             ('L', 46, -196 - 28 * b), ('Q', 52, -182 - 26 * b, 70 + 12 * b, -150 - 26 * b), ('Q', 112 + 30 * b, -70 - 20 * b, 78 + 22 * b, -6), ('Q', 0, 8, -78 - 22 * b, -6), ('Z',))
    soft_shadow(c, 0, 0, 110 + 24 * b, 12, 0.25)
    shp(c, body, 0xFFC9A66B, 5.5)
    c.save(); c.clipPath(body, True)
    for i in range(-14, 15):
        c.drawLine(i * 18, -260, i * 18 + 40, 20, stroke(0xFFB18E55, 2))
    c.drawPath(P(('M', -70, -20), ('Q', -100, -80, -66, -150)), stroke(0xFFE0C28C, 8))
    for (px, py) in ((30, -60), (-20, -110), (44, -128)):                           # patches
        pt = rrect(px - 16, py - 13, 32, 26, 4); c.drawPath(pt, fill(0xFF9A7A45)); c.drawPath(pt, stroke(OUT, 3))
        for q in (-9, 0, 9): c.drawLine(px + q, py - 17, px + q, py - 9, stroke(OUT, 2.5))
    c.restore()
    c.drawPath(body, stroke(OUT, 5.5, join='round'))
    my = -196 - 28 * b
    mouth = P(('M', -52 * open_ - 8, my), ('Q', 0, my - 30 * open_ - 4, 52 * open_ + 8, my), ('Q', 0, my + 26 * open_ + 4, -52 * open_ - 8, my), ('Z',))
    shp(c, mouth, 0xFF4E3A1D, 5)
    c.drawPath(P(('M', -58, my + 14), ('Q', 0, my + 34, 58, my + 14)), stroke(0xFF7A5B2E, 7))

def time_box(c, t=0.0, glow=0.0, w=620.0, h=430.0):
    """Cardboard-box 'time machine' (origin = bottom centre)."""
    box = P(('M', -w / 2, 0), ('L', -w / 2 + 8, -h), ('L', w / 2 - 8, -h), ('L', w / 2, 0), ('Z',))
    shp(c, box, 0xFFC99B62, 6)
    c.save(); c.clipPath(box, True)
    for i in range(18):
        y = -h + i * h / 17
        c.drawLine(-w / 2, y, w / 2, y + wiggle(i, 1, 3, 4), stroke(0xFFB98A52, 2.2))
    c.drawRect(skia.Rect.MakeLTRB(-w / 2, -h, -w / 2 + 70, 0), fill(0xFF000000, 0.07))
    c.restore()
    # flaps
    fl = P(('M', -w / 2 + 8, -h), ('L', -w / 2 - 54, -h - 60), ('L', -40, -h - 76), ('L', -6, -h), ('Z',)); shp(c, fl, 0xFFD7AB73, 6)
    fr = P(('M', w / 2 - 8, -h), ('L', w / 2 + 58, -h - 52), ('L', 44, -h - 80), ('L', 6, -h), ('Z',)); shp(c, fr, 0xFFBE8F58, 6)
    c.drawPath(box, stroke(OUT, 6, join='round'))
    # tape
    tp = P(('M', -44, -h + 2), ('L', 40, -h + 2), ('L', 36, -h + 120), ('L', -38, -h + 112), ('Z',)); c.drawPath(tp, fill(0xFFE9DEC3, 0.92)); c.drawPath(tp, stroke(OUT, 3))
    # marker lettering
    with xf(c, 26, -h * 0.50, 1.0, -3.5):
        text(c, "TIME", 0, 0, "PermanentMarker", 112, 0xFF1B1B1B)
        text(c, "MACHINE", 0, 100, "PermanentMarker", 98, 0xFF1B1B1B)
    with xf(c, 214, -40, 1.0, 5):
        text(c, "(real)", 0, 0, "PermanentMarker", 42, 0xFFB3261E)
    # kitchen-timer dial + antenna
    with xf(c, -246, -h + 70, 0.9):
        c.drawCircle(0, 0, 44, fill(0xFFF4F1E8)); c.drawCircle(0, 0, 44, stroke(OUT, 5))
        for i in range(12):
            a = math.radians(i * 30); c.drawLine(34 * math.cos(a), 34 * math.sin(a), 40 * math.cos(a), 40 * math.sin(a), stroke(OUT, 3))
        a = t * 14
        c.drawLine(0, 0, 30 * math.cos(a), 30 * math.sin(a), stroke(0xFFE3242B, 6)); c.drawCircle(0, 0, 6, fill(OUT))
    ant = P(('M', 150, -h - 20), ('L', 176, -h - 190))
    c.drawPath(ant, stroke(OUT, 9)); c.drawPath(ant, stroke(0xFFB9BCC2, 4))
    bl = 0.5 + 0.5 * math.sin(t * 20)
    if glow > 0:
        p = fill(0xFFFFF27A, 0.8 * glow); p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 26)); c.drawCircle(176, -h - 196, 44 * (0.7 + 0.3 * bl), p)
    c.drawCircle(176, -h - 196, 17, fill(mix(0xFFB3261E, 0xFFFFE23A, glow * bl))); c.drawCircle(176, -h - 196, 17, stroke(OUT, 4.5))

def hay_bale(c, w=190.0, h=96.0, seed=0):
    b = rrect(-w / 2, -h, w, h, 14)
    shp(c, b, 0xFFE0B94F, 4.5)
    c.save(); c.clipPath(b, True)
    for i in range(46):
        x = -w / 2 + rnd(i, seed) * w; y = -h + rnd(i, seed + 3) * h
        c.drawLine(x, y, x + 10 + 16 * rnd(i, seed + 5), y + (rnd(i, seed + 7) - 0.5) * 6, stroke(0xFFB98F2E if i % 2 else 0xFFF2D579, 2.4))
    c.restore()
    for x in (-w * 0.24, w * 0.24):
        c.drawLine(x, -h, x, 0, stroke(OUT, 5)); c.drawLine(x, -h, x, 0, stroke(0xFF8A5A2B, 2))
    c.drawPath(b, stroke(OUT, 4.5))

def tree(c, s=1.0, seed=0, sway=0.0):
    with xf(c, 0, 0, s):
        tr = P(('M', -20, 0), ('Q', -10, -90, -16, -190), ('L', 18, -190), ('Q', 10, -90, 24, 0), ('Z',)); shp(c, tr, 0xFF7A5230, 4.5)
        with xf(c, sway, 0):
            blobs = [(-70, -230, 86, 0xFF4E8B3A), (62, -240, 92, 0xFF4E8B3A), (0, -320, 104, 0xFF5E9E44), (-20, -230, 80, 0xFF5E9E44)]
            sil = None
            for (x, y, r, col_) in blobs:
                bp = blob(x, y, r, r * 0.86, seed + int(x), 0.1, 11)
                sil = bp if sil is None else skia.Op(sil, bp, skia.PathOp.kUnion_PathOp)
            c.drawPath(sil, stroke(OUT, 9))
            for (x, y, r, col_) in blobs:
                c.drawPath(blob(x, y, r, r * 0.86, seed + int(x), 0.1, 11), fill(col_))
            c.drawPath(P(('M', -80, -300), ('Q', -40, -360, 20, -350)), stroke(0xFF79B85A, 9))

def spectator(c, x, y, s=1.0, seed=0, t=0.0, hat=True, cheer=0.0, lw=None):
    """Tiny background onlooker (stick body, white head, period hat)."""
    lw = lw or 4.2 * s; pen = stroke(OUT, lw)
    bob = wiggle(t, 1.1 + 0.4 * rnd(seed, 1), 2.5 * s, seed)
    hy = y - 118 * s + bob
    c.drawLine(x, y - 58 * s, x - 12 * s, y, pen); c.drawLine(x, y - 58 * s, x + 12 * s, y, pen)
    c.drawLine(x, y - 58 * s, x, hy + 20 * s, pen)
    arm = cheer * 40 * s
    c.drawLine(x, hy + 30 * s, x - 22 * s, hy + (62 * s - arm * 2.4), pen); c.drawLine(x, hy + 30 * s, x + 22 * s, hy + (62 * s - arm * 2.1), pen)
    hd = blob(x, hy, 21 * s, 20 * s, seed, 0.05, 10); shp(c, hd, 0xFFFFFFFF, lw * 0.9)
    for dx in (-6, 6): c.drawLine(x + dx * s, hy - 3 * s, x + dx * s, hy + 4 * s, stroke(OUT, lw * 0.7))
    if hat:
        hc = (0xFF6B5B45, 0xFF3D4752, 0xFF8A6A3C, 0xFF4B4B4B)[seed % 4]
        if seed % 3 == 0:                                                       # flat cap
            cap = P(('M', x - 22 * s, hy - 10 * s), ('Q', x - 18 * s, hy - 30 * s, x + 6 * s, hy - 27 * s), ('Q', x + 26 * s, hy - 24 * s, x + 32 * s, hy - 10 * s), ('Z',))
        else:                                                                   # trilby
            cap = P(('M', x - 30 * s, hy - 12 * s), ('L', x - 16 * s, hy - 14 * s), ('Q', x - 16 * s, hy - 38 * s, x, hy - 38 * s), ('Q', x + 16 * s, hy - 38 * s, x + 16 * s, hy - 14 * s),
                    ('L', x + 30 * s, hy - 12 * s), ('L', x + 28 * s, hy - 7 * s), ('L', x - 28 * s, hy - 7 * s), ('Z',))
        shp(c, cap, hc, lw * 0.85)

def reaper(c, x, y, s=1.0, t=0.0, wave=0.0, face=1):
    """Friendly neighbourhood grim reaper (origin at the feet)."""
    with xf(c, x, y, s, sx=s * face, sy=s):
        sway = wiggle(t, 0.7, 5, 21)
        # scythe (held in the far hand)
        c.drawLine(-66, 6, -92 + sway * 0.4, -468, stroke(OUT, 14)); c.drawLine(-66, 6, -92 + sway * 0.4, -468, stroke(0xFF8A5A2B, 7))
        bl = P(('M', -94, -470), ('Q', 30, -520, 120, -400), ('Q', 30, -462, -90, -436), ('Z',)); shp(c, bl, 0xFFD5DADF, 5)
        c.drawPath(P(('M', -70, -462), ('Q', 30, -494, 100, -416)), stroke(0xFFFFFFFF, 4, 0.9))
        robe = P(('M', -92, 0), ('Q', -84, -150, -58, -258), ('Q', -66, -360, 0, -372), ('Q', 66, -360, 58, -258), ('Q', 84, -150, 96, 0),
                 ('Q', 66, -14, 44, 0), ('Q', 20, -14, 0, 0), ('Q', -24, -14, -46, 0), ('Q', -70, -14, -92, 0), ('Z',))
        shp(c, robe, 0xFF1D1D22, 5.5)
        c.drawPath(P(('M', -40, -240), ('Q', -52, -110, -58, -20)), stroke(0xFF34343C, 6)); c.drawPath(P(('M', 30, -230), ('Q', 46, -110, 54, -20)), stroke(0xFF34343C, 6))
        hood = P(('M', -52, -262), ('Q', -72, -372, 0, -382), ('Q', 72, -372, 52, -262), ('Q', 0, -238, -52, -262), ('Z',)); shp(c, hood, 0xFF1D1D22, 5.5)
        fc = blob(4, -306, 36, 40, 2, 0.03, 12); c.drawPath(fc, fill(0xFF08080A))
        for dx in (-9, 17):                                                       # glowing eyes
            c.drawCircle(dx, -310, 6.5, fill(0xFFFFFFFF))
        c.drawPath(P(('M', -6, -290), ('Q', 5, -281, 18, -291)), stroke(0xFFFFFFFF, 3.4))
        # waving arm (near side)
        a = math.radians(-58 + 26 * math.sin(t * 9) * wave - 30 * wave)
        ex, ey = 62 + 96 * math.cos(a), -236 + 96 * math.sin(a)
        sl = P(('M', 44, -250), ('L', 64, -222), ('L', ex + 12, ey + 14), ('L', ex - 10, ey - 12), ('Z',)); shp(c, sl, 0xFF1D1D22, 5)
        c.drawCircle(ex + 6, ey - 4, 13, fill(0xFFF1EEE6)); c.drawCircle(ex + 6, ey - 4, 13, stroke(OUT, 4))
        for i in range(3):
            fa = a + math.radians(-34 + i * 30)
            c.drawLine(ex + 6, ey - 4, ex + 6 + 26 * math.cos(fa), ey - 4 + 26 * math.sin(fa), stroke(OUT, 8)); c.drawLine(ex + 6, ey - 4, ex + 6 + 26 * math.cos(fa), ey - 4 + 26 * math.sin(fa), stroke(0xFFF1EEE6, 4))

def photo_print(c, im, x, y, w, rot=0.0, caption=None, src=None, tape=True, k=1.0, sepia=1.0, cap_font="Caveat"):
    """Aged photo print with white border, tape and handwritten caption; (x, y) = centre."""
    if k <= 0: return
    sw, sh_ = (src[2] - src[0], src[3] - src[1]) if src else (im.width(), im.height())
    h = w * sh_ / sw
    bw, bot = w * 0.045, w * (0.17 if caption else 0.045)
    with xf(c, x, y, k, rot):
        fr = skia.Rect.MakeLTRB(-w / 2 - bw, -h / 2 - bw, w / 2 + bw, h / 2 + bot)
        sp = fill(0xFF000000, 0.35); sp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 16))
        c.drawRect(fr.makeOffset(10, 16), sp)
        c.drawRect(fr, fill(0xFFF3ECD9)); c.drawRect(fr, stroke(0xFFCDC3A8, 2))
        p = skia.Paint(AntiAlias=True); p.setColorFilter(sepia_filter(sepia))
        dst = skia.Rect.MakeLTRB(-w / 2, -h / 2, w / 2, h / 2)
        srcr = skia.Rect.MakeLTRB(*src) if src else skia.Rect.MakeWH(im.width(), im.height())
        c.drawImageRect(im, srcr, dst, skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kLinear), p)
        c.save(); c.clipRect(dst)
        vg = skia.Paint(AntiAlias=True); vg.setShader(rad_grad(0, 0, w * 0.72, [0x00000000, 0x00000000, 0x88301E0A], [0, 0.55, 1]))
        c.drawRect(dst, vg)
        for i in range(5):                                                       # creases / scuffs
            xx = -w / 2 + rnd(i, 31) * w
            c.drawLine(xx, -h / 2, xx + (rnd(i, 32) - 0.5) * 40, h / 2, stroke(0xFFFFFFFF, 1.5, 0.22))
        c.restore()
        c.drawRect(dst, stroke(0xFF3A2A18, 1.5, 0.5))
        if caption:
            text(c, caption, 0, h / 2 + bot * 0.70, cap_font, w * 0.085, 0xFF2A2420)
        if tape:
            for sx_, rr in ((-1, -38), (1, 34)):
                with xf(c, sx_ * (w / 2 + bw * 0.4), -h / 2 - bw * 0.3, 1.0, rr):
                    tpz = skia.Rect.MakeLTRB(-w * 0.09, -w * 0.028, w * 0.09, w * 0.028)
                    c.drawRect(tpz, fill(0xFFE8DCA8, 0.85)); c.drawRect(tpz, stroke(0xFFB7A972, 1.5, 0.8))

def modern_wheel(c, s=1.0, t=0.0, lit=1.0):
    """Modern F1 steering wheel, front view, centred at origin (~±170 wide)."""
    with xf(c, 0, 0, s):
        body = P(('M', -150, -74), ('Q', -168, -96, -140, -104), ('L', -64, -104), ('Q', -40, -116, 40, -116), ('L', 64, -104), ('L', 140, -104), ('Q', 168, -96, 150, -74),
                 ('Q', 172, 0, 160, 66), ('Q', 150, 104, 112, 100), ('Q', 92, 96, 84, 70), ('L', 70, 50), ('Q', 0, 74, -70, 50), ('L', -84, 70),
                 ('Q', -92, 96, -112, 100), ('Q', -150, 104, -160, 66), ('Q', -172, 0, -150, -74), ('Z',))
        shp(c, body, 0xFF202227, 6)
        for sg in (-1, 1):                                                        # grips
            g = P(('M', sg * 150, -70), ('Q', sg * 170, 0, sg * 158, 66), ('Q', sg * 148, 98, sg * 114, 96), ('Q', sg * 100, 60, sg * 104, 0), ('Q', sg * 106, -50, sg * 150, -70), ('Z',))
            shp(c, g, 0xFF34373D, 4)
            for i in range(5): c.drawLine(sg * 118, -30 + i * 24, sg * 150, -36 + i * 24, stroke(0xFF1A1B1F, 3))
        scr = rrect(-58, -92, 116, 74, 8); shp(c, scr, 0xFF0A0F16, 4)
        text(c, "7", -4, -34, "Anton", 50, mix(0xFF2A3B2A, 0xFF7CFF8A, lit))
        text(c, "312", 36, -66, "Anton", 17, mix(0xFF2A3B2A, 0xFFFFFFFF, lit)); text(c, "KMH", 36, -50, "Anton", 11, mix(0xFF2A3B2A, 0xFF9AA0A8, lit))
        for i in range(9):                                                        # shift lights
            colr = (0xFF39D98A, 0xFF39D98A, 0xFF39D98A, 0xFFE3242B, 0xFFE3242B, 0xFFE3242B, 0xFF3A7BFF, 0xFF3A7BFF, 0xFF3A7BFF)[i]
            on = lit > 0 and (int(t * 12) % 11) > i
            c.drawCircle(-44 + i * 11, -100, 4.4, fill(colr if on else 0xFF3A3D44))
        btn = [(-84, -58, 0xFFE3242B), (-84, -26, 0xFFFFC906), (-88, 8, 0xFF39D98A), (84, -58, 0xFF3A7BFF), (84, -26, 0xFFFF8A1E), (88, 8, 0xFFFFFFFF),
               (-52, 4, 0xFFB56BFF), (52, 4, 0xFF39D98A), (-30, 30, 0xFFFFC906), (30, 30, 0xFFE3242B), (0, 34, 0xFF3A7BFF), (-112, -84, 0xFFFFFFFF), (112, -84, 0xFFFFC906)]
        for i, (bx, by, bc) in enumerate(btn):
            pr = 1 + 0.12 * math.sin(t * 5 + i) * lit
            c.drawCircle(bx, by, 10.5 * pr, fill(bc)); c.drawCircle(bx, by, 10.5 * pr, stroke(OUT, 3)); c.drawCircle(bx - 3, by - 3, 3, fill(0xFFFFFFFF, 0.6))
        for (dx_, dy_) in ((-54, -4 + 44, ), (54, 40)):                           # rotary dials
            c.drawCircle(dx_, dy_ + 14, 14, fill(0xFF6E737B)); c.drawCircle(dx_, dy_ + 14, 14, stroke(OUT, 3.4))
            a = math.radians(t * 40 + dx_); c.drawLine(dx_, dy_ + 14, dx_ + 11 * math.cos(a), dy_ + 14 + 11 * math.sin(a), stroke(0xFFFFFFFF, 3))

def wood_wheel(c, s=1.0, rot=0.0):
    """1950s wood-rim wheel with three drilled alloy spokes, centred at origin (r ~170)."""
    with xf(c, 0, 0, s, rot):
        R = 168
        c.drawCircle(0, 0, R, stroke(OUT, 38)); c.drawCircle(0, 0, R, stroke(0xFF9A6230, 28))
        c.drawCircle(0, 0, R + 6, stroke(0xFFC48A4C, 5)); c.drawCircle(0, 0, R - 8, stroke(0xFF6E431F, 4))
        for i in range(24):                                                       # rivets + grain
            a = 2 * math.pi * i / 24
            c.drawCircle(R * math.cos(a), R * math.sin(a), 3.6, fill(0xFFE8D7B0)); c.drawCircle(R * math.cos(a), R * math.sin(a), 3.6, stroke(OUT, 1.6))
        for ang in (90, 210, 330):
            with xf(c, 0, 0, 1, ang):
                spk = P(('M', 24, -16), ('L', R - 18, -11), ('L', R - 18, 11), ('L', 24, 16), ('Z',)); shp(c, spk, 0xFFC9CDD3, 4.5)
                for k_ in range(4):
                    c.drawCircle(50 + k_ * 26, 0, 6.5, fill(0xFF4A4D55)); c.drawCircle(50 + k_ * 26, 0, 6.5, stroke(OUT, 2.4))
        c.drawCircle(0, 0, 34, fill(0xFFC9CDD3)); c.drawCircle(0, 0, 34, stroke(OUT, 5))
        c.drawCircle(0, 0, 19, fill(0xFFB3261E)); c.drawCircle(0, 0, 19, stroke(OUT, 3.5))
        c.drawPath(P(('M', -7, 8), ('L', -7, -8), ('L', 0, -2), ('L', 7, -8), ('L', 7, 8)), stroke(0xFFF4E9C9, 3))

def couch(c, w=560.0, colr=0xFF4F7CAC):
    dk = shade(colr, -0.25)
    back = rrect(-w / 2 + 30, -250, w - 60, 190, 44); shp(c, back, colr, 5.5)
    c.drawLine(0, -236, 0, -110, stroke(dk, 5))
    seat = rrect(-w / 2 + 16, -128, w - 32, 96, 34); shp(c, seat, shade(colr, 0.12), 5.5)
    c.drawLine(0, -124, 0, -40, stroke(dk, 5))
    for sg in (-1, 1):
        arm = rrect(sg * (w / 2 - 20) - 46, -176, 92, 160, 40); shp(c, arm, colr, 5.5)
        c.drawLine(sg * (w / 2 - 70), 0, sg * (w / 2 - 70), -18, stroke(OUT, 12))
    c.drawRoundRect(skia.Rect.MakeLTRB(-w / 2 + 30, -44, w / 2 - 30, -14), 10, 10, fill(dk)); c.drawRoundRect(skia.Rect.MakeLTRB(-w / 2 + 30, -44, w / 2 - 30, -14), 10, 10, stroke(OUT, 5.5))

def juice_box(c, s=1.0):
    with xf(c, 0, 0, s):
        b = P(('M', -24, 0), ('L', -24, -70), ('L', 24, -70), ('L', 24, 0), ('Z',)); shp(c, b, 0xFFFF8A1E, 4)
        tpp = P(('M', -24, -70), ('L', -12, -84), ('L', 34, -84), ('L', 24, -70), ('Z',)); shp(c, tpp, 0xFFFFB05E, 4)
        sd = P(('M', 24, -70), ('L', 34, -84), ('L', 34, -12), ('L', 24, 0), ('Z',)); shp(c, sd, 0xFFD96E0C, 4)
        c.drawCircle(0, -36, 14, fill(0xFFFFE23A)); c.drawCircle(0, -36, 14, stroke(OUT, 3))
        st = P(('M', 6, -80), ('L', 10, -112), ('L', 30, -122)); c.drawPath(st, stroke(OUT, 8)); c.drawPath(st, stroke(0xFFFFFFFF, 4))
        c.drawLine(8, -96, 12, -96, stroke(0xFFE3242B, 4))

def tablet(c, s=1.0, rot=0.0, lit=1.0, t=0.0):
    with xf(c, 0, 0, s, rot):
        b = rrect(-52, -36, 104, 72, 9); shp(c, b, 0xFF202227, 4)
        scr = rrect(-45, -29, 90, 58, 4); c.drawPath(scr, fill(mix(0xFF0A0F16, 0xFF6FD0F5, lit)))
        c.save(); c.clipPath(scr, True)
        c.drawPath(P(('M', -10, -29), ('L', 4, -29), ('L', 40, 29), ('L', -46, 29), ('Z',)), fill(0xFF55585E, lit))
        c.drawLine(-3, -26, -2, 26, stroke(0xFFFFFFFF, 2.5, 0.8 * lit))
        c.restore()
