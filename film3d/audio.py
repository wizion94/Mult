#!/usr/bin/env python3
"""Synthesises the score + sound design for 'The Mug Can Wait' from the scene timelines.
Output: audio/mix.wav (stereo 44.1k) and audio/events.json (accent map).
Everything is generated offline with numpy; no samples are used."""
import numpy as np, json, math, wave, os, sys
SR = 44100
SCENES = [('s1', 0.0), ('s2', 34.0), ('s3', 81.5), ('s4', 164.3), ('s5', 205.4), ('s6', 338.0)]
TOTAL = 376.4
TAIL = 2.0
N = int((TOTAL + TAIL) * SR)
rng = np.random.default_rng(7)
os.makedirs('audio', exist_ok=True)

mus = np.zeros((2, N), np.float32); sfx = np.zeros((2, N), np.float32)
def tvec(d): return np.arange(int(d * SR)) / SR
def add(buf, sig, t0, pan=0.0, gain=1.0):
    i = int(round(t0 * SR));
    if i >= N or i + len(sig) <= 0: return
    a = max(0, -i); b = min(len(sig), N - i); s = sig[a:b] * gain
    gl = math.cos((pan + 1) * math.pi / 4); gr = math.sin((pan + 1) * math.pi / 4)
    buf[0, i + a:i + b] += (s * gl).astype(np.float32); buf[1, i + a:i + b] += (s * gr).astype(np.float32)
def midi(m): return 440.0 * 2 ** ((m - 69) / 12)

# ------------------------------------------------------------------ instruments
def pad(ms, dur, amp=0.1, att=1.6, rel=2.2):
    t = tvec(dur + rel); y = np.zeros_like(t)
    for m in ms:
        f = midi(m)
        for det in (-0.35, 0.0, 0.35):
            y += np.sin(2 * np.pi * (f + det) * t) + 0.3 * np.sin(2 * np.pi * 2 * (f + det) * t + 0.4) + 0.08 * np.sin(2 * np.pi * 3 * f * t)
    e = np.minimum(t / att, 1.0) * np.clip((dur + rel - t) / rel, 0, 1)
    y *= e * (1 + 0.06 * np.sin(2 * np.pi * 0.22 * t)) * amp / (len(ms) * 2.2)
    return y
def epiano(m, dur=1.8, amp=0.12):
    t = tvec(dur); f = midi(m); I = 1.6 * np.exp(-t * 3.2)
    y = np.sin(2 * np.pi * f * t + I * np.sin(2 * np.pi * f * 2 * t)) * np.exp(-t * 2.0)
    y += 0.25 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 7) + 0.1 * np.sin(2 * np.pi * f * 0.5 * t) * np.exp(-t * 1.2)
    return y * amp * np.minimum(t / 0.004, 1)
def bass(m, dur=3.8, amp=0.16):
    t = tvec(dur); f = midi(m); y = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)
    return y * amp * np.minimum(t / 0.05, 1) * np.clip((dur - t) / 0.8, 0, 1) * (0.55 + 0.45 * np.exp(-t * 0.5))
def bell(f, dur=2.2, amp=0.1, dec=2.0):
    t = tvec(dur); y = np.zeros_like(t)
    for r, a, d in [(1, 1, dec), (2.76, 0.5, dec * 1.6), (5.4, 0.25, dec * 2.4), (8.93, 0.12, dec * 3.4)]:
        y += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * d)
    return y * amp * np.minimum(t / 0.002, 1)

# ------------------------------------------------------------------ score
CH = {  # name: (bass midi, pad midi, arp pool)
 'Dmaj7': (38, [57, 61, 64, 66], [62, 66, 69, 73]), 'Bm7': (35, [54, 57, 62, 64], [59, 62, 66, 69]), 'Gmaj7': (43, [54, 59, 62, 66], [59, 62, 66, 71]),
 'A6': (45, [52, 57, 61, 66], [57, 61, 64, 69]), 'Bm9': (35, [54, 57, 61, 64], [59, 62, 66, 73]), 'D/F#': (42, [57, 62, 66, 69], [62, 66, 69, 74]),
 'Asus': (45, [52, 57, 62, 64], [57, 62, 64, 69]), 'Em7': (40, [55, 59, 62, 67], [59, 62, 67, 71]), 'Dmaj9': (38, [57, 61, 64, 69], [62, 66, 69, 76]),
 'Bm': (35, [54, 59, 62, 66], [59, 62, 66, 71]), 'F#sus': (42, [54, 59, 61, 66], [59, 61, 66, 71]), 'Em': (40, [52, 55, 59, 64], [55, 59, 64, 67]),
 'G': (43, [55, 59, 62, 67], [59, 62, 67, 71]), 'Fm': (41, [56, 60, 63, 68], [60, 63, 68, 72]),
}
MOTIF = [78, 81, 76, 74]  # F# A E D
PLAN = {  # scene -> dict(prog, step, pattern, pad_amp, arp_amp, bass, dyn)
 's1': dict(prog=['Dmaj7', 'Bm7', 'Gmaj7', 'A6'], step=0.5, pad=0.9, arp=0.9, bass=1.0, motif=True),
 's2': dict(prog=['Bm9', 'Gmaj7', 'D/F#', 'Asus'], step=0.5, pad=0.8, arp=0.85, bass=1.0, motif=False),
 's3': dict(prog=['Dmaj9', 'Em7', 'Bm7', 'A6'], step=0.25, pad=0.5, arp=0.9, bass=0.7, motif=False),
 's4': dict(prog=['Bm', 'G', 'Em', 'F#sus'], step=2.0, pad=0.55, arp=1.0, bass=0.6, motif=False),
 's5': dict(prog=['Gmaj7', 'D/F#', 'Em7', 'Dmaj7'], step=0.5, pad=1.0, arp=0.9, bass=1.0, motif=True),
 's6': dict(prog=['Dmaj7', 'Bm7', 'Gmaj7', 'A6'], step=0.5, pad=1.0, arp=0.9, bass=1.0, motif=True),
}
def dyn(sc, tl):
    """scene dynamic multiplier 0..1 by local time"""
    D = {'s1': 34, 's2': 47.5, 's3': 82.8, 's4': 41.1, 's5': 132.6, 's6': 38.4}[sc]
    x = tl / D
    if sc == 's1': return 0.55 + 0.45 * min(1, tl / 8)
    if sc == 's4': return 0.85 - 0.55 * x
    if sc == 's5': return 0.65 + 0.35 * min(1, x * 2)
    if sc == 's6': return 0.9
    return 0.8
def score():
    ev = []
    for sc, off in SCENES:
        P = PLAN[sc]; D = json.load(open(sc + '.json'))['meta']['duration']; nb = int(math.ceil(D / 4.0))
        for b in range(nb):
            t0 = off + b * 4.0; ch = P['prog'][b % 4]; bm, pm, arp = CH[ch]; dl = min(4.0, D - b * 4.0); g = dyn(sc, b * 4.0)
            add(mus, pad(pm, dl + 0.2, 0.11 * P['pad'] * g), t0, 0.0)
            add(mus, bass(bm, min(dl + 0.2, 4.0), 0.15 * P['bass'] * g), t0, 0.0)
            st = P['step']; k = 0; tt = 0.0
            pattern = [0, 1, 2, 3, 2, 1] if st < 1 else [3]
            while tt < dl - 0.01:
                idx = pattern[k % len(pattern)]
                if sc == 's3': idx = [0, 2, 1, 3, 2, 1, 3, 2][k % 8]
                if sc == 's4': idx = [3, 2, 1, 0][(b + k) % 4]
                if rng.random() < (0.9 if sc != 's4' else 0.7):
                    add(mus, epiano(arp[idx], 1.6 if st > 0.3 else 0.9, 0.09 * P['arp'] * g * (0.7 + 0.3 * rng.random())), t0 + tt, (idx - 1.5) * 0.25)
                tt += st; k += 1
            if P['motif'] and b % 2 == 1 and sc in ('s1', 's5', 's6'):
                for i, mnote in enumerate(MOTIF):
                    if tt >= 0 and i * 1.0 < dl: add(mus, epiano(mnote + (0 if ch not in ('Gmaj7', 'Em7') else 0), 2.2, 0.13 * g), t0 + i * 1.0, 0.3)
    # accents: bright chord bells on key visual events (map appended from sfx events)
    return ev

# ------------------------------------------------------------------ SFX
def lp_noise(d, tau):
    n = rng.standard_normal(int(d * SR)); k = np.exp(-np.arange(max(8, int(6 * tau * SR))) / (tau * SR)); k /= k.sum(); return np.convolve(n, k, 'same')
def step(g=1.0):
    t = tvec(0.09); y = lp_noise(0.09, 0.0035) * np.exp(-t * 55) * 3.2 + 0.6 * np.sin(2 * np.pi * 105 * t) * np.exp(-t * 38); return y * 0.5 * g
def thud():
    t = tvec(0.5); f = 95 - 40 * np.minimum(t / 0.3, 1); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11) + lp_noise(0.5, 0.006) * np.exp(-t * 14) * 3; return y * 0.55
def rustle(d=0.5):
    t = tvec(d); return lp_noise(d, 0.0009) * np.sin(np.pi * np.minimum(t / d, 1)) ** 1.5 * 0.55
def pop(f=520, g=1.0):
    t = tvec(0.14); fr = f * (1 + 1.1 * np.minimum(t / 0.06, 1)); return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 28) * 0.28 * g
def pop_down(f=700):
    t = tvec(0.14); fr = f * (1 - 0.5 * np.minimum(t / 0.1, 1)); return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 26) * 0.18
def whoosh(d=0.9):
    t = tvec(d); a = lp_noise(d, 0.0012); b = lp_noise(d, 0.012); w = np.sin(np.pi * np.minimum(t / d, 1)) ** 2; mixv = np.minimum(t / d, 1)
    return (a * (1 - mixv) + b * mixv * 2.5) * w * 0.6
def tick(g=1.0):
    t = tvec(0.03); return (np.sin(2 * np.pi * 3100 * t) * np.exp(-t * 180) + 0.3 * rng.standard_normal(len(t)) * np.exp(-t * 250)) * 0.14 * g
def typec():
    t = tvec(0.02); return (np.sin(2 * np.pi * (1800 + rng.random() * 700) * t) * np.exp(-t * 300)) * 0.1
def flip():
    t = tvec(0.16); return lp_noise(0.16, 0.0007) * np.exp(-t * 20) * 1.8 * 0.4
def buzz(d=0.5):
    t = tvec(d); y = np.sign(np.sin(2 * np.pi * 148 * t)) * 0.5 + np.sin(2 * np.pi * 296 * t) * 0.3; am = (np.sin(2 * np.pi * 26 * t) > 0) * 1.0; return y * am * np.minimum(t / 0.01, 1) * np.clip((d - t) / 0.05, 0, 1) * 0.2
def knock():
    t = tvec(0.25); y = np.zeros_like(t)
    for o in (0.0, 0.11):
        i = int(o * SR); tt = t[: len(t) - i]; y[i:] += np.sin(2 * np.pi * 180 * tt) * np.exp(-tt * 38) * 0.6
    return y * 0.5
def ring(d=2.4):
    out = np.zeros(int(d * SR) + SR // 2)
    for i in range(int(d / 0.25)):
        for o in (0.0, 0.07):
            b = bell(1850, 0.35, 0.16, 9.0); j = int((i * 0.25 + o) * SR); out[j:j + len(b)] += b[: len(out) - j]
    return out
def bellring(d=4.8):
    out = np.zeros(int(d * SR) + 2 * SR)
    for i in range(int(d / 0.38)):
        b = bell(523.3, 2.0, 0.22 * (1 - 0.5 * i / (d / 0.38)), 2.3); j = int(i * 0.38 * SR); out[j:j + len(b)] += b[: len(out) - j]
    return out
def exhale(d=1.6):
    t = tvec(d); return lp_noise(d, 0.0018) * np.sin(np.pi * np.minimum(t / d, 1)) ** 1.4 * 0.4
def swell(d=1.2, f=220):
    t = tvec(d); return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 1.5 * t)) * np.sin(np.pi * np.minimum(t / d, 1)) ** 2 * 0.12
def rise(d=1.5, f0=300, f1=900, a=0.1):
    t = tvec(d); f = f0 + (f1 - f0) * (t / d) ** 1.5; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * np.minimum(t / d, 1)) ** 1.5 * a
def sparkle(ms=(81, 85, 88, 93), gap=0.09):
    out = np.zeros(int(1.8 * SR))
    for i, m in enumerate(ms):
        b = bell(midi(m), 1.3, 0.1, 3.2); j = int(i * gap * SR); out[j:j + len(b)] += b[: len(out) - j]
    return out
def tvon():
    c = np.zeros(int(2.2 * SR)); t = tvec(0.05); c[: len(t)] += np.sin(2 * np.pi * 1200 * t) * np.exp(-t * 90) * 0.3
    for i, m in enumerate((74, 78, 81, 86)):
        b = bell(midi(m), 2.0, 0.09, 1.7); j = int((0.06 + i * 0.06) * SR); c[j:j + len(b)] += b[: len(c) - j]
    return c
def lowswell(d=2.6):
    t = tvec(d); return (np.sin(2 * np.pi * 73.4 * t) + 0.5 * np.sin(2 * np.pi * 110 * t)) * np.sin(np.pi * np.minimum(t / d, 1)) ** 2 * 0.2
def click(g=1.0):
    t = tvec(0.02); return np.sin(2 * np.pi * 900 * t) * np.exp(-t * 200) * 0.12 * g
def ratchet(d=0.4):
    out = np.zeros(int(d * SR) + 400)
    for i in range(int(d / 0.05)):
        j = int(i * 0.05 * SR); t = tvec(0.012); out[j:j + len(t)] += np.sin(2 * np.pi * 1400 * t) * np.exp(-t * 400) * 0.08
    return out

def ptypes(sc):
    j = json.load(open(sc + '.json')); m = {}
    def rec(p):
        if 'id' in p: m[p['id']] = p['type']
        for c in p.get('children', []): rec(c)
    for p in j['set']['props']: rec(p)
    return j, m

def sound_design():
    events = []
    def ev(t, kind, **kw): events.append({'t': round(t, 3), 'kind': kind, **kw})
    for sc, off in SCENES:
        j, pt = ptypes(sc); acts = [a for a in j['timeline'] if a['who'] != 'CAMERA' and a['who'] != 'POST']; actors = set(j.get('actors', {}))
        # camera whooshes (fast moves)
        cam = [a for a in j['timeline'] if a['who'] == 'CAMERA'][0]['keys']
        for k0, k1 in zip(cam, cam[1:]):
            dt = k1['t'] - k0['t']; dist = math.dist(k0['pos'], k1['pos'])
            if dt > 0.05 and dist / dt > 3.2 and dist > 2.0: ev(off + k0['t'] + dt * 0.25, 'whoosh', d=min(1.1, dt * 0.8), g=min(1.2, dist / dt / 6))
        for a in acts:
            t = off + a['t']; d = a.get('dur', 0.0) or 0.0; who = a['who']; do = a['do']; ty = pt.get(who, '')
            if who in actors:
                if do == 'walk_to':
                    n = max(1, int(d / 0.52)); [ev(t + 0.18 + i * 0.52, 'step', g=0.8 + 0.2 * (i % 2)) for i in range(n)]
                elif do == 'sit': ev(t + d * 0.85, 'thud')
                elif do == 'stand_up': ev(t + d * 0.05, 'rustle'); ev(t + d * 0.95, 'step')
                elif do == 'hop': ev(t + d * 0.92, 'step', g=1.2)
                elif do == 'nod': ev(t + 0.05, 'click')
                elif do == 'elev': ev(t + 0.1, 'whoosh', d=0.7, g=0.5); ev(t + d * 0.95, 'thud')
                continue
            if do == 'attach': ev(t, 'click')
            elif do == 'detach': ev(t, 'click', g=0.7)
            elif do == 'alarm' and a.get('to', 0) >= 0.4:
                if ty == 'mug': ev(t, 'chime', f=1318)
                elif ty == 'phone': ev(t, 'buzz', d=0.55); ev(t + 0.7, 'buzz', d=0.45)
                elif ty == 'box': ev(t, 'knock'); ev(t + 0.5, 'knock')
                elif ty == 'timer':
                    nxt = [x for x in acts if x['who'] == who and x['do'] == 'alarm' and x['t'] > a['t']]; e = (nxt[0]['t'] if nxt else a['t'] + 2.4) - a['t']; ev(t, 'ring', d=min(2.6, e))
                elif ty == 'bell':
                    nxt = [x for x in acts if x['who'] == who and x['do'] == 'alarm' and x['t'] > a['t']]; e = (nxt[0]['t'] if nxt else a['t'] + 4.8) - a['t']; ev(t, 'bellring', d=min(5.0, e))
                elif ty == 'tv': ev(t, 'tvon')
                elif ty == 'checklist': ev(t, 'chime', f=1568)
                elif ty == 'relief': ev(t, 'exhale')
            elif do == 'appear':
                if ty == 'sun': ev(t, 'rise', d=1.6, f0=330, f1=740, a=0.07)
                elif ty == 'envelope': ev(t, 'chime', f=1568)
                elif ty == 'cloud': ev(t, 'lowswell', d=2.4)
                elif who == 'diagram': ev(t, 'sparkle')
                elif ty == 'balloon': ev(t, 'rise', d=1.2, f0=260, f1=620, a=0.08)
                elif ty in ('gear', 'group') and who in ('gears',): ev(t, 'pop', f=420)
                else: ev(t, 'pop', f=420 + (hash(who) % 7) * 45, g=0.8)
            elif do == 'disappear': ev(t, 'pop_down')
            elif do == 'tone' and a.get('to', 0) > 0.5: ev(t, 'swell', d=1.0, f=196)
            elif do == 'prog':
                to = a.get('to', 1)
                if ty == 'calendar': [ev(t + i * d / 7.0, 'flip') for i in range(7)]
                elif ty == 'label': [ev(t + i * 0.075, 'type') for i in range(int(max(d, 0.4) / 0.075))]
                elif ty == 'browser': [ev(t + i * d / 9.0, 'pop', f=500 + 40 * i, g=0.5) for i in range(8)]
                elif ty == 'bars': ev(t, 'rise', d=d, f0=200, f1=520, a=0.08)
                elif ty == 'checklist': [ev(t + (i + 1) * d / 3.2, 'tick', g=1.5) for i in range(3)]
                elif ty == 'wave': ev(t, 'rise', d=d, f0=240, f1=600, a=0.07)
                elif ty == 'gear': ev(t, 'ratchet', d=min(d, 3.0))
                elif ty == 'timer': ev(t, 'tick')
                elif ty == 'tv' and to >= 1: pass
    # clock / timer ticks
    for i in range(0, 8): ev(i + 0.5, 'tick', g=0.8)
    for i in range(int(205.4 + 11.5), int(205.4 + 110)): ev(i + 0.0, 'tick', g=0.45)
    events.sort(key=lambda e: e['t'])
    for e in events:
        t = e['t']; k = e['kind']; pan = float(np.clip(rng.normal(0, 0.25), -0.6, 0.6))
        if k == 'step': add(sfx, step(e.get('g', 1)), t, pan)
        elif k == 'thud': add(sfx, thud(), t, 0.0)
        elif k == 'rustle': add(sfx, rustle(), t, 0.1)
        elif k == 'whoosh': add(sfx, whoosh(e.get('d', 0.9)), t, pan, e.get('g', 1))
        elif k == 'pop': add(sfx, pop(e.get('f', 520), e.get('g', 1)), t, pan)
        elif k == 'pop_down': add(sfx, pop_down(), t, pan)
        elif k == 'tick': add(sfx, tick(e.get('g', 1)), t, 0.2)
        elif k == 'type': add(sfx, typec(), t, 0.0)
        elif k == 'flip': add(sfx, flip(), t, 0.2)
        elif k == 'buzz': add(sfx, buzz(e.get('d', 0.5)), t, 0.3)
        elif k == 'knock': add(sfx, knock(), t, 0.4)
        elif k == 'ring': add(sfx, ring(e.get('d', 2.4)), t, 0.1, 0.9)
        elif k == 'bellring': add(sfx, bellring(e.get('d', 4.8)), t, -0.2)
        elif k == 'exhale': add(sfx, exhale(), t, 0.0)
        elif k == 'swell': add(sfx, swell(e.get('d', 1.0), e.get('f', 220)), t, 0.0)
        elif k == 'rise': add(sfx, rise(e.get('d', 1.5), e.get('f0', 300), e.get('f1', 900), e.get('a', 0.1)), t, 0.0)
        elif k == 'sparkle': add(sfx, sparkle(), t, 0.0)
        elif k == 'tvon': add(sfx, tvon(), t, 0.3)
        elif k == 'lowswell': add(sfx, lowswell(e.get('d', 2.6)), t, 0.0)
        elif k == 'click': add(sfx, click(e.get('g', 1)), t, pan)
        elif k == 'ratchet': add(sfx, ratchet(e.get('d', 0.4)), t, -0.2)
        elif k == 'chime': add(sfx, bell(e.get('f', 1318), 1.6, 0.12, 3.2), t, pan * 0.5)
    return events

def accents(events):
    """musical accents: bright chord bells on selected key visual events (map recorded in events.json)"""
    key = [e for e in events if e['kind'] in ('sparkle', 'tvon', 'lowswell', 'ring', 'sit') or e['kind'] == 'thud']
    marks = []
    for e in events:
        if e['kind'] in ('sparkle', 'tvon', 'lowswell'):
            marks.append(e)
    for e in marks:
        t = e['t']; base = 62 if e['kind'] != 'lowswell' else 55
        for i, m in enumerate((base, base + 4, base + 7, base + 11) if e['kind'] != 'lowswell' else (base, base + 7)):
            add(mus, bell(midi(m + 12), 2.4, 0.07, 2.4), t + i * 0.05, 0.1 * (i - 1.5))
    return marks

def reverb(x, wet, sec=2.0, seed=3):
    r = np.random.default_rng(seed); L = int(sec * SR); t = np.arange(L) / SR
    out = np.zeros_like(x)
    for c in range(2):
        ir = r.standard_normal(L) * np.exp(-t * 3.2); ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR)); ir /= np.sqrt((ir ** 2).sum())
        n = 1 << int(math.ceil(math.log2(x.shape[1] + L)))
        y = np.fft.irfft(np.fft.rfft(x[c].astype(np.float64), n) * np.fft.rfft(ir, n), n)[: x.shape[1]]
        out[c] = (x[c] + wet * y * 2.2).astype(np.float32) if False else (x[c] * (1 - wet * 0.5) + wet * y * 2.5).astype(np.float32)
    return out

if __name__ == '__main__':
    score(); events = sound_design(); marks = accents(events)
    m = reverb(mus, 0.30, 2.2, 3); s = reverb(sfx, 0.12, 1.2, 5)
    mix = m * 0.9 + s * 1.0
    # gentle fade at very start and out at the end of the film (music tail must not exceed video length)
    t = np.arange(N) / SR; fade_in = np.minimum(t / 0.6, 1); fade_out = np.clip((TOTAL - t) / 2.5, 0, 1)
    mix = mix * (fade_in * fade_out)
    peak = np.abs(mix).max(); mix = mix / peak * 0.8
    pcm = (np.clip(mix, -1, 1).T * 32767).astype(np.int16)
    with wave.open('audio/mix.wav', 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    json.dump({'sr': SR, 'events': events, 'accent_marks': marks}, open('audio/events.json', 'w'), indent=1)
    print('events', len(events), 'accents', len(marks), 'dur', N / SR, 'peak before norm', float(peak))
