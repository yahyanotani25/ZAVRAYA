"""Scenes 5-12: 1950s driving, the reaper, Alonso's 'old photo', Kimi at home, the steering wheels, Charles goes first."""
import math
import skia
from .core import *
from .rig import *
from .art import *
from .cars import *
from .scenes_a import NARR, MAX, CHARLES, LEWIS, bg_photo, cam

ALONSO = Fig('alonso', seed=5, head_w=170)
KIMI = Fig('kimi', seed=6, head_w=206, legs=0.60, body=0.80, lw=5.4)

# ============================================================================= the 1950s roadside (S5 + S6)
T5, T_PUNCH, T6, T6_END = 24.56, 27.24, 29.92, 34.14
V0, V1, TD0, TD1 = 1500.0, 430.0, 31.85, 32.75

def scroll(t):
    """Pixels of road that have gone by since the shot began."""
    if t <= TD0: return V0 * (t - T5)
    s0 = V0 * (TD0 - T5)
    if t <= TD1:
        x = t - TD0
        return s0 + V0 * x + 0.5 * (V1 - V0) * x * x / (TD1 - TD0)
    return s0 + V0 * (TD1 - TD0) + 0.5 * (V1 - V0) * (TD1 - TD0) + V1 * (t - TD1)

V6 = 940.0
def scroll6(t):
    """Road distance for the wide shot (S6): slower, then easing right down as Max spots the reaper."""
    s0 = scroll(T6)
    if t <= TD0: return s0 + V6 * (t - T6)
    s1 = s0 + V6 * (TD0 - T6)
    if t <= TD1:
        x = t - TD0
        return s1 + V6 * x + 0.5 * (V1 - V6) * x * x / (TD1 - TD0)
    return s1 + V6 * (TD1 - TD0) + 0.5 * (V1 - V6) * (TD1 - TD0) + V1 * (t - TD1)

def _tiles(S, par, D, lo=-1, hi=None):
    """Yield (screen_x, tile_index) for a strip repeating every D px at parallax `par`."""
    off = (S * par) % D; base = int((S * par) // D)
    n = hi if hi is not None else int(W / D) + 2
    for i in range(lo, n + 1):
        yield (i * D - off, base + i)

BOARDS = [("GOMME", 0xFFF3E7C6, 0xFFB3261E), ("BENZIN", 0xFF2F5D8A, 0xFFF3E7C6), ("CAFFE", 0xFFB3261E, 0xFFF3E7C6), ("PNEUS", 0xFFF2C230, 0xFF1D1D1D),
          ("GRAN PREMIO", 0xFF1F4D3A, 0xFFF3E7C6), ("OLIO", 0xFFF3E7C6, 0xFF1F4D3A)]

def roadside(c, S, t, crowd=True):
    HORIZ, FENCE_Y, ROAD_Y = 560, 742, 772
    sky = skia.Paint(); sky.setShader(lin_grad(0, 0, 0, HORIZ + 60, [0xFF9FC8E6, 0xFFDDEBEA, 0xFFF2EFD9], [0, 0.72, 1]))
    c.drawRect(skia.Rect.MakeLTRB(0, 0, W, HORIZ + 80), sky)
    for x, i in _tiles(S, 0.015, 760):                                              # clouds
        y = 120 + 90 * rnd(i, 3)
        for k, (dx, r) in enumerate(((0, 70), (80, 92), (170, 66), (-70, 50))):
            c.drawOval(skia.Rect.MakeLTRB(x + dx - r * 1.5, y - r * 0.55, x + dx + r * 1.5, y + r * 0.55), fill(0xFFFFFFFF, 0.9))
    for par, colr, amp, base, D in ((0.05, 0xFFB5CBA6, 70, HORIZ - 6, 900), (0.11, 0xFF94B585, 54, HORIZ + 26, 700)):   # hills
        pts = [(-60, H)]
        off = (S * par) % D
        for i in range(-1, int(W / (D / 6)) + 9):
            x = i * D / 6 - off
            ph = (i + int((S * par) // D) * 6)
            pts.append((x, base - amp * (0.5 + 0.5 * math.sin(ph * 1.05)) * (0.6 + 0.4 * math.sin(ph * 0.37 + 1))))
        pts.append((W + 60, H))
        c.drawPath(spline(pts[1:-1]) if False else poly([pts[0]] + pts[1:-1] + [pts[-1]]), fill(colr))
    for x, i in _tiles(S, 0.2, 230):                                                # distant tree line
        r = 60 + 34 * rnd(i, 5)
        c.drawPath(blob(x, HORIZ + 62 - r * 0.5, r, r * 0.8, i, 0.12, 9), fill(0xFF5F8F52))
    c.drawRect(skia.Rect.MakeLTRB(0, HORIZ + 60, W, ROAD_Y), fill(0xFF86B465))                 # meadow
    for x, i in _tiles(S, 0.5, 520):                                                # a few nearer trees
        if i % 3 != 1:
            with xf(c, x + 120, FENCE_Y - 30, 0.72 + 0.2 * rnd(i, 2)): tree(c, 1.0, seed=i, sway=wiggle(t, 0.6, 4, i))
    PAR = 0.86
    for x, i in _tiles(S, PAR, 660):                                                # hoardings + crowd + fence
        txt, bgc, fg = BOARDS[i % len(BOARDS)]
        if crowd:
            for k in range(4):
                sx_ = x + 40 + k * 78 + 20 * rnd(i * 7 + k, 4)
                spectator(c, sx_, FENCE_Y + 6, 1.36, seed=i * 5 + k, t=t, hat=(i + k) % 4 != 0, cheer=0.5 + 0.5 * math.sin(t * 7 + k + i), lw=5)
        b = rrect(x + 356, FENCE_Y - 150, 286, 118, 6)
        c.drawPath(b, fill(bgc)); c.drawPath(b, stroke(OUT, 4.5))
        text(c, txt, x + 499, FENCE_Y - 70, "Anton", 66 if len(txt) < 8 else 46, fg, track=3)
        for px in (x + 390, x + 610): c.drawLine(px, FENCE_Y - 32, px, FENCE_Y + 8, stroke(OUT, 9))
    for yy in (FENCE_Y - 50, FENCE_Y - 18):
        c.drawLine(-10, yy, W + 10, yy, stroke(OUT, 9)); c.drawLine(-10, yy, W + 10, yy, stroke(0xFFE9E1CC, 4.5))
    for x, i in _tiles(S, PAR, 220):
        c.drawLine(x, FENCE_Y - 66, x, FENCE_Y + 10, stroke(OUT, 12)); c.drawLine(x, FENCE_Y - 64, x, FENCE_Y + 8, stroke(0xFFE9E1CC, 6.5))
    c.drawRect(skia.Rect.MakeLTRB(0, FENCE_Y + 6, W, ROAD_Y + 6), fill(0xFF6E9C52))                      # verge
    road = skia.Paint(); road.setShader(lin_grad(0, ROAD_Y, 0, H, [0xFF8E8B85, 0xFF7B7873]))
    c.drawRect(skia.Rect.MakeLTRB(0, ROAD_Y, W, H), road)
    c.drawLine(0, ROAD_Y + 2, W, ROAD_Y + 2, stroke(0xFF5A5853, 5))
    for x, i in _tiles(S, 1.0, 190):                                                # road texture rushing by
        y = ROAD_Y + 30 + 250 * rnd(i, 7)
        c.drawLine(x, y, x + 60 + 90 * rnd(i, 9), y, stroke(0xFF6F6C67 if i % 2 else 0xFF9A9791, 4 + 4 * rnd(i, 1), 0.7))
    for x, i in _tiles(S, 1.0, 420):
        c.drawLine(x, ROAD_Y + 20, x + 150, ROAD_Y + 20, stroke(0xFFE9E4D2, 7, 0.85))

def sign(c, x, y, lines, w=330, rot=-3.0, arrow_dx=0):
    """Hand-painted wooden sign on a post; (x, y) = foot of the post."""
    h = 58 * len(lines) + 30
    with xf(c, x, y, 1.0, rot):
        c.drawLine(0, 0, 0, -150 - h, stroke(OUT, 16)); c.drawLine(0, 0, 0, -150 - h, stroke(0xFF8A5A2B, 9))
        b = rrect(-w / 2, -150 - h, w, h, 8)
        c.drawPath(b, fill(0xFFF3E7C6)); c.drawPath(b, stroke(OUT, 5.5))
        for i, ln in enumerate(lines):
            text(c, ln, 0, -150 - h + 62 + i * 58, "PermanentMarker", 46, 0xFFB3261E if i == 0 else 0xFF1D1D1D)
        if arrow_dx:
            arrow(c, arrow_dx * 0.2, -120, arrow_dx, -40, w=7, color=0xFFB3261E, head=24, bend=0.2 if arrow_dx > 0 else -0.2)

def scarf(c, t, x, y, length=150.0):
    pts = []
    for i in range(9):
        k = i / 8
        pts.append((x - k * length, y + k * 16 + math.sin(t * 24 - k * 7) * (4 + 16 * k)))
    p = spline(pts)
    c.drawPath(p, stroke(OUT, 21, cap='butt')); c.drawPath(p, stroke(0xFFE3242B, 14, cap='butt'))

def _driving(c, t, S, wide):
    sc, ox, gy = (1.0, 300, 932) if wide else (1.2, 330, 932)
    bnc = wiggle(t, 11, 3.2, 4) + 1.6 * math.sin(t * 31)
    wheel = S / (V_R * sc) * 57.3
    hop = 0.0
    if 29.36 < t < 29.92:
        hop = -math.sin(math.pi * seg(t, 29.36, 29.66)) * 26
    shades = None
    if t >= 29.0:
        shades = seg(t, 29.0, 29.32)
        if t > 32.16: shades = None
    scared = t > 32.16
    for i in range(7):                                                               # exhaust puffs trailing off
        ph = (t * 2.6 + i / 7) % 1.0
        ex_, ey_ = ox + 285 * sc - ph * 520, gy - 62 * sc - ph * 46 + wiggle(t + i, 3, 8, i)
        rr = (10 + 44 * ph) * sc
        c.drawPath(blob(ex_, ey_, rr, rr * 0.86, i, 0.1, 8), fill(0xFFEDE8DC, 0.55 * (1 - ph)))
    with xf(c, ox, gy + hop, sc, -1.5 * math.sin(math.pi * seg(t, 29.36, 29.66)) if hop else wiggle(t, 6, 0.35, 9)):
        scarf(c, t, 404, -214)
        vintage_gp(c, wheel_ang=wheel, number="2", head='max', bounce=bnc, t=t, steer=wiggle(t, 5, 10, 2),
                   head_kw=dict(w=124, y=-196, cap='up', shades=shades, eyes='scared' if scared else None, look=(0.85, -0.25), tilt=wiggle(t, 4, 2.2, 6)))
    hx, hy = ox + 432 * sc, gy + hop - 300 * sc
    if scared:
        sweat(c, hx - 60 * sc, hy + 10, t, 1.2 * sc, seed=3)
        k = seg(t, 32.16, 32.7)                                                      # the shades fly off
        if k < 1:
            pixel_shades(c, hx + 20 + 260 * k, hy + 40 - 420 * math.sin(math.pi * k * 0.8), 150 * sc * (1 - 0.3 * k), rot=-520 * k)
    if 29.34 < t < 29.9:                                                             # glint
        k = seg(t, 29.34, 29.76); rr = 46 * math.sin(math.pi * k)
        with xf(c, hx + 40 * sc, hy + 34 * sc, 1.0, k * 90):
            c.drawPath(star(0, 0, rr, rr * 0.16, 4), fill(0xFFFFFFFF)); c.drawPath(star(0, 0, rr, rr * 0.16, 4), stroke(OUT, 2.5))
    return ox, gy, sc

def s5(c, t, ctx):
    S = scroll(t)
    c.save()
    if t >= T_PUNCH:
        z = 1.58 + 0.06 * settle(t, T_PUNCH, 26, 12) + 0.03 * seg(t, T_PUNCH, T6)
        cam(c, 330 + 470 * 1.2, 932 - 232 * 1.2, z)
    else:
        cam(c, 960, 612, 1.16)
    lay = skia.Paint(); lay.setColorFilter(sepia_filter(0.26))
    c.saveLayer(None, lay)
    roadside(c, S, t)
    _driving(c, t, S, False)
    c.restore(); c.restore()

def s6(c, t, ctx):
    S = scroll6(t)
    c.save(); cam(c, 960, 600, 1.13)
    lay = skia.Paint(); lay.setColorFilter(sepia_filter(0.26))
    c.saveLayer(None, lay)
    roadside(c, S, t, crowd=False)
    PAR = 0.95; Y = 778
    def at(tc, xs):                                                                  # object that sits at screen x=xs when t=tc
        return xs + scroll6(tc) * PAR - S * PAR
    hx = at(30.90, 1000)
    if -500 < hx < W + 500:
        for dx, dy in ((-100, 0), (100, 0), (0, -96)):
            with xf(c, hx + dx, Y + dy, 1.0): hay_bale(c, seed=int(dx))
        sign(c, hx + 300, Y, ["SAFETY", "BARRIER"], w=300, rot=4, arrow_dx=-170)
    tx = at(31.95, 1080)
    if -500 < tx < W + 600:
        with xf(c, tx, Y, 1.25): tree(c, 1.0, seed=4, sway=wiggle(t, 0.7, 5, 3))
        sign(c, tx + 290, Y, ["RUN-OFF", "AREA"], w=300, rot=-4, arrow_dx=-180)
    rx = at(32.75, 1500)
    if -300 < rx < W + 400:
        reaper(c, rx, Y + 6, 1.02, t, wave=ease_io(seg(t, 32.3, 32.7)), face=-1)
    _driving(c, t, S, True)
    c.restore(); c.restore()

def s56_post(c, t, ctx):
    film_fx(c, t, 0.75, seed=9)
    vignette(c, 0.42, 0.52)

# ============================================================================= S7/S8  34.14 - 41.34  (Fernando)
T7, T_AL, T_STAMP, T8, T9 = 34.14, 34.72, 37.18, 37.92, 41.34
GY7 = 968

def s7(c, t, ctx):
    c.save()
    shk = shake(t, T_STAMP + 0.14, 16, 0.32)
    if t >= T8:
        cam(c, 965, 404, 1.34 + 0.04 * settle(t, T8, 26, 12) + 0.03 * seg(t, T8, T9), shk)
    else:
        cam(c, W / 2, H / 2, 1.0 + 0.02 * seg(t, T7, T8), shk)
    bg_photo(c, "pit2.jpg", zoom=1.12, ox=40, oy=-30)
    talk = ctx['talk'](t)
    nod = math.sin(t * 2.3) * 2
    shrug = ease_io(seg(t, 40.16, 40.42)) * (1 - ease_io(seg(t, 41.05, 41.3)))
    no = math.sin((t - 36.42) * 13) * 7 * (1 if 36.42 < t < 37.4 else 0)
    p = posekeys(t, [
        (34.14, pose(rh=(60, 80), lh=(-22, 150), tilt=0)),
        (34.45, pose(rh=(132, -8), rb=-1, lh=(-22, 150), tilt=3, lean=3)),
        (36.30, pose(rh=(132, -8), rb=-1, lh=(-22, 150), tilt=3, lean=3)),
        (36.52, pose(rh=(88, -60), rb=-1, lh=(-60, -30), lb=1, tilt=-2, lean=0)),
        (37.50, pose(rh=(60, 60), rb=1, lh=(-24, 150), tilt=0, lean=0)),
        (38.20, pose(rh=(110, 10), rb=-1, lh=(-24, 150), tilt=6, lean=10)),
        (39.90, pose(rh=(116, 4), rb=-1, lh=(-24, 150), tilt=8, lean=12)),
        (40.16, pose(rh=(60, 60), rb=1, lh=(-24, 150), tilt=0, lean=2))])
    if shrug > 0:
        p = mixpose(p, pose(rh=(128, -44), rb=-1, lh=(-128, -44), lb=1, tilt=-9, lean=-2, hy=8), shrug)
    p = dict(p); p['tilt'] = p['tilt'] + nod + no
    if 36.42 < t < 37.4: p['rh'] = (p['rh'][0] + no * 3, p['rh'][1])
    brow = (12, -8, 0.5) if 38.2 < t < 40.0 else ((-8, 8, 0.7) if shrug > 0.3 else None)
    mouth = 'smirk' if (39.95 < t < 40.2) else 'talk'
    soft_shadow(c, 600, GY7 + 4, 90, 13, 0.3)
    NARR.draw(c, 600, GY7, 1.46, 1, p, expr('line', mouth, brow=brow, look=(0.7, 0)), t=t, talk=talk)
    # Fernando
    ak = pop(t, T_AL, 0.3, 1.7)
    if ak > 0:
        if t < 39.2: eyes, look = None, (0, 0)
        elif t < 40.6: eyes, look = 'half', (-0.9, 0.1)
        else: eyes, look = 'angry', (-0.8, 0.0)
        tl = -5 * ease_io(seg(t, 39.2, 39.6))
        ap = pose(lh=(-46, 128), rh=(46, 128), lb=-1, rb=1, tilt=tl + math.sin(t * 1.9) * 1.5)
        if t > 40.6:
            ap = mixpose(ap, pose(lh=(-70, 30), rh=(70, 30), lb=1, rb=-1, tilt=tl), ease_io(seg(t, 40.6, 40.85)))   # arms cross
        soft_shadow(c, 1330, GY7 + 4, 90 * ak, 13, 0.3)
        with xf(c, 1330, GY7, 1.0, 0, sx=ak, sy=ak * (2 - ak) if ak > 1 else ak):
            ALONSO.draw(c, 0, 0, 1.42, -1, ap, t=t, eyes=eyes, look=look)
        poof(c, 1330, GY7 - 20, 120, seg(t, T_AL, T_AL + 0.55), n=9, seed=11)
        lk = pop(t, T_AL + 0.28, 0.26, 1.9)
        if t < T8: label(c, "FERNANDO ALONSO", 1330, GY7 + 50, 44, k=lk, rot=1.5)
    # verdict
    sc, al = slam(t, T_STAMP, 0.15, 2.4)
    if sc > 0 and t < T8:
        with xf(c, 1330, 612, sc, -9):
            w_ = text_w("TOO EXPERIENCED", "Bangers", 96, 3)
            box = rrect(-w_ / 2 - 30, -78, w_ + 60, 120, 14)
            c.drawPath(box, fill(0xFFFFFFFF, 0.88 * al)); c.drawPath(box, stroke(0xFFD0161F, 10, al))
            text(c, "TOO EXPERIENCED", 0, 20, "Bangers", 96, 0xFFD0161F, a=al, track=3)
    c.restore()

# ============================================================================= S9  41.34 - 43.02  (the photo)
T10 = 43.02
def s9(c, t, ctx):
    z = lerp(1.0, 1.06, seg(t, T9, T10))
    c.save(); cam(c, 960, 540, z)
    bg_photo(c, "pit2.jpg", zoom=1.3, ox=40, oy=-30, dark=0.55, blur=7)
    k = back_out(seg(t, 41.44, 41.80), 1.5)
    rot = lerp(-22, -3.5, ease_out(seg(t, 41.44, 41.9))) + wiggle(t, 0.8, 0.7, 2)
    if k > 0:
        # the narrator's arm holding it up
        ax, ay = 900 - 510, 540 + 370
        c.drawPath(rough(P(('M', 250, 1180), ('Q', 300, 1010, ax, ay)), 1.6, 90, 4), stroke(INK, 15))
        photo_print(c, image("bg/alonso_austin.jpg"), 900, lerp(900, 515, k), 1060, rot=rot, caption="Fernando - Silverstone, 1922", k=min(1.0, k * 1.0), sepia=1.0)
    fl = 1 - seg(t, 41.80, 42.0)
    if 41.80 <= t < 42.0: c.drawRect(skia.Rect.MakeWH(W, H), fill(0xFFFFFFFF, 0.75 * fl))
    # Fernando is not amused
    pk = back_out(seg(t, 42.15, 42.45), 1.4)
    if pk > 0:
        photo_head(c, 'alonso', 1730, 1080 + 330 * (1 - pk) + 70, 310, tilt=-8, eyes='half', look=(-0.9, -0.5), t=t)
    c.restore()

# ============================================================================= S10  43.02 - 45.38  (Kimi stays home)
T11 = 45.38
def s10(c, t, ctx):
    z = lerp(1.26, 1.2, ease_out(seg(t, T10, T10 + 0.9)))
    c.save(); cam(c, 1010, 600, z)
    c.drawRect(skia.Rect.MakeWH(W, H), fill(0xFFF1DFC4))
    for i in range(0, 13):                                                           # wallpaper stripes
        c.drawRect(skia.Rect.MakeXYWH(i * 160 + 40, 0, 46, 790), fill(0xFFEBD5B4))
    c.drawRect(skia.Rect.MakeLTRB(0, 790, W, H), fill(0xFFB68556))
    for i in range(5):
        c.drawLine(0, 850 + i * 62, W, 850 + i * 62, stroke(0xFF9C6E44, 4))
    c.drawRect(skia.Rect.MakeLTRB(0, 772, W, 800), fill(0xFFF8F1E4)); c.drawLine(0, 772, W, 772, stroke(OUT, 5)); c.drawLine(0, 800, W, 800, stroke(OUT, 5))
    # window
    win = rrect(150, 130, 400, 420, 10)
    wp = skia.Paint(AntiAlias=True); wp.setShader(lin_grad(0, 130, 0, 550, [0xFF8FC9F0, 0xFFD7EEF9]))
    c.drawPath(win, wp)
    c.save(); c.clipPath(win, True)
    c.drawPath(blob(250, 250, 70, 34, 1, 0.1, 9), fill(0xFFFFFFFF)); c.drawPath(blob(430, 330, 90, 38, 2, 0.1, 9), fill(0xFFFFFFFF))
    c.drawPath(P(('M', 150, 550), ('Q', 300, 430, 550, 520), ('L', 550, 550), ('Z',)), fill(0xFF79B45C))
    c.restore()
    c.drawPath(win, stroke(OUT, 9)); c.drawLine(350, 130, 350, 550, stroke(OUT, 7)); c.drawLine(150, 340, 550, 340, stroke(OUT, 7))
    c.drawRoundRect(skia.Rect.MakeLTRB(128, 548, 572, 574), 8, 8, fill(0xFFF8F1E4)); c.drawRoundRect(skia.Rect.MakeLTRB(128, 548, 572, 574), 8, 8, stroke(OUT, 5))
    # note from the boss
    with xf(c, 1500, 300, 1.0, 5 + wiggle(t, 0.5, 0.6, 3)):
        note = rrect(-170, -120, 340, 240, 4)
        c.save(); c.translate(6, 9); c.drawPath(note, fill(0xFF000000, 0.18)); c.restore()
        c.drawPath(note, fill(0xFFFFEE7A)); c.drawPath(note, stroke(0xFFCDBB45, 3))
        text(c, "Homework first.", 0, -34, "Caveat", 60, 0xFF2A2420)
        text(c, "THEN simulator.", 0, 26, "Caveat", 60, 0xFF2A2420)
        text(c, "- Toto", 70, 88, "Caveat", 56, 0xFFB3261E)
        c.drawCircle(0, -108, 13, fill(0xFFE3242B)); c.drawCircle(0, -108, 13, stroke(OUT, 3))
    # couch + Kimi
    cx_, cy_ = 1000, 968
    soft_shadow(c, cx_, cy_ + 4, 430, 22, 0.28)
    with xf(c, cx_, cy_, 1.3): couch(c)
    seat_y = cy_ - 112 * 1.3
    s_ = 1.25
    sw = math.sin(t * 5.2)
    kp = pose(lf=(-64 - 13 * sw, -46), rf=(-90 + 13 * sw, -54), lk=1, rk=1, lh=(-74, 86), rh=(-36, 96), lb=1, rb=1, lean=-4, tilt=4 + math.sin(t * 2.6) * 2.5, hipx=10)
    fy = seat_y + LEG * 0.60 * s_ - 6
    j = KIMI.draw(c, cx_ + 40, fy, s_, -1, kp, t=t)
    with xf(c, (j['lh'][0] + j['rh'][0]) / 2 - 6, (j['lh'][1] + j['rh'][1]) / 2 + 2, 1.5, -12 + math.sin(t * 2.6) * 2):
        tablet(c, 1.0, 0, 1.0, t)
    with xf(c, 1400, cy_ + 6, 1.35): juice_box(c)
    lk = pop(t, 43.26, 0.26, 1.9)
    label(c, "KIMI ANTONELLI", 640, 720, 46, k=lk, rot=-2)
    if lk > 0.5:
        arrow(c, 800, 716, 908, 660, w=7, head=24, bend=-0.2, k=seg(t, 43.4, 43.62))
    c.restore()

# ============================================================================= S11  45.38 - 52.38  (the Maserati)
T11B, T11C, T12 = 48.36, 50.30, 52.38
GY11 = 842
def _showroom(c):
    c.drawRect(skia.Rect.MakeWH(W, H), fill(PAPER))
    c.drawRect(skia.Rect.MakeLTRB(0, GY11 - 26, W, H), fill(0xFFEFEBE0))
    c.drawPath(rough(P(('M', -20, GY11 - 26), ('L', W + 20, GY11 - 24)), 2, 160, 3, 14), stroke(0xFFD9D3C3, 5))

def s11(c, t, ctx):
    if t >= T11C:
        return s11c(c, t, ctx)
    c.save()
    if t >= T11B:
        cam(c, 1225, 480, 1.40 + 0.05 * settle(t, T11B, 26, 12) + 0.03 * seg(t, T11B, T11C))
    else:
        cam(c, W / 2, H / 2, 1.0, shake(t, 46.30 + 0.15, 14, 0.3))
    _showroom(c)
    S = 1.34
    k = ease_out(seg(t, 45.42, 46.42), 3)
    cx_ = lerp(-1900, 110, k)
    dip = settle(t, 46.40, 12, 6) if t > 46.40 else 0
    with xf(c, cx_, GY11, S, -dip * 0.7):
        vintage_gp(c, wheel_ang=(cx_ + 1900) / (V_R * S) * 57.3, number="2", driver=False, bounce=max(0, dip) * 5, t=t)
    poof(c, cx_ + 100, GY11 - 10, 90, seg(t, 46.2, 46.9), n=7, seed=3, color=0xFFE7E2D6)
    # Kimi wanders in
    wk = seg(t, 47.05, 48.15)
    if wk > 0:
        kx = lerp(2080, 1630, ease_out(wk, 1.6))
        step = math.sin(t * 15) * (1 - ease_io(seg(wk, 0.82, 1.0)))
        lean = 0
        kp = pose(lf=(-34 - 46 * step, -max(0, step) * 22), rf=(34 + 46 * step, -max(0, -step) * 22), lh=(-52, 96), rh=(40, 120), lb=-1, rb=1,
                  crouch=abs(step) * 8, tilt=3 + step * 2)
        if t >= T11B:
            lk_ = ease_io(seg(t, T11B, T11B + 0.4))
            kp = mixpose(kp, pose(lf=(-34, 0), rf=(34, 0), lh=(-110, 30), rh=(40, 120), lb=1, rb=1, lean=16, tilt=8, crouch=12), lk_)
            if t > 49.4:
                kp = mixpose(kp, pose(lf=(-34, 0), rf=(34, 0), lh=(-130, -40), rh=(-70, -20), lb=1, rb=1, lean=14, tilt=6, crouch=8), ease_io(seg(t, 49.4, 49.7)))
        soft_shadow(c, kx, GY11 + 14, 70, 11, 0.26)
        j = KIMI.draw(c, kx, GY11 + 10, 1.5, -1, kp, t=t)
        with xf(c, j['lh'][0] - 4, j['lh'][1] + 4, 1.45, -20 + (0 if t < 49.4 else -30 * ease_io(seg(t, 49.4, 49.7)))):
            tablet(c, 1.0, 0, 1.0, t)
        qk = pop(t, 48.50, 0.26) * (1 - seg(t, 48.95, 49.1))
        qmark(c, j['head'][0] + 30, j['head_top'][1] - 46, 120, qk, rot=10)
    c.restore()
    # title card for the car
    sc, al = slam(t, 46.30, 0.15, 2.5)
    if sc > 0 and t < T11B:
        with xf(c, 760, 210, sc, -2.5):
            text(c, "1955 MASERATI 250F", 0, 0, "Bangers", 150, 0xFFE3242B, a=al, track=3, shadow=0xFF1D1D1D, sh=(7, 8))
            c.drawPath(rough(P(('M', -520, 34), ('L', 520, 26)), 2.5, 150, 6, 14), stroke(OUT, 8, al))
    if t >= T11B:
        bk = pop(t, 48.96, 0.28, 1.8)
        if bk > 0:
            bubble(c, 700, 180, 760, 190, tail=(1196, 372), k=bk, base=285)
            if bk > 0.6:
                text(c, "where's the screen??", 700, 206, "PatrickHand", 82, INK)

def s11c(c, t, ctx):
    kL = ease_out(seg(t, T11C, T11C + 0.24), 3)
    c.drawRect(skia.Rect.MakeWH(W, H), fill(PAPER))
    # left: now
    with xf(c, -960 * (1 - kL), 0):
        c.drawRect(skia.Rect.MakeLTRB(0, 0, 960, H), fill(0xFF1B1F2A))
        for i in range(9):
            c.drawLine(0, 140 + i * 120, 960, 100 + i * 120, stroke(0xFF232836, 40))
        with xf(c, 480, 560 + math.sin(t * 2.2) * 6, 2.25, math.sin(t * 1.6) * 3): modern_wheel(c, 1.0, t)
        text(c, "TODAY", 60, 150, "Bangers", 150, 0xFFFFFFFF, align='l', track=3)
        for i, (t0, s_, x, y, r) in enumerate(((50.62, "30 BUTTONS", 740, 250, 5), (50.80, "RADIO MENU", 215, 880, -5), (50.98, "1 SCREEN", 585, 950, 4))):
            label(c, s_, x, y, 50, k=pop(t, t0, 0.24, 1.9), rot=r, bg=0xFFFFE23A)
    # right: then
    with xf(c, 960 + 960 * (1 - kL), 0):
        c.drawRect(skia.Rect.MakeLTRB(0, 0, 960, H), fill(0xFFF1E2C0))
        for i in range(9):
            c.drawLine(0, 100 + i * 120, 960, 140 + i * 120, stroke(0xFFEAD8B0, 40))
        with xf(c, 480, 560, 1.72, math.sin(t * 1.3) * 16): wood_wheel(c)
        text(c, "1955", 900, 150, "Bangers", 150, OUT, align='r', track=3)
        label(c, "0 BUTTONS", 520, 940, 62, k=pop(t, 51.40, 0.26, 2.0), rot=-3, bg=0xFFFFFFFF, color=0xFFD0161F)
        label(c, "(it's wood)", 740, 262, 58, k=pop(t, 51.92, 0.24, 1.9), rot=6, fnt="PatrickHand", lw=4.5)
    # divider + VS
    if kL > 0.9:
        zz = [(960 + (18 if i % 2 else -18), i * 90) for i in range(13)]
        c.drawPath(poly(zz, False), stroke(OUT, 16, join='miter')); c.drawPath(poly(zz, False), stroke(0xFFFFFFFF, 8, join='miter'))
    vk = pop(t, T11C + 0.22, 0.28, 2.2)
    if vk > 0:
        with xf(c, 960, 560, vk, -8 + 3 * math.sin(t * 3)):
            sp = spiky(0, 0, 150, 100, 11, 3)
            c.drawPath(sp, fill(0xFFFFE23A)); c.drawPath(sp, stroke(OUT, 9, join='miter'))
            text(c, "VS", 0, 42, "Bangers", 124, 0xFFD0161F, outline=OUT, ow=10)
    # a confused teenager
    pk = back_out(seg(t, 51.0, 51.32), 1.4)
    if pk > 0:
        photo_head(c, 'kimi', 960, 1080 + 360 * (1 - pk) + 96, 330, tilt=math.sin(t * 3) * 3, t=t)
        qmark(c, 820, 800, 110, pop(t, 51.30, 0.24), rot=-14); qmark(c, 1100, 786, 130, pop(t, 51.44, 0.24), rot=12)

# ============================================================================= S12  52.38 - 55.40  (Charles goes first)
T_PICK, T_STEP, T_FIRST, T_IRIS, T_END = 53.04, 53.50, 53.80, 54.62, 55.40
GY12 = 1012
def s12(c, t, ctx):
    shk = shake(t, T_PICK + 0.1, 12, 0.3)
    zk = ease_io(seg(t, 53.95, 54.7))
    c.save(); cam(c, lerp(960, 960, zk), lerp(540, 430, zk), lerp(1.0, 1.42, zk), shk)
    bg_photo(c, "y1957_exit.jpg", zoom=1.09, ox=-20, oy=-30, sepia=0.85)
    c.drawRect(skia.Rect.MakeWH(W, H), fill(0xFF2A1A08, 0.10))
    step = ease_out(seg(t, T_STEP, T_STEP + 0.22), 2.5)
    for i, (fig, name, x0, dirn) in enumerate(((MAX, 'max', 560, -1), (LEWIS, 'lewis', 1360, 1), (CHARLES, 'charles', 960, 0))):
        x = x0 + dirn * 330 * step
        idle = math.sin(t * 2.0 + i * 2.1) * 2.2
        if dirn:
            moving = math.sin(math.pi * seg(t, T_STEP, T_STEP + 0.22))
            p = pose(lh=(-30, 126), rh=(30, 126), lb=-1, rb=1, tilt=idle - dirn * 3 * step, lean=dirn * 16 * moving,
                     lf=(-30 - dirn * 40 * moving, -18 * moving), rf=(30 - dirn * 40 * moving, 0), crouch=14 * moving)
            if step > 0.9:                                                           # hands behind the back, nothing to see here
                p = mixpose(p, pose(lh=(-22, 146), rh=(22, 146), lb=-1, rb=1, tilt=-dirn * 6 + idle), ease_io(seg(t, T_STEP + 0.22, T_STEP + 0.5)))
            eyes = 'side' if step > 0.5 else ('wide' if t > T_PICK else None)
            look = (dirn * 0.9, -0.6) if step > 0.5 else (-dirn * 0.8, 0)
        else:
            gulp = settle(t, T_FIRST + 0.05, 14, 6) * 16 if t > T_FIRST + 0.05 else 0
            p = pose(lh=(-30, 126), rh=(30, 126), lb=-1, rb=1, tilt=idle, crouch=max(-8, gulp))
            if t > T_PICK:
                p = mixpose(p, pose(lh=(-24, 100), rh=(56, -20), rb=-1, lb=-1, tilt=idle, crouch=max(-8, gulp), hy=4), ease_io(seg(t, T_PICK + 0.06, T_PICK + 0.3)))  # "me?"
            eyes = 'scared' if t > T_PICK else None
            look = (0, -0.5) if t < T_STEP + 0.2 else (math.sin((t - T_STEP) * 9) * 0.9, 0)
        soft_shadow(c, x, GY12 + 4, 80, 12, 0.3)
        j = fig.draw(c, x, GY12, 1.18, 1, p, t=t, eyes=eyes, look=look, cap='up')
        if dirn and 0 < step < 1:
            for q in range(3):
                yy = GY12 - 150 - q * 130
                c.drawLine(x - dirn * 70, yy, x - dirn * (190 + q * 30), yy, stroke(0xFFFFFFFF, 7, 0.8 * (1 - step)))
        if not dirn and t > T_FIRST:
            sweat(c, j['head'][0] - 78, j['head'][1] - 40, t, 1.35, seed=2)
            sweat(c, j['head'][0] + 92, j['head'][1] - 30, t + 0.4, 1.2, seed=7)
    # the finger of fate
    targets = [(52.42, 560), (52.72, 1360), (T_PICK, 960)]
    ax = keys(t, [(52.38, 560), (52.66, 560), (52.76, 1360), (52.96, 1360), (T_PICK + 0.04, 960)], ease_io)
    drop = bounce_out(seg(t, T_PICK, T_PICK + 0.34)) if t >= T_PICK else 0
    ay = 150 + 70 * drop + (math.sin(t * 16) * 10 if t < T_PICK else math.sin(t * 5) * 6)
    ak = pop(t, 52.40, 0.2, 1.8)
    if ak > 0 and zk < 0.6:
        with xf(c, ax, ay, ak * (1 - zk * 1.2)):
            ar = P(('M', -46, -150), ('L', 46, -150), ('L', 46, -30), ('L', 104, -30), ('L', 0, 90), ('L', -104, -30), ('L', -46, -30), ('Z',))
            c.save(); c.translate(8, 10); c.drawPath(ar, fill(0xFF000000, 0.3)); c.restore()
            c.drawPath(ar, fill(0xFFE3242B)); c.drawPath(ar, stroke(OUT, 9, join='round'))
    c.restore()
    sc, al = slam(t, T_FIRST, 0.15, 2.5)
    if sc > 0:
        fade = 1 - seg(t, 54.2, 54.5)
        with xf(c, 1480, 250, sc, 7):
            text(c, "FIRST!", 0, 0, "Bangers", 220, 0xFFFFE9A8, outline=OUT, ow=26, shadow=0xFF1A1208, sh=(10, 14), a=al * fade, track=4)
            text(c, "FIRST!", 0, 0, "Bangers", 220, 0xFFFFE9A8, a=al * fade, track=4)

def s12_post(c, t, ctx):
    film_fx(c, t, 1.0, seed=12)
    vignette(c, 0.5, 0.5)
    if t >= T_IRIS:
        k = ease_io(seg(t, T_IRIS, T_IRIS + 0.55), 2.2)
        hold = 1 - 0.0
        r = lerp(1250, 0, k)
        if 0.72 < k < 0.9: r = lerp(1250, 0, 0.72) * 1.0                              # a beat on his face before closing
        iris(c, 960, 590, r)

TIMELINE = [
    (T5, T6, s5, s56_post, 1),
    (T6, T6_END, s6, s56_post, 1),
    (T7, T9, s7, None, 1),
    (T9, T10, s9, None, 1),
    (T10, T11, s10, None, 1),
    (T11, T12, s11, None, 1),
    (T12, T_END, s12, s12_post, 1),
]
MB = [(T5, T6_END, 7), (T_AL, T_AL + 0.34, 4), (T_STAMP, T_STAMP + 0.22, 4), (41.42, 41.92, 5), (45.40, 46.60, 7), (47.05, 48.2, 3),
      (T11C, T11C + 0.30, 5), (52.38, 53.12, 4), (T_STEP, T_STEP + 0.3, 6), (T_FIRST, T_FIRST + 0.2, 4)]
