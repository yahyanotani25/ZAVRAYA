"""Independent check of the finished voice-over: transcribe -> align to the spoken script -> report repeats / gaps / extras."""
import json, os, subprocess, sys
segs = [json.loads(l) for l in open('asr/final.jsonl') if l.strip().endswith('}')]
isl = [dict(i=k, s=s['start'], e=s['end'], words=s['words']) for k, s in enumerate(segs)]
json.dump(isl, open('asr/final_each.json', 'w'), ensure_ascii=False)
env = dict(os.environ, DP_IN='asr/final_each.json', DP_OUT='edit/dp_final.json')
print(subprocess.run([sys.executable, 'edit/dp_align.py'], env=env, capture_output=True, text=True).stdout.strip().splitlines()[-1])
D = json.load(open('edit/dp_final.json')); W = D['words']; R = D['runs']; lines = json.load(open('edit/spoken.json'))
print('asr words', len(W), 'runs', len(R))
back = []
for a, b in zip(R[:-1], R[1:]):
    if a['p1'] is None or b['p0'] is None: continue
    if b['p0'] < a['p1'] - 3: back.append((round(b['t0'], 1), a['l1'], b['l0'], ' '.join(w['w'] for w in W[b['w0']:b['w0'] + 6])))
print('BACKWARD JUMPS (possible repeats):', len(back))
for x in back: print('  ', x)
fw = [(round(b['t0'], 1), a['l1'], b['l0']) for a, b in zip(R[:-1], R[1:]) if a['p1'] is not None and b['p0'] is not None and b['p0'] > a['p1'] + 25]
print('FORWARD SKIPS (possible missing text):', fw)
cov = {}
for w in W:
    if w['line'] is not None: cov.setdefault(w['line'], set()).add(w['wi'])
miss = [(ln['key'], len(cov.get(ln['id'], ())), len(ln['text'].split()), ln['text'][:60]) for ln in lines if len(cov.get(ln['id'], ())) / len(ln['text'].split()) < 0.4]
print('LINES WITH <40% WORDS HEARD:', len(miss))
for m in miss: print('  ', m)
low = [(round(r['t0'], 1), r['nw'], r['match'], ' '.join(w['w'] for w in W[r['w0']:r['w0'] + 8])) for r in R if r['match'] < 0.6 and r['nw'] >= 3]
print('LOW-MATCH RUNS (extra / unclear speech):', low)
