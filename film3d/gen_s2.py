from genlib import *
C=-0.6; S='SAM'; T0=34
props=room([
 P('couch','couch',[0,-0.5],yaw=C),
 P('tv','tv',[5.2,2.5],yaw=C+math.pi),
 P('counter','counter',[0.9,0,-2.62],sink=True,sinkX=-0.55),
 P('mug','mug',[1.0,0.95,-2.62],alarm=True,shake='rot',rayY=0.42),
 P('side_table','table',[1.7,0.95]),
 P('phone','phone',[1.7,0.6,0.95],alarm=True,shake='buzz',rayY=0.35,tone=0),
 P('door','door',[3.3,0,-2.97]),
 P('box','box',[3.3,0,-2.45],alarm=True,shake='hop',rayY=0.55,tone=0),
 P('dust','dust',[3.3,0.5,-2.45],prog=0),
 P('calendar','calendar',[2.1,1.7,-2.96],days=['Tue','Wed','Thu','Fri','Sat','Sun','Mon','Tue']),
 P('clock','clock',[-2.4,2.1,-2.96],time='9:30'),
 P('lamp','lamp',[-1.8,3.2]),
 P('sun','sun',[-2.4,3.2,-2.9],hidden=True),
 P('envelope','envelope',[1.7,0.8,0.95],hidden=True,scale=0.9),
 P('sandwich','sandwich',[1.25,1.0,0.95],hidden=True,scale=1.0),
 P('bubble','think',[0,0,0],kind='thought',w=0.7,h=0.5,hidden=True,follow={"at":"SAM.head","off":[0.5,0.62,0]},children=[P('dot',None,[0,0,0.03],r=0.04,fill='#1c1c1c')]),
 P('relief','relief',[0,0,0],follow={"at":"SAM.chest","off":[0,0.0,0.25]}),
 P('balloon','balloon',[0,0,0],hidden=True,follow={"at":"SAM.chest","off":[-0.1,0.35,0.35],"vel":[0,0.9,0.1],"t0":39.4}),
 P('bubble','think2',[0,0,0],kind='thought',w=0.7,h=0.55,hidden=True,follow={"at":"SAM.head","off":[0.4,0.62,-0.15]},children=[P('label',None,[0,0,0.04],text='?',size=0.5,color='#7fa8d8',reveal=False)]),
])
tl=[]
a=lambda *x,**k: tl.append(act(*x,**k))
# mug orange -> grey (ten minutes ago)
a(0.3,'mug','tone',0.7,to=0)
a(0,S,'emote',face='calm'); a(0,S,'arms',0.1,left='down',right='down')
# 2a walk past
a(0.8,S,'walk_to',4.3,to=[2.6,1.5])
# 2b
a(5.3,S,'walk_to',2.3,to=[2.7,0.2])
a(5.3,'sun','appear',0.3); a(5.3,'sun','move',1.7,to=[0.6,3.9,-2.9]); a(7.0,'sun','move',2.1,to=[3.4,3.2,-2.9]); a(9.1,'sun','disappear',0.4)
a(7.2,'envelope','appear',0.4); a(7.2,'envelope','move',1.4,to=[1.7,1.35,0.95]); a(9.2,'envelope','disappear',0.3)
a(7.6,'sandwich','appear',0.4); a(9.2,'sandwich','disappear',0.3)
# 2c calendar / dust
a(10.3,'calendar','prog',2.6,to=1,ease='linear'); a(10.5,'dust','prog',0.5,to=1)
a(10.6,S,'walk_to',1.5,to=[1.15,-0.25]); a(12.0,S,'turn',1.0,yaw=C); a(13.0,S,'walk_to',0.6,to=[0.62,-0.08],face=C)
# 2d sit, loud
a(14.4,S,'sit',1.0); a(14.9,S,'arms',0.5,left='rest',right='rest'); a(15.4,S,'arms',0.4,left='ears',right='ears'); a(15.4,S,'emote',0.4,face='wince')
for pid in ['mug','phone','box']:
    a(15.2,pid,'tone',0.2,to=1); a(15.3,pid,'alarm',0.3,to=1)
a(15.2,'clock','tone',0.1,to=1)
# 2e up
a(19.2,S,'stand_up',1.2); a(19.4,S,'arms',0.8,left='down',right='point_up'); a(19.6,S,'emote',0.6,face='sheepish')
a(20.4,'think','appear',0.5)
for pid in ['mug','phone','box']: a(20.0,pid,'alarm',2.5,to=0.4)
# 2f sink
a(23.3,'think','disappear',0.4)
a(23.5,S,'walk_to',0.8,to=[1.3,-0.5]); a(24.3,S,'walk_to',1.4,to=[1.35,-1.9]); a(25.7,S,'walk_to',1.0,to=[0.35,-1.96]); a(26.5,S,'turn',0.9,yaw=math.pi/2)
a(24.0,S,'emote',0.6,face='calm'); a(24.0,S,'arms',0.6,left='down',right='down')
# 2g relief
a(27.9,S,'reach',0.6,at='counter.faucet'); a(28.4,S,'emote',0.8,face='relief')
a(28.3,'relief','alarm',1.0,to=1)
for pid in ['mug','phone','box']: a(28.2,pid,'alarm',1.3,to=0)
a(28.4,S,'look',0.6,at=None)
# 2h macro: mug stains
a(34.4,'mug','prog',0.2,to=1)
# 2i lighter
a(38.9,S,'unreach',0.5); a(38.9,S,'arms',0.5,left='down',right='down'); a(39.0,S,'turn',0.9,yaw=-math.pi/2)
a(38.9,'relief','alarm',0.6,to=0)
a(39.2,'balloon','appear',0.4,to=0.8)
tl[-1]['to']=0.8
a(41.9,'balloon','disappear',0.5)
# 2j puzzled
a(42.5,S,'turn',0.8,yaw=math.pi/2); a(42.9,S,'emote',0.6,face='puzzled'); a(43.0,S,'look',0.7,at='mug'); a(43.2,S,'lean',0.9,to=0.32)
a(44.0,'think2','appear',0.45)
# camera
tl.append(cam([
 K(0,[1.05,1.12,-2.1],[1.0,1.0,-2.62],24,14), K(1.0,[1.6,1.5,2.4],[0.9,1.0,-0.8],32,6), K(2.2,[-0.6,1.4,4.8],[-0.2,1.1,1.5],34,5),
 K(4.0,[1.2,1.4,4.8],[1.3,1.1,1.5],34,5), K(5.4,[2.0,1.5,2.0],[1.4,1.0,-1.2],32,8),
 K(6.2,[1.6,1.5,-0.4],[1.0,1.15,-2.62],28,10), K(8.0,[2.3,1.4,2.3],[1.7,0.9,0.95],30,10), K(10.2,[3.0,1.4,0.6],[3.3,0.7,-2.5],32,8),
 K(11.8,[3.0,1.3,-0.4],[3.0,0.8,-2.6],28,10), K(14.2,[2.85,1.5,1.51],[-0.1,1.15,-0.55],32,12),
 K(15.4,[0.96,1.45,2.36],[-0.1,1.15,-0.55],32,12), K(16.8,[-1.28,1.4,1.99],[-0.1,1.15,-0.55],32,12), K(18.5,[-2.55,1.5,1.5],[-0.1,1.15,-0.55],32,10),
 K(19.5,[-2.6,1.6,3.6],[-0.1,1.5,-0.3],34,8), K(22.0,[-1.3,1.6,4.2],[0.3,1.5,-0.2],34,8),
 K(23.3,[-1.4,1.5,1.6],[0.8,1.2,-1.0],34,6), K(25.0,[3.0,1.6,1.0],[1.0,1.25,-1.4],34,6), K(27.6,[2.8,1.5,-0.2],[0.45,1.35,-2.1],33,8),
 K(28.4,[2.9,1.45,-0.9],[0.35,1.4,-2.1],32,12), K(33.8,[2.2,1.45,-1.1],[0.3,1.45,-2.1],30,14),
 K(34.4,[1.35,1.22,-1.55],[1.0,1.0,-2.62],24,26), K(38.4,[1.2,1.18,-1.75],[1.0,1.0,-2.62],24,26),
 K(39.8,[-1.4,1.5,1.2],[0.3,1.4,-1.9],34,12), K(42.4,[-1.8,1.6,1.8],[0.3,1.45,-1.8],34,10),
 K(43.6,[2.8,1.45,-0.3],[0.6,1.35,-2.1],32,12), K(46.2,[2.4,1.4,-0.9],[0.55,1.4,-2.2],28,16), K(47.5,{"at":"think2","off":[0,0,0.9]},"think2",24,0)]))
write('s2',47.5,props,{"SAM":{"at":[-2.6,1.5],"yaw":0,"face":"calm"}},tl,captions('2a','2j',T0))
