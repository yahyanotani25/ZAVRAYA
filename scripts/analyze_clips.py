"""Per-clip motion/sharpness analysis to choose in/out points and transition directions."""
import cv2, numpy as np, subprocess, json, sys, os, glob
raw = sys.argv[1]; out = sys.argv[2]
W, H = 135, 240
res = {}
for f in sorted(glob.glob(os.path.join(raw, '*.mov'))):
    name = os.path.basename(f)[4:8]
    p = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-vf', f'fps=30,scale={W}:{H}', '-pix_fmt', 'gray', '-f', 'rawvideo', '-'], capture_output=True)
    fr = np.frombuffer(p.stdout, np.uint8).reshape(-1, H, W).astype(np.float32)
    dx, dy, sh = [], [], []
    win = cv2.createHanningWindow((W, H), cv2.CV_32F)
    for i in range(len(fr)):
        sh.append(float(cv2.Laplacian(fr[i], cv2.CV_32F).var()))
        if i:
            (x, y), _ = cv2.phaseCorrelate(fr[i-1], fr[i], win)
            dx.append(x); dy.append(y)
    dx, dy = np.array(dx), np.array(dy)
    # scale change (zoom) via log-polar is overkill; use mean flow divergence proxy
    res[name] = dict(n=len(fr), dur=len(fr)/30, mdx=float(np.median(dx)), mdy=float(np.median(dy)),
                     jitter=float(np.std(np.diff(dx)) + np.std(np.diff(dy))), sharp=[round(s) for s in sh[::3]])
    print(name, f"dur={len(fr)/30:.2f} pan_dx={np.median(dx):+.2f} pan_dy={np.median(dy):+.2f} jitter={res[name]['jitter']:.2f} sharp_min={min(sh):.0f} sharp_med={np.median(sh):.0f}")
json.dump(res, open(out, 'w'))
