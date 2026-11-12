#!/usr/bin/env python3
"""Synthesised soundtrack for the MOM30 short: SFX + music + 'talking blips' per dialogue line.
No voices here - run mom30_voice.py (ElevenLabs) to add real speech on top.
Usage: python3 mom30_audio.py out.wav"""
import json, sys, wave
import numpy as np
SR = 44100
D = json.load(open(__import__('os').path.join(__import__('os').path.dirname(__file__), 'dialogue.json')))
DUR = D['duration']
rng = np.random.default_rng(7)
N = int(DUR * SR) + SR
sfx = np.zeros(N); mus = np.zeros(N); talk = np.zeros(N)

def add(buf, t, sig, g=1.0):
    i = int(t * SR); j = min(N, i + len(sig))
    if i < N and j > i: buf[i:j] += sig[:j - i] * g
def tone(f, d, shape='sq', att=0.004, rel=0.05, vib=0):
    t = np.arange(int(d * SR)) / SR
    ph = 2 * np.pi * (f * t + (vib * np.sin(2 * np.pi * 6 * t) / 6 if vib else 0))
    w = np.sign(np.sin(ph)) * 0.6 + np.sin(ph) * 0.4 if shape == 'sq' else np.sin(ph) if shape == 'sin' else 2 * (ph / (2 * np.pi) % 1) - 1
    env = np.minimum(1, t / att) * np.minimum(1, np.maximum(0, (d - t) / rel))
    return w * env
def sweep(f0, f1, d, g=1.0, shape='sin'):
    t = np.arange(int(d * SR)) / SR; f = f0 + (f1 - f0) * (t / d); ph = 2 * np.pi * np.cumsum(f) / SR
    w = np.sin(ph) if shape == 'sin' else np.sign(np.sin(ph)); env = np.minimum(1, t / 0.005) * np.minimum(1, (d - t) / 0.03)
    return w * env * g
def noise(d, lp=0.2):
    n = rng.standard_normal(int(d * SR)); out = np.zeros_like(n); a = 0
    for i in range(len(n)): a += lp * (n[i] - a); out[i] = a
    return out
def decay(sig, k): t = np.arange(len(sig)) / SR; return sig * np.exp(-k * t)

# ---- talking blips (voice stand-in)
base = {'mom': 250, 'hero': 340, 'bro': 470}
for L in D['lines']:
    f0 = base[L['who']]; t = L['t0']; words = L['text'].split(); per = (L['t1'] - L['t0']) / max(1, len(words)) 
    for w in words:
        nsyl = max(1, min(3, round(len(w) / 4))); st = per / nsyl
        for s in range(nsyl):
            f = f0 * (1 + rng.uniform(-0.18, 0.28)) * (1.12 if w.endswith(('!', '?')) else 1)
            add(talk, t + s * st, tone(f, min(0.1, st * 0.8), 'sq', rel=0.03), 0.16)
        t += per
    add(sfx, L['t0'] - 0.02, sweep(500, 900, 0.07, 0.25))        # bubble pop

# ---- SFX
add(sfx, 0.0, decay(noise(0.5, 0.03), 7) * 3.0)                          # door whoosh
for t in [5.0, 6.2, 6.55, 6.9]: add(sfx, t, tone(1800, 0.07, 'sq'), 0.22)   # microwave buttons
add(sfx, 8.2, sweep(300, 900, 0.25, 0.4))                                # start
hum_t = np.arange(int((32.2 - 8.2) * SR)) / SR
hum = (np.sin(2 * np.pi * 100 * hum_t) + 0.6 * np.sin(2 * np.pi * 150 * hum_t)) * (0.75 + 0.25 * np.sin(2 * np.pi * 7 * hum_t))
hum *= np.minimum(1, (hum_t[-1] - hum_t) / 0.08) * (0.05 + 0.10 * np.clip((hum_t - 18) / 14, 0, 1))
add(sfx, 8.2, hum)
for t in list(np.arange(9.9, 15.4, 0.78)) + list(np.arange(15.6, 17.4, 0.45)) + list(np.arange(24.0, 30.0, 0.7)): add(sfx, t, sweep(300, 760, 0.16, 0.22, 'sq'))  # jump boings
for t in [14.0, 25.6]: add(sfx, t, decay(sweep(200, 90, 0.4, 0.4), 4))                             # lava-bar whoosh
add(sfx, 22.0, decay(sweep(180, 60, 0.4, 0.8), 8) + decay(noise(0.4, 0.1), 12) * 1.5)             # BONK
add(sfx, 30.4, decay(sweep(150, 120, 0.5, 0.2), 3))                                                  # chest creak
for i, f in enumerate([880, 1175, 1568, 1760, 2349]): add(sfx, 30.6 + i * 0.07, decay(tone(f, 0.4, 'sin'), 6), 0.3)  # sparkle
for k in range(18): add(sfx, 30.7 + k * 0.08 + rng.uniform(0, 0.04), decay(tone(1500 + rng.uniform(0, 900), 0.15, 'sin'), 18), 0.18)  # coins
for i, f in enumerate([1568, 1568, 1568]): add(sfx, 32.0 + i * 0.0, decay(tone(f * (1 + i * 0.5), 1.6, 'sin', rel=0.5), 2.0), 0.35)  # DING
add(sfx, 32.0, np.zeros(1))
add(sfx, 34.2, decay(noise(0.2, 0.3), 18) * 1.5)                                                       # bite crunch
add(sfx, 34.7, sweep(1200, 1700, 0.25, 0.3))                                                           # ouch squeak
for k in range(10): add(sfx, 35.8 + k * 0.04, decay(tone(2400 + 300 * k, 0.2, 'sin'), 14), 0.15)       # ice tinkle
add(sfx, 38.6, tone(1800, 0.07, 'sq'), 0.22); add(sfx, 38.9, tone(1800, 0.07, 'sq'), 0.22); add(sfx, 39.0, sweep(300, 900, 0.25, 0.4))
add(sfx, 41.6, sweep(400, 900, 0.18, 0.3)); add(sfx, 44.7, decay(tone(1568, 0.5, 'sin'), 4), 0.3); add(sfx, 44.8, decay(tone(2093, 0.6, 'sin'), 4), 0.3)
hum2_t = np.arange(int((DUR - 39.0) * SR)) / SR; add(sfx, 39.0, (np.sin(2 * np.pi * 100 * hum2_t) + 0.6 * np.sin(2 * np.pi * 150 * hum2_t)) * 0.05 * (0.75 + 0.25 * np.sin(2 * np.pi * 7 * hum2_t)))

# ---- music: 130 bpm chiptune (bass + arpeggio), tense minor for the timer section, major at the end
bpm = 130; beat = 60 / bpm
def chord_notes(root, minor=True): return [root, root * (1.1892 if minor else 1.2599), root * 1.4983]
prog_minor = [110, 87.31, 98, 82.41]; prog_major = [130.81, 98, 110, 87.31]
t = 0.0; bar = 0
while t < DUR:
    sec = 'in' if t < 8.2 else 'tense' if t < 33 else 'fun'
    gain = {'in': 0.07, 'tense': 0.10, 'fun': 0.08}[sec]; root = (prog_major if sec == 'fun' else prog_minor)[bar % 4]
    notes = chord_notes(root * 2, sec != 'fun')
    for b in range(4):
        add(mus, t + b * beat, tone(root, beat * 0.9, 'tri', rel=0.1), gain * 1.4)
        steps = 4 if sec == 'tense' else 2
        for s in range(steps): add(mus, t + b * beat + s * beat / steps, tone(notes[(b * steps + s) % 3] * 2, beat / steps * 0.8, 'sq', rel=0.04), gain * 0.7)
        if sec == 'tense': add(mus, t + b * beat, decay(noise(0.06, 0.5), 40) * 0.6, gain)
    t += 4 * beat; bar += 1

import os
mix = sfx * 0.9 + mus + (0 if os.environ.get("NOBLIPS") else talk)
mix[int(DUR * SR):] = 0
fade = np.minimum(1, np.maximum(0, (DUR - np.arange(N) / SR) / 0.8)); mix *= fade
mix = np.tanh(mix * 1.2) * 0.9
out = (mix[:int(DUR * SR)] * 32000).astype(np.int16)
with wave.open(sys.argv[1], 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print('ok', len(out) / SR, 's')
