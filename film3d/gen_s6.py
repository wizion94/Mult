from genlib import *
C=-0.6; T0=338; END=38.4; S='SAM'
FP=[0.62,-0.08]
props=room([
 P('couch','couch',[0,-0.5],yaw=C),
 P('tv','tv',[3.1,1.55],yaw=math.pi,alarm=True,shake='none',rayY=1.35,rayScale=1.5),
 P('counter','counter',[0.9,0,-2.62],sink=True,sinkX=-0.55),
 P('mug','mug',[1.0,0.95,-2.62],alarm=True,shake='rot',rayY=0.42,stains=True),
 P('side_table','table',[1.7,0.95]),
 P('door','door',[3.3,0,-2.97]),P('box','box',[3.3,0,-2.45]),
 P('clock','clock',[-2.4,2.1,-2.96],time='9:40'),
 P('window_','win',[0.9,2.15,-2.96],w=1.3,h=1.0),P('moon','moon',[0.9,2.15,-2.9],scale=0.8),
 P('side_table','table6',[-1.65,0.65]),P('mug','mug2',[-1.65,0.62,0.65],hidden=True,scale=1.2),
 P('remote','remote',[0,0,0],holdOff=[0,0,0],holdYaw=C+0.4+0.0,holdTilt=0.3),
 P('group','tabnote',[-0.9,1.8,0.6],hidden=True,children=[P('tab',None,[0,0,0],w=0.9,h=0.45,scale=1.2,bob=0.05),P('notepad',None,[0.45,-0.3,0.08],w=0.3,h=0.35)]),
 P('balance','bal',[-2.3,0,-0.2],scale=0.6,tilt=0.14,hidden=True),
 P('label','l_guilt',[-3.1,1.75,-0.1],text='Guilt',size=0.32,color='#7fa8d8',reveal=True,prog=0),P('label','l_proof',[-1.5,1.7,-0.1],text='Proof',size=0.32,reveal=True,prog=0),
 P('bell','bell',[-2.7,0.05,1.2],scale=1.3,hidden=True,rz=0.0),P('flame_x','flame',[-2.7,1.9,1.2],scale=1.3,hidden=True,bob=0.06),
])
fp=FP
actors={S:{"at":fp,"yaw":C,"face":"smile","sit":1}}
tl=[{"t":0.0,"who":S,"do":"warp","to":fp,"yaw":C,"sit":1}]
def a(*x,**k): tl.append(act(*x,**k))
a(0.01,S,'arms',0.001,left='rest',right='rest'); a(0.02,'remote','attach',to='SAM.R'); a(0.03,S,'arms',0.001,right='hold_front')
a(0,S,'emote',0.3,face='smile')
# 6b mug glows faintly
a(5.4,'mug','alarm',0.8,to=0.35); a(5.5,S,'emote',0.7,face='amused'); a(5.8,S,'look',0.7,at='mug')
# 6c tab with a plan
a(10.8,'tabnote','appear',0.6); a(11.2,S,'look',0.7,at=[-0.9,1.6,0.6]); a(12.5,S,'nod',0.9); a(12.6,S,'emote',0.6,face='calm')
a(16.3,'tabnote','disappear',0.5)
# 6d balance
a(16.9,S,'look',0.7,at=[-2.3,1.0,-0.1]); a(17.1,'bal','appear',0.6); a(17.6,'l_guilt','prog',1.0,to=1,ease='linear'); a(19.0,'l_proof','prog',1.0,to=1,ease='linear'); a(19.3,S,'emote',0.6,face='puzzled')
a(20.4,S,'arms',0.6,left='rest',right='hold_front')
# 6e old alarm
a(21.2,'bal','disappear',0.5); a(21.2,'l_guilt','scale',0.4,to=0); a(21.2,'l_proof','scale',0.4,to=0)
a(21.5,'bell','appear',0.5); a(22.0,'bell','alarm',0.4,to=1); a(24.2,'flame','appear',0.6); a(26.8,'bell','alarm',0.8,to=0)
a(21.8,S,'look',0.7,at=[-2.7,0.6,1.2]); a(22.0,S,'emote',0.7,face='calm'); a(26.9,S,'look',0.7,at=None)
# 6f play
a(27.9,'bell','disappear',0.4); a(27.9,'flame','disappear',0.4); a(28.2,S,'look',0.7,at='tv'); a(28.6,S,'arms',0.5,right='open'); a(29.3,S,'arms',0.25,right='hold_front')
a(29.45,'tv','prog',0.15,to=1); a(29.5,'tv','alarm',0.4,to=1); a(30.6,'tv','alarm',1.2,to=0.35); a(29.5,S,'emote',0.5,face='happy')
# 6g
a(31.7,S,'reach',0.35,pos=[-0.07,0.47,-0.185]); a(32.05,'remote','detach'); a(32.1,S,'unreach',0.3); a(32.1,S,'arms',0.3,right='rest'); a(32.0,S,'look',0.6,at=None)
a(32.5,S,'stand_up',1.1); a(33.6,S,'walk_to',1.0,to=[1.4,-0.3]); a(34.6,S,'walk_to',1.2,to=[2.6,-0.4]); a(35.8,S,'walk_to',2.0,to=[5.6,-0.5]); a(37.6,S,'hide',0.01)
a(33.6,'mug2','appear',0.6)
tl.append(cam([
 K(0,[1.9,1.4,4.9],[0.7,0.95,-0.1],32,6),K(3.0,[1.7,1.3,4.2],[0.3,0.95,-0.3],32,8),K(5.1,[1.6,1.3,3.9],[0.4,1.0,-0.4],30,10),K(7.5,[1.3,1.3,3.9],[0.8,1.1,-1.2],30,12),K(10.6,[1.5,1.3,4.3],[0.8,1.1,-1.3],30,10),
 K(13.0,[1.8,1.5,4.0],[0.2,1.35,0.0],32,8),K(16.9,[0.9,1.5,4.3],[0.0,1.3,-0.1],32,8),K(18.5,[-0.2,1.5,4.4],[-1.8,1.2,0.0],34,8),K(21.2,[-0.8,1.6,4.8],[-1.8,1.2,0.2],34,6),
 K(23.5,[-0.5,1.5,5.0],[-1.8,0.9,1.0],34,8),K(28.0,[0.6,1.5,5.2],[-0.4,1.0,0.3],34,6),K(29.5,[1.5,1.4,3.2],[1.2,1.2,0.3],30,10),K(31.6,[1.3,1.35,2.8],[1.3,1.25,0.4],28,14),
 K(34.0,[2.0,1.8,5.5],[0.7,1.0,-0.2],34,6),K(38.4,[1.2,2.1,8.0],[0.2,1.3,-0.5],38,0)]))
write('s6',END,props,actors,tl,captions('6a','6g',T0),fade_in=0.4,fade_out=0)
