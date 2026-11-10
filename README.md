# Souq Umm Besher — Instagram Reel (HMS Digital)

43-second vertical (1080×1920, 30 fps) promo reel for **Souq Umm Besher** (commercial souq,
Qatar), edited in the style of the client's reference reel: word-by-word bilingual captions,
fast beat-synced cuts, speed ramps, zoom/whip transitions and an animated end card.

## Deliverables

| File | Use |
|---|---|
| `deliverables/SouqUmmBesher_Reel_PREVIEW_HMS.mp4` | Client preview, HMS Digital watermark (8 Mbps) |
| `deliverables/SouqUmmBesher_Reel_PREVIEW_HMS_WhatsApp.mp4` | Same preview, 720p / 13 MB for WhatsApp |
| `SouqUmmBesher_Reel_CLEAN_1080x1920.mp4` | **Not in this repo.** Un-watermarked final, delivered privately after payment (this repo is public) |

## What's in the edit

- **Hook (0–4 s)** – "Looking For / The Perfect / SPACE / in Qatar?" builds across three cuts; SPACE slams in on the beat.
- **Title drop (4 s)** – Arabic + English project name with letter cascade, gold divider, impact + camera shake.
- **Feature sections** with numbered chapter tags: 01 Retail · 02 Parking (animated P badge) · 03 Access · 04 Interiors · 05 Kitchens · 06 Bathrooms · 07 Views.
- **Captions** – Arabic line + English two-liner with gold-gradient accent word and draw-on underline, masked rise-in / blur-out, soft legibility scrim.
- **Transitions** – zoom-blur, directional whip pans (matched to camera motion), spin, flash, RGB glitch, warm light leaks, beat punches; speed ramps with real shutter-angle motion blur.
- **Grade** – per-shot auto white-balance/exposure, gentle S-curve, warm highlights / cool shadows, sharpening, vignette, fine film grain.
- **CTA (34 s)** – "Book Your Space Today" with pulsing call button.
- **End card (38 s)** – blurred plate, gold dust particles, light sweep on the title, contact details (taken from the project's own site signage).
- **Soundtrack** – original 120 BPM track synthesised in `scripts/audio.py` (no licensing issues), with risers, impacts, whooshes and UI ticks synced to every cut and text hit.

## Rebuild

Requires Python 3 with `numpy scipy opencv-python-headless pillow` (Pillow with raqm for Arabic) and `ffmpeg`.

```bash
python scripts/make_logo.py assets/brand/hms_logo_source.jpg assets/brand   # keyed watermark PNGs
python scripts/build.py /path/to/raw_clips deliverables                     # ~7 min on 4 cores
```

`scripts/timeline.py` holds the whole edit decision list (shots, in-points, speeds, transitions,
caption text, contact details) — change text or timing there and re-run `build.py`.

Fonts: Poppins and Tajawal (SIL Open Font License, see `assets/fonts/OFL-*.txt`).
