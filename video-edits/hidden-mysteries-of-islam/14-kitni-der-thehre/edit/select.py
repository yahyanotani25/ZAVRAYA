"""Latest-take-wins selection over DP runs -> edit/keep_auto.json (kept word indices grouped into time-contiguous segments)."""
import json, sys
d = json.load(open('edit/dp.json')); words = d['words']; runs = d['runs']
lines = json.load(open('edit/spoken.json'))
kept = []; log = []
import os
OV = json.load(open('edit/overrides.json')) if os.path.exists('edit/overrides.json') else {}
DROP_ISL = set()
for a in OV.get('drop_islands', []):
    if isinstance(a, list): DROP_ISL.update(range(a[0], a[1] + 1))
    else: DROP_ISL.add(a)
DROP_W = set()
for isl_i, a, b in OV.get('drop_words', []):        # word indices inside an island (0-based, inclusive)
    ws_ = [w['k'] for w in words if w['isl'] == isl_i]
    DROP_W.update(ws_[a:b + 1])
KEEP_ISL = set(OV.get('force_keep_islands', []))
def lastpos():
    for k in reversed(kept):
        if words[k]['pos'] is not None: return words[k]['pos']
    return -1
for r in runs:
    ws = [k for k in range(r['w0'], r['w1'] + 1) if words[k]['isl'] not in DROP_ISL and k not in DROP_W]
    if not ws: continue
    pa = next((words[k]['pos'] for k in ws if words[k]['pos'] is not None), None)
    lp = lastpos()
    if pa is None or r['match'] < 0.5: log.append(('JUNK', r)); continue
    back = lp - pa
    if -60 <= back <= 2:            # continuation (or a small forward skip)
        kept.extend(ws); continue
    if back < -60:                  # big forward skip: only if substantial
        if r['nw'] >= 6 and r['match'] >= 0.8: kept.extend(ws); log.append(('SKIP', r, -back))
        else: log.append(('JUNK', r))
        continue
    # backward = retake
    if back > 300 or (back > 60 and r['nw'] < 6) or (r['nw'] < 3 and r['match'] < 0.85):
        log.append(('JUNK', r)); continue
    idx = next((i for i, k in enumerate(kept) if words[k]['pos'] is not None and words[k]['pos'] >= pa), len(kept))
    removed = kept[idx:]
    if removed: log.append(('CUT', r, len(removed), round(words[removed[-1]]['e'] - words[removed[0]]['s'], 1)))
    kept = kept[:idx]; kept.extend(ws)
# manual force-keep: whole islands that must stay (alignment could not place them)
if KEEP_ISL:
    ks0 = set(kept)
    for w in words:
        if w['isl'] in KEEP_ISL and w['k'] not in DROP_W: ks0.add(w['k'])
    kept = sorted(ks0)
# false starts: a short kept island whose words are immediately re-said at the start of the next kept island
def isl_words(i): return [k for k in kept if words[k]['isl'] == i]
order = []
for k in kept:
    if not order or order[-1] != words[k]['isl']: order.append(words[k]['isl'])
for a, b in zip(order[:-1], order[1:]):
    wa, wb = isl_words(a), isl_words(b)
    if len(wa) <= 4 and len(wb) > len(wa):
        sa = ''.join(words[k]['sk'] for k in wa); sb = ''.join(words[k]['sk'] for k in wb[:len(wa) + 1])
        if len(sa) >= 1 and sb.startswith(sa):
            kept = [k for k in kept if words[k]['isl'] != a]; log.append(('FALSESTART', a))
print('false starts dropped:', [l[1] for l in log if l[0] == 'FALSESTART'])
# snap partial islands to their natural edges (never leave 1-3 orphan words cut off inside a phrase)
isl_all = {}
for w in words: isl_all.setdefault(w['isl'], []).append(w['k'])
ks = set(kept); snapped = []
order = []
for k in kept:
    if not order or order[-1] != words[k]['isl']: order.append(words[k]['isl'])
for n_, i in enumerate(order):
    full = isl_all[i]; mine = [k for k in full if k in ks]
    if len(mine) == len(full) or not mine: continue
    lead = full[:full.index(mine[0])]; trail = full[full.index(mine[-1]) + 1:]
    if 0 < len(lead) <= 2:
        ks.update(lead); snapped.append((i, 'lead', ' '.join(words[k]['w'] for k in lead)))
    if 0 < len(trail) <= 3:
        nxt = order[n_ + 1] if n_ + 1 < len(order) else None
        nxt_sk = ''.join(words[k]['sk'] for k in isl_all[nxt] if k in ks)[:24] if nxt is not None else ''
        tr_sk = ''.join(words[k]['sk'] for k in trail)
        if not (tr_sk and nxt_sk.startswith(tr_sk)):        # not a phrase that is re-said right after
            ks.update(trail); snapped.append((i, 'trail', ' '.join(words[k]['w'] for k in trail)))
kept = [k for i in order for k in isl_all[i] if k in ks]
print('snapped:', snapped)
# segments contiguous in the source
segs = []; cur = None
for k in kept:
    if cur and k == cur['w1'] + 1: cur['w1'] = k
    else: cur = dict(w0=k, w1=k); segs.append(cur)
for s in segs:
    s['t0'] = words[s['w0']]['s']; s['t1'] = words[s['w1']]['e']; s['i0'] = words[s['w0']]['isl']; s['i1'] = words[s['w1']]['isl']
    s['text'] = ' '.join(words[k]['w'] for k in range(s['w0'], s['w1'] + 1))
    ls = [words[k]['line'] for k in range(s['w0'], s['w1'] + 1) if words[k]['line'] is not None]; s['l0'] = min(ls) if ls else -1; s['l1'] = max(ls) if ls else -1
json.dump(dict(kept=kept, segs=segs), open('edit/keep.json', 'w'), ensure_ascii=False)
tot = sum(s['t1'] - s['t0'] for s in segs)
print('kept words', len(kept), 'segments', len(segs), 'speech dur', round(tot, 1))
# line coverage
cov = {}
for k in kept:
    w = words[k]
    if w['line'] is not None: cov.setdefault(w['line'], set()).add(w['wi'])
miss = []
for ln in lines:
    n = len(ln['text'].split()); c = len(cov.get(ln['id'], ()))
    if c / n < 0.5: miss.append((ln['id'], c, n, ln['text'][:70]))
print('lines with <50% coverage:', len(miss))
print('   missing line keys:', [lines[m[0]]['key'] for m in miss if lines[m[0]]['id'] <= max(w['line'] or 0 for w in words)])
big = [l for l in log if l[0] == 'CUT' and l[3] > 45]
print('big truncations:', [(round(l[1]['t0'], 1), l[2], l[3]) for l in big])
print('junk runs:', [(round(l[1]['t0'],1), l[1]['nw']) for l in log if l[0] == 'JUNK'])
print('skips:', [(round(l[1]['t0'],1), l[2]) for l in log if l[0] == 'SKIP'])
if '-v' in sys.argv:
    for s in segs: print(f"{s['i0']}-{s['i1']} {s['t0']:.1f} | {s['text']}")
