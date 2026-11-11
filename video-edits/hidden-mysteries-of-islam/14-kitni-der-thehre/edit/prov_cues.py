"""Provisional cues (before the real voice timings exist): spoken.json / script.json -> ../film14/cues.json at ~180 wpm."""
import json, os
src = 'edit/spoken.json' if os.path.exists('edit/spoken.json') else 'edit/script.json'
L = json.load(open(src)); cues = {'s': {}, 'w': {}, 'x': {}, 'provisional': True}; t = 0.35; part = None
for ln in L:
    key = ln.get('key', str(ln['id'])); txt = ln['text']; ws = txt.split(); n = len(ws)
    if part is not None and ln['part'] != part: t += 0.9
    part = ln['part']
    d = max(0.5, n * 0.33); st = d / n
    cues['x'][key] = txt; cues['s'][key] = [round(t, 3), round(t + d, 3)]; cues['w'][key] = [[round(t + i * st, 3), round(t + (i + 1) * st, 3)] for i in range(n)]
    e = txt.rstrip('"”').rstrip()
    t += d + (0.55 if e.endswith(('...', '…', ':')) else 0.42 if e.endswith(('.', '?', '!')) else 0.28)
cues['vo_dur'] = round(t, 2); cues['dur'] = round(t + 14.0, 2)
json.dump(cues, open('../film14/cues.json', 'w')); print(src, len(L), 'lines; vo', cues['vo_dur'], 'film', cues['dur'])
