"""edit/timeline.json (+ spoken.json) -> film/cues.json (real voice timings per line / per script word) and out/subtitles_roman_urdu.srt"""
import json, os
tl = json.load(open('edit/timeline.json')); lines = json.load(open('edit/spoken.json'))
END_SCREEN = 14.0
# second source for word timings: the verification transcript of the finished voice-over (already in final time)
fin = {}
if os.path.exists('edit/dp_final.json'):
    for w in json.load(open('edit/dp_final.json'))['words']:
        if w['line'] is None: continue
        a = fin.get((w['line'], w['wi'])); fin[(w['line'], w['wi'])] = [min(a[0], w['s']), max(a[1], w['e'])] if a else [w['s'], w['e']]
by = {}
for w in tl['words']:
    if w['line'] is None: continue
    by.setdefault(w['line'], []).append(w)
cues = {'s': {}, 'w': {}, 'x': {ln['key']: ln['text'] for ln in lines}, 'provisional': False}
prev_end = 0.3; unspoken = []; order_issues = []
for ln in lines:
    ws = by.get(ln['id'], []); n = len(ln['text'].split())
    if not ws:
        cues['s'][ln['key']] = [round(prev_end, 3), round(prev_end + 0.01, 3)]; cues['w'][ln['key']] = [[round(prev_end, 3), round(prev_end + 0.01, 3)]] * n; unspoken.append(ln['key']); continue
    s = min(w['s'] for w in ws); e = max(w['e'] for w in ws)
    if s < prev_end - 0.25: order_issues.append((ln['key'], round(s, 2), round(prev_end, 2)))
    known = {}
    for w in ws:
        a = known.get(w['wi']); known[w['wi']] = [min(a[0], w['s']), max(a[1], w['e'])] if a else [w['s'], w['e']]
    for i in range(n):                                   # words the per-phrase transcript missed: take them from the final transcript
        f = fin.get((ln['id'], i))
        if i not in known and f and s - 0.3 <= f[0] <= e + 0.3: known[i] = [max(s, f[0]), min(e, max(f[1], f[0] + 0.05))]
    # fill missing script words by interpolation between known neighbours
    out = [None] * n
    for i in range(n):
        if i in known: out[i] = known[i]
    idx = [i for i in range(n) if out[i] is not None]
    for i in range(n):
        if out[i] is not None: continue
        lo = max([j for j in idx if j < i], default=None); hi = min([j for j in idx if j > i], default=None)
        t0 = out[lo][1] if lo is not None else s; t1 = out[hi][0] if hi is not None else e
        a = lo if lo is not None else -1; b = hi if hi is not None else n
        f0 = (i - a - 0.0) / (b - a) if b > a else 0; f0 = max(0.0, (i - a - 1) / max(1, b - a - 1)) if (b - a - 1) > 0 else 0
        seg = (t1 - t0) / max(1, b - a - 1)
        out[i] = [t0 + seg * (i - a - 1), t0 + seg * (i - a)]
    # enforce monotonic word starts
    for i in range(1, n):
        if out[i][0] < out[i - 1][0]: out[i][0] = out[i - 1][0]
    cues['s'][ln['key']] = [round(s, 3), round(e, 3)]; cues['w'][ln['key']] = [[round(a, 3), round(b, 3)] for a, b in out]
    prev_end = e
cues['dur'] = round(tl['dur'] + END_SCREEN, 2); cues['vo_dur'] = tl['dur']
json.dump(cues, open('../film14/cues.json', 'w'))
print('lines', len(lines), 'unspoken', unspoken, 'order issues', order_issues[:10], 'film dur', cues['dur'], f"({cues['dur']/60:.2f} min)")
# SRT (Roman Urdu), merging very short lines
def ts(t): h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60; return f"{h:02d}:{m:02d}:{int(s):02d},{int((s % 1) * 1000):03d}"
os.makedirs('out', exist_ok=True); n = 0; rows = []
for ln in lines:
    s, e = cues['s'][ln['key']]
    if e - s < 0.05: continue
    if rows and (s - rows[-1][1] < 0.25) and len(rows[-1][2]) + len(ln['text']) < 70 and (e - rows[-1][0]) < 6: rows[-1][1] = e; rows[-1][2] += ' ' + ln['text']
    else: rows.append([s, e, ln['text']])
with open('out/subtitles_roman_urdu.srt', 'w') as f:
    for i, (s, e, txt) in enumerate(rows): f.write(f"{i+1}\n{ts(s)} --> {ts(min(e + 0.15, rows[i+1][0] - 0.02) if i + 1 < len(rows) else e + 0.15)}\n{txt}\n\n")
print('srt rows', len(rows))
