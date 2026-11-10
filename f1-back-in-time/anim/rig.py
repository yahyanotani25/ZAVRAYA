"""Stick-figure rig: the narrator (drawn head) and the drivers (photo cut-out heads)."""
import math
import skia
from .core import *

LEG, TORSO, ARM = 205.0, 150.0, 168.0
HEAD_W = 150.0

DEFAULT_POSE = dict(lean=0.0, crouch=0.0, bend=0.0, tilt=0.0, hx=0.0, hy=0.0, hsx=1.0, hsy=1.0,
                    lh=(-20.0, 152.0), rh=(20.0, 152.0), lb=-1.0, rb=1.0,
                    lf=(-30.0, 0.0), rf=(30.0, 0.0), lk=-1.0, rk=1.0, hipx=0.0)

def pose(**kw):
    p = dict(DEFAULT_POSE); p.update(kw); return p

def mixpose(a, b, k):
    out = {}
    for key in DEFAULT_POSE:
        va, vb = a.get(key, DEFAULT_POSE[key]), b.get(key, DEFAULT_POSE[key])
        out[key] = tuple(lerp(x, y, k) for x, y in zip(va, vb)) if isinstance(va, tuple) else lerp(va, vb, k)
    return out

def posekeys(t, pts, ease=ease_io):
    """Interpolate through [(time, pose), ...]."""
    if t <= pts[0][0]: return pts[0][1]
    for (ta, pa), (tb, pb) in zip(pts, pts[1:]):
        if t <= tb: return mixpose(pa, pb, ease(seg(t, ta, tb)))
    return pts[-1][1]

def _rot(v, deg):
    a = math.radians(deg); cs, sn = math.cos(a), math.sin(a)
    return (v[0] * cs - v[1] * sn, v[0] * sn + v[1] * cs)

def _limb(a, b, length, sign):
    """Noodle limb of fixed length: quadratic bend so the curve keeps its length."""
    dx, dy = b[0] - a[0], b[1] - a[1]
    d = math.hypot(dx, dy) or 1e-6
    slack = max(0.0, length * length - d * d)
    off = 0.62 * math.sqrt(slack) * (1 if sign >= 0 else -1) * min(1.0, abs(sign))
    mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
    return (mx + dy / d * off, my - dx / d * off)

# ----------------------------------------------------------------------------- expressions
def expr(eyes='line', mouth='flat', brow=None, look=(0.0, 0.0), amt=1.0):
    return dict(eyes=eyes, mouth=mouth, brow=brow, look=look, amt=amt)

NEUTRAL = expr()

def blink_at(t, seed=0, every=3.4):
    """True during a short blink; irregular spacing so it never looks looped."""
    k = math.floor(t / every)
    start = k * every + 0.5 + rnd(k, seed + 11) * (every - 1.2)
    return start <= t < start + 0.11

# ----------------------------------------------------------------------------- narrator head
def narrator_head(c, cx, cy, hw=HEAD_W, face=1, tilt=0.0, ex=NEUTRAL, seed=1, lw=8.0, blink=False,
                  talk=0.0, sx=1.0, sy=1.0, hair=0xFFE6DDB8):
    """White marshmallow head with the blond tufted hair; face=+1 looks right."""
    u = hw
    c.save(); c.translate(cx, cy); c.rotate(tilt); c.scale(face * sx, sy)
    # head shape: soft rounded square, a touch wider at the top
    pts = []
    n = 22
    for i in range(n):
        a = 2 * math.pi * i / n
        cs, sn = math.cos(a), math.sin(a)
        px = math.copysign(abs(cs) ** 0.62, cs) * 0.5
        py = math.copysign(abs(sn) ** 0.62, sn) * 0.485
        px *= 1.0 + 0.04 * (-py / 0.485)                      # wider on top
        k = 1 + 0.018 * math.sin(a * 3 + seed) + 0.012 * math.sin(a * 5 + seed * 2)
        pts.append((px * u * k, py * u * k))
    head = spline(pts, closed=True)
    c.drawPath(head, fill(0xFFFFFFFF))
    c.drawPath(head, stroke(INK, lw))
    # hair (drawn for face=+1: fringe to the front-right, mass on the back-left)
    hp = [(0.465, -0.43), (0.375, -0.70), (0.20, -0.575), (-0.05, -0.675), (-0.12, -0.595), (-0.28, -0.61),
          (-0.515, -0.555), (-0.565, -0.36), (-0.545, 0.03), (-0.40, 0.135), (-0.285, 0.02), (-0.255, -0.20),
          (-0.15, -0.415), (0.05, -0.475), (0.30, -0.48)]
    sharp = {1, 3, 6}                                          # tuft tips stay pointy
    hpath = skia.Path(); hpath.moveTo(hp[0][0] * u, hp[0][1] * u)
    nH = len(hp)
    for i in range(1, nH + 1):
        p0, p1 = hp[i - 1], hp[i % nH]
        mx, my = (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2
        dx, dy = p1[0] - p0[0], p1[1] - p0[1]
        if (i % nH) in sharp:   bow = 0.14                      # sweep up into the tip
        elif (i - 1) in sharp:  bow = -0.10                     # and fall away from it
        elif i - 1 >= 9:        bow = -0.10                     # inner edge hugs the face
        else:                   bow = 0.12
        hpath.quadTo((mx + dy * bow) * u, (my - dx * bow) * u, p1[0] * u, p1[1] * u)
    hpath.close()
    c.drawPath(hpath, fill(hair))
    c.drawPath(hpath, stroke(INK, lw * 0.95, join='round'))
    c.drawPath(P(('M', -0.04 * u, -0.452 * u), ('Q', -0.155 * u, -0.455 * u, -0.20 * u, -0.345 * u)), stroke(INK, lw * 0.8))
    _narrator_face(c, u, ex, lw, blink, talk)
    c.restore()

def _narrator_face(c, u, ex, lw, blink, talk):
    lx, ly = ex.get('look', (0, 0))
    e1, e2 = (0.09 + lx * 0.04, -0.03 + ly * 0.04), (0.305 + lx * 0.04, -0.03 + ly * 0.04)
    eyes = 'blink' if blink and ex['eyes'] in ('line', 'wide', 'half') else ex['eyes']
    pen = stroke(INK, lw * 0.95)
    for i, (ex_, ey_) in enumerate((e1, e2)):
        X, Y = ex_ * u, ey_ * u
        if eyes == 'line':
            c.drawLine(X + 0.008 * u, Y - 0.085 * u, X - 0.004 * u, Y + 0.085 * u, pen)
        elif eyes == 'blink':
            c.drawLine(X - 0.05 * u, Y + 0.02 * u, X + 0.05 * u, Y + 0.02 * u, pen)
        elif eyes == 'closed':                                   # happy ^ ^
            c.drawPath(P(('M', X - 0.06 * u, Y + 0.03 * u), ('Q', X, Y - 0.07 * u, X + 0.06 * u, Y + 0.03 * u)), pen)
        elif eyes == 'wide':
            r = 0.075 * u
            c.drawCircle(X, Y, r, fill(0xFFFFFFFF)); c.drawCircle(X, Y, r, stroke(INK, lw * 0.7))
            c.drawCircle(X + lx * r * 0.45, Y + ly * r * 0.45, r * 0.3, fill(INK))
        elif eyes == 'half':                                     # unimpressed
            c.drawLine(X - 0.065 * u, Y - 0.01 * u, X + 0.065 * u, Y - 0.01 * u, pen)
            c.drawCircle(X + lx * 0.03 * u, Y + 0.045 * u, 0.026 * u, fill(INK))
        elif eyes == 'dot':
            c.drawCircle(X, Y, 0.032 * u, fill(INK))
    br = ex.get('brow')
    if br:                                                       # (left_angle, right_angle, raise)
        for i, (ex_, ey_) in enumerate((e1, e2)):
            ang = br[i]; rz = br[2] if len(br) > 2 else 0
            X, Y = ex_ * u, (ey_ - 0.165 - rz * 0.06) * u
            d = _rot((0.07 * u, 0), ang)
            c.drawLine(X - d[0], Y - d[1], X + d[0], Y + d[1], pen)
    m = ex['mouth']; mx, my = 0.215 * u, 0.215 * u
    if talk > 0.02 and m in ('flat', 'smile', 'talk'):
        hh = (0.028 + 0.085 * clamp(talk)) * u; ww = (0.075 - 0.02 * clamp(talk)) * u
        mp = blob(mx, my + hh * 0.2, ww, hh, seed=3, amp=0.05, n=10)
        c.drawPath(mp, fill(0xFF3A1414)); c.drawPath(mp, stroke(INK, lw * 0.75))
    elif m in ('flat', 'talk'):
        c.drawLine(mx - 0.065 * u, my, mx + 0.06 * u, my - 0.004 * u, pen)
    elif m == 'smile':
        c.drawPath(P(('M', mx - 0.085 * u, my - 0.02 * u), ('Q', mx, my + 0.075 * u, mx + 0.09 * u, my - 0.035 * u)), pen)
    elif m == 'smirk':
        c.drawPath(P(('M', mx - 0.08 * u, my + 0.015 * u), ('Q', mx + 0.02 * u, my + 0.045 * u, mx + 0.095 * u, my - 0.05 * u)), pen)
    elif m == 'frown':
        c.drawPath(P(('M', mx - 0.08 * u, my + 0.035 * u), ('Q', mx, my - 0.05 * u, mx + 0.085 * u, my + 0.03 * u)), pen)
    elif m == 'wavy':
        c.drawPath(P(('M', mx - 0.09 * u, my + 0.02 * u), ('C', mx - 0.04 * u, my - 0.05 * u, mx + 0.0 * u, my + 0.06 * u, mx + 0.06 * u, my - 0.01 * u),
                     ('Q', mx + 0.085 * u, my - 0.03 * u, mx + 0.08 * u, my + 0.02 * u)), pen)
    elif m == 'o':
        c.drawPath(blob(mx, my + 0.02 * u, 0.045 * u, 0.06 * u, 2, 0.04, 10), fill(0xFF3A1414))
        c.drawPath(blob(mx, my + 0.02 * u, 0.045 * u, 0.06 * u, 2, 0.04, 10), stroke(INK, lw * 0.75))
    elif m == 'grin':
        g = P(('M', mx - 0.12 * u, my - 0.03 * u), ('Q', mx, my + 0.0 * u, mx + 0.125 * u, my - 0.05 * u),
              ('Q', mx + 0.06 * u, my + 0.13 * u, mx - 0.05 * u, my + 0.10 * u), ('Q', mx - 0.11 * u, my + 0.06 * u, mx - 0.12 * u, my - 0.03 * u), ('Z',))
        c.drawPath(g, fill(0xFFFFFFFF)); c.drawPath(g, stroke(INK, lw * 0.75))
        c.drawLine(mx - 0.085 * u, my + 0.035 * u, mx + 0.09 * u, my + 0.02 * u, stroke(INK, lw * 0.5))

# ----------------------------------------------------------------------------- photo heads
HEADS = {}      # name -> dict(img=rel path, eyes=((x,y),(x,y)) normalised, er=eye radius / width, chin=(x,y), top=y)

def load_heads():
    import json, os
    fp = os.path.join(ASSETS, "heads", "heads.json")
    if os.path.exists(fp):
        for k, v in json.load(open(fp)).items():
            v['eyes'] = [tuple(e) for e in v['eyes']]; v['chin'] = tuple(v['chin'])
            HEADS[k] = v
    # per-head tweaks for the 1950s leather cap (top-centre x, width factor) found by eye
    HEADS.get('max', {}).update(capx=0.50, capw=0.90, top=0.03)
    HEADS.get('charles', {}).update(capx=0.50, capw=0.98, top=0.02)
    HEADS.get('lewis', {}).update(capx=0.55, capw=0.92, top=0.0)
load_heads()

def toon_eyes(c, p1, p2, r, style='wide', look=(0.0, 0.0), lw=4.0, t=0.0, blink=False):
    """Cartoon eyes drawn over a photo face (the channel's signature gag)."""
    lx, ly = look
    for i, (X, Y) in enumerate((p1, p2)):
        sgn = -1 if i == 0 else 1
        if style in ('wide', 'scared', 'sad', 'side', 'half', 'angry'):
            rx, ry = r * 1.08, r * (1.0 if style != 'half' else 0.95)
            eye = blob(X, Y, rx, ry, seed=i * 2 + 1, amp=0.035, n=12)
            c.drawPath(eye, fill(0xFFFFFFFF))
            if style == 'sad':                                 # tears pooling along the bottom
                c.save(); c.clipPath(eye, True)
                tear = P(('M', X - rx, Y + ry * 0.25), ('Q', X - rx * 0.4, Y + ry * 0.62, X, Y + ry * 0.28),
                         ('Q', X + rx * 0.5, Y + ry * 0.6, X + rx, Y + ry * 0.2), ('L', X + rx, Y + ry * 1.2), ('L', X - rx, Y + ry * 1.2), ('Z',))
                c.drawPath(tear, fill(0xFF7FD4F2)); c.drawPath(tear, stroke(0xFF2FA9D6, lw * 0.6)); c.restore()
            pr = r * (0.2 if style == 'scared' else 0.3)
            px, py = X + lx * (rx - pr) * 0.8, Y + ly * (ry - pr) * 0.8
            if style == 'scared':
                px += wiggle(t, 16, r * 0.05, 3 + i); py += wiggle(t, 16, r * 0.05, 9 + i)
            if blink:
                c.drawPath(eye, fill(0xFFE7B49A))
                c.drawLine(X - rx * 0.8, Y + ry * 0.1, X + rx * 0.8, Y + ry * 0.1, stroke(INK, lw))
            else:
                c.drawCircle(px, py, pr, fill(INK))
                if style in ('half', 'angry'):                 # heavy upper lid
                    c.save(); c.clipPath(eye, True)
                    lid_y = Y - ry * (0.05 if style == 'half' else 0.35)
                    tiltv = 0 if style == 'half' else sgn * ry * 0.5
                    lid = P(('M', X - rx * 1.2, lid_y + tiltv), ('L', X + rx * 1.2, lid_y - tiltv), ('L', X + rx * 1.2, Y - ry * 1.3), ('L', X - rx * 1.2, Y - ry * 1.3), ('Z',))
                    c.drawPath(lid, fill(0xFFCDA088)); c.drawPath(lid, stroke(INK, lw)); c.restore()
            c.drawPath(eye, stroke(INK, lw))
            # brows
            by = Y - ry * 1.55
            if style in ('scared', 'sad'):
                c.drawPath(P(('M', X - sgn * rx * 0.2, by - ry * 0.32), ('Q', X + sgn * rx * 0.45, by - ry * 0.25, X + sgn * rx * 1.05, by + ry * 0.38)), stroke(INK, lw * 1.5))
            elif style == 'angry':
                c.drawLine(X - sgn * rx * 0.9, by + ry * 0.75, X + sgn * rx * 0.9, by + ry * 0.1, stroke(INK, lw * 1.6))
            elif style == 'half':
                c.drawLine(X - rx * 0.95, by + ry * 0.42, X + rx * 0.95, by + ry * 0.42, stroke(INK, lw * 1.5))
            elif style == 'side':
                c.drawPath(P(('M', X - rx, by + ry * (0.3 if i == 0 else 0.0)), ('Q', X, by - ry * (0.1 if i == 0 else 0.5), X + rx, by + ry * (0.3 if i == 0 else -0.1))), stroke(INK, lw * 1.5))
            else:
                c.drawPath(P(('M', X - rx, by + ry * 0.2), ('Q', X, by - ry * 0.35, X + rx, by + ry * 0.2)), stroke(INK, lw * 1.5))
        elif style == 'happy':
            c.drawPath(P(('M', X - r, Y + r * 0.3), ('Q', X, Y - r * 0.9, X + r, Y + r * 0.3)), stroke(INK, lw * 1.5))
        elif style == 'dead':
            for a, b in (((-1, -1), (1, 1)), ((-1, 1), (1, -1))):
                c.drawLine(X + a[0] * r * 0.7, Y + a[1] * r * 0.7, X + b[0] * r * 0.7, Y + b[1] * r * 0.7, stroke(INK, lw * 1.5))

_SHADES = ["#######################",
           ".#w#w#####.#w#w#####...",
           ".##w#w####.##w#w####...",
           "..##w#w##...##w#w##....",
           "...#####.....#####....."]

def pixel_shades(c, cx, cy, width, rot=0.0, a=1.0):
    """'Deal with it' pixel sunglasses centred on (cx, cy)."""
    cols = len(_SHADES[0]); px = width / (cols - 3)
    c.save(); c.translate(cx, cy); c.rotate(rot); c.translate(-(cols - 3) * px / 2, -px * 1.4)
    pb, pw = fill(0xFF0A0A0A, a), fill(0xFFFFFFFF, a)
    pb.setAntiAlias(False); pw.setAntiAlias(False)
    for j, row in enumerate(_SHADES):
        for i, ch in enumerate(row):
            if ch != '.':
                c.drawRect(skia.Rect.MakeXYWH(i * px - 0.25, j * px - 0.25, px + 0.5, px + 0.5), pb if ch == '#' else pw)
    c.restore()

def racing_cap(c, cx, top_y, w, h, goggles=1.0, tilt=0.0, up=False):
    """1950s leather cap + goggles painted over the top of a photo head.
    (cx, top_y) = top-centre of the head, w = head width, h = head height."""
    c.save(); c.translate(cx, top_y); c.rotate(tilt)
    leather, dark = 0xFF7A4A2A, 0xFF4E2D17
    cap = P(('M', -w * 0.50, h * 0.40), ('C', -w * 0.56, h * 0.05, -w * 0.36, -h * 0.075, 0, -h * 0.075),
            ('C', w * 0.36, -h * 0.075, w * 0.56, h * 0.05, w * 0.50, h * 0.40),
            ('C', w * 0.46, h * 0.30, w * 0.34, h * 0.245, 0, h * 0.235), ('C', -w * 0.34, h * 0.245, -w * 0.46, h * 0.30, -w * 0.50, h * 0.40), ('Z',))
    c.drawPath(cap, fill(leather))
    c.save(); c.clipPath(cap, True)
    c.drawOval(skia.Rect.MakeLTRB(-w * 0.34, -h * 0.07, w * 0.12, h * 0.12), fill(0xFFFFFFFF, 0.16))
    for sx in (-0.22, 0.0, 0.22):                                  # seams
        c.drawPath(P(('M', sx * w, -h * 0.08), ('Q', sx * w * 1.25, h * 0.1, sx * w * 1.35, h * 0.3)), stroke(dark, w * 0.012))
    c.restore()
    c.drawPath(cap, stroke(INK, w * 0.028))
    # ear flaps
    for sg in (-1, 1):
        flap = P(('M', sg * w * 0.50, h * 0.33), ('Q', sg * w * 0.585, h * 0.50, sg * w * 0.50, h * 0.70),
                 ('Q', sg * w * 0.44, h * 0.60, sg * w * 0.455, h * 0.36), ('Z',))
        c.drawPath(flap, fill(leather)); c.drawPath(flap, stroke(INK, w * 0.024))
    if goggles > 0:
        gy = h * (0.20 if up else 0.445)
        strap = P(('M', -w * 0.51, gy), ('Q', 0, gy - h * 0.035, w * 0.51, gy))
        c.drawPath(strap, stroke(INK, h * 0.105)); c.drawPath(strap, stroke(0xFF2B2B2B, h * 0.07))
        for sg in (-1, 1):
            gx = sg * w * 0.2
            lens = rrect(gx - w * 0.165, gy - h * 0.105, w * 0.33, h * 0.21, w * 0.085)
            c.drawPath(lens, fill(0xFFB98C4E)); c.drawPath(lens, stroke(INK, w * 0.028))
            inner = rrect(gx - w * 0.125, gy - h * 0.072, w * 0.25, h * 0.144, w * 0.06)
            c.drawPath(inner, fill(0xFFBFE3EE if up else 0xFFCDEBF3)); c.drawPath(inner, stroke(INK, w * 0.018))
            c.drawLine(gx - w * 0.07, gy + h * 0.035, gx + w * 0.01, gy - h * 0.045, stroke(0xFFFFFFFF, w * 0.022, 0.9))
        c.drawLine(-w * 0.04, gy, w * 0.04, gy, stroke(INK, w * 0.03))
    c.restore()

def photo_head(c, name, x, y, w, tilt=0.0, eyes=None, look=(0, 0), t=0.0, shades=None, cap=None, a=1.0,
               sx=1.0, sy=1.0, paint=None, blink=False, flip=False):
    """Draw a cut-out head with its chin at (x, y). Returns dict of landmark points in canvas space
    (valid when tilt == 0; good enough for small tilts)."""
    hd = HEADS[name]; im = image(hd['img'])
    h = w * im.height() / im.width()
    ax, ay = hd.get('chin', (0.5, 0.98))
    c.save(); c.translate(x, y); c.rotate(tilt); c.scale((-1 if flip else 1) * sx, sy)
    draw_img(c, im, 0, 0, w, h, a, anchor=(ax, ay), paint=paint)
    def pt(n):
        return ((n[0] - ax) * w, (n[1] - ay) * h)
    e1, e2 = pt(hd['eyes'][0]), pt(hd['eyes'][1])
    er = hd.get('er', 0.085) * w * 1.22
    if eyes:
        toon_eyes(c, e1, e2, er, eyes, look, lw=max(2.5, w * 0.02), t=t, blink=blink)
    if cap is not None:
        top = hd.get('top', 0.02)
        racing_cap(c, (hd.get('capx', 0.5) - ax) * w, (top - ay) * h, w * hd.get('capw', 0.86), h * (1 - top) * hd.get('caph', 1.0),
                   goggles=1.0, up=(cap == 'up'))
    if shades is not None:                                          # shades = drop progress 0..1
        k = ease_out(shades, 2)
        ex, ey = (e1[0] + e2[0]) / 2, (e1[1] + e2[1]) / 2
        pixel_shades(c, ex + w * 0.02, lerp(ey - h * 1.1, ey, k), abs(e2[0] - e1[0]) * 2.25, rot=lerp(-10, 0, k))
    c.restore()
    return dict(top=(x, y - h * ay), center=(x, y - h * (ay - 0.5)), w=w, h=h)

# ----------------------------------------------------------------------------- the figure
class Fig:
    """A stick person. kind='narrator' (drawn head) or a key of HEADS (photo head)."""
    def __init__(self, kind='narrator', seed=1, lw=5.8, head_w=None, ink=INK, hair=0xFFE6DDB8, legs=1.0, body=1.0):
        self.kind, self.seed, self.lw, self.ink, self.hair = kind, seed, lw, ink, hair
        self.head_w = head_w or (HEAD_W if kind == 'narrator' else 176.0)
        self.legs, self.body = legs, body

    def joints(self, x, y, s, face, p):
        L, T = LEG * self.legs, TORSO * self.body
        hip = (p['hipx'], -L + p['crouch'])
        neck_l = _rot((0, -T), p['lean'])
        neck = (hip[0] + neck_l[0], hip[1] + neck_l[1])
        sh = (neck[0] - neck_l[0] * 0.06, neck[1] - neck_l[1] * 0.06)
        W_ = lambda q: (x + face * q[0] * s, y + q[1] * s)
        j = dict(hip=W_(hip), neck=W_(neck), sh=W_(sh),
                 lf=W_(p['lf']), rf=W_(p['rf']),
                 lh=W_((sh[0] + p['lh'][0], sh[1] + p['lh'][1])), rh=W_((sh[0] + p['rh'][0], sh[1] + p['rh'][1])))
        j['_local'] = dict(hip=hip, neck=neck, sh=sh)
        return j

    def draw(self, c, x, y, s=1.0, face=1, p=None, ex=NEUTRAL, t=0.0, talk=0.0, eyes=None, look=(0, 0),
             shades=None, cap=None, a=1.0, head=True, blink=None, head_paint=None, tilt_extra=0.0):
        p = p or DEFAULT_POSE
        j = self.joints(x, y, s, face, p)
        lw = self.lw * s
        pen = stroke(self.ink, lw, a)
        L, T = LEG * self.legs * s, TORSO * self.body * s
        def limb(a_, b_, length, sign, seed):
            ctrl = _limb(a_, b_, length, sign * face)
            path = P(('M', a_[0], a_[1]), ('Q', ctrl[0], ctrl[1], b_[0], b_[1]))
            c.drawPath(rough(path, 1.3 * s, 90 * s, self.seed * 10 + seed, 10 * s), pen)
        # back limbs, spine, front limbs
        limb(j['hip'], j['lf'], L * 1.0, p['lk'], 1)
        limb(j['sh'], j['lh'], ARM * s, p['lb'], 2)
        sp_ctrl = ((j['hip'][0] + j['neck'][0]) / 2 + face * p['bend'] * s, (j['hip'][1] + j['neck'][1]) / 2)
        c.drawPath(rough(P(('M', j['hip'][0], j['hip'][1]), ('Q', sp_ctrl[0], sp_ctrl[1], j['neck'][0], j['neck'][1])), 1.2 * s, 90 * s, self.seed * 10 + 3, 10 * s), pen)
        limb(j['hip'], j['rf'], L * 1.0, p['rk'], 4)
        if head:
            j.update(self.draw_head(c, j, s, face, p, ex, t, talk, eyes, look, shades, cap, a, blink, head_paint, tilt_extra))
        limb(j['sh'], j['rh'], ARM * s, p['rb'], 5)
        return j

    def draw_head(self, c, j, s, face, p, ex, t, talk, eyes, look, shades, cap, a, blink, head_paint, tilt_extra=0.0):
        tilt = (p['tilt'] + p['lean'] * 0.55) * face + tilt_extra
        nx, ny = j['neck']
        nx += face * p['hx'] * s; ny += p['hy'] * s
        if blink is None: blink = blink_at(t, self.seed)
        if self.kind == 'narrator':
            hw = self.head_w * s
            off = _rot((0, -hw * 0.43), tilt)
            cx, cy = nx + off[0], ny + off[1]
            narrator_head(c, cx, cy, hw, face, tilt, ex, self.seed, max(2.6, self.lw * 1.0 * s), blink, talk, p['hsx'], p['hsy'], self.hair)
            return dict(head=(cx, cy), head_top=(cx, cy - hw * 0.62), head_w=hw)
        w = self.head_w * s
        r = photo_head(c, self.kind, nx, ny + w * 0.05, w, tilt, eyes, look, t, shades, cap, a, p['hsx'], p['hsy'], head_paint,
                       blink=blink and eyes in ('wide', 'side', 'half'))
        return dict(head=r['center'], head_top=r['top'], head_w=w, head_h=r['h'])
