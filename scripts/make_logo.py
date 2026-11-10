"""Key the HMS Digital logo off its light background -> transparent PNG variants."""
import numpy as np, cv2, sys, os
src = sys.argv[1]; out = sys.argv[2]
img = cv2.imread(src)[:, :, ::-1].astype(np.float32)
h, w = img.shape[:2]
# background estimate from border pixels
border = np.concatenate([img[:20].reshape(-1,3), img[-20:].reshape(-1,3), img[:, :20].reshape(-1,3), img[:, -20:].reshape(-1,3)])
bg = np.median(border, axis=0)
dist = np.sqrt(((img - bg) ** 2).sum(-1))
alpha = np.clip((dist - 18) / 50.0, 0, 1)
alpha = cv2.GaussianBlur(alpha, (0, 0), 0.6)
# un-premultiply colour against bg so edges don't carry a grey halo
a3 = np.maximum(alpha[..., None], 1e-3)
fg = np.clip((img - bg * (1 - a3)) / a3, 0, 255)
ys, xs = np.where(alpha > 0.05)
pad = 12
y0, y1, x0, x1 = max(ys.min()-pad,0), min(ys.max()+pad,h), max(xs.min()-pad,0), min(xs.max()+pad,w)
fg, alpha = fg[y0:y1, x0:x1], alpha[y0:y1, x0:x1]
# green mask (arrow) vs navy (text/bars)
r, g, b = fg[..., 0], fg[..., 1], fg[..., 2]
green = ((g > r + 40) & (g > b + 20)).astype(np.float32)
green = cv2.GaussianBlur(green, (0, 0), 1.0)
def save(rgb, a, name):
    rgba = np.dstack([rgb, a * 255]).clip(0, 255).astype(np.uint8)
    cv2.imwrite(os.path.join(out, name), rgba[:, :, [2, 1, 0, 3]])
save(fg, alpha, 'hms_logo_color.png')
white = np.full_like(fg, 255.0)
greenc = np.array([46, 214, 96], np.float32)
wv = white * (1 - green[..., None]) + greenc * green[..., None]
save(wv, alpha, 'hms_logo_white.png')
print('bg', bg, 'crop', fg.shape)
