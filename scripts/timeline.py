"""Edit decision list for the Souq Umm Besher reel.

Everything sits on a 120 BPM grid (1 beat = 0.5 s = 15 frames, 1 bar = 2 s),
so cuts, text hits and the soundtrack all land on the music.
Shared by render.py (picture) and audio.py (music + SFX).
"""

FPS = 30
W, H = 1080, 1920
BPM = 120
DURATION = 43.0                       # seconds
NFRAMES = int(round(DURATION * FPS))  # 1290

# Drops / big hits (camera shake + impact SFX)
IMPACTS = [4.0, 20.0, 34.0, 38.0]

# ---------------------------------------------------------------------------
# Shots: (start_s, dur_s, clip, src_in_s, speed, motion, transition_in)
#   speed  : float (constant) | ('ramp', v_start, v_end)
#   motion : dict(z=(z0,z1), c=((x0,y0),(x1,y1)), r=(r0,r1))  (all optional)
#            z = zoom factor, c = centre offset as fraction of frame, r = degrees
#   transition_in: open | zoom | punch | whip-left/right/up/down | flash |
#                  glitch | leak | spin
# ---------------------------------------------------------------------------
SHOTS = [
    # --- HOOK -------------------------------------------------------------
    (0.0, 1.5, '9331', 0.10, 1.0, dict(z=(1.14, 1.02), r=(2.5, 0.0)), 'open'),
    (1.5, 1.0, '9349', 0.20, 1.0, dict(z=(1.02, 1.10)), 'whip-up'),
    (2.5, 1.5, '9342', 0.20, 1.2, dict(z=(1.00, 1.16)), 'punch'),
    # --- DROP: TITLE ------------------------------------------------------
    (4.0, 2.0, '9309', 0.00, ('ramp', 1.7, 0.8), dict(z=(1.22, 1.04)), 'zoom'),
    # --- RETAIL / EXTERIOR -------------------------------------------------
    (6.0, 1.0, '9310', 0.30, 1.6, dict(z=(1.04, 1.10)), 'whip-left'),
    (7.0, 1.0, '9316', 0.20, 1.3, dict(z=(1.10, 1.02)), 'punch'),
    (8.0, 1.0, '9318', 0.30, 1.5, dict(z=(1.02, 1.08)), 'whip-left'),
    (9.0, 1.0, '9314', 0.20, 1.2, dict(z=(1.08, 1.0)), 'flash'),
    (10.0, 1.0, '9330', 0.20, 1.8, dict(z=(1.02, 1.08)), 'whip-up'),
    (11.0, 1.0, '9345', 0.20, 1.0, dict(z=(1.10, 1.02), r=(-1.5, 0.5)), 'glitch'),
    (12.0, 1.0, '9337', 0.10, 1.2, dict(z=(1.0, 1.08)), 'leak'),
    (13.0, 1.0, '9339', 0.30, 1.4, dict(z=(1.06, 1.12), r=(0, -3)), 'spin'),
    # --- PARKING ----------------------------------------------------------
    (14.0, 1.5, '9351', 0.30, 1.4, dict(z=(1.0, 1.10)), 'zoom'),
    (15.5, 1.0, '9352', 0.30, 1.5, dict(z=(1.04, 1.10)), 'whip-right'),
    (16.5, 1.5, '9353', 0.30, 1.2, dict(z=(1.10, 1.0)), 'punch'),
    # --- BREAKDOWN: ACCESS -------------------------------------------------
    (18.0, 1.0, '9319', 0.10, 1.2, dict(z=(1.0, 1.06)), 'glitch'),
    (19.0, 1.0, '9332', 0.00, ('ramp', 1.0, 2.6), dict(z=(1.0, 1.35)), 'punch'),
    # --- DROP: INTERIORS ----------------------------------------------------
    (20.0, 1.0, '9321', 2.90, 1.4, dict(z=(1.08, 1.02)), 'zoom'),
    (21.0, 1.0, '9358', 0.20, 1.3, dict(z=(1.0, 1.08)), 'whip-right'),
    (22.0, 1.5, '9368', 0.30, 1.3, dict(z=(1.0, 1.10)), 'punch'),
    (23.5, 1.0, '9361', 0.50, 1.3, dict(z=(1.08, 1.0)), 'leak'),
    # --- KITCHENS -----------------------------------------------------------
    (24.5, 1.0, '9364', 0.30, 1.3, dict(z=(1.02, 1.08)), 'whip-left'),
    (25.5, 1.5, '9370', 0.20, 1.0, dict(z=(1.0, 1.10)), 'punch'),
    # --- BATHROOMS ----------------------------------------------------------
    (27.0, 1.0, '9326', 0.10, 1.2, dict(z=(1.08, 1.0)), 'flash'),
    (28.0, 1.0, '9362', 0.80, 1.5, dict(z=(1.02, 1.08)), 'whip-right'),
    (29.0, 1.0, '9372', 0.20, 1.4, dict(z=(1.0, 1.08)), 'punch'),
    # --- VIEWS / ACCESS -----------------------------------------------------
    (30.0, 1.5, '9366', 0.30, 1.2, dict(z=(1.0, 1.10)), 'zoom'),
    (31.5, 1.0, '9333', 1.60, 1.6, dict(z=(1.04, 1.08)), 'whip-left'),
    (32.5, 1.5, '9355', 0.30, 1.0, dict(z=(1.0, 1.10)), 'punch'),
    # --- CTA ----------------------------------------------------------------
    (34.0, 2.0, '9325', 1.30, 1.0, dict(z=(1.12, 1.04)), 'spin'),
    (36.0, 2.0, '9341', 0.00, 0.72, dict(z=(1.0, 1.18)), 'whip-up'),
]
# End card (38 s -> end) uses a blurred plate of this clip
ENDCARD_START = 38.0
ENDCARD_PLATE = ('9309', 1.2)

# ---------------------------------------------------------------------------
# Captions: bilingual (Arabic line on top, English two-liner below,
# accent line in gold).  (start_s, end_s, arabic, en_line1, en_accent)
# ---------------------------------------------------------------------------
CAPTIONS = [
    (6.10, 8.90, 'وجهة تجارية متكاملة', 'A Complete', 'Commercial Hub'),
    (9.10, 11.90, 'محلات لكل الأنشطة', 'Shops For', 'Every Business'),
    (12.10, 13.90, 'ممرات مظللة', 'Shaded', 'Walkways'),
    (14.10, 17.90, 'مواقف سيارات سفلية', 'Covered', 'Basement Parking'),
    (18.10, 19.85, 'مصاعد وممرات واسعة', 'Elevators &', 'Wide Corridors'),
    (20.15, 24.35, 'وحدات واسعة ومشرقة', 'Spacious &', 'Bright Units'),
    (24.60, 26.90, 'مطابخ مجهزة', 'Fitted', 'Kitchens'),
    (27.10, 29.90, 'حمامات عصرية', 'Modern', 'Bathrooms'),
    (30.10, 33.90, 'إطلالات مفتوحة وسهولة الوصول', 'Open Views &', 'Easy Access'),
    (34.10, 37.85, 'احجز مساحتك اليوم', 'Book Your', 'Space Today'),
]

# Small chapter tag, top-left
CHAPTERS = [
    (6.10, 13.90, '01', 'RETAIL'),
    (14.10, 17.90, '02', 'PARKING'),
    (18.10, 19.85, '03', 'ACCESS'),
    (20.15, 24.35, '04', 'INTERIORS'),
    (24.60, 26.90, '05', 'KITCHENS'),
    (27.10, 29.90, '06', 'BATHROOMS'),
    (30.10, 33.90, '07', 'VIEWS'),
]

# Contact details exactly as printed on the project's own site signage
PROJECT_AR = 'سوق أم بشر'
PROJECT_EN_TOP = 'SOUQ'
PROJECT_EN_MAIN = 'UMM BESHER'
OPERATOR = 'Operated by Doha Property Management'
PHONES = ['5502 4778', '5059 1681', '5004 9704']
CALL_PILL = 'CALL  5502 4778'
WEB_LINE = 'sales@dpm.qa   •   www.dpm.qa'

# Colours
GOLD_TOP = (255, 228, 150)
GOLD_MID = (247, 192, 74)
GOLD_BOT = (226, 150, 30)
GOLD = (245, 182, 52)


def cut_times():
    """(time_s, transition) for every shot boundary after the first."""
    return [(s[0], s[6]) for s in SHOTS[1:]] + [(ENDCARD_START, 'zoom')]
