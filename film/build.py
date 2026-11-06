import json, re, subprocess, sys, os
D=os.path.dirname(os.path.abspath(__file__)); out=sys.argv[1]
story=json.load(open(f'{D}/story.json'))
def ts(x):
    h=int(x//3600);m=int(x%3600//60);s=x%60
    return f"{h:02}:{m:02}:{s:06.3f}".replace('.',',')
cues=[]
for f in story['frames']:
    sents=[s.strip() for s in re.findall(r'[^.!?]+[.!?]+|[^.!?]+$',f['text'].strip()) if s.strip()]
    tot=sum(len(s) for s in sents); t=f['start']; dur=f['end']-f['start']
    for s in sents:
        d=dur*len(s)/tot; cues.append((t,t+d-0.05,s)); t+=d
with open(f'{out}/subs.srt','w') as fh:
    for i,(a,b,s) in enumerate(cues,1): fh.write(f"{i}\n{ts(a)} --> {ts(b)}\n{s}\n\n")
end=story['frames'][-1]['end']
style="FontName=DejaVu Sans,FontSize=20,PrimaryColour=&H1C1C1C&,OutlineColour=&HF0F7FA&,BorderStyle=1,Outline=3,Shadow=0,MarginV=14"
subprocess.run(['ffmpeg','-y','-loglevel','error','-framerate','24','-i',f'{out}/png/%05d.png','-f','lavfi','-i','anullsrc=r=44100:cl=stereo','-t',str(end),
 '-vf',f"subtitles={out}/subs.srt:force_style='{style}'",'-c:v','libx264','-pix_fmt','yuv420p','-crf','22','-c:a','aac','-shortest',f'{out}/the_mug_can_wait.mp4'],check=True)
print('ok')
