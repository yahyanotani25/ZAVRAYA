"""Per-island ASR for the remaining islands, priority ranges first. -> asr/each_prio.jsonl"""
import json, sys, numpy as np, soundfile as sf, time
from faster_whisper import WhisperModel
x, sr = sf.read('vo/raw16.wav', dtype='float32')
done = set(json.loads(l)['i'] for l in open('asr/each_base.jsonl')) | set(json.loads(l)['i'] for l in open('asr/each_prio.jsonl') if l.strip().endswith('}'))
allisl = [r for r in json.load(open('edit/islands.json')) if r['e'] - r['s'] >= 0.22 and r['i'] not in done]
PR = [(311,327),(340,349),(357,377),(390,394),(421,431),(436,443),(449,468),(472,476),(478,484),(487,507),(529,549),(566,580),(597,626),(640,648),(663,679),(690,707)]
inpr = lambda i: any(a <= i <= b for a, b in PR)
isl = [r for r in allisl if inpr(r['i'])] + [r for r in allisl if not inpr(r['i'])]
print('todo', len(isl), 'priority', sum(1 for r in allisl if inpr(r['i'])), flush=True)
m = WhisperModel("deepdml/faster-whisper-large-v3-turbo-ct2", device="cpu", compute_type="int8", cpu_threads=4)
out = open('asr/each_prio.jsonl', 'a'); t0 = time.time()
for j, r in enumerate(isl):
    d = r['e'] - r['s']
    a = max(0, int((r['s'] - 0.20) * sr)); b = min(len(x), int((r['e'] + 0.20) * sr))
    audio = np.concatenate([np.zeros(int(0.25 * sr), dtype='float32'), x[a:b], np.zeros(int(0.35 * sr), dtype='float32')])
    cl = 5 if d <= 3.7 else (10 if d <= 8.5 else 30)
    segs, _ = m.transcribe(audio, language="ur", beam_size=2, word_timestamps=True, condition_on_previous_text=False, vad_filter=False, chunk_length=cl,
                           temperature=[0.0, 0.2], no_speech_threshold=0.6, compression_ratio_threshold=3.0)
    ws = []
    for s in segs:
        for w in (s.words or []):
            ws.append(dict(s=round(w.start - 0.25 + a / sr, 3), e=round(w.end - 0.25 + a / sr, 3), w=w.word.strip(), p=round(w.probability, 3)))
    out.write(json.dumps(dict(i=r['i'], s=r['s'], e=r['e'], peak=r['peak'], words=ws, text=' '.join(w['w'] for w in ws)), ensure_ascii=False) + '\n'); out.flush()
    if j % 20 == 0: print(f"{j}/{len(isl)} {time.time()-t0:.0f}s (island {r['i']})", flush=True)
print(f"DONE {time.time()-t0:.0f}s", flush=True)
