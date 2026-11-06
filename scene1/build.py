import json, re, subprocess, sys, os, shutil
D=os.path.dirname(os.path.abspath(__file__)); out=sys.argv[1]
story=json.load(open(f'{D}/story.json'))
def ts(x):
    h=int(x//3600);m=int(x%3600//60);s=x%60
    return f"{h:02}:{m:02}:{s:06.3f}".replace('.',',')
cues=[]
for f in story['frames']:
    sents=re.findall(r'[^.!?]+[.!?]+|[^.!?]+$',f['text'].strip()); sents=[s.strip() for s in sents if s.strip()]
    tot=sum(len(s) for s in sents); t=f['start']; dur=f['end']-f['start']
    for s in sents:
        d=dur*len(s)/tot; cues.append((t,t+d-0.05,s)); t+=d
with open(f'{out}/subs.srt','w') as fh:
    for i,(a,b,s) in enumerate(cues,1): fh.write(f"{i}\n{ts(a)} --> {ts(b)}\n{s}\n\n")
