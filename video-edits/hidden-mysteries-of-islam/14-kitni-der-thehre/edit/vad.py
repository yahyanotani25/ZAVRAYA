"""Energy VAD -> speech islands (original-time), saved to edit/islands.json"""
import numpy as np, soundfile as sf, json
from scipy.signal import butter, sosfiltfilt
x, sr = sf.read('vo/raw48.wav', dtype='float32')
sos = butter(4, [100, 7000], btype='band', fs=sr, output='sos')
y = sosfiltfilt(sos, x).astype('float32')
hop = int(0.005 * sr); win = int(0.020 * sr)
n = (len(y) - win) // hop
idx = np.arange(n)[:, None] * hop + np.arange(win)[None, :]
# chunked rms to limit memory
db = np.empty(n, dtype='float32')
for a in range(0, n, 20000):
    seg = y[idx[a:a+20000]]
    db[a:a+20000] = 10 * np.log10((seg ** 2).mean(1) + 1e-12)
np.save('edit/db5ms.npy', db)
print('pct', {p: round(float(np.percentile(db, p)), 1) for p in (5, 20, 40, 50, 60, 80, 95)})
TH_ON, TH_OFF = -46.0, -52.0
MIN_SIL, MIN_SP = 0.20, 0.06
speech = np.zeros(n, bool); on = False
for i in range(n):
    if on:
        if db[i] < TH_OFF: on = False
    else:
        if db[i] > TH_ON: on = True
    speech[i] = on
# close gaps shorter than MIN_SIL
t = lambda i: i * hop / sr
runs = []; i = 0
while i < n:
    if speech[i]:
        j = i
        while j < n and speech[j]: j += 1
        runs.append([i, j]); i = j
    else: i += 1
merged = []
for r in runs:
    if merged and t(r[0]) - t(merged[-1][1]) < MIN_SIL: merged[-1][1] = r[1]
    else: merged.append(r)
isl = [dict(i=k, s=round(t(a), 3), e=round(t(b) + 0.02, 3), peak=round(float(db[a:b].max()), 1)) for k, (a, b) in enumerate([m for m in merged if t(m[1]) - t(m[0]) >= MIN_SP])]
for k, r in enumerate(isl): r['i'] = k
json.dump(isl, open('edit/islands.json', 'w'))
d = np.array([r['e'] - r['s'] for r in isl]); g = np.array([isl[k+1]['s'] - isl[k]['e'] for k in range(len(isl)-1)])
print('islands', len(isl), 'speech total', round(float(d.sum()), 1), 'dur pct', np.percentile(d, [5, 25, 50, 75, 95]).round(2), 'gap pct', np.percentile(g, [5, 25, 50, 75, 95]).round(2))
print('quiet islands (peak<-35):', sum(1 for r in isl if r['peak'] < -35))
