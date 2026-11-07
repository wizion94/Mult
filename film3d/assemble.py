#!/usr/bin/env python3
"""assemble.py FINALDIR OUT.mp4  - builds the global 60fps frame sequence (symlinks), muxes with the AAC mix.
Video: 1920x1080, 60 fps, H.264 (libx264), yuv420p. Audio: AAC from audio/mix.wav loudnorm'd to -16 LUFS, trimmed to the exact video length."""
import os, sys, json, subprocess
FINAL, OUT = sys.argv[1], sys.argv[2]
FPS = 60
SC = [('s1', 34.0), ('s2', 47.5), ('s3', 82.8), ('s4', 41.1), ('s5', 132.6), ('s6', 38.4)]
seq = os.path.join(FINAL, 'seq'); os.makedirs(seq, exist_ok=True)
g = 0; missing = []
for sc, d in SC:
    n = int(round(d * FPS))
    for i in range(n):
        src = os.path.join(FINAL, sc, f'{i:06d}.jpg'); dst = os.path.join(seq, f'{g:06d}.jpg')
        if not os.path.exists(src): missing.append((sc, i))
        if os.path.lexists(dst): os.remove(dst)
        os.symlink(src, dst); g += 1
print('total frames', g, 'missing', len(missing))
if missing: print(missing[:10]); sys.exit(1)
dur = g / FPS
cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', f'{seq}/%06d.jpg', '-i', 'audio/mix.wav',
       '-map', '0:v', '-map', '1:a', '-t', f'{dur:.6f}',
       '-vf', 'format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-r', str(FPS), '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
       '-af', f'atrim=0:{dur:.6f},asetpts=PTS-STARTPTS,loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-19.8:measured_TP=-1.9:measured_LRA=7.1:measured_thresh=-30.0:linear=true,aresample=48000',
       '-c:a', 'aac', '-b:a', '192k', OUT]
print(' '.join(cmd)); subprocess.run(cmd, check=True); print('wrote', OUT)
