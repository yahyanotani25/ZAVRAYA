"""Original, royalty-free soundtrack + sound design for the reel.

120 BPM future-house bed (Am7 - Fmaj7 - Cadd9 - G6), risers into each drop,
impacts on the drops, and a matched whoosh / hit for every picture cut.
Everything is synthesised here, so there are no licensing issues.
"""
import sys
import numpy as np
from scipy import signal
import timeline as T

SR = 48000
DUR = T.DURATION
N = int(SR * DUR)
BEAT = 60.0 / T.BPM
BAR = 4 * BEAT
rng = np.random.default_rng(7)

L = np.zeros(N)
R = np.zeros(N)
REV_L = np.zeros(N)   # reverb send bus
REV_R = np.zeros(N)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


def place(sig, t, gain=1.0, pan=0.0, rev=0.0):
    """Add mono or stereo signal at time t (s)."""
    i0 = int(round(t * SR))
    if sig.ndim == 1:
        gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sl, sr = sig * gl * 1.414, sig * gr * 1.414
    else:
        sl, sr = sig[0], sig[1]
    if i0 < 0:
        sl, sr, i0 = sl[-i0:], sr[-i0:], 0
    n = min(len(sl), N - i0)
    if n <= 0:
        return
    L[i0:i0 + n] += sl[:n] * gain
    R[i0:i0 + n] += sr[:n] * gain
    if rev:
        REV_L[i0:i0 + n] += sl[:n] * gain * rev
        REV_R[i0:i0 + n] += sr[:n] * gain * rev


def sos(kind, f, order=2):
    if isinstance(f, (list, tuple)):
        f = [min(x, SR / 2 * 0.95) for x in f]
    else:
        f = min(f, SR / 2 * 0.95)
    return signal.butter(order, f, btype=kind, fs=SR, output='sos')


def filt(x, kind, f, order=2):
    return signal.sosfilt(sos(kind, f, order), x)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


# ---------------------------------------------------------------- drums ----
def kick():
    t = tt(0.5)
    f = 52 + 130 * np.exp(-t / 0.032)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.20)
    knock = np.sin(2 * np.pi * 150 * t) * np.exp(-t / 0.035) * 0.55
    click = filt(rng.standard_normal(len(t)), 'highpass', 3000) * np.exp(-t / 0.003) * 0.25
    return np.tanh(1.8 * (body + knock + click)) * 0.9


def clap():
    t = tt(0.45)
    n = rng.standard_normal(len(t))
    env = np.zeros(len(t))
    for d in (0.0, 0.010, 0.021):
        m = t >= d
        env[m] += np.exp(-(t[m] - d) / 0.006)
    env += np.exp(-np.maximum(t - 0.028, 0) / 0.11) * (t >= 0.028) * 0.8
    return filt(n * env, 'bandpass', [900, 6000]) * 0.9


def hat(open_=False):
    t = tt(0.25 if open_ else 0.06)
    n = rng.standard_normal(len(t))
    e = np.exp(-t / (0.09 if open_ else 0.018))
    return filt(n * e, 'highpass', 6500 if open_ else 8000) * 0.6


def snare():
    t = tt(0.25)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05)
    nz = filt(rng.standard_normal(len(t)), 'bandpass', [1200, 9000]) * np.exp(-t / 0.09)
    return (tone * 0.5 + nz) * 0.6


K, CL, CH, OH, SN = kick(), clap(), hat(), hat(True), snare()

# ---------------------------------------------------------------- harmony --
CHORDS = {
    'Am7': [57, 60, 64, 67], 'Fmaj7': [53, 57, 60, 64],
    'Cadd9': [55, 60, 62, 64], 'G6': [55, 59, 62, 64],
}
ROOTS = {'Am7': 33, 'Fmaj7': 29, 'Cadd9': 36, 'G6': 31}
CYCLE = ['Am7', 'Fmaj7', 'Cadd9', 'G6']
NBARS = int(np.ceil(DUR / BAR))


def chord_for_bar(b):
    if b == 0:
        return 'Am7'
    if b == 1:
        return 'G6'
    if b >= 20:
        return 'Cadd9'
    if b == 19:
        return 'Fmaj7'
    return CYCLE[(b - 2) % 4]


def section(t):
    if t < 4:
        return 'intro'
    if t < 18:
        return 'grooveA'
    if t < 20:
        return 'break'
    if t < 34:
        return 'grooveB'
    if t < 38:
        return 'grooveC'
    return 'outro'


def supersaw(freq, dur, voices=(-14, -6, 0, 6, 14)):
    t = tt(dur)
    out = np.zeros((2, len(t)))
    for i, c in enumerate(voices):
        f = freq * 2 ** (c / 1200.0)
        ph = rng.random()
        s = signal.sawtooth(2 * np.pi * (f * t + ph))
        pan = (i / (len(voices) - 1)) * 2 - 1
        out[0] += s * np.cos((pan * 0.8 + 1) * np.pi / 4)
        out[1] += s * np.sin((pan * 0.8 + 1) * np.pi / 4)
    return out / len(voices)


def pluck(freq, dur=0.32, bright=1.0):
    t = tt(dur)
    s = np.zeros(len(t))
    for k in range(1, 14):
        if freq * k > SR / 2 * 0.9:
            break
        s += (1.0 / k) * np.sin(2 * np.pi * freq * k * t + k * 0.3) * np.exp(-t * (5 + k * 2.2 / bright))
    return s * np.exp(-t / 0.22) * np.minimum(t / 0.002, 1)


def bell(freq, dur=2.2):
    t = tt(dur)
    idx = 2.4 * np.exp(-t / 0.35)
    mod = np.sin(2 * np.pi * freq * 3.5 * t) * idx
    car = np.sin(2 * np.pi * freq * t + mod)
    car2 = np.sin(2 * np.pi * freq * 2.0 * t) * 0.18 * np.exp(-t / 0.4)
    return (car + car2) * np.exp(-t / 0.9) * np.minimum(t / 0.003, 1)


# pad (sidechained in grooves) -------------------------------------------
pad = np.zeros((2, N))
for b in range(NBARS):
    t0 = b * BAR
    if t0 >= DUR:
        break
    dur = min(BAR + 0.25, DUR - t0) if b < 20 else DUR - t0
    ch = CHORDS[chord_for_bar(b)]
    seg = np.zeros((2, int(dur * SR)))
    for m in ch:
        seg += supersaw(hz(m), dur)
    seg += supersaw(hz(ch[0] - 12), dur) * 0.5
    tl = tt(dur)
    env = np.minimum(tl / 0.06, 1) * np.minimum((dur - tl) / 0.2, 1)
    seg *= env
    i0 = int(t0 * SR)
    n = min(seg.shape[1], N - i0)
    pad[:, i0:i0 + n] += seg[:, :n]


def cutoff_curve(t):
    if t < 4:
        return 400 * (3200 / 400) ** (t / 4)
    if t < 18:
        return 3600
    if t < 20:
        return 900 * (5000 / 900) ** ((t - 18) / 2)
    if t < 38:
        return 4200
    return 3000 * np.exp(-(t - 38) / 4)


def sweep_lp(x, fn, block=1024):
    """Block-wise time-varying 2nd-order low-pass (state carried across blocks)."""
    y = np.zeros_like(x)
    zi = np.zeros((1, x.shape[0], 2))
    for i in range(0, x.shape[-1], block):
        c = fn((i + block / 2) / SR)
        s = sos('lowpass', max(c, 120), 2)
        y[:, i:i + block], zi = signal.sosfilt(s, x[:, i:i + block], axis=-1, zi=zi)
    return y


pad = sweep_lp(pad, cutoff_curve)
pad = filt(pad, 'highpass', 160)

# sidechain envelope (kicks on every beat in groove sections)
sc = np.ones(N)
kick_times = []
for i in range(int(DUR / BEAT) + 1):
    t = i * BEAT
    s = section(t)
    if s in ('grooveA', 'grooveB', 'grooveC') or (s == 'outro' and abs(t - 38.0) < 1e-6):
        if s == 'grooveA' or s == 'grooveB' or s == 'grooveC':
            if 19.75 <= t < 20.0:
                continue
            kick_times.append(t)
for t in kick_times:
    i0 = int(t * SR)
    tl = tt(0.38)
    g = 1 - 0.65 * np.exp(-tl / 0.09)
    n = min(len(tl), N - i0)
    sc[i0:i0 + n] = np.minimum(sc[i0:i0 + n], g[:n])
pad *= sc
pad_gain = np.array([0.55 if section(i / SR) in ('intro', 'break', 'outro') else 0.42 for i in range(0, N, SR // 100)])
pad_gain = np.interp(np.arange(N), np.arange(0, N, SR // 100), pad_gain)
L += pad[0] * pad_gain
R += pad[1] * pad_gain
REV_L += pad[0] * pad_gain * 0.25
REV_R += pad[1] * pad_gain * 0.25

# drums --------------------------------------------------------------------
for t in kick_times:
    place(K, t, 0.95)
place(K, 38.0, 1.0)
for i in range(int(DUR / BEAT) + 1):
    t = i * BEAT
    s = section(t)
    groove = s in ('grooveA', 'grooveB', 'grooveC')
    if groove and i % 2 == 1:
        place(CL, t, 0.42, 0.0, rev=0.35)
    # 16th hats
    for k in range(4):
        th = t + k * BEAT / 4
        if th >= 38.0 or (19.75 <= th < 20.0):
            continue
        if groove or (s == 'intro' and t >= 2.0) or s == 'break':
            vel = [0.55, 0.3, 0.75, 0.3][k]
            if s == 'break':
                vel *= 0.6
            place(CH, th, 0.16 * vel, pan=0.25)
        if groove and k == 2:
            place(OH, th, 0.12, pan=-0.2, rev=0.1)

# snare build rolls into the drops
for (a, b) in [(3.0, 4.0), (18.5, 19.75), (33.0, 34.0)]:
    t = a
    while t < b - 1e-6:
        prog = (t - a) / (b - a)
        step = BEAT / 2 if prog < 0.35 else (BEAT / 4 if prog < 0.75 else BEAT / 8)
        place(SN, t, 0.12 + 0.35 * prog, pan=0.05, rev=0.25)
        t += step

# bass (offbeat house bass, audible harmonics for phone speakers) ----------
for i in range(int(DUR / BEAT) + 1):
    t = i * BEAT + BEAT / 2
    s = section(t)
    if s not in ('grooveA', 'grooveB', 'grooveC') or (19.75 <= t < 20.0):
        continue
    b = int(t // BAR)
    root = ROOTS[chord_for_bar(b)]
    f = hz(root + 12)
    tl = tt(0.23)
    sub = np.sin(2 * np.pi * f * tl)
    mid = filt(signal.sawtooth(2 * np.pi * 2 * f * tl), 'lowpass', 900) * 0.35
    env = np.minimum(tl / 0.004, 1) * np.minimum((0.23 - tl) / 0.03, 1) * (0.75 + 0.25 * np.exp(-tl / 0.05))
    place(np.tanh(1.6 * (sub + mid) * env) * 0.8, t, 0.55)

# pluck arp + ping-pong delay ---------------------------------------------
arp = np.zeros((2, N))
pattern = [0, 2, 1, 3, 2, 1, 3, 2]
for i in range(int(DUR / (BEAT / 2))):
    t = i * BEAT / 2
    s = section(t)
    if s == 'outro' or (19.75 <= t < 20.0):
        continue
    b = int(t // BAR)
    ch = CHORDS[chord_for_bar(b)]
    note = ch[pattern[i % 8]] + 12
    vel = 1.0 if i % 2 == 0 else 0.7
    bright = 0.6 if s in ('intro', 'break') else 1.0
    p = pluck(hz(note), 0.32, bright) * vel
    i0 = int(t * SR)
    n = min(len(p), N - i0)
    pan = -0.35 if i % 2 else 0.35
    arp[0, i0:i0 + n] += p[:n] * np.cos((pan + 1) * np.pi / 4)
    arp[1, i0:i0 + n] += p[:n] * np.sin((pan + 1) * np.pi / 4)
arp_gain = np.where(np.arange(N) < 4 * SR, np.linspace(0.08, 0.30, N), 0.27)
arp *= arp_gain
d = int(0.375 * SR)
dl = np.zeros((2, N))
fb = 0.38
for rep in range(1, 5):
    g = fb ** rep
    src = arp[(rep + 1) % 2]
    dl[rep % 2, rep * d:] += src[:N - rep * d] * g
arp_total = arp + filt(dl, 'lowpass', 4500) * 0.55
L += arp_total[0]
R += arp_total[1]
REV_L += arp_total[0] * 0.2
REV_R += arp_total[1] * 0.2

# outro bell motif over F -> C ------------------------------------------
for (t, m, g) in [(38.0, 81, 0.22), (38.5, 84, 0.2), (39.0, 88, 0.22), (40.0, 79, 0.2),
                  (40.5, 76, 0.18), (41.0, 84, 0.24)]:
    place(bell(hz(m), 2.0), t, g, pan=0.15 if m % 2 else -0.15, rev=0.5)

# ---------------------------------------------------------------- FX -------
def band_noise(dur, centers, widths, env, seed=0):
    """Noise shaped in the STFT domain by a moving gaussian band."""
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    x = r.standard_normal(n + 2048)
    f, t, Z = signal.stft(x, SR, nperseg=1024, noverlap=768)
    tn = np.clip(t / dur, 0, 1)
    c = np.interp(tn, np.linspace(0, 1, len(centers)), centers)
    w = np.interp(tn, np.linspace(0, 1, len(widths)), widths)
    mask = np.exp(-0.5 * (np.log(np.maximum(f[:, None], 20) / c[None, :]) / w[None, :]) ** 2)
    _, y = signal.istft(Z * mask, SR, nperseg=1024, noverlap=768)
    y = y[:n]
    e = np.interp(np.linspace(0, 1, n), np.linspace(0, 1, len(env)), env)
    y = y * e
    return y / (np.abs(y).max() + 1e-9)


def riser(dur, seed):
    nz = band_noise(dur, [300, 1200, 7000], [0.6, 0.5, 0.45], [0, 0.15, 0.4, 1.0], seed)
    tl = tt(dur)
    f = 110 * 2 ** (2 * tl / dur)
    tone = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * (tl / dur) ** 2
    tone = filt(tone, 'lowpass', 2500)
    return nz * 0.8 + tone * 0.25


def impact():
    tl = tt(2.2)
    f = 62 * np.exp(-tl / 0.6) + 28
    boom = np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tl / 0.55))
    crash = filt(rng.standard_normal(len(tl)), 'bandpass', [1800, 12000]) * np.exp(-tl / 0.7) * 0.35
    thump = np.sin(2 * np.pi * 95 * tl) * np.exp(-tl / 0.06) * 0.6
    return boom * 0.9 + crash + thump


def reverse_cymbal(dur=1.0):
    tl = tt(dur)
    nz = filt(rng.standard_normal(len(tl)), 'highpass', 3500)
    return nz * (tl / dur) ** 3


def whoosh(dur=0.42, up=True, seed=1):
    cs = [450, 3800, 1200] if up else [3000, 600, 300]
    return band_noise(dur, cs, [0.55, 0.4, 0.6], [0, 0.35, 1.0, 0.25, 0], seed)


def tick():
    tl = tt(0.05)
    s = np.sin(2 * np.pi * 2600 * tl) * np.exp(-tl / 0.010)
    s += filt(rng.standard_normal(len(tl)), 'highpass', 6000) * np.exp(-tl / 0.003) * 0.4
    return s


def thud():
    tl = tt(0.35)
    f = 120 * np.exp(-tl / 0.05) + 55
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tl / 0.12) + filt(rng.standard_normal(len(tl)), 'lowpass', 3000) * np.exp(-tl / 0.01) * 0.3


def glitch_sfx(seed):
    r = np.random.default_rng(seed)
    out = np.zeros(int(0.22 * SR))
    for k in range(5):
        i0 = int(k * 0.04 * SR)
        tl = tt(0.03)
        f = r.uniform(300, 2400)
        s = np.sign(np.sin(2 * np.pi * f * tl)) * 0.5 + r.standard_normal(len(tl)) * 0.3
        s = np.round(s * 6) / 6
        out[i0:i0 + len(tl)] += s * np.exp(-tl / 0.02)
    return filt(out, 'bandpass', [400, 7000])


def shimmer(dur=0.8, seed=3):
    r = np.random.default_rng(seed)
    out = np.zeros(int(dur * SR) + SR // 2)
    for k in range(14):
        t0 = r.uniform(0, dur)
        f = hz(r.choice([84, 88, 91, 96, 100]))
        tl = tt(0.4)
        s = np.sin(2 * np.pi * f * tl) * np.exp(-tl / 0.12)
        i0 = int(t0 * SR)
        out[i0:i0 + len(tl)] += s * r.uniform(0.3, 1)
    return out / 4


def pop():
    tl = tt(0.09)
    f = 380 + 700 * (tl / 0.09)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tl / 0.03)


def flash_sfx():
    tl = tt(0.3)
    nz = filt(rng.standard_normal(len(tl)), 'highpass', 2500) * np.exp(-tl / 0.05)
    return nz + np.sin(2 * np.pi * 3200 * tl) * np.exp(-tl / 0.08) * 0.3


# risers into drops (cut dead at the drop)
place(riser(2.0, 11), 2.0, 0.30, rev=0.2)
place(riser(2.0, 12), 18.0, 0.34, rev=0.2)
place(riser(1.5, 13), 32.5, 0.22, rev=0.2)
place(riser(1.5, 14), 36.5, 0.20, rev=0.2)
for t in (4.0, 20.0, 34.0):
    place(reverse_cymbal(1.0), t - 1.0, 0.16)
for t in T.IMPACTS:
    place(impact(), t, 0.55 if t != 38.0 else 0.65, rev=0.3)

# transition sounds
for i, (t, tr) in enumerate(T.cut_times()):
    if t in T.IMPACTS:
        place(whoosh(0.5, True, 100 + i), t - 0.32, 0.22)
        continue
    if tr.startswith('whip'):
        pan = {'whip-left': (0.7, -0.7), 'whip-right': (-0.7, 0.7)}.get(tr, (0, 0))
        w = whoosh(0.42, True, 100 + i)
        p = np.linspace(pan[0], pan[1], len(w))
        st = np.vstack([w * np.cos((p + 1) * np.pi / 4), w * np.sin((p + 1) * np.pi / 4)]) * 1.4
        place(st, t - 0.24, 0.30)
    elif tr in ('zoom', 'spin'):
        place(whoosh(0.5, True, 100 + i), t - 0.30, 0.30, rev=0.1)
    elif tr == 'punch':
        place(thud(), t, 0.30)
    elif tr == 'flash':
        place(flash_sfx(), t, 0.20, rev=0.2)
    elif tr == 'glitch':
        place(glitch_sfx(100 + i), t - 0.06, 0.16)
    elif tr == 'leak':
        place(whoosh(0.7, False, 100 + i), t - 0.25, 0.16, rev=0.3)

# text accents (kept quiet so they sit under the music)
for t in (0.20, 0.33, 0.73, 0.87, 2.5):
    place(tick(), t, 0.10, pan=0.1)
place(thud(), 1.5, 0.35)
place(shimmer(0.7, 5), 4.05, 0.10, rev=0.4)
for (s, e, *_r) in T.CAPTIONS:
    place(tick(), s + 0.33, 0.07)
place(pop(), 35.2, 0.18)
place(shimmer(0.9, 9), 38.25, 0.10, rev=0.4)
place(shimmer(0.6, 10), 40.5, 0.08, rev=0.4)

# ---------------------------------------------------------------- reverb ---
def make_ir(rt=1.9, seed=21):
    r = np.random.default_rng(seed)
    n = int(rt * SR)
    tl = np.arange(n) / SR
    env = np.exp(-6.9 * tl / rt)
    irl = r.standard_normal(n) * env
    irr = r.standard_normal(n) * env
    irl, irr = filt(irl, 'lowpass', 6000), filt(irr, 'lowpass', 6000)
    pre = int(0.018 * SR)
    irl = np.concatenate([np.zeros(pre), irl])
    irr = np.concatenate([np.zeros(pre), irr])
    return irl / np.sqrt((irl ** 2).sum()), irr / np.sqrt((irr ** 2).sum())


irl, irr = make_ir()
wl = signal.fftconvolve(filt(REV_L, 'highpass', 250), irl)[:N]
wr = signal.fftconvolve(filt(REV_R, 'highpass', 250), irr)[:N]
L += wl * 0.55
R += wr * 0.55

# ---------------------------------------------------------------- master ---
mix = np.vstack([L, R])
mix = filt(mix, 'highpass', 28)
# glue compression
lvl = np.sqrt(signal.lfilter([0.002], [1, -0.998], (mix ** 2).mean(0)))
thr = 0.30
gr = np.where(lvl > thr, (thr / np.maximum(lvl, 1e-9)) ** (1 - 1 / 2.0), 1.0)
mix *= gr
# gentle low-shelf trim below 60 Hz, presence lift for phone speakers
low = filt(mix, 'lowpass', 60)
mix = mix - 0.35 * low
mix = mix + 0.18 * filt(mix, 'bandpass', [2000, 5000])
mix = mix / np.abs(mix).max()
mix = np.tanh(mix * 1.3) / np.tanh(1.3)
# fades
fi = int(0.02 * SR)
mix[:, :fi] *= np.linspace(0, 1, fi)
fo = int(1.6 * SR)
mix[:, -fo:] *= np.linspace(1, 0, fo) ** 1.5
mix = mix / np.abs(mix).max() * 0.89
rms = 20 * np.log10(np.sqrt((mix ** 2).mean()))
print(f'peak -1 dBFS, RMS {rms:.1f} dBFS')

out = sys.argv[1] if len(sys.argv) > 1 else 'soundtrack.wav'
from scipy.io import wavfile
wavfile.write(out, SR, (mix.T * 32767).astype(np.int16))
print('wrote', out)
