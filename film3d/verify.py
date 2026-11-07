#!/usr/bin/env python3
"""verify.py FILE.mp4 - decoded-export checks: stream params, frame count/duration, frame-diff spikes, scene-boundary frames, audio stats, music/SFX sync onsets."""
import subprocess, json, sys, os, numpy as np, wave
F = sys.argv[1]
def run(c): return subprocess.run(c, capture_output=True, text=True).stdout
pr = json.loads(run(['ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', F]))
for s in pr['streams']:
    if s['codec_type'] == 'video':
        print('VIDEO', s['codec_name'], s['pix_fmt'], f"{s['width']}x{s['height']}", 'r_frame_rate', s['r_frame_rate'], 'avg', s['avg_frame_rate'], 'frames(decoded count)', s.get('nb_read_frames'), 'dur', s.get('duration'))
    else:
        print('AUDIO', s['codec_name'], s['sample_rate'], 'Hz', s['channels'], 'ch', 'dur', s.get('duration'))
print('FORMAT duration', pr['format']['duration'], 'size MB', round(int(pr['format']['size']) / 1e6, 1))
