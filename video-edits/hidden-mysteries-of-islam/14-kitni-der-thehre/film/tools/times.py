#!/usr/bin/env python3
# usage: times.py <key[:frac]> ...  -> prints film times (from cues.json) for the given cue keys, e.g. 3:0.5 = middle of line 3, 3e = its end
import json, sys
c = json.load(open(sys.argv[1])); out = []
for a in sys.argv[2:]:
    k, _, f = a.partition(':'); end = k.endswith('e'); k = k.rstrip('e'); s, e = c['s'][k]
    out.append(e if end else s + (e - s) * float(f or 0))
print(' '.join(f'{t:.2f}' for t in out))
