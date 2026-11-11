"""Global char-level DP alignment (with restarts/jumps) of ASR word stream to the spoken script.
-> edit/dp.json : words [{k, isl, s, e, w, pos(script char), line, wi}], runs [{w0, w1, t0, t1, p0, p1, match}]"""
import json, re, numpy as np
from scipy.ndimage import maximum_filter1d
import importlib.util, sys
spec = importlib.util.spec_from_file_location('al', 'edit/align_sk.py')
U = {'ب':'b','پ':'p','ت':'t','ط':'t','ٹ':'t','ث':'s','س':'s','ص':'s','ج':'j','چ':'c','خ':'k','د':'d','ڈ':'d','ذ':'z','ز':'z','ض':'z','ظ':'z','ژ':'z',
     'ر':'r','ڑ':'r','ش':'s','غ':'g','ف':'f','ق':'k','ک':'k','ك':'k','گ':'g','ل':'l','م':'m','ن':'n','ں':'n'}
def sk_urdu(w):
    out = []
    for ch in w:
        if ch.isdigit(): out.append(str(int(ch))); continue      # numbers written as digits match the script's digits
        c = U.get(ch)
        if c and (not out or out[-1] != c): out.append(c)
    return ''.join(out)
def sk_roman(w):
    w = re.sub(r"[^a-z0-9]", "", w.lower())
    for a, b in (('sh','s'),('ch','c'),('kh','k'),('gh','g'),('ph','p'),('th','t'),('dh','d'),('bh','b'),('jh','j'),('q','k'),('x','ks')): w = w.replace(a, b)
    w = re.sub(r'[aeiouhwvy]', '', w)
    return re.sub(r'([a-z])\1+', r'\1', w)

lines = json.load(open('edit/spoken.json'))
S = []; s_line = []; s_wi = []
for ln in lines:
    for wi, w in enumerate(ln['text'].split()):
        for ch in sk_roman(w): S.append(ch); s_line.append(ln['id']); s_wi.append(wi)
M = len(S); Sarr = np.frombuffer(''.join(S).encode(), dtype=np.uint8)

import os
isl = json.load(open(os.environ.get('DP_IN', 'asr/each.json')))
words = []; O = []; o_word = []; o_wstart = []; o_istart = []
for r in isl:
    first = True
    for w in r['words']:
        k = len(words); sk = sk_urdu(w['w'])
        words.append(dict(k=k, isl=r['i'], s=w['s'], e=w['e'], w=w['w'], sk=sk))
        for ci, ch in enumerate(sk):
            O.append(ch); o_word.append(k); o_wstart.append(ci == 0); o_istart.append(ci == 0 and first)
        if sk: first = False
N = len(O); Oarr = np.frombuffer(''.join(O).encode(), dtype=np.uint8)
print('script chars', M, 'asr chars', N, 'asr words', len(words))

MATCH, MIS, GAP_O, GAP_S, J_ISL, J_WORD = 2.0, -1.3, -1.2, -1.0, 5.0, 11.0
WIN = 420
Dall = np.zeros((N, M), dtype=np.float32)
bt_type = np.zeros((N, M), dtype=np.int8)      # 0 diag 1 ins 2 jump
bt_del = np.zeros((N, M), dtype=np.int16)      # source column before script-skips
bt_jump = np.zeros(N, dtype=np.int32)
prev = np.zeros(M, dtype=np.float32)
jidx = np.arange(M, dtype=np.float32)
for i in range(N):
    sc = np.where(Sarr == Oarr[i], MATCH, MIS).astype(np.float32)
    diag = np.empty(M, dtype=np.float32); diag[0] = sc[0] if i == 0 else -1e9; diag[1:] = prev[:-1] + sc[1:]
    ins = prev + GAP_O
    cand = diag; typ = np.zeros(M, dtype=np.int8)
    m = ins > cand; cand = np.where(m, ins, cand); typ[m] = 1
    if o_wstart[i]:
        if i == 0: jv = np.full(M, float(prev.max()), dtype=np.float32) + sc
        else: jv = maximum_filter1d(prev, size=2 * WIN + 1, mode='constant', cval=-1e9) - (J_ISL if o_istart[i] else J_WORD) + sc
        m = jv > cand; cand = np.where(m, jv, cand); typ[m] = 2
    # script skips: D[j] = max_k<=j cand[k] - |GAP_S|*(j-k)
    x = cand - GAP_S * jidx   # cand[k] + 1.0*k
    run = np.maximum.accumulate(x)
    src = np.zeros(M, dtype=np.int32)
    isnew = x >= run; src = np.maximum.accumulate(np.where(isnew, np.arange(M), 0))
    cur = run + GAP_S * jidx
    bt_type[i] = typ; bt_del[i] = src.astype(np.int16)
    prev = cur; Dall[i] = cur
# traceback
j = int(prev.argmax()); i = N - 1
pos = [None] * N; jumps = []
while i >= 0:
    k = int(bt_del[i, j])          # column where ASR char i was actually placed
    t = int(bt_type[i, k])
    if t == 0: pos[i] = k; j = k - 1; i -= 1
    elif t == 1: pos[i] = None; j = k; i -= 1
    else:
        pos[i] = k; jumps.append(i)
        if i == 0: j = 0
        else:
            lo = max(0, k - WIN); hi = min(M, k + WIN + 1); j = lo + int(Dall[i - 1][lo:hi].argmax())
        i -= 1
    if j < 0: j = 0
jumps = sorted(jumps)
# per word: first matched char pos
wpos = {}
for i in range(N):
    k = o_word[i]
    if pos[i] is not None and k not in wpos: wpos[k] = pos[i]
wmatch = {}
for i in range(N):
    k = o_word[i]; ok = pos[i] is not None and S[pos[i]] == O[i]
    a, b = wmatch.get(k, (0, 0)); wmatch[k] = (a + (1 if ok else 0), b + 1)
jump_words = set(o_word[i] for i in jumps)
runs = []; cur = None
for w in words:
    k = w['k']; w['pos'] = wpos.get(k); mm = wmatch.get(k, (0, 0)); w['m'] = mm[0]; w['n'] = mm[1]
    if w['pos'] is not None: w['line'] = s_line[w['pos']]; w['wi'] = s_wi[w['pos']]
    else: w['line'] = None; w['wi'] = None
    if cur is None or k in jump_words:
        cur = dict(w0=k, w1=k, t0=w['s']); runs.append(cur)
    cur['w1'] = k; cur['t1'] = w['e']
for r in runs:
    ws = words[r['w0']:r['w1'] + 1]; ps = [w['pos'] for w in ws if w['pos'] is not None]
    r['p0'] = min(ps) if ps else None; r['p1'] = max(ps) if ps else None
    r['match'] = round(sum(w['m'] for w in ws) / max(1, sum(w['n'] for w in ws)), 2)
    r['nw'] = len(ws)
    ls = [w['line'] for w in ws if w['line'] is not None]; r['l0'] = min(ls) if ls else None; r['l1'] = max(ls) if ls else None
json.dump(dict(words=words, runs=runs, M=M, s_line=s_line, s_wi=s_wi), open(os.environ.get('DP_OUT', 'edit/dp.json'), 'w'), ensure_ascii=False)
print('runs', len(runs), 'jumps', len(jumps), 'score', float(prev.max()))
