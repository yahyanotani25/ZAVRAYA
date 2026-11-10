"""Frame compositor for the Souq Umm Besher reel.

usage: python render.py RAW_DIR OUT_PREFIX FIRST_FRAME END_FRAME

Writes OUT_PREFIX_clean.mp4 and OUT_PREFIX_wm.mp4 (HMS Digital watermark)
for frames [FIRST_FRAME, END_FRAME).  build.py runs several of these in
parallel and concatenates the segments.
"""
import math
import os
import subprocess
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

import timeline as T

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, 'assets', 'fonts')
BRAND = os.path.join(ROOT, 'assets', 'brand')
W, H, FPS = T.W, T.H, T.FPS
SW, SH = 1242, 2208           # decode size (1.15x overscan for zooms)
S0 = W / SW

POP_R = os.path.join(FONTS, 'Poppins-Regular.ttf')
POP_M = os.path.join(FONTS, 'Poppins-Medium.ttf')
POP_SB = os.path.join(FONTS, 'Poppins-SemiBold.ttf')
POP_B = os.path.join(FONTS, 'Poppins-Bold.ttf')
POP_XB = os.path.join(FONTS, 'Poppins-ExtraBold.ttf')
POP_BL = os.path.join(FONTS, 'Poppins-Black.ttf')
POP_SBI = os.path.join(FONTS, 'Poppins-SemiBoldItalic.ttf')
TAJ_B = os.path.join(FONTS, 'Tajawal-Bold.ttf')
TAJ_XB = os.path.join(FONTS, 'Tajawal-ExtraBold.ttf')
SYM = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


# ------------------------------------------------------------------ easing --
def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def e_out3(u):
    return 1 - (1 - u) ** 3


def e_in3(u):
    return u ** 3


def e_io3(u):
    return 4 * u ** 3 if u < 0.5 else 1 - (-2 * u + 2) ** 3 / 2


def e_out_expo(u):
    return 1 if u >= 1 else 1 - 2 ** (-10 * u)


def e_out_back(u, s=1.9):
    u -= 1
    return u * u * ((s + 1) * u + s) + 1


def prog(f, t0, d):
    return clamp((f - t0) / float(d))


# ------------------------------------------------------------------ text ----
_fc = {}


def font(path, size):
    k = (path, size)
    if k not in _fc:
        _fc[k] = ImageFont.truetype(path, size, layout_engine=ImageFont.Layout.RAQM)
    return _fc[k]


def gold_fill(mask):
    rows = np.where(mask.max(1) > 0.05)[0]
    h = mask.shape[0]
    top, bot = (rows[0], rows[-1]) if len(rows) else (0, h - 1)
    t = np.clip((np.arange(h) - top) / max(bot - top, 1), 0, 1)[:, None]
    a, b, c = (np.array(x, np.float32) / 255 for x in (T.GOLD_TOP, T.GOLD_MID, T.GOLD_BOT))
    col = np.where(t[..., None] < 0.5, a + (b - a) * (t[..., None] / 0.5), b + (c - b) * ((t[..., None] - 0.5) / 0.5))
    return np.broadcast_to(col, (h, mask.shape[1], 3))


def render_text(text, fpath, size, color=(255, 255, 255), gold=False, tracking=0,
                rtl=False, shadow=1.0, opacity=1.0):
    fnt = font(fpath, size)
    asc, desc = fnt.getmetrics()
    kw = dict(direction='rtl', language='ar') if rtl else {}
    if tracking and not rtl:
        advs = [fnt.getlength(c) for c in text]
        adv = sum(advs) + tracking * (len(text) - 1)
    else:
        adv = fnt.getlength(text, **kw)
    P = int(size * 0.45) + 24
    cw, ch = int(adv + 2 * P), int(asc + desc + 2 * P)
    m = Image.new('L', (cw, ch), 0)
    d = ImageDraw.Draw(m)
    if tracking and not rtl:
        x = P
        for c, a in zip(text, advs):
            d.text((x, P + asc), c, font=fnt, fill=255, anchor='ls')
            x += a + tracking
    else:
        d.text((P, P + asc), text, font=fnt, fill=255, anchor='ls', **kw)
    mask = np.asarray(m, np.float32) / 255.0
    col = gold_fill(mask) if gold else np.broadcast_to(np.array(color, np.float32) / 255, mask.shape + (3,))
    sh1 = np.roll(cv2.GaussianBlur(mask, (0, 0), max(size * 0.09, 2)), int(size * 0.05) + 2, axis=0)
    sh2 = np.roll(cv2.GaussianBlur(mask, (0, 0), 1.6), 2, axis=0)
    sa = np.clip(sh1 * 0.55 + sh2 * 0.4, 0, 1) * shadow
    A = mask + sa * (1 - mask)
    img = np.dstack([col * mask[..., None], A]).astype(np.float32) * opacity
    return dict(img=np.ascontiguousarray(img), ox=P, oy=P + asc, adv=adv, asc=asc, size=size)


def rounded_rect_img(w, h, r, fill_gold=True, color=(255, 255, 255), shadow=True):
    P = 40
    m = Image.new('L', (w + 2 * P, h + 2 * P), 0)
    ImageDraw.Draw(m).rounded_rectangle([P, P, P + w, P + h], r, fill=255)
    mask = np.asarray(m, np.float32) / 255
    col = gold_fill(mask) if fill_gold else np.broadcast_to(np.array(color, np.float32) / 255, mask.shape + (3,))
    sa = np.roll(cv2.GaussianBlur(mask, (0, 0), 12), 8, axis=0) * 0.5 if shadow else 0
    A = mask + sa * (1 - mask)
    return np.dstack([col * mask[..., None], A]).astype(np.float32), P


class El:
    """A pre-rendered text/graphic sprite placed on the frame."""

    def __init__(self, img, x0, y0, ax, ay, anim):
        self.img, self.x0, self.y0, self.ax, self.ay, self.anim = img, x0, y0, ax, ay, anim

    @classmethod
    def text(cls, t, x, base_y, anim):
        return cls(t['img'], x - t['ox'], base_y - t['oy'], x + t['adv'] / 2, base_y - t['asc'] * 0.35, anim)


def composite(frame, img, x, y):
    h, w = img.shape[:2]
    x, y = int(round(x)), int(round(y))
    x0, y0, x1, y1 = max(x, 0), max(y, 0), min(x + w, W), min(y + h, H)
    if x1 <= x0 or y1 <= y0:
        return
    sub = img[y0 - y:y1 - y, x0 - x:x1 - x]
    a = sub[..., 3:4]
    frame[y0:y1, x0:x1] = frame[y0:y1, x0:x1] * (1 - a) + sub[..., :3]


def draw_el(frame, el, f):
    st = el.anim(f)
    if st is None:
        return
    alpha = st.get('alpha', 1.0)
    if alpha <= 0.004:
        return
    img = el.img
    dx, dy, sc = st.get('dx', 0.0), st.get('dy', 0.0), st.get('scale', 1.0)
    x, y = el.x0 + dx, el.y0 + dy
    if abs(sc - 1) > 0.004:
        h, w = img.shape[:2]
        nw, nh = max(2, int(round(w * sc))), max(2, int(round(h * sc)))
        img = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_LINEAR if sc > 1 else cv2.INTER_AREA)
        x = el.ax + dx - (el.ax - el.x0) * sc
        y = el.ay + dy - (el.ay - el.y0) * sc
    h, w = img.shape[:2]
    wipe = st.get('wipe')
    if wipe is not None and wipe[0] < 1:
        p, rtl = wipe
        xs = np.arange(w, dtype=np.float32)
        soft = 30.0
        if rtl:
            edge = w - p * (w + soft)
            m = np.clip((xs - edge) / soft, 0, 1)
        else:
            edge = p * (w + soft)
            m = np.clip((edge - xs) / soft, 0, 1)
        img = img * m[None, :, None]
    clip_y = st.get('clip_y')
    if clip_y is not None:
        ys = y + np.arange(h, dtype=np.float32)
        m = np.clip((clip_y - ys) / 6.0, 0, 1)
        img = img * m[:, None, None]
    bl = st.get('blur', 0)
    if bl > 0.4:
        img = cv2.GaussianBlur(img, (0, 0), bl)
    hb = int(st.get('hblur', 0))
    if hb > 2:
        img = cv2.blur(img, (hb, 1))
    sh = st.get('shine')
    if sh is not None:
        xs = np.arange(w, dtype=np.float32)[None, :]
        ys = np.arange(h, dtype=np.float32)[:, None]
        band = np.exp(-(((xs + ys * 0.35) - sh * (w + h * 0.35)) / 38.0) ** 2) * 0.85
        img = img.copy()
        img[..., :3] += band[..., None] * img[..., 3:4] * (1 - img[..., :3])
    if alpha < 0.999:
        img = img * alpha
    composite(frame, img, x, y)


# ----------------------------------------------------------- text layouts ---
def caption_group(start_s, end_s, ar, en1, en2, cy=1170):
    s_f, e_f = int(round(start_s * FPS)), int(round(end_s * FPS))
    els = []
    # Arabic line (RTL, word by word from the right)
    ar_size, en1_size = 58, 74
    ar_words = ar.split(' ')
    while True:
        ar_imgs = [render_text(wd, TAJ_XB, ar_size, rtl=True) for wd in ar_words]
        sp_ar = font(TAJ_XB, ar_size).getlength(' ')
        ar_w = sum(t['adv'] for t in ar_imgs) + sp_ar * (len(ar_imgs) - 1)
        if ar_w <= 760 or ar_size <= 44:
            break
        ar_size -= 2
    en1_words = en1.split(' ')
    en1_imgs = [render_text(wd, POP_SB, en1_size) for wd in en1_words]
    sp1 = font(POP_SB, en1_size).getlength(' ')
    en1_w = sum(t['adv'] for t in en1_imgs) + sp1 * (len(en1_imgs) - 1)
    size2 = 104
    while True:
        en2_imgs = [render_text(wd, POP_XB, size2, gold=True) for wd in en2.split(' ')]
        sp2 = font(POP_XB, size2).getlength(' ')
        en2_w = sum(t['adv'] for t in en2_imgs) + sp2 * (len(en2_imgs) - 1)
        if en2_w <= 860 or size2 <= 70:
            break
        size2 -= 4
    ar_base, en1_base, en2_base = cy - 128, cy - 22, cy + 92

    def word_anim(t0, size, k, base, exit_k):
        def a(f):
            if f < t0 or f >= e_f:
                return None
            u = prog(f, t0, 9)
            st = dict(alpha=clamp(u * 1.6), dy=(1 - e_out3(u)) * size * 0.95,
                      blur=(1 - u) * 3.0, clip_y=base + size * 0.32)
            v = prog(f, e_f - 9 + exit_k, 7)
            if v > 0:
                st['clip_y'] = None
                st['dy'] = -e_in3(v) * 46
                st['alpha'] *= 1 - v
                st['blur'] = v * 7
            return st
        return a

    def accent_anim(t0, k):
        def a(f):
            if f < t0 or f >= e_f:
                return None
            u = prog(f, t0, 10)
            st = dict(alpha=clamp(u * 2.2), scale=1.32 - 0.32 * e_out_back(u),
                      dy=(1 - e_out3(u)) * 18, blur=(1 - u) * 7)
            v = prog(f, e_f - 9 + k, 7)
            if v > 0:
                st['dy'] = -e_in3(v) * 46
                st['alpha'] *= 1 - v
                st['blur'] = v * 8
            return st
        return a

    x = 540 + ar_w / 2
    for k, t in enumerate(ar_imgs):
        x -= t['adv']
        els.append(El.text(t, x, ar_base, word_anim(s_f + k * 3, ar_size, k, ar_base, 0)))
        x -= sp_ar
    x = 540 - en1_w / 2
    for k, t in enumerate(en1_imgs):
        els.append(El.text(t, x, en1_base, word_anim(s_f + 4 + k * 3, en1_size, k, en1_base, 1)))
        x += t['adv'] + sp1
    x = 540 - en2_w / 2
    for k, t in enumerate(en2_imgs):
        els.append(El.text(t, x, en2_base, accent_anim(s_f + 10 + k * 4, 2 + k)))
        x += t['adv'] + sp2
    # gold underline that draws out from the centre once the accent lands
    bar_w = int(min(en2_w * 0.42, 300))
    bar, P = rounded_rect_img(bar_w, 8, 4)
    t_bar = s_f + 10 + 4 * len(en2_imgs) + 4

    def bar_anim(f):
        if f < t_bar or f >= e_f:
            return None
        u = e_out_expo(prog(f, t_bar, 10))
        v = prog(f, e_f - 8, 6)
        return dict(alpha=1 - v, wipe=None, scale=1.0, sx=u * (1 - v))
    bar_el = El(bar, 540 - bar_w / 2 - P, en2_base + 34 - P, 540, en2_base + 38, bar_anim)
    bar_el.kind = 'bar'
    els.append(bar_el)
    scrim = (s_f, e_f, cy - 20, 250, 0.40)
    return dict(els=els, scrim=scrim, range=(s_f, e_f))


def draw_bar(frame, el, f):
    st = el.anim(f)
    if st is None:
        return
    sx = st['sx']
    if sx <= 0.01:
        return
    h, w = el.img.shape[:2]
    nw = max(2, int(w * sx))
    img = cv2.resize(el.img, (nw, h), interpolation=cv2.INTER_AREA)
    composite(frame, img * st['alpha'], el.ax - nw / 2, el.y0)


def chapter_group(start_s, end_s, num, label):
    s_f, e_f = int(round(start_s * FPS)), int(round(end_s * FPS))
    n = render_text(num, POP_B, 42, gold=True, shadow=0.8)
    lb = render_text(label, POP_SB, 28, tracking=7, shadow=0.8)
    line, P = rounded_rect_img(56, 4, 2, shadow=False)
    x0, base = 72, 262

    def ex(f, k):
        v = prog(f, e_f - 7 + k, 6)
        return v

    def a_num(f):
        if f < s_f or f >= e_f:
            return None
        u = e_out3(prog(f, s_f, 8))
        v = ex(f, 0)
        return dict(alpha=u * (1 - v), dx=-(1 - u) * 30, dy=-v * 20)

    def a_line(f):
        if f < s_f + 3 or f >= e_f:
            return None
        u = e_out_expo(prog(f, s_f + 3, 9))
        v = ex(f, 1)
        return dict(alpha=1 - v, wipe=(u, False), dy=-v * 20)

    def a_lab(f):
        if f < s_f + 6 or f >= e_f:
            return None
        u = e_out3(prog(f, s_f + 6, 10))
        v = ex(f, 2)
        return dict(alpha=1 - v, wipe=(u, False), dy=-v * 20)
    nx = x0
    lx = nx + n['adv'] + 16
    tx = lx + 56 + 16
    return dict(els=[El.text(n, nx, base, a_num),
                     El(line, lx - P, base - 16 - P, lx + 28, base - 14, a_line),
                     El.text(lb, tx, base - 2, a_lab)], scrim=None, range=(s_f, e_f))


def hook_group():
    els = []
    pivot = (540, 900)
    exit0 = 108

    def wrap(inner):
        def a(f):
            if f >= 120:
                return None
            st = inner(f)
            if st is None:
                return None
            # shake on the SPACE slam
            if 45 <= f < 53:
                r = np.random.default_rng(f)
                k = (1 - (f - 45) / 8) ** 2
                st['dx'] = st.get('dx', 0) + r.uniform(-14, 14) * k
                st['dy'] = st.get('dy', 0) + r.uniform(-10, 10) * k
            v = prog(f, exit0, 12)
            if v > 0:
                s = 1 + 0.7 * e_in3(v)
                st['scale'] = st.get('scale', 1) * s
                st['alpha'] = st.get('alpha', 1) * (1 - v ** 1.5)
                st['blur'] = st.get('blur', 0) + v * 10
                st['clip_y'] = None
            return st
        return a

    def rise(t0, size, base):
        def a(f):
            if f < t0:
                return None
            u = prog(f, t0, 9)
            return dict(alpha=clamp(u * 1.6), dy=(1 - e_out3(u)) * size, blur=(1 - u) * 3,
                        clip_y=base + size * 0.32)
        return a

    def place_words(words, fp, size, base, t0s, gold=False):
        imgs = [render_text(wd, fp, size, gold=gold) for wd in words]
        sp = font(fp, size).getlength(' ')
        tw = sum(t['adv'] for t in imgs) + sp * (len(imgs) - 1)
        x = 540 - tw / 2
        for t, t0 in zip(imgs, t0s):
            el = El.text(t, x, base, None)
            el.anim = wrap(rise(t0, size, base))
            # adjust anchors for group zoom on exit
            els.append(el)
            x += t['adv'] + sp

    place_words(['Looking', 'For'], POP_SBI, 84, 700, [6, 10])
    place_words(['The', 'Perfect'], POP_SBI, 84, 802, [22, 26])
    sp = render_text('SPACE', POP_BL, 236, gold=True, tracking=10)
    def slam(f):
        if f < 45:
            return None
        u = prog(f, 45, 7)
        return dict(alpha=clamp(u * 3), scale=2.3 - 1.3 * e_out_expo(u), blur=(1 - u) * 14)
    els.append(El.text(sp, 540 - sp['adv'] / 2, 1032, wrap(slam)))
    place_words(['in', 'Qatar?'], POP_SBI, 72, 1136, [75, 79])
    ar = render_text('تبحث عن المساحة المثالية في قطر؟', TAJ_B, 50, rtl=True, opacity=0.95)
    def ar_a(f):
        if f < 82:
            return None
        u = e_out3(prog(f, 82, 14))
        return dict(alpha=clamp(u * 1.5), wipe=(u, True))
    els.append(El.text(ar, 540 - ar['adv'] / 2, 1226, wrap(ar_a)))
    # group zoom: re-anchor every element on the shared pivot so the exit zoom scales the block
    for el in els:
        el.ax, el.ay = pivot
    return dict(els=els, scrim=(0, 120, 920, 300, 0.36), range=(0, 120))


def letters(text, fp, size, base, t0, stagger, e_f, tracking=0, gold=False, exit_whip=False,
            shine_at=None, drop=-60):
    """Per-letter cascade (LTR)."""
    fnt = font(fp, size)
    advs = [fnt.getlength(c) for c in text]
    tw = sum(advs) + tracking * (len(text) - 1)
    x = 540 - tw / 2
    els = []
    left = 540 - tw / 2
    for k, (c, a) in enumerate(zip(text, advs)):
        if c != ' ':
            t = render_text(c, fp, size, gold=gold)
            tk = t0 + k * stagger
            ih, iw = t['img'].shape[:2]
            img_x0 = x - t['ox']

            def an(f, tk=tk, img_x0=img_x0, iw=iw, ih=ih):
                if f < tk or f >= e_f:
                    return None
                u = prog(f, tk, 9)
                st = dict(alpha=clamp(u * 2), dy=(1 - e_out_back(u)) * drop, blur=(1 - u) * 6)
                if shine_at is not None:
                    s = (f - shine_at) / 20.0
                    if 0 <= s <= 1:
                        # one diagonal light sweep across the whole word, mapped into this letter
                        xg = left - 200 + s * (tw + 400)
                        st['shine'] = (xg - img_x0 + ih * 0.175) / (iw + ih * 0.35)
                if exit_whip:
                    v = prog(f, e_f - 8, 8)
                    if v > 0:
                        st['dx'] = -e_in3(v) * 760
                        st['hblur'] = 1 + v * 120
                        st['alpha'] *= 1 - v * 0.6
                return st
            els.append(El.text(t, x, base, an))
        x += a + tracking
    return els, tw


def whip_exit(inner, e_f):
    def a(f):
        if f >= e_f:
            return None
        st = inner(f)
        if st is None:
            return None
        v = prog(f, e_f - 8, 8)
        if v > 0:
            st['dx'] = st.get('dx', 0) - e_in3(v) * 760
            st['hblur'] = 1 + v * 120
            st['alpha'] = st.get('alpha', 1) * (1 - v * 0.6)
        return st
    return a


def divider(cy, t0, e_f, half=240, exit_whip=False):
    line, P = rounded_rect_img(2 * half, 4, 2, shadow=False)
    dia = Image.new('L', (60, 60), 0)
    ImageDraw.Draw(dia).polygon([(30, 12), (48, 30), (30, 48), (12, 30)], fill=255)
    dm = np.asarray(dia, np.float32) / 255
    dimg = np.dstack([gold_fill(dm) * dm[..., None], dm]).astype(np.float32)

    def la(f):
        if f < t0:
            return None
        u = e_out_expo(prog(f, t0, 12))
        return dict(alpha=1.0, scale=1.0, sx=u)

    def da(f):
        if f < t0:
            return None
        u = prog(f, t0, 9)
        return dict(alpha=clamp(u * 2), scale=max(0.01, e_out_back(u)))
    l_el = El(line, 540 - half - P, cy - 2 - P, 540, cy, la)
    l_el.kind = 'bar'
    if exit_whip:
        l_el.anim = whip_bar(la, e_f)
        da = whip_exit(da, e_f)
    d_el = El(dimg, 540 - 30, cy - 30, 540, cy, da)
    return [l_el, d_el]


def whip_bar(inner, e_f):
    def a(f):
        if f >= e_f:
            return None
        st = inner(f)
        if st is None:
            return None
        v = prog(f, e_f - 8, 8)
        st['alpha'] = 1 - v
        return st
    return a


def title_group():
    s_f, e_f = 120, 180
    els = []
    ar = render_text(T.PROJECT_AR, TAJ_XB, 116, rtl=True)

    def ar_a(f):
        if f < 124:
            return None
        u = e_out3(prog(f, 124, 11))
        return dict(alpha=clamp(u * 1.4), wipe=(u, True), scale=1.08 - 0.08 * u)
    els.append(El.text(ar, 540 - ar['adv'] / 2, 768, whip_exit(ar_a, e_f)))
    l1, _ = letters(T.PROJECT_EN_TOP, POP_SB, 50, 852, 128, 2, e_f, tracking=34, gold=True,
                    exit_whip=True, drop=30)
    els += l1
    l2, tw = letters(T.PROJECT_EN_MAIN, POP_XB, 124, 985, 121, 1.5, e_f, tracking=2, exit_whip=True)
    els += l2
    els += divider(1032, 136, e_f, exit_whip=True)
    sub = render_text('COMMERCIAL SOUQ  •  QATAR', POP_M, 32, tracking=9, opacity=0.95)

    def sub_a(f):
        if f < 140:
            return None
        u = e_out3(prog(f, 140, 10))
        return dict(alpha=u, dy=(1 - u) * 24)
    els.append(El.text(sub, 540 - sub['adv'] / 2, 1096, whip_exit(sub_a, e_f)))
    return dict(els=els, scrim=(s_f, e_f, 930, 260, 0.50), range=(s_f, e_f))


def cta_extra():
    t0, e_f = 1056, 1136
    w, h = 560, 104
    pill, P = rounded_rect_img(w, h, h // 2)
    txt = render_text(T.CALL_PILL, POP_B, 44, color=(18, 28, 42), shadow=0)
    ph = render_text('☎', SYM, 46, color=(18, 28, 42), shadow=0)
    cy = 1392
    gap = 14
    total = ph['adv'] + gap + txt['adv']
    x = 540 - total / 2

    def pa(f):
        if f < t0 or f >= e_f:
            return None
        u = prog(f, t0, 11)
        v = prog(f, e_f - 8, 7)
        return dict(alpha=clamp(u * 2) * (1 - v), scale=max(0.05, 0.4 + 0.6 * e_out_back(u)) * (1 - 0.15 * v))
    pe = El(pill, 540 - w / 2 - P, cy - h / 2 - P, 540, cy, pa)
    te = El.text(txt, x + ph['adv'] + gap, cy + 15, pa)
    te.ax, te.ay = 540, cy
    pe2 = El.text(ph, x, cy + 16, pa)
    pe2.ax, pe2.ay = 540, cy
    # pulse rings
    ring = Image.new('L', (w + 80, h + 80), 0)
    ImageDraw.Draw(ring).rounded_rectangle([40, 40, 40 + w, 40 + h], h // 2, outline=255, width=4)
    rm = np.asarray(ring, np.float32) / 255
    rimg = np.dstack([gold_fill(rm) * rm[..., None], rm]).astype(np.float32)
    rings = []
    for k in range(3):
        rs = t0 + 14 + k * 22

        def ra(f, rs=rs):
            if f < rs or f >= e_f - 4:
                return None
            u = prog(f, rs, 20)
            if u >= 1:
                return None
            return dict(alpha=(1 - u) * 0.8, scale=1 + 0.22 * e_out3(u))
        rings.append(El(rimg, 540 - (w + 80) / 2, cy - (h + 80) / 2, 540, cy, ra))
    return dict(els=rings + [pe, pe2, te], scrim=None, range=(t0, e_f))


def parking_badge():
    t0, e_f = int(14.1 * FPS) + 2, int(17.9 * FPS)
    s = 112
    box, P = rounded_rect_img(s, s, 28)
    p = render_text('P', POP_XB, 84, color=(18, 28, 42), shadow=0)
    cy = 1170 - 128 - 140

    def a(f):
        if f < t0 or f >= e_f:
            return None
        u = prog(f, t0, 11)
        v = prog(f, e_f - 8, 7)
        return dict(alpha=clamp(u * 2) * (1 - v), scale=max(0.05, e_out_back(u, 2.4)), dy=-v * 40)
    b = El(box, 540 - s / 2 - P, cy - s / 2 - P, 540, cy, a)
    pt = El.text(p, 540 - p['adv'] / 2, cy + 30, a)
    pt.ax, pt.ay = 540, cy
    return dict(els=[b, pt], scrim=None, range=(t0, e_f))


def endcard_group():
    s_f = int(T.ENDCARD_START * FPS)
    e_f = T.NFRAMES + 10
    els = []
    ar = render_text(T.PROJECT_AR, TAJ_XB, 128, rtl=True, gold=True)

    def ar_a(f):
        if f < s_f + 6:
            return None
        u = e_out3(prog(f, s_f + 6, 12))
        return dict(alpha=clamp(u * 1.4), wipe=(u, True), scale=1.1 - 0.1 * u)
    els.append(El.text(ar, 540 - ar['adv'] / 2, 690, ar_a))
    l1, _ = letters(T.PROJECT_EN_TOP, POP_SB, 46, 772, s_f + 12, 2, e_f, tracking=34, drop=30)
    els += l1
    l2, _ = letters(T.PROJECT_EN_MAIN, POP_XB, 116, 900, s_f + 8, 1.5, e_f, tracking=2,
                    shine_at=s_f + 62)
    els += l2
    els += divider(950, s_f + 20, e_f)

    def fade_up(t0, d=10, rise=22):
        def a(f):
            if f < t0:
                return None
            u = e_out3(prog(f, t0, d))
            return dict(alpha=u, dy=(1 - u) * rise)
        return a
    sub = render_text('COMMERCIAL SOUQ', POP_M, 32, tracking=12, opacity=0.9)
    els.append(El.text(sub, 540 - sub['adv'] / 2, 1012, fade_up(s_f + 24)))
    op = render_text(T.OPERATOR, POP_R, 33, opacity=0.85)
    els.append(El.text(op, 540 - op['adv'] / 2, 1066, fade_up(s_f + 28)))
    ar2 = render_text('تواصل معنا', TAJ_B, 44, rtl=True)
    els.append(El.text(ar2, 540 - ar2['adv'] / 2, 1190, fade_up(s_f + 38)))
    git = render_text('GET IN TOUCH', POP_SB, 28, tracking=9, gold=True)
    els.append(El.text(git, 540 - git['adv'] / 2, 1240, fade_up(s_f + 41)))
    # phone row
    ph = render_text('☎', SYM, 40, gold=True)
    nums = [render_text(n, POP_SB, 40) for n in T.PHONES]
    sep = render_text('|', POP_R, 40, gold=True, opacity=0.8)
    gap = 18
    total = ph['adv'] + gap + sum(n['adv'] for n in nums) + 2 * (sep['adv'] + 2 * gap)
    x = 540 - total / 2
    base = 1318
    els.append(El.text(ph, x, base + 2, fade_up(s_f + 46)))
    x += ph['adv'] + gap
    for k, n in enumerate(nums):
        els.append(El.text(n, x, base, fade_up(s_f + 48 + k * 4)))
        x += n['adv']
        if k < 2:
            x += gap
            els.append(El.text(sep, x, base - 2, fade_up(s_f + 50 + k * 4)))
            x += sep['adv'] + gap
    web = render_text(T.WEB_LINE, POP_M, 32, opacity=0.85)
    els.append(El.text(web, 540 - web['adv'] / 2, 1386, fade_up(s_f + 62)))
    return dict(els=els, scrim=None, range=(s_f, e_f))


# ---------------------------------------------------------------- footage ---
_dur_cache = {}


def clip_path(raw, c):
    return os.path.join(raw, f'IMG_{c}.mov')


def clip_frames(raw, c):
    if c not in _dur_cache:
        d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                                           '-of', 'csv=p=0', clip_path(raw, c)]))
        _dur_cache[c] = int(d * FPS)
    return _dur_cache[c]


def decode(raw, c, t_in, n):
    cmd = ['ffmpeg', '-v', 'error', '-ss', f'{t_in:.3f}', '-i', clip_path(raw, c), '-frames:v', str(n),
           '-vf', f'fps={FPS},scale={SW}:{SH}:flags=lanczos', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-']
    out = subprocess.run(cmd, capture_output=True, check=True).stdout
    arr = np.frombuffer(bytearray(out), np.uint8)
    return arr.reshape(-1, SH, SW, 3)


def make_grade(sample):
    """Per-shot auto grade -> (3 LUTs, saturation)."""
    x = cv2.resize(sample, (135, 240), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    lum = x @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    m = (lum > 0.12) & (lum < 0.92)
    means = x[m].mean(0) if m.sum() > 50 else x.reshape(-1, 3).mean(0)
    gains = (means.mean() / means) ** 0.5
    gains = np.clip(gains, 0.88, 1.14)
    gains /= gains @ np.array([0.2126, 0.7152, 0.0722])
    y = np.clip(x * gains, 0, 1)
    ly = y @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    lo, hi, med = np.percentile(ly, 0.5), np.percentile(ly, 99.6), np.median(ly)
    black = min(lo, 0.07) * 0.85
    white = max(hi, 0.80)
    # brighten under-exposed shots (exponent < 1 lifts mids)
    gamma = clamp(math.log(0.50) / math.log(max(min(med, 0.9), 0.05)), 0.70, 1.0) if med < 0.50 else 1.0
    v = np.linspace(0, 1, 256, dtype=np.float32)
    luts = []
    for c in range(3):
        t = np.clip(v * gains[c], 0, 1.2)
        t = np.clip((t - black) / (white - black), 0, 1) * 0.75 + np.clip(t, 0, 1) * 0.25
        t = t ** gamma
        s = t * t * (3 - 2 * t)
        t = t + (s - t) * 0.28
        if c == 0:
            t = t + 0.025 * t ** 2 - 0.01 * (1 - t) ** 2
        elif c == 2:
            t = t - 0.03 * t ** 2 + 0.03 * (1 - t) ** 2
        luts.append(np.clip(t * 255, 0, 255).astype(np.uint8))
    return np.stack(luts, 1)[:, None, :], 1.14


class Shot:
    def __init__(self, spec, raw):
        (st, du, clip, src_in, speed, motion, trans) = spec
        self.start_f, self.dur_f = int(round(st * FPS)), int(round(du * FPS))
        self.end_f = self.start_f + self.dur_f
        self.clip, self.src_in, self.motion, self.trans, self.raw = clip, src_in, motion, trans, raw
        n = self.dur_f
        u = (np.arange(n) + 0.5) / n
        if isinstance(speed, tuple):
            _, a, b = speed
            v = a + (b - a) * np.array([e_io3(x) for x in u])
        else:
            v = np.full(n, float(speed))
        p = np.concatenate([[0], np.cumsum((v[:-1] + v[1:]) / 2)])
        avail = clip_frames(raw, clip) - int(src_in * FPS) - 3
        need = p[-1] + v[-1] / 2 + 2
        if need > avail:
            k = avail / need
            v, p = v * k, p * k
            print(f'  [{clip}] speed scaled by {k:.2f} to fit source', file=sys.stderr)
        self.v, self.p = v, p
        self.frames = None

    def load(self):
        if self.frames is None:
            n = int(math.ceil(self.p[-1] + self.v[-1] / 2)) + 3
            self.frames = decode(self.raw, self.clip, self.src_in, n)
            mid = self.frames[len(self.frames) // 2]
            self.lut, self.sat = make_grade(mid)
        return self

    def unload(self):
        self.frames = None

    def source(self, i):
        """Source image for output frame i with shutter-angle motion blur."""
        fr = self.frames
        n = len(fr)
        p, v = self.p[i], self.v[i]
        span = v * 0.55
        if span < 1.0:
            if v < 0.97:
                a = int(math.floor(p))
                t = p - a
                a0, a1 = min(a, n - 1), min(a + 1, n - 1)
                if t < 0.05 or a0 == a1:
                    return fr[a0]
                return cv2.addWeighted(fr[a0], 1 - t, fr[a1], t, 0)
            return fr[min(int(round(p)), n - 1)]
        ks = np.unique(np.clip(np.round(np.linspace(p - span / 2, p + span / 2, int(math.ceil(span)) + 1)).astype(int), 0, n - 1))
        acc = fr[ks[0]].astype(np.float32)
        for k in ks[1:]:
            acc += fr[k]
        return (acc / len(ks)).astype(np.uint8)

    def base_motion(self, i):
        u = (i + 0.5) / self.dur_f
        e = 0.5 * u + 0.5 * e_io3(u)
        m = self.motion
        z0, z1 = m.get('z', (1.0, 1.0))
        (x0, y0), (x1, y1) = m.get('c', ((0, 0), (0, 0)))
        r0, r1 = m.get('r', (0.0, 0.0))
        return z0 + (z1 - z0) * e, x0 + (x1 - x0) * e, y0 + (y1 - y0) * e, r0 + (r1 - r0) * e


def affine(z, cx, cy, rot):
    M = cv2.getRotationMatrix2D((SW / 2, SH / 2), rot, S0 * z)
    M[0, 2] += W / 2 - SW / 2 + cx * W
    M[1, 2] += H / 2 - SH / 2 + cy * H
    return M


def warp(img, M, fast=False):
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR if fast else cv2.INTER_CUBIC,
                          borderMode=cv2.BORDER_REFLECT_101)


# ------------------------------------------------------------- transitions --
H_OUT = {'zoom': 5, 'punch': 0, 'whip-left': 4, 'whip-right': 4, 'whip-up': 4, 'whip-down': 4,
         'spin': 6, 'flash': 2, 'glitch': 0, 'leak': 0, 'open': 0}
H_IN = {'zoom': 6, 'punch': 6, 'whip-left': 5, 'whip-right': 5, 'whip-up': 5, 'whip-down': 5,
        'spin': 7, 'flash': 6, 'glitch': 3, 'leak': 7, 'open': 14}
WHIP_DIR = {'whip-left': (-1, 0), 'whip-right': (1, 0), 'whip-up': (0, -1), 'whip-down': (0, 1)}


def trans_mods(tr, q, side):
    """q in (0,1]: 1 = at the cut. side: 'out' (end of A) or 'in' (start of B)."""
    m = dict(zoom=1.0, dx=0.0, dy=0.0, rot=0.0, radial=0.0, dblur=None, spin=0.0, black=0.0)
    if tr == 'zoom':
        if side == 'out':
            m['zoom'] = 1 + 0.6 * q ** 2.2
            m['radial'] = q ** 1.4
        else:
            m['zoom'] = 1 - 0.26 * q ** 2
            m['radial'] = q ** 1.4
    elif tr in ('punch', 'flash', 'leak', 'glitch'):
        if side == 'in':
            amp = {'punch': 0.12, 'flash': 0.09, 'leak': 0.07, 'glitch': 0.06}[tr]
            m['zoom'] = 1 + amp * q ** 2
            if tr == 'punch' and q > 0.8:
                m['radial'] = 0.35 * q
    elif tr in WHIP_DIR:
        d = WHIP_DIR[tr]
        amp = q ** 2.4 * 0.42
        sign = 1 if side == 'out' else -1
        m['dx'], m['dy'] = sign * d[0] * amp, sign * d[1] * amp
        k = int(1 + 340 * q ** 1.8)
        m['dblur'] = ('h' if d[0] else 'v', k)
    elif tr == 'spin':
        sign = 1 if side == 'out' else -1
        m['rot'] = sign * 38 * q ** 2.2
        m['zoom'] = 1 + 0.28 * q ** 2
        m['spin'] = 16 * q ** 1.5
    elif tr == 'open':
        m['zoom'] = 1 + 0.35 * q ** 2
        m['radial'] = q ** 1.5
        m['black'] = q ** 1.2
    return m


def merge_mods(a, b):
    out = dict(a)
    out['zoom'] = a['zoom'] * b['zoom']
    for k in ('dx', 'dy', 'rot', 'radial', 'spin', 'black'):
        out[k] = a[k] + b[k]
    out['dblur'] = a['dblur'] or b['dblur']
    return out


def shake_at(f):
    for t in T.IMPACTS:
        d = f - int(round(t * FPS))
        if 0 <= d < 10:
            r = np.random.default_rng(1000 + f)
            k = (1 - d / 10) ** 2
            return r.uniform(-1, 1) * 0.012 * k, r.uniform(-1, 1) * 0.008 * k, r.uniform(-1, 1) * 0.5 * k
    return 0.0, 0.0, 0.0


def render_shot(shot, i, mods, f):
    src = shot.source(i)
    z, cx, cy, r = shot.base_motion(i)
    sx, sy, sr = shake_at(f)
    z *= mods['zoom']
    cx += mods['dx'] + sx
    cy += mods['dy'] + sy
    r += mods['rot'] + sr
    if mods['radial'] > 0.02:
        n = 7
        acc = None
        for k in range(n):
            zk = z * (1 + 0.22 * mods['radial'] * k / (n - 1))
            wk = warp(src, affine(zk, cx, cy, r), fast=True).astype(np.float32)
            acc = wk if acc is None else acc + wk
        img = acc / n
    elif mods['spin'] > 0.3:
        n = 7
        acc = None
        for k in range(n):
            rk = r + mods['spin'] * (k / (n - 1) - 0.5)
            wk = warp(src, affine(z, cx, cy, rk), fast=True).astype(np.float32)
            acc = wk if acc is None else acc + wk
        img = acc / n
    else:
        img = warp(src, affine(z, cx, cy, r)).astype(np.float32)
    if mods['dblur']:
        ax, k = mods['dblur']
        if k > 2:
            img = cv2.blur(img, (k, 1) if ax == 'h' else (1, k))
    img = cv2.LUT(np.clip(img, 0, 255).astype(np.uint8), shot.lut).astype(np.float32) / 255.0
    lum = img @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    img = lum[..., None] + (img - lum[..., None]) * shot.sat
    bl = cv2.GaussianBlur(img, (0, 0), 1.1)
    img = img + 0.5 * (img - bl)
    if mods['black'] > 0:
        img *= 1 - mods['black']
    return img


# ----------------------------------------------------------- post effects ---
def make_vignette():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 * 0.9 + ((yy - H / 2) / (H / 2)) ** 2)
    return (1 - 0.24 * np.clip(r / 1.25, 0, 1) ** 2.4)[..., None].astype(np.float32)


def make_grain(n=6):
    r = np.random.default_rng(5)
    g = []
    for _ in range(n):
        x = r.standard_normal((H // 2, W // 2)).astype(np.float32)
        g.append(cv2.resize(x, (W, H), interpolation=cv2.INTER_LINEAR)[..., None] * 0.016)
    return g


def leak_layer(d, seed):
    r = np.random.default_rng(seed)
    h, w = 240, 135
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    lay = np.zeros((h, w, 3), np.float32)
    cols = [(1.0, 0.62, 0.25), (1.0, 0.36, 0.18), (1.0, 0.86, 0.55)]
    for k in range(3):
        cx = r.uniform(-10, w + 10) + d * r.uniform(-3, 3)
        cy = r.uniform(20, h - 20) + d * r.uniform(-2, 4)
        rad = r.uniform(45, 85)
        g = np.exp(-(((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * rad ** 2)))
        lay += g[..., None] * np.array(cols[k], np.float32)
    return cv2.resize(lay, (W, H), interpolation=cv2.INTER_CUBIC)


def glitch(img, f, k):
    r = np.random.default_rng(2000 + f)
    out = img.copy()
    s = int(30 * k)
    out[..., 0] = np.roll(img[..., 0], s, axis=1)
    out[..., 2] = np.roll(img[..., 2], -s, axis=1)
    for _ in range(8):
        y0 = r.integers(0, H - 140)
        hh = r.integers(16, 140)
        out[y0:y0 + hh] = np.roll(out[y0:y0 + hh], int(r.uniform(-150, 150) * k), axis=1)
    return out * (1 + 0.12 * k * r.uniform(-1, 1))


def apply_scrim(frame, scrim, f):
    s_f, e_f, cy, sigma, amax = scrim
    if f < s_f - 4 or f >= e_f:
        return
    a = amax * clamp((f - s_f + 4) / 8.0) * (1 - clamp((f - (e_f - 8)) / 8.0))
    if a <= 0.003:
        return
    y0, y1 = int(max(cy - 3 * sigma, 0)), int(min(cy + 3 * sigma, H))
    ys = np.arange(y0, y1, dtype=np.float32)
    prof = np.exp(-0.5 * ((ys - cy) / sigma) ** 2) * a
    frame[y0:y1] *= (1 - prof)[:, None, None]


# --------------------------------------------------------------- end card ---
class EndCard:
    def __init__(self, raw):
        c, t = T.ENDCARD_PLATE
        fr = decode(raw, c, t, 1)[0]
        lut, sat = make_grade(fr)
        img = cv2.LUT(fr, lut)
        small = cv2.resize(img, (SW // 4, SH // 4), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
        small = cv2.GaussianBlur(small, (0, 0), 7)
        self.plate = cv2.resize(small, (SW, SH), interpolation=cv2.INTER_CUBIC)
        tint = np.array([14, 22, 34], np.float32) / 255
        self.plate = self.plate * 0.42 + tint * 0.45
        r = np.random.default_rng(77)
        n = 46
        self.px = r.uniform(0, W, n)
        self.py = r.uniform(0, H, n)
        self.pv = r.uniform(0.6, 2.2, n)
        self.ps = r.uniform(1.2, 3.6, n)
        self.ph = r.uniform(0, 2 * np.pi, n)
        self.start = int(T.ENDCARD_START * FPS)

    def render(self, f):
        i = f - self.start
        u = clamp(i / 150.0)
        z = 1.08 - 0.08 * e_out3(u)
        zin = 1 - 0.22 * (1 - clamp(i / 6.0)) ** 2 if i < 6 else 1.0
        rad = (1 - clamp(i / 6.0)) ** 1.4 if i < 6 else 0
        sx, sy, sr = shake_at(f)
        if rad > 0.02:
            acc = 0
            for k in range(6):
                acc = acc + warp(self.plate, affine(z * zin * (1 + 0.2 * rad * k / 5), sx, sy, sr), fast=True)
            img = acc / 6
        else:
            img = warp(self.plate, affine(z * zin, sx, sy, sr), fast=True)
        # gold dust particles
        lay = np.zeros((H // 4, W // 4), np.float32)
        for k in range(len(self.px)):
            y = (self.py[k] - self.pv[k] * i) % H
            x = self.px[k] + 14 * math.sin(i * 0.03 + self.ph[k])
            tw = 0.55 + 0.45 * math.sin(i * 0.12 + self.ph[k])
            cv2.circle(lay, (int(x / 4), int(y / 4)), max(1, int(self.ps[k] / 2)), tw, -1, cv2.LINE_AA)
        lay = cv2.GaussianBlur(lay, (0, 0), 1.2)
        lay = cv2.resize(lay, (W, H), interpolation=cv2.INTER_LINEAR)
        gold = np.array(T.GOLD, np.float32) / 255
        img = img + lay[..., None] * gold * 0.5 * clamp(i / 12.0)
        return img


# -------------------------------------------------------------- watermark ---
def make_watermark():
    ov = np.zeros((H, W, 4), np.float32)
    # diagonal tiled text
    txt = 'HMS DIGITAL  •  PREVIEW'
    fnt = font(POP_SB, 38)
    tile = Image.new('L', (int(fnt.getlength(txt)) + 40, 70), 0)
    ImageDraw.Draw(tile).text((20, 52), txt, font=fnt, fill=255, anchor='ls')
    big = Image.new('L', (W * 2, H * 2), 0)
    tw, th = tile.size
    for row, y in enumerate(range(0, H * 2, 250)):
        off = (row % 2) * (tw // 2 + 60)
        for x in range(-tw, W * 2, tw + 120):
            big.paste(tile, (x + off, y))
    big = big.rotate(28, resample=Image.BICUBIC)
    big = big.crop((W // 2, H // 2, W // 2 + W, H // 2 + H))
    tm = np.asarray(big, np.float32) / 255
    sh = np.roll(cv2.GaussianBlur(tm, (0, 0), 2), 2, axis=0)
    a_text = tm * 0.17
    a_sh = sh * 0.10
    A = a_text + a_sh * (1 - a_text)
    ov[..., :3] = a_text[..., None] * 1.0
    ov[..., 3] = A
    # centre logo
    logo = cv2.imread(os.path.join(BRAND, 'hms_logo_white.png'), cv2.IMREAD_UNCHANGED)
    logo = cv2.cvtColor(logo, cv2.COLOR_BGRA2RGBA).astype(np.float32) / 255
    lw = 440
    lh = int(logo.shape[0] * lw / logo.shape[1])
    logo = cv2.resize(logo, (lw, lh), interpolation=cv2.INTER_AREA)
    la = logo[..., 3] * 0.40
    shadow = cv2.GaussianBlur(logo[..., 3], (0, 0), 6) * 0.18
    x0, y0 = (W - lw) // 2, (H - lh) // 2 - 40
    sub = ov[y0:y0 + lh, x0:x0 + lw]
    # shadow under logo, then logo over everything
    A0 = sub[..., 3]
    sub[..., :3] *= (1 - shadow)[..., None]
    A1 = shadow + A0 * (1 - shadow)
    sub[..., :3] = sub[..., :3] * (1 - la)[..., None] + logo[..., :3] * la[..., None]
    sub[..., 3] = la + A1 * (1 - la)
    ov[y0:y0 + lh, x0:x0 + lw] = sub
    return ov


# ------------------------------------------------------------------ main ----
def build_layers():
    groups = [hook_group(), title_group()]
    for c in T.CAPTIONS:
        groups.append(caption_group(*c))
    for c in T.CHAPTERS:
        groups.append(chapter_group(*c))
    groups += [parking_badge(), cta_extra(), endcard_group()]
    return groups


def encoder(path):
    cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
           '-r', str(FPS), '-i', '-',
           '-vf', 'scale=out_color_matrix=bt709:out_range=tv:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p',
           '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-g', '60',
           '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
           path]
    return subprocess.Popen(cmd, stdin=subprocess.PIPE)


def main():
    raw, prefix, f0, f1 = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
    stills = os.environ.get('STILLS')  # comma list of frames -> write PNGs only (QA)
    shots = [Shot(s, raw) for s in T.SHOTS]
    groups = build_layers()
    vign, grain = make_vignette(), make_grain()
    wm = make_watermark()
    endcard = EndCard(raw)
    cuts = [(int(round(t * FPS)), tr) for (t, tr) in T.cut_times()]
    frames = [int(x) for x in stills.split(',')] if stills else range(f0, f1)
    enc_c = enc_w = None
    if not stills:
        enc_c, enc_w = encoder(prefix + '_clean.mp4'), encoder(prefix + '_wm.mp4')
    cur = None
    for f in frames:
        if f >= endcard.start:
            img = endcard.render(f)
        else:
            k = max(j for j, s in enumerate(shots) if s.start_f <= f)
            s = shots[k]
            if cur is not s:
                if cur is not None:
                    cur.unload()
                cur = s.load()
            i = f - s.start_f
            mods = trans_mods('none', 0, 'in')
            hi = H_IN.get(s.trans, 0)
            if i < hi:
                mods = merge_mods(mods, trans_mods(s.trans, 1 - i / hi, 'in'))
            nxt = shots[k + 1].trans if k + 1 < len(shots) else 'zoom'
            ho = H_OUT.get(nxt, 0)
            j = s.dur_f - 1 - i
            if j < ho:
                mods = merge_mods(mods, trans_mods(nxt, (ho - j) / ho, 'out'))
            img = render_shot(s, i, mods, f)
        # cut-anchored overlays
        for (cf, tr) in cuts:
            d = f - cf
            if tr == 'flash':
                if d in (-2, -1):
                    img = img * (1.25 if d == -2 else 1.6)
                if 0 <= d < 6:
                    a = 0.9 * (1 - d / 6) ** 1.5
                    img = img * (1 - a) + a
            elif tr == 'leak' and -8 <= d < 13:
                e = math.exp(-((d - 1) / 5.0) ** 2)
                lay = leak_layer(d, cf)
                img = 1 - (1 - np.clip(img, 0, 1)) * (1 - np.clip(lay * e * 0.95, 0, 1))
            elif tr == 'glitch' and -2 <= d <= 2:
                img = glitch(img, f, 1 - abs(d) / 3)
            if cf / FPS in T.IMPACTS and 0 <= d < 4:
                a = 0.45 * (1 - d / 4)
                img = img * (1 - a) + a
        img = img * vign + grain[(f * 7) % len(grain)]
        img = np.clip(img, 0, 1).astype(np.float32)
        for g in groups:
            if g['scrim']:
                apply_scrim(img, g['scrim'], f)
        for g in groups:
            r0, r1 = g['range']
            if f < r0 - 1 or f > r1 + 1:
                continue
            for el in g['els']:
                if getattr(el, 'kind', None) == 'bar':
                    draw_bar(img, el, f)
                else:
                    draw_el(img, el, f)
        # final fade to black
        if f >= T.NFRAMES - 14:
            img *= 1 - (f - (T.NFRAMES - 14)) / 14.0
        clean = (np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)
        wmimg = img * (1 - wm[..., 3:4]) + wm[..., :3]
        wmu8 = (np.clip(wmimg, 0, 1) * 255 + 0.5).astype(np.uint8)
        if stills:
            Image.fromarray(clean).save(f'{prefix}_{f:04d}.jpg', quality=88)
            Image.fromarray(wmu8).save(f'{prefix}_{f:04d}_wm.jpg', quality=88)
        else:
            enc_c.stdin.write(clean.tobytes())
            enc_w.stdin.write(wmu8.tobytes())
        if f % 30 == 0:
            print(f'frame {f}', file=sys.stderr, flush=True)
    if enc_c:
        for e in (enc_c, enc_w):
            e.stdin.close()
            e.wait()


if __name__ == '__main__':
    main()
