from genlib import *
C=-0.6; T0=205.4; END=132.6; S='SAM'
def fwd(yaw): return (math.cos(yaw),-math.sin(yaw))
FP=[0.62,-0.08]
props=room([
 P('couch','couch',[0,-0.5],yaw=C),
 P('tv','tv',[5.2,2.5],yaw=C+math.pi),
 P('counter','counter',[0.9,0,-2.62],sink=True,sinkX=-0.55),
 P('mug','mug',[1.0,0.95,-2.62],alarm=True,shake='rot',rayY=0.42,stains=True),
 P('side_table','table',[1.7,0.95]),
 P('phone','phone',[1.7,0.6,0.95],alarm=True,shake='buzz',rayY=0.35),
 P('door','door',[3.3,0,-2.97]),
 P('box','box',[3.3,0,-2.45],alarm=True,shake='hop',rayY=0.55),
 P('clock','clock',[-2.4,2.1,-2.96],time='9:40'),
 P('window_','win',[0.9,2.15,-2.96],w=1.3,h=1.0),P('moon','moon',[0.9,2.15,-2.9],scale=0.8),
 P('globe','globe5',[-1.3,1.55,-2.7],scale=1.0),
 # timer & phone held
 P('timer','timer',[0,0,0],labels=['3:00','2:30','2:00','1:30','1:00','0:30','0:00'],prog=0,holdOff=[0.02,0.1,0.0],holdAbs=True,holdYaw=0.0,holdTilt=0.0,r=0.16),
 P('phone','ph5',[0,0,0],holdOff=[0,0,0],holdYaw=0.0,holdTilt=0.0),
 # bubbles
 P('bubble','think5',[0,0,0],kind='thought',w=1.3,h=0.8,hidden=True,follow={"at":"SAM.head","off":[0.9,0.75,0.0]},children=[P('zigzag',None,[-0.3,0.14,0.04],len=0.6,n=5,amp=0.05,color='#f28c28',lw=5),P('zigzag',None,[-0.3,0.0,0.04],len=0.6,n=5,amp=0.05,color='#f28c28',lw=5),P('zigzag',None,[-0.3,-0.14,0.04],len=0.6,n=5,amp=0.05,color='#f28c28',lw=5)]),
 P('bubble','think5b',[0,0,0],kind='thought',w=1.3,h=0.8,hidden=True,follow={"at":"SAM.head","off":[1.6,0.9,-0.6],"vel":[-0.55,0.03,0.0],"t0":38.8},children=[P('zigzag',None,[-0.3,0.14,0.04],len=0.6,n=5,amp=0.05,color='#f28c28',lw=5),P('zigzag',None,[-0.3,0.0,0.04],len=0.6,n=5,amp=0.05,color='#f28c28',lw=5)]),
 P('star','spark',[0,0,0],hidden=True,size=0.8,follow={"at":"SAM.head","off":[0.0,0.65,0.0]}),
 P('wave','wave5',[-0.1,2.2,-0.5],w=3.0,h=0.9,prog=0),
 P('notepad','np',[1.6,1.6,-2.3],hidden=True,w=0.4,h=0.5,bob=0.05),
 P('group','res2011',[-1.9,2.0,0.0],hidden=True,children=[P('tab',None,[-1.2,0,0],w=0.7,h=0.35,scale=1.0),P('card',None,[-0.1,0,0],w=1.0,h=0.8,fill='#ffffff'),P('label',None,[-0.1,0,0.03],text='2011',size=0.4,color='#f28c28',reveal=False),P('arrow',None,[-0.7,0,0],len=0.5,color='#f28c28',lw=5),P('arrow',None,[0.5,0,0],len=0.5,color='#f28c28',lw=5),P('notepad',None,[1.35,0,0],w=0.5,h=0.6)]),
 P('group','bigph',[1.7,1.7,-0.5],hidden=True,children=[P('panel',None,[0,0,0],w=1.2,h=1.9,d=0.05),P('label','l1',[0,0.65,0.05],text='Mug',size=0.2,prog=0),P('label','l2',[0,0.3,0.05],text='sink',size=0.2,prog=0),P('label','l3',[0,-0.05,0.05],text='tomorrow morning',size=0.14,prog=0),P('label','l4',[0,-0.4,0.05],text='before coffee',size=0.17,prog=0),P('mug',None,[0,-0.85,0.06],scale=0.7)]),
 P('group','heads',[-0.2,2.35,0.0],hidden=True,children=[P('bust',None,[-1.1,0,0],scale=1.2),P('zigzag',None,[-1.55,0.5,0.35],len=0.9,n=6,amp=0.08,color='#f28c28',lw=5),P('zigzag',None,[-1.55,0.3,0.35],len=0.9,n=6,amp=0.08,color='#f28c28',lw=5),P('zigzag',None,[-1.55,0.1,0.35],len=0.9,n=6,amp=0.08,color='#f28c28',lw=5),P('arrow',None,[-0.35,0.0,0.0],len=0.7,color='#1c1c1c',lw=5),P('bust',None,[1.2,0,0],scale=1.2),P('card',None,[1.2,0.5,0.4],w=0.28,h=0.32,fill='#f28c28')]),
 P('group','map5',[-2.0,1.3,-2.88],hidden=True,children=[P('dot',None,[-0.7,0,0],r=0.1),P('arrow',None,[-0.55,0,0],len=0.8,color='#1c1c1c',lw=5),P('flag',None,[0.4,-0.5,0.0],scale=0.9),P('checkbox',None,[0,0.9,0],size=0.4,state=0,color='#f28c28')]),
 P('browser','minibr',[1.9,2.1,-0.3],w=1.8,h=1.1,tabs=3,hi=1,prog=1,hidden=True),P('tab','tab5',[1.65,2.55,-0.25],w=0.5,h=0.22,scale=1.0,hidden=True),
 P('bubble','kind5',[0.9,2.55,0.2],kind='thought',w=1.7,h=1.15,hidden=True),
 P('bubble','sp_l',[-0.9,2.75,0.1],kind='speech',w=1.5,h=0.8,ink='#7fa8d8',hidden=True,children=[P('label',None,[0,0,0.04],text='lazy idiot',size=0.22,reveal=False,color='#7fa8d8'),P('zigzag',None,[-0.65,-0.3,0.05],len=1.3,n=1,amp=0.3,color='#7fa8d8',lw=9)]),
 P('bubble','sp_r',[1.0,2.85,0.1],kind='speech',w=1.7,h=0.9,ink='#f28c28',hidden=True,children=[P('label',None,[0.1,0.05,0.04],text='you worked all day',size=0.17,reveal=False,color='#1c1c1c'),P('heart',None,[-0.65,0.05,0.04],size=0.11,depth=0.04)]),
 P('bars','bars_q',[2.3,0,0.9],items=[{"h":1.1,"color":"#cfcfcf"},{"h":0.7,"color":"#f28c28"}],grow=True,prog=0,gap=1.0,hidden=True),P('heart','heart_q',[3.2,0.95,0.9],size=0.2,depth=0.06,hidden=True),
 P('label','lab_sc',[3.0,0.02,1.7],text='Self-compassion',size=0.35,prog=0,rx=-1.2,hidden=True),
 P('heart','cush',[-1.8,0.22,0.5],size=0.55,depth=0.4,rx=-math.pi/2,fill='#7fa8d8',hidden=True),
 P('heart','cush_big',[-2.5,0.2,1.1],size=1.3,depth=0.4,rx=-math.pi/2,fill='#d6e4f5',hidden=True),P('heart','cush_small',[0.295,0.52,-0.843],size=0.22,depth=0.15,fill='#7fa8d8',hidden=True),
 P('group','gears',[3.1,1.45,-0.5],hidden=True,children=[P('panel',None,[0,0,-0.15],w=2.2,h=1.8,d=0.06,fill='#ffffff'),P('gear','g1',[-0.35,-0.15,0.0],r=0.4,speed=2.0),P('gear','g2',[0.4,0.15,0.0],r=0.28,n=8,speed=-2.85)]),
 P('heart','oil',[3.1,2.7,-0.35],size=0.14,depth=0.06,hidden=True),
 P('fork','fork5',[3.2,0.012,2.2],scale=0.55,hidden=True),P('door','dr_blue',[1.55,0,-1.1],w=1.3,color='#d6e4f5',scale=0.6,hidden=True),P('door','dr_or',[4.85,0,-1.1],w=1.3,color='#f6c28a',scale=0.6,hidden=True),
 P('signpost','sign5',[4.4,0,1.2],h=1.9,w=1.1,dir=-1,text='?',hidden=True),
 P('phone','ph_seat',[0.0,0.47,-0.95],hidden=True),
])
actors={S:{"at":[1.9,-1.4],"yaw":2.2,"face":"calm"},
 'MAP':{"at":[-1.9,-1.7],"yaw":1.0,"face":"curious","plain":True,"hidden":True},
 'FR1':{"at":[0.75,0.5],"yaw":0.0,"face":"happy","plain":True,"scale":0.3,"y0":2.3,"hidden":True},
 'FR2':{"at":[1.2,0.5],"yaw":math.pi,"face":"happy","plain":False,"scale":0.3,"y0":2.3,"hidden":True},
 'FALL':{"at":[-1.8,0.5],"yaw":-0.3,"face":"surprised","plain":True,"y0":2.4,"hidden":True}}
tl=[]
def a(*x,**k): tl.append(act(*x,**k))
a(0,'mug','tone',0.1,to=1)
# 5a/5b
a(0.2,S,'arms',0.4,left='down',right='down'); a(0.5,S,'look',0.8,at='mug')
a(5.6,S,'nod',0.7); a(6.1,S,'look',0.6,at=None)
a(6.1,S,'walk_to',1.4,to=[1.6,-0.1]); a(7.5,S,'walk_to',1.0,to=FP,face=C)
# 5c sit with timer
a(9.0,S,'sit',1.2); a(9.4,S,'arms',0.6,left='rest',right='rest'); a(9.4,S,'emote',0.8,face='smile')
a(10.8,S,'reach',0.5,pos=[0.1,0.7,-0.2]); a(11.4,'timer','attach',to='SAM.R'); a(11.45,S,'unreach',0.4); a(11.45,S,'arms',0.4,right='hold_front')
# 5d
a(16.2,'timer','prog',0.3,to=0.833); a(16.4,S,'emote',0.8,face='relief'); a(19.2,'spark','appear',0.4); a(20.4,'spark','disappear',0.3); a(19.3,S,'emote',0.5,face='calm')
# 5e
a(21.4,S,'emote',0.6,face='worry'); a(21.6,'think5','appear',0.5); a(22.2,S,'lean',0.9,to=0.30)
# 5f
a(25.5,S,'lean',0.8,to=-0.10); a(25.6,S,'emote',0.6,face='smile'); a(26.0,S,'arms',0.6,left='rest',right='wave_up')
# 5g
a(33.0,S,'arms',0.6,left='rest',right='hold_front'); a(33.3,'think5','disappear',0.4); a(33.4,'wave5','prog',4.0,to=1,ease='linear'); a(33.3,S,'emote',0.7,face='calm')
a(33.2,'wave5','scale',0.001,to=1)
# 5h
a(38.6,'wave5','disappear',0.4); a(38.7,'think5b','appear',0.5); a(39.0,S,'look',0.7,at=[0.4,1.7,0.2]); a(41.5,S,'look',0.7,at=[-1.5,1.8,0.0]); a(43.0,'think5b','disappear',0.4)
# 5i
a(43.8,S,'look',0.7,at='mug'); a(45.0,'np','appear',0.4)
# 5j
a(49.9,S,'look',0.6,at=None); a(50.0,'res2011','appear',0.5); a(52.4,'res2011','disappear',0.4); a(50.1,'np','disappear',0.3)
# 5k
a(53.0,'ph5','attach',to='SAM.R'); a(53.0,S,'arms',0.5,right='hold_front'); a(53.2,S,'emote',0.5,face='focus'); a(53.4,'bigph','appear',0.5)
for i,k in enumerate(['l1','l2','l3','l4']): a(54.0+i*1.0,k,'prog',0.8,to=1,ease='linear')
a(57.8,'bigph','disappear',0.4)
# 5l
a(58.5,'heads','appear',0.5); a(63.8,'heads','disappear',0.4); a(58.6,S,'look',0.7,at=[-0.2,2.3,0.0]); a(58.4,S,'emote',0.6,face='curious')
# 5m
a(64.6,S,'look',0.5,at=None); a(64.5,'MAP','show',0.01); a(64.8,'MAP','arms',0.8,right='open',left='down'); a(65.0,'map5','appear',0.5); a(71.2,'map5','disappear',0.4); a(71.4,'MAP','hide',0.01); a(65.2,S,'look',0.8,at=[-1.9,1.2,-2.8])
# 5n
a(71.8,S,'look',0.6,at=[1.8,2.1,-0.3]); a(72.0,'minibr','appear',0.5); a(72.4,'tab5','appear',0.3); a(74.2,'tab5','scale',1.2,to=0.0); a(75.4,'minibr','disappear',0.5); a(74.8,S,'emote',0.8,face='happy'); a(75.0,S,'look',0.7,at=None)
# 5o
a(77.4,'kind5','appear',0.5); a(77.2,'FR1','show',0.01); a(77.2,'FR2','show',0.01); a(77.6,'FR1','arms',0.01,left='down',right='down'); a(78.0,'FR2','arms',0.8,left='open',right='hold_front'); a(77.6,S,'emote',0.7,face='smile')
a(82.4,'kind5','disappear',0.3); a(82.4,'FR1','hide',0.01); a(82.4,'FR2','hide',0.01)
# 5p
a(83.0,'sp_l','appear',0.45); a(84.6,'sp_r','appear',0.45); a(88.0,'sp_l','disappear',0.4); a(88.0,'sp_r','disappear',0.4); a(83.0,S,'look',0.7,at=[0.0,2.7,0.0])
# 5q
a(88.6,S,'look',0.6,at=[2.4,1.0,0.3]); a(88.8,'bars_q','appear',0.3); a(89.0,'bars_q','prog',3.0,to=1); a(91.5,'heart_q','appear',0.4); a(91.0,'lab_sc','appear',0.2); a(91.0,'lab_sc','prog',2.0,to=1,ease='linear'); a(94.9,'bars_q','disappear',0.4); a(94.9,'heart_q','disappear',0.4); a(94.9,'lab_sc','disappear',0.4)
# 5r
a(95.4,'FALL','show',0.01); a(95.4,'cush','appear',0.3); a(95.4,'FALL','arms',0.01,left='reach_up',right='reach_up'); a(95.5,'FALL','elev',0.9,to=0.22); a(96.5,'FALL','emote',0.4,face='smile'); a(96.5,'FALL','arms',0.5,left='down',right='down')
a(95.4,S,'look',0.6,at=[-1.8,0.8,0.5]); a(98.8,'FALL','hide',0.01); a(98.8,'cush','disappear',0.2)
# 5s
a(99.2,'cush_big','appear',0.5); a(99.6,'cush_small','appear',0.5); a(99.0,S,'look',0.6,at=None); a(99.0,S,'emote',0.7,face='calm')
a(104.4,'cush_big','disappear',0.3); a(104.4,'cush_small','disappear',0.3)
# 5t
a(104.7,'gears','appear',0.5); a(104.8,'g1','prog',4.4,to=6.0,ease='linear'); a(104.8,'g2','prog',4.4,to=6.0,ease='linear')
a(105.3,'oil','appear',0.2); a(105.4,'oil','move',1.1,to=[3.1,1.75,-0.35]); a(106.5,'oil','disappear',0.2); a(107.4,'oil','move',0.001,to=[3.1,2.7,-0.35]); a(107.5,'oil','appear',0.2); a(107.6,'oil','move',1.1,to=[3.1,1.75,-0.35]); a(108.7,'oil','disappear',0.2)
a(108.9,'gears','disappear',0.3); a(104.9,S,'look',0.7,at=[3.1,1.6,-0.5])
# 5u
a(109.6,S,'look',0.5,at=None); a(110.0,S,'arms',0.5,left='shrug',right='shrug'); a(110.0,'timer','prog',0.2,to=1); a(110.2,'timer','alarm',0.2,to=1); a(112.6,'timer','alarm',0.3,to=0)
a(110.0,S,'emote',0.5,face='amused')
# 5v fork
a(117.2,S,'arms',0.4,left='down',right='down'); a(116.8,'timer','detach'); a(116.8,'timer','move',0.001,to=[0.1,0.55,-0.25]); a(116.8,S,'stand_up',1.2)
a(116.5,'fork5','appear',0.6); a(116.6,'dr_blue','appear',0.6); a(116.7,'dr_or','appear',0.6); a(116.8,'sign5','appear',0.6)
a(117.9,S,'walk_to',0.9,to=[1.4,-0.3]); a(118.8,S,'walk_to',1.0,to=[2.4,0.2]); a(119.8,S,'walk_to',1.2,to=[3.2,1.7],face=math.pi/2)
# back to couch
a(121.4,'fork5','disappear',0.5); a(121.4,'dr_blue','disappear',0.5); a(121.4,'dr_or','disappear',0.5); a(121.4,'sign5','disappear',0.5)
a(121.4,S,'walk_to',1.2,to=[2.4,0.2],face='path'); a(122.6,S,'walk_to',1.0,to=[1.4,-0.3]); a(123.6,S,'walk_to',1.0,to=FP,face=C)
a(124.6,S,'sit',1.1); a(125.0,S,'arms',0.6,left='rest',right='rest'); a(124.8,S,'emote',0.7,face='surprised')
a(124.9,'ph_seat','appear',0.01); a(125.0,'timer','move',0.001,to=[0.55,0.2,0.1]); 
a(125.0,'timer','scale',0.01,to=0)
# 5x quiet
a(129.0,S,'emote',1.5,face='calm')
tl.append(cam([
 K(0,[4.6,1.5,0.8],[1.5,1.3,-1.9],34,10),K(2.6,[4.2,1.5,1.4],[1.6,1.3,-1.8],34,10),K(5.1,[3.4,1.5,2.0],[1.5,1.3,-1.4],34,8),
 K(6.5,[2.6,1.5,2.2],[1.3,1.2,-0.8],34,6),K(8.7,[2.4,1.5,3.0],[0.8,1.15,-0.3],34,5),K(10.0,[1.9,1.4,3.4],[0.1,1.15,-0.4],32,8),K(13.0,[1.5,1.35,3.0],[0.1,1.1,-0.4],30,12),K(15.8,[1.2,1.3,2.7],[0.1,1.2,-0.4],30,14),
 K(18.0,[2.0,1.4,3.0],[0.0,1.4,-0.4],32,10),K(20.9,[2.4,1.5,3.6],[0.4,1.5,-0.4],34,8),K(23.0,[2.6,1.5,3.4],[0.5,1.6,-0.5],34,8),K(25.2,[1.4,1.4,3.5],[0.5,1.5,-0.5],34,8),
 K(29.0,[1.6,1.5,3.8],[0.4,1.5,-0.5],34,6),K(33.1,[0.4,1.6,4.6],[0.3,1.8,-0.5],34,4),K(36.0,[0.2,1.8,5.2],[0.1,1.9,-0.5],34,4),K(38.6,[0.6,1.7,5.0],[0.4,1.7,-0.5],34,4),
 K(41.0,[1.4,1.5,4.0],[-0.3,1.5,-0.5],34,6),K(43.4,[0.9,1.4,3.5],[0.3,1.2,-0.4],32,8),K(46.0,[-0.8,1.4,3.0],[1.0,1.3,-2.0],32,10),K(49.7,[0.0,1.45,3.2],[1.2,1.2,-2.2],30,12),
 K(51.2,[-1.8,1.9,3.5],[-1.8,2.0,0],34,10),K(52.8,[-1.0,1.7,3.8],[-0.4,1.8,0],34,8),K(55.0,[3.0,1.5,2.8],[1.0,1.5,-0.4],32,8),K(58.3,[3.4,1.6,3.2],[1.2,1.6,-0.4],32,8),
 K(60.0,[1.2,2.0,3.8],[-0.2,2.1,0],34,6),K(64.6,[0.4,1.9,4.2],[-0.1,2.0,0],34,6),K(67.0,[-0.8,1.5,3.8],[-1.9,1.3,-1.5],34,6),K(71.7,[-0.6,1.5,4.4],[-1.5,1.3,-1.2],34,5),
 K(73.5,[2.4,1.6,3.8],[1.4,1.8,0],32,10),K(77.2,[2.0,1.6,3.2],[1.0,1.6,-0.3],30,14),K(79.5,[1.6,1.7,3.8],[0.9,2.0,0],34,6),K(82.7,[1.2,1.7,4.0],[0.5,1.9,0],34,6),
 K(85.5,[0.8,1.8,4.3],[0.2,2.1,0],34,6),K(88.6,[0.9,1.7,4.2],[0.2,1.9,0],34,6),K(91.5,[3.2,1.4,3.8],[2.4,1.0,0.3],34,6),K(95.4,[2.9,1.4,3.5],[2.2,1.0,0.3],34,6),
 K(97.0,[-0.5,1.4,4.0],[-1.8,1.0,0.5],34,6),K(99.0,[-0.8,1.4,3.6],[-1.7,0.9,0.5],32,8),K(101.5,[0.5,1.6,4.8],[-0.8,0.9,0.4],34,6),K(104.5,[-0.2,1.8,6.0],[-0.5,1.0,0.2],36,4),
 K(106.5,[3.6,1.6,3.6],[2.6,1.4,-0.5],32,8),K(109.3,[3.4,1.6,3.8],[2.5,1.5,-0.5],32,8),K(112.5,[1.4,1.4,3.5],[0.6,1.0,-0.3],32,10),K(116.4,[2.0,1.5,4.4],[1.0,1.1,-0.2],34,6),
 K(118.5,[4.8,1.6,4.6],[3.2,1.2,0.2],34,6),K(121.2,[4.2,1.6,4.2],[3.0,1.1,0.0],34,6),K(124.0,[1.4,1.4,3.4],[0.1,1.15,-0.4],30,12),K(127.1,[1.8,1.5,3.8],[0.2,1.2,-0.4],32,8),
 K(130.0,[2.0,1.8,6.5],[0.8,1.3,-0.8],36,4),K(132.6,[1.6,1.9,8.0],[0.8,1.4,-0.8],38,0)]))
write('s5',END,props,actors,tl,captions('5a','5x',T0),fade_in=0.4,fade_out=0.4)
