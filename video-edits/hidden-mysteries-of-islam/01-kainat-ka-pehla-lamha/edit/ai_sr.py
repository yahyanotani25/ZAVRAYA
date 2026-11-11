"""vo/cut.wav -> vo/ai_sr.wav : neural bandwidth extension (ClearerVoice MossFormer2_SR_48K), processed in ~60 s pieces cut at pauses."""
import time, os, json, numpy as np, soundfile as sf, torch
torch.set_num_threads(int(os.environ.get('NT', '4')))
from clearvoice import ClearVoice
x, SR = sf.read('vo/cut.wav', dtype='float32')
tl = json.load(open('edit/timeline.json'))
# piece boundaries: clip starts nearest to every 60 s (always inside a pause)
starts = sorted(c['d'] for c in tl['clips']); cuts = [0.0]; t = 60.0
while t < len(x) / SR - 20:
    b = min(starts, key=lambda s: abs(s - t)) - 0.03
    if b > cuts[-1] + 20: cuts.append(b)
    t += 60.0
cuts.append(len(x) / SR)
os.makedirs('work/sr', exist_ok=True)
srm = ClearVoice(task='speech_super_resolution', model_names=['MossFormer2_SR_48K'])
out = np.zeros(len(x), dtype='float32'); t0 = time.time()
for k, (a, b) in enumerate(zip(cuts[:-1], cuts[1:])):
    i0, i1 = int(a * SR), int(b * SR); fi = f'work/sr/in_{k:02d}.wav'; fo = f'work/sr/out_{k:02d}.wav'
    if not os.path.exists(fo):
        sf.write(fi, x[i0:i1], SR, subtype='PCM_16')
        y = srm(input_path=fi, online_write=False); srm.write(y, output_path=fo)
    y, sr2 = sf.read(fo, dtype='float32'); assert sr2 == SR
    if y.ndim == 2: y = y.mean(1)
    n = min(len(y), i1 - i0); out[i0:i0 + n] = y[:n]
    print(f'piece {k+1}/{len(cuts)-1} {a:.1f}-{b:.1f}s  elapsed {time.time()-t0:.0f}s', flush=True)
sf.write('vo/ai_sr.wav', out, SR, subtype='PCM_24'); print('SR DONE', round(time.time() - t0), flush=True)
