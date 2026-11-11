#!/usr/bin/env python3
# usage: sheet.py <dir_with_jpgs> <out.jpg> [cols]  -> contact sheet (each tile 640x360, time label burned in)
import sys, glob, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 3
fs = sorted(f for f in glob.glob(os.path.join(d, 't*.jpg')))
rows = (len(fs) + cols - 1) // cols
sheet = Image.new('RGB', (cols * 640, rows * 360), (0, 0, 0)); dr = ImageDraw.Draw(sheet)
for i, f in enumerate(fs):
    im = Image.open(f).resize((640, 360)); x, y = (i % cols) * 640, (i // cols) * 360; sheet.paste(im, (x, y))
    dr.rectangle([x, y, x + 86, y + 18], fill=(0, 0, 0)); dr.text((x + 4, y + 3), os.path.basename(f)[1:-4], fill=(255, 255, 0))
sheet.save(out, quality=82); print(out, len(fs), 'tiles')
