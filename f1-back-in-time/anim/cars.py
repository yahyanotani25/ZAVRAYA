"""Vector cars, drawn in side view facing right. Origin = ground under the rear axle..front axle span,
units are 'car units' (1000 = car length); callers scale with xf()."""
import math
import skia
from .core import *
from .rig import photo_head, HEADS

OUT = 0xFF0E0F14

def shape(c, path, color, lw=3.0, ink=OUT, shader=None):
    p = fill(color)
    if shader is not None: p.setShader(shader)
    c.drawPath(path, p)
    if lw: c.drawPath(path, stroke(ink, lw, join='round'))

# ============================================================================= modern F1 car
M_REAR, M_FRONT, M_R = 150.0, 800.0, 66.0

LIVERY_RB = dict(name='rb', base=0xFF1C2647, dark=0xFF121A33, lite=0xFF2B3966, floor=0xFF15161B, halo=0xFF161C30,
                 wing=0xFF141B33, accent=0xFFE4002B, nose=0xFFFFC906)
LIVERY_SF = dict(name='sf', base=0xFFD81E26, dark=0xFFA51219, lite=0xFFEA3A3F, floor=0xFF15161B, halo=0xFFB8141B,
                 wing=0xFF1A1A1E, accent=0xFFFFFFFF, nose=0xFFD81E26)

def f1_wheel(c, cx, cy, r, ang, band=0xFFFFD500):
    """Slick tyre with coloured sidewall marks and a wheel cover; ang in degrees."""
    c.save(); c.translate(cx, cy)
    c.drawCircle(0, 0, r, fill(0xFF1B1B1D))
    c.drawCircle(0, 0, r * 0.985, stroke(OUT, r * 0.05))
    c.save(); c.rotate(ang)
    arc = skia.Rect.MakeLTRB(-r * 0.80, -r * 0.80, r * 0.80, r * 0.80)
    pb = stroke(band, r * 0.085, cap='butt')
    for a0 in (20, 200):                                   # two long sidewall bands
        c.drawArc(arc, a0, 118, False, pb)
    pt = stroke(band, r * 0.07, cap='butt')
    for a0 in (150, 330):                                  # short 'logo' ticks between them
        for k in range(4):
            c.drawArc(arc, a0 + k * 9, 5, False, pt)
    c.restore()
    # wheel cover
    c.drawCircle(0, 0, r * 0.60, fill(0xFFB9BCC2)); c.drawCircle(0, 0, r * 0.60, stroke(OUT, r * 0.045))
    c.save(); c.rotate(ang)
    c.drawCircle(0, 0, r * 0.47, stroke(0xFF8D9097, r * 0.035))
    for k in range(5):
        a = math.radians(k * 72)
        c.drawLine(r * 0.16 * math.cos(a), r * 0.16 * math.sin(a), r * 0.46 * math.cos(a), r * 0.46 * math.sin(a), stroke(0xFF8D9097, r * 0.05))
    c.drawCircle(r * 0.33, 0, r * 0.045, fill(0xFF6D7078))   # valve, makes rotation readable
    c.restore()
    c.drawCircle(0, 0, r * 0.15, fill(0xFF7C7F86)); c.drawCircle(0, 0, r * 0.15, stroke(OUT, r * 0.035))
    c.drawCircle(-r * 0.2, -r * 0.24, r * 0.2, fill(0xFFFFFFFF, 0.16))
    c.restore()

def _bull(c, cx, cy, s, color):
    """Small charging-bull silhouette (generic, hand-built)."""
    pts = [(-30, 6), (-34, -4), (-27, -14), (-10, -17), (4, -13), (14, -17), (22, -24), (27, -22), (22, -14), (30, -8),
           (33, 0), (27, 4), (20, 0), (14, 6), (17, 15), (12, 16), (6, 7), (-10, 8), (-14, 16), (-19, 15), (-18, 6)]
    c.drawPath(spline([(cx + x * s, cy + y * s) for x, y in pts], closed=True, tension=0.35), fill(color))
    c.drawPath(P(('M', cx - 30 * s, cy - 6 * s), ('Q', cx - 44 * s, cy - 16 * s, cx - 40 * s, cy - 26 * s)), stroke(color, 2.2 * s))

def _T(c, flip, s_, x, y, *a, **kw):
    """Text inside a car; un-mirrors itself when the car is drawn flipped."""
    if flip:
        c.save(); c.translate(x, y); c.scale(-1, 1); text(c, s_, 0, 0, *a, **kw); c.restore()
    else:
        text(c, s_, x, y, *a, **kw)

def modern_f1(c, livery, wheel_ang=0.0, head=None, head_kw=None, number=None, squash=0.0, shadow=True, t=0.0, rim_band=0xFFFFD500, flip=False):
    """Draw the car; origin (0,0) = ground below the rear axle is at x=M_REAR. head = HEADS key or None (helmet)."""
    L = livery
    if shadow:
        soft_shadow(c, 500, 4, 520, 16, 0.32)
    by = squash * 6                                           # body sinks a little on its springs
    c.save(); c.translate(0, by)
    # --- far-side wheels (just a dark hint)
    for wx in (M_REAR + 8, M_FRONT + 8):
        c.drawCircle(wx, -M_R + 2 - by, M_R * 0.97, fill(0xFF101012))
    # --- rear wing
    pyl = P(('M', 150, -98), ('L', 118, -168), ('L', 104, -168), ('L', 128, -96), ('Z',))
    shape(c, pyl, 0xFF1A1B20, 2.5)
    ep = P(('M', 40, -170), ('Q', 40, -181, 52, -181), ('L', 120, -181), ('Q', 134, -179, 136, -164), ('Q', 134, -128, 120, -92),
           ('Q', 112, -70, 96, -66), ('L', 72, -66), ('Q', 52, -84, 44, -122), ('Z',))
    shape(c, ep, L['base'], 3)
    c.save(); c.clipPath(ep, True)
    c.drawRect(skia.Rect.MakeLTRB(30, -112, 140, -60), fill(L['wing']))
    c.drawPath(P(('M', 44, -160), ('Q', 88, -170, 134, -152), ('L', 134, -140), ('Q', 88, -158, 44, -148), ('Z',)), fill(shade(L['base'], -0.35)))
    c.drawPath(P(('M', 46, -140), ('Q', 88, -150, 132, -130)), stroke(shade(L['base'], -0.35), 3))
    if L['name'] == 'rb':
        _T(c, flip, "Red Bull", 88, -118, "Anton", 17, 0xFFE4002B)
    c.restore()
    c.drawPath(ep, stroke(OUT, 3, join='round'))
    # --- floor + diffuser
    fl = P(('M', 708, -17), ('L', 180, -15), ('Q', 130, -18, 104, -52), ('L', 118, -56), ('Q', 150, -30, 200, -27), ('L', 700, -29), ('Z',))
    shape(c, fl, L['floor'], 2.5)
    # --- front suspension (behind the wheel)
    for (x0, y0, x1, y1) in ((700, -86, 792, -76), (690, -56, 792, -58), (735, -98, 800, -84)):
        c.drawLine(x0, y0, x1, y1, stroke(0xFF1A1B20, 5)); c.drawLine(x0, y0, x1, y1, stroke(0xFF34363D, 2))
    # --- main body: engine cover, airbox, chassis, nose
    body = P(('M', 70, -60), ('Q', 96, -80, 150, -90), ('Q', 250, -104, 320, -124), ('Q', 380, -146, 418, -172), ('Q', 440, -184, 472, -181),
             ('Q', 490, -178, 489, -160), ('L', 493, -128), ('Q', 496, -116, 508, -115), ('L', 580, -113), ('Q', 600, -118, 625, -116),
             ('Q', 720, -104, 810, -86), ('Q', 900, -66, 958, -47), ('Q', 972, -42, 964, -35), ('Q', 900, -36, 846, -44),
             ('Q', 760, -54, 700, -44), ('Q', 650, -32, 600, -30), ('L', 200, -30), ('Q', 120, -38, 70, -60), ('Z',))
    shape(c, body, L['base'], 3.2)
    c.save(); c.clipPath(body, True)
    # shading band along the bottom + highlight along the spine
    c.drawPath(P(('M', 60, -48), ('L', 980, -48), ('L', 980, 0), ('L', 60, 0), ('Z',)), fill(L['dark']))
    c.drawPath(P(('M', 150, -92), ('Q', 300, -118, 400, -160), ('Q', 440, -180, 480, -178)), stroke(L['lite'], 5))
    c.drawPath(P(('M', 630, -113), ('Q', 760, -96, 950, -47)), stroke(L['lite'], 4))
    if L['name'] == 'rb':
        c.drawPath(P(('M', 892, -95), ('L', 1000, -95), ('L', 1000, -20), ('L', 918, -20), ('Z',)), fill(L['nose']))  # yellow nose tip
        c.drawPath(P(('M', 200, -97), ('Q', 330, -120, 420, -168)), stroke(L['accent'], 3))
        c.drawPath(P(('M', 640, -100), ('Q', 760, -86, 880, -62)), stroke(L['accent'], 3))
        c.drawCircle(352, -122, 23, fill(0xFFFFC906)); _bull(c, 350, -120, 0.86, 0xFFDB0A2B)
    else:
        c.drawPath(P(('M', 250, -106), ('Q', 350, -134, 418, -174), ('L', 492, -182), ('L', 492, -120), ('Q', 380, -118, 250, -84), ('Z',)), fill(0xFFFFFFFF))
        c.drawCircle(402, -146, 17, fill(0xFF0A6ED1)); _T(c, flip, "hp", 402, -139, "Anton", 20, 0xFFFFFFFF)
        c.drawPath(P(('M', 640, -103), ('Q', 760, -88, 900, -58)), stroke(0xFFFFFFFF, 3))
    c.restore()
    c.drawPath(body, stroke(OUT, 3.2, join='round'))
    # --- sidepod
    sp = P(('M', 614, -108), ('Q', 560, -114, 470, -110), ('Q', 340, -100, 240, -76), ('Q', 190, -62, 168, -52),
           ('Q', 170, -30, 210, -26), ('Q', 380, -20, 480, -24), ('Q', 560, -30, 596, -44), ('Q', 618, -52, 618, -70), ('Z',))
    shape(c, sp, L['base'], 3.0)
    c.save(); c.clipPath(sp, True)
    c.drawPath(P(('M', 160, -44), ('Q', 400, -34, 620, -58), ('L', 620, 0), ('L', 160, 0), ('Z',)), fill(L['dark']))
    c.drawPath(P(('M', 250, -80), ('Q', 420, -108, 606, -106)), stroke(L['lite'], 4))
    if L['name'] == 'rb':
        _T(c, flip, "ORACLE", 392, -47, "Anton", 44, 0xFFFFFFFF, track=3)
    else:
        sh = P(('M', 360, -96), ('L', 392, -96), ('L', 392, -66), ('Q', 376, -50, 360, -66), ('Z',))
        c.drawPath(sh, fill(0xFFFFD100)); c.drawPath(sh, stroke(OUT, 1.6))
        c.drawPath(P(('M', 368, -70), ('Q', 372, -86, 382, -90), ('Q', 380, -78, 386, -70)), stroke(OUT, 2.4))
        if number:
            _T(c, flip, str(number), 500, -50, "Anton", 50, 0xFFFFFFFF)
        _T(c, flip, "Shell", 290, -40, "Anton", 22, 0xFFFFD100)
    c.restore()
    c.drawPath(sp, stroke(OUT, 3.0, join='round'))
    inlet = P(('M', 614, -106), ('Q', 624, -90, 618, -62), ('Q', 606, -70, 600, -100), ('Z',))
    shape(c, inlet, 0xFF08090C, 2.2)
    # --- cockpit hole + driver
    c.drawPath(P(('M', 500, -116), ('L', 580, -114), ('L', 574, -104), ('L', 508, -104), ('Z',)), fill(0xFF08090C))
    if not head:
        hel = P(('M', 512, -114), ('Q', 510, -152, 542, -154), ('Q', 574, -152, 572, -114), ('Z',))
        shape(c, hel, L['accent'] if L['name'] == 'rb' else 0xFFFFD100, 2.5)
        c.drawPath(P(('M', 540, -138), ('L', 572, -134), ('L', 572, -122), ('L', 544, -124), ('Z',)), fill(0xFF15161B))
    # --- halo + mirror
    halo = P(('M', 618, -116), ('Q', 600, -146, 572, -152), ('L', 494, -156))
    c.drawPath(halo, stroke(OUT, 13)); c.drawPath(halo, stroke(L['halo'], 8)); c.drawPath(P(('M', 600, -140), ('Q', 588, -150, 572, -153), ('L', 520, -156)), stroke(shade(L['halo'], 0.3), 2))
    mir = P(('M', 596, -120), ('L', 604, -134), ('L', 628, -136), ('L', 630, -126), ('Z',))
    shape(c, mir, L['base'], 2.2)
    if head:
        kw = dict(head_kw or {})
        c.save(); c.clipRect(skia.Rect.MakeLTRB(430, -400, 660, -112))
        photo_head(c, head, kw.pop('x', 541), kw.pop('y', -104), kw.pop('w', 84), t=t, **kw)
        c.restore()
    # --- front wing
    for (x0, y0, x1, y1) in ((928, -42, 936, -26), (948, -40, 952, -26)):
        c.drawLine(x0, y0, x1, y1, stroke(OUT, 5))
    fw = P(('M', 896, -44), ('Q', 950, -52, 990, -40), ('Q', 1004, -32, 1000, -14), ('L', 902, -10), ('Q', 892, -24, 896, -44), ('Z',))
    shape(c, fw, L['wing'], 3)
    for k, yy in enumerate((-36, -28, -20)):
        c.drawPath(P(('M', 902, yy), ('Q', 950, yy - 6, 996, yy + 6)), stroke(shade(L['wing'], 0.22), 2.2))
    if L['name'] == 'rb':
        c.drawPath(P(('M', 905, -13), ('L', 998, -16)), stroke(L['accent'], 3))
    c.restore()
    # --- wheels
    f1_wheel(c, M_REAR, -M_R, M_R, wheel_ang, rim_band)
    f1_wheel(c, M_FRONT, -M_R, M_R, wheel_ang, rim_band)

# ============================================================================= 1950s grand prix car
V_REAR, V_FRONT, V_R = 212.0, 772.0, 88.0

def wire_wheel(c, cx, cy, r, ang, tyre=0xFF1F1F21):
    """Tall skinny cross-ply tyre on a wire wheel with a knock-off spinner."""
    c.save(); c.translate(cx, cy)
    c.drawCircle(0, 0, r, fill(tyre)); c.drawCircle(0, 0, r, stroke(OUT, r * 0.045))
    c.drawCircle(0, 0, r * 0.86, stroke(0xFF343437, r * 0.03))
    c.drawCircle(0, 0, r * 0.70, fill(0xFFCBCFD4)); c.drawCircle(0, 0, r * 0.70, stroke(OUT, r * 0.04))
    c.drawCircle(0, 0, r * 0.615, fill(0xFF3B3D42))
    c.save(); c.rotate(ang)
    sp = stroke(0xFFDADDE2, r * 0.017); sp2 = stroke(0xFFA9ADB3, r * 0.015)
    n = 20
    for k in range(n):                                       # two laced layers of spokes
        a = 2 * math.pi * k / n
        b1, b2 = a + 0.42, a - 0.42
        c.drawLine(r * 0.13 * math.cos(b1), r * 0.13 * math.sin(b1), r * 0.61 * math.cos(a), r * 0.61 * math.sin(a), sp)
        c.drawLine(r * 0.13 * math.cos(b2), r * 0.13 * math.sin(b2), r * 0.61 * math.cos(a + math.pi / n), r * 0.61 * math.sin(a + math.pi / n), sp2)
    c.drawCircle(0, 0, r * 0.16, fill(0xFFD7DADF)); c.drawCircle(0, 0, r * 0.16, stroke(OUT, r * 0.03))
    ear = P(('M', -r * 0.26, -r * 0.035), ('L', r * 0.26, -r * 0.035), ('L', r * 0.22, r * 0.045), ('L', -r * 0.22, r * 0.045), ('Z',))
    c.drawPath(ear, fill(0xFFE4E7EB)); c.drawPath(ear, stroke(OUT, r * 0.028))
    c.drawCircle(0, 0, r * 0.07, fill(0xFF9A9EA5))
    c.restore()
    c.drawCircle(-r * 0.28, -r * 0.3, r * 0.22, fill(0xFFFFFFFF, 0.10))
    c.restore()

def vintage_gp(c, base=0xFFC4161C, wheel_ang=0.0, number="2", head=None, head_kw=None, shadow=True, bounce=0.0, t=0.0,
               driver=True, dark=None, lite=None, steer=0.0, exhaust=True, arm=True, flip=False):
    """Front-engined 1950s single-seater (in the spirit of a Maserati 250F), facing right."""
    dark = dark or shade(base, -0.32); lite = lite or shade(base, 0.22)
    if shadow:
        soft_shadow(c, 500, 5, 500, 17, 0.30)
    c.save(); c.translate(0, bounce)
    # far-side wheels
    for wx in (V_REAR + 14, V_FRONT + 14):
        c.drawCircle(wx, -V_R + 3 - bounce, V_R * 0.98, fill(0xFF121213))
    # axle / suspension hints
    c.drawLine(V_FRONT - 70, -98, V_FRONT + 6, -90, stroke(0xFF2A2B2F, 7))
    c.drawLine(V_FRONT - 66, -62, V_FRONT + 6, -78, stroke(0xFF2A2B2F, 7))
    c.drawLine(V_REAR - 10, -92, V_REAR + 80, -84, stroke(0xFF2A2B2F, 8))
    # body: cigar with tail
    body = P(('M', 22, -104), ('Q', 18, -128, 60, -142), ('Q', 200, -176, 352, -172), ('L', 372, -160), ('L', 520, -160),
             ('Q', 640, -156, 800, -138), ('Q', 930, -122, 978, -104), ('Q', 996, -92, 990, -72), ('Q', 980, -54, 940, -50),
             ('Q', 700, -40, 480, -40), ('Q', 200, -42, 70, -62), ('Q', 30, -76, 22, -104), ('Z',))
    shape(c, body, base, 3.4)
    c.save(); c.clipPath(body, True)
    c.drawPath(P(('M', 0, -78), ('Q', 500, -52, 1000, -78), ('L', 1000, 0), ('L', 0, 0), ('Z',)), fill(dark))
    c.drawPath(P(('M', 60, -138), ('Q', 210, -170, 350, -166)), stroke(lite, 7))
    c.drawPath(P(('M', 530, -154), ('Q', 760, -142, 960, -106)), stroke(lite, 7))
    # bonnet louvres + strap
    for k in range(9):
        x = 668 + k * 17
        c.drawLine(x, -128, x - 8, -106, stroke(dark, 3.4))
    c.drawPath(P(('M', 556, -160), ('Q', 550, -100, 556, -42)), stroke(0xFF5A3A22, 6))
    c.drawPath(P(('M', 828, -140), ('Q', 822, -96, 828, -46)), stroke(0xFF5A3A22, 6))
    # race number roundels
    for rx, ry, rr in ((612, -101, 31), (908, -92, 24)):
        c.drawCircle(rx, ry, rr, fill(0xFFF5F2E8)); c.drawCircle(rx, ry, rr, stroke(OUT, 2.4))
        _T(c, flip, str(number), rx, ry + rr * 0.44, "Anton", rr * 1.25, 0xFF161616)
    c.restore()
    c.drawPath(body, stroke(OUT, 3.4, join='round'))
    # nose intake
    gr = P(('M', 978, -103), ('Q', 998, -90, 990, -72), ('Q', 984, -60, 970, -58), ('Q', 962, -80, 978, -103), ('Z',))
    shape(c, gr, 0xFF141416, 2.6)
    # cockpit opening
    c.drawPath(P(('M', 372, -160), ('L', 520, -160), ('Q', 512, -140, 500, -134), ('L', 392, -134), ('Q', 376, -144, 372, -160), ('Z',)), fill(0xFF1A1211))
    # driver: shoulders, arm to the wheel, head
    if driver:
        torso = P(('M', 384, -138), ('Q', 380, -196, 430, -204), ('Q', 468, -200, 476, -160), ('L', 478, -138), ('Z',))
        shape(c, torso, 0xFFE9E4D6, 2.8)
        if head:
            kw = dict(head_kw or {})
            photo_head(c, head, kw.pop('x', 432), kw.pop('y', -196), kw.pop('w', 112), t=t, **kw)
        else:
            c.drawCircle(432, -232, 34, fill(0xFF7A4A2A)); c.drawCircle(432, -232, 34, stroke(OUT, 2.8))
    # big wood-rim steering wheel seen edge-on behind the screen
    c.save(); c.translate(512, -182); c.rotate(-18 + steer)
    c.drawRoundRect(skia.Rect.MakeLTRB(-6, -40, 6, 40), 6, 6, fill(0xFF8A5A2B)); c.drawRoundRect(skia.Rect.MakeLTRB(-6, -40, 6, 40), 6, 6, stroke(OUT, 2.4))
    c.restore()
    if driver and arm:
        c.drawPath(P(('M', 452, -186), ('Q', 486, -160, 508, -178)), stroke(OUT, 15)); c.drawPath(P(('M', 452, -186), ('Q', 486, -160, 508, -178)), stroke(0xFFE9E4D6, 10))
    # wrap-around perspex screen
    scr = P(('M', 520, -160), ('Q', 524, -196, 556, -206), ('Q', 572, -184, 584, -158), ('Z',))
    c.drawPath(scr, fill(0xFFCFE6EE, 0.55)); c.drawPath(scr, stroke(OUT, 2.6))
    c.drawLine(534, -168, 548, -196, stroke(0xFFFFFFFF, 3, 0.8))
    # headrest fairing edge + fuel filler
    c.drawPath(P(('M', 352, -172), ('L', 372, -160)), stroke(OUT, 3.4))
    c.drawCircle(120, -150, 9, fill(0xFFB9BCC2)); c.drawCircle(120, -150, 9, stroke(OUT, 2.2))
    # twin exhausts down the flank
    if exhaust:
        for dy in (0, 13):
            ex = P(('M', 690, -84 + dy * 0.5), ('Q', 660, -66 + dy, 600, -64 + dy), ('L', 300, -68 + dy))
            c.drawPath(ex, stroke(OUT, 12.5)); c.drawPath(ex, stroke(0xFFB7B3A8, 7.5))
            c.drawLine(300, -68 + dy, 290, -68 + dy, stroke(0xFF2A2A2C, 9, cap='butt'))
    c.restore()
    wire_wheel(c, V_REAR, -V_R, V_R, wheel_ang)
    wire_wheel(c, V_FRONT, -V_R * 0.96, V_R * 0.96, wheel_ang)
