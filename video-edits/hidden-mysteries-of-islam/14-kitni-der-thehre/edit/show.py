"""usage: show.py t0 t1  -> islands in [t0,t1] s with aligned script lines and kept flag"""
import json, sys
t0, t1 = float(sys.argv[1]), float(sys.argv[2])
D = json.load(open('edit/dp.json')); W = D['words']; kept = set(json.load(open('edit/keep.json'))['kept']); lines = json.load(open('edit/spoken.json'))
key = {l['id']: l['key'] for l in lines}
by = {}
for w in W: by.setdefault(w['isl'], []).append(w)
for i in sorted(by):
    ws = by[i]
    if ws[-1]['e'] < t0 or ws[0]['s'] > t1: continue
    ls = [w['line'] for w in ws if w['line'] is not None]; k = sum(1 for w in ws if w['k'] in kept)
    flag = 'K' if k == len(ws) else ('k%d/%d' % (k, len(ws)) if k else '·')
    rng = f"{key[min(ls)]}-{key[max(ls)]}" if ls else '--'
    print(f"{i:3d} {ws[0]['s']:7.1f} {flag:6s} [{rng:9s}] {' '.join(w['w'] for w in ws)[:86]}")
