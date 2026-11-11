"""Synthesised sound-design library (all original — no samples). 48 kHz stereo float32. make(name, dur=None, seed=0) -> (n,2) array."""
import numpy as np
from scipy import signal

SR = 48000
def _t(d): return np.arange(int(d * SR)) / SR
def _rng(seed): return np.random.default_rng(1000 + seed)
def _bp(x, lo, hi, order=2): return signal.sosfilt(signal.butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)
def _lp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, btype='low', fs=SR, output='sos'), x)
def _hp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, btype='high', fs=SR, output='sos'), x)
def _st(x, pan=0.0):
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4); return np.stack([x * l, x * r], 1) * np.sqrt(2)
def _fade(x, a=0.005, r=0.02):
    n = len(x); na = min(n // 2, int(a * SR)); nr = min(n // 2, int(r * SR)); e = np.ones(n)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] = np.linspace(1, 0, nr)
    return x * (e[:, None] if x.ndim == 2 else e)
def _sweep_bp(noise, f0, f1, q=2.0, block=256):
    """band-pass with a moving centre frequency (state-variable filter, per-sample)."""
    n = len(noise); f = np.geomspace(f0, f1, n); out = np.zeros(n); lo = bd = 0.0
    g = 2 * np.sin(np.pi * np.minimum(f, SR / 6.5) / SR); d = 1.0 / q
    for i in range(n):
        lo += g[i] * bd; hi = noise[i] - lo - d * bd; bd += g[i] * hi; out[i] = bd
    return out
_IR = None
def reverb(x, wet=0.25, rt=1.6, seed=5):
    global _IR
    if _IR is None or _IR[0] != rt:
        r = _rng(seed); n = int(rt * SR * 1.3); t = np.arange(n) / SR
        ir = r.standard_normal((n, 2)) * np.exp(-6.9 * t / rt)[:, None]
        ir = np.stack([_hp(_lp(ir[:, c], 7000), 180) for c in range(2)], 1); ir[:int(0.004 * SR)] = 0
        _IR = (rt, ir / np.sqrt((ir ** 2).sum(0)).max())
    ir = _IR[1]
    if x.ndim == 1: x = _st(x)
    w = np.stack([signal.fftconvolve(x[:, c], ir[:, c]) for c in range(2)], 1)
    out = np.zeros((len(w), 2)); out[:len(x)] = x * (1 - wet * 0.3); out += w * wet
    return out

def whoosh(dur=0.7, seed=0, up=True, rev=False):
    r = _rng(seed); n = int(dur * SR); x = r.standard_normal(n)
    f0, f1 = (250, 3200) if up else (3200, 250)
    y = _sweep_bp(x, f0, f1, q=1.6)
    t = np.linspace(0, 1, n); env = np.sin(np.pi * t ** (1.9 if rev else 0.8)) ** 2
    if rev: env = t ** 3; env[-int(0.02 * SR):] *= np.linspace(1, 0, int(0.02 * SR))
    y = y * env; pan = np.linspace(-0.7, 0.7, n) * (1 if seed % 2 == 0 else -1)
    l = np.cos((pan + 1) * np.pi / 4); rr = np.sin((pan + 1) * np.pi / 4)
    return np.stack([y * l, y * rr], 1) * 0.9
def impact(seed=0, big=True):
    d = 2.2 if big else 0.9; t = _t(d); r = _rng(seed)
    f = (38 + (60 if big else 70) * np.exp(-t * (9 if big else 14))); ph = 2 * np.pi * np.cumsum(f) / SR
    sub = np.sin(ph) * np.exp(-t * (2.4 if big else 6)) * 1.0
    nz = _lp(r.standard_normal(len(t)), 900 if big else 1400) * np.exp(-t * (14 if big else 22)) * 0.7
    click = _bp(r.standard_normal(len(t)), 1500, 5000) * np.exp(-t * 90) * 0.35
    x = np.tanh((sub + nz + click) * 1.6) * 0.8
    return reverb(_st(x), wet=0.22 if big else 0.14)
def subdrop(seed=0):
    t = _t(2.4); f = 28 + 52 * np.exp(-t * 1.6); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.3) * np.minimum(1, t / 0.02)
    return _st(np.tanh(x * 1.3) * 0.85)
def riser(dur=2.0, seed=0):
    r = _rng(seed); n = int(dur * SR); t = np.linspace(0, 1, n)
    nz = _sweep_bp(r.standard_normal(n), 300, 6500, q=2.2) * 0.8
    f = 180 * (2 ** (t * 2.6)); tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25 + np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * 0.12
    env = t ** 2.4; trem = 1 - 0.25 * (0.5 + 0.5 * np.sin(2 * np.pi * (6 + 10 * t) * t * dur))
    x = (nz + tone) * env * trem; x[-int(0.012 * SR):] *= np.linspace(1, 0, int(0.012 * SR))
    return reverb(_st(x), wet=0.2)
def swell(dur=2.0, seed=0):
    r = _rng(seed); n = int(dur * SR); t = np.arange(n) / SR; u = np.linspace(0, 1, n)
    root = [146.83, 174.61, 196.0, 130.81][seed % 4]; x = np.zeros(n)
    for k, (m, a) in enumerate([(1, 1), (1.5, 0.7), (2, 0.6), (3, 0.3), (4, 0.2)]):
        for det in (-0.004, 0.003):
            x += a * np.sin(2 * np.pi * root * m * (1 + det) * t + r.uniform(0, 6.28))
    air = _bp(r.standard_normal(n), 3000, 9000) * 0.25
    env = np.sin(np.pi * u ** 0.75) ** 1.6
    y = _lp(x * 0.12 + air * 0.5, 4500) * env
    return reverb(_st(y), wet=0.4)
def shimmer(seed=0, dur=1.8):
    r = _rng(seed); t = _t(dur); L = np.zeros(len(t)); R = np.zeros(len(t))
    base = [1318.5, 1568.0, 1975.5, 2349.3, 2637.0, 3136.0, 3951.1]
    for i in range(14):
        f = r.choice(base) * r.choice([1, 2]) * (1 + r.uniform(-0.004, 0.004)); st = r.uniform(0, 0.5); a = r.uniform(0.25, 1.0); dec = r.uniform(3, 7)
        e = np.where(t >= st, np.exp(-(t - st) * dec), 0) * np.minimum(1, np.maximum(0, (t - st)) / 0.004)
        s = np.sin(2 * np.pi * f * t) * e * a; p = r.uniform(0, 1); L += s * p; R += s * (1 - p)
    return reverb(np.stack([L, R], 1) * 0.11, wet=0.45)
def chime(seed=0, f0=880.0, dur=2.2):
    t = _t(dur); x = np.zeros(len(t))
    for m, a, d in [(1, 1, 2.2), (2.76, 0.5, 3.5), (5.4, 0.3, 5), (8.93, 0.15, 7)]: x += a * np.sin(2 * np.pi * f0 * m * t) * np.exp(-t * d)
    return reverb(_st(x * 0.25 * np.minimum(1, t / 0.002)), wet=0.35)
def ding(seed=0):
    a = chime(0, 1318.5, 0.9); b = chime(0, 1975.5, 1.4); n = int(0.11 * SR); out = np.zeros((len(b) + n, 2)); out[:len(a)] += a * 0.8; out[n:n + len(b)] += b
    return out
def buzz(seed=0):
    t = _t(0.34); x = signal.square(2 * np.pi * 98 * t) * 0.5 + signal.square(2 * np.pi * 147 * t) * 0.25
    return _st(_fade(_lp(x, 900), 0.004, 0.05) * 0.5)
def tick(seed=0):
    r = _rng(seed); t = _t(0.05); x = _bp(r.standard_normal(len(t)), 1800, 5200) * np.exp(-t * 160) + np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 220) * 0.4
    return _st(x * 0.6)
def pop(seed=0):
    t = _t(0.09); f = 420 + 700 * (t / 0.09); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45)
    return _st(x * 0.55)
def typing(dur=0.8, seed=0):
    r = _rng(seed); n = int(dur * SR); x = np.zeros(n + SR // 10); tt = 0.0
    while tt < dur:
        k = tick(int(r.integers(0, 99)))[:, 0] * r.uniform(0.6, 1.0); k = _lp(k, 3800) + 0.3 * np.sin(2 * np.pi * 190 * _t(0.05)) * np.exp(-_t(0.05) * 90)
        i = int(tt * SR); x[i:i + len(k)] += k; tt += r.uniform(0.055, 0.105)
    return _st(x[:n] * 0.9)
def clock(dur=4.0, seed=0):
    n = int(dur * SR); x = np.zeros(n + SR); t = _t(0.09)
    for b in range(int(dur * 2) + 1):
        f = 1650 if b % 2 == 0 else 1250; k = (np.sin(2 * np.pi * f * t) * np.exp(-t * 120) + _bp(_rng(b).standard_normal(len(t)), 900, 3200) * np.exp(-t * 200) * 0.6)
        i = int(b * 0.5 * SR); x[i:i + len(k)] += k
    return reverb(_st(x[:n] * 0.5), wet=0.12)[:n]
def rewind(dur=1.6, seed=0):
    r = _rng(seed); n = int(dur * SR); u = np.linspace(0, 1, n)
    f = 300 * (2 ** (u * 3.2)); tone = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * 0.18
    nz = _sweep_bp(r.standard_normal(n), 500, 5000, q=3) * 0.6
    trem = 0.55 + 0.45 * signal.square(2 * np.pi * np.cumsum(14 + 30 * u) / SR)
    x = _lp((tone + nz) * trem, 6000) * np.sin(np.pi * u) ** 0.6
    return _st(_fade(x, 0.02, 0.03) * 0.7)
def slash(seed=0):
    r = _rng(seed); n = int(0.2 * SR); x = _sweep_bp(r.standard_normal(n), 5000, 900, q=1.4) * np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    return _st(x * 0.9, pan=0.3 if seed % 2 else -0.3)
def slam(seed=0):
    r = _rng(seed); t = _t(0.9)
    thud = np.sin(2 * np.pi * np.cumsum(48 + 60 * np.exp(-t * 30)) / SR) * np.exp(-t * 7)
    wood = _bp(r.standard_normal(len(t)), 180, 900) * np.exp(-t * 26) * 1.2
    latch = _bp(r.standard_normal(len(t)), 2000, 6000) * np.exp(-np.maximum(0, t - 0.012) * 140) * (t > 0.012) * 0.5
    return reverb(_st(np.tanh((thud + wood + latch) * 1.5) * 0.8), wet=0.3)
def heartbeat(seed=0):
    t = _t(0.55); x = np.zeros(len(t))
    for st, a, f in [(0.0, 1.0, 52), (0.19, 0.7, 60)]:
        e = np.where(t >= st, np.exp(-(t - st) * 26), 0) * np.minimum(1, np.maximum(0, t - st) / 0.006); x += a * np.sin(2 * np.pi * f * (t - st)) * e
    return _st(_lp(x, 160) * 0.95)
def static(dur=2.0, seed=0):
    r = _rng(seed); n = int(dur * SR); x = _bp(r.standard_normal(n), 900, 9000) * 0.5
    cr = (r.random(n) > 0.9992) * r.uniform(0.5, 1.5, n); x += _hp(cr, 2000) * 0.8
    return np.stack([_fade(x, 0.03, 0.03), _fade(np.roll(x, 137), 0.03, 0.03)], 1) * 0.5
def radio(dur=2.0, seed=0):
    r = _rng(seed); n = int(dur * SR); t = np.arange(n) / SR
    x = _bp(r.standard_normal(n), 400, 3000) * 0.4
    wh = np.sin(2 * np.pi * np.cumsum(900 + 500 * np.sin(2 * np.pi * 0.7 * t) + 200 * np.sin(2 * np.pi * 3.1 * t)) / SR) * 0.08
    return _st(_fade(x + wh, 0.05, 0.08) * 0.6)
def glitch(seed=0):
    r = _rng(seed); n = int(0.28 * SR); x = np.zeros(n); i = 0
    while i < n:
        L = int(r.uniform(0.008, 0.04) * SR); f = r.choice([220, 440, 880, 1760, 3520]); seg = signal.square(2 * np.pi * f * np.arange(L) / SR) * r.uniform(0.2, 0.6) * (r.random() > 0.3)
        x[i:i + L] = seg[:max(0, min(L, n - i))]; i += L
    return _st(_fade(_lp(x, 5000), 0.002, 0.01) * 0.35)
def paper(seed=0):
    r = _rng(seed); n = int(0.35 * SR); u = np.linspace(0, 1, n); x = _bp(r.standard_normal(n), 2000, 8000) * (np.sin(np.pi * u) ** 2) * (0.6 + 0.4 * r.random(n))
    return _st(x * 0.4)
def flutter(seed=0):
    r = _rng(seed); n = int(0.9 * SR); x = np.zeros(n)
    for k in range(9):
        L = int(0.05 * SR); i = int((0.02 + k * 0.085 + r.uniform(-0.01, 0.01)) * SR); p = _bp(r.standard_normal(L), 250, 1800) * np.hanning(L) * (1 - k * 0.07)
        x[i:i + L] += p[:max(0, min(L, n - i))]
    pan = np.linspace(-0.6, 0.6, n); return np.stack([x * np.cos((pan + 1) * np.pi / 4), x * np.sin((pan + 1) * np.pi / 4)], 1) * 0.7
def camera(seed=0):
    a = tick(1); b = tick(2); n = int(0.07 * SR); out = np.zeros((n + len(b), 2)); out[:len(a)] += a; out[n:] += b * 0.8; return out * 1.1
def thud(seed=0):
    t = _t(0.4); x = np.sin(2 * np.pi * np.cumsum(55 + 50 * np.exp(-t * 40)) / SR) * np.exp(-t * 14)
    return _st(x * 0.9)

# name -> (generator, default peak level in dBFS)
LIB = {
 'whoosh': (lambda d, s: whoosh(d or 0.7, s), -15), 'whooshRev': (lambda d, s: whoosh(d or 0.9, s, rev=True), -15),
 'impact': (lambda d, s: impact(s, True), -7), 'hit': (lambda d, s: impact(s, False), -11), 'subdrop': (lambda d, s: subdrop(s), -9),
 'riser': (lambda d, s: riser(d or 2.0, s), -14), 'swell': (lambda d, s: swell(d or 2.0, s), -17), 'shimmer': (lambda d, s: shimmer(s), -17),
 'chime': (lambda d, s: chime(s), -17), 'ding': (lambda d, s: ding(s), -17), 'buzz': (lambda d, s: buzz(s), -19), 'tick': (lambda d, s: tick(s), -20),
 'pop': (lambda d, s: pop(s), -19), 'type': (lambda d, s: typing(d or 0.8, s), -22), 'clock': (lambda d, s: clock(d or 4.0, s), -24),
 'rewind': (lambda d, s: rewind(d or 1.6, s), -17), 'slash': (lambda d, s: slash(s), -15), 'slam': (lambda d, s: slam(s), -8),
 'heartbeat': (lambda d, s: heartbeat(s), -11), 'static': (lambda d, s: static(d or 2.0, s), -20), 'radio': (lambda d, s: radio(d or 2.0, s), -22),
 'glitch': (lambda d, s: glitch(s), -20), 'paper': (lambda d, s: paper(s), -22), 'flutter': (lambda d, s: flutter(s), -18), 'camera': (lambda d, s: camera(s), -19),
 'thud': (lambda d, s: thud(s), -12),
}
def make(name, dur=None, seed=0):
    if name not in LIB: return None, 0
    g, lvl = LIB[name]; x = g(dur, seed)
    if x.ndim == 1: x = _st(x)
    pk = np.abs(x).max() + 1e-9
    return (x / pk).astype(np.float32), lvl

if __name__ == '__main__':
    import soundfile as sf, sys, os
    os.makedirs('audio/sfx_preview', exist_ok=True)
    for k in LIB:
        x, lvl = make(k, None, 1); print(f"{k:10s} {len(x)/SR:5.2f}s  level {lvl} dB  rms {20*np.log10(np.sqrt((x**2).mean())+1e-9):6.1f}")
