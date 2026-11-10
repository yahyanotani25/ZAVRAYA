"""Frame renderer: timeline dispatch, motion blur by sub-frame accumulation, piping to ffmpeg."""
import os, sys, math, subprocess, argparse
import numpy as np
import skia
from .core import *

def build_timeline():
    from . import scenes_a as A
    tl = [  # start, end, draw, post, motion-blur samples
        (0.00, 2.00, A.s1a, None, 1),
        (2.00, 4.52, A.s1b, None, 1),
        (4.52, 13.50, A.s2, None, 1),
        (13.50, 18.46, A.s3, None, 1),
        (18.46, 24.56, A.s4, A.s4_post, 1),
    ]
    try:
        from . import scenes_b as B
        tl += B.TIMELINE
    except ImportError:
        pass
    return tl

# time ranges that get extra sub-frame samples (fast action)
MB = [(2.00, 2.90, 8), (11.78, 13.50, 5), (14.10, 14.50, 5), (15.10, 15.50, 5), (16.30, 16.70, 5), (16.94, 17.40, 6),
      (18.92, 19.40, 5), (19.98, 20.70, 10), (21.76, 22.05, 5), (23.00, 23.30, 5)]
DURATION = 55.40

def samples_at(t, extra):
    n = 1
    for a, b, k in MB + extra:
        if a <= t < b: n = max(n, k)
    return n

class TalkEnv:
    """Mouth-flap amplitude from the voice-over (0..1), held on twos like drawn lip-sync."""
    def __init__(self, wav=None):
        self.env = None
        if wav and os.path.exists(wav):
            import soundfile as sf
            x, sr = sf.read(wav, dtype="float32")
            if x.ndim > 1: x = x.mean(1)
            hop = sr // 60
            n = len(x) // hop
            rms = np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(1))
            rms = np.convolve(rms, np.ones(3) / 3, mode="same")
            ref = np.percentile(rms[rms > 1e-4], 92) if (rms > 1e-4).any() else 1.0
            self.env = np.clip((rms / ref - 0.10) / 0.8, 0, 1) ** 0.8
    def __call__(self, t):
        if self.env is None: return 0.0
        tq = on_twos(t)
        i = int(tq * 60)
        if i < 0 or i >= len(self.env): return 0.0
        v = float(self.env[i: i + 3].max()) if i + 3 <= len(self.env) else float(self.env[i])
        return 0.0 if v < 0.12 else (0.35 if v < 0.4 else 0.68 if v < 0.72 else 1.0)

def scene_at(tl, t):
    for s in tl:
        if s[0] <= t < s[1]: return s
    return tl[-1]

class Renderer:
    def __init__(self, vo_wav=None, scale=1.0):
        self.tl = build_timeline()
        self.ctx = dict(talk=TalkEnv(vo_wav))
        self.scale = scale
        self.w, self.h = int(W * scale), int(H * scale)
        self.surface = skia.Surface(self.w, self.h)
        self.extra_mb = []
        try:
            from . import scenes_b as B
            self.extra_mb = getattr(B, "MB", [])
        except ImportError:
            pass

    def _draw(self, t, post):
        c = self.surface.getCanvas()
        sc = scene_at(self.tl, t)
        c.save(); c.scale(self.scale, self.scale)
        if not post:
            c.clear(0xFF000000)
            sc[2](c, t, self.ctx)
        elif sc[3] is not None:
            sc[3](c, t, self.ctx)
        c.restore()

    def frame(self, t, mb=True):
        """BGRA uint8 array for time t."""
        sc = scene_at(self.tl, t)
        n = samples_at(t, self.extra_mb) if mb else 1
        if n <= 1:
            self._draw(t, False)
        else:
            acc = np.zeros((self.h, self.w, 4), np.uint32)
            for i in range(n):
                ts = t + (i / n) * 0.5 / FPS                       # 180-degree shutter
                if ts >= sc[1]: ts = t                              # never smear across a cut
                self._draw(ts, False)
                acc += self.surface.makeImageSnapshot().toarray()
            arr = (acc // n).astype(np.uint8); arr[..., 3] = 255
            self.surface.getCanvas().writePixels(skia.ImageInfo.Make(self.w, self.h, skia.kBGRA_8888_ColorType, skia.kPremul_AlphaType), arr.tobytes())
        self._draw(t, True)
        return self.surface.makeImageSnapshot().toarray()

def render_range(a, b, out, vo_wav, scale=1.0, crf=14):
    r = Renderer(vo_wav, scale)
    f0, f1 = int(round(a * FPS)), int(round(b * FPS))
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{r.w}x{r.h}", "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-preset", "medium", "-crf", str(crf), "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709",
           "-color_trc", "bt709", "-color_range", "tv", "-vf", "scale=in_range=full:out_range=tv:out_color_matrix=bt709", "-g", "30", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(f0, f1):
        p.stdin.write(r.frame(f / FPS).tobytes())
    p.stdin.close(); p.wait()

def still(t, out, vo_wav=None, scale=0.5, mb=False):
    r = Renderer(vo_wav, scale)
    arr = r.frame(t, mb)
    skia.Image.fromarray(arr, colorType=skia.kBGRA_8888_ColorType).save(out, skia.kPNG)

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--range", nargs=2, type=float); ap.add_argument("--out"); ap.add_argument("--vo"); ap.add_argument("--scale", type=float, default=1.0)
    ap.add_argument("--sheet", nargs="+", type=float, help="render stills at these times into a contact sheet")
    ap.add_argument("--cols", type=int, default=4); ap.add_argument("--mb", action="store_true")
    a = ap.parse_args()
    if a.sheet:
        from PIL import Image, ImageDraw
        r = Renderer(a.vo, a.scale)
        ims = []
        for t in a.sheet:
            arr = r.frame(t, a.mb)[..., [2, 1, 0]]
            im = Image.fromarray(np.ascontiguousarray(arr)); ImageDraw.Draw(im).text((8, 6), f"{t:.2f}", fill=(255, 255, 0), stroke_width=2, stroke_fill=(0, 0, 0))
            ims.append(im)
        cols = a.cols; rows = (len(ims) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * r.w, rows * r.h), "black")
        for i, im in enumerate(ims): sheet.paste(im, ((i % cols) * r.w, (i // cols) * r.h))
        sheet.save(a.out, quality=90)
    else:
        render_range(a.range[0], a.range[1], a.out, a.vo, a.scale)
