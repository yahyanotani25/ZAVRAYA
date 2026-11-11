"""Voice master v2:  vo/ai_sr.wav (AI-denoised + bandwidth-extended)  ->  vo/final.wav
match-EQ to a warm, clear narration curve (linear-phase FIR), de-ess, gentle 2-stage compression, soft saturation, limiter, -16 LUFS."""
import json, subprocess, sys, os, numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy import signal

src = sys.argv[1] if len(sys.argv) > 1 else 'vo/ai_sr.wav'
ref, SR = sf.read('vo/cut.wav', dtype='float32')
x, sr = sf.read(src, dtype='float32'); assert sr == SR
if x.ndim == 2: x = x.mean(1)
if len(x) < len(ref): x = np.pad(x, (0, len(ref) - len(x)))
x = x[:len(ref)]

# ---- speech-only long-term spectrum in 1/3-octave bands
def ltas(y):
    h = int(0.02 * SR); n = len(y) // h; r = 20 * np.log10(np.sqrt((y[:n * h].reshape(n, h) ** 2).mean(1)) + 1e-9)
    act = np.repeat(r > (np.percentile(r, 90) - 25), h); ys = y[:n * h][act]
    f, P = signal.welch(ys, SR, nperseg=16384)
    fc = np.array([80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000.0])
    L = np.array([10 * np.log10(P[(f >= c / 2 ** (1 / 6)) & (f < c * 2 ** (1 / 6))].mean() + 1e-20) for c in fc])
    return fc, L
fc, L = ltas(x)
# target: warm chest (125-250 Hz), clean low-mids, forward presence (2-4 kHz), smooth air — dB relative to the 400-630 Hz region
TGT = np.array([-15, -8, -3.5, -0.5, 1.0, 1.0, 0.5, 0, 0, -1.0, -3.0, -5.0, -6.5, -8.0, -9.0, -9.5, -10.0, -11.5, -14.0, -17.0, -20.0, -23.5, -27.5, -33.0])
ref_lvl = L[(fc >= 400) & (fc <= 630)].mean()
need = TGT - (L - ref_lvl)
need = np.where(fc >= 4000, np.clip(need, -7.0, 13.0), np.clip(need, -7.0, 10.0))    # the rebuilt top end may be lifted further
need[fc <= 100] = np.minimum(need[fc <= 100], 3.0)                      # do not dig up rumble
need = np.convolve(np.pad(need, 1, mode='edge'), [0.25, 0.5, 0.25], mode='valid')
need *= float(os.environ.get('EQ_AMOUNT', '0.9'))                     # not 100 %: keep the speaker's own character
print('match-EQ gains (dB):', ' '.join(f"{int(c)}:{g:+.1f}" for c, g in zip(fc, need)))
freqs = np.concatenate([[0, 40, 60], fc, [20000, SR / 2]]); gains = np.concatenate([[-60, -40, -12], need, [need[-1] - 6, -60]])
fir = signal.firwin2(8191, freqs, 10 ** (gains / 20), fs=SR)
y = signal.fftconvolve(x, fir, mode='full')[4095:4095 + len(x)].astype('float32')
y *= 0.5 / (np.abs(y).max() + 1e-9)
sf.write('vo/eq2.wav', y, SR, subtype='PCM_24')

chain = ("deesser=i=0.3:m=0.5:f=0.5:s=o,"
         "acompressor=threshold=0.071:ratio=2.5:attack=10:release=130:makeup=1.6:knee=5,"
         "acompressor=threshold=0.25:ratio=1.6:attack=4:release=90:makeup=1.12,"
         "asoftclip=type=tanh:threshold=0.89,"
         "agate=threshold=0.0035:ratio=1.4:range=0.4:attack=5:release=200,"
         "alimiter=limit=0.84:level=disabled")
p1 = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', 'vo/eq2.wav', '-af', chain + ',loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
js = json.loads(p1[p1.rindex('{'):p1.rindex('}') + 1])
ln = f"loudnorm=I=-16:TP=-1.5:LRA=9:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true"
out = sys.argv[2] if len(sys.argv) > 2 else 'vo/final.wav'
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', 'vo/eq2.wav', '-af', chain + ',' + ln, '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s24le', out], check=True)
z, _ = sf.read(out, dtype='float32'); m = pyln.Meter(SR)
fc2, L2 = ltas(z); r2 = L2 - L2[(fc2 >= 400) & (fc2 <= 630)].mean()
print('after (dB re 500 Hz):', ' '.join(f"{int(c)}:{g:+.0f}" for c, g in zip(fc2, r2)))
print(f"LUFS {m.integrated_loudness(z):.1f}  peak {20*np.log10(np.abs(z).max()):.1f} dB  LRA(in) {js['input_lra']}  dur {len(z)/SR:.2f}s (cut {len(ref)/SR:.2f}s)")
