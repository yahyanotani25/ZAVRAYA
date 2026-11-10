"""Render the full reel: soundtrack, 4 parallel picture segments, concat, mux,
then encode the delivery files.

usage:
  python build.py RAW_CLIPS_DIR [OUT_DIR]           full build
  python build.py --deliver-only MASTER_CLEAN MASTER_WM [OUT_DIR]
  python build.py --rewatermark MASTER_CLEAN [OUT_DIR]   only rebuild the previews
                                                         with the current watermark

Outputs (OUT_DIR, default ../deliverables):
  SouqUmmBesher_Reel_CLEAN_1080x1920.mp4        final for the client (after payment)
  SouqUmmBesher_Reel_PREVIEW_HMS.mp4            HMS Digital watermarked preview
  SouqUmmBesher_Reel_PREVIEW_HMS_WhatsApp.mp4   light 720p preview for WhatsApp

Set REEL_WORK to choose the scratch directory (default: a new temp dir).
"""
import os
import subprocess
import sys
import tempfile

import timeline as T

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
COLOR = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
         '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart']


def run(cmd, **kw):
    print('+', ' '.join(cmd[:6]), '...', flush=True)
    subprocess.run(cmd, check=True, **kw)


def two_pass(src, dst, work, tag, bitrate, maxrate, bufsize, vf=None, audio=('-c:a', 'copy')):
    log = os.path.join(work, f'pass_{tag}')
    base = ['ffmpeg', '-v', 'error', '-y', '-i', src] + (['-vf', vf] if vf else []) + \
        ['-c:v', 'libx264', '-preset', 'slow', '-b:v', bitrate, '-maxrate', maxrate, '-bufsize', bufsize,
         '-passlogfile', log] + COLOR
    run(base + ['-pass', '1', '-an', '-f', 'null', os.devnull])
    run(base + ['-pass', '2'] + list(audio) + [dst])


def deliver(master_clean, master_wm, out, work, clean=True):
    os.makedirs(out, exist_ok=True)
    if clean:
        two_pass(master_clean, os.path.join(out, 'SouqUmmBesher_Reel_CLEAN_1080x1920.mp4'), work, 'c',
                 '14M', '20M', '28M')
    two_pass(master_wm, os.path.join(out, 'SouqUmmBesher_Reel_PREVIEW_HMS.mp4'), work, 'w',
             '8M', '12M', '16M')
    two_pass(master_wm, os.path.join(out, 'SouqUmmBesher_Reel_PREVIEW_HMS_WhatsApp.mp4'), work, 'wa',
             '2300k', '3500k', '4600k', vf='scale=720:1280:flags=lanczos', audio=('-c:a', 'aac', '-b:a', '128k'))


def main():
    work = os.environ.get('REEL_WORK') or tempfile.mkdtemp(prefix='reel_')
    os.makedirs(work, exist_ok=True)
    if sys.argv[1] == '--rewatermark':
        # watermark is the last layer of the frame, so overlaying it on the clean
        # master gives the same picture as a full re-render
        master_clean = sys.argv[2]
        out = os.path.abspath(sys.argv[3] if len(sys.argv) > 3 else os.path.join(ROOT, 'deliverables'))
        png = os.path.join(work, 'watermark.png')
        run([sys.executable, os.path.join(HERE, 'render.py'), '--watermark-png', png], cwd=HERE)
        master_wm = os.path.join(work, 'master_wm.mp4')
        run(['ffmpeg', '-v', 'error', '-y', '-i', master_clean, '-i', png, '-filter_complex',
             '[0:v][1:v]overlay=0:0:format=auto,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium',
             '-crf', '12'] + COLOR + ['-c:a', 'copy', master_wm])
        deliver(master_clean, master_wm, out, work, clean=False)
        return
    if sys.argv[1] == '--deliver-only':
        out = os.path.abspath(sys.argv[4] if len(sys.argv) > 4 else os.path.join(ROOT, 'deliverables'))
        deliver(sys.argv[2], sys.argv[3], out, work)
        return
    raw = os.path.abspath(sys.argv[1])
    out = os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'deliverables'))
    audio = os.path.join(ROOT, 'assets', 'audio', 'soundtrack.wav')
    run([sys.executable, os.path.join(HERE, 'audio.py'), audio], cwd=HERE)

    bounds = [0, 330, 660, 975, T.NFRAMES]   # split on shot boundaries
    procs = []
    for k in range(len(bounds) - 1):
        log = open(os.path.join(work, f'seg{k}.log'), 'w')
        procs.append(subprocess.Popen([sys.executable, os.path.join(HERE, 'render.py'), raw,
                                       os.path.join(work, f'seg{k}'), str(bounds[k]), str(bounds[k + 1])],
                                      cwd=HERE, stderr=log))
    for p in procs:
        if p.wait() != 0:
            sys.exit(f'segment render failed, see logs in {work}')

    masters = {}
    for kind in ('clean', 'wm'):
        lst = os.path.join(work, f'{kind}.txt')
        with open(lst, 'w') as fh:
            for k in range(len(bounds) - 1):
                fh.write(f"file '{os.path.join(work, f'seg{k}_{kind}.mp4')}'\n")
        vid = os.path.join(work, f'{kind}_video.mp4')
        run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', vid])
        masters[kind] = os.path.join(work, f'master_{kind}.mp4')
        run(['ffmpeg', '-v', 'error', '-y', '-i', vid, '-i', audio, '-map', '0:v', '-map', '1:a',
             '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest',
             '-movflags', '+faststart', masters[kind]])
    deliver(masters['clean'], masters['wm'], out, work)
    print('done ->', out, '(masters in', work + ')')


if __name__ == '__main__':
    main()
