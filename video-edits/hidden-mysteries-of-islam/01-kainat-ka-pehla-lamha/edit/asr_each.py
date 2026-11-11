"""Transcribe every speech island on its own (no cross-island bias). usage: asr_each.py <k> <n>  -> asr/each_<k>.jsonl"""
import json, sys, numpy as np, soundfile as sf, time
from faster_whisper import WhisperModel
k, n = int(sys.argv[1]), int(sys.argv[2])
x, sr = sf.read('vo/raw16.wav', dtype='float32')
isl = [r for r in json.load(open('edit/islands.json')) if r['e'] - r['s'] >= 0.22 and r['i'] % n == k]
m = WhisperModel("deepdml/faster-whisper-large-v3-turbo-ct2", device="cpu", compute_type="int8", cpu_threads=4)
out = open(f'asr/each_{k}.jsonl', 'w'); t0 = time.time()
for j, r in enumerate(isl):
    a = max(0, int((r['s'] - 0.20) * sr)); b = min(len(x), int((r['e'] + 0.20) * sr))
    audio = np.concatenate([np.zeros(int(0.25 * sr), dtype='float32'), x[a:b], np.zeros(int(0.45 * sr), dtype='float32')])
    segs, _ = m.transcribe(audio, language="ur", beam_size=3, word_timestamps=True, condition_on_previous_text=False, vad_filter=False, chunk_length=(10 if (r["e"] - r["s"]) <= 8 else 30),
                           temperature=[0.0, 0.2], no_speech_threshold=0.6, compression_ratio_threshold=3.0)
    ws = []; lp = []
    for s in segs:
        lp.append(round(s.avg_logprob, 2))
        for w in (s.words or []):
            ws.append(dict(s=round(w.start - 0.25 + a / sr, 3), e=round(w.end - 0.25 + a / sr, 3), w=w.word.strip(), p=round(w.probability, 3)))
    out.write(json.dumps(dict(i=r['i'], s=r['s'], e=r['e'], peak=r['peak'], words=ws, lp=lp, text=' '.join(w['w'] for w in ws)), ensure_ascii=False) + '\n'); out.flush()
    if j % 20 == 0: print(f"[{k}] {j}/{len(isl)} {time.time()-t0:.0f}s", flush=True)
print(f"[{k}] DONE {time.time()-t0:.0f}s", flush=True)
