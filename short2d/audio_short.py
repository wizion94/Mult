#!/usr/bin/env python3
"""Synth score + SFX for the 12 s pilot. 100 BPM (beat 0.6 s) so every cut sits on a beat. Output: audio/short.wav"""
import numpy as np, wave, os, json
SR=44100; DUR=12.0; N=int(DUR*SR); BEAT=0.6; rng=np.random.default_rng(11); os.makedirs('audio',exist_ok=True)
L=np.zeros((2,N),np.float32)
def tv(d): return np.arange(int(d*SR))/SR
def add(sig,t,pan=0.0,g=1.0):
    i=int(round(t*SR)); a=max(0,-i); b=min(len(sig),N-i)
    if b<=a: return
    gl=np.cos((pan+1)*np.pi/4); gr=np.sin((pan+1)*np.pi/4); s=sig[a:b]*g
    L[0,i+a:i+b]+=s*gl; L[1,i+a:i+b]+=s*gr
def midi(m): return 440*2**((m-69)/12)
def noise(d): return rng.standard_normal(int(d*SR))
def lp(x,tau):
    k=np.exp(-np.arange(max(8,int(6*tau*SR)))/(tau*SR)); k/=k.sum(); return np.convolve(x,k,'same')
def kick():
    t=tv(0.35); f=45+90*np.exp(-t*28); ph=2*np.pi*np.cumsum(f)/SR; return np.sin(ph)*np.exp(-t*9)*0.95
def clap():
    t=tv(0.25); n=noise(0.25); n=n-lp(n,0.0004); return n*np.exp(-t*22)*0.5
def hat(open_=False):
    d=0.25 if open_ else 0.06; t=tv(d); n=noise(d); n=n-lp(n,0.0002); return n*np.exp(-t*(14 if open_ else 70))*0.22
def bass(m,d=0.28):
    t=tv(d); f=midi(m); y=sum(np.sin(2*np.pi*f*k*t)/k for k in (1,2,3,4))*0.5; return y*np.exp(-t*5)*np.minimum(t/0.004,1)*0.6
def pluck(m,d=0.35,g=0.2):
    t=tv(d); f=midi(m); y=(np.sign(np.sin(2*np.pi*f*t))*0.5+np.sin(2*np.pi*f*2*t)*0.3); return y*np.exp(-t*9)*g*np.minimum(t/0.003,1)
def lead(m,d=0.5,g=0.22):
    t=tv(d); f=midi(m)*(1+0.004*np.sin(2*np.pi*5.5*t)); y=sum(np.sin(2*np.pi*f*k*t)/k for k in (1,2,3)); return y*np.exp(-t*3.5)*g*np.minimum(t/0.01,1)
def whoosh(d=0.35):
    t=tv(d); n=lp(noise(d),0.0015)*3; return n*np.sin(np.pi*np.minimum(t/d,1))**2*0.5
def pop(f=700):
    t=tv(0.09); fr=f*(1+0.9*np.minimum(t/0.04,1)); return np.sin(2*np.pi*np.cumsum(fr)/SR)*np.exp(-t*35)*0.22
def click():
    t=tv(0.04); return (np.sin(2*np.pi*1800*t)*np.exp(-t*160)+0.4*noise(0.04)*np.exp(-t*220))*0.35
def impact(m=33,d=0.6):
    t=tv(d); f=midi(m)*(1+1.2*np.exp(-t*20)); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*6)*0.9+lp(noise(d),0.003)*np.exp(-t*14)*1.5
def bell(f,d=1.0,g=0.18):
    t=tv(d); y=sum(a*np.sin(2*np.pi*f*r*t)*np.exp(-t*dd) for r,a,dd in [(1,1,3),(2.76,.5,5),(5.4,.25,8)]); return y*g
def sad(d=0.9):
    t=tv(d); f=midi(60)-14*t*3; return (np.sin(2*np.pi*np.cumsum(f)/SR)+0.4*np.sin(4*np.pi*np.cumsum(f)/SR))*np.sin(np.pi*np.minimum(t/d,1))**0.6*0.22
def rewind(d=0.6):
    t=tv(d); f=1800*np.exp(-t*3.5)+120; y=np.sin(2*np.pi*np.cumsum(f)/SR)*0.25+lp(noise(d),0.001)*np.sin(np.pi*t/d)*1.2; return y*np.minimum(t/0.02,1)
# ---- score: A minor, i-VI-III-VII, 5 bars of 4 beats (2.4 s)
PROG=[(57,[69,72,76]),(53,[65,69,72]),(48,[67,72,76]),(55,[67,71,74]),(57,[69,72,76])]  # bass midi, chord
beats=int(DUR/BEAT)
for b in range(beats):
    t=b*BEAT; bar=b//4; bm,ch=PROG[min(bar,len(PROG)-1)]
    if t<11.4:
        add(kick(),t,0,0.9)
        if b%4 in (1,3): add(clap(),t,0,0.8)
        add(hat(),t+BEAT/2,0.2,1.0)
        if b%2==1: add(hat(True),t+BEAT/2,-0.2,0.6)
        add(bass(bm-12),t,0,0.85); add(bass(bm-12),t+BEAT*0.75,0,0.7)
        for k in range(4):
            add(pluck(ch[(b*4+k)%3]+(12 if k%2 else 0),0.3,0.16),t+k*BEAT/4*(1),(k-1.5)*0.25)
# lead hook on bars 3-4 (cut 6.0-10.2 range)
hook=[(7.2,81),(7.5,84),(7.8,88),(8.4,86),(8.7,84),(9.0,81)]
for tt,m in hook: add(lead(m),tt,0.1)
# riser into rewind
t=tv(0.9); add(lp(noise(0.9),0.0006)*np.linspace(0,1,len(t))**2*0.6,10.5,0,1.0)
# ---- sfx on events
for c in (1.2,2.4,3.6,4.8,6.0,7.2,8.4,10.2): add(whoosh(),c-0.12,0.0,0.8)
words=[0.05,0.6,1.25,1.55,1.85,2.5,2.95,3.68,4.05,4.88,5.18,5.48,6.4,7.28,7.9,8.5,8.85,9.2,9.55,10.3,10.8]
for w in words: add(pop(600+int(rng.random()*300)),w,float(rng.normal(0,0.2)),0.9)
add(impact(40,0.5),3.62,0,0.7)                    # admin button reveal stab
for t0 in (4.88,5.18,5.48): add(impact(31,0.35),t0,0,0.75)  # NO NO NO hits
add(click(),6.4,0.1,1.0); add(bell(1760,0.8),6.42,0.2,0.9)
for i,m in enumerate((72,76,79,84,88)): add(bell(midi(m),1.0,0.2),7.25+i*0.07,0.0,1.0)     # success arpeggio
add(bell(midi(96),0.9,0.15),8.5,0.3,1.0)          # crown sparkle
add(sad(),10.3,0,1.0); add(rewind(),11.4,0,1.0)
# fade ends so loop is clean
t=np.arange(N)/SR; env=np.minimum(t/0.01,1)*np.clip((DUR-t)/0.04,0,1); L*=env
L/=np.abs(L).max()+1e-9; L*=0.8
pcm=(np.clip(L,-1,1).T*32767).astype(np.int16)
with wave.open('audio/short.wav','wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote audio/short.wav', N/SR,'s')
