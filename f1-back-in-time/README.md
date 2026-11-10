# F1 "Back to the 1950s" – cut-out animation (test section)

55-second, 1920×1080 / 30 fps animation for the opening of the episode (script `test.docx`, up to
"So Charles goes first."), in the channel's stick-figure cut-out style: drawn narrator, photo-head drivers,
vector cars, bold lettering, punch-in cuts.

## Scenes

| Time | Line | What happens |
|---|---|---|
| 0:00 | Modern F1 drivers… most prepared… | Narrator in the pit lane; Max arrives in the Red Bull, shades drop |
| 0:04 | Simulators, telemetry… medical teams | "Modern F1 driver starter pack": seven hand-drawn icons pop on each word |
| 0:11 | …we're taking all of that away | Narrator sweeps the lot (title included) into a sack |
| 0:13 | Max, Charles, Lewis… sent back | Drivers drop in with name tags; a cardboard "TIME MACHINE (real)" lands on them |
| 0:18 | most dangerous decades | Real 1957 Nürburgring pits, leather caps and goggles, a car screams past, title slams |
| 0:24 | …they probably can | Max in a 250F-style car through a 1950s roadside, shades again |
| 0:30 | …survive long enough to learn | "SAFETY BARRIER" hay bales, "RUN-OFF AREA" tree, a waving grim reaper |
| 0:34 | We considered Fernando Alonso… | "TOO EXPERIENCED" stamp, side-eye |
| 0:41 | I even found this photo | A real photo of Alonso driving a 1920s Austin 7, aged and captioned |
| 0:43 | Kimi Antonelli is also staying home | Couch, tablet, juice box, a note from Toto |
| 0:45 | 1955 Maserati… screen… buttons | Car reveal, "where's the screen??", steering-wheel face-off |
| 0:52 | So Charles goes first | Arrow of fate, two quick sidesteps, iris out on Charles |

## Build

Needs Python 3 with `numpy scipy pillow skia-python soundfile` and `ffmpeg`.

```bash
tools/build.sh /path/to/voiceover.mp3 out/F1_Back_In_Time_1080p.mp4      # ~5 min on 4 cores
```

```bash
python3 -m anim.render --sheet 3.5 22.6 39.7 --out sheet.jpg --scale 0.5   # stills at given times
```

- `anim/core.py` – drawing/timing helpers · `anim/rig.py` – stick-figure rig, photo heads, cartoon eyes
- `anim/cars.py` – modern F1 car + 1950s car · `anim/art.py` – props, icons, effects
- `anim/scenes_a.py`, `anim/scenes_b.py` – the shots, keyed to the voice-over clock
- `anim/sound.py` – sound design and mix · `anim/render.py` – renderer (motion blur on fast action)
- `tools/make_heads.py`, `tools/make_bgs.py` – rebuild cut-outs / background plates from the source photos

The voice-over, script and reference video are the client's and are not in this repo; renders go to `out/` (ignored).
Photo and sound licences: see [CREDITS.md](CREDITS.md).
