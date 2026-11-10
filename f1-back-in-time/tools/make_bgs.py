"""Prepare background plates from the licensed source photos.
usage: make_bgs.py <raw_dir> <out_dir>"""
import sys, os
from PIL import Image, ImageFilter, ImageEnhance, ImageOps
raw, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)

def plate(src, name, width=2200, blur=1.6, sat=1.0, con=1.0, bri=1.0, gray=False, crop=None, q=92):
    im = Image.open(os.path.join(raw, src)).convert("RGB")
    if crop: im = im.crop(crop)
    im = im.resize((width, round(width * im.height / im.width)), Image.LANCZOS)
    if gray: im = ImageOps.grayscale(im).convert("RGB")
    if blur: im = im.filter(ImageFilter.GaussianBlur(blur))
    im = ImageEnhance.Color(im).enhance(sat); im = ImageEnhance.Contrast(im).enhance(con); im = ImageEnhance.Brightness(im).enhance(bri)
    im.save(os.path.join(out, name), quality=q); print(name, im.size)

plate("flickr/pit_pits.jpg", "pit.jpg", blur=2.2, sat=1.08, con=1.04, bri=1.03)
plate("flickr/pit_grid.jpg", "pit2.jpg", blur=2.2, sat=1.08, con=1.04, bri=1.03)
plate("final/fangio_pit.jpg", "y1957_pits.jpg", blur=1.2, gray=True, con=1.05)
plate("final/fangio_exit.jpg", "y1957_exit.jpg", blur=1.2, gray=True, con=1.05)
# the 'found photo': Fernando Alonso really did drive a 1920s Austin 7 on the 2022 British GP drivers' parade
plate("heads/alonso_b.jpg", "alonso_austin.jpg", width=1500, blur=0, gray=True, con=1.12, crop=(520, 150, 1880, 1090), q=93)
