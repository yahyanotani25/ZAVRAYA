"""vo/cut.wav -> vo/final.wav : noise reduction, EQ, exciter, de-ess, compression, gentle expansion, limiting, -16 LUFS."""
import json, subprocess, numpy as np, soundfile as sf, noisereduce as nr, pyloudnorm as pyln
from scipy.signal import welch
y, SR = sf.read('vo/cut.wav', dtype='float32')
raw, _ = sf.read('vo/raw48.wav', dtype='float32')
db = np.load('edit/db5ms.npy'); HOP = 0.005
# noise profile: the quietest stretches of the original recording (4 x 1.5 s)
win = int(1.5 / HOP); cs = np.cumsum(np.insert(db, 0, 0)); avg = (cs[win:] - cs[:-win]) / win
idx = np.argsort(avg); picks = []
for q in idx:
    if all(abs(q - p) > win for p in picks): picks.append(int(q))
    if len(picks) == 4: break
noise = np.concatenate([raw[int(q * HOP * 48000): int((q * HOP + 1.5) * 48000)] for q in picks])
den = nr.reduce_noise(y=y, sr=SR, y_noise=noise, stationary=True, prop_decrease=0.82, n_fft=2048, win_length=2048, hop_length=512, n_std_thresh_stationary=1.4, freq_mask_smooth_hz=400, time_mask_smooth_ms=60).astype('float32')
sf.write('vo/den.wav', den, SR, subtype='PCM_24')
chain = ("highpass=f=75:poles=2,lowshelf=g=2.0:f=150,equalizer=f=450:t=q:w=1.0:g=-2.5,equalizer=f=2300:t=q:w=0.8:g=3.0,equalizer=f=4500:t=q:w=1.0:g=2.5,highshelf=g=5:f=6500,"
         "aexciter=level_in=1:level_out=1:amount=1.6:drive=6:blend=0:freq=5500:ceil=14000,deesser=i=0.35:m=0.5:f=0.5:s=o,"
         "acompressor=threshold=0.063:ratio=3:attack=8:release=140:makeup=1.78:knee=4,acompressor=threshold=0.2:ratio=2:attack=3:release=80:makeup=1.19,"
         "agate=threshold=0.006:ratio=1.6:range=0.32:attack=6:release=180,alimiter=limit=0.84:level=disabled")
p1 = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', 'vo/den.wav', '-af', chain + ',loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
js = json.loads(p1[p1.rindex('{'):p1.rindex('}') + 1])
ln = f"loudnorm=I=-16:TP=-1.5:LRA=9:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true"
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', 'vo/den.wav', '-af', chain + ',' + ln, '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s24le', 'vo/final.wav'], check=True)
z, _ = sf.read('vo/final.wav', dtype='float32')
m = pyln.Meter(SR)
def stats(name, s):
    h = int(0.02 * SR); n = len(s) // h; r = 20 * np.log10(np.sqrt((s[:n * h].reshape(n, h) ** 2).mean(1)) + 1e-9)
    f, P = welch(s, SR, nperseg=8192); band = lambda lo, hi: 10 * np.log10(P[(f >= lo) & (f < hi)].mean() + 1e-20)
    print(f"{name:6s} LUFS {m.integrated_loudness(s):6.1f}  peak {20*np.log10(np.abs(s).max()):5.1f}  floor(p5) {np.percentile(r,5):6.1f}  speech(p90) {np.percentile(r,90):6.1f}  bands 100-200:{band(100,200):6.1f} 400-800:{band(400,800):6.1f} 2-4k:{band(2000,4000):6.1f} 5-8k:{band(5000,8000):6.1f} 8-12k:{band(8000,12000):6.1f}")
stats('cut', y); stats('den', den); stats('final', z)
print('loudnorm in', js['input_i'], 'LRA', js['input_lra'], 'dur', round(len(z) / SR, 2))
