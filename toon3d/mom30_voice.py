#!/usr/bin/env python3
"""Adds real speech (ElevenLabs TTS) to the MOM30 short.

  export ELEVENLABS_API_KEY=...        # never commit the key
  python3 mom30_voice.py silent.mp4 mom30_sfx.wav out_voiced.mp4

Reads dialogue.json (same file the animation uses), synthesises each line, speeds a line up with ffmpeg
atempo if it is longer than its slot, places it at t0, mixes with the SFX/music track and muxes onto the video.
Edit VOICES to change who sounds like whom (IDs are ElevenLabs voice IDs from your voice library)."""
import json, os, subprocess, sys, tempfile, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__))
VOICES = {'mom': '21m00Tcm4TlvDq8ikWAM',   # Rachel (adult woman)
          'hero': 'TxGEqnHWrfWFTfGW9XjX',  # Josh   (young male)
          'bro': 'jBpfuIE2acCO8z3wKNLl'}   # Gigi   (high, childish)
MODEL = 'eleven_turbo_v2_5'
SETTINGS = {'stability': 0.35, 'similarity_boost': 0.75, 'style': 0.6}  # expressive

def tts(text, voice, path, key):
    req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128',
        data=json.dumps({'text': text, 'model_id': MODEL, 'voice_settings': SETTINGS}).encode(),
        headers={'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'})
    with urllib.request.urlopen(req, timeout=60) as r, open(path, 'wb') as f: f.write(r.read())
def dur(path):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]).decode())

video, sfx, out = sys.argv[1:4]
key = os.environ['ELEVENLABS_API_KEY']
D = json.load(open(os.path.join(HERE, 'dialogue.json')))
tmp = tempfile.mkdtemp(); inputs = ['-i', video, '-i', sfx]; filt = []; labels = ['[1:a]volume=0.8']
labels = ['[sfx]']; filt.append('[1:a]volume=0.8[sfx]')
for i, L in enumerate(D['lines']):
    mp3 = f'{tmp}/{L["id"]}.mp3'; tts(L['text'], VOICES[L['who']], mp3, key)
    nxt = D['lines'][i + 1]['t0'] if i + 1 < len(D['lines']) else 1e9
    slot = min(L['t1'] - L['t0'] + 0.35, nxt - L['t0'] - 0.05); d = dur(mp3); tempo = min(1.6, max(1.0, d / slot))
    inputs += ['-i', mp3]; ms = int(L['t0'] * 1000)
    filt.append(f'[{i + 2}:a]atempo={tempo:.3f},adelay={ms}|{ms},volume=1.6[v{i}]'); labels.append(f'[v{i}]')
    print(L['id'], f'{d:.2f}s -> tempo {tempo:.2f}')
filt.append(''.join(labels) + f'amix=inputs={len(labels)}:normalize=0,alimiter=limit=0.95[a]')
subprocess.check_call(['ffmpeg', '-y', *inputs, '-filter_complex', ';'.join(filt), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', out])
print('wrote', out)
