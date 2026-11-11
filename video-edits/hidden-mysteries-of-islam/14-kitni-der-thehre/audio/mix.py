"""Final mix: processed voice-over + ducked music bed + synthesised SFX -> audio/master.wav (48k stereo, -14 LUFS, TP -1 dB).
usage: python3 audio/mix.py [--nomusic]"""
import json, sys, os, numpy as np, soundfile as sf, subprocess
from scipy import signal
import pyloudnorm as pyln
sys.path.insert(0, os.path.dirname(__file__))
import sfx as SFX

S = '/tmp/claude-0/-home-user-ZAVRAYA/11d60b1e-ec95-526d-bd06-3bd05d7e3343/scratchpad'
SR = 48000
V = f'{S}/v14'
cues = json.load(open(f'{S}/film14/cues.json'))
T = lambda k: cues['s'][k][0]
E = lambda k: cues['s'][k][1]
def WT(k, frag, nth=0):                      # start time of the word containing `frag` in spoken line k
    ws = cues['x'][k].split(' '); c = 0
    for i, w in enumerate(ws):
        if frag.lower() in w.lower():
            if c == nth: return cues['w'][k][min(i, len(cues['w'][k]) - 1)][0]
            c += 1
    raise KeyError((k, frag))
DUR = cues['dur']
N = int(DUR * SR) + SR
PART = {p: (0 if p == 'a' else T(k) - 0.35) for p, k in dict(a='0', b='38', c='72', d='108', e='155', f='206', g='258', h='311', i='336', j='353').items()}

# ---------------- voice ----------------
vo, sr = sf.read(f'{V}/vo/final.wav', dtype='float32'); assert sr == SR
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
# Scored with the five trailer tracks supplied by the channel owner (music/user/*.mp3). The big musical moments are lined up with the picture.
# (track, t0, t1, offset_in_track, fade_in, fade_out, trim_dB, bed_dB_offset)
U1, U2, U3, U4, U5 = 'u1_epic_action_intro', 'u2_action_synths_arcticfox', 'u3_shell_ghost_soundride', 'u4_dramatic_teaser', 'u5_fear_of_the_dark_soundride'
tTitle = E('37') + 0.44                       # title slam
tR309 = T('194') - 0.12; tR168 = T('317') - 0.1
def swell(t_hit, t_end, lead=2.0, trim=0.0, bed=0.0, fo=2.5): return (U4, t_hit - lead, t_end, 32.0 - lead, min(1.0, lead * 0.5), fo, trim, bed)   # u4's swell (32 s) lands on t_hit
t0d = PART['d'] + 0.3; t0i = PART['i'] - 0.5
PLAN = [
 (U1, T('3') - 8.0,        T('16') - 0.2,          0.0, 0.4, 0.5,   0.0,  2.0),   # teaser: u1's 8-second build hits on "Woh jhoot nahi bol raha."
 (U2, T('19') - 2.2,       T('32') - 0.2,          0.0, 0.2, 1.2,   0.0,  1.0),   # its opening hit = "Saal 2010"; the build carries the three promises
 (U5, T('32') - 0.6,       tTitle - 1.2,           0.0, 0.8, 1.2,   0.0,  0.0),   # the bet: suspense
 swell(tTitle, PART['b'] + 2.6, lead=2.0),                                          # title
 (U5, PART['b'] - 0.6,     T('57') + 1.0,         24.0, 2.0, 2.0,   0.0, -1.0),   # the ruined town, a hundred years, the first question
 (U3, T('57') - 0.6,       PART['c'] + 1.2,        0.0, 1.0, 2.5,   0.5, -0.5),   # the proof: three clocks in one place
 (U5, PART['c'] - 0.8,     T('85') - 0.3,         60.0, 2.0, 0.8,   0.0, -1.0),   # Newton, Einstein
 (U2, T('85') - 2.2,       T('100') + 1.0,         0.0, 0.2, 2.5,  -0.5,  0.0),   # opening hit = "Saal 1971"; builds as Mr. Clock flies round the world
 (U3, T('100') - 0.8,      PART['d'] + 1.2,       16.0, 1.5, 2.5,   0.5, -0.5),   # head and feet, the Earth's core
 (U1, t0d,                 T('139') + 0.8,  36.0 - (T('123') - t0d), 2.0, 2.0, 0.0, -1.0),   # the muon: u1 goes into full drive on "zinda kaise pohancha?"
 (U3, T('139') - 0.6,      T('143') + 1.5,        36.0, 1.5, 2.0,   0.0, -1.5),   # the fair note
 swell(T('145') - 0.1, PART['e'] + 1.2, lead=6.0, trim=-1.0, bed=-1.0, fo=3.0),      # ayah 22:47
 (U5, PART['e'] - 0.6,     T('177') - 0.2,         0.0, 2.0, 0.4,   0.0, -0.5),   # the cave, the coin, the bazaar
 (U3, T('180') - 0.5,      T('186') + 0.6,        34.0, 1.2, 1.5,   0.5, -1.0),   # ayah 18:25
 (U2, T('186') - 0.3,      tR309 - 0.4,            8.0, 1.2, 0.3,  -1.0, -1.0),   # the calculator
 swell(tR309, PART['f'] + 1.0, lead=0.6, trim=-1.0, bed=-1.0, fo=3.0),               # 309.2
 (U3, PART['f'] - 0.5,     T('223') + 1.2,         0.0, 1.5, 2.0,   0.5, -0.5),   # why? the operating table, no organ for time
 (U5, T('223') - 0.6,      T('253') + 0.8,        24.0, 2.0, 2.0,   0.0, -1.0),   # the film reel, the model, the hadith
 (U3, PART['g'] + 0.2,     T('268') - 0.2,         4.0, 1.0, 1.0,   0.5, -1.0),   # told in the past tense
 (U5, T('273') - 0.3,      T('279') - 0.25,       60.0, 1.5, 0.3,  -1.0, -1.0),   # "what is he asking for?"
 swell(T('280') - 0.0, T('296') + 0.8, lead=1.2, trim=0.0, bed=-0.5),                # the third time (white plain)
 (U5, T('296') - 0.4,      T('301') - 0.45,      100.0, 1.0, 0.3,  -1.0, -1.0),   # corrected, corrected...
 (U3, T('304') - 0.5,      PART['h'] + 1.0,        8.0, 1.5, 2.0,   0.5, -1.0),   # the shrinking count
 (U2, PART['h'] - 0.3,     tR168 - 0.4,            8.0, 1.5, 0.3,  -1.0, -1.0),   # the calculator again
 (U1, tR168 - 0.1,         T('326') - 0.35, 24.0 - (WT('318', 'ek') - (tR168 - 0.1)), 0.3, 0.3, -0.5, -1.0),   # a u1 hit on "ek ghanta ektalees minute"
 (U3, T('327') - 0.3,      T('334') + 0.6,        20.0, 1.2, 1.5,   0.5, -0.5),   # the exam paper
 (U5, T('334') - 0.5,      PART['i'] + 0.8,       36.0, 1.5, 2.0,  -1.0, -1.5),   # 23:115
 (U1, t0i,                 T('343') - 0.25, 88.0 - (WT('336', 'achhi') - t0i), 0.6, 0.4, 0.0, -1.0),   # the good news: u1's lift
 (U3, T('343') - 0.2,      T('347') - 1.6,        34.0, 0.6, 1.2,   0.5, -0.5),   # length vs weight
 swell(T('347') - 0.1, T('353') - 0.4, lead=1.8, trim=0.0, bed=-1.0, fo=1.2),        # Surah Al-'Asr
 (U1, T('358') - 4.0,      T('362') + 1.0,  108.0 - 4.0, 0.05, 2.0, 0.0,  0.0),   # u1's last hit = the timer
 (U5, T('362') + 0.3,      T('372') - 0.4,         0.0, 2.0, 0.4,  -2.0, -2.0),   # the heartbeat, Hasan Basri
 swell(T('373') - 0.05, T('385') + 1.0, lead=0.4, trim=0.0, bed=-0.5, fo=3.0),       # "Aap KHUD waqt hain." -> the next video
 (U3, E('385') - 0.8,      DUR,                   36.0, 1.5, 3.5,   0.0,  0.0),   # end screen
]
BED_LUFS, OPEN_LUFS = -27.0, -19.5          # music loudness under speech / in the clear (voice sits at -16)
# moments where the music cuts out completely for effect (start, length)
DROPS = [(T('3') - 0.32, 0.28), (T('16') - 0.2, E('18') - T('16') + 0.6), (WT('84', 'Nahi') - 0.35, 0.3), (T('177') - 0.25, E('179') - T('177') + 0.5),
         (tR309 - 0.5, 0.45), (T('257') - 0.3, E('257') - T('257') + 0.9), (T('268') - 0.2, T('273') - T('268')), (T('279') - 0.25, E('279') - T('279') + 0.7),
         (T('301') - 0.45, E('303') - T('301') + 1.3), (tR168 - 0.5, 0.45), (T('326') - 0.35, E('326') - T('326') + 0.6), (T('353') - 0.4, T('358') - T('353') + 0.3),
         (T('372') - 0.4, T('373') - T('372') + 0.3)]
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
try: ev = json.load(open(f'{V}/audio/sfx.json'))
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
tmp = f'{V}/audio/premaster.wav'; sf.write(tmp, mix, SR, subtype='FLOAT')
sf.write(f'{V}/audio/stem_music.wav', music[:int(DUR * SR)], SR, subtype='PCM_24'); sf.write(f'{V}/audio/stem_sfx.wav', fx[:int(DUR * SR)], SR, subtype='PCM_24')
out = f'{V}/audio/master.wav'
# gentle glue compression, then two-pass loudness normalisation to -14 LUFS / -1 dBTP
flt = 'acompressor=threshold=0.2:ratio=1.6:attack=20:release=250:makeup=1,alimiter=limit=0.87:level=disabled'
p1 = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', tmp, '-af', flt + ',loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
js = json.loads(p1[p1.rindex('{'):p1.rindex('}') + 1])
ln = f"loudnorm=I=-14:TP=-1.0:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true"
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', tmp, '-af', flt + ',' + ln, '-ar', '48000', '-c:a', 'pcm_s24le', out], check=True)
y, _ = sf.read(out); print('master', round(len(y) / SR, 2), 's  LUFS', round(meter.integrated_loudness(y), 2), ' peak dBFS', round(20 * np.log10(np.abs(y).max()), 2))
