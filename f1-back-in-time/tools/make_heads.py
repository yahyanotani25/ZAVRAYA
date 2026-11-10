"""Build the driver head cut-outs: matte from rembg (u2net) x a hand-traced jaw/hairline polygon.
usage: make_heads.py <raw_dir> <out_dir>   (raw_dir holds <name>_crop.png and <name>_u2net.png)"""
import sys, json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# polygons / landmarks are in % of the crop (x, y), traced by eye over a gridded print
HEADS = {
 'max': dict(poly=[(0,0),(100,0),(100,74),(84,73),(75.5,77),(70.5,84),(64.5,90),(58,93.5),(50,95),(40,94),(32,89.5),(27,83),(23,73),(15,65),(0,60)],
             eyes=[(32.5,57.5),(53,54.5)], chin=(46,94.5), er=4.6, scale=1.0),
 'charles': dict(poly=[(10,60),(10,25),(22,14.2),(34,13.4),(44,12.6),(54,12.2),(66,12.4),(82,20),(88,40),(88,58),(82,64),(77,68),(74,72.5),(70,77.5),(64,82),(58,85),(50,86.2),(42,85.6),(35,83),(29,78.5),(24.5,72.5),(21.5,67),(16,63)],
             eyes=[(38.8,54.6),(61.4,54.6)], chin=(49,86), er=5.2, scale=2.0),
 'lewis': dict(poly=[(0,0),(100,0),(100,58),(84.5,62),(80.5,68),(76,74),(71,80.5),(65.5,85.5),(58,88.6),(50,89.6),(42,88.6),(34,84),(28,77),(24,69),(19,64.5),(12,59),(0,56)],
             eyes=[(46.5,42.2),(74.3,42.8)], chin=(52,89.5), er=5.0, scale=1.0),
 'alonso': dict(poly=[(8,50),(8,8),(92,8),(92,52),(85,57),(83.5,64),(80.5,72),(76,81),(70,88),(63,92.5),(52,93.5),(42,92),(33,87.5),(27,80.5),(22,71),(18,62),(12,56)],
             eyes=[(43.5,57.5),(69,57.2)], chin=(53,93.5), er=5.0, scale=1.0),
 'kimi': dict(poly=[(0,35),(8,31),(18,29),(22,24),(27,17),(33,10),(40,6),(50,4.5),(65,6),(78,11),(88,20),(93,32),(95,45),(94,52),(88,58),(84,66),(78,70),(72,73),(68,81),(63,88),(56,92.5),(46,93.8),(36,93.5),(29,92),(24,88),(20,82),(17,72),(16,62),(17,52),(15,45),(12,41.5),(5,40.5),(0,40)],
             eyes=[(22,54.5),(43,59)], chin=(41,93.5), er=5.0, scale=0.42),
}

def build(name, raw, out):
    cfg = HEADS[name]
    rgb = Image.open(os.path.join(raw, f"{name}_crop.png")).convert("RGB")
    a = Image.open(os.path.join(raw, f"{name}_u2net.png")).convert("RGBA").split()[3]
    w, h = rgb.size
    ss = 4
    m = Image.new("L", (w * ss, h * ss), 0)
    ImageDraw.Draw(m).polygon([(x / 100 * w * ss, y / 100 * h * ss) for x, y in cfg['poly']], fill=255)
    m = m.resize((w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.8))
    a = a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))          # pull the matte in 1px to drop fringe
    alpha = Image.fromarray((np.asarray(a, np.float32) * np.asarray(m, np.float32) / 255).astype(np.uint8))
    im = rgb.copy(); im.putalpha(alpha)
    bbox = alpha.point(lambda v: 255 if v > 12 else 0).getbbox()
    im = im.crop(bbox)
    sc = cfg['scale']
    if sc != 1.0:
        im = im.resize((round(im.width * sc), round(im.height * sc)), Image.LANCZOS)
        if sc > 1.0:
            r, g, b, al = im.split()
            sharp = Image.merge("RGB", (r, g, b)).filter(ImageFilter.UnsharpMask(radius=2.2, percent=70, threshold=2))
            im = Image.merge("RGBA", (*sharp.split(), al))
    im.save(os.path.join(out, f"{name}.png"))
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    n = lambda p: (round((p[0] / 100 * w - bbox[0]) / bw, 4), round((p[1] / 100 * h - bbox[1]) / bh, 4))
    return dict(img=f"heads/{name}.png", eyes=[n(cfg['eyes'][0]), n(cfg['eyes'][1])], chin=n(cfg['chin']),
                er=round(cfg['er'] / 100 * w / bw, 4), size=[im.width, im.height])

if __name__ == "__main__":
    raw, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    meta = {k: build(k, raw, out) for k in HEADS}
    json.dump(meta, open(os.path.join(out, "heads.json"), "w"), indent=1)
    for k, v in meta.items(): print(k, v)
