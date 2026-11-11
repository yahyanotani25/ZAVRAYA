# Kainat Ka Pehla Lamha — full video edit (Hidden Mysteries of Islam, Video 1)

Edit of the script in `video-scripts/hidden-mysteries-of-islam/01-kainat-ka-pehla-lamha.md`, built around the channel
owner's own voice-over recording. 1920×1080, 30 fps, 12 min 50 s.

The finished MP4, the raw voice recording, the stock footage and the music files are **not** in this repo (size, and the
recording is private). This folder holds everything needed to rebuild the edit from those inputs, plus the credits.

## What was done

**Voice-over**
- The 43-minute recording (many retakes) was split into 708 phrases by silence, every phrase transcribed on its own,
  and aligned word-by-word to the script. For every passage the **latest take** is used; earlier takes are dropped.
- Cuts sit in silences (island edges). Three places where a retake starts mid-phrase are cut at the word boundary with a
  short fade. Pauses between takes follow the script's punctuation (sentence ≈ 0.46 s, clause ≈ 0.26 s).
- Result: 192 clips, 12 min 36 s. An independent transcription of the finished track was aligned back to the script:
  no repeated passage, no missing line.
- Enhancement (v2, `edit/ai_sr.py` + `edit/enhance2.py`): the phone recording had almost nothing above 5 kHz and a thin
  low end, so the top octaves are rebuilt with a neural bandwidth-extension model (ClearerVoice MossFormer2_SR_48K), then
  a linear-phase match-EQ pulls the long-term spectrum toward a warm, clear narration curve (chest +7–9 dB at 125–250 Hz,
  presence +8 dB, air +11 dB), followed by de-esser, gentle two-stage compression, soft saturation, limiter, −16 LUFS.
  The enhanced track was transcribed again and re-checked against the script (same words, no repeats, no gaps).
  `edit/enhance.py` is the earlier DSP-only chain.
- The speaker's own wording is kept where it differs from the script (e.g. "Surah Adh-Dhariyat ki ayat number 47",
  "jis ka tarjuma hai", "13.8 billion years"). Lines 303–304 of the script ("Woh video screen par…") were not recorded,
  so the film ends on a 14 s end screen.

**Picture** — 127 scenes in 10 parts (`film/src/scenes/a.js … j.js`), every one timed to the spoken words through
`film/cues.json`:
- Opening (first minute) is cut like a film teaser: 2.2:1 letterbox, "1917 / BERLIN" slam, strobe build into
  "Kainat ruki hui NAHI hai", and for the three promises a montage of flash-cuts taken from later scenes of the film
  (the ayah cards, the pigeons, the Nobel medal, the four doors, the elephant, Maghrib in Madinah).
- 3D (three.js): expanding/rewinding galaxy fields, the Earth with location pins (Mount Wilson 1929, Holmdel 1964,
  Makkah → Madinah), the ball that cannot hang in mid-air, the hot dense early universe, the CMB sky sphere, the
  four-doors hall, the elephant in the bedroom, the endless chain, atoms, the sky rolling up like a scroll.
- Motion graphics: Einstein's field equation and the forced Λ, the Arabic-grammar lesson (kaam vs pehchaan), ratq/fatq
  as stitched cloth that is unpicked, Hubble diagram, oscilloscope hiss, the "white dielectric material" lab report,
  TV static turning into the CMB, 0 + 0 + 0 = 0, the 100-rupee chain, the fortress that falls, recap board, end screen.
- Ayah cards: 51:47, 21:30 (both halves), 41:11, 52:35–36, 112:2, 21:104, 41:53 — Arabic injected from the verified
  Uthmani text (`film/src/quran.js`), translation lines appear on the spoken words.
- Footage and photos: NASA / ESA-Hubble / ESO clips and public-domain or CC BY photographs — see `CREDITS.md`.
- No depiction of the Prophet ﷺ, companions or scholars: the Jubayr bin Mut'im story is told with a map, dusk sky,
  palms and text; scholars appear as name plates only.

**Sound**
- Music (v2): a thriller/trailer score of 21 cues — Kevin MacLeod's "Impact" pieces and tension cues plus Scott Buckley's
  darker orchestral tracks (all CC BY 4.0), a different cue for every beat of the story (`PLAN` in `audio/mix.py`).
  The bed sits 7.5 dB under the open level while the voice speaks and comes up in every pause; the music cuts out
  completely before the biggest hits.
- 530+ sound-design hits (trailer horns, booms, whooshes, risers, ticking clock, static, door slams, chimes…)
  synthesised in `audio/sfx.py` — no samples, nothing to licence. Each hit is placed by the scene that needs it.
- Master: −14 LUFS integrated, −1 dBTP.

## Before uploading
- Paste `youtube-description-credits.txt` into the description (required by the CC BY licences).
- `subtitles_roman_urdu.srt` can be uploaded as a caption track (Roman Urdu, script wording, timed to the voice).
- The end screen has an empty 16:9 frame (left) and a circle (right) for YouTube's end-screen video and subscribe
  elements; it is labelled for Video 2 ("Aag kapde ko nahi jalati").
- On-screen labels beyond the narration are limited to names, years and sources from the script's fact sheet.

## Layout
| Path | What |
|---|---|
| `film/` | The film as a deterministic HTML page: `src/engine.js` (scenes, cues, 3D stage), `src/ui.js`, `src/kit3d.js`, `src/scenes/*.js`, `GUIDE.md` (authoring rules), render tools |
| `edit/` | Voice-over tools: silence split, per-phrase transcription, alignment, take selection (`overrides.json` = the manual decisions), assembly, enhancement, cue generation, verification |
| `audio/` | `sfx.py` (synthesiser), `mix.py` (voice + music + effects → master), `sfx.json` (effect cue list exported from the film) |
| `CREDITS.md`, `youtube-description-credits.txt`, `assets-manifest.json` | Sources and licences for every clip, photo and track |
| `subtitles_roman_urdu.srt` | Caption file |

## Rebuild
The scripts use one working directory (`S=` at the top of the shell scripts; Python scripts run from it) laid out as
`vo/` (recording), `assets/` (clips and photos named in `assets-manifest.json`), `music/wav/`, `quran/`, `film/`,
`edit/`, `audio/`. Needs Python 3 (`numpy scipy soundfile noisereduce pyloudnorm rapidfuzz pillow faster-whisper`),
Node with `playwright`, `three`, `gsap`, and `ffmpeg`.

```bash
python3 edit/vad.py                      # speech islands
python3 edit/asr_each.py 0 1             # transcribe every island on its own
python3 edit/mk_each.py && python3 edit/dp_align.py && python3 edit/select.py   # align + choose latest takes
python3 edit/assemble.py && python3 edit/ai_sr.py && python3 edit/enhance2.py && python3 edit/make_cues.py
python3 edit/verify.py                   # after transcribing vo/final.wav: repeats / gaps report
cd film && node check.js && node export_sfx.js && cd .. && python3 audio/mix.py
cd film && ./render_all.sh 0 769.65 film 4 30 && ./finish.sh ../out/film_video.mp4 ../audio/master.wav ../out/final.mp4 21
```

Rendering is frame-by-frame in headless Chromium (software WebGL): about 1.5–2 hours for the whole film on 4 cores.
