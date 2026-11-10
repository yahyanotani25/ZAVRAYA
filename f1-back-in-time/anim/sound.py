"""Sound design: voice-over + effects (CC0 recordings from assets/sfx plus a few synthesised foley sounds).
usage: python -m anim.sound <voiceover file> <out.wav>"""
import os, sys, math, subprocess, tempfile
import numpy as np
import soundfile as sf
from scipy import signal
from .core import ASSETS
from . import scenes_a as A, scenes_b as B
from .render import DURATION

SR = 48000
rng = np.random.default_rng(11)

# ----------------------------------------------------------------------------- helpers
_cache = {}
def load(name):
    """Mono float32 at 48 kHz from assets/sfx."""
    if name not in _cache:
        x, sr = sf.read(os.path.join(ASSETS, "sfx", name), dtype="float32")
        if x.ndim > 1: x = x.mean(1)
        if sr != SR: x = signal.resample_poly(x, SR, sr).astype(np.float32)
        pk = np.abs(x).max()
        _cache[name] = x / pk if pk > 0 else x
    return _cache[name]

def pitch(x, rate):
    """Play faster/slower (changes pitch and length together, like tape)."""
    if abs(rate - 1) < 1e-3: return x
    n = max(8, int(len(x) / rate))
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)

def fade(x, a=0.004, r=0.02):
    x = x.copy(); na, nr = int(a * SR), int(r * SR)
    if na > 1: x[:na] *= np.linspace(0, 1, na)
    if nr > 1: x[-nr:] *= np.linspace(1, 0, nr)
    return x

def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos"); return signal.sosfilt(sos, x).astype(np.float32)
def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="low", fs=SR, output="sos"), x).astype(np.float32)
def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="high", fs=SR, output="sos"), x).astype(np.float32)

class Mix:
    def __init__(self, dur):
        self.n = int(dur * SR) + SR
        self.buf = np.zeros((self.n, 2), np.float32)
    def add(self, x, t, gain=1.0, pan=0.0, rate=1.0):
        """pan -1 (left) .. +1 (right); gain is linear peak (sounds are peak-normalised)."""
        if rate != 1.0: x = pitch(x, rate)
        i = int(round(t * SR))
        if i < 0: x = x[-i:]; i = 0
        m = min(len(x), self.n - i)
        if m <= 0: return
        a = (pan + 1) * math.pi / 4
        self.buf[i:i + m, 0] += x[:m] * gain * math.cos(a) * 1.414
        self.buf[i:i + m, 1] += x[:m] * gain * math.sin(a) * 1.414
    def add_st(self, st, t, gain=1.0):
        i = int(round(t * SR)); m = min(len(st), self.n - i)
        if m > 0: self.buf[i:i + m] += st[:m] * gain

def xpan(x):
    """Map a screen x (0..1920) to a gentle stereo position."""
    return float(np.clip((x - 960) / 960, -1, 1)) * 0.55

# ----------------------------------------------------------------------------- synthesised foley
def whoosh(dur=0.35, f0=500, f1=2600, q=0.9, peak=0.5):
    n = int(dur * SR); t = np.linspace(0, 1, n)
    noise = rng.normal(0, 1, n).astype(np.float32)
    fc = f0 * (f1 / f0) ** t
    out = np.zeros(n, np.float32); blk = 256
    zi = None
    for i in range(0, n, blk):                                   # swept band-pass in short blocks
        f = float(fc[min(n - 1, i + blk // 2)])
        sos = signal.butter(1, [f / (1 + q), min(SR / 2 - 100, f * (1 + q))], btype="band", fs=SR, output="sos")
        if zi is None: zi = signal.sosfilt_zi(sos) * 0
        out[i:i + blk], zi = signal.sosfilt(sos, noise[i:i + blk], zi=zi)
    env = np.sin(np.pi * np.clip(t / (2 * peak), 0, 0.5)) ** 2 * (t <= peak) + (np.cos(np.pi * np.clip((t - peak) / (2 * (1 - peak)), 0, 0.5)) ** 2) * (t > peak)
    out *= env
    return (out / (np.abs(out).max() + 1e-9)).astype(np.float32)

def thud(f0=130, f1=42, dur=0.4, click=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 22)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)
    nz = lp(rng.normal(0, 1, n).astype(np.float32), 1800) * np.exp(-t * 60) * click
    out = body + nz
    return fade((out / np.abs(out).max()).astype(np.float32), 0.001, 0.05)

def tick(f=2400, dur=0.03):
    n = int(dur * SR); t = np.arange(n) / SR
    out = np.sin(2 * np.pi * f * t) * np.exp(-t * 160) + 0.3 * rng.normal(0, 1, n) * np.exp(-t * 400)
    return (out / np.abs(out).max()).astype(np.float32)

def whistle(f0, f1, dur=0.3, vib=0.0, curve=1.0):
    """Slide whistle."""
    n = int(dur * SR); t = np.linspace(0, 1, n)
    f = f0 * (f1 / f0) ** (t ** curve) * (1 + vib * np.sin(2 * np.pi * 7 * t * dur))
    ph = 2 * np.pi * np.cumsum(f) / SR
    out = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    breath = bp(rng.normal(0, 1, n).astype(np.float32), 1500, 6000) * 0.05
    env = np.minimum(1, t * 14) * np.minimum(1, (1 - t) * 9)
    out = (out + breath) * env
    return (out / np.abs(out).max()).astype(np.float32)

def shutter():
    def clack(f, d):
        n = int(d * SR); t = np.arange(n) / SR
        return bp(rng.normal(0, 1, n).astype(np.float32), f * 0.6, f * 1.7) * np.exp(-t * 90) + 0.6 * np.sin(2 * np.pi * f * 0.35 * t) * np.exp(-t * 120)
    out = np.zeros(int(0.22 * SR), np.float32)
    a, b = clack(3200, 0.06), clack(2100, 0.09)
    out[:len(a)] += a; i = int(0.075 * SR); out[i:i + len(b)] += b * 0.9
    return (out / np.abs(out).max()).astype(np.float32)

def gulp():
    def sw(f0, f1, d):
        n = int(d * SR); t = np.linspace(0, 1, n)
        f = f0 + (f1 - f0) * t
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t) ** 1.5
    out = np.concatenate([sw(210, 330, 0.07), np.zeros(int(0.035 * SR)), sw(300, 150, 0.11)]).astype(np.float32)
    out = lp(out, 900)
    return (out / np.abs(out).max()).astype(np.float32)

def sparkle(base=2093.0, n_notes=5, step=0.045):
    out = np.zeros(int((n_notes * step + 0.5) * SR), np.float32)
    for i, k in enumerate((0, 4, 7, 12, 16)[:n_notes]):
        f = base * 2 ** (k / 12); n = int(0.45 * SR); t = np.arange(n) / SR
        tone = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t * 11)
        j = int(i * step * SR); out[j:j + n] += tone.astype(np.float32) * (0.9 ** i)
    return (out / np.abs(out).max()).astype(np.float32)

def projector(dur):
    """Old film projector: shutter flutter + motor."""
    n = int(dur * SR); t = np.arange(n) / SR
    out = np.zeros(n, np.float32)
    period = SR / 18.0
    c = tick(1500, 0.012) * 0.8
    k = 0.0
    while k < n - len(c):
        out[int(k):int(k) + len(c)] += c * (0.7 + 0.3 * rng.random()); k += period * (1 + 0.02 * rng.normal())
    motor = lp(rng.normal(0, 1, n).astype(np.float32), 240) * 2.2 + 0.25 * np.sin(2 * np.pi * 96 * t)
    hiss = hp(rng.normal(0, 1, n).astype(np.float32), 5000) * 0.05
    out = bp(out, 500, 5000) * 1.4 + motor * 0.35 + hiss
    return (out / np.abs(out).max()).astype(np.float32)

def loop_play(name, rate_curve, xfade=0.03):
    """Play a short engine loop endlessly with a time-varying speed; rate_curve is per output sample."""
    x = load(name).astype(np.float64)
    nx = int(xfade * SR)
    body = x[:-nx].copy()
    w = np.linspace(0, 1, nx)
    body[:nx] = body[:nx] * w + x[-nx:] * (1 - w)                # seamless loop
    N = len(body)
    ph = np.cumsum(rate_curve) % N
    i0 = np.floor(ph).astype(np.int64); fr = ph - i0
    return (body[i0] * (1 - fr) + body[(i0 + 1) % N] * fr).astype(np.float32)

def engine(dur, rate, amp, loop="loop_3_0.wav", grit=0.25, lowpass=5200):
    """Engine bed: rate(t) and amp(t) are functions of seconds."""
    n = int(dur * SR); t = np.arange(n) / SR
    r = np.vectorize(rate)(t[::480]); r = np.interp(np.arange(n), np.arange(len(r)) * 480, r)
    a = np.vectorize(amp)(t[::480]); a = np.interp(np.arange(n), np.arange(len(a)) * 480, a)
    e = loop_play(loop, r)
    e2 = loop_play(loop, r * 2.0) * 0.35                           # upper harmonic layer
    out = e + e2
    out = np.tanh(out * (1 + grit * 3)) / (1 + grit)
    out = lp(out.astype(np.float32), lowpass)
    out *= a * (1 + 0.07 * np.sin(2 * np.pi * 13 * t))
    return out.astype(np.float32)

def passby(dur=1.1, peak_t=0.45, loop="loop_3_0.wav"):
    """Doppler pass: pitch falls through the pass, level peaks, pans right-to-left."""
    n = int(dur * SR); t = np.arange(n) / SR
    rate = lambda s: 2.0 - 0.75 / (1 + math.exp(-(s - peak_t) * 16))
    amp = lambda s: math.exp(-((s - peak_t) / 0.2) ** 2) + 0.12 * math.exp(-((s - peak_t) / 0.55) ** 2)
    e = engine(dur, rate, amp, loop, grit=0.5, lowpass=7000)
    wind = whoosh(dur, 400, 3200, 1.2, peak=peak_t / dur) * 0.45
    m = e / (np.abs(e).max() + 1e-9) + wind[:n]
    pan = np.clip(0.9 - 1.8 / (1 + np.exp(-(t - peak_t) * 12)), -0.9, 0.9)
    a = (pan + 1) * np.pi / 4
    return np.stack([m * np.cos(a), m * np.sin(a)], 1).astype(np.float32) * 1.2

# ----------------------------------------------------------------------------- voice
def read_any(path):
    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", path, "-ac", "1", "-ar", str(SR), tmp], check=True)
    x, _ = sf.read(tmp, dtype="float32"); os.unlink(tmp)
    return x

def voice(path, end=54.86):
    x = read_any(path)[: int(end * SR)]
    x = hp(x, 70, 2)
    nf = int(0.22 * SR); x[-nf:] *= np.cos(np.linspace(0, np.pi / 2, nf)) ** 2      # out before the next sentence
    win = int(0.4 * SR)
    rms = np.sqrt(np.maximum(signal.convolve(x ** 2, np.ones(win) / win, mode="same"), 0))
    ref = np.percentile(rms[rms > 0.01], 70)
    x = x * (10 ** (-17.5 / 20) / ref)                                               # speech sits around -17.5 dBFS RMS
    return np.clip(x, -0.98, 0.98).astype(np.float32)

def duck_env(v, depth=0.5):
    """Gain curve (1 = full) that dips while the narrator is speaking."""
    win = int(0.05 * SR)
    e = np.sqrt(np.maximum(signal.convolve(v ** 2, np.ones(win) / win, mode="same"), 0))
    g = 1 - depth * np.clip(e / 0.06, 0, 1)
    return lp(g.astype(np.float32), 6, 1)

# ----------------------------------------------------------------------------- the mix
def build(vo_path, out_path):
    mx = Mix(DURATION)          # one-shots
    bed = Mix(DURATION)         # continuous layers that duck under the voice
    P = lambda name: load(name)
    plop = lambda i: P("plop_02.ogg") if i % 2 else P("plop_01.ogg")
    # --- S1
    mx.add(whoosh(0.34, 300, 1500), 0.0, 0.16, -0.3)
    mx.add(plop(1), 0.30, 0.20, -0.3, 0.8)
    n = int(1.0 * SR)
    car_in = engine(1.0, lambda s: 2.3 - 1.5 * min(1, s / 0.8) ** 0.7, lambda s: min(1, s / 0.08) * (1 - 0.75 * min(1, s / 0.82)) * (0 if s > 0.96 else 1), "loop_5_0.wav", grit=0.6, lowpass=8000)
    mx.add(car_in, 1.97, 0.34, -0.2)
    scr = bp(rng.normal(0, 1, int(0.5 * SR)).astype(np.float32), 2600, 5200) * np.linspace(1, 0, int(0.5 * SR)) ** 1.5
    mx.add(scr / np.abs(scr).max(), 2.30, 0.10, 0.1)
    mx.add(thud(110, 45, 0.3, 0.3), 2.76, 0.30, 0.0)
    mx.add(whoosh(0.16, 900, 3000), 2.96, 0.14)                                       # punch-in
    mx.add(whistle(900, 420, 0.30, curve=1.6), 3.04, 0.11, 0.1)
    mx.add(P("switch_02.ogg"), 3.36, 0.35, 0.1)
    mx.add(sparkle(), 3.80, 0.20, 0.1)
    # --- S2
    mx.add(whoosh(0.2, 600, 2400), 4.50, 0.12)
    scale = [0, 2, 4, 5, 7, 9, 11]
    for i, (cue, lab, (x, y), _) in enumerate(A.ITEMS):
        mx.add(plop(0), cue, 0.42, xpan(x), 0.72 * 2 ** (scale[i] / 12))
        mx.add(tick(1800 + i * 120), cue + 0.10, 0.07, xpan(x))
    mx.add(whoosh(0.4, 400, 1800), 10.84, 0.16, 0.5)
    mx.add(P("spring_07.ogg"), 11.26, 0.16, 0.4, 0.8)
    for i in range(8):
        f0 = A._fly(i)
        mx.add(whoosh(0.3, 700 + 90 * i, 2600 + 200 * i, peak=0.7), f0 + 0.04, 0.13, xpan(A.ITEMS[i][2][0]) if i < 7 else 0.0)
        mx.add(thud(150 + 12 * i, 70, 0.14, 0.9), f0 + 0.40, 0.20, 0.45)
    mx.add(P("paper_02.ogg"), 12.94, 0.2, 0.45)
    mx.add(whoosh(0.42, 500, 2600), 13.04, 0.2, 0.6)
    # --- S3
    for k, (cue, fig, name, x, lab) in enumerate(A.DRV):
        mx.add(whistle(1300, 500, 0.22, curve=1.4), cue + 0.01, 0.07, xpan(x))
        mx.add(thud(140, 55, 0.28, 0.5), cue + 0.24, 0.28, xpan(x))
        mx.add(P("spring_04.ogg"), cue + 0.26, 0.11, xpan(x), 0.9 + 0.08 * k)
        mx.add(plop(k), cue + 0.32, 0.16, xpan(x), 1.2)
    mx.add(whistle(1500, 300, A.T_LAND - A.T_BOX + 0.02, curve=1.3), A.T_BOX - 0.02, 0.13)
    mx.add(thud(95, 34, 0.7, 0.8), A.T_LAND, 0.62)
    mx.add(P("slam_03.ogg"), A.T_LAND, 0.36)
    mx.add(pitch(P("box_hit.ogg") if os.path.exists(os.path.join(ASSETS, "sfx", "box_hit.ogg")) else P("wooden_01.ogg"), 0.6), A.T_LAND + 0.01, 0.3)
    ch = P("charge.wav")[: int(0.95 * SR)]
    mx.add(fade(ch, 0.05, 0.08) * np.linspace(0.3, 1, len(ch)), A.T_LAND + 0.18, 0.20, 0.0, 1.5)
    cr = np.tile(P("crackleelectricityloop.wav"), 3)[: int(0.9 * SR)]
    mx.add(fade(cr, 0.02, 0.05), A.T_LAND + 0.2, 0.22)
    for i in range(6):
        z = bp(rng.normal(0, 1, int(0.07 * SR)).astype(np.float32), 1500, 7000) * np.exp(-np.arange(int(0.07 * SR)) / SR * 50)
        mx.add(z / np.abs(z).max(), A.T_LAND + 0.25 + i * 0.13 + 0.03 * rng.random(), 0.15, rng.uniform(-0.6, 0.6))
    mx.add(whoosh(0.5, 300, 5000, peak=0.5), 18.14, 0.3)                              # flash across the cut
    mx.add(thud(80, 30, 0.6, 0.2), 18.44, 0.34)
    # --- S4
    mx.add(whoosh(0.36, 600, 2600, peak=0.3), A.T_LIFT, 0.2)
    mx.add(P("spring_05.ogg"), A.T_LIFT + 0.02, 0.13, 0.0, 0.85)
    mx.add_st(passby(1.15, 0.47), A.T_PASS - 0.16, 0.30)
    for t0 in (A.SLAM1, A.SLAM2):
        mx.add(whoosh(0.16, 2400, 500, peak=0.8), t0 - 0.02, 0.12)
        mx.add(thud(100, 36, 0.6, 0.9), t0 + 0.14, 0.46)
        mx.add(P("slam_02.ogg"), t0 + 0.14, 0.20)
    # --- S5 / S6: the old car
    def rate56(s):
        tt = B.T5 + s
        if tt < B.T6: return 1.18 + 0.05 * math.sin(tt * 2.1)
        if tt < B.TD0: return 1.02 + 0.04 * math.sin(tt * 2.1)
        if tt < B.TD1: return 1.02 - 0.26 * (tt - B.TD0) / (B.TD1 - B.TD0)
        return 0.76 + 0.02 * math.sin(tt * 3)
    def amp56(s):
        tt = B.T5 + s
        a = min(1, s / 0.15) * min(1, (B.T6_END - tt) / 0.05)
        return a * (0.8 if tt < B.TD1 else 0.62)
    eng = engine(B.T6_END - B.T5, rate56, amp56, "loop_3_0.wav", grit=0.45, lowpass=4200)
    bed.add(eng, B.T5, 0.16, -0.1)
    wn = lp(rng.normal(0, 1, int((B.T6_END - B.T5) * SR)).astype(np.float32), 900) * 2
    bed.add(fade(hp(wn, 150), 0.2, 0.05), B.T5, 0.05)
    mx.add(whoosh(0.18, 900, 3000), B.T_PUNCH - 0.03, 0.13)
    mx.add(whistle(900, 420, 0.30, curve=1.6), 29.02, 0.10)
    mx.add(P("switch_02.ogg"), 29.32, 0.32)
    mx.add(P("spring_03.ogg"), 29.37, 0.13, 0.0, 0.9)
    mx.add(sparkle(), 29.40, 0.17)
    mx.add(whoosh(0.3, 500, 1800), 30.72, 0.07, 0.4); mx.add(whoosh(0.3, 500, 1800), 31.62, 0.07, 0.4)
    mx.add(P("spring_01.ogg"), 32.16, 0.20, 0.0, 1.15)                                 # shades ping off
    mx.add(pitch(P("gong_02.ogg"), 0.5), 32.30, 0.26, 0.3)                             # hello, death
    mx.add(pitch(P("bell_03.ogg"), 0.42), 32.34, 0.10, 0.3)
    # --- S7 / S8
    mx.add(whoosh(0.22, 500, 2000), B.T7 + 0.22, 0.08, 0.2)
    mx.add(plop(0), B.T_AL, 0.36, 0.3, 0.8); mx.add(whoosh(0.3, 400, 1500, peak=0.2), B.T_AL, 0.12, 0.3)
    mx.add(tick(2000), B.T_AL + 0.30, 0.08, 0.3)
    mx.add(thud(120, 44, 0.45, 0.9), B.T_STAMP + 0.14, 0.50, 0.3); mx.add(P("slam_06.ogg"), B.T_STAMP + 0.14, 0.26, 0.3)
    mx.add(whoosh(0.16, 900, 3000), B.T8 - 0.03, 0.12)
    mx.add(P("switch_01.ogg"), 39.22, 0.22, 0.3)
    mx.add(P("spring_04.ogg"), 40.20, 0.10, -0.3, 1.25)
    mx.add(pitch(P("wooden_02.ogg"), 0.8), 40.66, 0.16, 0.3)
    # --- S9
    mx.add(whoosh(0.34, 500, 2400, peak=0.6), 41.42, 0.20)
    mx.add(P("paper_02.ogg"), 41.52, 0.22)
    mx.add(shutter(), 41.79, 0.42)
    mx.add(plop(0), 42.16, 0.28, 0.55, 0.62)
    # --- S10
    mx.add(whoosh(0.2, 600, 1800), B.T10 - 0.02, 0.07)
    mx.add(plop(1), 43.26, 0.26, -0.3, 1.1); mx.add(tick(2600), 43.42, 0.06, -0.1)
    # --- S11
    car2 = engine(1.2, lambda s: 1.5 - 0.95 * min(1, s / 1.0) ** 0.8, lambda s: min(1, s / 0.1) * (0.9 - 0.75 * min(1, s / 1.02)) * (0 if s > 1.12 else 1), "loop_3_0.wav", grit=0.45, lowpass=4500)
    mx.add(car2, 45.36, 0.24, -0.35)
    sq = whistle(2300, 1500, 0.24, vib=0.02) * np.linspace(1, 0, int(0.24 * SR)) ** 0.5
    mx.add(sq, 46.18, 0.035, -0.2)
    mx.add(thud(110, 48, 0.3, 0.4), 46.42, 0.2, -0.3)
    mx.add(whoosh(0.16, 2400, 500, peak=0.8), 46.28, 0.12)
    mx.add(thud(105, 38, 0.5, 0.9), 46.30 + 0.14, 0.50); mx.add(P("slam_02.ogg"), 46.44, 0.24)
    for i in range(7):                                                                 # small footsteps
        mx.add(pitch(P("wooden_03.ogg"), 1.5 + 0.1 * (i % 2)), 47.12 + i * 0.148, 0.07, 0.6 - 0.02 * i)
    mx.add(whoosh(0.16, 900, 3000), B.T11B - 0.03, 0.12)
    mx.add(plop(1), 48.50, 0.3, 0.5, 1.5)
    mx.add(plop(0), 48.96, 0.34, -0.2, 0.9); mx.add(whoosh(0.2, 700, 2200), 48.94, 0.08, -0.2)
    mx.add(P("switch_01.ogg"), 49.52, 0.16, 0.4)
    mx.add(whoosh(0.3, 400, 2600, peak=0.6), B.T11C - 0.03, 0.22)
    mx.add(thud(120, 46, 0.4, 0.9), B.T11C + 0.24, 0.36); mx.add(P("hit_03.ogg"), B.T11C + 0.36, 0.26)
    for i, t0 in enumerate((50.62, 50.80, 50.98)):
        mx.add(plop(i), t0, 0.26, -0.4, 1.0 + 0.12 * i)
    mx.add(whoosh(0.24, 400, 1600, peak=0.3), 51.0, 0.10)
    mx.add(plop(1), 51.30, 0.22, -0.1, 1.5); mx.add(plop(1), 51.44, 0.22, 0.1, 1.7)
    mx.add(pitch(P("wooden_01.ogg"), 0.9), 51.40, 0.34, 0.45)
    mx.add(P("wooden_02.ogg"), 51.92, 0.24, 0.5); mx.add(P("wooden_02.ogg"), 52.04, 0.2, 0.5)        # knock, knock
    # --- S12
    mx.add(tick(1600), 52.42, 0.16, -0.4); mx.add(plop(0), 52.42, 0.2, -0.4, 1.0)
    mx.add(whoosh(0.14, 800, 2200), 52.66, 0.10, 0.0); mx.add(plop(0), 52.78, 0.2, 0.4, 1.12)
    mx.add(whoosh(0.14, 800, 2200), 52.94, 0.10, 0.0)
    mx.add(thud(130, 50, 0.3, 0.7), B.T_PICK + 0.10, 0.34); mx.add(pitch(P("bell_02.ogg"), 0.8), B.T_PICK + 0.10, 0.2)
    zipu = whistle(400, 1700, 0.2, curve=0.7)
    mx.add(zipu, B.T_STEP, 0.10, -0.6); mx.add(zipu, B.T_STEP + 0.015, 0.10, 0.6)
    mx.add(whoosh(0.24, 600, 3000, peak=0.4), B.T_STEP, 0.2)
    mx.add(whoosh(0.16, 2400, 500, peak=0.8), B.T_FIRST - 0.02, 0.12)
    mx.add(thud(100, 36, 0.6, 0.9), B.T_FIRST + 0.14, 0.56); mx.add(P("slam_02.ogg"), B.T_FIRST + 0.14, 0.28)
    mx.add(gulp(), 54.50, 0.30)
    mx.add(whistle(1100, 260, 0.56, vib=0.012, curve=1.2), B.T_IRIS, 0.12)
    mx.add(pitch(P("plop_02.ogg"), 0.7), B.T_IRIS + 0.56, 0.3)
    # --- film projector under every 1950s scene
    for a, b, g in ((18.50, B.T6_END, 0.045), (B.T12, DURATION - 0.2, 0.05)):
        pr = fade(projector(b - a), 0.25, 0.12)
        bed.add(pr, a, g, 0.0)
    # --- combine
    v = voice(vo_path)
    vs = np.zeros((mx.n,), np.float32); vs[: len(v)] = v[: mx.n]
    duck = duck_env(vs, 0.55)
    out = mx.buf * 0.84 * (0.70 + 0.30 * duck[:, None]) + bed.buf * 0.9 * duck[:, None]
    out[:, 0] += vs; out[:, 1] += vs
    out = out[: int(DURATION * SR)]
    out = out * 1.2                                                                     # programme level ~ -14.5 LUFS
    out = np.tanh(out * 0.95) / 0.95 * 0.93                                             # soft ceiling
    nf = int(0.12 * SR); out[-nf:] *= np.linspace(1, 0, nf)[:, None]
    sf.write(out_path, out, SR, subtype="PCM_24")
    return out

if __name__ == "__main__":
    o = build(sys.argv[1], sys.argv[2])
    print("peak %.3f  rms %.1f dB" % (np.abs(o).max(), 20 * np.log10(np.sqrt((o ** 2).mean()))))
