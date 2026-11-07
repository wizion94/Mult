import json,re,math
STORY=json.load(open('/home/user/Mult/film/story.json'))['frames']
KEY=r"\b(mug|emergency|guilty|guilt|plan|loud|lighter|better|tabs?|unfinished|Zeigarnik|2011|earned|rest|cost|timer|kind|kindness|Play|alarm|nothing|fixed?|open)\b"
def frames(a,b):  # frame ids between a..b inclusive by order
    ids=[f['id'] for f in STORY]; return [f for f in STORY if ids.index(a)<=ids.index(f['id'])<=ids.index(b)]
def captions(a,b,t0):
    out=[]
    for f in frames(a,b):
        txt=re.sub(KEY,lambda m:'*'+m.group(0)+'*',f['text'])
        out.append({"start":round(f['start']-t0,3),"end":round(f['end']-t0-0.05,3),"text":txt})
    return out
def P(type,id=None,at=None,**kw):
    d={"type":type}; 
    if id: d["id"]=id
    if at is not None: d["at"]=at
    d.update(kw); return d
def act(t,who,do,dur=None,**kw):
    d={"t":round(t,3),"who":who,"do":do}
    if dur is not None: d["dur"]=dur
    d.update(kw); return d
def cam(keys): return {"who":"CAMERA","do":"keys","keys":keys}
def K(t,pos,look,fov=34,ap=0,**kw): d={"t":t,"pos":pos,"look":look,"fov":fov,"ap":ap}; d.update(kw); return d
def write(name,dur,props,actors,timeline,caps,palette=None,fade_in=0,fade_out=0):
    j={"meta":{"title":"The Mug Can Wait","scene":name,"duration":dur,"fade_in":fade_in,"fade_out":fade_out},"set":{"props":props},"actors":actors,"timeline":timeline,"captions":caps}
    if palette: j["set"]["palette"]=palette
    json.dump(j,open(name+'.json','w'),indent=1); return j
def room(extra=None):
    base=[P('ground',z0=-2.6,z1=9),P('wall',at=[0,0,-3])]
    return base+(extra or [])
