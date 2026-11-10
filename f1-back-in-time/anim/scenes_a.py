"""Scenes 1-4: intro, the 'starter pack' list, the drivers, the trip back to the 1950s.
All times are seconds on the voice-over clock."""
import math
import skia
from .core import *
from .rig import *
from .art import *
from .cars import *

NARR = Fig('narrator', seed=1)
MAX, CHARLES, LEWIS = Fig('max', seed=2, head_w=184), Fig('charles', seed=3, head_w=160), Fig('lewis', seed=4, head_w=168)

def bg_photo(c, name, zoom=1.0, ox=0.0, oy=0.0, sepia=0.0, dark=0.0, blur=0.0):
    p = skia.Paint(AntiAlias=True)
    if sepia: p.setColorFilter(sepia_filter(sepia))
    if blur: p.setImageFilter(skia.ImageFilters.Blur(blur, blur))
    cover(c, image("bg/" + name), zoom=zoom, ox=ox, oy=oy, paint=p)
    if dark: c.drawRect(skia.Rect.MakeWH(W, H), fill(0xFF000000, dark))

def cam(c, cx, cy, z, shk=(0, 0)):
    """Zoom the whole frame about (cx, cy)."""
    c.translate(W / 2 + shk[0], H / 2 + shk[1]); c.scale(z, z); c.translate(-cx, -cy)

# ============================================================================= S1a  0.00 - 2.00
def s1a(c, t, ctx):
    z = lerp(1.14, 1.19, seg(t, 0, 2.2))
    bg_photo(c, "pit.jpg", zoom=z, ox=-90, oy=-40)
    rise = (1 - back_out(seg(t, 0.0, 0.34), 1.6)) * 420
    bobv = 7 * math.sin(t * 2.4)
    p = posekeys(t, [
        (0.00, pose(rh=(30, 150), tilt=0)),
        (0.30, pose(rh=(40, 120), tilt=-3)),
        (0.62, pose(rh=(128, -6), rb=-1.0, tilt=3, lean=2)),
        (1.10, pose(rh=(122, 4), rb=-1.0, tilt=2, lean=2)),
        (1.36, pose(rh=(96, -52), rb=-1.0, tilt=-2, lean=1)),
        (1.62, pose(rh=(104, -44), rb=-1.0, tilt=7, lean=3)),
        (2.10, pose(rh=(100, -40), rb=-1.0, tilt=6, lean=3))])
    brow = None if t < 1.4 else (-6, 10, 0.6)
    ex = expr('line', 'talk', brow=brow, look=(0.6, 0))
    NARR.draw(c, 640, 1720 + rise + bobv, 3.0, 1, p, ex, t=t, talk=ctx['talk'](t))

# ============================================================================= S1b  2.00 - 4.52
def s1b(c, t, ctx):
    k_in = ease_out(seg(t, 2.0, 2.78), 3)
    car_x = lerp(-2200, 160, k_in)
    dip = settle(t, 2.74, 13, 6.5) * 1.0 if t > 2.74 else 0
    shk = shake(t, 2.76, 7, 0.3)
    c.save()
    if t < 2.98:
        cam(c, 1000, 560, 1.0, shk)
    else:                                                        # punch in for the sunglasses
        zz = lerp(1.74, 1.86, seg(t, 2.98, 4.6)) + 0.05 * settle(t, 2.98, 26, 12)
        cam(c, 160 + 560 * 1.56, 905 - 128 * 1.56, zz, shk)
    bg_photo(c, "pit.jpg", zoom=1.42, ox=-150 - 60 * (1 - k_in), oy=-190)
    S = 1.56; gy = 905
    if t < 2.7:
        speed_lines(c, t, 0, W, 300, 880, n=16, a=0.5 * (1 - k_in), seed=3, direction=1)
    wheel = (car_x + 2200) / (M_R * S) * 57.3
    with xf(c, car_x, gy, S, -dip * 0.9):
        modern_f1(c, LIVERY_RB, wheel, head='max', head_kw=dict(w=98, y=-103, shades=seg(t, 3.02, 3.36) if t > 3.02 else None), squash=max(0, dip))
    # brake dust at the tyres
    for wx in (M_REAR, M_FRONT):
        poof(c, car_x + wx * S + 40, gy - 20, 70, seg(t, 2.62, 3.25), color=0xFFE9E6DF, n=7, seed=int(wx))
    # twinkle on the shades at "history"
    kx, ky = car_x + 541 * S, gy - 150 * S
    for (t0, dx, dy, r) in ((3.80, 30, -4, 44), (3.96, -34, 6, 30)):
        k = seg(t, t0, t0 + 0.42)
        if 0 < k < 1:
            rr = r * math.sin(math.pi * k)
            with xf(c, kx + dx, ky + dy, 1.0, k * 90):
                c.drawPath(star(0, 0, rr, rr * 0.16, 4), fill(0xFFFFFFFF)); c.drawPath(star(0, 0, rr, rr * 0.16, 4), stroke(OUT, 2.5))
    c.restore()

# ============================================================================= S2  4.52 - 13.50  (starter pack + taking it away)
ITEMS = [  # cue, label, (x, y), disc colour
    (4.68, "SIMULATORS",    (300, 345),  0xFFCFE8FA),
    (5.46, "TELEMETRY",     (700, 345),  0xFFFFF0B8),
    (6.20, "ENGINEERS",     (1100, 345), 0xFFFAD4D4),
    (7.00, "SURVIVAL CELL", (1500, 345), 0xFFDFE3E8),
    (8.66, "HALO",          (380, 735),  0xFFE6DBFA),
    (9.40, "HANS",          (790, 735),  0xFFD3F2DC),
    (9.88, "MEDICAL TEAM",  (1200, 735), 0xFFFFE0C2),
]
SACK_X, SACK_Y = 1440, 1082
T_TAKE = 11.80

def _icon(c, i, t):
    if i == 0: icon_sim(c, t)
    elif i == 1: icon_telemetry(c, seg(t, ITEMS[1][0] + 0.12, ITEMS[1][0] + 0.75), t)
    elif i == 2: icon_engineers(c, t)
    elif i == 3: icon_cell(c)
    elif i == 4: icon_halo(c)
    elif i == 5: icon_hans(c)
    else: icon_medical(c, t)

def _fly(i):
    return T_TAKE + 0.02 + i * 0.135

def s2(c, t, ctx):
    c.drawRect(skia.Rect.MakeWH(W, H), fill(PAPER))
    # faint paper texture: a few pencil guide lines
    for y in (150, 555, 950):
        c.drawLine(60, y + wiggle(y, 1, 3, 2), W - 60, y + wiggle(y + 5, 1, 3, 4), stroke(0xFFE9E5DA, 3))
    # title
    tk = pop(t, 4.56, 0.3, 1.6)
    t_out = seg(t, _fly(7), _fly(7) + 0.36)
    if tk > 0 and t_out < 1:
        tx, ty, ts, tr = 900, 118, tk, -1.2
        if t_out > 0:
            e = ease_in(t_out, 2)
            tx = lerp(900, SACK_X, e); ty = lerp(118, SACK_Y - 215, e) - 160 * math.sin(math.pi * e); ts = lerp(1, 0.12, e); tr = lerp(-1.2, 40, e)
        with xf(c, tx, ty, ts, tr):
            text(c, "THE MODERN F1 DRIVER", -150, 28, "Bangers", 92, OUT, track=2)
            w1 = text_w("THE MODERN F1 DRIVER", "Bangers", 92, 2)
            text(c, "STARTER PACK", w1 / 2 - 150 + 34, 28, "Bangers", 92, 0xFFE3242B, align='l', track=2)
            c.drawPath(rough(P(('M', -w1 / 2 - 150, 50), ('L', w1 / 2 + 420, 46)), 2, 120, 5, 12), stroke(OUT, 6))
    # icons
    caught = 0
    for i, (cue, lab, (x, y), disc) in enumerate(ITEMS):
        k = pop(t, cue, 0.30, 2.0)
        if k <= 0: continue
        f0 = _fly(i); fk = seg(t, f0, f0 + 0.40)
        if fk >= 1: caught += 1; continue
        px, py, sc, rot = x, y, 1.28 * k, 7 * settle(t, cue, 21, 7)
        dk = pop(t, cue - 0.03, 0.26, 1.4)
        if fk > 0:
            e = ease_in(fk, 1.8)
            px = lerp(x, SACK_X, e); py = lerp(y, SACK_Y - 225, e) - (220 + 60 * (i % 2)) * math.sin(math.pi * e) * (1 - 0.3 * e)
            sc = 1.28 * lerp(1, 0.16, e); rot = (1 if i % 2 else -1) * 260 * e; dk = max(0, 1 - e * 1.6)
        else:
            py += 5 * math.sin(t * 2.1 + i * 1.3)                              # gentle float
            burst(c, x, y, 150, 235, seg(t, cue, cue + 0.34), n=14, color=0xFFE3242B if i % 2 else OUT, w=6, seed=i)
            if T_TAKE - 0.5 < t < f0:                                           # tremble before being grabbed
                amp = 4 * seg(t, T_TAKE - 0.5, T_TAKE)
                px += wiggle(t, 22, amp, i); py += wiggle(t, 22, amp, i + 9)
        if dk > 0:
            c.drawPath(blob(px, py, 152 * dk * sc / 1.28, 146 * dk * sc / 1.28, i, 0.035, 14), fill(disc))
        with xf(c, px, py, sc, rot):
            _icon(c, i, t)
        lk = pop(t, cue + 0.09, 0.24, 1.8)
        if lk > 0 and fk <= 0:
            label(c, lab, x, y + 196, 46, k=lk, rot=(-2.5, 2, -1.5, 2.5, -2, 2, -1)[i], lw=4.5)
    # the narrator and his sack
    if t > 10.80:
        k_in = back_out(seg(t, 10.86, 11.24), 1.3)
        k_out = ease_in(seg(t, 13.06, 13.46), 2.2)
        nx = lerp(2260, 1700, k_in) + 900 * k_out
        hop = 0
        for i in range(8):                                                     # sack jolts as each thing lands
            hop += 16 * settle(t, _fly(i) + 0.40, 26, 9) if t > _fly(i) + 0.40 else 0
        full = clamp(sum(1 for i in range(7) if t > _fly(i) + 0.40) / 7.0)
        sk = back_out(seg(t, 11.26, 11.56), 1.6)
        sx = SACK_X + 900 * k_out
        swing = ease_io(seg(t, 11.70, 11.92)) - ease_io(seg(t, 12.95, 13.1))
        p = posekeys(t, [
            (10.86, pose(rh=(40, 60), lh=(-70, 60), lb=-1, lean=-4)),
            (11.24, pose(rh=(60, 40), lh=(-96, 96), lb=-1, lean=-8, tilt=-4)),
            (11.70, pose(rh=(70, 30), lh=(-120, 120), lb=-1, lean=-8, tilt=-4)),
            (11.92, pose(rh=(-40, -150), rb=1, lh=(-150, 96), lb=-1, lean=-14, tilt=-8)),
            (12.90, pose(rh=(-70, -140), rb=1, lh=(-150, 96), lb=-1, lean=-14, tilt=-8)),
            (13.10, pose(rh=(-60, 40), rb=1, lh=(-150, 60), lb=-1, lean=-4, tilt=4))])
        beck = math.sin((t - 11.92) * 22) * 14 * (1 if 11.92 < t < 12.9 else 0)  # "come here" hand wiggle
        p = dict(p); p['rh'] = (p['rh'][0] + beck, p['rh'][1] - abs(beck) * 0.4)
        ex = expr('line', 'grin' if 11.5 < t < 13.0 else 'talk', brow=(14, -14, -0.2) if t > 11.2 else None, look=(0.5, 0.3))
        if sk > 0:
            with xf(c, sx, SACK_Y - hop * 0.4, sk, 0, sx=sk * (1 + 0.05 * hop / 16), sy=sk * (1 - 0.05 * hop / 16)):
                sack(c, bulge=full * 0.95, open_=1.0 - 0.8 * ease_io(seg(t, 12.92, 13.08)))
        NARR.draw(c, nx, 1345, 1.38, -1, p, ex, t=t, talk=ctx['talk'](t) if t < 11.5 or t > 13.0 else 0)

# ============================================================================= S3  13.50 - 18.46
DRV = [(14.16, MAX, 'max', 580, "MAX VERSTAPPEN"), (15.16, CHARLES, 'charles', 960, "CHARLES LECLERC"), (16.36, LEWIS, 'lewis', 1340, "LEWIS HAMILTON")]
GY3 = 950
T_BOX, T_LAND = 16.96, 17.28

def _drop(t, cue):
    """(y offset, crouch) for a figure dropping in from above."""
    if t < cue: return (None, 0)
    k = seg(t, cue, cue + 0.24)
    y = -(1 - ease_in(k, 2.0)) * 1150
    cr = 0
    if t >= cue + 0.24:
        cr = 62 * settle(t, cue + 0.24, 17, 8)
    return (y, max(-18, cr))

def s3(c, t, ctx):
    shk = shake(t, T_LAND, 20, 0.4)
    for cue, _, _, _, _ in DRV:
        s_ = shake(t, cue + 0.24, 6, 0.2); shk = (shk[0] + s_[0], shk[1] + s_[1])
    z = lerp(1.03, 1.0, ease_out(seg(t, 13.5, 14.3)))
    c.save(); cam(c, W / 2, H / 2, z, shk)
    bg_photo(c, "pit.jpg", zoom=1.12, ox=-30, oy=-30)
    # parked cars behind
    with xf(c, -940, 828, 1.42): modern_f1(c, LIVERY_RB, 20)
    with xf(c, 2860, 828, 1.42, sx=-1.42, sy=1.42): modern_f1(c, LIVERY_SF, 70, number=16, flip=True)
    box_k = seg(t, T_BOX, T_LAND)
    in_box = t >= T_LAND
    # shadow of the incoming box
    if 0 < box_k < 1:
        soft_shadow(c, 960, GY3 + 6, 640 * (0.4 + 0.6 * box_k), 34 * (0.4 + 0.6 * box_k), 0.35 * box_k)
    if not in_box:
        for cue, fig, name, x, lab in DRV:
            yo, cr = _drop(t, cue)
            if yo is None: continue
            idle = math.sin(t * 2.2 + x) * 3
            look_up = seg(t, T_BOX - 0.06, T_BOX + 0.1)
            if name == 'max':
                p = pose(lh=(-52, 132), rh=(52, 132), lb=-1, rb=1, crouch=cr, tilt=idle * 0.4)
            elif name == 'charles':
                wv = math.sin((t - cue) * 11) * 22 if cue + 0.4 < t < cue + 1.5 else 0
                p = pose(lh=(-24, 150), rh=(92 + wv, -96), rb=-1, crouch=cr, tilt=3 + idle * 0.4) if t < cue + 1.6 else pose(lh=(-24, 150), rh=(24, 150), crouch=cr, tilt=idle * 0.4)
            else:
                p = pose(lh=(-50, 130), rh=(60, 60), lb=-1, rb=-1, crouch=cr, tilt=-2 + idle * 0.4)
            if look_up > 0:
                p = mixpose(p, pose(lh=(-90, -40), rh=(90, -40), lb=1, rb=-1, crouch=30, tilt=0, hy=6), look_up)
            eyes = 'scared' if look_up > 0.3 else None
            soft_shadow(c, x, GY3 + 4, 80, 12, 0.28 * (1 if yo == 0 else 0.3))
            fig.draw(c, x, GY3 + yo, 1.2, 1, p, t=t, eyes=eyes, look=(0, -0.8))
            poof(c, x, GY3 - 6, 80, seg(t, cue + 0.24, cue + 0.74), n=8, seed=x)
            lk = pop(t, cue + 0.30, 0.26, 1.9) * (1 - ease_in(seg(t, T_BOX - 0.1, T_BOX + 0.06), 2))
            if lk > 0:
                label(c, lab, x, GY3 + 52, 44, k=lk, rot=(-2, 1.5, -1.5)[DRV.index((cue, fig, name, x, lab))])
    # the time machine
    if t >= T_BOX:
        by = GY3 + 18 - (1 - ease_in(box_k, 2.2)) * 1500
        sq = settle(t, T_LAND, 20, 7) * 0.09 if in_box else 0
        rattle = seg(t, T_LAND + 0.15, T_LAND + 0.5) * (1 - 0.0)
        rx = wiggle(t, 26, 12 * rattle, 3); rr = wiggle(t, 21, 1.8 * rattle, 5)
        with xf(c, 960 + rx, by, 1.0, rr, sx=1.8 * (1 + sq), sy=1.8 * (1 - sq)):
            time_box(c, t, glow=rattle)
        if in_box:
            for sgn in (-1, 1):
                poof(c, 960 + sgn * 560, GY3 - 4, 130, seg(t, T_LAND, T_LAND + 0.6), n=9, seed=7 + sgn)
            # lightning while it 'charges'
            if t > T_LAND + 0.2:
                f = int(t * FPS / 2)
                for i in range(4):
                    if rnd(f * 4 + i, 3) < 0.6:
                        a = rnd(f + i * 7, 5) * math.pi * 2
                        x0, y0 = 960 + 520 * math.cos(a), 560 + 380 * math.sin(a)
                        bolt(c, x0, y0, x0 + 230 * math.cos(a) + 60 * (rnd(f + i, 8) - 0.5), y0 + 230 * math.sin(a), seed=f + i, w=9)
    c.restore()
    fl = ease_in(seg(t, 18.20, 18.44), 1.6)
    if fl > 0: c.drawRect(skia.Rect.MakeWH(W, H), fill(0xFFFFFFFF, fl))

# ============================================================================= S4  18.46 - 24.56
GY4 = 1012
T_LIFT = 18.95
SLAM1, SLAM2 = 21.80, 23.04
T_PASS = 20.0

def s4(c, t, ctx):
    shk = (0.0, 0.0)
    for t0, amp in ((SLAM1 + 0.14, 24), (SLAM2 + 0.14, 24), (T_PASS + 0.22, 12)):
        s_ = shake(t, t0, amp, 0.38); shk = (shk[0] + s_[0], shk[1] + s_[1])
    z = lerp(1.0, 1.035, seg(t, 18.46, 24.6))
    c.save(); cam(c, W / 2, H / 2, z, shk)
    bg_photo(c, "y1957_pits.jpg", zoom=1.09, ox=0, oy=-14, sepia=0.85)
    c.drawRect(skia.Rect.MakeWH(W, H), fill(0xFF2A1A08, 0.10))
    # period onlookers
    lift = ease_in(seg(t, T_LIFT, T_LIFT + 0.34), 2)
    blown = ease_out(seg(t, T_PASS + 0.12, T_PASS + 0.30)) * (1 - ease_io(seg(t, T_PASS + 0.75, T_PASS + 1.25)))
    if t >= T_LIFT - 0.02:
        for i, (cue, fig, name, x, lab) in enumerate(DRV):
            fl1 = settle(t, SLAM1 + 0.14, 18, 7) * 46 if t > SLAM1 + 0.14 else 0
            fl2 = settle(t, SLAM2 + 0.14, 18, 7) * 46 if t > SLAM2 + 0.14 else 0
            cr = max(-10, fl1) + max(-10, fl2)
            idle = math.sin(t * 2.0 + i * 2.1) * 2.5
            lookx = math.sin(t * 1.7 + i * 2.3) * 0.8 if t < T_PASS else (-0.9 if t < T_PASS + 1.2 else math.sin(t * 2.2 + i) * 0.7)
            looky = -0.7 if (t > SLAM1 and t < 24.0) else 0.0
            p = pose(lh=(-34, 120), rh=(34, 120), lb=-1, rb=1, crouch=18 + cr, tilt=idle)
            if blown > 0:
                p = mixpose(p, pose(lh=(60, -70), rh=(120, -40), lb=1, rb=-1, lean=22, tilt=10, crouch=10, lf=(-60, 0), rf=(10, 0)), blown)
            soft_shadow(c, x, GY4 + 4, 80, 12, 0.3)
            j = fig.draw(c, x, GY4, 1.18, 1, p, t=t, eyes='scared', look=(lookx, looky), cap='up')
            if t > 23.2 and name == 'max':
                sweat(c, j['head'][0] - 70, j['head'][1] - 50, t, 1.3, seed=4)
    # the box flies off
    if lift < 1:
        with xf(c, 960, GY4 + 18 - lift * 1500, 1.0, lift * 14, sx=1.8, sy=1.8 * (1 + lift * 0.25)):
            time_box(c, t, glow=0.3)
    for sgn, sd in ((-1, 3), (0, 4), (1, 5)):
        poof(c, 960 + sgn * 420, GY4 - 240, 190, seg(t, T_LIFT, T_LIFT + 0.7), n=10, seed=sd)
    # a 1950s car screams past, far too close
    pk = seg(t, T_PASS, T_PASS + 0.62)
    if 0 < pk < 1:
        cx_ = lerp(2500, -2600, pk)
        with xf(c, cx_, 1110, 2.1, sx=-2.1, sy=2.1):
            vintage_gp(c, base=0xFF2F6E49, wheel_ang=-pk * 4000, number="7", head=None, bounce=wiggle(t, 14, 3, 2), flip=True)
        speed_lines(c, t, 0, W, 760, 1080, n=12, a=0.55, seed=6, direction=-1, color=0xFFF3EAD2)
    for i in range(3):
        poof(c, 420 + i * 520, 1030, 85, seg(t, T_PASS + 0.2 + i * 0.03, T_PASS + 0.95 + i * 0.03), color=0xD8E4DAC2, n=7, seed=20 + i, ink=False)
    c.restore()
    # the decades
    for (t0, s_, x, y, r) in ((SLAM1, "THE 1950s", 505, 262, -4), (SLAM2, "& 1960s", 1400, 276, 3.5)):
        sc, al = slam(t, t0)
        if sc > 0:
            with xf(c, x, y, sc, r):
                text(c, s_, 0, 0, "Bangers", 212, 0xFFFFE9A8, outline=OUT, ow=26, shadow=0xFF1A1208, sh=(10, 14), a=al, track=4)
                text(c, s_, 0, 0, "Bangers", 212, 0xFFFFE9A8, a=al, track=4)
            burst(c, x, y - 70, 420, 560, seg(t, t0 + 0.14, t0 + 0.5), n=16, color=0xFFFFE9A8, w=9, seed=int(x))
    wf = 1 - ease_out(seg(t, 18.46, 18.74), 1.5)
    if wf > 0: c.drawRect(skia.Rect.MakeWH(W, H), fill(0xFFFFFFFF, wf))

def s4_post(c, t, ctx):
    film_fx(c, t, 1.0, seed=4)
    vignette(c, 0.5, 0.5)
