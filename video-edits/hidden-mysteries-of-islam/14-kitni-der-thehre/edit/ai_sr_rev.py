"""Second worker for ai_sr.py: does the last pieces (in reverse) so two processes share the work. Writes work/sr/out_XX.wav only."""
import time, os, sys, json, numpy as np, soundfile as sf, torch
torch.set_num_threads(int(os.environ.get('NT', '2')))
from clearvoice import ClearVoice
x, SR = sf.read('vo/cut.wav', dtype='float32')
tl = json.load(open('edit/timeline.json'))
starts = sorted(c['d'] for c in tl['clips']); cuts = [0.0]; t = 60.0
while t < len(x) / SR - 20:
    b = min(starts, key=lambda s: abs(s - t)) - 0.03
    if b > cuts[-1] + 20: cuts.append(b)
    t += 60.0
cuts.append(len(x) / SR)
stop_at = int(sys.argv[1]) if len(sys.argv) > 1 else 7          # lowest piece index this worker handles
srm = ClearVoice(task='speech_super_resolution', model_names=['MossFormer2_SR_48K']); t0 = time.time()
for k in range(len(cuts) - 2, stop_at - 1, -1):
    a, b = cuts[k], cuts[k + 1]; i0, i1 = int(a * SR), int(b * SR); fi = f'work/sr/rin_{k:02d}.wav'; fo = f'work/sr/out_{k:02d}.wav'
    if os.path.exists(fo): continue
    sf.write(fi, x[i0:i1], SR, subtype='PCM_16')
    y = srm(input_path=fi, online_write=False); srm.write(y, output_path=fo + '.tmp.wav'); os.replace(fo + '.tmp.wav', fo)
    print(f'rev piece {k+1}/{len(cuts)-1} {a:.1f}-{b:.1f}s  elapsed {time.time()-t0:.0f}s', flush=True)
print('REV DONE', round(time.time() - t0), flush=True)
