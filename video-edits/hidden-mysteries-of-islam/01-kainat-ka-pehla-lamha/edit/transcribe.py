import sys, json, time
import soundfile as sf
from faster_whisper import WhisperModel
wav, out, model_name = sys.argv[1], sys.argv[2], sys.argv[3]
t0 = time.time()
m = WhisperModel(model_name, device="cpu", compute_type="int8", cpu_threads=4)
audio, sr = sf.read(wav, dtype="float32"); assert sr == 16000
segs, info = m.transcribe(audio, language="ur", beam_size=5, word_timestamps=True,
                          condition_on_previous_text=False, vad_filter=True,
                          vad_parameters=dict(min_silence_duration_ms=400, speech_pad_ms=200),
                          temperature=[0.0, 0.2, 0.4], no_speech_threshold=0.5)
with open(out, "w") as f:
    for s in segs:
        rec = dict(start=round(s.start, 3), end=round(s.end, 3), text=s.text.strip(),
                   avg_logprob=round(s.avg_logprob, 3), no_speech=round(s.no_speech_prob, 3),
                   words=[dict(s=round(w.start, 3), e=round(w.end, 3), w=w.word.strip(), p=round(w.probability, 3)) for w in (s.words or [])])
        f.write(json.dumps(rec, ensure_ascii=False) + "\n"); f.flush()
        print(f"[{time.time()-t0:7.1f}s] {s.start:8.2f}-{s.end:8.2f} {s.text.strip()[:90]}", flush=True)
print("DONE", time.time() - t0, flush=True)
