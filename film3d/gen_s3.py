from genlib import *
C=-0.6; T0=81.5
TS=[0,4.3,11.1,15.4,21.7,29.6,36.4,42.3,46.3,51.4,55.4,62.2,70.1,76.9]; END=82.8
ids='abcdefghijklmn'; X={ids[i]:5.0*i for i in range(14)}
ts={ids[i]:TS[i] for i in range(14)}; te={ids[i]:(TS[i+1] if i<13 else END) for i in range(14)}
props=[P('ground',z0=-4,z1=9),P('wall',at=[0,0,-4]),P('label','q0',[-0.2,1.5,0.5],text='?',size=0.5,color='#7fa8d8',reveal=False)]
actors={}
tl=[]
def a(*x,**k): tl.append(act(*x,**k))
def actor(id,at,yaw,face='calm',plain=False,st='a',**kw):
    actors[id]={"at":at,"yaw":yaw,"face":face,"plain":plain,"hidden":True,**kw}
    a(ts[st]-2.0,id,'show',0.01); a(te[st]+1.5,id,'hide',0.01)
def fwd(yaw): return (math.cos(yaw),-math.sin(yaw))
def foot_couch(cx,cz,yaw=C): f=fwd(yaw); return [round(cx+f[0]*0.75,3),round(cz+f[1]*0.75,3)]

# ---- 3a head / puzzle
x=X['a']
props+=[P('head_profile','head',[x-0.2,1.5,0],scale=0.7),P('puzzle','puz',[x-0.3,1.75,0.2],scale=1.1,bob=0.03,hidden=True),
        P('label','lab_z',[x+0.2,2.95,0.2],text='Zeigarnik effect',size=0.42,prog=0)]
a(ts['a']+1.5,'puz','appear',0.4); a(ts['a']+1.9,'puz','tilt',0.5,to=0.35); a(ts['a']+2.4,'puz','tilt',0.5,to=-0.3); a(ts['a']+2.9,'puz','tilt',0.5,to=0.1)
a(ts['a']+1.6,'lab_z','prog',1.9,to=1,ease='linear')
# ---- 3b Bluma + checklist
x=X['b']
props+=[P('checklist','chk',[x+1.4,1.35,-0.2],rows=[1,1,'o'],w=1.9,prog=0,alarm=True,rayY=1.15,shake='rot'),P('notepad','pad_b',[0,0,0],holdOff=[0.0,0.02,0.0],holdYaw=0.0,holdTilt=0,w=0.25,h=0.32)]
actor('RES_b',[x-1.5,0],-0.35,'curious',True,'b')
a(ts['b']+0.2,'RES_b','arms',0.8,right='hold_front',left='down'); a(ts['b']+0.2,'pad_b','attach',to='RES_b.R')
a(ts['b']+0.8,'RES_b','look',0.8,at='chk'); a(ts['b']+1.0,'chk','prog',3.2,to=1,ease='linear'); a(ts['b']+4.4,'chk','alarm',0.8,to=0.9)
# ---- 3c two bubbles
x=X['c']
props+=[P('bust','bust_c',[x,1.3,0],scale=1.0),
 P('bubble','bb1',[x-0.95,2.5,0],kind='thought',w=1.0,h=0.65,hidden=True,children=[P('checkbox',None,[0,0,0.04],size=0.3,state=1,color='#9a9a9a')]),
 P('bubble','bb2',[x+1.15,2.75,0],kind='thought',w=1.7,h=1.05,hidden=True,children=[P('checkbox',None,[0,0,0.04],size=0.55,state=0,color='#f28c28')])]
a(ts['c']+0.5,'bb1','appear',0.4); a(ts['c']+1.8,'bb2','appear',0.5)
# ---- 3d browser
x=X['d']
props+=[P('browser','brw',[x,1.35,0],w=3.4,h=1.9,tabs=8,hi=2,prog=0)]
a(ts['d']+0.8,'brw','prog',4.4,to=1,ease='linear')
# ---- 3e busy + quiet
x=X['e']
props+=[P('box','box_e',[0,0,0],size=[0.5,0.38,0.42],holdOff=[0.12,-0.1,0.0],holdYaw=0,holdTilt=0)]
for i,(tx,ty,tz) in enumerate([(x-2.6,2.6,-0.5),(x-1.6,2.95,-0.7),(x-0.7,2.5,-0.5)]):
    props.append(P('tab',f'ft{i}',[tx,ty,tz],w=0.7,h=0.34,fill='#ebe5d6',scale=0.9,bob=0.05,bobPhase=i))
props+=[P('couch','couch_e',[x+2.3,-0.5],yaw=C)]
for i,(tx,ty,tz) in enumerate([(x+1.2,2.6,0.2),(x+2.6,3.0,0.0),(x+3.4,2.4,0.2)]):
    props.append(P('tab',f'bt{i}',[tx,ty,tz],w=1.1,h=0.55,fill=['#f28c28','#ffffff','#f28c28'][i],hidden=True,alarm=True,rayY=0.5,rayScale=0.7,shake='rot',bob=0.06,bobPhase=i))
actor('SAMB',[x-2.8,0.3],0,'calm',False,'e'); a(ts['e']+0.1,'SAMB','arms',0.5,left='carry',right='carry'); a(ts['e']+0.1,'box_e','attach',to='SAMB.R')
a(ts['e']+0.2,'SAMB','walk_to',3.3,to=[x-0.9,0.3])
fp=foot_couch(x+2.3,-0.5); actors['SAM']={"at":fp,"yaw":C,"face":"calm","hidden":True,"sit":1}
a(ts['e']-2.0,'SAM','show',0.01); a(te['e']+1.5,'SAM','hide',0.01)
tl.append({"t":0.0,"who":"SAM","do":"warp","to":fp,"yaw":C,"sit":1})
a(ts['e']+0.2,'SAM','arms',0.1,left='rest',right='rest')
for i in range(3):
    a(ts['e']+4.4+0.5*i,f'bt{i}','appear',0.4); a(ts['e']+4.6+0.5*i,f'bt{i}','alarm',0.4,to=0.8)
a(ts['e']+4.7,'SAM','emote',0.5,face='wince'); a(ts['e']+5.0,'SAM','arms',0.5,left='ears',right='ears')
# ---- 3f study
x=X['f']
props+=[P('whiteboard','wb',[x+1.6,2.2,-0.9],w=1.5,h=0.9),P('label','lab_2011',[x+1.6,2.2,-0.85],text='2011',size=0.62,color='#f28c28',prog=0),
 P('table','tab_f',[x,0],w=0.8,d=0.9),P('chair','ch_f',[x+1.25,0],yaw=math.pi),P('card','card_f',[0,0,0],w=0.22,h=0.3,fill='#f28c28',holdOff=[0.05,0,0],holdYaw=1.57,holdTilt=0)]
actor('RES_f',[x-1.3,0],0,'curious',True,'f'); actor('PAR_f',[x+0.7,0],math.pi,'calm',True,'f',sit=1)
tl.append({"t":0.0,"who":"PAR_f","do":"warp","to":[x+0.7,0],"yaw":math.pi,"sit":1}); a(ts['f']-1.0,'PAR_f','arms',0.1,left='rest',right='rest')
a(ts['f']+0.2,'RES_f','arms',0.6,right='hold_front',left='down'); a(ts['f']+0.2,'card_f','attach',to='RES_f.R'); a(ts['f']+0.5,'lab_2011','prog',1.4,to=1,ease='linear')
a(ts['f']+2.4,'card_f','move',0.001,to=[x,0.84,0.0]); a(ts['f']+2.4,'card_f','detach'); a(ts['f']+2.4,'RES_f','arms',0.6,right='down')
a(ts['f']+3.0,'PAR_f','look',0.6,at='card_f')
# ---- 3g reading + popping checkboxes
x=X['g']
props+=[P('table','tab_g',[x+0.9,0],w=0.8,d=0.9),P('chair','ch_g',[x-0.3,0],yaw=0),P('book','book_g',[x+0.9,0.8,0],rx=0.0)]
actor('PAR_g',[x+0.25,0],0,'focus',True,'g'); tl.append({"t":0.0,"who":"PAR_g","do":"warp","to":[x+0.25,0],"yaw":0,"sit":1})
a(ts['g']-1.0,'PAR_g','arms',0.1,left='rest',right='rest'); a(ts['g']+0.4,'PAR_g','look',0.6,at='book_g')
for i in range(5):
    props.append(P('checkbox',f'pb{i}',[x-0.2+0.28*(i%3),1.8,0.3],size=0.26,state=0,color='#f28c28',hidden=True))
    a(ts['g']+1.0+0.9*i,f'pb{i}','appear',0.3); a(ts['g']+1.0+0.9*i,f'pb{i}','move',1.2,to=[x-0.2+0.28*(i%3)+(i-2)*0.12,2.7,0.3]); a(ts['g']+2.0+0.9*i,f'pb{i}','disappear',0.3)
# ---- 3h puzzle
x=X['h']
props+=[P('table','tab_h',[x+0.9,0],w=0.8,d=0.9),P('chair','ch_h',[x-0.3,0],yaw=0),P('grid','grd',[x+0.9,1.4,0],n=4),
  P('arrow','dn',[x+2.4,2.2,0],len=1.2,yaw=0,hidden=True,rz=-1.5708)]
actor('PAR_h',[x+0.25,0],0,'worry',True,'h'); tl.append({"t":0.0,"who":"PAR_h","do":"warp","to":[x+0.25,0],"yaw":0,"sit":1})
a(ts['h']-1.0,'PAR_h','arms',0.1,left='rest',right='rest'); a(ts['h']+0.4,'PAR_h','look',0.5,at='grd')
a(ts['h']+0.9,'dn','appear',0.3); a(ts['h']+0.9,'dn','move',2.5,to=[x+2.4,1.5,0])
# ---- 3i mug = tab
x=X['i']
props+=[P('mug','mug_i',[x-1.35,0.0,0],scale=3.2,prog=0),P('label','eq',[x,0.9,0],text='=',size=1.6,reveal=True,prog=0),P('tab','tab_i',[x+1.4,0.9,0],w=1.0,h=0.5,scale=1.2,hidden=True)]
a(ts['i']+0.8,'eq','prog',0.8,to=1); a(ts['i']+1.4,'tab_i','appear',0.5)
# ---- 3j second layer
x=X['j']
props+=[P('couch','couch_j2',[x+0.6,-1.7],yaw=C,color='#efe9da'),P('couch','couch_j',[x,-0.5],yaw=C),P('weight','wt_j',[0,0,0],hidden=True,scale=0.7,follow={"at":"PAR_j.chest","off":[0.2,-0.27,0.0]})]
fp=foot_couch(x,-0.5); actor('PAR_j',fp,C,'guilty',True,'j',sit=1); tl.append({"t":0.0,"who":"PAR_j","do":"warp","to":fp,"yaw":C,"sit":1})
a(ts['j']-1.0,'PAR_j','arms',0.1,left='rest',right='rest'); a(ts['j']+0.5,'wt_j','appear',0.5); a(ts['j']+0.6,'PAR_j','slump',1.2,to=0.5)
# ---- 3k survey
x=X['k']
props+=[P('bars','bars_k',[x-1.2,0,0],items=[{"h":0.8,"color":"#ffffff"},{"h":1.6,"color":"#f28c28"}],grow=True,prog=0,gap=1.2),
 P('tv_icon','tvi',[x-1.05,1.3,0],hidden=True,scale=1.0),P('face_icon','fi',[x+0.15,2.1,0],hidden=True,scale=1.2),
 P('label','lab_530',[x-0.1,0.5,0.9],text='530 adults',size=0.36,prog=0)]
a(ts['k']+0.5,'bars_k','prog',2.4,to=1); a(ts['k']+1.6,'tvi','appear',0.4); a(ts['k']+2.9,'fi','appear',0.4); a(ts['k']+1.2,'lab_530','prog',1.6,to=1,ease='linear')
# ---- 3l interview
x=X['l']
props+=[P('chair','ch_l1',[x-1.2,0],yaw=0),P('chair','ch_l2',[x+1.2,0],yaw=math.pi),
 P('bubble','bb_l',[x+1.5,2.35,0],kind='thought',w=1.0,h=0.8,hidden=True,children=[P('hourglass',None,[0,0,0.04],scale=1.2)])]
actor('INT1',[x-0.65,0],0,'focus',True,'l',sit=1); actor('INT2',[x+0.65,0],math.pi,'guilty',True,'l',sit=1)
tl.append({"t":0.0,"who":"INT1","do":"warp","to":[x-0.65,0],"yaw":0,"sit":1}); tl.append({"t":0.0,"who":"INT2","do":"warp","to":[x+0.65,0],"yaw":math.pi,"sit":1})
for n in ('INT1','INT2'): a(ts['l']-1.0,n,'arms',0.1,left='rest',right='rest')
a(ts['l']+1.0,'bb_l','appear',0.5); a(ts['l']+0.5,'INT1','nod',0.6); a(ts['l']+3.2,'INT1','nod',0.6)
# ---- 3m earn it
x=X['m']
props+=[P('couch','couch_m',[x-0.6,-0.5],yaw=C),P('signpost','sign_m',[x+1.5,0,-0.9],h=2.8,w=1.9,dir=-1,text='Earn it'),P('star','star_m',[x+0.3,2.6,-0.9],size=1.1,bob=0.06)]
fp=foot_couch(x-0.6,-0.5); actor('SAM_m',fp,C,'worry',False,'m',sit=1); tl.append({"t":0.0,"who":"SAM_m","do":"warp","to":fp,"yaw":C,"sit":1}); a(ts['m']-1.0,'SAM_m','arms',0.1,left='rest',right='rest')
a(ts['m']+0.8,'SAM_m','look',0.6,at='sign_m')
# ---- 3n tab with lock
x=X['n']
props+=[P('tab','tab_n',[x+1.5,2.0,0.2],w=1.0,h=0.5,lock=True,scale=1.0,bob=0.08)]
actor('SAM_n',[x-0.3,0],-0.3,'puzzled',False,'n'); a(ts['n']+0.5,'SAM_n','arms',0.8,right='head',left='down'); a(ts['n']+0.6,'SAM_n','look',0.8,at='tab_n')
for _id,_d in actors.items():
    if _d.get('sit'): tl.append(act(0.01,_id,'arms',0.001,left='rest',right='rest'))
# camera
CX={'a':0.2,'b':0.6,'c':0.4,'d':0.0,'f':0.2,'g':0.5,'h':1.0,'i':0.1,'j':0.2,'k':-0.1,'l':0.0,'m':0.3,'n':0.8}
keys=[K(0,{"at":"q0","off":[0,0,0.9]},"q0",24,0),K(0.35,{"at":"q0","off":[0,0,0.9]},"q0",24,0)]
a(0.3,'q0','scale',0.9,to=0.0)
for k in ids:
    x=X[k]; t0=ts[k]; t1=te[k]
    if k=='e':
        keys+=[K(t0+0.6,[x-2.0,1.6,4.3],[x-1.5,1.3,0],34,6),K(t0+3.6,[x-0.8,1.6,4.3],[x-0.6,1.3,0],34,6),K(t0+5.0,[x+2.0,1.6,4.5],[x+2.3,1.3,0],34,8),K(t1-0.5,[x+3.0,1.6,4.5],[x+3.2,1.3,0],34,6)]
    else:
        c=x+CX[k]; keys+=[K(t0+(1.7 if k=='a' else 0.5),[c-0.5,1.6,4.6],[c-0.2,1.45,0],34,6),K(t1-0.5,[c+0.5,1.6,4.6],[c+0.2,1.45,0],34,6)]
tl.append(cam(keys))
write('s3',END,props,actors,tl,captions('3a','3n',T0),fade_out=0.35)
