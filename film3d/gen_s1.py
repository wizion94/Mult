from genlib import *
C=-0.6
props=room([
 P('couch','couch',[0,-0.5],yaw=C),
 P('tv','tv',[5.2,2.5],yaw=C+math.pi),
 P('counter','counter',[0.9,0,-2.62],sink=True,sinkX=-0.55),
 P('mug','mug',[1.0,0.95,-2.62],alarm=True,shake='rot',rayY=0.42),
 P('side_table','table',[1.7,0.95]),
 P('phone','phone',[1.7,0.6,0.95],alarm=True,shake='buzz',rayY=0.35),
 P('door','door',[3.3,0,-2.97]),
 P('box','box',[3.3,0,-2.45],alarm=True,shake='hop',rayY=0.55),
 P('clock','clock',[-2.4,2.1,-2.96],time='9:40'),
 P('remote','remote',[-0.07,0.47,-0.185],yaw=C+0.4,holdOff=[0,0,0]),
 P('cloud','cloud',[0,0,0],hidden=True,follow={"at":"SAM.head","off":[0,0.55,0]}),
 P('group','diagram',[0.62,2.45,-0.08],hidden=True,children=[
   P('label',None,[-1.05,0,0],text='?',size=1.0,color='#7fa8d8',reveal=False),
   P('arrow',None,[-0.5,0,0],len=1.0),
   P('bulb',None,[1.15,0,0])])
])
T=[]
S='SAM'
T+= [act(0,S,'emote',face='happy'),
 act(0.3,S,'arms',0.9,right='wave_up',left='down'), act(0.8,S,'look',1.0,at='clock'),
 act(2.4,S,'look',0.8,at=None), act(2.6,S,'arms',0.8,right='point_up',left='open'), act(4.3,S,'arms',0.6,right='down',left='down'),
 act(4.8,S,'walk_to',2.4,to=[1.0,1.7]), act(7.2,S,'walk_to',1.6,to=[1.15,-0.25]), act(8.6,S,'turn',1.0,yaw=C),
 act(9.4,S,'walk_to',0.5,to=[0.62,-0.08],face=C), act(7.0,S,'emote',0.8,face='calm'),
 act(10.1,S,'sit',1.2), act(10.3,S,'arms',0.7,left='rest',right='rest'),
 act(11.0,S,'reach',0.5,at='remote'), act(11.5,'remote','attach',to='SAM.R'), act(11.52,S,'unreach',0.4), act(11.52,S,'arms',0.4,right='hold_front'),
 act(12.2,'mug','alarm',0.5,to=1), act(12.1,S,'emote',0.5,face='worry'), act(12.4,S,'look',0.8,at='mug'),
 act(17.4,'mug','alarm',0.8,to=0.5), act(17.5,'phone','alarm',0.4,to=1), act(17.8,S,'look',0.7,at='phone'),
 act(19.3,'box','alarm',0.4,to=1), act(19.5,S,'look',0.8,at='box'),
 act(22.3,'mug','alarm',0.8,to=0), act(22.3,'phone','alarm',0.8,to=0), act(22.3,'box','alarm',0.8,to=0),
 act(22.3,S,'emote',0.6,face='guilty'), act(22.4,S,'look',0.7,at=None), act(22.4,S,'slump',1.5,to=1), act(22.5,S,'arms',1.0,left='limp',right='limp'),
 act(23.0,'cloud','appear',1.8,to=0.8), act(27.6,'cloud','disappear',0.9),
 act(27.9,S,'reach',0.35,pos=[-0.07,0.47,-0.185]), act(28.25,'remote','detach'), act(28.3,S,'unreach',0.3), act(28.3,S,'arms',0.3,right='rest'),
 act(27.9,S,'emote',0.8,face='curious'), act(27.9,S,'slump',0.8,to=0), act(28.7,S,'stand_up',1.2),
 act(28.6,'diagram','appear',0.9), act(29.9,S,'look',0.9,at='diagram'), act(30.3,S,'arms',0.9,right='point_up',left='down'),
 cam([K(0,[-0.2,1.5,6.2],[0,1,0]),K(5,[0.6,1.5,6.0],[0.7,1,0.2]),K(9,[1.9,1.4,4.9],[0.7,0.95,-0.1],32,6),K(11.8,[1.7,1.25,3.8],[0.2,0.95,-0.3],32,10),
  K(13.5,[1.3,1.3,3.9],[0.7,1.1,-1.0],30,12),K(16.5,[1.5,1.3,4.3],[0.8,1.1,-1.2],30,10),K(18.5,[2.4,1.6,5.0],[1.4,0.95,-0.6],36,4),K(21.5,[2.6,1.6,5.2],[1.5,0.95,-0.6],36,4),
  K(24.5,[2.3,1.3,4.0],[0.3,0.95,-0.2],32,10),K(27.4,[1.9,1.2,2.4],[0.0,1.1,-0.5],30,18),K(29.5,[1.2,1.4,5.0],[0.7,1.3,-0.2],34,6),K(32.6,[1.0,1.5,5.8],[0.7,1.4,-0.2],34,0),K(33.55,[1.0,1.3,0.2],[1.0,1.0,-2.62],30,4),K(34.0,[1.05,1.12,-2.1],[1.0,1.0,-2.62],24,14)])]
write('s1',34,props,{"SAM":{"at":[-1.4,0.9],"yaw":-0.5,"face":"happy"}},T,captions('1a','1f',0))
