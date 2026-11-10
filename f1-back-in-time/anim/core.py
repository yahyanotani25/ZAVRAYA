"""Core drawing / timing helpers for the cut-out animation (Skia raster)."""
import math, os, functools
import numpy as np
import skia

W, H, FPS = 1920, 1080, 30
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")

INK = 0xFF141414          # line colour used for all hand-drawn strokes
PAPER = 0xFFFBFAF6

# ----------------------------------------------------------------------------- timing
def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x

def lerp(a, b, t):
    return a + (b - a) * t

def seg(t, t0, t1):
    """0..1 progress of t through [t0, t1]."""
    return clamp((t - t0) / (t1 - t0)) if t1 > t0 else float(t >= t1)

def ease_in(t, p=3):  return clamp(t) ** p
def ease_out(t, p=3): return 1 - (1 - clamp(t)) ** p
def ease_io(t, p=3):
    t = clamp(t)
    return 0.5 * (2 * t) ** p if t < 0.5 else 1 - 0.5 * (2 - 2 * t) ** p

def back_out(t, s=1.9):
    t = clamp(t) - 1
    return t * t * ((s + 1) * t + s) + 1

def back_in(t, s=1.9):
    t = clamp(t)
    return t * t * ((s + 1) * t - s)

def elastic_out(t, amp=1.0, period=0.38):
    t = clamp(t)
    if t in (0, 1): return t
    return amp * 2 ** (-9 * t) * math.sin((t - period / 4) * 2 * math.pi / period) + 1

def bounce_out(t):
    t = clamp(t)
    if t < 1 / 2.75: return 7.5625 * t * t
    if t < 2 / 2.75: t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75
    if t < 2.5 / 2.75: t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375
    t -= 2.625 / 2.75; return 7.5625 * t * t + 0.984375

def settle(t, t0, freq=18.0, damp=7.0):
    """Damped wobble that starts at 1 and dies to 0 (for impacts / jiggles)."""
    x = t - t0
    return 0.0 if x < 0 else math.exp(-damp * x) * math.cos(freq * x)

def pop(t, t0, dur=0.26, s=2.2):
    """Scale factor for a 'pop in' at t0 (0 before, overshoot, 1 after)."""
    return 0.0 if t < t0 else back_out(seg(t, t0, t0 + dur), s)

def pulse(t, t0, dur=0.22, amt=0.12):
    """1 + bump that peaks right after t0 (for emphasis hits)."""
    x = seg(t, t0, t0 + dur)
    return 1.0 if (t < t0 or x >= 1) else 1 + amt * math.sin(math.pi * x) * (1 - x * 0.4)

def keys(t, pts, ease=ease_io):
    """Piecewise interpolation through [(time, value), ...]; values may be tuples."""
    if t <= pts[0][0]: return pts[0][1]
    for (ta, va), (tb, vb) in zip(pts, pts[1:]):
        if t <= tb:
            k = ease(seg(t, ta, tb))
            if isinstance(va, (tuple, list)):
                return tuple(lerp(a, b, k) for a, b in zip(va, vb))
            return lerp(va, vb, k)
    return pts[-1][1]

def on_twos(t, n=2):
    """Quantise time to every n-th frame (hand-animated 'on twos' feel)."""
    return math.floor(t * FPS / n) * n / FPS

# ----------------------------------------------------------------------------- noise
def _hash(i, seed):
    x = (i * 374761393 + seed * 668265263) & 0xFFFFFFFF
    x = ((x ^ (x >> 13)) * 1274126177) & 0xFFFFFFFF
    return ((x ^ (x >> 16)) & 0xFFFF) / 32767.5 - 1.0

def noise(x, seed=0):
    """Smooth 1-D value noise in [-1, 1]."""
    i = math.floor(x); f = x - i
    u = f * f * (3 - 2 * f)
    return lerp(_hash(i, seed), _hash(i + 1, seed), u)

def wiggle(t, freq, amp, seed=0):
    return amp * (noise(t * freq, seed) * 0.7 + noise(t * freq * 2.13, seed + 7) * 0.3)

def rnd(i, seed=0):
    """Deterministic pseudo-random in [0, 1)."""
    return (_hash(i, seed) + 1) / 2

# ----------------------------------------------------------------------------- paints
def col(c, a=1.0):
    """0xAARRGGBB / '#rrggbb' -> skia colour with alpha multiplier."""
    if isinstance(c, str):
        c = int(c.lstrip('#'), 16) | 0xFF000000
    if a < 1.0:
        al = int(((c >> 24) & 0xFF) * clamp(a))
        c = (c & 0x00FFFFFF) | (al << 24)
    return c

def fill(c, a=1.0):
    return skia.Paint(AntiAlias=True, Color=col(c, a), Style=skia.Paint.kFill_Style)

def stroke(c=INK, w=6.0, a=1.0, cap='round', join='round'):
    p = skia.Paint(AntiAlias=True, Color=col(c, a), Style=skia.Paint.kStroke_Style, StrokeWidth=w)
    p.setStrokeCap({'round': skia.Paint.kRound_Cap, 'butt': skia.Paint.kButt_Cap, 'square': skia.Paint.kSquare_Cap}[cap])
    p.setStrokeJoin({'round': skia.Paint.kRound_Join, 'miter': skia.Paint.kMiter_Join, 'bevel': skia.Paint.kBevel_Join}[join])
    return p

def mix(c1, c2, t):
    c1, c2 = col(c1), col(c2)
    out = 0
    for sh in (24, 16, 8, 0):
        out |= int(lerp((c1 >> sh) & 0xFF, (c2 >> sh) & 0xFF, clamp(t))) << sh
    return out

def shade(c, k):
    """Darken (k<0) or lighten (k>0) a colour."""
    return mix(c, 0xFF000000 if k < 0 else 0xFFFFFFFF, abs(k))

# ----------------------------------------------------------------------------- transforms
class xf:
    """with xf(c, x, y, s, rot_deg, sx, sy): ... (translate, rotate, scale)."""
    def __init__(self, c, x=0, y=0, s=1.0, r=0.0, sx=None, sy=None, skew=0.0):
        self.c, self.a = c, (x, y, s, r, sx, sy, skew)
    def __enter__(self):
        x, y, s, r, sx, sy, skew = self.a
        self.c.save(); self.c.translate(x, y)
        if r: self.c.rotate(r)
        if skew: self.c.skew(skew, 0)
        self.c.scale(s if sx is None else sx, s if sy is None else sy)
        return self.c
    def __exit__(self, *e):
        self.c.restore()

class layer:
    """with layer(c, alpha=.., blur=..): draws into an offscreen layer."""
    def __init__(self, c, alpha=1.0, blur=0.0, bounds=None, paint=None):
        self.c = c
        p = paint or skia.Paint()
        if alpha < 1.0: p.setAlphaf(clamp(alpha))
        if blur > 0: p.setImageFilter(skia.ImageFilters.Blur(blur, blur))
        self.p, self.b = p, bounds
    def __enter__(self):
        self.c.saveLayer(self.b, self.p); return self.c
    def __exit__(self, *e):
        self.c.restore()

# ----------------------------------------------------------------------------- paths
def P(*cmds):
    """Tiny path builder: P(('M',x,y),('L',x,y),('C',x1,y1,x2,y2,x,y),('Q',x1,y1,x,y),('Z',))."""
    p = skia.Path()
    for cm in cmds:
        k = cm[0]
        if k == 'M': p.moveTo(cm[1], cm[2])
        elif k == 'L': p.lineTo(cm[1], cm[2])
        elif k == 'C': p.cubicTo(*cm[1:7])
        elif k == 'Q': p.quadTo(*cm[1:5])
        elif k == 'Z': p.close()
    return p

def spline(pts, closed=False, tension=0.5):
    """Smooth Catmull-Rom path through points."""
    n = len(pts); p = skia.Path()
    if n < 2: return p
    def pt(i):
        if closed: return pts[i % n]
        return pts[max(0, min(n - 1, i))]
    p.moveTo(*pts[0])
    last = n if closed else n - 1
    for i in range(last):
        p0, p1, p2, p3 = pt(i - 1), pt(i), pt(i + 1), pt(i + 2)
        k = tension / 3 * 2
        c1 = (p1[0] + (p2[0] - p0[0]) * k / 2, p1[1] + (p2[1] - p0[1]) * k / 2)
        c2 = (p2[0] - (p3[0] - p1[0]) * k / 2, p2[1] - (p3[1] - p1[1]) * k / 2)
        p.cubicTo(c1[0], c1[1], c2[0], c2[1], p2[0], p2[1])
    if closed: p.close()
    return p

def poly(pts, closed=True):
    p = skia.Path(); p.moveTo(*pts[0])
    for q in pts[1:]: p.lineTo(*q)
    if closed: p.close()
    return p

def rough(path, amp=1.6, wave=70.0, seed=1, step=9.0, closed=None):
    """Re-draw a path with a slow organic wobble so it reads as a hand-drawn line."""
    out = skia.Path()
    it = skia.PathMeasure(path, False)
    ci = 0
    while True:
        L = it.getLength()
        if L > 0.5:
            is_closed = it.isClosed() if closed is None else closed
            n = max(3, int(L / step))
            pts = []
            for i in range(n + (0 if is_closed else 1)):
                d = L * i / n
                pos, tan = it.getPosTan(d)
                # fade the wobble out at open ends so joints still meet
                k = 1.0 if is_closed else min(1.0, min(d, L - d) / (wave * 0.35) + 0.15)
                if is_closed:
                    ph = 2 * math.pi * i / n
                    o = amp * (math.sin(ph * max(1, round(L / wave)) + seed * 1.7 + ci) * 0.6
                               + math.sin(ph * max(2, round(L / wave * 2.3)) + seed * 3.1) * 0.4)
                else:
                    o = amp * k * (noise(d / wave, seed + ci * 13) * 0.7 + noise(d / wave * 2.7, seed + 5) * 0.3)
                pts.append((pos.x() - tan.y() * o, pos.y() + tan.x() * o))
            out.addPath(spline(pts, closed=is_closed))
        ci += 1
        if not it.nextContour(): break
    return out

def circle_pts(cx, cy, rx, ry=None, n=24, rot=0.0):
    ry = rx if ry is None else ry
    cr, sr = math.cos(rot), math.sin(rot)
    out = []
    for i in range(n):
        a = 2 * math.pi * i / n
        x, y = rx * math.cos(a), ry * math.sin(a)
        out.append((cx + x * cr - y * sr, cy + x * sr + y * cr))
    return out

def blob(cx, cy, rx, ry, seed=0, amp=0.06, n=14):
    """Slightly irregular hand-drawn ellipse."""
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        k = 1 + amp * (math.sin(a * 2 + seed) * 0.6 + math.sin(a * 3 + seed * 2.3) * 0.4)
        pts.append((cx + rx * k * math.cos(a), cy + ry * k * math.sin(a)))
    return spline(pts, closed=True)

def rrect(x, y, w, h, r):
    p = skia.Path(); p.addRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), r, r)); return p

# ----------------------------------------------------------------------------- text
_fonts = {}
def font(name, size):
    key = (name, round(size, 2))
    if key not in _fonts:
        tfk = ('tf', name)
        if tfk not in _fonts:
            _fonts[tfk] = skia.Typeface.MakeFromFile(os.path.join(ASSETS, "fonts", name + ".ttf"))
        f = skia.Font(_fonts[tfk], size)
        f.setSubpixel(True); f.setEdging(skia.Font.Edging.kAntiAlias)
        _fonts[key] = f
    return _fonts[key]

def text_w(s, name, size, track=0.0):
    return font(name, size).measureText(s) + track * max(0, len(s) - 1)

def text_path(s, name, size, track=0.0):
    """Outline path of a string, origin at left baseline."""
    f = font(name, size); out = skia.Path(); x = 0.0
    glyphs = f.textToGlyphs(s); widths = f.getWidths(glyphs)
    for g, w in zip(glyphs, widths):
        gp = f.getPath(g)
        if gp is not None:
            out.addPath(gp, x, 0)
        x += w + track
    return out, x - track

def text(c, s, x, y, name="Bangers", size=80, color=INK, align='c', outline=None, ow=0, track=0.0,
         shadow=None, sh=(0, 6), a=1.0, rough_amp=0.0, seed=3):
    """Draw text; y is the baseline. outline=(colour) draws a stroke behind the fill."""
    p, w = text_path(s, name, size, track)
    ox = x - (w / 2 if align == 'c' else w if align == 'r' else 0)
    if rough_amp: p = rough(p, rough_amp, 40, seed, 6)
    c.save(); c.translate(ox, y)
    if shadow is not None:
        c.save(); c.translate(*sh)
        if outline is not None and ow: c.drawPath(p, stroke(shadow, ow, a, join='round'))
        c.drawPath(p, fill(shadow, a)); c.restore()
    if outline is not None and ow:
        c.drawPath(p, stroke(outline, ow, a, join='round'))
    c.drawPath(p, fill(color, a))
    c.restore()
    return w

# ----------------------------------------------------------------------------- images
_SAMP = skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kLinear)
_SAMP_NEAR = skia.SamplingOptions(skia.FilterMode.kNearest, skia.MipmapMode.kNone)

@functools.lru_cache(maxsize=None)
def image(rel):
    path = rel if os.path.isabs(rel) else os.path.join(ASSETS, rel)
    im = skia.Image.open(path)
    if im is None: raise FileNotFoundError(path)
    return im.withDefaultMipmaps() if hasattr(im, "withDefaultMipmaps") else im

def draw_img(c, im, cx, cy, w=None, h=None, a=1.0, anchor=(0.5, 0.5), paint=None, nearest=False):
    """Draw image so that its anchor point sits at (cx, cy); w/h in canvas px."""
    iw, ih = im.width(), im.height()
    if w is None and h is None: w, h = iw, ih
    elif h is None: h = w * ih / iw
    elif w is None: w = h * iw / ih
    p = paint or skia.Paint(AntiAlias=True)
    if a < 1.0: p.setAlphaf(clamp(a))
    dst = skia.Rect.MakeXYWH(cx - w * anchor[0], cy - h * anchor[1], w, h)
    c.drawImageRect(im, skia.Rect.MakeWH(iw, ih), dst, _SAMP_NEAR if nearest else _SAMP, p)

def cover(c, im, a=1.0, zoom=1.0, ox=0.0, oy=0.0, paint=None, w=W, h=H):
    """Fill the frame with an image (centre-crop), optional zoom/offset in px."""
    s = max(w / im.width(), h / im.height()) * zoom
    draw_img(c, im, w / 2 + ox, h / 2 + oy, im.width() * s, im.height() * s, a, paint=paint)

def np_image(arr):
    """RGBA uint8 numpy -> skia image."""
    return skia.Image.fromarray(np.ascontiguousarray(arr), colorType=skia.kRGBA_8888_ColorType)

# ----------------------------------------------------------------------------- misc drawing
def line(c, x0, y0, x1, y1, w=6, color=INK, a=1.0):
    c.drawLine(x0, y0, x1, y1, stroke(color, w, a))

def soft_shadow(c, cx, cy, rx, ry, a=0.28):
    p = fill(0xFF000000, a); p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, ry * 0.55))
    c.drawOval(skia.Rect.MakeLTRB(cx - rx, cy - ry, cx + rx, cy + ry), p)

def lin_grad(x0, y0, x1, y1, colors, pos=None):
    return skia.GradientShader.MakeLinear([skia.Point(x0, y0), skia.Point(x1, y1)], [col(k) for k in colors], pos)

def rad_grad(cx, cy, r, colors, pos=None):
    return skia.GradientShader.MakeRadial(skia.Point(cx, cy), r, [col(k) for k in colors], pos)

def color_matrix(m):
    return skia.ColorFilters.Matrix(m)

def sepia_filter(amount=1.0, warm=1.0):
    """Colour filter that pulls an image toward a warm sepia; amount 0..1."""
    r = [0.393, 0.769, 0.189]; g = [0.349, 0.686, 0.168]; b = [0.272, 0.534, 0.131]
    I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
    rows = []
    for i, row in enumerate((r, g, b)):
        rows += [lerp(I[i][j], row[j] * (1 + (0.06 if i == 0 else -0.04 if i == 2 else 0) * warm), amount) for j in range(3)] + [0, 0]
    return skia.ColorFilters.Matrix(rows + [0, 0, 0, 1, 0])
