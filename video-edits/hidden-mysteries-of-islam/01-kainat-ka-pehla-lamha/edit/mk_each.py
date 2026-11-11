"""Merge the per-island transcripts (asr/each_*.jsonl) into asr/each.json (list ordered by island index)."""
import json, glob
rows = {}
for f in sorted(glob.glob('asr/each_*.jsonl')):
    for l in open(f):
        l = l.strip()
        if not l.endswith('}'): continue
        try: r = json.loads(l)
        except Exception: continue
        rows[r['i']] = r
out = [rows[k] for k in sorted(rows)]
json.dump(out, open('asr/each.json', 'w'), ensure_ascii=False)
print('islands', len(out))
