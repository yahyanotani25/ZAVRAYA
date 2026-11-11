# Scene authoring guide — "Kainat Ka Pehla Lamha" (Hidden Mysteries of Islam)

A 15–17 minute 1920×1080 / 30 fps YouTube documentary (Roman-Urdu voice-over about the Big Bang and the Quran).
The film is an HTML page rendered frame-by-frame in headless Chromium: **every frame is a pure function of time**.
You write ONE file: `src/scenes/<part>.js`. Do not edit `engine.js`, `ui.js`, `kit3d.js`, `film.css`, `film.js`, `quran.js`, `assets.js`
(shared by other authors working in parallel). Need a helper that is missing? Define it locally in your file. Found a bug in a shared file? Report it in your final message.

All paths below are relative to `/tmp/claude-0/-home-user-ZAVRAYA/11d60b1e-ec95-526d-bd06-3bd05d7e3343/scratchpad/` (call it `$S`). The film lives in `$S/film`.

## Read first (in this order)
1. `film/src/scenes/a.js` — the finished cold open. **This is the quality bar and the style reference.** Copy its patterns.
2. `film/src/engine.js` (scenes, cues, 3D stage), `film/src/ui.js` (text/photo/footage components), `film/src/kit3d.js` (3D kit), `film/src/film.css` (design tokens + classes).
3. `edit/spoken.json` — the voice-over, line by line: `{key, part, text}`. `key` is what you pass to the cue helpers.
4. `film/src/quran.js` (verified Arabic), `film/src/assets.js` (image map).

## Timing: cues, never constants
- `T('63')` = film time (s) when spoken line `63` starts, `T('63e')` = when it ends, `TW('63', 4)` = when its 5th word (0-based, words = `text.split(' ')`) starts.
- Your part owns `[P0, P1)` (passed to your default export). Cover it completely — no black holes. The last scene may run to `P1 + 0.3` with `fout: 0.3` to cross-fade into the next part.
- `film/cues.json` currently holds **provisional** timings. Real voice timings will replace them later and line durations will change (±40%).
  So: every time in your file must be derived from `T`/`TW` (plus small offsets). Never type an absolute second. Inside a scene use local time: `const L = (id, n) => (n == null ? T(id) : TW(id, n)) - s.t0;`
- Guard short intervals (`Math.max`, `Math.min`) so nothing breaks if a line becomes 40% shorter; hold visuals until the next cue rather than for a fixed duration.
- Visuals must land ON the spoken word: the picture/keyword appears 0.05–0.15 s before the word it illustrates.

## Scene API (see a.js)
```js
defScene('b3_ball', tStart, tEnd, (s) => {            // id must start with your part letter
  // s.el (1920×1080 div), s.tl (paused GSAP timeline, positions in LOCAL seconds), s.div(cls, style, html), s.add(el)
  // s.onUpdate((lt) => {...})  procedural per-frame code, lt = local time
  // s.sfx('whoosh', lt, {gain, dur})  register a sound-design cue (see vocabulary)
}, { fin: 0.3, fout: 0.3, z: 0 });                    // fade in/out seconds (0 = hard cut), z = stacking
```
- Overlap consecutive scenes by their fade length for cross-fades; use hard cuts (no fade) on beats.
- **Determinism rules:** no `Math.random()` (use `rng(seed)`), no `Date`, no CSS `animation`/`transition`, no `requestAnimationFrame`, no `setTimeout`.
  Animate only with `s.tl` (GSAP tweens placed at local times) or `s.onUpdate`. Frames may be rendered out of order by parallel workers — a frame must not depend on earlier frames.
- GSAP: use `fromTo` (not bare `from`) so jumps in time are safe. Plugins loaded: SplitText (`words()`, `chars()` in ui.js), DrawSVG, CustomEase, ScrambleText, MotionPath.
- 3D: `const st = stage3d(s, {bg, fov}); st.scene.add(...); st.frame = (lt) => { ...move camera/objects as a function of lt... }`. One `stage3d` per scene. Kit: `spaceBackdrop`, `galaxyField`, `earth`+`latLon`+`pin`, `fireball`, `gridPlane`, `mapSphere`, `billboard`, `skydome`, `glow`, `starfield`.
- Images: `image(src, style)` / `still(s, src, {kb})` / `photoCard(...)`; footage: `footage(s, name, {n, speed, kb})` (pre-extracted frames, below).
- Text: `cap` (emphasis caption), `big` (headline), `lowerThird`, `dateline`, `stamp`, `quote`, `ayah`, `counter`, `flash`, `show`, `svg`, `shake`.

## Assets
- Sphere textures: `/gfx/tex/milkyway_4k.jpg`, `earth_day_4k.jpg`, `earth_night_4k.jpg`, `cmb_equirect.jpg`.
- Photos/stills: use `IMG.<key>` from `assets.js` (web-ready JPEGs in `/gfx/img/`). If a key you need is not there yet, write `IMG.key || IMG.placeholder` and list it in your final message.
- Footage (NASA / ESA-Hubble / ESO, all licence-cleared) is in `$S/assets/video/`. Thumbnails of every clip: `$S/out/thumbs/sheet_0.jpg … sheet_3.jpg` (Read them) and `$S/out/thumbs/info.json`.
  Extract what you need (keep it under ~50 s of footage per part; ~0.4 MB per frame):
  `film/tools/frames.sh <clip.mp4> <start_sec> <dur_sec> <name> [step]` → `$S/frames/<name>/00001.jpg…` — **prefix `<name>` with your part letter** (`b_hubbleflight`).
  It writes every source frame (no fps conversion): 25/30 fps clips play 1 frame per output frame (`speed: 1`); for 60 fps clips pass `step=2` (or keep all frames for smooth half-speed). Then `footage(s, 'b_hubbleflight', { n: <frame count>, speed: 1, kb: {s0:1.0, s1:1.08} })`.
  Do not let footage freeze: make sure `n` covers the scene (`speed: n / (dur*30)` stretches it; fine for slow space shots, keep speed ≥ 0.45).
- Your own derived images (crops, graded/B&W versions — do grading with PIL, not CSS filters): save to `$S/gfx/img/<part>_<name>.jpg` and reference as `/gfx/img/<part>_<name>.jpg`. Max 4096 px on the long side.
- Only use assets from `$S/assets` (licence-cleared) or things you draw yourself (SVG/canvas/3D). Do not download anything.

## Look & feel (premium science documentary)
- Palette (CSS vars / classes in film.css): deep navy-black space; **gold** (`.gold`, `.goldgrad`, `.glowg`) for Quran / revelation; **cyan** (`.cyan`, `.hud`, `.mono`) for science / data / HUD; **red** only for "wrong / impossible"; warm white text.
- Type: `.bebas`/`.anton` headlines (caps), `.mont` captions, `.cinzel` refs, `.play`/`.serif` quotes, `.mono` HUD, `.ar` (Amiri Quran) for Arabic.
- On-screen language: **Roman Urdu exactly as in spoken.json** (same spellings), short — keywords and key phrases, not full subtitles. Max ~7 words per caption, 1–2 lines. English only for proper nouns / science terms.
- Something must change on screen every 2–4 seconds (new element, camera move, highlight, cut). No frame should sit static for more than ~4 s. Favour a few strong ideas per line over clutter.
- Keep text inside the safe area (≥ 96 px from edges); never put text over a busy bright area without a scrim (`.scrim-b`, `.scrim-l`, …). Bottom-right 420×80 px is reserved for the channel bug.
- Every scene ends with `s.div('vig')` (vignette) unless it is full-screen text on black.
- Motion: ease-out entrances (0.4–0.8 s), slow continuous drift on backgrounds (Ken Burns / camera dolly), hard hits (flash + `shake`) only on the 1–2 biggest beats per minute.

## Religious / factual rules (non-negotiable)
- Arabic: Quran text ONLY from `Q[...]` in quran.js (never type or alter it; don't split it by characters; never cross it out, tilt it wildly, or put marks over it). Other Arabic only from `AR[...]`.
- Ayah cards: use `ayah(s, {ref: REF['21:30a'], ar: Q['21:30a'], tr: 'line 1|line 2', ...})`; translation text = the spoken Roman-Urdu translation.
- Never depict Allah, prophets, angels, companions or early scholars as figures/faces/silhouettes. For the Prophet write "Rasulullah ﷺ" / "Aap ﷺ". Religious personalities = name plates / calligraphy only. Scientists' real photos are fine.
- No invented facts, dates, quotes or numbers beyond what the narration says (labels may add: full names, years and places that are in the script's fact sheet).

## Sound-design cue vocabulary (`s.sfx(name, localTime, {gain, dur})`)
`whoosh` `whooshRev` `impact` (big boom) `hit` (lighter) `subdrop` `riser`(dur) `swell`(dur) `shimmer` `chime` `ding` (correct) `buzz` (wrong) `tick` `pop` `type`(dur) `clock`(dur) `rewind`(dur) `slash` `slam` (door) `heartbeat` `static`(dur, TV/radio hiss) `radio`(dur) `glitch` `paper` `flutter` (wings) `camera` (shutter) `thud`.
Use them on real visual events only (roughly 6–12 per minute). Music is handled elsewhere.

## Performance budget (software WebGL!)
No CSS `filter: blur()` / `backdrop-filter` on anything large; no full-screen fragment shaders with loops; ≤ 400 sprites and ≤ 20k points per 3D scene; images ≤ 4096 px. Don't stack more than ~3 full-screen layers.

## Test loop (the machine is shared — keep runs small)
```bash
cd $S/film
node snap.js ../out/<part> --q=parts=<part> 81.2 84.0 90.5 …      # ≤ 12 timestamps per run; prints console errors / PAGEERROR
python3 tools/sheet.py ../out/<part> ../out/<part>/sheet.jpg 4      # then Read the sheet (and Read 2–3 single frames at full size)
```
Check: no errors, text legible and inside safe area, Arabic rendered, timing lands on the words (compare with cues.json), no empty/black frames, nothing clipped. Sample at least one frame per caption/element, including scene starts and ends. Fix and re-run until it looks like a.js quality.

## Deliver
`film/src/scenes/<part>.js` (default export `function([P0, P1])`). Final message (≤ 40 lines): scenes with their cue ranges, assets/footage used (file names), `IMG` keys still missing, anything you are unsure about.
