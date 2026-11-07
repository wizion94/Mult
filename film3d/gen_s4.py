from genlib import *
C=-0.6; T0=164.3; END=41.1
props=[P('ground',z0=-4,z1=9),P('wall',at=[0,0,-4])]
actors={}; tl=[]
def a(*x,**k): tl.append(act(*x,**k))
def fwd(yaw): return (math.cos(yaw),-math.sin(yaw))
def foot(cx,cz,yaw=C,k=1.0): f=fwd(yaw); return [round(cx+f[0]*0.75*k,3),round(cz+f[1]*0.75*k,3)]
def actor(id,at,yaw,face='calm',plain=False,t0=0,t1=END,**kw):
    actors[id]={"at":at,"yaw":yaw,"face":face,"plain":plain,"hidden":True,**kw}; a(max(0,t0-2.0),id,'show',0.01); a(min(END,t1+2.0),id,'hide',0.01)
def seated(id,fp,yaw=C,face='calm',plain=False,t0=0,t1=END,scale=1.0):
    actor(id,fp,yaw,face,plain,t0,t1,scale=scale); tl.append({"t":0.0,"who":id,"do":"warp","to":fp,"yaw":yaw,"sit":1}); tl.append(act(0.01,id,'arms',0.001,left='rest',right='rest'))
# ---- 4a zigzag, hopping Sam
verts=[(0.0,0.0),(1.3,0.6),(2.6,-0.6),(3.9,0.6),(5.2,-0.6),(6.5,0.0)]
props+=[P('zigzag','zz',[0.0,0.03,0.0],rx=-math.pi/2,len=3.8,n=5,amp=0.6,lw=8)]
# zigzag n=5: verts at i/n*L with alternating +-amp ; after rx -90deg, local y -> world -z : align path
vz=[(i/5*3.8, (1 if i%2 else -1)*0.6) for i in range(6)]
actor('SAM_a',[-0.6,0.0],0.0,'worry',False,0,4.8); a(0.0,'SAM_a','arms',0.1,left='open',right='open')
t=0.3
for i,(vx,vy) in enumerate(vz):
    z=-vy  # rotated plane: world z = -local y
    a(t,'SAM_a','walk_to',0.65,to=[vx,z]); a(t+0.1,'SAM_a','hop',0.55,h=0.35); t+=0.7
# ---- 4b three panels
for i,(cx,lab) in enumerate([(5.2,'TV'),(8.0,'phone'),(10.8,'back')]):
    props.append(P('flat',f'pan{i}',[cx,1.25,-0.9],w=2.2,h=2.3,fill='#fcfaf4',lw=3))
props+=[P('arrow','ar1',[6.3,1.6,-0.6],len=0.6,color='#1c1c1c',lw=4),P('arrow','ar2',[9.1,1.6,-0.6],len=0.6,color='#1c1c1c',lw=4)]
k=0.75
props+=[P('couch','cb1',[5.2,-0.3],yaw=C,scale=k),P('tv_icon','tvb',[6.0,1.4,-0.8],scale=1.1),P('phone','ph_b',[0,0,0],holdOff=[0,0,0],holdYaw=1.57,holdTilt=0.0),P('couch','cb3',[12.4,-1.0],yaw=C,scale=k)]
seated('SAM_b1',foot(5.2,-0.3,C,k),C,'calm',False,4.0,10.4,scale=k)
actor('SAM_b2',[7.6,0.0],-0.4,'focus',False,4.0,10.4,scale=k); a(4.8,'SAM_b2','arms',0.5,right='hold_front',left='down'); a(4.8,'ph_b','attach',to='SAM_b2.R')
actor('SAM_b3',[9.8,0.9],0.0,'tired',False,4.0,10.4,scale=k); a(5.5,'SAM_b3','walk_to',4.5,to=[12.7,0.9]); a(5.0,'SAM_b3','arms',0.4,left='down',right='down')
for i in range(3): a(5.0+i*1.2,f'pan{i}','appear',0.01)
# ---- 4c background noise
x=15.5
props+=[P('tv_icon','tv_c',[x+1.6,2.7,-1.4],scale=1.6),P('phone','ph_c',[0,0,0],holdOff=[0,0,0],holdYaw=1.57,holdTilt=0.0)]
actor('SAM_c',[x-0.3,0.0],2.3,'focus',False,10.3,15.1); a(10.5,'SAM_c','arms',0.5,right='hold_front',left='down'); a(10.5,'ph_c','attach',to='SAM_c.R'); a(10.9,'SAM_c','look',0.6,at='ph_c')
# ---- 4d locked door / key
x=21.0
props+=[P('door','door_d',[x+1.8,0,-0.7],w=1.5,color='#d6e4f5',lock=True),P('label','lab_rest',[x+1.8,2.55,-0.6],text='Rest',size=0.5,prog=0),
        P('card','key',[x-1.6,2.65,-0.7],w=0.5,h=0.65,fill='#f28c28',bob=0.05),P('label','lab_work',[x-1.6,2.65,-0.65],text='Work',size=0.3,reveal=False)]
actor('SAM_d',[x+0.0,0.0],0.0,'guilty',False,15.1,22.6); a(15.5,'SAM_d','look',0.6,at='key'); a(17.0,'SAM_d','arms',0.8,right='reach_up',left='down'); a(16.0,'lab_rest','prog',1.2,to=1)
# ---- 4e scroll
x=27.0
props+=[P('couch','couch_e',[x-1.2,-0.5],yaw=C),P('scroll','scr',[x+0.2,1.4,-0.9],len=11,w=2.1,prog=0)]
seated('SAM_e',foot(x-1.2,-0.5),C,'tired',False,22.6,28.1); a(23.2,'SAM_e','slump',1.2,to=0.5); a(23.4,'scr','prog',3.0,to=1)
# ---- 4f queue
x=36.0
props+=[P('clock','clk_f',[x+1.2,3.1,-0.9],time='3:00')]
actor('SAM_f',[x-1.0,0.0],0.0,'tired',False,28.1,33.2); a(28.5,'SAM_f','slump',0.8,to=0.5)
for i in range(1,5):
    actor(f'Q{i}',[x-1.0+i*1.0,0.0],0.0,'tired',True,28.1,33.2); a(28.5,f'Q{i}','slump',0.8,to=0.45)
# ---- 4g fading row
x0=42.0
for i in range(4):
    cx=x0+i*2.6; props.append(P('couch',f'cg{i}',[cx,-0.5],yaw=C))
    seated(f'G{i}',foot(cx,-0.5),C,'calm',(i>0),33.2,41.1)
    a(33.5+i*0.6,f'G{i}','fade',2.5,to=[1.0,0.6,0.35,0.15][i])
props+=[P('label','q_end',[x0+10.9,1.5,0],text='?',size=1.9,color='#7fa8d8',reveal=False)]
a(22.6,'POST','sat',4.0,to=0.7); a(33.2,'POST','sat',7.0,to=0.12); tl[-1]['who']='POST'; tl[-2]['who']='POST'
# camera
keys=[K(0,[-1.2,1.6,4.4],[0.8,1.2,0],34,4),K(2.4,[2.4,1.6,4.6],[3.0,1.2,0],34,5),K(4.8,[4.9,1.6,5.0],[5.6,1.4,0],34,5),
 K(7.6,[8.0,1.6,5.0],[8.0,1.4,0],34,5),K(9.8,[10.6,1.6,5.0],[10.6,1.4,0],34,5)]
for t0,t1,c in [(10.3,15.1,15.3),(15.1,22.6,20.8),(22.6,28.1,27.2),(28.1,33.2,36.0)]:
    keys+=[K(t0+0.5,[c-0.6,1.6,4.7],[c-0.3,1.45,0],34,6),K(t1-0.5,[c+0.6,1.6,4.7],[c+0.3,1.45,0],34,6)]
keys+=[K(34.2,[42.0,1.6,5.0],[43.0,1.3,0],34,6),K(37.5,[46.0,1.7,6.6],[47.0,1.3,0],34,4),K(41.1,[47.5,2.0,9.5],[47.5,1.3,0],36,0)]
tl.append(cam(keys))
write('s4',END,props,actors,tl,captions('4a','4g',T0),fade_in=0.35,fade_out=0.4)
