"""Cut the chosen takes out of the raw recording and join them with natural pauses.
in : edit/keep.json (kept word ids), edit/dp.json (words with source times + script line), edit/islands.json, vo/raw48.wav
out: vo/cut.wav (48k mono, level-matched, un-processed), edit/timeline.json (clips with source/dest times + per-word dest times)"""
import json, re, numpy as np, soundfile as sf

x, SR = sf.read('vo/raw48.wav', dtype='float32')
db = np.load('edit/db5ms.npy'); HOP = 0.005                      # 5 ms energy track (band-limited), from vad.py
isl = {r['i']: r for r in json.load(open('edit/islands.json'))}
D = json.load(open('edit/dp.json')); W = D['words']
kept = json.load(open('edit/keep.json'))['kept']
lines = json.load(open('edit/spoken.json'))
keyset = set(kept)

def emin(t0, t1):
    """time of the energy minimum in [t0, t1] and its level"""
    a = max(0, int(t0 / HOP)); b = min(len(db) - 1, int(t1 / HOP)); k = a + int(np.argmin(db[a:b + 1])); return k * HOP + 0.0125, float(db[k])
def level(t0, t1):
    a = int(t0 * SR); b = int(t1 * SR); s = x[a:b]; h = int(0.02 * SR); n = len(s) // h
    if n < 2: return -40.0
    r = 20 * np.log10(np.sqrt((s[:n * h].reshape(n, h) ** 2).mean(1)) + 1e-9); r = r[r > r.max() - 22]
    return float(np.median(r))

# ---- clips: runs of kept words that are consecutive in the source and inside one island ----
clips = []
for k in kept:
    w = W[k]
    if clips and clips[-1]['w1'] == k - 1 and clips[-1]['isl'] == w['isl']: clips[-1]['w1'] = k
    else: clips.append(dict(isl=w['isl'], w0=k, w1=k))
warn = []
for c in clips:
    I = isl[c['isl']]; iw = [w['k'] for w in W if w['isl'] == c['isl']]
    c['head'] = (c['w0'] == iw[0]); c['tail'] = (c['w1'] == iw[-1])
    w0, w1 = W[c['w0']], W[c['w1']]
    if c['head']: c['s'] = max(0.0, I['s'] - 0.045); c['fi'] = 0.012
    else:
        prev_e = W[c['w0'] - 1]['e']                              # boundary with the (dropped) previous word
        t, lv = emin(min(prev_e, w0['s']) - 0.07, w0['s'] + 0.05); c['s'] = t - 0.006; c['fi'] = 0.008
        if lv > -38: warn.append(('mid-island IN not silent', c['isl'], round(c['s'], 2), round(lv, 1), w0['w']))
    if c['tail']: c['e'] = I['e'] + 0.06; c['fo'] = 0.04
    else:
        nxt_s = W[c['w1'] + 1]['s']
        t, lv = emin(w1['e'] - 0.05, max(nxt_s, w1['e']) + 0.07); c['e'] = t + 0.006; c['fo'] = 0.010
        if lv > -38:                                             # words run together: let the last sound decay instead of clipping it
            c['fo'] = 0.075; c['e'] = t + 0.03
            warn.append(('mid-island OUT not silent (long fade)', c['isl'], round(c['e'], 2), round(lv, 1), w1['w']))
    c['lvl'] = level(c['s'], c['e'])

# ---- pauses between clips ----
def line_of(k, last=False):
    rng = range(k, -1, -1) if last else range(k, len(W))
    for j in rng:
        if W[j]['line'] is not None: return W[j]['line']
    return None
PART_GAP = 1.15; TITLE_GAP = 3.2
for a, b in zip(clips[:-1], clips[1:]):
    la, lb = line_of(a['w1'], True), line_of(b['w0'])
    natural = b['s'] - a['e'] if (b['w0'] == a['w1'] + 1) else None           # adjacent in the source?
    txt = lines[la]['text'].strip() if la is not None else ''
    newline = (la != lb)
    if newline and lb is not None and la is not None and lines[lb]['part'] != lines[la]['part']: gap = PART_GAP
    elif newline and re.search(r'[.?!]["”]?$', txt): gap = 0.46
    elif newline and re.search(r'(\.\.\.|…|:)["”]?$', txt): gap = 0.34
    elif newline: gap = 0.26
    else: gap = 0.16
    pads = (0.06 if a['tail'] else 0.0) + (0.045 if b['head'] else 0.0)        # room tone already inside the clips
    if natural is not None:
        true = natural + pads
        # keep the speaker's own pause, but never dead air: clamp into a sensible window around the target
        gap = float(np.clip(true, max(0.10, gap * 0.55), max(0.62, gap * 1.5))) if newline else float(np.clip(true, 0.07, 0.42))
    if la is not None and lines[la]['key'] == '17' and newline: gap = TITLE_GAP   # room for the title sting
    a['pause'] = round(gap, 3); a['gap'] = round(max(0.012, gap - pads), 3)
clips[-1]['gap'] = 0.0

# ---- level matching (gentle, toward the median) ----
med = float(np.median([c['lvl'] for c in clips if (c['e'] - c['s']) > 0.6]))
for c in clips: c['gain_db'] = float(np.clip(med - c['lvl'], -4.0, 4.0)) * 0.8 if (c['e'] - c['s']) > 0.5 else 0.0
# smooth gains so neighbours don't jump
g = np.array([c['gain_db'] for c in clips]); gs = np.convolve(np.pad(g, 1, mode='edge'), [0.25, 0.5, 0.25], mode='valid')
for c, v in zip(clips, gs): c['gain_db'] = round(float(v), 2)

# ---- room tone for the joins (quietest 1.5 s of the recording, looped) ----
win = int(1.5 / HOP); cs = np.cumsum(np.insert(db, 0, 0)); avg = (cs[win:] - cs[:-win]) / win; q = int(np.argmin(avg)); tone = x[int(q * HOP * SR): int((q * HOP + 1.5) * SR)].copy()
tone *= np.hanning(len(tone)) * 0.9 + 0.1
def room(n):
    reps = int(np.ceil(n / len(tone))) + 1; r = np.tile(tone, reps)[:n]; return r * 0.7

out = [np.zeros(int(0.35 * SR), dtype=np.float32)]; pos = 0.35; tl = []
for c in clips:
    a = int(c['s'] * SR); b = int(c['e'] * SR); seg = x[a:b].copy() * (10 ** (c['gain_db'] / 20))
    nfi = max(8, int(c['fi'] * SR)); nfo = max(8, int(c['fo'] * SR))
    seg[:nfi] *= np.sin(np.linspace(0, np.pi / 2, nfi)) ** 2; seg[-nfo:] *= np.cos(np.linspace(0, np.pi / 2, nfo)) ** 2
    c['d'] = round(pos, 4); out.append(seg); pos += len(seg) / SR
    ng = int(c['gap'] * SR); out.append(room(ng).astype(np.float32)); pos += ng / SR
    tl.append(c)
y = np.concatenate(out + [np.zeros(int(0.5 * SR), dtype=np.float32)])
sf.write('vo/cut.wav', y, SR, subtype='PCM_24')
# per-word destination times
words_out = []
for c in clips:
    for k in range(c['w0'], c['w1'] + 1):
        w = W[k]; words_out.append(dict(k=k, w=w['w'], line=w['line'], wi=w['wi'], s=round(c['d'] + max(0, w['s'] - c['s']), 3), e=round(c['d'] + max(0.02, min(w['e'], c['e']) - c['s']), 3)))
json.dump(dict(clips=tl, words=words_out, dur=round(len(y) / SR, 3)), open('edit/timeline.json', 'w'), ensure_ascii=False)
print(f"clips {len(clips)}  duration {len(y)/SR:.1f}s ({len(y)/SR/60:.2f} min)  median level {med:.1f} dB  joins {sum(1 for a,b in zip(clips[:-1],clips[1:]) if b['w0']!=a['w1']+1)}")
print('gain range dB', round(min(c['gain_db'] for c in clips), 1), round(max(c['gain_db'] for c in clips), 1))
for wn in warn: print('WARN', wn)
