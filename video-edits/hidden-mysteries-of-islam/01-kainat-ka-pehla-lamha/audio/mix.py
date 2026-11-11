"""Final mix: processed voice-over + ducked music bed + synthesised SFX -> audio/master.wav (48k stereo, -14 LUFS, TP -1 dB).
usage: python3 audio/mix.py [--nomusic]"""
import json, sys, os, numpy as np, soundfile as sf, subprocess
from scipy import signal
import pyloudnorm as pyln
sys.path.insert(0, os.path.dirname(__file__))
import sfx as SFX

S = '/tmp/claude-0/-home-user-ZAVRAYA/11d60b1e-ec95-526d-bd06-3bd05d7e3343/scratchpad'
SR = 48000
cues = json.load(open(f'{S}/film/cues.json'))
T = lambda k: cues['s'][k][0]
E = lambda k: cues['s'][k][1]
DUR = cues['dur']
N = int(DUR * SR) + SR
PART = {p: (0 if p == 'a' else T(k) - 0.35) for p, k in dict(a='0', b='18', c='61', d='92', e='127', f='159', g='176', h='202', i='256', j='272').items()}

# ---------------- voice ----------------
vo, sr = sf.read(f'{S}/vo/final.wav', dtype='float32'); assert sr == SR
if vo.ndim == 2: vo = vo.mean(1)
voice = np.zeros(N, dtype=np.float32); voice[:min(N, len(vo))] = vo[:N]
# speech presence envelope for ducking (fast attack, slow release)
h = int(0.02 * SR); nb = N // h
rms = np.sqrt((voice[:nb * h].reshape(nb, h) ** 2).mean(1) + 1e-12); act = (20 * np.log10(rms) > -42).astype(np.float32)
env = np.zeros(nb, dtype=np.float32); v = 0.0
for i in range(nb):
    tgt = act[i]; v += (tgt - v) * (0.35 if tgt > v else 0.045); env[i] = v      # ~60 ms attack, ~0.45 s release: the score breathes in every pause
# look-ahead 120 ms so the music is already down when the word starts
env = np.maximum(env, np.roll(env, -6)); env = np.repeat(env, h); env = np.pad(env, (0, N - len(env)))
env = signal.sosfiltfilt(signal.butter(2, 6, fs=SR, output='sos'), env).clip(0, 1)

# ---------------- music ----------------
# (track, start_time, end_time, offset_in_track, fade_in, fade_out, gain_dB trim)
def at(k, d=0.0): return T(k) + d
# v3: scored entirely with the five trailer tracks supplied by the channel owner (music/user/*.mp3).
# Big musical moments are lined up with the picture: u1's build lands on "Kainat ruki hui NAHI hai", u4's swell on the title,
# on the CMB reveal and on the last open door, u1's final hit on the cliff-hanger.   (track, t0, t1, offset, fade_in, fade_out, trim_dB, bed_dB_offset)
U1, U2, U3, U4, U5 = 'u1_epic_action_intro', 'u2_action_synths_arcticfox', 'u3_shell_ghost_soundride', 'u4_dramatic_teaser', 'u5_fear_of_the_dark_soundride'
tBang = E('17') + 0.25
PLAN = [
 (U1, T('4') - 8.0,      at('12') + 0.4,          0.0, 0.6, 0.8,   0.0,  2.0),    # teaser: its first build hits on "…NAHI hai"
 (U2, at('12') - 0.25,   at('16') - 0.1,          0.0, 0.15, 0.25, -1.0,  2.0),    # montage of what is coming
 (U4, tBang - 2.0,       PART['b'] + 2.4,        30.0, 0.5, 2.4,   0.0,  0.0),    # rewind -> title (swell at 32 s = the bang)
 (U5, PART['b'] - 0.6,   PART['c'] + 1.5,         0.0, 2.0, 3.0,   0.0,  0.0),    # history: suspense
 (U3, PART['c'] - 1.0,   PART['c'] + 59.5,        0.0, 2.0, 2.5,   1.0, -1.5),    # the ayah and its last word: tension, held back
 (U3, PART['c'] + 57.0,  PART['d'] + 1.2,        20.0, 2.5, 2.5,   1.0, -1.0),
 (U1, PART['d'] - 1.0,   PART['e'] + 1.5,   88.0 - (at('116') - (PART['d'] - 1.0)), 2.0, 2.0, 0.0, -1.0),   # rewind; u1's 88 s lift lands on "udhed diya"
 (U3, PART['e'] - 1.0,   at('148') + 0.5,         0.0, 2.0, 1.0,   1.0,  0.0),    # the mystery hiss
 (U4, at('148') - 2.0,   PART['f'] + 1.5,        30.0, 1.0, 3.0,  -1.0,  0.0),    # "woh shor kainat ka tha"
 (U5, PART['f'] - 1.0,   PART['g'] + 1.5,        46.0, 2.5, 3.0,   0.0, -1.0),    # smoke and water
 (U1, PART['g'] - 1.0,   PART['h'] + 1.0,        10.0, 2.0, 2.5,   0.0, -1.0),    # the question, Madinah, the ayaat
 (U5, PART['h'] - 0.8,   at('243') + 1.5,         0.0, 1.5, 3.5,   0.0,  0.0),    # four doors
 (U4, at('243') - 2.0,   PART['i'] + 1.2,  32.0 - (at('249b') - (at('243') - 2.0)), 3.0, 3.0, -1.0, -1.5),   # the only door left; swell on Allahus-Samad
 (U2, PART['i'] - 1.0,   PART['j'] + 1.5,         4.0, 2.0, 3.0,  -1.0,  0.0),    # science today, the fortress falls, the summit
 (U1, PART['j'] - 1.0,   at('302') - 0.3,  108.0 - (at('299') - (PART['j'] - 1.0)), 2.5, 1.5, 0.0, -1.0),   # ending; u1's last hit = "Agli video mein…"
 (U3, E('302') + 0.6,    DUR,                    36.0, 1.5, 3.5,   0.0,  0.0),    # end screen
]
BED_LUFS, OPEN_LUFS = -27.0, -19.5          # music loudness under speech / in the clear (voice sits at -16)
# moments where the music cuts out completely for effect (start, length)
DROPS = [(T('4') - 0.34, 0.32), (T('8') - 0.05, E('8') - T('8') + 0.25), (T('16') - 0.2, E('16') - T('16') + 0.3), (E('17') - 0.12, 0.25),
         (T('158') - 0.3, 0.3), (T('302') - 0.35, E('302') - T('302') + 0.5)]
meter = pyln.Meter(SR)
music = np.zeros((N, 2), dtype=np.float32)
if '--nomusic' not in sys.argv:
    bedmap = np.full(N, BED_LUFS - OPEN_LUFS, dtype=np.float32)      # per-sample bed depth (dB below the open level)
    for name, t0, t1, off, fi, fo, trim, bedoff in PLAN:
        t0 = max(0.0, t0); t1 = min(DUR, t1)
        if t1 - t0 < 1: continue
        x, sr = sf.read(f'{S}/music/wav/{name}.wav', dtype='float32'); assert sr == SR
        a = int(max(0.0, off) * SR); n = int((t1 - t0) * SR)
        if a + n > len(x):                       # not enough material: start earlier in the track
            a = max(0, len(x) - n - int(4 * SR))
        seg = x[a:a + n].copy()
        if len(seg) < n: seg = np.pad(seg, ((0, n - len(seg)), (0, 0)))
        loud = meter.integrated_loudness(seg[: min(len(seg), 90 * SR)]) if len(seg) > SR else -30
        seg *= 10 ** ((OPEN_LUFS - loud + trim) / 20)
        e = np.ones(n, dtype=np.float32); nfi = int(fi * SR); nfo = int(fo * SR)
        e[:nfi] = np.sin(np.linspace(0, np.pi / 2, nfi)) ** 2; e[-nfo:] *= np.cos(np.linspace(0, np.pi / 2, nfo)) ** 2
        i0 = int(t0 * SR); music[i0:i0 + n] += seg * e[:, None]; bedmap[i0:i0 + n] = BED_LUFS - OPEN_LUFS + bedoff
        print(f'music {name:28s} {t0:7.1f}-{t1:7.1f}  track@{a/SR:6.1f}s  loud {loud:6.1f} LUFS')
    duck = 10 ** ((bedmap * env) / 20)                         # 0 dB in the clear -> bed depth under speech
    for ts, dl in DROPS:                                      # hard cut-outs with 25 ms ramps
        a0 = max(0, int(ts * SR)); b0 = min(N, int((ts + dl) * SR)); r = int(0.025 * SR)
        if b0 - a0 > 2 * r:
            duck[a0:a0 + r] *= np.linspace(1, 0, r); duck[a0 + r:b0 - r] = 0; duck[b0 - r:b0] *= np.linspace(0, 1, r)
    music *= duck[:, None]
    # carve a little room for the voice (2-4 kHz dip) and tame sub rumble
    for c in range(2):
        m = music[:, c]
        m = signal.sosfilt(signal.butter(2, 35, btype='high', fs=SR, output='sos'), m)
        b, a_ = signal.iirpeak(3000, 0.9, fs=SR); pk = signal.lfilter(b, a_, m); music[:, c] = (m - 0.35 * pk * env).astype(np.float32)

# ---------------- sfx ----------------
fx = np.zeros((N, 2), dtype=np.float32)
try: ev = json.load(open(f'{S}/audio/sfx.json'))
except Exception: ev = []
cnt = {}; recent = []; last_imp = -99.0
FX_TRIM = -3.0          # the whole effects bus sits a little under the voice
for k, e in enumerate(sorted(ev, key=lambda e: e['t'])):
    x, lvl = SFX.make(e['name'], e.get('dur'), seed=k)
    if x is None: print('unknown sfx', e['name']); continue
    g = 10 ** ((lvl + 20 * np.log10(max(0.05, min(2.0, e.get('gain', 1.0))))) / 20)
    # sfx that land on top of speech are pulled down a bit
    i0 = int(max(0, e['t']) * SR)
    if i0 >= N: continue
    under = float(env[min(N - 1, i0 + int(0.1 * SR))]); g *= 10 ** (-3.5 * under / 20)
    recent = [r for r in recent if e['t'] - r < 1.0]; dens = min(6.0, 1.5 * len(recent)); recent.append(e['t'])      # busy moments: each extra hit is quieter
    if e['name'] in ('impact', 'slam'):
        if e['t'] - last_imp < 6.0: dens += 5.0
        last_imp = e['t']
    g *= 10 ** ((FX_TRIM - dens) / 20)
    n = min(len(x), N - i0); fx[i0:i0 + n] += x[:n] * g; cnt[e['name']] = cnt.get(e['name'], 0) + 1
print('sfx events', sum(cnt.values()), cnt)

# ---------------- sum + master ----------------
mix = music + fx; mix[:, 0] += voice; mix[:, 1] += voice
mix = mix[:int(DUR * SR)]
tmp = f'{S}/audio/premaster.wav'; sf.write(tmp, mix, SR, subtype='FLOAT')
sf.write(f'{S}/audio/stem_music.wav', music[:int(DUR * SR)], SR, subtype='PCM_24'); sf.write(f'{S}/audio/stem_sfx.wav', fx[:int(DUR * SR)], SR, subtype='PCM_24')
out = f'{S}/audio/master.wav'
# gentle glue compression, then two-pass loudness normalisation to -14 LUFS / -1 dBTP
flt = 'acompressor=threshold=0.2:ratio=1.6:attack=20:release=250:makeup=1,alimiter=limit=0.87:level=disabled'
p1 = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', tmp, '-af', flt + ',loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
js = json.loads(p1[p1.rindex('{'):p1.rindex('}') + 1])
ln = f"loudnorm=I=-14:TP=-1.0:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true"
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', tmp, '-af', flt + ',' + ln, '-ar', '48000', '-c:a', 'pcm_s24le', out], check=True)
y, _ = sf.read(out); print('master', round(len(y) / SR, 2), 's  LUFS', round(meter.integrated_loudness(y), 2), ' peak dBFS', round(20 * np.log10(np.abs(y).max()), 2))
